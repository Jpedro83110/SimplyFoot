import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Alert } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

export default function Header({ title, showBack = true }) {
    const router = useRouter();
    const segments = useSegments();

    // Pour savoir si on peut revenir en arrière
    const canGoBack = segments.length > 2; // segments: ['', 'coach', 'convocation'] etc.

    const goToAccueil = async () => {
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData?.session?.user?.id;

        if (!userId) {
            router.replace('/auth/login-club');
            return;
        }

        const { data: utilisateur, error } = await supabase
            .from('utilisateurs')
            .select('role')
            .eq('id', userId)
            .single();

        if (error || !utilisateur?.role) {
            Alert.alert('Erreur', 'Rôle utilisateur introuvable.');
            router.replace('/auth/login-club');
            return;
        }

        const role = utilisateur.role;

        if (role === 'president') router.replace('/president/dashboard');
        else if (role === 'coach') router.replace('/coach/dashboard');
        else if (role === 'joueur') router.replace('/joueur/dashboard');
        else router.replace('/auth/login-club');
    };

    const handleBack = async () => {
        // Si on peut revenir en arrière, on y va
        if (canGoBack) {
            router.back();
        } else {
            // Sinon, on va à l'accueil comme pour Home
            await goToAccueil();
        }
    };

    return (
        <View style={styles.container}>
            {showBack && (
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color="#00ff88" />
                </TouchableOpacity>
            )}

            <Text style={styles.title}>{title}</Text>

            <TouchableOpacity onPress={goToAccueil} style={styles.homeButton}>
                <FontAwesome5 name="futbol" size={22} color="#00ff88" />
            </TouchableOpacity>

            <View style={styles.bottomGlow} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#121212',
        paddingTop: Platform.OS === 'ios' ? 60 : 30,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#00ff88',
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    backButton: {
        position: 'absolute',
        left: 20,
        top: Platform.OS === 'ios' ? 60 : 30,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
        textAlign: 'center',
    },
    homeButton: {
        position: 'absolute',
        right: 20,
        top: Platform.OS === 'ios' ? 60 : 30,
    },
    bottomGlow: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        height: 4,
        backgroundColor: '#00ff88',
        shadowColor: '#00ff88',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 10,
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10,
    },
});
