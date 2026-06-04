import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

export type Rank =
  | 'Neon Bronze'
  | 'Neon Silver'
  | 'Neon Gold'
  | 'Neon Platinum'
  | 'Neon Diamond'
  | 'Neon Elite'
  | 'Neon Legend';

export type AccountType = 'guest' | 'registered';

const RANKS: { rank: Rank; minXP: number }[] = [
  { rank: 'Neon Bronze',   minXP: 0 },
  { rank: 'Neon Silver',   minXP: 500 },
  { rank: 'Neon Gold',     minXP: 1500 },
  { rank: 'Neon Platinum', minXP: 4000 },
  { rank: 'Neon Diamond',  minXP: 10000 },
  { rank: 'Neon Elite',    minXP: 25000 },
  { rank: 'Neon Legend',   minXP: 60000 },
];

const DAILY_REWARDS: Record<number, number> = {
  1:  5_000, 2: 10_000, 3: 15_000, 4: 20_000, 5: 25_000, 6: 30_000, 7: 35_000,
};
const DEFAULT_DAILY_REWARD  = 35_000;
const HOURLY_BONUS          = 5_000;
const HOURLY_INTERVAL_MS    = 24 * 60 * 60 * 1000;
const COMEBACK_THRESHOLD    = 500;
const COMEBACK_BONUS        = 20_000;
const REGISTERED_CHIPS      = 50_000;
const GUEST_CHIPS           = 25_000;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserProfile {
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
  isGuest: boolean;
  accountType: AccountType;
  vipMember: boolean;
  rankedPoints: number;
  lastWheelSpin: string | null;
  scratchTickets: number;
  lastFreeScratch: string | null;
  createdAt: string;
  tutorialCompleted: boolean;
  // Tournament stats
  tournamentWins: number;
  tournamentLosses: number;
  bestTournamentFinish: number;
  biggestTournamentPrize: number;
}

// Stored account record (for sign-in lookup)
interface StoredAccount {
  username: string;
  email: string;
  avatarIndex: number;
  createdAt: string;
  profile: UserProfile;
}

const DEFAULT_PROFILE: UserProfile = {
  username: 'CS_Player',
  email: '',
  chips: REGISTERED_CHIPS,
  xp: 0,
  rank: 'Neon Bronze',
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
  isGuest: false,
  accountType: 'registered',
  vipMember: false,
  rankedPoints: 0,
  lastWheelSpin: null,
  scratchTickets: 1,
  lastFreeScratch: null,
  createdAt: new Date().toISOString(),
  tutorialCompleted: false,
  tournamentWins: 0,
  tournamentLosses: 0,
  bestTournamentFinish: 0,
  biggestTournamentPrize: 0,
};

function getRankFromXP(xp: number): Rank {
  let rank: Rank = 'Neon Bronze';
  for (const r of RANKS) { if (xp >= r.minXP) rank = r.rank; }
  return rank;
}

function getLevelFromXP(xp: number): number {
  return Math.floor(xp / 200) + 1;
}

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
  addScratchTickets: (n: number) => Promise<void>;
  completeTutorial: () => Promise<void>;
  loginAsGuest: () => Promise<void>;
  registerAccount: (username: string, email: string, avatarIndex: number) => Promise<{ success: boolean; error?: string }>;
  signIn: (username: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
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
}

const UserContext = createContext<UserContextValue | null>(null);

const STORAGE_KEY  = '@chip_society_profile';
const LEGACY_KEY   = '@neon_river_profile';
const ACCOUNTS_KEY = '@chip_society_accounts';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function loadAccounts(): Promise<StoredAccount[]> {
  try {
    const raw = await AsyncStorage.getItem(ACCOUNTS_KEY);
    return raw ? (JSON.parse(raw) as StoredAccount[]) : [];
  } catch { return []; }
}

