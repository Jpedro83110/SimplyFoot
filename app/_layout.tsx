import { FC, useEffect, useState } from 'react';
import { View, StyleSheet, StatusBar, Text, Platform } from 'react-native';
import { Slot } from 'expo-router';
import WebSocketManager from '../components/business/WebSocketManager';
import { supabase } from '../lib/supabase';
import Toast from 'react-native-toast-message';

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { deleteMessagesPrivesOneWeekOld } from '@/helpers/messagesPrives.helper';
import { AuthProvider } from '@/context/AuthContext';
import SplashScreenController from './SplashScreenController';

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
    const [role, setRole] = useState(null);
    const [, setLoading] = useState(true); // FIXME

    useEffect(() => {
        const fetchRole = async () => {
            const {
                data: { session },
            } = await supabase.auth.getSession();
            if (!session) {
                return setLoading(false);
            }

            const { data: user, error } = await supabase
                .from('utilisateurs')
                .select('role')
                .eq('id', session.user.id)
                .single();

            if (!error && user?.role) {
                setRole(user.role);
            }

            setLoading(false);
        };

        const purgeOldMessages = async () => {
            const {
                data: { session },
            } = await supabase.auth.getSession();
            if (!session) {
                return;
            }

            try {
                await deleteMessagesPrivesOneWeekOld();
            } catch (error) {
                // FIXME: seems useless, never called on 4XX errors
                // FIXME: implements messages_prives real ttl
                console.warn('Erreur purge automatique messages :', (error as Error).message);
            }
        };

        const setupPushToken = async () => {
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

            const {
                data: { session },
            } = await supabase.auth.getSession();
            const userId = session?.user?.id;

            if (userId && expoToken) {
                await supabase
                    .from('utilisateurs')
                    .update({ expo_token: expoToken })
                    .eq('id', userId);
            }
        };

        fetchRole();
        purgeOldMessages();
        setupPushToken();
    }, []);

    return (
        <>
            <StatusBar barStyle="light-content" />
            <WebSocketManager />
            <View style={styles.overlay}>
                {role === 'admin' && <Text style={styles.badge}>👑 MODE ADMIN</Text>}
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
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
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
