import { Platform } from 'react-native';

// Core palette
const primaryColor = '#8A2BE2'; // BlueViolet
const secondaryColor = '#FF007F'; // Rose/Pink accent
const darkBg = '#09090F';
const lightBg = '#F5F5FA';

// Gradient stops
export const Gradients = {
  primary: [primaryColor, '#B24BF3', secondaryColor] as const,
  primaryButton: [primaryColor, '#A040F0'] as const,
  header: ['#1A0A30', '#0D0D12'] as const,
  cardBorder: [`${primaryColor}40`, `${secondaryColor}40`] as const,
};

export const Colors = {
  light: {
    primary: primaryColor,
    secondary: secondaryColor,
    text: '#1A1A1A',
    textMuted: '#6B7280',
    background: lightBg,
    card: '#FFFFFF',
    cardElevated: '#FFFFFF',
    border: '#E5E7EB',
    tint: primaryColor,
    icon: '#6B7280',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: primaryColor,
    inputBackground: '#F9FAFB',
    inputBorder: '#D1D5DB',
    inputFocusBorder: primaryColor,
    // Semantic
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    dangerLight: '#FEE2E2',
    successLight: '#D1FAE5',
    warningLight: '#FEF3C7',
    // Tab bar
    tabBarBackground: 'rgba(255,255,255,0.92)',
    tabBarBorder: '#E5E7EB',
  },
  dark: {
    primary: '#9D4EDD',
    secondary: '#FF3D8F',
    text: '#F9FAFB',
    textMuted: '#9CA3AF',
    background: darkBg,
    card: '#16161F',
    cardElevated: '#1E1E2A',
    border: '#2D2D3A',
    tint: '#9D4EDD',
    icon: '#9CA3AF',
    tabIconDefault: '#6B7280',
    tabIconSelected: '#9D4EDD',
    inputBackground: '#13131A',
    inputBorder: '#2D2D3A',
    inputFocusBorder: '#9D4EDD',
    // Semantic
    success: '#34D399',
    warning: '#FBBF24',
    danger: '#F87171',
    dangerLight: '#451A1A',
    successLight: '#0D3320',
    warningLight: '#3D2F08',
    // Tab bar
    tabBarBackground: 'rgba(9,9,15,0.92)',
    tabBarBorder: '#1E1E2A',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
};

export const Shadows = Platform.select({
  ios: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 3,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
    },
  },
  default: {
    sm: { elevation: 2 },
    md: { elevation: 4 },
    lg: { elevation: 8 },
  },
  web: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 3,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
    },
  },
});

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

// Max content width for web layout
export const WEB_MAX_WIDTH = 680;
