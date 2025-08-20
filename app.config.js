import packageJson from './package.json';

export default {
    name: 'SimplyFoot',
    slug: 'simplyfoot',
    version: packageJson.version,
    scheme: 'simplyfoot',
    orientation: 'portrait',
    icon: './src/assets/logo-v2.png',
    userInterfaceStyle: 'automatic',
    splash: {
        image: './src/assets/logo-v2.png',
        resizeMode: 'contain',
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
            foregroundImage: './src/assets/logo-v2.png',
        },
        permissions: ['NOTIFICATIONS'],
    },
    web: {
        favicon: './src/assets/logo-v2.png',
        bundler: 'metro',
    },
    plugins: [
        'expo-router',
        'expo-notifications',
        'expo-sqlite',
        [
            'expo-image-picker',
            {
                photosPermission:
                    "L'application accède à vos photos pour vous permettre de partager avec vos amis.",
            },
        ],
    ],
    extra: {
        eas: {
            projectId: 'c9c1a41e-d1ef-4769-9d5e-f531af72bd3b',
        },
    },
};
