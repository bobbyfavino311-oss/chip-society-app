import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const DAILY_WIN_CAP = 50_000;

interface CasinoDay { date: string; totalWins: number; }

interface CasinoContextValue {
  dailyWins:    number;
  dailyWinCap:  number;
  remainingCap: number;
  capReached:   boolean;
  isLoaded:     boolean;
  /** Record a gross casino win. Returns how many chips are actually awarded (respecting daily cap). */
  recordCasinoWin: (grossWin: number) => Promise<{ chipsAwarded: number; xpOnly: number }>;
}

const CasinoContext = createContext<CasinoContextValue>({
  dailyWins: 0, dailyWinCap: DAILY_WIN_CAP, remainingCap: DAILY_WIN_CAP,
  capReached: false, isLoaded: false,
  recordCasinoWin: async () => ({ chipsAwarded: 0, xpOnly: 0 }),
});

function todayKey(): string {
  return `casino_daily_${new Date().toISOString().split('T')[0]}`;
}

export function CasinoProvider({ children }: { children: React.ReactNode }) {
  const [dailyWins, setDailyWins] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(todayKey()).then(raw => {
      const saved = raw ? (JSON.parse(raw) as CasinoDay) : null;
      setDailyWins(saved?.totalWins ?? 0);
      setIsLoaded(true);
    }).catch(() => setIsLoaded(true));
  }, []);

  const recordCasinoWin = useCallback(async (grossWin: number) => {
    if (grossWin <= 0) return { chipsAwarded: 0, xpOnly: 0 };
    const key = todayKey();
    const raw  = await AsyncStorage.getItem(key).catch(() => null);
    const saved: CasinoDay = raw ? JSON.parse(raw) : { date: key, totalWins: 0 };
    const remaining    = Math.max(0, DAILY_WIN_CAP - saved.totalWins);
    const chipsAwarded = Math.min(grossWin, remaining);
    const xpOnly       = grossWin - chipsAwarded;
    saved.totalWins    = Math.min(saved.totalWins + grossWin, DAILY_WIN_CAP);
    await AsyncStorage.setItem(key, JSON.stringify(saved)).catch(() => {});
    setDailyWins(saved.totalWins);
    return { chipsAwarded, xpOnly };
  }, []);

  return (
    <CasinoContext.Provider value={{
      dailyWins,
      dailyWinCap:  DAILY_WIN_CAP,
      remainingCap: Math.max(0, DAILY_WIN_CAP - dailyWins),
      capReached:   dailyWins >= DAILY_WIN_CAP,
      isLoaded,
      recordCasinoWin,
    }}>
      {children}
    </CasinoContext.Provider>
  );
}

export function useCasino(): CasinoContextValue {
  return useContext(CasinoContext);
}
