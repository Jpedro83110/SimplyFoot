import React, { useState, useEffect } from 'react';
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
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';
import useCacheData, { saveToCache } from '../../lib/cache';

// Fonction utilitaire pour générer un code équipe unique
function generateCodeEquipe(length = 6) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// Génère et vérifie l’unicité du code équipe
async function generateUniqueCodeEquipe() {
    let code, exists;
    do {
        code = generateCodeEquipe();
        const { data } = await supabase
            .from('equipes')
            .select('id')
            .eq('code_equipe', code)
            .maybeSingle();
        exists = !!data;
    } while (exists);
    return code;
}

export default function CreationEquipe() {
    const router = useRouter();
    const [nom, setNom] = useState('');
    const [categorie, setCategorie] = useState('');
    const [description, setDescription] = useState('');
    const [coachId, setCoachId] = useState(null);
    const [clubId, setClubId] = useState(null);
    const [codeEquipe, setCodeEquipe] = useState('');
    const [loading, setLoading] = useState(false);

    // Ajout du cache : on tente d'abord cache, puis fallback Supabase si rien trouvé
    const [userInfo, refreshUserInfo, loadingUserInfo] = useCacheData(
        'coach_user_info',
        async () => {
            const { data: sessionData } = await supabase.auth.getSession();
            const id = sessionData?.session?.user?.id;
            if (!id) return {};
            const { data: userInfo, error } = await supabase
                .from('utilisateurs')
                .select('club_id')
                .eq('id', id)
                .single();
            if (userInfo) {
                saveToCache('coach_user_info', userInfo); // Pour remplir dès prochain boot
                return { ...userInfo, coach_id: id };
            }
            return {};
        },
        1800, // 30 min de cache, tu adaptes si besoin
    );

    useEffect(() => {
        if (userInfo && userInfo.club_id) {
            setClubId(userInfo.club_id);
            setCoachId(userInfo.coach_id);
        }
    }, [userInfo]);

    const handleCreate = async () => {
        if (!nom || !categorie) {
            Alert.alert('Erreur', 'Merci de remplir au minimum le nom et la catégorie.');
            return;
        }
        if (!coachId || !clubId) {
            Alert.alert('Erreur', 'Informations utilisateur incomplètes.');
            return;
        }

        setLoading(true);

        try {
            // Génère un code équipe unique
            const codeEquipeGen = await generateUniqueCodeEquipe();

            const { data, error } = await supabase
                .from('equipes')
                .insert({
                    nom,
                    categorie,
                    description: description.trim() !== '' ? description : null,
                    coach_id: coachId,
                    club_id: clubId,
                    code_equipe: codeEquipeGen, // On ajoute le code ici !
                })
                .select()
                .single();

            if (error) {
                console.error('[EQUIPE] ❌ Erreur création :', error);
                Alert.alert('Erreur', 'Création de l’équipe échouée.');
            } else {
                setCodeEquipe(codeEquipeGen);
                Alert.alert(
                    'Succès',
                    `Équipe créée avec succès !\n\nCode équipe : ${codeEquipeGen}\n\nPartage ce code avec les joueurs/parents pour les rattacher à cette équipe.`,
                    [{ text: 'OK', onPress: () => router.replace('/coach/dashboard') }],
                );
                // Tu peux aussi garder le coach sur la page pour copier le code
            }
        } catch (e) {
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

            <TouchableOpacity
                style={styles.button}
                onPress={handleCreate}
                disabled={loadingUserInfo || loading}
            >
                <Text style={styles.buttonText}>
                    {loadingUserInfo || loading ? 'Chargement...' : "Créer l'équipe"}
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
                        Ce code permet aux joueurs/parents de s'inscrire directement dans cette
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