async function saveAccounts(accounts: StoredAccount[]): Promise<void> {
  await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
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

function generateGuestName(): string {
  const prefixes = ['Neon', 'Ghost', 'Bluff', 'Ace', 'River', 'Stack', 'Shark', 'Wild'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const num = Math.floor(1000 + Math.random() * 8999);
  return `${prefix}${num}`;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [isLoaded, setIsLoaded] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    (async () => {
      let data = await AsyncStorage.getItem(STORAGE_KEY);
      if (!data) data = await AsyncStorage.getItem(LEGACY_KEY);
      if (data) {
        try {
          const saved = JSON.parse(data) as Partial<UserProfile>;
          setProfile(p => ({
            ...p,
            ...saved,
            chips: saved.chips ?? 0,
            // Backfill new fields for existing installs
            isGuest: saved.isGuest ?? false,
            accountType: saved.accountType ?? 'registered',
            email: saved.email ?? '',
            createdAt: saved.createdAt ?? new Date().toISOString(),
            tutorialCompleted: saved.tutorialCompleted ?? false,
            profileImageType: saved.profileImageType ?? (saved.avatarUri ? 'custom' : 'character'),
            symbolIndex: saved.symbolIndex ?? 0,
            tournamentWins: saved.tournamentWins ?? 0,
            tournamentLosses: saved.tournamentLosses ?? 0,
            bestTournamentFinish: saved.bestTournamentFinish ?? 0,
            biggestTournamentPrize: saved.biggestTournamentPrize ?? 0,
          }));
        } catch {}
      }
      setIsLoaded(true);
    })();
  }, []);

  const save = useCallback(async (updated: UserProfile) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    setProfile(prev => {
      const next = { ...prev, ...updates };
      const rank  = getRankFromXP(next.xp);
      const level = getLevelFromXP(next.xp);
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
      const xpGain = 50 + Math.floor(chipsWon / 1000);
      const next = {
        ...prev, wins: prev.wins + 1, handsPlayed: prev.handsPlayed + 1,
        chips: prev.chips + chipsWon, xp: prev.xp + xpGain,
      };
      next.rank  = getRankFromXP(next.xp);
      next.level = getLevelFromXP(next.xp);
      save(next);
      return next;
    });
  }, [save]);

  const recordLoss = useCallback(async () => {
    setProfile(prev => {
      const next = { ...prev, losses: prev.losses + 1, handsPlayed: prev.handsPlayed + 1, xp: prev.xp + 10 };
      next.rank  = getRankFromXP(next.xp);
      next.level = getLevelFromXP(next.xp);
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

  const addScratchTickets = useCallback(async (n: number) => {
    await updateProfile({ scratchTickets: profile.scratchTickets + n });
  }, [profile, updateProfile]);

  const completeTutorial = useCallback(async () => {
    await updateProfile({ tutorialCompleted: true });
  }, [updateProfile]);

  // ── Auth functions ────────────────────────────────────────────────────────────

  const loginAsGuest = useCallback(async () => {
    const guestName = generateGuestName();
    const guestProfile: UserProfile = {
      ...DEFAULT_PROFILE,
      username: guestName,
      chips: GUEST_CHIPS,
      isGuest: true,
      accountType: 'guest',
      isNewUser: false,
      createdAt: new Date().toISOString(),
    };
    setProfile(guestProfile);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(guestProfile));
  }, []);

  const checkUsernameAvailable = useCallback(async (username: string): Promise<boolean> => {
    const accounts = await loadAccounts();
    return !accounts.some(a => a.username.toLowerCase() === username.toLowerCase());
  }, []);

  const registerAccount = useCallback(async (
    username: string,
    email: string,
    avatarIndex: number,
  ): Promise<{ success: boolean; error?: string }> => {
    if (username.length < 3) return { success: false, error: 'Username must be at least 3 characters.' };
    if (username.length > 20) return { success: false, error: 'Username must be under 20 characters.' };
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return { success: false, error: 'Only letters, numbers, and underscores.' };
    if (hasProfanity(username)) return { success: false, error: 'That username is not allowed.' };
    if (isReserved(username)) return { success: false, error: 'That username is reserved.' };

    const accounts = await loadAccounts();
    const taken = accounts.some(a => a.username.toLowerCase() === username.toLowerCase());
    if (taken) return { success: false, error: 'Username is already taken.' };

    const now2 = new Date().toISOString();
    const newProfile: UserProfile = {
      ...DEFAULT_PROFILE,
      username,
      email,
      avatarIndex,
      symbolIndex: avatarIndex,
      profileImageType: 'symbol',
      chips: REGISTERED_CHIPS,
      isGuest: false,
      accountType: 'registered',
      isNewUser: false,
      createdAt: now2,
    };

    const account: StoredAccount = { username, email, avatarIndex, createdAt: now2, profile: newProfile };
    await saveAccounts([...accounts, account]);

    setProfile(newProfile);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newProfile));
    return { success: true };
  }, []);

  const signIn = useCallback(async (username: string): Promise<{ success: boolean; error?: string }> => {
    const accounts = await loadAccounts();
    const found = accounts.find(a => a.username.toLowerCase() === username.toLowerCase());
    if (!found) return { success: false, error: 'No account found with that username.' };

    const restored: UserProfile = { ...found.profile, isNewUser: false };
    setProfile(restored);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(restored));
    return { success: true };
  }, []);

  const signOut = useCallback(async () => {
    const blank: UserProfile = { ...DEFAULT_PROFILE };
    setProfile(blank);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(blank));
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
      awardRankedPoints, claimWheelSpin, useScratchTicket, addScratchTickets,
      completeTutorial, loginAsGuest, registerAccount, signIn, signOut, checkUsernameAvailable,
      canClaimWheel, nextWheelIn, canClaimFreeScratch, winRate, isLoaded,
      canClaimDaily, canClaimHourly, nextHourlyIn, dailyRewardAmount, nextDailyIn,
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
