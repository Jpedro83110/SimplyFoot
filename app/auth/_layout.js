import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image, TouchableOpacity } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { isAdmin } from '../../lib/authGuard';
import { useSessionReady } from '../../lib/useSessionReady';
import * as Linking from 'expo-linking';

export default function AuthLayout() {
  const router = useRouter();
  const { session, checking } = useSessionReady();
  const [redirecting, setRedirecting] = useState(false);
  const segments = useSegments();

  // 🔗 Interception des liens Supabase (type=recovery)
  useEffect(() => {
    const handleDeepLink = (event) => {
      let url = event.url;

      if (url.includes('#')) {
        url = url.replace('#', '?');
      }

      const parsed = Linking.parse(url);
      const accessToken = parsed.queryParams?.access_token;
      const type = parsed.queryParams?.type;

      if (type === 'recovery' && accessToken) {
        router.replace({
          pathname: '/auth/reset-password',
          params: { access_token: accessToken },
        });
      }
    };

    // 🔄 Événement lors du clic sur un lien dans l'email
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // ⚡ Gestion du lien lors du lancement de l'app (appli fermée)
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, [router]);

  // 🔁 Redirection utilisateur connectés selon leur rôle
  useEffect(() => {
    const shouldRedirect = () => {
      const currentRoute = segments.join('/');
      return (
        currentRoute === 'auth' ||
        currentRoute === 'auth/index' ||
        currentRoute === 'auth/_layout'
      );
    };

    const redirectUser = async () => {
      if (!session?.user || redirecting || !shouldRedirect()) return;

      const userEmail = session.user.email;
      console.log('[AUTH] Email détecté :', userEmail);
      setRedirecting(true);

      if (isAdmin(userEmail)) {
        router.replace('/admin/dashboard');
        return;
      }

      const { data: user, error } = await supabase
        .from('utilisateurs')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (error || !user?.role) {
        console.warn('[AUTH] Erreur récupération rôle :', error);
        setRedirecting(false);
        return;
      }

      const role = user.role;
      console.log('[AUTH] Rôle récupéré :', role);

      switch (role) {
        case 'president':
          router.replace('/president/dashboard');
          break;
        case 'coach':
        case 'staff':
          router.replace('/coach/dashboard');
          break;
        case 'joueur':
        case 'parent':
          router.replace('/joueur/dashboard');
          break;
        default:
          console.warn('[AUTH] Rôle inconnu :', role);
          setRedirecting(false);
          break;
      }
    };

    if (!checking) {
      redirectUser();
    }
  }, [checking, session, redirecting, segments]);

  if (checking || redirecting) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00ff88" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image source={require('../../assets/logo.png')} style={styles.logo} />
      <Text style={styles.title}>Bienvenue sur SimplyFoot</Text>

      {session?.user && (
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={async () => {
            await supabase.auth.signOut();
            router.replace('/auth/login-club');
          }}
        >
          <Text style={styles.logoutText}>🔓 Se déconnecter</Text>
        </TouchableOpacity>
      )}

      <Slot />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#121212',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#00ff88',
    marginBottom: 30,
  },
  logo: {
    width: 90,
    height: 90,
    marginBottom: 20,
  },
  logoutButton: {
    backgroundColor: '#1e1e1e',
    borderColor: '#00ff88',
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 15,
  },
  logoutText: {
    color: '#00ff88',
    fontWeight: '600',
  },
});
