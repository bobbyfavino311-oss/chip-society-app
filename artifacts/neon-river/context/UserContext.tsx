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

const RANKS: { rank: Rank; minXP: number }[] = [
  { rank: 'Neon Bronze',   minXP: 0 },
  { rank: 'Neon Silver',   minXP: 500 },
  { rank: 'Neon Gold',     minXP: 1500 },
  { rank: 'Neon Platinum', minXP: 4000 },
  { rank: 'Neon Diamond',  minXP: 10000 },
  { rank: 'Neon Elite',    minXP: 25000 },
  { rank: 'Neon Legend',   minXP: 60000 },
];

// Daily reward schedule — increments of 5K for sustainable economy pacing
const DAILY_REWARDS: Record<number, number> = {
  1:  5_000,
  2: 10_000,
  3: 15_000,
  4: 20_000,
  5: 25_000,
  6: 30_000,
  7: 35_000,
};
const DEFAULT_DAILY_REWARD = 35_000;
const HOURLY_BONUS = 5_000;
const HOURLY_INTERVAL_MS = 24 * 60 * 60 * 1000;
const COMEBACK_THRESHOLD = 500;
const COMEBACK_BONUS = 20_000;
const STARTING_CHIPS = 50_000;

export interface UserProfile {
  username: string;
  chips: number;
  xp: number;
  rank: Rank;
  level: number;
  wins: number;
  losses: number;
  handsPlayed: number;
  avatarIndex: number;
  avatarUri?: string;
  lastDailyReward: string | null;
  lastHourlyBonus: string | null;
  streakDays: number;
  dailyMissionsCompleted: number;
  isNewUser: boolean;
  vipMember: boolean;
  rankedPoints: number;
  lastWheelSpin: string | null;
  scratchTickets: number;
  lastFreeScratch: string | null;
}

const DEFAULT_PROFILE: UserProfile = {
  username: 'CS_Player',
  chips: STARTING_CHIPS,
  xp: 0,
  rank: 'Neon Bronze',
  level: 1,
  wins: 0,
  losses: 0,
  handsPlayed: 0,
  avatarIndex: 0,
  lastDailyReward: null,
  lastHourlyBonus: null,
  streakDays: 0,
  dailyMissionsCompleted: 0,
  isNewUser: true,
  vipMember: false,
  rankedPoints: 0,
  lastWheelSpin: null,
  scratchTickets: 1,
  lastFreeScratch: null,
};

function getRankFromXP(xp: number): Rank {
  let rank: Rank = 'Neon Bronze';
  for (const r of RANKS) {
    if (xp >= r.minXP) rank = r.rank;
  }
  return rank;
}

function getLevelFromXP(xp: number): number {
  return Math.floor(xp / 200) + 1;
}

interface UserContextValue {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  addChips: (amount: number) => Promise<void>;
  removeChips: (amount: number) => Promise<void>;
  recordWin: (chipsWon: number) => Promise<void>;
  recordLoss: () => Promise<void>;
  claimDailyReward: () => Promise<number>;
  claimHourlyBonus: () => Promise<number>;
  claimComebackBonus: () => Promise<number>;
  completeOnboarding: () => Promise<void>;
  awardRankedPoints: (delta: number) => Promise<void>;
  claimWheelSpin: (chips: number, tickets: number) => Promise<void>;
  useScratchTicket: () => Promise<boolean>;
  addScratchTickets: (n: number) => Promise<void>;
  canClaimWheel: boolean;
  nextWheelIn: number;
  canClaimFreeScratch: boolean;
  winRate: number;
  isLoaded: boolean;
  canClaimDaily: boolean;
  canClaimHourly: boolean;
  nextHourlyIn: number;
  dailyRewardAmount: number;
}

