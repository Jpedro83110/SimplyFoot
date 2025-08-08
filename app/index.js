import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';

export default function Accueil() {
    const router = useRouter();
    const [loggedIn, setLoggedIn] = useState(false);

    const redirectUser = useCallback(
        async (session) => {
            if (!session?.user) {
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('utilisateurs')
                    .select('role')
                    .eq('id', session.user.id)
                    .single();

                if (error || !data?.role) {
                    console.error('Erreur récupération rôle :', error);
                    return;
                }

                const role = data.role;

                switch (role) {
                    case 'admin':
                        router.replace('/admin/dashboard');
                        break;
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
                        Alert.alert('Erreur', `Rôle inconnu : ${role}`);
                }
            } catch (err) {
                console.error('Erreur redirection :', err);
            }
        },
        [router],
    );

    useEffect(() => {
        const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
            setLoggedIn(!!session?.user);
            redirectUser(session);
        });

        supabase.auth.getSession().then(({ data }) => {
            setLoggedIn(!!data.session?.user);
            redirectUser(data.session);
        });

        return () => {
            listener?.subscription.unsubscribe();
        };
    }, [redirectUser]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setLoggedIn(false);
        router.replace('/auth/login-club');
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <Image source={require('../assets/logo.png')} style={styles.logoImage} />
            <Text style={styles.title}>Bienvenue sur</Text>
            <Text style={styles.logo}>⚽ SimplyFoot</Text>
            <Text style={styles.subtitle}>L&apos;application des clubs de foot amateur</Text>

            {loggedIn ? (
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Text style={styles.logoutText}>🔓 Se déconnecter</Text>
                </TouchableOpacity>
            ) : (
                <>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => router.push('/auth/login-club')}
                        accessible
                        accessibilityLabel="Connexion Club"
                    >
                        <Text style={styles.buttonText}>Connexion Club (Président / Coach)</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.buttonOutline}
                        onPress={() => router.push('/auth/login-joueur')}
                        accessible
                        accessibilityLabel="Connexion Parent ou Joueur"
                    >
                        <Text style={styles.buttonTextOutline}>Connexion Parent / Joueur</Text>
                    </TouchableOpacity>
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    logoImage: {
        width: 100,
        height: 100,
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        color: '#00ff88',
        fontWeight: '600',
    },
    logo: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#ffffff',
        marginVertical: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#aaaaaa',
        marginBottom: 40,
    },
    button: {
        backgroundColor: '#00ff88',
        paddingVertical: 15,
        paddingHorizontal: 25,
        borderRadius: 10,
        marginTop: 20,
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
    },
    buttonText: {
        color: '#000',
        fontWeight: '700',
        fontSize: 16,
    },
    buttonOutline: {
        borderColor: '#00ff88',
        borderWidth: 2,
        paddingVertical: 15,
        paddingHorizontal: 25,
        borderRadius: 10,
        marginTop: 15,
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
    },
    buttonTextOutline: {
        color: '#00ff88',
        fontWeight: '700',
        fontSize: 16,
    },
    logoutButton: {
        position: 'absolute',
        top: 40,
        right: 20,
        backgroundColor: '#1e1e1e',
        borderColor: '#00ff88',
        borderWidth: 1,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    logoutText: {
        color: '#00ff88',
        fontSize: 13,
        fontWeight: '600',
    },
});
