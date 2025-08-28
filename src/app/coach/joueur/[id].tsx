import React, { useCallback, useEffect, useState } from 'react';
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

    const fetchAll = useCallback(async () => {
        if (!utilisateur?.id || loading) {
            return;
        }

        setLoading(true);

        try {
            const fetchedSuiviPersonnalises = await getCoachSuivisPersonnalisesByJoueurId({
                coachId: utilisateur.id,
                joueurId: id,
            });

            setSuivi(fetchedSuiviPersonnalises || null);
        } catch (error) {
            console.error('Erreur générale:', error);
            Alert.alert('Erreur', 'Impossible de charger les données');
        }

        setLoading(false);
    }, [id, loading, utilisateur?.id]);

    useEffect(() => {
        fetchAll();
    }, [fetchAll, id]);

    useEffect(() => {
        if (suivi) {
            setNewSuivi({
                axe_travail: suivi.axe_travail || '',
                point_fort: suivi.point_fort || '',
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

        if (!utilisateur?.id || !suivi?.utilisateurs?.id) {
            return;
        }

        setSaving(true);

        try {
            const dataToUpdate: Database['public']['Tables']['suivis_personnalises']['Update'] = {
                joueur_id: suivi.utilisateurs.id,
                coach_id: utilisateur.id,
                point_fort: newSuivi.point_fort,
                axe_travail: newSuivi.axe_travail,
                updated_at: new Date().toISOString(),
            };

            await upsertCoachSuiviPersonnalise({
                suiviPersonnaliseId: suivi.id,
                dataToUpdate,
            });

            setSaving(false);
        } catch (error) {
            console.error('Erreur générale sauvegarde:', error);
            Alert.alert('Erreur', 'Une erreur inattendue est survenue');
            setSaving(false);
        }
    }, [
        newSuivi.axe_travail,
        newSuivi.point_fort,
        suivi?.id,
        suivi?.utilisateurs?.id,
        utilisateur?.id,
    ]);

    // 🔧 CORRECTION : Fonction de suppression du suivi
    const supprimerSuivi = async () => {
        Alert.alert(
            'Confirmer la suppression',
            'Êtes-vous sûr de vouloir supprimer ce suivi personnalisé ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteCoachSuiviPersonnalise({
                                suiviPersonnaliseId: suivi?.id || '',
                            });

                            setNewSuivi({ point_fort: '', axe_travail: '' });
                            setSuivi(null);
                            Alert.alert('✅ Supprimé', 'Suivi personnalisé supprimé');
                        } catch (error) {
                            Alert.alert('Erreur', (error as Error).message);
                        }
                    },
                },
            ],
        );
    };

    if (loading || !suivi?.utilisateurs?.joueurs) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator style={{ marginTop: 40 }} color="#00ff88" />
                <Text style={styles.loadingText}>Chargement des données...</Text>
            </View>
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Image source={require('../../../assets/logo-v2.png')} style={styles.avatar} />
            <Text style={styles.title}>
                {suivi.utilisateurs.prenom + ' ' + suivi.utilisateurs.nom}
            </Text>
            <Text style={styles.subtitle}>Poste : {suivi.utilisateurs.joueurs.poste}</Text>

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
                            {saving ? 'Enregistrement...' : suivi ? 'Mettre à jour' : 'Ajouter'}
                        </Text>
                    </Pressable>

                    {suivi && (
                        <Pressable
                            onPress={supprimerSuivi}
                            style={[styles.button, styles.deleteButton]}
                        >
                            <Text style={[styles.buttonText, { color: '#fff' }]}>🗑️ Supprimer</Text>
                        </Pressable>
                    )}
                </View>

                {/* 🔧 AFFICHAGE DU SUIVI EXISTANT */}
                {suivi && (
                    <View style={styles.suiviCard}>
                        <Text style={styles.suiviText}>
                            📅 Dernière mise à jour :{' '}
                            {suivi.updated_at
                                ? formatDateForDisplay({ date: suivi.updated_at })
                                : suivi.created_at
                                  ? formatDateForDisplay({ date: suivi.created_at })
                                  : 'Date inconnue'}
                        </Text>
                        {suivi.point_fort ? (
                            <Text style={[styles.suiviContenu, { color: '#00ff88' }]}>
                                🟢 Point fort : {suivi.point_fort}
                            </Text>
                        ) : null}
                        {suivi.axe_travail ? (
                            <Text style={[styles.suiviContenu, { color: '#ff5555' }]}>
                                🔴 À travailler : {suivi.axe_travail}
                            </Text>
                        ) : null}
                    </View>
                )}

                <Pressable
                    style={[styles.button, { backgroundColor: '#222', marginTop: 10 }]}
                    onPress={fetchAll}
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

            <Text style={styles.idLine}>ID joueur : #{id}</Text>
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
    idLine: {
        color: '#666',
        fontSize: 14,
        fontStyle: 'italic',
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
