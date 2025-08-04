import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

export default function AdminDashboard() {
    const router = useRouter();

    const sections = [
        {
            title: '👑 Espace Président',
            links: [
                { label: '📊 Dashboard Président', route: '/president/dashboard' },
                { label: '🎯 Programme des Stages', route: '/president/stages' },
                { label: '🏷️ Fiche Club', route: '/president/inscription-club' },
                { label: '🌐 Page Publique', route: '/president/infos-publiques-club' },
            ],
        },
        {
            title: '🧠 Espace Coach',
            links: [
                { label: '📊 Dashboard Coach', route: '/coach/dashboard' },
                { label: '📅 Créer un Événement', route: '/coach/creation-evenement' },
                { label: '📋 Convocation (exemple)', route: '/coach/convocation/123' },
                { label: '🧭 Transport', route: '/coach/transport' },
                { label: '🧩 Composition Match', route: '/coach/composition' },
                { label: '📄 Feuille de match', route: '/coach/feuille-match/1' },
            ],
        },
        {
            title: '⚽ Espace Joueur',
            links: [
                { label: '📊 Dashboard Joueur', route: '/joueur/dashboard' },
                { label: '📥 Convocation (exemple)', route: '/joueur/convocation/123' },
                { label: '✅ Décharge', route: '/joueur/decharge' },
                { label: '💬 Motivation', route: '/joueur/motivation' },
            ],
        },
        {
            title: '🔧 Autres',
            links: [
                { label: '🏠 Accueil Admin', route: '/admin' },
                { label: '🔐 Connexion Club', route: '/auth/login-club' },
                { label: '🔐 Connexion Joueur', route: '/auth/login-joueur' },
            ],
        },
    ];

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>🎛️ Tableau de bord Admin</Text>
            <Text style={styles.subtitle}>Accès complet à toutes les sections</Text>

            {sections.map((section, idx) => (
                <View key={idx} style={styles.section}>
                    <Text style={styles.sectionTitle}>{section.title}</Text>
                    {section.links.map((link, linkIdx) => (
                        <TouchableOpacity
                            key={linkIdx}
                            style={styles.button}
                            activeOpacity={0.7}
                            onPress={() => router.push(link.route)}
                        >
                            <Text style={styles.buttonText}>{link.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            ))}

            <TouchableOpacity
                onPress={() => router.push('/admin')}
                style={[styles.button, { marginTop: 30, backgroundColor: '#00ff8844' }]}
            >
                <Text style={[styles.buttonText, { color: '#ffffff' }]}>
                    🔙 Retour à l'accueil admin
                </Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 24,
        backgroundColor: '#121212',
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    title: {
        fontSize: 26,
        color: '#00ff88',
        fontWeight: 'bold',
        marginBottom: 10,
    },
    subtitle: {
        color: '#aaa',
        marginBottom: 30,
        fontSize: 16,
    },
    section: {
        width: '100%',
        marginBottom: 30,
    },
    sectionTitle: {
        color: '#00ff88',
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 10,
        textAlign: 'left',
    },
    button: {
        width: '100%',
        backgroundColor: '#1e1e1e',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#00ff88',
    },
    buttonText: {
        color: '#00ff88',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
});
