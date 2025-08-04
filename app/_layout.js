import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ImageBackground, StatusBar, Text, Platform } from 'react-native';
import { Slot } from 'expo-router';
import WebSocketManager from '../components/business/WebSocketManager';
import { supabase } from '../lib/supabase';

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

export default function GlobalLayout() {
    const [role, setRole] = useState(null);
    const [, setLoading] = useState(true); // FIXME

    useEffect(() => {
        const fetchRole = async () => {
            const {
                data: { session },
            } = await supabase.auth.getSession();
            if (!session) return setLoading(false);

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
            if (!session) return;

            try {
                await supabase
                    .from('messages_prives')
                    .delete()
                    .lt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
            } catch (e) {
                console.warn('Erreur purge automatique messages :', e.message);
            }
        };

        const setupPushToken = async () => {
            if (!Device.isDevice || Platform.OS === 'web') return;
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            if (finalStatus !== 'granted') return;

            // Pour éviter une erreur si expoConfig est undefined en build prod
            const projectId =
                Constants?.expoConfig?.extra?.eas?.projectId ||
                Constants?.manifest?.extra?.eas?.projectId ||
                'TON_PROJECT_ID_MANUEL'; // fallback

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
        <ImageBackground
            source={require('../assets/chat.png')}
            style={styles.container}
            resizeMode="cover"
        >
            <StatusBar barStyle="light-content" />
            <WebSocketManager />
            <View style={styles.overlay}>
                {role === 'admin' && <Text style={styles.badge}>👑 MODE ADMIN</Text>}
                <Slot />
            </View>
        </ImageBackground>
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
