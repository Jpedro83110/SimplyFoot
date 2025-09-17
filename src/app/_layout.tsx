import { FC, useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, StatusBar, Platform } from 'react-native';
import { Slot } from 'expo-router';
import WebSocketManager from '@/components/business/WebSocketManager';
import Toast from 'react-native-toast-message';

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { deleteMessagesPrivesOneWeekOld } from '@/helpers/messagesPrives.helpers';
import { AuthProvider } from '@/contexts/AuthContext';
import SplashScreenController from './SplashScreenController';
import { useSession } from '@/hooks/useSession';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: false, // FIXME ajouté parce que erreur de transpilation
        shouldShowList: false, // FIXME ajouté parce que erreur de transpilation
    }),
});

const PrivateGlobalLayout: FC = () => {
    const [pushTokenSetupDone, setPushTokenSetupDone] = useState(false);
    const { updateUserData, utilisateur } = useSession();

    const setupPushToken = useCallback(async () => {
        if (!Device.isDevice || Platform.OS === 'web') {
            return;
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            return;
        }

        // Pour éviter une erreur si expoConfig est undefined en build prod
        const projectId =
            Constants?.expoConfig?.extra?.eas?.projectId ||
            (Constants?.manifest as any)?.extra?.eas?.projectId ||
            'TON_PROJECT_ID_MANUEL'; // fallback
        // FIXME : Constants?.manifest?.extra?.eas?.projectId -> extra does not exist

        const tokenData = await Notifications.getExpoPushTokenAsync({
            projectId,
        });

        const expoToken = tokenData.data;

        updateUserData({ utilisateurData: { expo_push_token: expoToken } });
        setPushTokenSetupDone(true);
    }, [updateUserData]);

    useEffect(() => {
        if (pushTokenSetupDone || !utilisateur) {
            return;
        }

        deleteMessagesPrivesOneWeekOld();
        setupPushToken();
    }, [pushTokenSetupDone, setupPushToken, utilisateur]);

    return (
        <>
            <StatusBar barStyle="light-content" />
            <WebSocketManager />
            <View style={styles.container}>
                <Slot />
            </View>
        </>
    );
};

export default function GlobalLayout() {
    return (
        <AuthProvider>
            <PrivateGlobalLayout />
            <SplashScreenController />
            <Toast />
        </AuthProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
    },
    badge: {
        color: '#00ff88',
        fontWeight: 'bold',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 10,
        backgroundColor: '#1e1e1e',
        padding: 6,
        borderRadius: 8,
        alignSelf: 'center',
    },
});
