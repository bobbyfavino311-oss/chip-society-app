import colors from "@/constants/colors";

/**
 * Returns the design tokens. This project uses a single (dark-only) palette
 * defined in constants/colors.ts, so this hook just re-exports it directly.
 */
export function useColors() {
  return colors;
}
