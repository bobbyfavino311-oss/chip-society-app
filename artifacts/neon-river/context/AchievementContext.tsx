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
import { SoundEngine } from '@/lib/soundEngine';

const STORAGE_KEY = '@chipsociety_achievements_v3';

interface PersistedState {
  unlockedIds: string[];
  claimedIds: string[];
  totalWins: number;
  winStreak: number;
  lastHandLost: boolean;
  handCounts: Record<string, number>;
}

interface AchievementContextValue {
  unlockedIds: Set<string>;
  claimedIds: Set<string>;
  pendingUnlock: Achievement | null;
  dismissPending: () => void;
  /** Call after a human win in-game */
  recordGameWin: (handDesc: string, wasAllIn: boolean, potSize: number) => void;
  /** Call after a human loss in-game */
  recordGameLoss: () => void;
  /** Call when chip balance changes */
  onChipBalance: (chips: number) => void;
  /** Call on login-streak check */
  onLoginStreak: (days: number) => void;
  /** Claim a pending (unlocked but unclaimed) achievement */
  claim: (id: string) => Promise<void>;
  totalWins: number;
  winStreak: number;
  /** Per-hand win counts for progress tracking */
  handCounts: Record<string, number>;
}

const AchievementContext = createContext<AchievementContextValue>({
  unlockedIds: new Set(),
  claimedIds: new Set(),
  pendingUnlock: null,
  dismissPending: () => {},
  recordGameWin: () => {},
  recordGameLoss: () => {},
  onChipBalance: () => {},
  onLoginStreak: () => {},
  claim: async () => {},
  totalWins: 0,
  winStreak: 0,
  handCounts: {},
});

