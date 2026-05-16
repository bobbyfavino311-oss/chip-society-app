import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { ColorTheme } from '@/constants/colors';

interface ThemeContextValue {
  theme: ColorTheme;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  isDark: true,
  toggleTheme: () => {},
});

const STORAGE_KEY = '@neon_river_theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ColorTheme>('dark');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(val => {
      if (val === 'light' || val === 'dark') setTheme(val);
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      AsyncStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, isDark: theme === 'dark', toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
