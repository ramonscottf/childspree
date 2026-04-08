import { MD3LightTheme } from 'react-native-paper';

export const theme = {
  colors: {
    primary: '#E8548C',
    primaryDark: '#D4537E',
    primaryLight: '#F4C0D1',
    background: '#FFFFFF',
    surface: '#F8F8F8',
    text: '#1A1A1A',
    textSecondary: '#666666',
    border: '#E0E0E0',
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
  },
  fonts: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
};

export const paperTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#E8548C',
    secondary: '#D4537E',
    surface: '#FFFFFF',
    background: '#F8F8F8',
  },
};
