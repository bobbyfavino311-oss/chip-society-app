import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';

export type Rank =
  | 'LOCAL'
  | 'PLAYER'
  | 'HIGH ROLLER'
  | 'VIP'
  | 'EXECUTIVE'
  | 'KINGPIN'
  | 'CARTEL'
  | 'SYNDICATE'
  | 'EMPIRE'
  | 'DYNASTY'
  | 'LEGEND'
  | 'IMMORTAL'
  | 'VICE ROYALTY'
  | 'CHIP SOCIETY ELITE';

export type AccountType = 'registered';

export type CookieTier = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';

const COOKIE_INV_FIELD: Record<CookieTier, keyof UserProfile> = {
  common:    'commonCookies',
  rare:      'rareCookies',
  epic:      'epicCookies',
  legendary: 'legendaryCookies',
  mythic:    'mythicCookies',
};
const COOKIE_STAT_FIELD: Record<CookieTier, keyof UserProfile> = {
  common:    'commonCookiesOpened',
  rare:      'rareCookiesOpened',
  epic:      'epicCookiesOpened',
  legendary: 'legendaryCookiesOpened',
  mythic:    'mythicCookiesOpened',
};

// ── Progression system — aggressive exponential XP curve ─────────────────────
// Each entry is [level, cumulative XP needed to REACH that level].
// Level 1 = 0 XP (everyone starts here).
const XP_MILESTONES: [number, number][] = [
  [1,    0],
  [10,   10_000],
  [25,   100_000],
  [50,   1_000_000],
  [100,  10_000_000],
  [250,  100_000_000],
  [500,  500_000_000],
  [750,  1_500_000_000],
  [1000, 5_000_000_000],
  [1500, 15_000_000_000],
  [2000, 50_000_000_000],
  [3000, 150_000_000_000],
  [4000, 350_000_000_000],
  [5000, 1_000_000_000_000],
];

// Cumulative XP required to START a given level (log-interpolated between milestones)
export function getXPForLevel(level: number): number {
  const L = Math.min(Math.max(level, 1), 5000);
  for (let i = 1; i < XP_MILESTONES.length; i++) {
    const [l0, xp0] = XP_MILESTONES[i - 1];
    const [l1, xp1] = XP_MILESTONES[i];
    if (L <= l1) {
      if (xp0 === 0) return Math.round((xp1 * (L - l0)) / (l1 - l0));
      const t = (L - l0) / (l1 - l0);
      return Math.round(Math.exp(Math.log(xp0) + t * (Math.log(xp1) - Math.log(xp0))));
    }
  }
  return 1_000_000_000_000;
}

function getLevelFromXP(xp: number): number {
  if (xp <= 0) return 1;
  let lo = 0, hi = XP_MILESTONES.length - 1;
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    if (XP_MILESTONES[mid][1] <= xp) lo = mid; else hi = mid;
  }
  const [l0, xp0] = XP_MILESTONES[lo];
  const [l1, xp1] = XP_MILESTONES[hi];
  if (xp >= xp1) return l1;
  const t = xp0 === 0
    ? xp / xp1
    : (Math.log(xp) - Math.log(xp0)) / (Math.log(xp1) - Math.log(xp0));
  return Math.min(5000, Math.max(1, Math.floor(l0 + t * (l1 - l0))));
}

const LEVEL_RANKS: { rank: Rank; minLevel: number }[] = [
  { rank: 'LOCAL',              minLevel: 1    },
  { rank: 'PLAYER',             minLevel: 50   },
  { rank: 'HIGH ROLLER',        minLevel: 100  },
  { rank: 'VIP',                minLevel: 200  },
  { rank: 'EXECUTIVE',          minLevel: 350  },
  { rank: 'KINGPIN',            minLevel: 500  },
  { rank: 'CARTEL',             minLevel: 750  },
  { rank: 'SYNDICATE',          minLevel: 1000 },
  { rank: 'EMPIRE',             minLevel: 1250 },
  { rank: 'DYNASTY',            minLevel: 1500 },
  { rank: 'LEGEND',             minLevel: 2000 },
  { rank: 'IMMORTAL',           minLevel: 2500 },
  { rank: 'VICE ROYALTY',       minLevel: 3000 },
  { rank: 'CHIP SOCIETY ELITE', minLevel: 4000 },
];

function getRankFromLevel(level: number): Rank {
  let rank: Rank = 'LOCAL';
  for (const r of LEVEL_RANKS) { if (level >= r.minLevel) rank = r.rank; }
  return rank;
}

const DAILY_REWARDS: Record<number, number> = {
  1:  5_000, 2: 10_000, 3: 15_000, 4: 20_000, 5: 25_000, 6: 30_000, 7: 35_000,
};
const DEFAULT_DAILY_REWARD  = 35_000;
const HOURLY_BONUS          = 5_000;
const HOURLY_INTERVAL_MS    = 24 * 60 * 60 * 1000;
const COMEBACK_THRESHOLD    = 500;
const COMEBACK_BONUS        = 20_000;
const REGISTERED_CHIPS      = 50_000;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserProfile {
  playerId?: string;
  username: string;
  email: string;
  chips: number;
  xp: number;
  rank: Rank;
  level: number;
  wins: number;
  losses: number;
  handsPlayed: number;
  avatarIndex: number;
  avatarUri?: string;
  profileImageType?: 'character' | 'custom' | 'symbol';
  symbolIndex?: number;
  lastDailyReward: string | null;
  lastHourlyBonus: string | null;
  streakDays: number;
  dailyMissionsCompleted: number;
  isNewUser: boolean;
  isGuest?: false;
  accountType: AccountType;
  vipMember: boolean;
  rankedPoints: number;
  lastWheelSpin: string | null;
  scratchTickets: number;
  lastFreeScratch: string | null;
  createdAt: string;
  tutorialCompleted: boolean;
  isFounder?: boolean;
  // Fortune Cookie inventory — 5 tiers (Uncommon removed)
  commonCookies: number;
  rareCookies: number;
  epicCookies: number;
  legendaryCookies: number;
  mythicCookies: number;
  lastFreeCookie: string | null;
  cookiesOpened: number;
  // Per-tier opened stats
  commonCookiesOpened: number;
  rareCookiesOpened: number;
  epicCookiesOpened: number;
  legendaryCookiesOpened: number;
  mythicCookiesOpened: number;
  // Tournament stats
  tournamentWins: number;
  tournamentLosses: number;
  bestTournamentFinish: number;
  biggestTournamentPrize: number;
  // Omaha stats
  omahaHandsPlayed: number;
  omahaWins: number;
  omahaLosses: number;
  omahaBiggestPot: number;
}


