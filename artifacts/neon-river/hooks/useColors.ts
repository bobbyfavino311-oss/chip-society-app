import { getColors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';

export function useColors() {
  const { theme } = useTheme();
  return getColors(theme);
}
