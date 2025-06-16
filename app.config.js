export default {
  name: 'SimplyFoot',
  slug: 'simplyfoot',
  version: '1.0.0',
  scheme: 'simplyfoot',
  orientation: 'portrait',
  icon: './assets/logo.png',
  userInterfaceStyle: 'automatic',

  splash: {
    image: './assets/logo.png',
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
    bundleIdentifier: 'com.simplyfoot.app'
  },

  android: {
    package: 'com.simplyfoot.app',
    googleServicesFile: './android/app/google-services.json',
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
      projectId: 'c9c1a41e-d1ef-4769-9d5e-f531af72bd3b'
    }
  },

  plugins: ['expo-router']
};