const DEFAULT_PROFILE: UserProfile = {
  username: 'CS_Player',
  email: '',
  chips: REGISTERED_CHIPS,
  xp: 0,
  rank: 'LOCAL',
  level: 1,
  wins: 0,
  losses: 0,
  handsPlayed: 0,
  avatarIndex: 0,
  profileImageType: 'symbol' as const,
  symbolIndex: 1,
  lastDailyReward: null,
  lastHourlyBonus: null,
  streakDays: 0,
  dailyMissionsCompleted: 0,
  isNewUser: true,
  accountType: 'registered',
  vipMember: false,
  rankedPoints: 0,
  lastWheelSpin: null,
  scratchTickets: 1,
  lastFreeScratch: null,
  createdAt: new Date().toISOString(),
  tutorialCompleted: false,
  commonCookies: 3,
  rareCookies: 0,
  epicCookies: 0,
  legendaryCookies: 0,
  mythicCookies: 0,
  lastFreeCookie: null,
  cookiesOpened: 0,
  commonCookiesOpened: 0,
  rareCookiesOpened: 0,
  epicCookiesOpened: 0,
  legendaryCookiesOpened: 0,
  mythicCookiesOpened: 0,
  tournamentWins: 0,
  tournamentLosses: 0,
  bestTournamentFinish: 0,
  biggestTournamentPrize: 0,
  omahaHandsPlayed: 0,
  omahaWins: 0,
  omahaLosses: 0,
  omahaBiggestPot: 0,
};

// ─── Context ──────────────────────────────────────────────────────────────────

interface UserContextValue {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  addChips: (amount: number) => Promise<void>;
  removeChips: (amount: number) => Promise<void>;
  recordWin: (chipsWon: number) => Promise<void>;
  recordLoss: () => Promise<void>;
  recordTournamentResult: (placement: number, prizeWon: number, isWin: boolean) => Promise<void>;
  claimDailyReward: () => Promise<number>;
  claimHourlyBonus: () => Promise<number>;
  claimComebackBonus: () => Promise<number>;
  completeOnboarding: () => Promise<void>;
  awardRankedPoints: (delta: number) => Promise<void>;
  claimWheelSpin: (chips: number, tickets: number) => Promise<void>;
  useScratchTicket: () => Promise<boolean>;
  consumeScratchTickets: (n: number) => Promise<void>;
  addScratchTickets: (n: number) => Promise<void>;
  completeTutorial: () => Promise<void>;
  registerAccount: (username: string, pin: string, email: string, avatarIndex: number) => Promise<{ success: boolean; error?: string }>;
  signIn: (username: string, pin: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  changePin: (oldPin: string, newPin: string) => Promise<{ success: boolean; error?: string }>;
  forgotPin: (username: string, email: string, newPin: string) => Promise<{ success: boolean; error?: string }>;
  checkUsernameAvailable: (username: string) => Promise<boolean>;
  canClaimWheel: boolean;
  nextWheelIn: number;
  canClaimFreeScratch: boolean;
  winRate: number;
  isLoaded: boolean;
  canClaimDaily: boolean;
  canClaimHourly: boolean;
  nextHourlyIn: number;
  dailyRewardAmount: number;
  nextDailyIn: number;
  canClaimFreeCookie: boolean;
  nextCookieIn: number;
  addXP: (amount: number) => Promise<void>;
  consumeFortuneCookie: (tier: CookieTier) => Promise<boolean>;
  addFortuneCookies: (common?: number, rare?: number, epic?: number, legendary?: number, mythic?: number) => Promise<void>;
  claimFreeCookie: () => Promise<CookieTier | false>;
  pendingBonuses: PendingBonus[];
  dismissBonus: (notificationId: string) => void;
  pendingModeration: PendingModeration | null;
  dismissModeration: () => void;
  unreadDmCount: number;
  clearDmUnread: () => void;
  onDmReceived: (cb: (msg: DmReceivedPayload) => void) => () => void;
}

export interface DmReceivedPayload {
  messageId: string;
  conversationId: string;
  senderId: string;
  senderUsername: string;
  text: string;
  createdAt: string;
}

export interface PendingBonus {
  notificationId: string;
  amount: number;
  reason: string;
  message?: string | null;
  createdAt: string;
}

export interface PendingModeration {
  type: 'warning' | 'suspension' | 'ban';
  reason: string;
  message?: string | null;
  expiresAt?: string | null;
  actionId: string;
}

const UserContext = createContext<UserContextValue | null>(null);

const STORAGE_KEY       = '@chip_society_profile';
const LOCAL_CREDS_KEY   = '@chip_society_local_creds';
const LEGACY_KEY   = '@neon_river_profile';

// ─── Notification socket URL ──────────────────────────────────────────────────
// Always connect directly to the Railway production server — this is the same
// server instance that receives admin bonus requests via POST /api/admin/players/:id/bonus,
// so emitToPlayer() fires on the correct Socket.IO registry whether the player
// is on iOS, Android, or the web preview. CORS is open (*) on Railway.
function getNotificationSocketUrl(): string {
  return 'https://api-server-production-bbc2.up.railway.app';
}

// ─── API base URL ─────────────────────────────────────────────────────────────
// Always talk to the Railway production server — this is the single source of
// truth for all player accounts, chip balances, and notifications.
// The admin panel also points here so bonus pushes arrive on the same server
// instance that holds the Socket.IO registry.
export function getApiBase(): string {
  return 'https://api-server-production-bbc2.up.railway.app/api';
}

// ─── Server API helpers ───────────────────────────────────────────────────────

// Throws on network failure OR server error — callers decide how to surface it.
// IMPORTANT: never return false on a server error; that would silently report
// every username as "taken" when the backend is unreachable or returns 5xx.
async function serverCheckUsername(username: string): Promise<boolean> {
  const r = await fetch(`${getApiBase()}/auth/check-username/${encodeURIComponent(username)}`);
  if (!r.ok) throw new Error(`Server error: ${r.status}`);
  const d = await r.json() as { available: boolean };
  return d.available;
}

async function serverRegister(
  username: string, pin: string, email: string,
  avatarIndex: number, profile: UserProfile,
): Promise<{ success: boolean; playerId?: string; error?: string; isNetworkError?: boolean }> {
  try {
    const r = await fetch(`${getApiBase()}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, pin, email, avatarIndex, profile }),
    });
    const d = await r.json() as { success?: boolean; playerId?: string; error?: string };
    if (!r.ok) return { success: false, error: d.error ?? 'Registration failed.' };
    return { success: true, playerId: d.playerId };
  } catch {
    return { success: false, error: 'Could not reach server.', isNetworkError: true };
  }
}

async function serverLogin(
  username: string, pin: string,
): Promise<{ success: boolean; profile?: UserProfile; error?: string; isNetworkError?: boolean; isBanned?: boolean; isSuspended?: boolean; banReason?: string; suspensionExpiresAt?: string }> {
  try {
    const r = await fetch(`${getApiBase()}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, pin }),
    });
    const d = await r.json() as { success?: boolean; profile?: UserProfile; error?: string; reason?: string; expiresAt?: string };
    if (r.status === 403 && d.error === 'ACCOUNT_BANNED') {
      return { success: false, error: 'ACCOUNT_BANNED', isBanned: true, banReason: d.reason };
    }
    if (r.status === 403 && d.error === 'ACCOUNT_SUSPENDED') {
      return { success: false, error: 'ACCOUNT_SUSPENDED', isSuspended: true, banReason: d.reason, suspensionExpiresAt: d.expiresAt };
    }
    if (!r.ok) return { success: false, error: d.error ?? 'Login failed.' };
    return { success: true, profile: d.profile };
  } catch {
    return { success: false, error: 'Could not reach server.', isNetworkError: true };
  }
}

