export default {
  name: 'SimplyFoot',
  slug: 'simplyfoot',
  version: '1.0.0',
  scheme: 'simplyfoot', // Profondeur pour les liens internes
  orientation: 'portrait',
  icon: './assets/logo.png',
  userInterfaceStyle: 'automatic', // Basculer entre clair/sombre automatiquement

  splash: {
    image: './assets/logo.png',
    resizeMode: 'contain',
    backgroundColor: '#121212', // cohérent avec ton thème dark pro
  },

  updates: {
    enabled: true,
    fallbackToCacheTimeout: 0,
  },

  assetBundlePatterns: ['**/*'],

  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.simplyfoot.app'
  },

  android: {
    package: 'com.simplyfoot.app',
    adaptiveIcon: {
      foregroundImage: './assets/logo.png',
      backgroundColor: '#121212',
    },
    permissions: []
  },

  web: {
    favicon: './assets/logo.png',
    bundler: 'metro'
  },

  extra: {
    eas: {
      projectId: 'your-eas-project-id' // à ajouter si tu build avec EAS
    }
  },

  plugins: [
    'expo-router'
  ]
};
