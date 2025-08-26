import { useCallback, useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    Alert,
    ActivityIndicator,
    TextInput,
    Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Slider from '@react-native-community/slider';
import {
    EvaluationsMentale,
    GetEvaluationsMentalesByJoueur,
    getEvaluationsMentalesByJoueur,
    upsertEvaluationsMentales,
} from '@/helpers/evaluationsMentales.helpers';
import { useSession } from '@/hooks/useSession';

type EvaluationMentaleParams = {
    id: string;
};

export default function EvaluationMentale() {
    const { id } = useLocalSearchParams<EvaluationMentaleParams>();
    const router = useRouter();

    const [valeurs, setValeurs] = useState<EvaluationsMentale>({
        motivation: 50,
        rigueur: 50,
        ponctualite: 50,
        attitude: 50,
        respect: 50,
    });

    const [evaluationsMentales, setEvaluationsMentales] =
        useState<GetEvaluationsMentalesByJoueur>();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const { utilisateur } = useSession();

    const fetchJoueurInfo = useCallback(async () => {
        if (!id || loading) {
            return;
        }

        setLoading(true);

        try {
            const utilisateur = await getEvaluationsMentalesByJoueur({
                joueurId: id,
            });

            setEvaluationsMentales(utilisateur);
        } catch (error) {
            console.error('Erreur générale:', error);
            Alert.alert('Erreur', 'Impossible de charger les informations du joueur');
        }

        setLoading(false);
    }, [id, loading]);

    useEffect(() => {
        fetchJoueurInfo();
    }, [fetchJoueurInfo]);

    useEffect(() => {
        if (evaluationsMentales) {
            setValeurs({
                motivation: evaluationsMentales.motivation ?? 50,
                rigueur: evaluationsMentales.rigueur ?? 50,
                ponctualite: evaluationsMentales.ponctualite ?? 50,
                attitude: evaluationsMentales.attitude ?? 50,
                respect: evaluationsMentales.respect ?? 50,
            });
        }
    }, [evaluationsMentales]);

    const handleSliderChange = (key: string, value: string) => {
        setValeurs((prev) => ({
            ...prev,
            [key]: Math.max(0, Math.min(100, parseInt(value) || 0)),
        }));
    };

    const calculerMoyenne = () => {
        const total = Object.values(valeurs).reduce((a, b) => a + b, 0);
        return Math.round(total / Object.values(valeurs).length);
    };

    const enregistrerEvaluation = async () => {
        setSaving(true);

        try {
            const moyenne = calculerMoyenne();

            if (!evaluationsMentales?.utilisateurs?.id || !utilisateur?.id) {
                Alert.alert('Erreur', 'Joueur ou coach introuvable');
                return;
            }

            // Objet complet avec tous les champs nécessaires
            const updates = {
                joueur_id: evaluationsMentales.utilisateurs.id,
                coach_id: utilisateur?.id,
                date: new Date().toISOString().split('T')[0],
                motivation: valeurs.motivation,
                rigueur: valeurs.rigueur,
                ponctualite: valeurs.ponctualite,
                attitude: valeurs.attitude,
                respect: valeurs.respect,
                note_globale: moyenne,
                moyenne: moyenne,
                updated_at: new Date().toISOString(),
                created_at: new Date().toISOString(),
                implication: null,
                commentaire: null,
            };

            // Stratégie UPDATE puis INSERT
            await upsertEvaluationsMentales({
                joueurId: evaluationsMentales.utilisateurs.id,
                coachId: utilisateur.id,
                dataToUpdate: updates,
            });

            Alert.alert('Succès', 'Évaluation mentale enregistrée avec succès!', [
                {
                    text: 'OK',
                    onPress: () => {
                        router.replace(
                            `/coach/joueur/${evaluationsMentales?.utilisateurs?.joueur_id}`,
                        );
                    },
                },
            ]);

            if (Platform.OS === 'web') {
                router.replace(`/coach/joueur/${evaluationsMentales?.utilisateurs?.joueur_id}`);
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
        <ScrollView style={styles.container}>
            <Text style={styles.title}>🧠 Évaluation mentale</Text>

            {/* Affichage des informations du joueur */}
            {evaluationsMentales && (
                <View style={styles.playerInfo}>
                    <Text style={styles.playerName}>
                        {evaluationsMentales.utilisateurs?.nom}{' '}
                        {evaluationsMentales.utilisateurs?.prenom}
                    </Text>
                    <Text style={styles.playerRole}>{evaluationsMentales.utilisateurs?.role}</Text>
                </View>
            )}

            {Object.entries(valeurs).map(([key, val]) => (
                <View key={key} style={styles.sliderBlock}>
                    <Text style={styles.label}>
                        {key.charAt(0).toUpperCase() + key.slice(1)} : {val}/100
                    </Text>
                    {Platform.OS === 'web' ? (
                        <TextInput
                            style={styles.input}
                            keyboardType="numeric"
                            value={String(val)}
                            onChangeText={(text) => handleSliderChange(key, text)}
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
                                minimumTrackTintColor="#00ff88"
                                maximumTrackTintColor="#555"
                                thumbTintColor="#00ff88"
                                onValueChange={(value) => handleSliderChange(key, value.toString())}
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
                <Text style={styles.moyenneLabel}>🟢 Note globale : {moyenne}/100</Text>
            </View>

            <Pressable
                style={[styles.button, (saving || loading) && styles.buttonDisabled]}
                onPress={enregistrerEvaluation}
                disabled={saving || loading}
            >
                <Text style={styles.buttonText}>
                    {saving ? 'Enregistrement...' : "Valider l'évaluation"}
                </Text>
            </Pressable>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#121212',
        padding: 20,
        flex: 1,
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
    },
    label: {
        color: '#fff',
        marginBottom: 8,
        fontSize: 16,
    },
    input: {
        backgroundColor: '#1e1e1e',
        color: '#fff',
        padding: 10,
        borderRadius: 8,
        borderColor: '#444',
        borderWidth: 1,
    },
    moyenneBlock: {
        marginVertical: 20,
        padding: 14,
        backgroundColor: '#0e0e0e',
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: '#00ff88',
        alignItems: 'center',
    },
    moyenneLabel: {
        fontSize: 18,
        color: '#00ff88',
        fontWeight: 'bold',
    },
    button: {
        backgroundColor: '#00ff88',
        padding: 14,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 40,
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