async function serverSaveProfile(playerId: string, profile: UserProfile): Promise<void> {
  try {
    await fetch(`${getApiBase()}/auth/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId, profile }),
    });
  } catch { /* silent — local cache still has data */ }
}

async function serverChangePin(playerId: string, oldPin: string, newPin: string): Promise<{ success: boolean; error?: string }> {
  try {
    const r = await fetch(`${getApiBase()}/auth/change-pin`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId, oldPin, newPin }),
    });
    const d = await r.json() as { success?: boolean; error?: string };
    if (!r.ok) return { success: false, error: d.error ?? 'Failed to change PIN.' };
    return { success: true };
  } catch {
    return { success: false, error: 'Could not reach server.' };
  }
}

async function serverForgotPin(username: string, email: string, newPin: string): Promise<{ success: boolean; error?: string }> {
  try {
    const r = await fetch(`${getApiBase()}/auth/forgot-pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, newPin }),
    });
    const d = await r.json() as { success?: boolean; error?: string };
    if (!r.ok) return { success: false, error: d.error ?? 'Failed to reset PIN.' };
    return { success: true };
  } catch {
    return { success: false, error: 'Could not reach server.' };
  }
}

// ─── Profile backfill (merge saved fields onto defaults) ──────────────────────
function backfillProfile(base: UserProfile, saved: Partial<UserProfile>): UserProfile {
  return {
    ...base,
    ...saved,
    chips: saved.chips ?? 0,
    accountType: 'registered',
    email: saved.email ?? '',
    createdAt: saved.createdAt ?? new Date().toISOString(),
    tutorialCompleted: saved.tutorialCompleted ?? false,
    profileImageType: saved.profileImageType ?? (saved.avatarUri ? 'custom' : 'symbol'),
    symbolIndex: saved.symbolIndex ?? 0,
    tournamentWins: saved.tournamentWins ?? 0,
    tournamentLosses: saved.tournamentLosses ?? 0,
    bestTournamentFinish: saved.bestTournamentFinish ?? 0,
    biggestTournamentPrize: saved.biggestTournamentPrize ?? 0,
    // Uncommon cookies removed — migrate any existing to common
    commonCookies:    (saved.commonCookies ?? (saved as any).fortuneCookies ?? 0) + ((saved as any).uncommonCookies ?? (saved as any).goldenCookies ?? 0),
    rareCookies:      saved.rareCookies      ?? (saved as any).dragonCookies  ?? 0,
    epicCookies:      saved.epicCookies      ?? 0,
    legendaryCookies: saved.legendaryCookies ?? 0,
    mythicCookies:    saved.mythicCookies    ?? 0,
    commonCookiesOpened:    (saved.commonCookiesOpened ?? 0) + ((saved as any).uncommonCookiesOpened ?? 0),
    rareCookiesOpened:      saved.rareCookiesOpened      ?? 0,
    epicCookiesOpened:      saved.epicCookiesOpened      ?? 0,
    legendaryCookiesOpened: saved.legendaryCookiesOpened ?? 0,
    mythicCookiesOpened:    saved.mythicCookiesOpened    ?? 0,
  };
}

