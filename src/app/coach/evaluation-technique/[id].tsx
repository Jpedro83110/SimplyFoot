import { useCallback, useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Pressable,
    Platform,
    TextInput,
    Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Slider from '@react-native-community/slider';
import {
    EvaluationsTechnique,
    getEvaluationsTechniquesByJoueur,
    GetEvaluationsTechniquesByJoueur,
    upsertEvaluationsTechniques,
} from '@/helpers/evaluationsTechniques.helpers';
import { useSession } from '@/hooks/useSession';
import { Database } from '@/types/database.types';

type EvaluationTechniqueParams = {
    id: string;
};

const evaluationTechniqueDefaultValues: EvaluationsTechnique = {
    tir: 50,
    passe: 50,
    centre: 50,
    tete: 50,
    vitesse: 50,
    defense: 50,
    placement: 50,
    jeu_sans_ballon: 50,
};

export default function EvaluationTechnique() {
    const { id } = useLocalSearchParams<EvaluationTechniqueParams>();
    const router = useRouter();

    const [valeurs, setValeurs] = useState<EvaluationsTechnique>(evaluationTechniqueDefaultValues);
    const [evaluationsTechniques, setEvaluationsTechniques] =
        useState<GetEvaluationsTechniquesByJoueur>();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const { utilisateur } = useSession();

    const fetchEvaluationsTechniques = useCallback(async () => {
        if (!id || loading) {
            return;
        }

        setLoading(true);

        try {
            const fetchedEvaluationsTechniques = await getEvaluationsTechniquesByJoueur({
                joueurId: id,
            });

            setEvaluationsTechniques(fetchedEvaluationsTechniques);
        } catch (error) {
            console.error('Erreur générale:', error);
            Alert.alert('Erreur', 'Impossible de charger les informations du joueur');
        }

        setLoading(false);
    }, [id, loading]);

    useEffect(() => {
        fetchEvaluationsTechniques();
    }, [fetchEvaluationsTechniques]);

    useEffect(() => {
        if (evaluationsTechniques) {
            setValeurs({
                tir: evaluationsTechniques.tir ?? 50,
                passe: evaluationsTechniques.passe ?? 50,
                centre: evaluationsTechniques.centre ?? 50,
                tete: evaluationsTechniques.tete ?? 50,
                vitesse: evaluationsTechniques.vitesse ?? 50,
                defense: evaluationsTechniques.defense ?? 50,
                placement: evaluationsTechniques.placement ?? 50,
                jeu_sans_ballon: evaluationsTechniques.jeu_sans_ballon ?? 50,
            });
        }
    }, [evaluationsTechniques]);

    const handleSliderChange = (key: string, value: number) => {
        setValeurs((prev) => ({
            ...prev,
            [key]: Math.max(0, Math.min(100, value)),
        }));
    };

    const calculerMoyenne = () => {
        const total = Object.values(valeurs).reduce((a, b) => a + b, 0);
        return Math.round(total / Object.values(valeurs).length);
    };

    const handleSave = async () => {
        setSaving(true);

        try {
            const moyenne = calculerMoyenne();

            if (!utilisateur?.id) {
                Alert.alert('Erreur', 'Joueur ou coach introuvable');
                return;
            }

            // Objet complet avec tous les champs nécessaires
            const updates: Database['public']['Tables']['evaluations_techniques']['Update'] = {
                joueur_id: id,
                coach_id: utilisateur?.id,
                updated_at: new Date().toISOString(),
                tir: valeurs.tir,
                passe: valeurs.passe,
                centre: valeurs.centre,
                tete: valeurs.tete,
                vitesse: valeurs.vitesse,
                defense: valeurs.defense,
                placement: valeurs.placement,
                jeu_sans_ballon: valeurs.jeu_sans_ballon,
                moyenne: moyenne,
            };

            await upsertEvaluationsTechniques({
                evaluationsTechniquesId: evaluationsTechniques?.id || null,
                dataToUpdate: updates,
            });

            Alert.alert('Succès', 'Évaluation technique enregistrée avec succès!', [
                {
                    text: 'OK',
                    onPress: () => {
                        router.replace(`/coach/joueur/${id}`);
                    },
                },
            ]);

            if (Platform.OS === 'web') {
                router.replace(`/coach/joueur/${id}`);
            }
        } catch (error) {
            Alert.alert('Erreur', `Erreur inattendue: ${(error as Error).message}`);
        } finally {
            setSaving(false);
        }
    };

    const moyenne = calculerMoyenne();

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#00ff88" />
                <Text style={styles.loadingText}>Chargement...</Text>
            </View>
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>🎯 Évaluation technique</Text>

            {/* Affichage des informations du joueur */}
            {evaluationsTechniques && (
                <View style={styles.playerInfo}>
                    <Text style={styles.playerName}>
                        {evaluationsTechniques.utilisateurs?.nom}{' '}
                        {evaluationsTechniques.utilisateurs?.prenom}
                    </Text>
                    <Text style={styles.playerRole}>
                        {evaluationsTechniques.utilisateurs?.role}
                    </Text>
                </View>
            )}

            {Object.entries(valeurs).map(([key, val]: [string, number]) => (
                <View key={key} style={styles.sliderBlock}>
                    <Text style={styles.label}>
                        {key.replace(/_/g, ' ').toUpperCase()} : {val}/100
                    </Text>
                    {Platform.OS === 'web' ? (
                        <TextInput
                            keyboardType="numeric"
                            value={`${val}`}
                            onChangeText={(text) => handleSliderChange(key, parseInt(text) || 0)}
                            style={styles.inputWeb}
                            placeholder="0 à 100"
                            placeholderTextColor="#555"
                        />
                    ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text
                                style={[
                                    styles.label,
                                    {
                                        width: 40,
                                        textAlign: 'right',
                                        color: '#00ff88',
                                        fontWeight: 'bold',
                                    },
                                ]}
                            >
                                {val}
                            </Text>
                            <Slider
                                style={{ flex: 1, marginHorizontal: 12 }}
                                minimumValue={0}
                                maximumValue={100}
                                step={1}
                                value={val}
                                onValueChange={(value) => handleSliderChange(key, value)}
                                minimumTrackTintColor="#00ff88"
                                maximumTrackTintColor="#555"
                                thumbTintColor="#00ff88"
                            />
                            <Text
                                style={[
                                    styles.label,
                                    { width: 40, color: '#fff', textAlign: 'left', opacity: 0.6 },
                                ]}
                            >
                                /100
                            </Text>
                        </View>
                    )}
                </View>
            ))}

            <View style={styles.moyenneBlock}>
                <Text style={styles.moyenneText}>🧮 Moyenne générale : {moyenne}/100</Text>
            </View>

            <Pressable
                onPress={handleSave}
                style={[styles.button, (saving || loading) && styles.buttonDisabled]}
                disabled={saving || loading}
            >
                <Text style={styles.buttonText}>
                    {saving ? 'Enregistrement...' : "💾 Enregistrer l'évaluation"}
                </Text>
            </Pressable>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#121212',
        flexGrow: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#121212',
    },
    loadingText: {
        color: '#fff',
        marginTop: 10,
    },
    title: {
        fontSize: 22,
        color: '#00ff88',
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    playerInfo: {
        backgroundColor: '#1a1a1a',
        padding: 15,
        borderRadius: 10,
        marginBottom: 20,
        borderColor: '#00ff88',
        borderWidth: 1,
    },
    playerName: {
        color: '#00ff88',
        fontSize: 18,
        fontWeight: 'bold',
    },
    playerRole: {
        color: '#fff',
        fontSize: 14,
        opacity: 0.8,
    },
    sliderBlock: {
        marginBottom: 25,
        backgroundColor: '#1e1e1e',
        padding: 12,
        borderRadius: 10,
    },
    label: {
        color: '#fff',
        marginBottom: 8,
        fontWeight: 'bold',
        fontSize: 16,
    },
    inputWeb: {
        backgroundColor: '#222',
        color: '#00ff88',
        padding: 10,
        borderRadius: 6,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#00ff88',
    },
    moyenneBlock: {
        marginTop: 10,
        marginBottom: 20,
        padding: 15,
        backgroundColor: '#0e0e0e',
        borderRadius: 10,
        borderColor: '#00ff88',
        borderWidth: 1.5,
        alignItems: 'center',
    },
    moyenneText: {
        color: '#00ff88',
        fontWeight: 'bold',
        fontSize: 18,
    },
    button: {
        backgroundColor: '#00ff88',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 30,
    },
    buttonDisabled: {
        backgroundColor: '#555',
        opacity: 0.6,
    },
    buttonText: {
        color: '#111',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
