import { Platform } from 'react-native';

const primaryColor = '#8A2BE2'; // BlueViolet for a vibrant look
const secondaryColor = '#FF007F'; // Rose/Pink accent
const darkBg = '#0D0D12';
const lightBg = '#F7F7FA';

export const Colors = {
  light: {
    primary: primaryColor,
    secondary: secondaryColor,
    text: '#1A1A1A',
    textMuted: '#687076',
    background: lightBg,
    card: '#FFFFFF',
    border: '#EAEAEE',
    tint: primaryColor,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: primaryColor,
  },
  dark: {
    primary: primaryColor,
    secondary: secondaryColor,
    text: '#FFFFFF',
    textMuted: '#9BA1A6',
    background: darkBg,
    card: '#1A1A24',
    border: '#2A2A35',
    tint: primaryColor,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: primaryColor,
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
