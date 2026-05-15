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
  { rank: 'Neon Bronze', minXP: 0 },
  { rank: 'Neon Silver', minXP: 500 },
  { rank: 'Neon Gold', minXP: 1500 },
  { rank: 'Neon Platinum', minXP: 4000 },
  { rank: 'Neon Diamond', minXP: 10000 },
  { rank: 'Neon Elite', minXP: 25000 },
  { rank: 'Neon Legend', minXP: 60000 },
];

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
  streakDays: number;
  dailyMissionsCompleted: number;
}

const DEFAULT_PROFILE: UserProfile = {
  username: 'Neon Player',
  chips: 5000,
  xp: 0,
  rank: 'Neon Bronze',
  level: 1,
  wins: 0,
  losses: 0,
  handsPlayed: 0,
  avatarIndex: 0,
  lastDailyReward: null,
  streakDays: 0,
  dailyMissionsCompleted: 0,
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
  winRate: number;
  isLoaded: boolean;
}

const UserContext = createContext<UserContextValue | null>(null);
const STORAGE_KEY = '@neon_river_profile';

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(data => {
      if (data) {
        try {
          const saved = JSON.parse(data) as Partial<UserProfile>;
          setProfile(p => ({ ...p, ...saved }));
        } catch {}
      }
      setIsLoaded(true);
    });
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
    await updateProfile({ chips: Math.max(0, profile.chips + amount) });
  }, [profile.chips, updateProfile]);

  const removeChips = useCallback(async (amount: number) => {
    await updateProfile({ chips: Math.max(0, profile.chips - amount) });
  }, [profile.chips, updateProfile]);

  const recordWin = useCallback(async (chipsWon: number) => {
    setProfile(prev => {
      const next = {
        ...prev,
        wins: prev.wins + 1,
        handsPlayed: prev.handsPlayed + 1,
        chips: prev.chips + chipsWon,
        xp: prev.xp + 50 + Math.floor(chipsWon / 100),
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

    const yesterday = new Date(Date.now() - 86400000).toDateString();
    const isStreak = profile.lastDailyReward === yesterday;
    const newStreak = isStreak ? profile.streakDays + 1 : 1;
    const reward = 500 + newStreak * 100;

    await updateProfile({
      chips: profile.chips + reward,
      lastDailyReward: today,
      streakDays: newStreak,
    });

    return reward;
  }, [profile, updateProfile]);

  const winRate =
    profile.handsPlayed > 0
      ? Math.round((profile.wins / profile.handsPlayed) * 100)
      : 0;

  return (
    <UserContext.Provider
      value={{ profile, updateProfile, addChips, removeChips, recordWin, recordLoss, claimDailyReward, winRate, isLoaded }}
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
