import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function NutritionIndex() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Nutrition & Prévention</Text>

            <TouchableOpacity
                style={styles.button}
                onPress={() => router.push('/joueur/nutrition/scanner')}
            >
                <Text style={styles.buttonText}>📷 Scan nutrition</Text>
                <Text style={styles.desc}>
                    Scanner un aliment ou une boisson pour obtenir son Nutri-Score, des conseils et
                    son impact sportif.
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.button, { marginTop: 18, backgroundColor: '#0096ff' }]}
                onPress={() => router.push('/joueur/nutrition/conseils')}
                disabled // désactivé pour l’instant
            >
                <Text style={styles.buttonText}>💡 Nos conseils</Text>
                <Text style={styles.desc}>
                    Astuces nutrition, récupération, études & sport, prévention blessures… (bientôt
                    dispo)
                </Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#101822',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 35,
        color: '#00ff88',
        textAlign: 'center',
        letterSpacing: 1,
    },
    button: {
        backgroundColor: '#00c271',
        borderRadius: 16,
        paddingVertical: 22,
        paddingHorizontal: 32,
        alignItems: 'center',
        shadowColor: '#00ff88',
        shadowOpacity: 0.25,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        width: '100%',
        maxWidth: 400,
    },
    buttonText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 8,
    },
    desc: {
        color: '#e6ffe7',
        fontSize: 14,
        textAlign: 'center',
        opacity: 0.85,
    },
});
