import React, { useEffect, useMemo, useState } from 'react';
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
import { supabase } from '../../../lib/supabase';
import Slider from '@react-native-community/slider';
import useCacheData from '../../../lib/cache';
import { getUtilisateurById, GetUtilisateurById } from '@/helpers/utilisateurs.helper';

export default function EvaluationTechnique() {
    const { id } = useLocalSearchParams();
    const router = useRouter();

    const criteres = useMemo(
        () => [
            'tir',
            'passe',
            'centre',
            'tete',
            'vitesse',
            'defense',
            'placement',
            'jeu_sans_ballon',
        ],
        [],
    );

    const [valeurs, setValeurs] = useState(Object.fromEntries(criteres.map((c) => [c, 50])));
    const [joueurInfo, setJoueurInfo] = useState<GetUtilisateurById>();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Récupère les informations du joueur/utilisateur
    useEffect(() => {
        async function fetchJoueurInfo() {
            setLoading(true);

            try {
                // Étape 1: Récupérer les infos utilisateur
                const utilisateur = await getUtilisateurById({
                    utilisateurId: id as string,
                });

                if (utilisateur) {
                    setJoueurInfo(utilisateur);
                } else {
                    // Étape 2: Essayer de trouver par joueur_id
                    const { data: userByJoueurId, error: joueurError } = await supabase
                        .from('utilisateurs')
                        .select('id, nom, prenom, role, joueur_id')
                        .eq('joueur_id', id as string)
                        .maybeSingle();

                    if (joueurError && joueurError.code !== 'PGRST116') {
                        console.error('Erreur joueur:', joueurError);
                    }

                    if (userByJoueurId) {
                        setJoueurInfo(userByJoueurId as GetUtilisateurById); // FIXME: fonctionne mais type à corriger
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

    // Charge les données d'évaluation si joueurId disponible
    const [evalData, refresh, loadingEval] = useCacheData(
        joueurInfo?.id ? `eval-technique-${joueurInfo?.id}` : null,
        async () => {
            if (!joueurInfo?.id) {
                return null;
            }

            try {
                const { data, error } = await supabase
                    .from('evaluations_techniques')
                    .select('*')
                    .eq('joueur_id', joueurInfo?.id)
                    .maybeSingle();

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

    // Remplit les valeurs si data trouvée
    useEffect(() => {
        if (evalData) {
            const newValeurs = Object.fromEntries(criteres.map((c) => [c, 50]));
            criteres.forEach((critere) => {
                if (evalData[critere as keyof typeof evalData] !== undefined) {
                    newValeurs[critere] = evalData[critere as keyof typeof evalData] as number; // FIXME pas ouf
                }
            });
            setValeurs(newValeurs);
        }
    }, [criteres, evalData]);

    const calculerMoyenne = () => {
        const total = criteres.reduce((sum, crit) => sum + (Number(valeurs[crit]) || 0), 0);
        return Math.round(total / criteres.length);
    };

    const handleSave = async () => {
        setSaving(true);

        try {
            const moyenne = calculerMoyenne();
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
            const session = sessionData?.session;

            if (sessionError || !session?.user?.id) {
                Alert.alert('Erreur', 'Session invalide - veuillez vous reconnecter');
                return;
            }

            if (!joueurInfo?.id) {
                Alert.alert('Erreur', 'Joueur introuvable');
                return;
            }

            // Objet complet avec tous les champs nécessaires
            const updates: any = {
                // FIXME any
                joueur_id: joueurInfo?.id,
                coach_id: session.user.id,
                moyenne: moyenne,
                updated_at: new Date().toISOString(),
            };

            // Ajouter tous les critères
            criteres.forEach((critere) => {
                updates[critere] = Math.round(Number(valeurs[critere]) || 0);
            });

            // Stratégie UPDATE puis INSERT
            const { data: updateData, error: updateError } = await supabase
                .from('evaluations_techniques')
                .update(updates)
                .eq('joueur_id', joueurInfo?.id)
                .eq('coach_id', session.user.id)
                .select();

            if (updateError) {
                Alert.alert('Erreur', `Erreur de mise à jour: ${updateError.message}`);
                return;
            }

            // Si aucune ligne n'a été mise à jour, on insère
            if (!updateData || updateData.length === 0) {
                const { error: insertError } = await supabase
                    .from('evaluations_techniques')
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
                console.error('Erreur cache:', cacheError);
                // Ignore les erreurs de cache
                // FIXME: bizarre ce commentaire
            }

            Alert.alert('Succès', 'Évaluation technique enregistrée avec succès!', [
                {
                    text: 'OK',
                    onPress: () => {
                        router.replace(`/coach/joueur/${joueurInfo?.joueur_id}`);
                    },
                },
            ]);

            if (Platform.OS === 'web') {
                router.replace(`/coach/joueur/${joueurInfo?.joueur_id}`);
            }
        } catch (error) {
            Alert.alert('Erreur', `Erreur inattendue: ${(error as Error).message}`);
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
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>🎯 Évaluation technique</Text>

            {/* Affichage des informations du joueur */}
            {joueurInfo && (
                <View style={styles.playerInfo}>
                    <Text style={styles.playerName}>
                        {joueurInfo.nom} {joueurInfo.prenom}
                    </Text>
                    <Text style={styles.playerRole}>{joueurInfo.role}</Text>
                </View>
            )}

            {criteres.map((critere) => (
                <View key={critere} style={styles.sliderBlock}>
                    <Text style={styles.label}>
                        {critere.replace(/_/g, ' ').toUpperCase()} : {valeurs[critere]}/100
                    </Text>
                    {Platform.OS === 'web' ? (
                        <TextInput
                            keyboardType="numeric"
                            value={String(valeurs[critere])}
                            onChangeText={(val) => {
                                const num = Math.max(0, Math.min(100, parseInt(val) || 0));
                                setValeurs((prev) => ({ ...prev, [critere]: num }));
                            }}
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
                                {valeurs[critere]}
                            </Text>
                            <Slider
                                style={{ flex: 1, marginHorizontal: 12 }}
                                minimumValue={0}
                                maximumValue={100}
                                step={1}
                                value={Number(valeurs[critere])}
                                onValueChange={(val) =>
                                    setValeurs((prev) => ({ ...prev, [critere]: Math.round(val) }))
                                }
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
                style={[styles.button, (saving || loading || loadingEval) && styles.buttonDisabled]}
                disabled={saving || loading || loadingEval}
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
