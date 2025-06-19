export default {
  name: 'SimplyFoot',
  slug: 'simplyfoot',
  version: '1.0.0',
  scheme: 'simplyfoot',
  orientation: 'portrait',
  icon: './assets/chat.png',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/chat.png',
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
      foregroundImage: './assets/chat.png',
      backgroundColor: '#121212',
    },
    permissions: ['NOTIFICATIONS'],
  },
  web: {
    favicon: './assets/chat.png',
    bundler: 'metro',
  },
  plugins: ['expo-router'],
  extra: {
    eas: {
      projectId: 'c9c1a41e-d1ef-4769-9d5e-f531af72bd3b',
    },
  },
};
