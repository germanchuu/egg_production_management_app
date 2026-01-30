/**
 * Theme Configuration
 *
 * Exports resolved Tailwind theme values for use in React Native components
 * that don't support className prop (e.g., Expo Router navigation options).
 *
 * Usage:
 * ```typescript
 * import { theme } from '@/core/theme';
 *
 * const styles = {
 *   backgroundColor: theme.colors.primary['500'],
 *   padding: parseInt(theme.spacing.md),
 *   fontSize: parseInt(theme.fontSize.base[0]),
 * };
 * ```
 */

import resolveConfig from 'tailwindcss/resolveConfig';
import tailwindConfig from '@/../tailwind.config';

// Resolve Tailwind config to get theme values
const config = resolveConfig(tailwindConfig);

/**
 * Resolved Tailwind theme with colors, spacing, fontSize, and fontWeight
 */
export const theme = {
  colors: config.theme.colors as any,
  spacing: config.theme.spacing as any,
  fontSize: config.theme.fontSize as any,
  fontWeight: config.theme.fontWeight as any,
};
