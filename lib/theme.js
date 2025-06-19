import { useColorScheme } from 'react-native';

export function useTheme() {
  const scheme = useColorScheme(); // 'dark' ou 'light'
  const isDark = scheme === 'dark';

  const colors = {
    primary: '#00ff88',
    secondary: '#2980b9',
    background: isDark ? '#121212' : '#ffffff',
    surface: isDark ? '#1e1e1e' : '#f0f0f0',
    text: isDark ? '#ffffff' : '#111111',
    border: isDark ? '#333' : '#ddd',
    inputBackground: isDark ? '#2a2a2a' : '#f5f5f5',
    link: '#00c2ff',
    success: '#2ecc71',
    error: '#e74c3c',
    warning: '#f39c12',
    transparent: 'rgba(0, 0, 0, 0)',
  };

  const fonts = {
    regular: 'System',
    bold: 'System',
    size: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 20,
      xl: 24,
    },
  };

  const spacing = {
    xs: 6,
    sm: 12,
    md: 16,
    lg: 24,
    xl: 32,
  };

  const radius = {
    sm: 6,
    md: 12,
    lg: 20,
  };

  const shadows = {
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 5,
    },
  };

  const components = {
    button: {
      paddingVertical: 12,
      paddingHorizontal: 20,
      backgroundColor: colors.primary,
      borderRadius: radius.md,
      alignItems: 'center',
    },
    buttonText: {
      color: isDark ? '#111' : '#000', // Tu peux changer ici pour assurer contraste
      fontWeight: '700',
      fontSize: fonts.size.md,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.md,
      ...shadows.card,
    },
  };

  return {
    isDark,
    colors,
    fonts,
    spacing,
    radius,
    shadows,
    components,
  };
}

// Optionnel : thème statique exportable pour les fichiers qui ne supportent pas les hooks
export const THEME_DEFAULT = {
  isDark: false,
  colors: {
    primary: '#00ff88',
    // ...etc (à recopier si besoin)
  },
  // etc.
};
