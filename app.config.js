import packageJson from './package.json';

export default {
    name: 'SimplyFoot',
    slug: 'simplyfoot',
    version: packageJson.version,
    scheme: 'simplyfoot',
    orientation: 'portrait',
    icon: './src/assets/icon.png',
    userInterfaceStyle: 'automatic',
    splash: {
        image: './src/assets/icon.png',
        resizeMode: 'contain',
        backgroundColor: '#000000',
    },
    updates: {
        enabled: true,
        fallbackToCacheTimeout: 0,
    },
    assetBundlePatterns: ['**/*'],
    ios: {
        supportsTablet: true,
        bundleIdentifier: 'com.simplyfoot.app',
        infoPlist: {
            ITSAppUsesNonExemptEncryption: false,
        },
    },
    android: {
        package: 'com.simplyfoot.app',
        adaptiveIcon: {
            foregroundImage: './src/assets/adaptive-icon-foreground.png',
            backgroundColor: '#000000',
        },
        permissions: ['NOTIFICATIONS'],
    },
    web: {
        favicon: './src/assets/icon.png',
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
            projectId: '5dbffa67-4d68-4bf7-91d4-bff1376f5086',
        },
    },
};
