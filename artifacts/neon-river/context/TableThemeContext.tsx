import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import {
  ALL_TABLE_THEMES,
  NEON_DEFAULT,
  TableTheme,
  ThemeId,
} from '@/constants/tableThemes';

const STORAGE_KEY = '@chip_society/table_theme';

interface TableThemeContextValue {
  theme: TableTheme;
  setTheme: (id: ThemeId) => void;
  isLoaded: boolean;
}

const TableThemeContext = createContext<TableThemeContextValue>({
  theme: NEON_DEFAULT,
  setTheme: () => {},
  isLoaded: false,
});

export function TableThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<TableTheme>(NEON_DEFAULT);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored) {
        const found = ALL_TABLE_THEMES.find((t) => t.id === stored);
        if (found) setThemeState(found);
      }
      setIsLoaded(true);
    });
  }, []);

  const setTheme = useCallback((id: ThemeId) => {
    const found = ALL_TABLE_THEMES.find((t) => t.id === id);
    if (!found) return;
    setThemeState(found);
    AsyncStorage.setItem(STORAGE_KEY, id);
  }, []);

  return (
    <TableThemeContext.Provider value={{ theme, setTheme, isLoaded }}>
      {children}
    </TableThemeContext.Provider>
  );
}

export function useTableTheme() {
  return useContext(TableThemeContext);
}
