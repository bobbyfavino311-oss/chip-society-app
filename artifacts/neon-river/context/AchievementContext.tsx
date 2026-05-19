import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Achievement,
  ACHIEVEMENT_MAP,
  ALL_ACHIEVEMENTS,
  HAND_TO_ACHIEVEMENT,
} from '@/lib/achievements';
import { useUser } from '@/context/UserContext';

const STORAGE_KEY = '@chipsociety_achievements_v1';

interface PersistedState {
  unlockedIds: string[];
  totalWins: number;
}

interface AchievementContextValue {
  unlockedIds: Set<string>;
  pendingUnlock: Achievement | null;
  dismissPending: () => void;
  onHandWon: (handDescription: string, wasAllIn: boolean, potSize: number, prevLost: boolean) => void;
  onWinStreak: (streak: number) => void;
  onChipBalance: (chips: number) => void;
  onLoginStreak: (days: number) => void;
  totalWins: number;
}

const AchievementContext = createContext<AchievementContextValue>({
  unlockedIds: new Set(),
  pendingUnlock: null,
  dismissPending: () => {},
  onHandWon: () => {},
  onWinStreak: () => {},
  onChipBalance: () => {},
  onLoginStreak: () => {},
  totalWins: 0,
});

export function AchievementProvider({ children }: { children: React.ReactNode }) {
  const { profile, updateProfile } = useUser();
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());
  const [totalWins, setTotalWins] = useState(0);
  const [queue, setQueue] = useState<Achievement[]>([]);
  const [pendingUnlock, setPendingUnlock] = useState<Achievement | null>(null);

  const unlockedRef = useRef<Set<string>>(new Set());
  const profileRef  = useRef(profile);
  profileRef.current = profile;

  const loaded = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (raw) {
        try {
          const saved = JSON.parse(raw) as Partial<PersistedState>;
          if (saved.unlockedIds) {
            const s = new Set(saved.unlockedIds);
            setUnlockedIds(s);
            unlockedRef.current = s;
          }
          if (typeof saved.totalWins === 'number') setTotalWins(saved.totalWins);
        } catch {}
      }
      loaded.current = true;
    });
  }, []);

  const persist = useCallback((ids: Set<string>, wins: number) => {
    const state: PersistedState = { unlockedIds: Array.from(ids), totalWins: wins };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, []);

  // Show one popup at a time
  useEffect(() => {
    if (pendingUnlock || queue.length === 0) return;
    const [next, ...rest] = queue;
    setPendingUnlock(next);
    setQueue(rest);
  }, [pendingUnlock, queue]);

  const unlock = useCallback((id: string) => {
    if (unlockedRef.current.has(id)) return;
    const achievement = ACHIEVEMENT_MAP[id];
    if (!achievement) return;

    // Mark unlocked immediately via ref to prevent double-fire
    const nextSet = new Set(unlockedRef.current);
    nextSet.add(id);
    unlockedRef.current = nextSet;

    setUnlockedIds(nextSet);

    // Award chips + XP
    const p = profileRef.current;
    void updateProfile({
      chips: p.chips + achievement.chipReward,
      xp: p.xp + achievement.xpReward,
    });

    // Queue popup
    setQueue(q => [...q, achievement]);

    persist(nextSet, totalWins);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateProfile, persist]);

  const dismissPending = useCallback(() => setPendingUnlock(null), []);

  const onHandWon = useCallback((
    handDescription: string,
    wasAllIn: boolean,
    potSize: number,
    prevLost: boolean,
  ) => {
    setTotalWins(prev => {
      const next = prev + 1;

      // Hand type achievement
      const handAchId = HAND_TO_ACHIEVEMENT[handDescription];
      if (handAchId) unlock(handAchId);

      // Win count milestones
      if (next === 1)   unlock('first_win');
      if (next >= 10)   unlock('wins_10');
      if (next >= 50)   unlock('wins_50');
      if (next >= 100)  unlock('wins_100');

      // Situational
      if (wasAllIn)  unlock('allin_win');
      if (prevLost)  unlock('comeback');
      if (potSize >= 50_000) unlock('big_pot');

      persist(unlockedRef.current, next);
      return next;
    });
  }, [unlock, persist]);

  const onWinStreak = useCallback((streak: number) => {
    if (streak >= 3)  unlock('streak_3');
    if (streak >= 5)  unlock('streak_5');
    if (streak >= 10) unlock('streak_10');
  }, [unlock]);

  const onChipBalance = useCallback((chips: number) => {
    if (chips >= 100_000)    unlock('chips_100k');
    if (chips >= 500_000)    unlock('chips_500k');
    if (chips >= 1_000_000)  unlock('chips_1m');
    if (chips >= 10_000_000) unlock('chips_10m');
  }, [unlock]);

  const onLoginStreak = useCallback((days: number) => {
    if (days >= 3)  unlock('daily_3');
    if (days >= 7)  unlock('daily_7');
    if (days >= 30) unlock('daily_30');
  }, [unlock]);

  // Check login streak once on load
  const streakChecked = useRef(false);
  useEffect(() => {
    if (!loaded.current || streakChecked.current || profile.streakDays <= 0) return;
    streakChecked.current = true;
    onLoginStreak(profile.streakDays);
  });

  return (
    <AchievementContext.Provider value={{
      unlockedIds,
      pendingUnlock,
      dismissPending,
      onHandWon,
      onWinStreak,
      onChipBalance,
      onLoginStreak,
      totalWins,
    }}>
      {children}
    </AchievementContext.Provider>
  );
}

export const useAchievements = () => useContext(AchievementContext);

export function achievementCompletion(unlockedIds: Set<string>): number {
  return Math.round((unlockedIds.size / ALL_ACHIEVEMENTS.length) * 100);
}
