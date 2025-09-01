import { useCallback, useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    ScrollView,
    Pressable,
    TextInput,
    Alert,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    deleteCoachSuiviPersonnalise,
    GetCoachSuivisPersonnalisesByJoueurId,
    getCoachSuivisPersonnalisesByJoueurId,
    SuiviPersonnalise,
    upsertCoachSuiviPersonnalise,
} from '@/helpers/suivisPersonnalises.helpers';
import { useSession } from '@/hooks/useSession';
import { Database } from '@/types/database.types';
import { formatDateForDisplay } from '@/utils/date.utils';

type JoueurDetailParams = {
    id: string;
};

export default function JoueurDetail() {
    const { id } = useLocalSearchParams<JoueurDetailParams>();
    const router = useRouter();

    const [loading, setLoading] = useState(false);

    const [suivi, setSuivi] = useState<GetCoachSuivisPersonnalisesByJoueurId | null>(null);
    const [newSuivi, setNewSuivi] = useState<SuiviPersonnalise>({
        point_fort: '',
        axe_travail: '',
    });
    const [saving, setSaving] = useState(false);

    const { utilisateur } = useSession();

    const fetchAll = async (coachId: string, joueurId: string) => {
        setLoading(true);

        try {
            const fetchedSuiviPersonnalises = await getCoachSuivisPersonnalisesByJoueurId({
                coachId,
                joueurId,
            });

            setSuivi(fetchedSuiviPersonnalises);
        } catch (error) {
            console.error('Erreur générale:', error);
            Alert.alert('Erreur', 'Impossible de charger les données');
        }

        setLoading(false);
    };

    useEffect(() => {
        if (!id || !utilisateur?.id || loading || suivi) {
            return;
        }

        fetchAll(utilisateur.id, id);
    }, [id, loading, suivi, utilisateur?.id]);

    useEffect(() => {
        if (suivi) {
            setNewSuivi({
                axe_travail: suivi.suivis_personnalises[0]?.axe_travail || '',
                point_fort: suivi.suivis_personnalises[0]?.point_fort || '',
            });
        }
    }, [suivi]);

    // --- Ajouter / MAJ suivi personnalisé ---
    const ajouterOuMajSuivi = useCallback(async () => {
        if (!newSuivi.point_fort && !newSuivi.axe_travail) {
            Alert.alert(
                'Information',
                'Veuillez remplir au moins un champ (point fort ou axe de travail)',
            );
            return;
        }

        if (!utilisateur?.id || !suivi?.id || saving) {
            return;
        }

        setSaving(true);

        try {
            const dataToUpdate: Database['public']['Tables']['suivis_personnalises']['Update'] = {
                joueur_id: suivi.id,
                coach_id: utilisateur.id,
                point_fort: newSuivi.point_fort,
                axe_travail: newSuivi.axe_travail,
                updated_at: new Date().toISOString(),
            };

            const suivisPersonnalisesId =
                suivi.suivis_personnalises.length > 0 ? suivi.suivis_personnalises[0].id : null;

            const data = await upsertCoachSuiviPersonnalise({
                suivisPersonnalisesId,
                dataToUpdate,
            });

            // add suivi to state
            setSuivi((prevData) => {
                if (prevData) {
                    const newData = prevData;
                    newData.suivis_personnalises = [
                        {
                            ...data,
                            ...newSuivi,
                        },
                    ];
                    return newData;
                } else {
                    return prevData;
                }
            });

            setSaving(false);
        } catch (error) {
            console.error('Erreur générale sauvegarde:', error);
            Alert.alert('Erreur', 'Une erreur inattendue est survenue');
            setSaving(false);
        }
    }, [newSuivi, saving, suivi?.id, suivi?.suivis_personnalises, utilisateur?.id]);

    const fetchDeleteCoachSuiviPersonnalise = async (suivisPersonnalisesId: string) => {
        try {
            await deleteCoachSuiviPersonnalise({
                suivisPersonnalisesId,
            });

            setNewSuivi({ point_fort: '', axe_travail: '' });
            setSuivi(null);
            Alert.alert('✅ Supprimé', 'Suivi personnalisé supprimé');
        } catch (error) {
            Alert.alert('Erreur', (error as Error).message);
        }
    };

    const supprimerSuivi = (suiviPersonnaliseId: string) => {
        // FIXME: revoir la confirmation pour uniformiser web et mobile
        if (Platform.OS === 'web') {
            if (confirm('Êtes-vous sûr de vouloir supprimer ce suivi personnalisé ?')) {
                fetchDeleteCoachSuiviPersonnalise(suiviPersonnaliseId);
            }
        } else {
            Alert.alert(
                'Confirmer la suppression',
                'Êtes-vous sûr de vouloir supprimer ce suivi personnalisé ?',
                [
                    { text: 'Annuler', style: 'cancel' },
                    {
                        text: 'Supprimer',
                        style: 'destructive',
                        onPress: () => {
                            fetchDeleteCoachSuiviPersonnalise(suiviPersonnaliseId);
                        },
                    },
                ],
            );
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator style={{ marginTop: 40 }} color="#00ff88" />
                <Text style={styles.loadingText}>Chargement des données...</Text>
            </View>
        );
    }

    if (!suivi?.joueurs) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Joueur inconnu</Text>
            </View>
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Image source={require('../../../assets/logo-v2.png')} style={styles.avatar} />
            <Text style={styles.title}>{suivi.prenom + ' ' + suivi.nom}</Text>
            <Text style={styles.subtitle}>Poste : {suivi.joueurs.poste}</Text>

            <View style={styles.statsBlock}>
                <Text style={styles.statsTitle}>📊 Statistiques</Text>
                {/* FIXME: Match, buts et passes décisives n'existe pas encore en bdd */}
                <Text style={styles.statLine}>Matchs joués : {0}</Text>
                <Text style={styles.statLine}>Buts : {0}</Text>
                <Text style={styles.statLine}>Passes décisives : {0}</Text>
            </View>

            <View style={styles.followUpBlock}>
                <Text style={styles.statsTitle}>📘 Suivi personnalisé</Text>

                <Text style={styles.label}>🟢 Point fort</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ex : Très bon positionnement défensif"
                    placeholderTextColor="#888"
                    value={newSuivi.point_fort}
                    onChangeText={(text) => setNewSuivi((prev) => ({ ...prev, point_fort: text }))}
                    multiline
                    numberOfLines={2}
                />

                <Text style={styles.label}>🔴 À travailler</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ex : Doit améliorer sa réactivité défensive"
                    placeholderTextColor="#888"
                    value={newSuivi.axe_travail}
                    onChangeText={(text) => setNewSuivi((prev) => ({ ...prev, axe_travail: text }))}
                    multiline
                    numberOfLines={2}
                />

                {/* 🔧 BOUTONS D'ACTION */}
                <View style={styles.buttonRow}>
                    <Pressable onPress={ajouterOuMajSuivi} style={styles.button} disabled={saving}>
                        <Text style={styles.buttonText}>
                            {saving
                                ? 'Enregistrement...'
                                : suivi.suivis_personnalises[0]
                                  ? 'Mettre à jour'
                                  : 'Ajouter'}
                        </Text>
                    </Pressable>

                    {suivi.suivis_personnalises[0] && (
                        <Pressable
                            onPress={() => supprimerSuivi(suivi.suivis_personnalises[0].id)}
                            style={[styles.button, styles.deleteButton]}
                        >
                            <Text style={[styles.buttonText, { color: '#fff' }]}>🗑️ Supprimer</Text>
                        </Pressable>
                    )}
                </View>

                {/* 🔧 AFFICHAGE DU SUIVI EXISTANT */}
                {suivi.suivis_personnalises[0] && (
                    <View style={styles.suiviCard}>
                        {suivi.suivis_personnalises[0]?.created_at && (
                            <Text style={styles.suiviText}>
                                📅 Dernière mise à jour :{' '}
                                {formatDateForDisplay({
                                    date: new Date(suivi.suivis_personnalises[0]?.updated_at!),
                                })}
                            </Text>
                        )}
                        {suivi.suivis_personnalises[0]?.point_fort ? (
                            <Text style={[styles.suiviContenu, { color: '#00ff88' }]}>
                                🟢 Point fort : {suivi.suivis_personnalises[0]?.point_fort}
                            </Text>
                        ) : null}
                        {suivi.suivis_personnalises[0]?.axe_travail ? (
                            <Text style={[styles.suiviContenu, { color: '#ff5555' }]}>
                                🔴 À travailler : {suivi.suivis_personnalises[0]?.axe_travail}
                            </Text>
                        ) : null}
                    </View>
                )}

                <Pressable
                    style={[styles.button, { backgroundColor: '#222', marginTop: 10 }]}
                    onPress={() => fetchAll(utilisateur?.id || '', id)}
                    disabled={loading}
                >
                    <Text style={[styles.buttonText, { color: '#00ff88' }]}>
                        {loading ? 'Chargement...' : '🔄 Actualiser'}
                    </Text>
                </Pressable>
            </View>

            <Pressable
                style={[
                    styles.button,
                    { backgroundColor: '#003322', alignSelf: 'stretch', marginBottom: 10 },
                ]}
                onPress={() => router.push(`/coach/evaluation-mentale/${id}`)}
            >
                <Text style={[styles.buttonText, { color: '#00ff88', textAlign: 'center' }]}>
                    🧠 Évaluer le mental
                </Text>
            </Pressable>

            <Pressable
                style={[
                    styles.button,
                    { backgroundColor: '#220033', alignSelf: 'stretch', marginBottom: 40 },
                ]}
                onPress={() => router.push(`/coach/evaluation-technique/${id}`)}
            >
                <Text style={[styles.buttonText, { color: '#ff00ff', textAlign: 'center' }]}>
                    🎯 Évaluer la technique
                </Text>
            </Pressable>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#121212',
        padding: 30,
        alignItems: 'center',
        minHeight: '100%',
    },
    loadingContainer: {
        backgroundColor: '#121212',
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#ccc',
        marginTop: 10,
        fontSize: 16,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        marginBottom: 20,
        borderWidth: 2,
        borderColor: '#00ff88',
    },
    title: {
        fontSize: 26,
        color: '#00ff88',
        fontWeight: 'bold',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#aaa',
        marginBottom: 6,
    },
    statsBlock: {
        backgroundColor: '#1e1e1e',
        borderRadius: 10,
        padding: 20,
        width: '100%',
        marginBottom: 30,
    },
    followUpBlock: {
        backgroundColor: '#1a1a1a',
        borderRadius: 10,
        padding: 20,
        width: '100%',
        marginBottom: 30,
        borderLeftWidth: 4,
        borderLeftColor: '#00ff88',
    },
    statsTitle: {
        color: '#00ff88',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    label: {
        color: '#ccc',
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 6,
    },
    statLine: {
        color: '#fff',
        fontSize: 16,
        marginBottom: 6,
    },
    input: {
        backgroundColor: '#1e1e1e',
        color: '#fff',
        padding: 12,
        borderRadius: 8,
        marginBottom: 15,
        borderColor: '#444',
        borderWidth: 1,
        minHeight: 50,
        textAlignVertical: 'top',
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 20,
    },
    button: {
        backgroundColor: '#00ff88',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 10,
        flex: 1,
        alignItems: 'center',
    },
    deleteButton: {
        backgroundColor: '#ff4444',
    },
    buttonText: {
        color: '#111',
        fontWeight: 'bold',
        fontSize: 14,
    },
    suiviCard: {
        backgroundColor: '#292929',
        padding: 15,
        borderRadius: 8,
        marginBottom: 15,
        borderLeftWidth: 3,
        borderLeftColor: '#00ff88',
    },
    suiviText: {
        color: '#ccc',
        fontSize: 12,
        marginBottom: 8,
        fontStyle: 'italic',
    },
    suiviContenu: {
        color: '#fff',
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 5,
    },
});
