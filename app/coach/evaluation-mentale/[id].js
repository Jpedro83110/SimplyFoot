import React, { useEffect, useState } from 'react';
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
import { supabase } from '../../../lib/supabase';
import Slider from '@react-native-community/slider';
import useCacheData from '../../../lib/cache';

export default function EvaluationMentale() {
    const { id } = useLocalSearchParams();
    const router = useRouter();

    const [valeurs, setValeurs] = useState({
        motivation: 50,
        rigueur: 50,
        ponctualite: 50,
        attitude: 50,
        respect: 50,
    });

    const [joueurInfo, setJoueurInfo] = useState(null);
    const [joueurId, setJoueurId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Récupère les informations du joueur/utilisateur
    useEffect(() => {
        async function fetchJoueurInfo() {
            setLoading(true);

            try {
                // Étape 1: Récupérer les infos utilisateur
                const { data: utilisateur, error: userError } = await supabase
                    .from('utilisateurs')
                    .select('id, nom, prenom, role, joueur_id')
                    .eq('id', id)
                    .maybeSingle();

                if (userError && userError.code !== 'PGRST116') {
                    console.error('Erreur utilisateur:', userError);
                }

                if (utilisateur) {
                    setJoueurInfo(utilisateur);
                    setJoueurId(utilisateur.id);
                } else {
                    // Étape 2: Essayer de trouver par joueur_id
                    const { data: userByJoueurId, error: joueurError } = await supabase
                        .from('utilisateurs')
                        .select('id, nom, prenom, role, joueur_id')
                        .eq('joueur_id', id)
                        .maybeSingle();

                    if (joueurError && joueurError.code !== 'PGRST116') {
                        console.error('Erreur joueur:', joueurError);
                    }

                    if (userByJoueurId) {
                        setJoueurInfo(userByJoueurId);
                        setJoueurId(userByJoueurId.id);
                    } else {
                        Alert.alert('Erreur', 'Joueur introuvable dans le système');
                    }
                }
            } catch (error) {
                console.error('Erreur générale:', error);
                Alert.alert('Erreur', 'Impossible de charger les informations du joueur');
            }

            setLoading(false);
        }

        if (id) {
            fetchJoueurInfo();
        }
    }, [id]);

    // Charge les données d'éval si joueurId dispo
    const [evalData, refresh, loadingEval] = useCacheData(
        joueurId ? `eval-mentale-${joueurId}` : null,
        async () => {
            if (!joueurId) return null;

            try {
                const { data, error } = await supabase
                    .from('evaluations_mentales')
                    .select('*')
                    .eq('joueur_id', joueurId)
                    .maybeSingle(); // Utilise maybeSingle au lieu de single pour éviter les erreurs si pas de résultat

                if (error) {
                    console.error('Erreur lors du chargement des évaluations:', error);
                    return null;
                }

                return data;
            } catch (error) {
                console.error('Erreur cache evaluation:', error);
                return null;
            }
        },
        3600,
    );

    // Remplit les sliders si data trouvée
    useEffect(() => {
        if (evalData) {
            setValeurs({
                motivation: evalData.motivation ?? 50,
                rigueur: evalData.rigueur ?? 50,
                ponctualite: evalData.ponctualite ?? 50,
                attitude: evalData.attitude ?? 50,
                respect: evalData.respect ?? 50,
            });
        }
    }, [evalData]);

    const handleSliderChange = (key, value) => {
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
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
            const session = sessionData?.session;

            if (sessionError || !session?.user?.id) {
                Alert.alert('Erreur', 'Session invalide - veuillez vous reconnecter');
                return;
            }

            if (!joueurId) {
                Alert.alert('Erreur', 'Joueur introuvable');
                return;
            }

            // Objet complet avec tous les champs nécessaires
            const updates = {
                joueur_id: joueurId,
                coach_id: session.user.id,
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
            const { data: updateData, error: updateError } = await supabase
                .from('evaluations_mentales')
                .update(updates)
                .eq('joueur_id', joueurId)
                .eq('coach_id', session.user.id)
                .select();

            if (updateError) {
                Alert.alert('Erreur', `Erreur de mise à jour: ${updateError.message}`);
                return;
            }

            // Si aucune ligne n'a été mise à jour, on insère
            if (!updateData || updateData.length === 0) {
                const { data: insertData, error: insertError } = await supabase
                    .from('evaluations_mentales')
                    .insert(updates)
                    .select();

                if (insertError) {
                    Alert.alert('Erreur', `Impossible de sauvegarder: ${insertError.message}`);
                    return;
                }
            }

            // Rafraîchit le cache
            try {
                if (refresh) {
                    await refresh();
                }
            } catch (cacheError) {
                // Ignore les erreurs de cache
            }

            Alert.alert('Succès', 'Évaluation mentale enregistrée avec succès!', [
                {
                    text: 'OK',
                    onPress: () => {
                        router.replace(`/coach/joueur/${joueurId}`);
                    },
                },
            ]);
        } catch (error) {
            Alert.alert('Erreur', `Erreur inattendue: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    const moyenne = calculerMoyenne();

    if (loading || loadingEval) {
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
            {joueurInfo && (
                <View style={styles.playerInfo}>
                    <Text style={styles.playerName}>
                        {joueurInfo.nom} {joueurInfo.prenom}
                    </Text>
                    <Text style={styles.playerRole}>{joueurInfo.role}</Text>
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
                                onValueChange={(v) => handleSliderChange(key, v)}
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
                style={[styles.button, (saving || loading || loadingEval) && styles.buttonDisabled]}
                onPress={enregistrerEvaluation}
                disabled={saving || loading || loadingEval}
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