export function AchievementProvider({ children }: { children: React.ReactNode }) {
  const { profile, addChips, updateProfile } = useUser();

  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());
  const [claimedIds,  setClaimedIds]  = useState<Set<string>>(new Set());
  const [totalWins,   setTotalWins]   = useState(0);
  const [winStreak,   setWinStreak]   = useState(0);
  const [lastHandLost, setLastHandLost] = useState(false);
  const [handCounts,  setHandCounts]  = useState<Record<string, number>>({});
  const [queue, setQueue] = useState<Achievement[]>([]);
  const [pendingUnlock, setPendingUnlock] = useState<Achievement | null>(null);

  // Refs for synchronous reads inside callbacks
  const unlockedRef    = useRef<Set<string>>(new Set());
  const claimedRef     = useRef<Set<string>>(new Set());
  const totalWinsRef   = useRef(0);
  const winStreakRef   = useRef(0);
  const lastHandLostRef = useRef(false);
  const handCountsRef  = useRef<Record<string, number>>({});
  const profileRef     = useRef(profile);
  profileRef.current   = profile;
  const loaded         = useRef(false);

  // ── Load from AsyncStorage ────────────────────────────────────────────────
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (raw) {
        try {
          const saved = JSON.parse(raw) as Partial<PersistedState>;
          if (saved.unlockedIds)   { const s = new Set(saved.unlockedIds);   setUnlockedIds(s);   unlockedRef.current = s; }
          if (saved.claimedIds)    { const s = new Set(saved.claimedIds);    setClaimedIds(s);    claimedRef.current  = s; }
          if (typeof saved.totalWins  === 'number') { setTotalWins(saved.totalWins);   totalWinsRef.current  = saved.totalWins;   }
          if (typeof saved.winStreak  === 'number') { setWinStreak(saved.winStreak);   winStreakRef.current   = saved.winStreak;   }
          if (saved.handCounts) { setHandCounts(saved.handCounts); handCountsRef.current = saved.handCounts; }
          // lastHandLost intentionally NOT restored — comeback must be earned within the same session
        } catch {}
      }
      loaded.current = true;
    });
  }, []);

  const persist = useCallback(() => {
    if (!loaded.current) return;
    const state: PersistedState = {
      unlockedIds:  Array.from(unlockedRef.current),
      claimedIds:   Array.from(claimedRef.current),
      totalWins:    totalWinsRef.current,
      winStreak:    winStreakRef.current,
      lastHandLost: lastHandLostRef.current,
      handCounts:   handCountsRef.current,
    };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, []);

  // ── Show one popup at a time ──────────────────────────────────────────────
  useEffect(() => {
    if (pendingUnlock || queue.length === 0) return;
    const [next, ...rest] = queue;
    setPendingUnlock(next);
    setQueue(rest);
  }, [pendingUnlock, queue]);

  const dismissPending = useCallback(() => setPendingUnlock(null), []);

  // ── unlock — marks as unlocked but does NOT award chips yet ──────────────
  const unlock = useCallback((id: string) => {
    if (unlockedRef.current.has(id)) return;
    const achievement = ACHIEVEMENT_MAP[id];
    if (!achievement) return;

    const next = new Set(unlockedRef.current);
    next.add(id);
    unlockedRef.current = next;
    setUnlockedIds(next);

    // Queue popup — player must claim to receive reward
    setQueue(q => [...q, achievement]);
    persist();
  }, [persist]);

  // ── claim — awards chips/XP and marks as claimed ─────────────────────────
  const claim = useCallback(async (id: string) => {
    if (claimedRef.current.has(id)) return;
    if (!unlockedRef.current.has(id)) return;
    const achievement = ACHIEVEMENT_MAP[id];
    if (!achievement) return;

    const next = new Set(claimedRef.current);
    next.add(id);
    claimedRef.current = next;
    setClaimedIds(next);

    // Award chips + XP
    SoundEngine.claim();
    await addChips(achievement.chipReward);
    await updateProfile({ xp: profileRef.current.xp + achievement.xpReward });
    persist();
  }, [addChips, updateProfile, persist]);

  // ── recordGameWin ─────────────────────────────────────────────────────────
  const recordGameWin = useCallback((handDesc: string, wasAllIn: boolean, potSize: number) => {
    // Update streak
    const newStreak = winStreakRef.current + 1;
    winStreakRef.current = newStreak;
    setWinStreak(newStreak);

    // Update total wins
    const newTotal = totalWinsRef.current + 1;
    totalWinsRef.current = newTotal;
    setTotalWins(newTotal);

    const wasComeback = lastHandLostRef.current;
    lastHandLostRef.current = false;
    setLastHandLost(false);

    // Hand type achievement — count-based (10 wins required, except Royal Flush = 1)
    const handAchId = HAND_TO_ACHIEVEMENT[handDesc];
    if (handAchId && !unlockedRef.current.has(handAchId)) {
      const ach = ACHIEVEMENT_MAP[handAchId];
      const target = ach?.target ?? 10;
      const prev = handCountsRef.current[handAchId] ?? 0;
      const next = prev + 1;
      const updated = { ...handCountsRef.current, [handAchId]: next };
      handCountsRef.current = updated;
      setHandCounts(updated);
      if (next >= target) unlock(handAchId);
    }

    // Win count milestones
    if (newTotal === 1)    unlock('first_win');
    if (newTotal >= 10)    unlock('wins_10');
    if (newTotal >= 50)    unlock('wins_50');
    if (newTotal >= 100)   unlock('wins_100');

    // Situational
    if (wasAllIn)           unlock('allin_win');
    if (wasComeback)        unlock('comeback');
    if (potSize >= 50_000)  unlock('big_pot');

    // Consecutive win streaks
    if (newStreak >= 3)    unlock('streak_3');
    if (newStreak >= 5)    unlock('streak_5');
    if (newStreak >= 10)   unlock('streak_10');

    persist();
  }, [unlock, persist]);

  // ── recordGameLoss ────────────────────────────────────────────────────────
  const recordGameLoss = useCallback(() => {
    winStreakRef.current = 0;
    lastHandLostRef.current = true;
    setWinStreak(0);
    setLastHandLost(true);
    persist();
  }, [persist]);

  // ── onChipBalance ─────────────────────────────────────────────────────────
  const onChipBalance = useCallback((chips: number) => {
    if (chips >= 100_000)    unlock('chips_100k');
    if (chips >= 500_000)    unlock('chips_500k');
    if (chips >= 1_000_000)  unlock('chips_1m');
    if (chips >= 10_000_000) unlock('chips_10m');
  }, [unlock]);

  // ── onLoginStreak ─────────────────────────────────────────────────────────
  const onLoginStreak = useCallback((days: number) => {
    if (days >= 3)  unlock('daily_3');
    if (days >= 7)  unlock('daily_7');
    if (days >= 30) unlock('daily_30');
  }, [unlock]);

  // Check login streak once after load, keyed on streakDays value
  const streakChecked = useRef(0);
  useEffect(() => {
    if (!loaded.current || profile.streakDays <= 0 || streakChecked.current === profile.streakDays) return;
    streakChecked.current = profile.streakDays;
    onLoginStreak(profile.streakDays);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.streakDays]);

  return (
    <AchievementContext.Provider value={{
      unlockedIds,
      claimedIds,
      pendingUnlock,
      dismissPending,
      recordGameWin,
      recordGameLoss,
      onChipBalance,
      onLoginStreak,
      claim,
      totalWins,
      winStreak,
      handCounts,
    }}>
      {children}
    </AchievementContext.Provider>
  );
}

export const useAchievements = () => useContext(AchievementContext);

export function achievementCompletion(unlockedIds: Set<string>): number {
  return Math.round((unlockedIds.size / ALL_ACHIEVEMENTS.length) * 100);
}
