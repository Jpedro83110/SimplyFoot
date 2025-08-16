import { Platform } from 'react-native';
import { supabase } from './supabase';

let Notifications = null;
let AsyncStorage = null;
let Device = null;

if (Platform.OS !== 'web') {
    Notifications = require('expo-notifications');
    AsyncStorage = require('@react-native-async-storage/async-storage').default;
    Device = require('expo-device');
}

// Configuration des notifications pour iOS/Android
if (Platform.OS !== 'web') {
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
        }),
    });
}

//
// 🔔 FONCTION PRINCIPALE - Initialisation complète des notifications
//
export async function setupNotifications(userId = null) {
    if (Platform.OS === 'web') {
        console.log('[Web] Notifications non supportées sur web');
        return null;
    }

    try {
        console.log('🔔 Début configuration notifications pour userId:', userId);

        // 1. Vérifier que c'est un device physique
        if (!Device.default.isDevice) {
            console.warn('Les notifications push ne fonctionnent que sur un appareil physique');
            return null;
        }

        // 2. Demander les permissions
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.warn('❌ Permissions notifications refusées');
            return null;
        }

        console.log('✅ Permissions notifications accordées');

        // 3. Récupérer le token Expo Push
        const tokenData = await Notifications.getExpoPushTokenAsync({
            projectId: process.env.EXPO_PUBLIC_PROJECT_ID || 'your-expo-project-id', // Remplacez par votre Project ID
        });

        const expoPushToken = tokenData.data;
        console.log('🎯 Token Expo Push généré:', expoPushToken);

        // 4. Sauvegarder localement
        await AsyncStorage.setItem('expo_push_token', expoPushToken);

        // 5. Sauvegarder en base dans la table utilisateurs si userId fourni
        if (userId && expoPushToken) {
            await saveTokenToUserTable(userId, expoPushToken);
        }

        return expoPushToken;
    } catch (error) {
        console.error('❌ Erreur configuration notifications:', error);
        return null;
    }
}

//
// 💾 Sauvegarder le token dans la table utilisateurs
//
export async function saveTokenToUserTable(userId, expoPushToken) {
    try {
        console.log('💾 Sauvegarde token dans table utilisateurs...', {
            userId,
            token: expoPushToken,
        });

        // Vérifier d'abord si le token a changé
        const { data: currentUser, error: fetchError } = await supabase
            .from('utilisateurs')
            .select('expo_push_token')
            .eq('id', userId)
            .single();

        if (fetchError) {
            console.error('❌ Erreur récupération utilisateur:', fetchError);
            return;
        }

        // Si le token est différent, le mettre à jour
        if (currentUser.expo_push_token !== expoPushToken) {
            const { error: updateError } = await supabase
                .from('utilisateurs')
                .update({
                    expo_push_token: expoPushToken,
                })
                .eq('id', userId);

            if (updateError) {
                console.error('❌ Erreur sauvegarde token:', updateError);
            } else {
                console.log('✅ Token mis à jour dans table utilisateurs');
            }
        } else {
            console.log('ℹ️ Token identique, pas de mise à jour nécessaire');
        }
    } catch (error) {
        console.error('❌ Erreur saveTokenToUserTable:', error);
    }
}

//
// 🔄 Récupérer le token depuis la base de données
//
export async function getTokenFromDatabase(userId) {
    try {
        const { data, error } = await supabase
            .from('utilisateurs')
            .select('expo_push_token')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Erreur récupération token BDD:', error);
            return null;
        }

        return data?.expo_push_token || null;
    } catch (error) {
        console.error('❌ Erreur getTokenFromDatabase:', error);
        return null;
    }
}

//
// 🔄 Récupérer le token stocké localement
//
export async function getStoredExpoPushToken() {
    if (Platform.OS === 'web') {
        return null;
    }

    try {
        const token = await AsyncStorage.getItem('expo_push_token');
        return token;
    } catch (error) {
        console.error('Erreur récupération token local:', error);
        return null;
    }
}

//
// 🗑️ Supprimer le token (déconnexion)
//
export async function removeExpoPushToken(userId) {
    try {
        console.log('🗑️ Suppression token pour userId:', userId);

        // Supprimer de la base (mettre à NULL)
        if (userId) {
            const { error } = await supabase
                .from('utilisateurs')
                .update({ expo_push_token: null })
                .eq('id', userId);

            if (error) {
                console.error('❌ Erreur suppression token base:', error);
            } else {
                console.log('✅ Token supprimé de la base (mis à NULL)');
            }
        }

        // Supprimer localement
        if (Platform.OS !== 'web') {
            await AsyncStorage.removeItem('expo_push_token');
            console.log('✅ Token supprimé localement');
        }
    } catch (error) {
        console.error('❌ Erreur removeExpoPushToken:', error);
    }
}

