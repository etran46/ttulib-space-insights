import { createContext, useContext, useState, useEffect } from 'react';

export const THEMES = {
  default: {
    label: 'Default',
    swatches: ['#CC0000', '#22c55e', '#f59e0b', '#3b82f6'],
    colors: {
      primary: '#CC0000',
      primaryLight: '#fee2e2',
      primaryDark: '#990000',
      bg: '#f8fafc',
      surface: '#ffffff',
      surfaceHover: '#f8fafc',
      border: '#e2e8f0',
      bgSubtle: '#f1f5f9',
      heading: '#0f172a',
      body: '#1e293b',
      secondary: '#64748b',
      muted: '#94a3b8',
      statusGreen: '#22c55e',
      statusGreenBg: '#dcfce7',
      statusGreenText: '#16a34a',
      statusAmber: '#f59e0b',
      statusAmberBg: '#fef9c3',
      statusAmberText: '#ca8a04',
      statusRed: '#ef4444',
      statusRedBg: '#fee2e2',
      statusRedText: '#dc2626',
      accent: '#3b82f6',
      accentBg: '#eff6ff',
      chartGrid: '#f1f5f9',
      tooltipBg: '#1e293b',
      tooltipText: '#ffffff',
      tooltipMuted: '#94a3b8',
      headerBg: '#ffffff',
      headerBorder: '#e2e8f0',
      navActive: '#CC0000',
      navInactive: '#64748b',
      navHover: '#f1f5f9',
      positiveText: '#16a34a',
      negativeText: '#ef4444',
      chartColors: ['#CC0000', '#f59e0b', '#22c55e', '#3b82f6'],
      barColors: ['#CC0000', '#e05c52', '#f09a94', '#fbc9c6'],
    },
  },

  highContrast: {
    label: 'High Contrast',
    swatches: ['#990000', '#004400', '#664400', '#003388'],
    colors: {
      primary: '#990000',
      primaryLight: '#ffd0d0',
      primaryDark: '#660000',
      bg: '#ffffff',
      surface: '#ffffff',
      surfaceHover: '#f0f0f0',
      border: '#000000',
      bgSubtle: '#e8e8e8',
      heading: '#000000',
      body: '#000000',
      secondary: '#111111',
      muted: '#333333',
      statusGreen: '#004400',
      statusGreenBg: '#c6ffc6',
      statusGreenText: '#003300',
      statusAmber: '#664400',
      statusAmberBg: '#ffeeaa',
      statusAmberText: '#443300',
      statusRed: '#880000',
      statusRedBg: '#ffd0d0',
      statusRedText: '#660000',
      accent: '#003388',
      accentBg: '#d0e4ff',
      chartGrid: '#888888',
      tooltipBg: '#000000',
      tooltipText: '#ffffff',
      tooltipMuted: '#cccccc',
      headerBg: '#ffffff',
      headerBorder: '#000000',
      navActive: '#990000',
      navInactive: '#222222',
      navHover: '#eeeeee',
      positiveText: '#003300',
      negativeText: '#880000',
      chartColors: ['#990000', '#664400', '#003388', '#004400'],
      barColors: ['#990000', '#bb5500', '#993300', '#cc7700'],
    },
  },

  deuteranopia: {
    label: 'Colorblind (D/P)',
    swatches: ['#CC0000', '#0077cc', '#dd6b20', '#7c3aed'],
    colors: {
      primary: '#CC0000',
      primaryLight: '#fee2e2',
      primaryDark: '#990000',
      bg: '#f8fafc',
      surface: '#ffffff',
      surfaceHover: '#f8fafc',
      border: '#e2e8f0',
      bgSubtle: '#f1f5f9',
      heading: '#0f172a',
      body: '#1e293b',
      secondary: '#64748b',
      muted: '#94a3b8',
      // Blue = Available/Good, Orange = Caution, Purple = Alert
      statusGreen: '#0077cc',
      statusGreenBg: '#dbeafe',
      statusGreenText: '#1d4ed8',
      statusAmber: '#dd6b20',
      statusAmberBg: '#fed7aa',
      statusAmberText: '#9a3412',
      statusRed: '#7c3aed',
      statusRedBg: '#ede9fe',
      statusRedText: '#5b21b6',
      accent: '#0077cc',
      accentBg: '#dbeafe',
      chartGrid: '#f1f5f9',
      tooltipBg: '#1e293b',
      tooltipText: '#ffffff',
      tooltipMuted: '#94a3b8',
      headerBg: '#ffffff',
      headerBorder: '#e2e8f0',
      navActive: '#CC0000',
      navInactive: '#64748b',
      navHover: '#f1f5f9',
      positiveText: '#1d4ed8',
      negativeText: '#5b21b6',
      chartColors: ['#CC0000', '#dd6b20', '#0077cc', '#7c3aed'],
      barColors: ['#0077cc', '#3d96dd', '#82bde8', '#c2dff4'],
    },
  },

  dark: {
    label: 'Dark Mode',
    swatches: ['#ff5555', '#4ade80', '#fbbf24', '#60a5fa'],
    colors: {
      primary: '#ff5555',
      primaryLight: '#4d0f0f',
      primaryDark: '#cc3333',
      bg: '#0f172a',
      surface: '#1e293b',
      surfaceHover: '#263449',
      border: '#334155',
      bgSubtle: '#0d1421',
      heading: '#f1f5f9',
      body: '#e2e8f0',
      secondary: '#94a3b8',
      muted: '#64748b',
      statusGreen: '#4ade80',
      statusGreenBg: '#052e16',
      statusGreenText: '#86efac',
      statusAmber: '#fbbf24',
      statusAmberBg: '#2d1a00',
      statusAmberText: '#fcd34d',
      statusRed: '#f87171',
      statusRedBg: '#2d0505',
      statusRedText: '#fca5a5',
      accent: '#60a5fa',
      accentBg: '#0c1a2e',
      chartGrid: '#263449',
      tooltipBg: '#334155',
      tooltipText: '#f1f5f9',
      tooltipMuted: '#94a3b8',
      headerBg: '#1e293b',
      headerBorder: '#334155',
      navActive: '#ff5555',
      navInactive: '#94a3b8',
      navHover: '#263449',
      positiveText: '#86efac',
      negativeText: '#fca5a5',
      chartColors: ['#ff5555', '#fbbf24', '#4ade80', '#60a5fa'],
      barColors: ['#ff5555', '#f87171', '#fca5a5', '#fde2e2'],
    },
  },
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [themeKey, setThemeKey] = useState(() => {
    return localStorage.getItem('ttulib-theme') || 'default';
  });

  useEffect(() => {
    const t = THEMES[themeKey] || THEMES.default;
    document.documentElement.setAttribute('data-theme', themeKey);
    document.body.style.backgroundColor = t.colors.bg;
    localStorage.setItem('ttulib-theme', themeKey);
  }, [themeKey]);

  const theme = THEMES[themeKey] || THEMES.default;

  return (
    <ThemeContext.Provider value={{ themeKey, setThemeKey, theme, colors: theme.colors, THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
