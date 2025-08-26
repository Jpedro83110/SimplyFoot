import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, Alert } from 'react-native';

export default function Abonnement() {
    const [clubName, setClubName] = useState('');
    const [nbEquipes, setNbEquipes] = useState('');
    const [nbStaff, setNbStaff] = useState('');
    const [codeEquipe, setCodeEquipe] = useState<string | null>(null);

    const handleGenerateCode = () => {
        if (!clubName || !nbEquipes || !nbStaff) {
            Alert.alert('Erreur', 'Merci de remplir toutes les informations.');
            return;
        }

        // Générer un code aléatoire
        const code = `${clubName.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
        setCodeEquipe(code);
        Alert.alert('✅ Club enregistré', `Code d'équipe : ${code}`);
    };

    const handlePayment = () => {
        if (Platform.OS !== 'web') {
            Alert.alert(
                'Paiement web uniquement',
                'Merci de finaliser le paiement depuis un navigateur web.',
            );
            return;
        }

        // 👉 À remplacer par lien vers Stripe ou module paiement web
        Alert.alert('Redirection', 'Paiement en cours sur le web...');
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>💼 Abonnement Club</Text>
            <Text style={styles.subtitle}>6,99€ / mois – 1 club, plusieurs équipes</Text>

            <TextInput
                style={styles.input}
                placeholder="Nom du club"
                value={clubName}
                onChangeText={setClubName}
            />

            <TextInput
                style={styles.input}
                placeholder="Nombre d'équipes"
                value={nbEquipes}
                onChangeText={setNbEquipes}
                keyboardType="numeric"
            />

            <TextInput
                style={styles.input}
                placeholder="Nombre de membres du staff"
                value={nbStaff}
                onChangeText={setNbStaff}
                keyboardType="numeric"
            />

            <TouchableOpacity style={styles.button} onPress={handleGenerateCode}>
                <Text style={styles.buttonText}>Créer mon club + Générer code</Text>
            </TouchableOpacity>

            {codeEquipe && (
                <View style={styles.codeBox}>
                    <Text style={styles.codeLabel}>🔑 Code équipe :</Text>
                    <Text style={styles.code}>{codeEquipe}</Text>
                </View>
            )}

            <TouchableOpacity style={styles.payButton} onPress={handlePayment}>
                <Text style={styles.payText}>
                    {Platform.OS === 'web'
                        ? "💳 Payer l'abonnement"
                        : '🔒 Paiement uniquement sur le Web'}
                </Text>
            </TouchableOpacity>
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
        color: '#00ff88',
        fontWeight: 'bold',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#aaa',
        marginBottom: 30,
    },
    input: {
        backgroundColor: '#1e1e1e',
        color: '#fff',
        borderRadius: 10,
        padding: 14,
        fontSize: 16,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#333',
    },
    button: {
        backgroundColor: '#00ff88',
        padding: 14,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 25,
    },
    buttonText: {
        fontWeight: '700',
        color: '#000',
        fontSize: 16,
    },
    codeBox: {
        backgroundColor: '#1e1e1e',
        borderLeftWidth: 4,
        borderLeftColor: '#00ff88',
        padding: 14,
        borderRadius: 10,
        marginBottom: 30,
    },
    codeLabel: {
        color: '#aaa',
        fontSize: 14,
        marginBottom: 4,
    },
    code: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '700',
    },
    payButton: {
        borderColor: '#00ff88',
        borderWidth: 2,
        padding: 14,
        borderRadius: 10,
        alignItems: 'center',
    },
    payText: {
        color: '#00ff88',
        fontWeight: '700',
        fontSize: 16,
    },
});