//
// 🔍 Récupérer tous les tokens pour envoyer des notifications en masse
//
export async function getAllActiveTokens(clubId = null) {
    try {
        let query = supabase
            .from('utilisateurs')
            .select('id, expo_push_token, nom, prenom')
            .not('expo_push_token', 'is', null);

        // Filtrer par club si spécifié
        if (clubId) {
            query = query.eq('club_id', clubId);
        }

        const { data, error } = await query;

        if (error) {
            console.error('❌ Erreur récupération tokens:', error);
            return [];
        }

        // Retourner seulement les tokens valides
        return data
            .filter((user) => user.expo_push_token && user.expo_push_token.trim() !== '')
            .map((user) => ({
                userId: user.id,
                token: user.expo_push_token,
                nom: user.nom,
                prenom: user.prenom,
            }));
    } catch (error) {
        console.error('❌ Erreur getAllActiveTokens:', error);
        return [];
    }
}

//
// 🔔 Envoi d'une notification locale
//
export async function envoyerNotificationLocale(titre, corps, data = {}) {
    if (Platform.OS === 'web') {
        console.log(`[Web] Notification simulée : ${titre} - ${corps}`);
        return;
    }

    try {
        await Notifications.scheduleNotificationAsync({
            content: {
                title: titre,
                body: corps,
                sound: true,
                data: data,
            },
            trigger: null, // Immédiat
        });

        console.log('✅ Notification locale envoyée');
    } catch (error) {
        console.error('❌ Erreur notification locale:', error);
    }
}

//
// 📱 Configuration des listeners pour les notifications reçues
//
export function setupNotificationListeners() {
    if (Platform.OS === 'web') {
        return;
    }

    // Listener pour les notifications reçues quand l'app est ouverte
    const notificationListener = Notifications.addNotificationReceivedListener((notification) => {
        console.log('🔔 Notification reçue:', notification);
        // Vous pouvez traiter la notification ici
    });

    // Listener pour les interactions avec les notifications
    const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
        console.log('👆 Notification touchée:', response);
        // Naviguer vers un écran spécifique, etc.
        const data = response.notification.request.content.data;
        if (data) {
            console.log('📄 Données notification:', data);
            // Exemple : naviguer vers un écran spécifique
            // navigation.navigate('EventDetails', { eventId: data.eventId });
        }
    });

    // Fonction de nettoyage
    return () => {
        Notifications.removeNotificationSubscription(notificationListener);
        Notifications.removeNotificationSubscription(responseListener);
    };
}

//
// 🚀 Fonction utilitaire pour initialiser lors du login
//
export async function initializeNotificationsForUser(userId) {
    try {
        console.log('🚀 Initialisation notifications pour utilisateur:', userId);

        // 1. Configurer les notifications et récupérer le token
        const newToken = await setupNotifications(userId);

        if (newToken) {
            console.log('✅ Notifications initialisées avec succès');

            // 2. Configurer les listeners
            const cleanup = setupNotificationListeners();

            return { token: newToken, cleanup };
        } else {
            console.warn("⚠️ Impossible d'initialiser les notifications");
            return { token: null, cleanup: null };
        }
    } catch (error) {
        console.error('❌ Erreur initializeNotificationsForUser:', error);
        return { token: null, cleanup: null };
    }
}

//
// ✅ Récupération des événements vus (votre code existant)
//
export async function getVuEvenements() {
    try {
        if (Platform.OS === 'web') {
            const data = localStorage.getItem('vu_evenements');
            return data ? JSON.parse(data) : [];
        } else {
            const data = await AsyncStorage.getItem('vu_evenements');
            return data ? JSON.parse(data) : [];
        }
    } catch (error) {
        console.error('❌ Erreur getVuEvenements:', error);
        return [];
    }
}

//
// ✅ Enregistrement des événements vus (votre code existant)
//
export async function setVuEvenements(ids) {
    const stringified = JSON.stringify(ids);

    if (Platform.OS === 'web') {
        localStorage.setItem('vu_evenements', stringified);
    } else {
        await AsyncStorage.setItem('vu_evenements', stringified);
    }
}