const PROFANITY_LIST = ['fuck', 'shit', 'ass', 'bitch', 'dick', 'cunt', 'nigger', 'faggot'];
function hasProfanity(s: string): boolean {
  const lower = s.toLowerCase();
  return PROFANITY_LIST.some(w => lower.includes(w));
}

const RESERVED_NAMES = ['admin', 'chipsociety', 'moderator', 'support', 'official', 'staff'];
function isReserved(s: string): boolean {
  return RESERVED_NAMES.some(r => s.toLowerCase() === r);
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [isLoaded, setIsLoaded] = useState(false);
  const [now, setNow] = useState(Date.now());
  const syncTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pendingBonuses, setPendingBonuses] = useState<PendingBonus[]>([]);
  const [pendingModeration, setPendingModeration] = useState<PendingModeration | null>(null);
  const checkedBonusIds = React.useRef<Set<string>>(new Set());
  const notifSocketRef = useRef<Socket | null>(null);
  const [unreadDmCount, setUnreadDmCount] = useState(0);
  const dmListenersRef = useRef<Set<(msg: DmReceivedPayload) => void>>(new Set());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    (async () => {
      // 1. Load local cache instantly for snappy UI
      let data = await AsyncStorage.getItem(STORAGE_KEY);
      if (!data) data = await AsyncStorage.getItem(LEGACY_KEY);
      if (data) {
        try {
          const saved = JSON.parse(data) as Partial<UserProfile>;
          setProfile(p => backfillProfile(p, saved));
        } catch {}
      }
      setIsLoaded(true);
    })();
  }, []);

  // Debounced server sync — fires 3 s after the last save() call.
  // For critical one-time events (tutorial completion) we bypass the debounce and save immediately.
  const scheduleSyncToServer = useCallback((updated: UserProfile) => {
    if (!updated.playerId || updated.username === DEFAULT_PROFILE.username) return;
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    // tutorialCompleted transitioning to true is a once-in-a-lifetime event —
    // save immediately so it can never be lost to a premature app close.
    if (updated.tutorialCompleted) {
      void serverSaveProfile(updated.playerId, updated);
      return;
    }
    syncTimerRef.current = setTimeout(() => {
      void serverSaveProfile(updated.playerId!, updated);
    }, 3_000);
  }, []);

  const save = useCallback(async (updated: UserProfile) => {
    // Always write to local cache immediately (fast / offline-safe)
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    // Queue a server sync so data survives republishes
    scheduleSyncToServer(updated);
  }, [scheduleSyncToServer]);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    setProfile(prev => {
      const next = { ...prev, ...updates };
      const level = getLevelFromXP(next.xp);
      const rank  = getRankFromLevel(level);
      const final = { ...next, rank, level };
      save(final);
      return final;
    });
  }, [save]);

  const addChips = useCallback(async (amount: number) => {
    setProfile(prev => {
      const next = { ...prev, chips: prev.chips + amount };
      save(next);
      return next;
    });
  }, [save]);

  const removeChips = useCallback(async (amount: number) => {
    setProfile(prev => {
      const next = { ...prev, chips: Math.max(0, prev.chips - amount) };
      save(next);
      return next;
    });
  }, [save]);

  const recordWin = useCallback(async (chipsWon: number) => {
    setProfile(prev => {
      const xpGain = 500 + Math.min(500, Math.floor(chipsWon / 200));
      const next = {
        ...prev, wins: prev.wins + 1, handsPlayed: prev.handsPlayed + 1,
        chips: prev.chips + chipsWon, xp: prev.xp + xpGain,
      };
      next.level = getLevelFromXP(next.xp);
      next.rank  = getRankFromLevel(next.level);
      save(next);
      return next;
    });
  }, [save]);

  const recordLoss = useCallback(async () => {
    setProfile(prev => {
      const next = { ...prev, losses: prev.losses + 1, handsPlayed: prev.handsPlayed + 1, xp: prev.xp + 150 };
      next.level = getLevelFromXP(next.xp);
      next.rank  = getRankFromLevel(next.level);
      save(next);
      return next;
    });
  }, [save]);

  const recordTournamentResult = useCallback(async (placement: number, prizeWon: number, isWin: boolean) => {
    setProfile(prev => {
      const next = {
        ...prev,
        tournamentWins:   isWin ? prev.tournamentWins + 1 : prev.tournamentWins,
        tournamentLosses: !isWin ? prev.tournamentLosses + 1 : prev.tournamentLosses,
        bestTournamentFinish: prev.bestTournamentFinish === 0
          ? placement
          : Math.min(prev.bestTournamentFinish, placement),
        biggestTournamentPrize: Math.max(prev.biggestTournamentPrize, prizeWon),
      };
      save(next);
      return next;
    });
  }, [save]);

  const claimDailyReward = useCallback(async (): Promise<number> => {
    const today = new Date().toDateString();
    if (profile.lastDailyReward === today) return 0;
    const yesterday  = new Date(Date.now() - 86_400_000).toDateString();
    const isStreak   = profile.lastDailyReward === yesterday;
    const newStreak  = isStreak ? profile.streakDays + 1 : 1;
    const reward     = DAILY_REWARDS[Math.min(newStreak, 7)] ?? DEFAULT_DAILY_REWARD;
    const vipBonus   = profile.vipMember ? Math.floor(reward * 0.5) : 0;
    const total      = reward + vipBonus;
    await updateProfile({ chips: profile.chips + total, lastDailyReward: today, streakDays: newStreak });
    return total;
  }, [profile, updateProfile]);

  const claimHourlyBonus = useCallback(async (): Promise<number> => {
    if (profile.lastHourlyBonus) {
      const last = new Date(profile.lastHourlyBonus).getTime();
      if (last > Date.now() - HOURLY_INTERVAL_MS) return 0;
    }
    await updateProfile({ chips: profile.chips + HOURLY_BONUS, lastHourlyBonus: new Date().toISOString() });
    return HOURLY_BONUS;
  }, [profile, updateProfile]);

  const claimComebackBonus = useCallback(async (): Promise<number> => {
    if (profile.chips >= COMEBACK_THRESHOLD) return 0;
    await updateProfile({ chips: COMEBACK_BONUS });
    return COMEBACK_BONUS;
  }, [profile, updateProfile]);

  const completeOnboarding = useCallback(async () => {
    await updateProfile({ isNewUser: false });
  }, [updateProfile]);

  const awardRankedPoints = useCallback(async (delta: number) => {
    setProfile(prev => {
      const next = { ...prev, rankedPoints: Math.max(0, prev.rankedPoints + delta) };
      save(next);
      return next;
    });
  }, [save]);

  const claimWheelSpin = useCallback(async (chips: number, tickets: number) => {
    setProfile(prev => {
      const next = { ...prev, chips: prev.chips + chips, scratchTickets: prev.scratchTickets + tickets, lastWheelSpin: new Date().toISOString() };
      save(next);
      return next;
    });
  }, [save]);

  const useScratchTicket = useCallback(async (): Promise<boolean> => {
    if (profile.scratchTickets <= 0) return false;
    await updateProfile({ scratchTickets: profile.scratchTickets - 1 });
    return true;
  }, [profile, updateProfile]);

  const consumeScratchTickets = useCallback(async (n: number) => {
    await updateProfile({ scratchTickets: Math.max(0, profile.scratchTickets - n) });
  }, [profile, updateProfile]);

  const addScratchTickets = useCallback(async (n: number) => {
    await updateProfile({ scratchTickets: profile.scratchTickets + n });
  }, [profile, updateProfile]);

  const addXP = useCallback(async (amount: number) => {
    const newXP   = profile.xp + amount;
    const newLevel = getLevelFromXP(newXP);
    await updateProfile({ xp: newXP, level: newLevel, rank: getRankFromLevel(newLevel) });
  }, [profile, updateProfile]);

  const consumeFortuneCookie = useCallback(async (tier: CookieTier): Promise<boolean> => {
    const invKey  = COOKIE_INV_FIELD[tier];
    const statKey = COOKIE_STAT_FIELD[tier];
    if ((profile[invKey] as number) <= 0) return false;
    await updateProfile({
      [invKey]:  (profile[invKey]  as number) - 1,
      [statKey]: (profile[statKey] as number) + 1,
      cookiesOpened: profile.cookiesOpened + 1,
    });
    return true;
  }, [profile, updateProfile]);

  const addFortuneCookies = useCallback(async (
    common = 0, rare = 0, epic = 0, legendary = 0, mythic = 0,
  ) => {
    await updateProfile({
      commonCookies:    profile.commonCookies    + common,
      rareCookies:      profile.rareCookies      + rare,
      epicCookies:      profile.epicCookies      + epic,
      legendaryCookies: profile.legendaryCookies + legendary,
      mythicCookies:    profile.mythicCookies    + mythic,
    });
  }, [profile, updateProfile]);

  const claimFreeCookie = useCallback(async (): Promise<CookieTier | false> => {
    const lastClaim = profile.lastFreeCookie
      ? new Date(profile.lastFreeCookie).toDateString()
      : null;
    if (lastClaim === new Date().toDateString()) return false;
    // Daily cookie: weighted random by drop rate (75/15/7/2.5/0.5)
    const r = Math.random();
    const tier: CookieTier =
      r < 0.750 ? 'common' :
      r < 0.900 ? 'rare' :
      r < 0.970 ? 'epic' :
      r < 0.995 ? 'legendary' :
      'mythic';
    const invKey = COOKIE_INV_FIELD[tier];
    await updateProfile({
      [invKey]: (profile[invKey] as number) + 1,
      lastFreeCookie: new Date().toISOString(),
    });
    return tier;
  }, [profile, updateProfile]);

  const completeTutorial = useCallback(async () => {
    await updateProfile({ tutorialCompleted: true });
  }, [updateProfile]);

  // ── Auth functions ────────────────────────────────────────────────────────────

  const checkUsernameAvailable = useCallback(async (username: string): Promise<boolean> => {
    try {
      return await serverCheckUsername(username);
    } catch {
      // Server unreachable — format already validated by caller; assume available.
      return true;
    }
  }, []);

  const registerAccount = useCallback(async (
    username: string,
    pin: string,
    email: string,
    avatarIndex: number,
  ): Promise<{ success: boolean; error?: string }> => {
    if (username.length < 3) return { success: false, error: 'Username must be at least 3 characters.' };
    if (username.length > 20) return { success: false, error: 'Username must be under 20 characters.' };
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return { success: false, error: 'Only letters, numbers, and underscores.' };
    if (hasProfanity(username)) return { success: false, error: 'That username is not allowed.' };
    if (isReserved(username)) return { success: false, error: 'That username is reserved.' };
    if (!/^\d{4}$/.test(pin)) return { success: false, error: 'PIN must be exactly 4 digits.' };

    const now2 = new Date().toISOString();
    const newProfile: UserProfile = {
      ...DEFAULT_PROFILE,
      username,
      email,
      avatarIndex,
      symbolIndex: avatarIndex,
      profileImageType: 'symbol',
      chips: REGISTERED_CHIPS,
      accountType: 'registered',
      isNewUser: false,
      createdAt: now2,
    };

    // Try server registration first; fall back to local-only if offline.
    const res = await serverRegister(username, pin, email, avatarIndex, newProfile);
    if (!res.success) {
      if (res.isNetworkError) {
        // Server unreachable — create account locally so the user can play immediately.
        const localPlayerId = `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const fullProfile: UserProfile = { ...newProfile, playerId: localPlayerId };
        setProfile(fullProfile);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(fullProfile));
        // Store credentials so local sign-in works offline too.
        await AsyncStorage.setItem(LOCAL_CREDS_KEY, JSON.stringify({ username: username.toLowerCase(), pin, playerId: localPlayerId }));
        return { success: true };
      }
      return { success: false, error: res.error };
    }

    const fullProfile: UserProfile = { ...newProfile, playerId: res.playerId };
    setProfile(fullProfile);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(fullProfile));
    // Also store local creds so sign-in works offline.
    await AsyncStorage.setItem(LOCAL_CREDS_KEY, JSON.stringify({ username: username.toLowerCase(), pin, playerId: res.playerId }));
    return { success: true };
  }, []);

  const signIn = useCallback(async (username: string, pin: string): Promise<{ success: boolean; error?: string }> => {
    const res = await serverLogin(username, pin);
    if (!res.success) {
      if (res.isBanned) {
        return { success: false, error: `ACCOUNT_BANNED::${res.banReason ?? 'Community violation'}` };
      }
      if (res.isSuspended) {
        const exp = res.suspensionExpiresAt ? `::${res.suspensionExpiresAt}` : '';
        return { success: false, error: `ACCOUNT_SUSPENDED::${res.banReason ?? 'Policy violation'}${exp}` };
      }
      if (res.isNetworkError) {
        // Server offline — verify against locally stored credentials.
        try {
          // Primary: check LOCAL_CREDS_KEY (saved since offline-auth was added).
          const localCredsStr = await AsyncStorage.getItem(LOCAL_CREDS_KEY);
          if (localCredsStr) {
            const localCreds = JSON.parse(localCredsStr) as { username: string; pin: string };
            if (localCreds.username === username.toLowerCase() && localCreds.pin === pin) {
              const savedStr = await AsyncStorage.getItem(STORAGE_KEY);
              if (savedStr) {
                const restored = backfillProfile(DEFAULT_PROFILE, { ...JSON.parse(savedStr) as UserProfile, isNewUser: false });
                setProfile(restored);
                await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(restored));
                // Back-fill LOCAL_CREDS_KEY with plain PIN so future sign-ins work.
                await AsyncStorage.setItem(LOCAL_CREDS_KEY, JSON.stringify({ username: username.toLowerCase(), pin, playerId: localCreds.username }));
                return { success: true };
              }
            }
            return { success: false, error: 'Incorrect username or PIN.' };
          }

          // Fallback: account was created before LOCAL_CREDS_KEY existed.
          // Restore from the saved profile if the username matches.
          const savedStr = await AsyncStorage.getItem(STORAGE_KEY);
          if (savedStr) {
            const saved = JSON.parse(savedStr) as UserProfile;
            if (saved.username?.toLowerCase() === username.toLowerCase() && saved.accountType === 'registered') {
              const restored = backfillProfile(DEFAULT_PROFILE, { ...saved, isNewUser: false });
              setProfile(restored);
              await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(restored));
              await AsyncStorage.setItem(LOCAL_CREDS_KEY, JSON.stringify({ username: username.toLowerCase(), pin, playerId: saved.playerId ?? '' }));
              return { success: true };
            }
          }

          // Last resort: server is unreachable and no local data exists for this
          // username (Expo Go may have cleared AsyncStorage on bundle re-download).
          // Create a fresh local account so the user can get back into the app.
          // Chips/stats will start fresh — they were already lost with the storage wipe.
          const localPlayerId = `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
          const freshProfile: UserProfile = {
            ...DEFAULT_PROFILE,
            username: username.toLowerCase(),
            accountType: 'registered',
            playerId: localPlayerId,
            isNewUser: false,
          };
          setProfile(freshProfile);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(freshProfile));
          await AsyncStorage.setItem(LOCAL_CREDS_KEY, JSON.stringify({ username: username.toLowerCase(), pin, playerId: localPlayerId }));
          return { success: true };
        } catch { /* fall through */ }
        return { success: false, error: 'Sign-in failed. Please try again.' };
      }
      return { success: false, error: res.error };
    }

    // Server is the authoritative source.  Build the restored profile by spreading
    // DEFAULT_PROFILE first (gives sane defaults for fields added after the account
    // was created), then the server profile on top so every saved value wins.
    const serverProf = res.profile as Partial<UserProfile>;

    // Also check local storage: if the player completed the tutorial but the
    // debounced server sync hadn't fired yet before sign-out, the local profile
    // will have tutorialCompleted=true while the server still has false.
    let localTutorial = false;
    try {
      const localStr = await AsyncStorage.getItem(STORAGE_KEY);
      if (localStr) {
        const localProf = JSON.parse(localStr) as Partial<UserProfile>;
        // Only trust local tutorialCompleted for the SAME player
        if (localProf.username?.toLowerCase() === username.toLowerCase()) {
          localTutorial = !!localProf.tutorialCompleted;
        }
      }
    } catch { /* ignore parse errors */ }

    const restored: UserProfile = {
      ...DEFAULT_PROFILE,                              // sane defaults for new fields
      ...serverProf,                                   // server data wins
      // Critical fields that must NEVER fall back to DEFAULT_PROFILE values:
      username: serverProf.username ?? username,       // use login username as last resort
      isNewUser: false,                                // never re-trigger the new-user gate
      accountType: 'registered',
      // tutorialCompleted: trust it if EITHER source says true.
      // This prevents the tutorial from re-appearing when the server sync lagged.
      tutorialCompleted: !!(serverProf.tutorialCompleted || localTutorial),
    };

    setProfile(restored);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(restored));

    // If local knew tutorial was done but server didn't, fix the server now.
    if (restored.tutorialCompleted && !serverProf.tutorialCompleted && restored.playerId) {
      void serverSaveProfile(restored.playerId, restored);
    }

    return { success: true };
  }, []);

  const changePin = useCallback(async (oldPin: string, newPin: string): Promise<{ success: boolean; error?: string }> => {
    if (!/^\d{4}$/.test(newPin)) return { success: false, error: 'New PIN must be exactly 4 digits.' };
    if (!profile.playerId) return { success: false, error: 'Account not found. Please sign in again.' };
    return serverChangePin(profile.playerId, oldPin, newPin);
  }, [profile.playerId]);

  const forgotPin = useCallback(async (username: string, email: string, newPin: string): Promise<{ success: boolean; error?: string }> => {
    if (!/^\d{4}$/.test(newPin)) return { success: false, error: 'New PIN must be exactly 4 digits.' };
    return serverForgotPin(username, email, newPin);
  }, []);

  const signOut = useCallback(async () => {
    // Flush to server immediately before clearing session
    setProfile(current => {
      if (current.playerId && current.username !== DEFAULT_PROFILE.username) {
        void serverSaveProfile(current.playerId, current);
      }
      return { ...DEFAULT_PROFILE };
    });
    if (syncTimerRef.current) { clearTimeout(syncTimerRef.current); syncTimerRef.current = null; }
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ ...DEFAULT_PROFILE }));
  }, []);

  // ── Persistent notification socket ───────────────────────────────────────────
  // Opens a Socket.IO connection as soon as the player logs in and registers
  // their playerId so the server can push casino_bonus_received in real time.
  // Falls back to 30 s polling (below) for offline players.

  useEffect(() => {
    const pid = profile.playerId;
    const username = profile.username;

    if (!pid || pid === DEFAULT_PROFILE.playerId) {
      // Not logged in — disconnect any stale socket
      if (notifSocketRef.current) {
        notifSocketRef.current.disconnect();
        notifSocketRef.current = null;
      }
      return;
    }

    // Already connected for this player — nothing to do
    if (notifSocketRef.current?.connected) return;

    const url = getNotificationSocketUrl();
    console.log('[BonusSocket] connecting to', url, 'as', pid);

    const socket = io(url, {
      path: '/api/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: Infinity,
    });

    socket.on('connect', () => {
      console.log('[BonusSocket] connected, registering player', pid);
      socket.emit('register_player', { playerId: pid, username });
    });

    socket.on('disconnect', (reason: string) => {
      console.log('[BonusSocket] disconnected:', reason);
    });

    socket.on('connect_error', (err: Error) => {
      console.log('[BonusSocket] connect_error:', err.message);
    });

    socket.on('casino_bonus_received', (data: {
      playerId: string;
      amount: number;
      reason: string;
      message?: string | null;
      newBalance: number;
      notificationId: string;
      timestamp: string;
    }) => {
      console.log('[BonusSocket] casino_bonus_received', data);

      // Deduplicate — polling might have already queued this
      if (checkedBonusIds.current.has(data.notificationId)) return;
      checkedBonusIds.current.add(data.notificationId);

      // Update chip balance immediately
      setProfile(prev => {
        const next = { ...prev, chips: data.newBalance };
        void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });

      // Queue the bonus popup
      setPendingBonuses(prev => [...prev, {
        notificationId: data.notificationId,
        amount: data.amount,
        reason: data.reason,
        message: data.message ?? null,
        createdAt: data.timestamp,
      }]);
    });

    socket.on('player_warning', (data: { actionId: string; reason: string; message?: string | null; timestamp: string }) => {
      console.log('[BonusSocket] player_warning', data);
      setPendingModeration({ type: 'warning', reason: data.reason, message: data.message ?? null, actionId: data.actionId });
    });

    socket.on('player_suspension', (data: { actionId: string; reason: string; message?: string | null; expiresAt: string; timestamp: string }) => {
      console.log('[BonusSocket] player_suspension', data);
      setPendingModeration({ type: 'suspension', reason: data.reason, message: data.message ?? null, expiresAt: data.expiresAt, actionId: data.actionId });
    });

    socket.on('player_ban', (data: { actionId: string; reason: string; message?: string | null; timestamp: string }) => {
      console.log('[BonusSocket] player_ban', data);
      setPendingModeration({ type: 'ban', reason: data.reason, message: data.message ?? null, actionId: data.actionId });
    });

    socket.on('dm_received', (data: DmReceivedPayload) => {
      setUnreadDmCount(n => n + 1);
      dmListenersRef.current.forEach(cb => cb(data));
    });

    notifSocketRef.current = socket;

    return () => {
      socket.disconnect();
      notifSocketRef.current = null;
    };
  }, [profile.playerId]);

  // ── Casino bonus polling ──────────────────────────────────────────────────────
  // Runs on login and every 30 s (piggybacks on the existing `now` tick).
  // Fetches unread notifications from the server, deduplicates, and queues
  // them for display. Marks them read on the server after showing.

  const checkBonuses = useCallback(async (pid: string) => {
    try {
      const r = await fetch(`${getApiBase()}/players/${pid}/notifications`);
      if (!r.ok) return;
      const data = (await r.json()) as { notifications: Array<{
        notificationId: string; type: string; amount: number;
        reason: string; message: string | null; read: boolean; createdAt: string;
      }> };
      const fresh = data.notifications.filter(
        n => !n.read && !checkedBonusIds.current.has(n.notificationId)
      );
      if (!fresh.length) return;
      // Mark all as read on server immediately so we don't re-show on next poll
      const ids = fresh.map(n => n.notificationId);
      ids.forEach(id => checkedBonusIds.current.add(id));
      fetch(`${getApiBase()}/players/${pid}/notifications/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: ids }),
      }).catch(() => {});
      // Queue for display (oldest first)
      const bonuses = fresh.reverse().map(n => ({
        notificationId: n.notificationId,
        amount: n.amount,
        reason: n.reason,
        message: n.message,
        createdAt: n.createdAt,
      }));
      setPendingBonuses(prev => [...prev, ...bonuses]);
      // Update chip balance — add the total of all fresh bonus amounts to the
      // current local balance (the server already credited them when the bonus
      // was sent; we just need to reflect that in the UI immediately).
      const totalBonusAmount = fresh.reduce((sum, n) => sum + n.amount, 0);
      if (totalBonusAmount > 0) {
        setProfile(prev => {
          const next = { ...prev, chips: prev.chips + totalBonusAmount };
          void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          return next;
        });
      }
    } catch {}
  }, []);

  // Poll on login (when playerId is set)
  useEffect(() => {
    if (profile.playerId) {
      void checkBonuses(profile.playerId);
    }
  }, [profile.playerId]);

  // Poll every 30 s via the existing now ticker
  useEffect(() => {
    if (profile.playerId) {
      void checkBonuses(profile.playerId);
    }
  }, [now]);

  const dismissBonus = useCallback((notificationId: string) => {
    setPendingBonuses(prev => prev.filter(b => b.notificationId !== notificationId));
  }, []);

  const dismissModeration = useCallback(() => {
    setPendingModeration(null);
  }, []);

  const clearDmUnread = useCallback(() => setUnreadDmCount(0), []);

  const onDmReceived = useCallback((cb: (msg: DmReceivedPayload) => void) => {
    dmListenersRef.current.add(cb);
    return () => { dmListenersRef.current.delete(cb); };
  }, []);

  // ── Derived ───────────────────────────────────────────────────────────────────

  const today = new Date().toDateString();
  const canClaimDaily = profile.lastDailyReward !== today;

  const nextHourlyIn = (() => {
    if (!profile.lastHourlyBonus) return 0;
    const last = new Date(profile.lastHourlyBonus).getTime();
    return Math.max(0, Math.ceil((last + HOURLY_INTERVAL_MS - now) / 60_000));
  })();
  const canClaimHourly = nextHourlyIn === 0;

  const canClaimWheel = (() => {
    if (!profile.lastWheelSpin) return true;
    return Date.now() - new Date(profile.lastWheelSpin).getTime() >= 24 * 60 * 60 * 1000;
  })();
  const nextWheelIn = (() => {
    if (!profile.lastWheelSpin) return 0;
    const ms = new Date(profile.lastWheelSpin).getTime() + 24 * 60 * 60 * 1000 - Date.now();
    return Math.max(0, Math.ceil(ms / 60_000));
  })();
  const canClaimFreeScratch = (() => {
    if (!profile.lastFreeScratch) return false;
    return Date.now() - new Date(profile.lastFreeScratch).getTime() >= 24 * 60 * 60 * 1000;
  })();

  const canClaimFreeCookie = (() => {
    if (!profile.lastFreeCookie) return true;
    return new Date(profile.lastFreeCookie).toDateString() !== new Date().toDateString();
  })();
  const nextCookieIn = (() => {
    if (canClaimFreeCookie || !profile.lastFreeCookie) return 0;
    const midnight = new Date(); midnight.setHours(24, 0, 0, 0);
    return Math.max(0, Math.ceil((midnight.getTime() - Date.now()) / 60_000));
  })();

  const yesterday = new Date(now - 86_400_000).toDateString();
  const isStreak     = profile.lastDailyReward === yesterday;
  const nextStreakDay = isStreak ? profile.streakDays + 1 : 1;
  const dailyRewardAmount = DAILY_REWARDS[Math.min(nextStreakDay, 7)] ?? DEFAULT_DAILY_REWARD;
  const winRate = profile.handsPlayed > 0 ? Math.round((profile.wins / profile.handsPlayed) * 100) : 0;

  // Seconds until midnight (when daily resets)
  const nextDailyIn = (() => {
    if (canClaimDaily) return 0;
    const n = new Date();
    const midnight = new Date(n);
    midnight.setHours(24, 0, 0, 0);
    return Math.max(0, Math.ceil((midnight.getTime() - n.getTime()) / 1000));
  })();

  return (
    <UserContext.Provider value={{
      profile, updateProfile, addChips, removeChips, recordWin, recordLoss,
      recordTournamentResult,
      claimDailyReward, claimHourlyBonus, claimComebackBonus, completeOnboarding,
      awardRankedPoints, claimWheelSpin, useScratchTicket, consumeScratchTickets, addScratchTickets,
      completeTutorial, registerAccount, signIn, signOut,
      changePin, forgotPin, checkUsernameAvailable,
      canClaimWheel, nextWheelIn, canClaimFreeScratch, winRate, isLoaded,
      canClaimDaily, canClaimHourly, nextHourlyIn, dailyRewardAmount, nextDailyIn,
      canClaimFreeCookie, nextCookieIn,
      addXP, consumeFortuneCookie, addFortuneCookies, claimFreeCookie,
      pendingBonuses, dismissBonus,
      pendingModeration, dismissModeration,
      unreadDmCount, clearDmUnread, onDmReceived,
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
