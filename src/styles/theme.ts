// src/styles/theme.ts

export const theme = {
  colors: {
    primary: '#4ecdc4',
    secondary: '#ff6b6b',
    background: {
      dark: '#0f0c29',
      mid: '#302b63',
      light: '#24243e',
    },
    glass: {
      bg: 'rgba(255, 255, 255, 0.05)',
      border: 'rgba(255, 255, 255, 0.1)',
      hover: 'rgba(255, 255, 255, 0.08)',
    },
    text: {
      primary: '#e0e0ff',
      secondary: '#888888',
      accent: '#4ecdc4',
    },
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    full: '50%',
  },
  animations: {
    fast: '0.15s ease',
    normal: '0.3s ease',
    slow: '0.5s ease',
  },
} as const
