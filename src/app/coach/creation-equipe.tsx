import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSession } from '@/hooks/useSession';
import { checkIfCodeEquipeExists, insertEquipe } from '@/helpers/equipes.helpers';

// Fonction utilitaire pour générer un code équipe unique
function generateCodeEquipe(length = 6) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// Génère et vérifie l'unicité du code équipe
// FIXME: système très dangereux
async function generateUniqueCodeEquipe() {
    let code = '';
    let exists = true;

    do {
        code = generateCodeEquipe();
        exists = await checkIfCodeEquipeExists(code);
    } while (exists);

    return code;
}

export default function CreationEquipe() {
    const router = useRouter();
    const [nom, setNom] = useState('');
    const [categorie, setCategorie] = useState('');
    const [description, setDescription] = useState('');
    const [codeEquipe, setCodeEquipe] = useState('');
    const [loading, setLoading] = useState(false);

    const { utilisateur } = useSession();

    const handleCreate = async () => {
        if (!nom || !categorie) {
            Alert.alert('Erreur', 'Merci de remplir au minimum le nom et la catégorie.');
            return;
        }
        if (!utilisateur?.id || !utilisateur.club_id) {
            Alert.alert('Erreur', 'Informations utilisateur incomplètes.');
            return;
        }

        setLoading(true);

        try {
            // Génère un code équipe unique
            const codeEquipeGen = await generateUniqueCodeEquipe();

            await insertEquipe({
                dataToInsert: {
                    nom,
                    categorie,
                    description: description.trim() !== '' ? description : null,
                    coach_id: utilisateur.id,
                    club_id: utilisateur.club_id,
                    code_equipe: codeEquipeGen, // On ajoute le code ici !
                },
            });

            setCodeEquipe(codeEquipeGen);
            Alert.alert(
                'Succès',
                `Équipe créée avec succès !\n\nCode équipe : ${codeEquipeGen}\n\nPartage ce code avec les joueurs/parents pour les rattacher à cette équipe.`,
                [{ text: 'OK', onPress: () => router.replace('/coach/dashboard') }],
            );
            // FIXME: faire un système avec un bouton "copier code" seulement sur la page et une redirection facile et rapide sur le dashboard
        } catch (error) {
            console.error("Erreur inattendue lors de la création de l'équipe:", error);
            Alert.alert('Erreur', 'Erreur inattendue lors de la création.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.container}
        >
            <StatusBar barStyle="light-content" />
            <Text style={styles.title}>Créer une Équipe</Text>

            <TextInput
                style={styles.input}
                placeholder="Nom de l'équipe"
                placeholderTextColor="#aaa"
                value={nom}
                onChangeText={setNom}
            />
            <TextInput
                style={styles.input}
                placeholder="Catégorie (ex: U11, U17, Séniors)"
                placeholderTextColor="#aaa"
                value={categorie}
                onChangeText={setCategorie}
            />
            <TextInput
                style={styles.input}
                placeholder="Description (facultatif)"
                placeholderTextColor="#aaa"
                value={description}
                onChangeText={setDescription}
            />

            <TouchableOpacity style={styles.button} onPress={handleCreate} disabled={loading}>
                <Text style={styles.buttonText}>
                    {loading ? 'Chargement...' : "Créer l'équipe"}
                </Text>
            </TouchableOpacity>

            {/* Affichage du code équipe une fois créé */}
            {codeEquipe ? (
                <View style={styles.codeEquipeBox}>
                    <Text style={styles.codeEquipeLabel}>Code équipe généré :</Text>
                    <Text selectable style={styles.codeEquipe}>
                        {codeEquipe}
                    </Text>
                    <Text style={styles.codeEquipeInfo}>
                        Ce code permet aux joueurs/parents de s&apos;inscrire directement dans cette
                        équipe.
                    </Text>
                </View>
            ) : null}
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
        justifyContent: 'center',
        padding: 24,
    },
    title: {
        fontSize: 24,
        color: '#00ff88',
        fontWeight: '700',
        marginBottom: 30,
        textAlign: 'center',
    },
    input: {
        width: '100%',
        backgroundColor: '#1e1e1e',
        color: '#fff',
        borderRadius: 10,
        paddingVertical: 14,
        paddingHorizontal: 18,
        fontSize: 16,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#333',
    },
    button: {
        backgroundColor: '#00ff88',
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonText: {
        color: '#000',
        fontWeight: '700',
        fontSize: 16,
    },
    codeEquipeBox: {
        backgroundColor: '#1a1a1a',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#00ff88',
        marginTop: 32,
        padding: 18,
        alignItems: 'center',
    },
    codeEquipeLabel: {
        color: '#00ff88',
        fontWeight: '700',
        marginBottom: 8,
        fontSize: 16,
    },
    codeEquipe: {
        color: '#00ff88',
        fontSize: 22,
        fontWeight: '700',
        letterSpacing: 2,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        marginBottom: 8,
    },
    codeEquipeInfo: {
        color: '#aaa',
        fontSize: 12,
        textAlign: 'center',
    },
});
