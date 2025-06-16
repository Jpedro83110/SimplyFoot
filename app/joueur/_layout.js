import { useEffect, useState } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { View, ActivityIndicator, Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

export default function JoueurLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkRoleAndRegisterToken = async () => {
      let session = null;
      let tries = 0;

      while (!session && tries < 5) {
        const { data } = await supabase.auth.getSession();
        session = data?.session;
        if (!session) {
          await new Promise(res => setTimeout(res, 500));
          tries++;
        }
      }

      if (!session) {
        Alert.alert('Erreur', 'Session introuvable');
        router.replace('/auth/login-joueur');
        setChecking(false);
        return;
      }

      const { data: user, error } = await supabase
        .from('utilisateurs')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (error || !user) {
        Alert.alert('Erreur', `Utilisateur introuvable\nErreur: ${error?.message}\nuser: ${JSON.stringify(user)}`);
        router.replace('/auth/login-joueur');
        setChecking(false);
        return;
      }

      const role = user.role;
      console.log('[JOUEUR LAYOUT]', `Rôle détecté : ${role}`);

      if (['joueur', 'admin', 'president'].includes(role)) {
        setAuthorized(true);

        // Redirection auto vers dashboard si on est sur /joueur
        if (segments[1] === 'joueur' && segments.length === 2) {
          router.replace('/joueur/dashboard');
        }

        // --- Bloc notifications sécurisé ---
        if (Device.isDevice && role === 'joueur') {
          try {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
              const { status } = await Notifications.requestPermissionsAsync();
              finalStatus = status;
            }

            if (finalStatus === 'granted') {
              const tokenData = await Notifications.getExpoPushTokenAsync();
              const token = tokenData?.data;

              if (token) {
                const { data: existingUser } = await supabase
                  .from('utilisateurs')
                  .select('expo_push_token')
                  .eq('id', session.user.id)
                  .single();

                if (!existingUser?.expo_push_token || existingUser.expo_push_token !== token) {
                  const { error: updateError } = await supabase
                    .from('utilisateurs')
                    .update({ expo_push_token: token })
                    .eq('id', session.user.id);

                  if (updateError) {
                    console.error('[PUSH] ❌ Erreur enregistrement token :', updateError.message);
                  } else {
                    console.log('[PUSH] ✅ Token mis à jour');
                  }
                }
              }
            }
          } catch (e) {
            console.error('[PUSH] Erreur lors de l’enregistrement du token', e);
            Alert.alert('Erreur notifications', 'La génération du token de notification a échoué (aucune incidence sur la connexion).');
          }
        }
        // --- Fin bloc sécurisé notifications ---

      } else {
        Alert.alert('Erreur', `Rôle non autorisé : ${role}`);
        router.replace('/auth/login-joueur');
        setChecking(false);
        return;
      }

      // Important : setChecking à la fin pour débloquer l'affichage !
      setChecking(false);
    };

    checkRoleAndRegisterToken();
  }, []);

  if (checking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' }}>
        <ActivityIndicator size="large" color="#00ff88" />
      </View>
    );
  }

  return authorized ? <Slot /> : null;
}
