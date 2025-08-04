// app/admin/index.js
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function AdminHub() {
    const router = useRouter();

    const Section = ({ title, links }) => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {links.map(({ label, path }) => (
                <TouchableOpacity
                    key={path}
                    style={styles.button}
                    onPress={() => router.push(path)}
                >
                    <Text style={styles.buttonText}>{label}</Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    const FloatingMenu = () => (
        <View style={styles.floatingMenu}>
            {[
                { icon: '🏛️', path: '/president/dashboard' },
                { icon: '🧠', path: '/coach/dashboard' },
                { icon: '⚽', path: '/joueur/dashboard' },
                { icon: '📋', path: '/coach/transport' },
            ].map(({ icon, path }) => (
                <TouchableOpacity
                    key={path}
                    style={styles.floatingButton}
                    onPress={() => router.push(path)}
                >
                    <Text style={styles.floatingIcon}>{icon}</Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    return (
        <View style={{ flex: 1 }}>
            <ScrollView style={styles.container}>
                <Text style={styles.title}>🎛️ Panneau Admin - Accès Total</Text>

                <Section
                    title="👑 Espace Président"
                    links={[
                        { label: 'Dashboard Président', path: '/president/dashboard' },
                        { label: 'Programme des Stages', path: '/president/stages' },
                        { label: 'Fiche Club', path: '/president/inscription-club' },
                        { label: 'Page publique du club', path: '/president/infos-publiques-club' },
                    ]}
                />

                <Section
                    title="🧠 Espace Coach"
                    links={[
                        { label: 'Dashboard Coach', path: '/coach/dashboard' },
                        { label: 'Créer un Événement', path: '/coach/creation-evenement' },
                        { label: 'Composition libre', path: '/coach/composition' },
                        { label: 'Transport', path: '/coach/transport' },
                        { label: 'Feuille de match (test)', path: '/coach/feuille-match/1' },
                    ]}
                />

                <Section
                    title="⚽ Espace Joueur"
                    links={[
                        { label: 'Dashboard Joueur', path: '/joueur/dashboard' },
                        { label: 'Convocation test', path: '/joueur/convocation/1' },
                        { label: 'Décharge', path: '/joueur/decharge' },
                        { label: 'Motivation', path: '/joueur/motivation' },
                    ]}
                />

                <Section
                    title="🔧 Autres outils"
                    links={[
                        { label: 'Accueil (auth)', path: '/' },
                        { label: 'Connexion club', path: '/auth/login-club' },
                        { label: 'Connexion joueur', path: '/auth/login-joueur' },
                    ]}
                />
            </ScrollView>

            <FloatingMenu />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#121212',
        flex: 1,
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#00ff88',
        textAlign: 'center',
        marginBottom: 30,
    },
    section: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 18,
        color: '#00ff88',
        fontWeight: '600',
        marginBottom: 10,
    },
    button: {
        backgroundColor: '#1e1e1e',
        borderRadius: 8,
        padding: 15,
        marginBottom: 10,
        borderLeftWidth: 4,
        borderLeftColor: '#00ff88',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
    },
    floatingMenu: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#1e1e1eee',
        borderRadius: 12,
        paddingVertical: 10,
        shadowColor: '#00ff88',
        shadowOpacity: 0.4,
        shadowRadius: 10,
    },
    floatingButton: {
        padding: 10,
    },
    floatingIcon: {
        fontSize: 24,
        color: '#00ff88',
    },
});
