// import { useEffect, useState } from 'react';
import { Slot, /*useRouter, useSegments,*/ usePathname } from 'expo-router';
// import { View, ActivityIndicator, Platform } from 'react-native';
// import { supabase } from '../../lib/supabase';
// import * as Notifications from 'expo-notifications';
// import * as Device from 'expo-device';
import Header from '../../components/business/Header';
// import { useSession } from '@/hooks/useSession';

export default function JoueurLayout() {
    // const router = useRouter();
    // const segments = useSegments();
    const pathname = usePathname();
    // const [checking, setChecking] = useState(true);
    // const { utilisateur } = useSession();

    // FIXME: revoir le code de gestion des tokens, il génère l'erreur suivante :
    // [PUSH] Erreur lors de l'enregistrement du token [Error: Make sure to complete the guide at https://docs.expo.dev/push-notifications/fcm-credentials/ : Default FirebaseApp is not initialized in this process com.simplyfoot.app. Make sure to call FirebaseApp.initializeApp(Context) first.]
    // useEffect(() => {
    //     let isMounted = true;

    //     const checkRoleAndRegisterToken = async () => {
    //         if (!isMounted) {
    //             return;
    //         }

    //         // Notifications push uniquement sur mobile natif
    //         if (Platform.OS !== 'web' && Device.isDevice && utilisateur?.role === 'joueur') {
    //             try {
    //                 const { status: existingStatus } = await Notifications.getPermissionsAsync();
    //                 let finalStatus = existingStatus;

    //                 if (existingStatus !== 'granted') {
    //                     const { status } = await Notifications.requestPermissionsAsync();
    //                     finalStatus = status;
    //                 }

    //                 if (finalStatus === 'granted') {
    //                     const tokenData = await Notifications.getExpoPushTokenAsync();
    //                     const token = tokenData?.data;

    //                     if (token) {
    //                         if (
    //                             !utilisateur.expo_push_token ||
    //                             utilisateur.expo_push_token !== token
    //                         ) {
    //                             const { error: updateError } = await supabase
    //                                 .from('utilisateurs')
    //                                 .update({ expo_push_token: token })
    //                                 .eq('id', utilisateur.id);

    //                             if (updateError) {
    //                                 console.error(
    //                                     '[PUSH] ❌ Erreur enregistrement token :',
    //                                     updateError.message,
    //                                 );
    //                             } else {
    //                                 console.log('[PUSH] ✅ Token mis à jour');
    //                             }
    //                         }
    //                     }
    //                 }
    //             } catch (e) {
    //                 // Ici, pas d'alerte bloquante : juste log en console
    //                 console.error("[PUSH] Erreur lors de l'enregistrement du token", e);
    //             }
    //         }

    //         setChecking(false);
    //     };

    //     checkRoleAndRegisterToken();
    // }, [
    //     checking,
    //     router,
    //     segments,
    //     utilisateur?.expo_push_token,
    //     utilisateur?.id,
    //     utilisateur?.role,
    // ]);

    // if (checking) {
    //     return (
    //         <View
    //             style={{
    //                 flex: 1,
    //                 justifyContent: 'center',
    //                 alignItems: 'center',
    //                 backgroundColor: '#121212',
    //             }}
    //         >
    //             <ActivityIndicator size="large" color="#00ff88" />
    //         </View>
    //     );
    // }

    // Titre dynamique facultatif
    const getPageTitle = () => {
        const pathSegments = pathname.split('/');
        const joueurIndex = pathSegments.indexOf('joueur');
        const page = pathSegments[joueurIndex + 1];
        switch (page) {
            case 'dashboard':
                return 'Dashboard Joueur';
            case 'convocation':
                return 'Convocations';
            case 'evenements':
                return 'Événements';
            default:
                return 'Espace Joueur';
        }
    };

    return (
        <>
            <Header title={getPageTitle()} showBack={pathname !== '/joueur/dashboard'} />
            <Slot />
        </>
    );
}