const UserContext = createContext<UserContextValue | null>(null);
const STORAGE_KEY = '@chip_society_profile';
const LEGACY_KEY = '@neon_river_profile';

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [isLoaded, setIsLoaded] = useState(false);
  const [now, setNow] = useState(Date.now());

  // Tick every 30s to refresh time-based states
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    (async () => {
      // Try new key first, fall back to legacy
      let data = await AsyncStorage.getItem(STORAGE_KEY);
      if (!data) data = await AsyncStorage.getItem(LEGACY_KEY);
      if (data) {
        try {
          const saved = JSON.parse(data) as Partial<UserProfile>;
          setProfile(p => ({ ...p, ...saved }));
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
      const rank = getRankFromXP(next.xp);
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
        ...prev,
        wins: prev.wins + 1,
        handsPlayed: prev.handsPlayed + 1,
        chips: prev.chips + chipsWon,
        xp: prev.xp + xpGain,
      };
      next.rank = getRankFromXP(next.xp);
      next.level = getLevelFromXP(next.xp);
      save(next);
      return next;
    });
  }, [save]);

  const recordLoss = useCallback(async () => {
    setProfile(prev => {
      const next = {
        ...prev,
        losses: prev.losses + 1,
        handsPlayed: prev.handsPlayed + 1,
        xp: prev.xp + 10,
      };
      next.rank = getRankFromXP(next.xp);
      next.level = getLevelFromXP(next.xp);
      save(next);
      return next;
    });
  }, [save]);

  const claimDailyReward = useCallback(async (): Promise<number> => {
    const today = new Date().toDateString();
    if (profile.lastDailyReward === today) return 0;

    const yesterday = new Date(Date.now() - 86_400_000).toDateString();
    const isStreak = profile.lastDailyReward === yesterday;
    const newStreak = isStreak ? profile.streakDays + 1 : 1;
    const reward = DAILY_REWARDS[Math.min(newStreak, 7)] ?? DEFAULT_DAILY_REWARD;
    const vipBonus = profile.vipMember ? Math.floor(reward * 0.5) : 0;
    const total = reward + vipBonus;

    await updateProfile({
      chips: profile.chips + total,
      lastDailyReward: today,
      streakDays: newStreak,
    });
    return total;
  }, [profile, updateProfile]);

  const claimHourlyBonus = useCallback(async (): Promise<number> => {
    if (profile.lastHourlyBonus) {
      const last = new Date(profile.lastHourlyBonus).getTime();
      if (last > Date.now() - HOURLY_INTERVAL_MS) return 0;
    }
    const bonus = HOURLY_BONUS;
    await updateProfile({
      chips: profile.chips + bonus,
      lastHourlyBonus: new Date().toISOString(),
    });
    return bonus;
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
      const next = {
        ...prev,
        chips: prev.chips + chips,
        scratchTickets: prev.scratchTickets + tickets,
        lastWheelSpin: new Date().toISOString(),
      };
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

  // Derived values
  const today = new Date().toDateString();
  const canClaimDaily = profile.lastDailyReward !== today;

  const nextHourlyIn = (() => {
    if (!profile.lastHourlyBonus) return 0;
    const last = new Date(profile.lastHourlyBonus).getTime();
    const ms = last + HOURLY_INTERVAL_MS - now;
    return Math.max(0, Math.ceil(ms / 60_000));
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
  const isStreak = profile.lastDailyReward === yesterday;
  const nextStreakDay = isStreak ? profile.streakDays + 1 : 1;
  const dailyRewardAmount = DAILY_REWARDS[Math.min(nextStreakDay, 7)] ?? DEFAULT_DAILY_REWARD;

  const winRate =
    profile.handsPlayed > 0
      ? Math.round((profile.wins / profile.handsPlayed) * 100)
      : 0;

  return (
    <UserContext.Provider
      value={{
        profile, updateProfile, addChips, removeChips,
        recordWin, recordLoss, claimDailyReward, claimHourlyBonus,
        claimComebackBonus, completeOnboarding, awardRankedPoints,
        claimWheelSpin, useScratchTicket, addScratchTickets,
        canClaimWheel, nextWheelIn, canClaimFreeScratch,
        winRate, isLoaded, canClaimDaily, canClaimHourly,
        nextHourlyIn, dailyRewardAmount,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
