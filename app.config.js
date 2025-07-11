export default {
  name: 'SimplyFoot',
  slug: 'simplyfoot',
  version: '1.0.0',
  scheme: 'simplyfoot',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/icon.png',
    resizeMode: 'contain',
    backgroundColor: '#121212',
  },
  updates: {
    enabled: true,
    fallbackToCacheTimeout: 0,
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.simplyfoot.app',
  },
  android: {
    package: 'com.simplyfoot.app',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon-foreground.png',
      backgroundColor: '#121212',
    },
    permissions: ['NOTIFICATIONS'],
  },
  web: {
    favicon: './assets/icon.png',
    bundler: 'metro',
  },
  plugins: [
    'expo-router',
    'expo-notifications',
    'expo-sqlite',
    [
      'expo-image-picker',
      {
        photosPermission: "L'application accède à vos photos pour vous permettre de partager avec vos amis."
      }
    ]
  ],
  extra: {
    eas: {
      projectId: 'c9c1a41e-d1ef-4769-9d5e-f531af72bd3b',
    },
  },
};