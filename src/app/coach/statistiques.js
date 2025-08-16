import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Image,
    Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';

function getBadge(note) {
    if (note >= 90) {
        return require('../../assets/badges/platine.png');
    }
    if (note >= 75) {
        return require('../../assets/badges/or.png');
    }
    if (note >= 60) {
        return require('../../assets/badges/argent.png');
    }
    return require('../../assets/badges/bronze.png');
}

export default function Statistiques() {
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);

    async function fetchStats(forceRefresh = false) {
        try {
            setLoading(true);
            console.log('=== DÉBUT RÉCUPÉRATION STATISTIQUES ===');
            console.log('forceRefresh parameter:', forceRefresh);

            // Auth coach
            const { data: session } = await supabase.auth.getSession();
            const userId = session?.session?.user?.id;
            console.log('Coach ID:', userId);

            if (!userId) {
                console.log('Pas de session coach');
                setLoading(false);
                return;
            }

            // FORCAGE : ignorer complètement le cache pour le debug
            console.log('FORCAGE - Cache ignoré complètement pour debug');

            // 1. Récupère toutes les équipes du coach
            console.log('Recherche des équipes pour le coach:', userId);
            const { data: equipes, error: equipesError } = await supabase
                .from('equipes')
                .select('id, nom')
                .eq('coach_id', userId);

            console.log('Équipes trouvées:', equipes);
            console.log('Erreur équipes:', equipesError);

            if (!equipes || equipes.length === 0) {
                console.log('Aucune équipe trouvée pour ce coach');
                setStats([]);
                setLoading(false);
                return;
            }

            let statsEquipes = [];

            // 2. Pour chaque équipe : joueurs, moyennes
            for (let eq of equipes) {
                console.log(`\n--- Traitement équipe: ${eq.nom} (${eq.id}) ---`);

                // Récupère les joueurs de l'équipe
                const { data: joueurs, error: joueursError } = await supabase
                    .from('joueurs')
                    .select('id, nom, prenom')
                    .eq('equipe_id', eq.id);

                console.log(`Joueurs de l'équipe ${eq.nom}:`, joueurs);
                console.log('Erreur joueurs:', joueursError);

                if (!joueurs || !joueurs.length) {
                    console.log(`Pas de joueurs dans l'équipe ${eq.nom}`);
                    continue;
                }

                // Récupère les utilisateurs correspondants à ces joueurs
                const joueursIds = joueurs.map((j) => j.id);
                console.log('IDs joueurs:', joueursIds);

                const { data: utilisateurs, error: utilisateursError } = await supabase
                    .from('utilisateurs')
                    .select('id, joueur_id, nom, prenom')
                    .eq('role', 'joueur')
                    .in('joueur_id', joueursIds);

                console.log('Utilisateurs correspondants:', utilisateurs);
                console.log('Erreur utilisateurs:', utilisateursError);

                if (!utilisateurs || !utilisateurs.length) {
                    console.log(`Aucun utilisateur trouvé pour les joueurs de l'équipe ${eq.nom}`);
                    continue;
                }

                // Crée un mapping joueur_id -> utilisateur_id
                const joueurToUser = {};
                utilisateurs.forEach((user) => {
                    if (user.joueur_id) {
                        joueurToUser[user.joueur_id] = user.id;
                    }
                });

                console.log('Mapping joueur->utilisateur:', joueurToUser);

                // Récupère les IDs utilisateurs pour les évaluations
                const utilisateursIds = Object.values(joueurToUser);
                console.log('IDs utilisateurs pour évaluations:', utilisateursIds);

                if (!utilisateursIds.length) {
                    console.log('Aucun ID utilisateur disponible');
                    continue;
                }

                // Moyenne mentale - utilise les IDs utilisateurs
                const { data: mentales, error: mentalesError } = await supabase
                    .from('evaluations_mentales')
                    .select('note_globale, moyenne, joueur_id')
                    .in('joueur_id', utilisateursIds);

                console.log('Évaluations mentales:', mentales);
                console.log('Erreur évaluations mentales:', mentalesError);

                const moyMentale =
                    mentales && mentales.length
                        ? Math.round(
                              mentales.reduce(
                                  (a, e) => a + Number(e.note_globale || e.moyenne || 0),
                                  0,
                              ) / mentales.length,
                          )
                        : 0;

                console.log('Moyenne mentale calculée:', moyMentale);

                // Moyenne technique - utilise les IDs utilisateurs
                const { data: techniques, error: techniquesError } = await supabase
                    .from('evaluations_techniques')
                    .select('moyenne, joueur_id')
                    .in('joueur_id', utilisateursIds);

                console.log('Évaluations techniques:', techniques);
                console.log('Erreur évaluations techniques:', techniquesError);

                const moyTechnique =
                    techniques && techniques.length
                        ? Math.round(
                              techniques.reduce((a, e) => a + Number(e.moyenne || 0), 0) /
                                  techniques.length,
                          )
                        : 0;

                console.log('Moyenne technique calculée:', moyTechnique);

                // Moyenne globale
                const moyGlobale =
                    moyMentale > 0 && moyTechnique > 0
                        ? Math.round((moyMentale + moyTechnique) / 2)
                        : Math.max(moyMentale, moyTechnique);

                console.log('Moyenne globale calculée:', moyGlobale);

                // Ajoute au tableau seulement si on a une moyenne
                if (moyMentale > 0 || moyTechnique > 0) {
                    const statEquipe = {
                        equipe: eq.nom,
                        mentale: moyMentale,
                        technique: moyTechnique,
                        globale: moyGlobale,
                        nbJoueurs: joueurs.length,
                        nbJoueursEvalues: utilisateursIds.length,
                        nbEvalsMentales: mentales ? mentales.length : 0,
                        nbEvalsTechniques: techniques ? techniques.length : 0,
                    };

                    console.log('Stat équipe ajoutée:', statEquipe);
                    statsEquipes.push(statEquipe);
                } else {
                    console.log(`Aucune évaluation trouvée pour l'équipe ${eq.nom}`);
                }
            }

            console.log('=== STATS FINALES ===');
            console.log('Statistiques équipes:', statsEquipes);

            setStats(statsEquipes);
            console.log('=== FIN RÉCUPÉRATION STATISTIQUES ===');
        } catch (error) {
            console.error('Erreur dans fetchStats:', error);
            setStats([]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        console.log('useEffect déclenché');
        fetchStats(true);
    }, []);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator style={{ marginTop: 60 }} color="#00ff88" />
                <Text style={styles.loadingText}>Calcul des statistiques...</Text>
            </View>
        );
    }

    if (!stats.length) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Aucune statistique disponible.</Text>
                <Text style={styles.emptySubtext}>
                    Créez des évaluations pour vos joueurs pour voir les statistiques d&apos;équipe.
                </Text>
                <Pressable onPress={() => fetchStats(true)} style={styles.refreshButton}>
                    <Text style={styles.refreshText}>🔄 Actualiser</Text>
                </Pressable>
            </View>
        );
    }

    return (
        <LinearGradient colors={['#0a0a0a', '#0f0f0f']} style={styles.container}>
            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.header}>
                    <Text style={styles.title}>🏆 Statistiques d&apos;équipe</Text>
                    <Pressable
                        onPress={() => fetchStats(true)}
                        style={styles.refreshButton}
                        disabled={loading}
                    >
                        <Text style={styles.refreshText}>{loading ? '🔄' : '↻'} Actualiser</Text>
                    </Pressable>
                </View>

                {stats.map((stat, idx) => (
                    <View key={idx} style={styles.card}>
                        <Text style={styles.equipe}>{stat.equipe}</Text>
                        <Text style={styles.debugInfo}>
                            {stat.nbJoueurs} joueur(s) • {stat.nbJoueursEvalues} évalué(s) •{' '}
                            {stat.nbEvalsMentales} éval(s) mentale • {stat.nbEvalsTechniques}{' '}
                            éval(s) technique
                        </Text>
                        <View style={styles.statsRow}>
                            {/* Mentale */}
                            <View style={styles.sideBlock}>
                                <Text style={styles.label}>Mentale</Text>
                                <Text style={styles.value}>{stat.mentale}</Text>
                                <Image
                                    source={getBadge(stat.mentale)}
                                    style={styles.badgeSide}
                                    resizeMode="contain"
                                />
                            </View>
                            {/* Globale */}
                            <View style={styles.centerBlock}>
                                <Text style={styles.labelGlobale}>Globale</Text>
                                <Text style={styles.valueGlobale}>{stat.globale}</Text>
                                <Image
                                    source={getBadge(stat.globale)}
                                    style={styles.badgeCenter}
                                    resizeMode="contain"
                                />
                            </View>
                            {/* Technique */}
                            <View style={styles.sideBlock}>
                                <Text style={styles.label}>Technique</Text>
                                <Text style={styles.value}>{stat.technique}</Text>
                                <Image
                                    source={getBadge(stat.technique)}
                                    style={styles.badgeSide}
                                    resizeMode="contain"
                                />
                            </View>
                        </View>
                    </View>
                ))}

                {/* Photo unique en bas */}
                <Image
                    source={require('../../assets/coach-joueur-highfive.png')}
                    style={styles.highfive}
                    resizeMode="cover"
                />
            </ScrollView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { padding: 20, paddingBottom: 80 },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#0a0a0a',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#ccc',
        marginTop: 10,
        fontSize: 16,
    },
    emptyContainer: {
        flex: 1,
        backgroundColor: '#0a0a0a',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        color: '#fff',
        textAlign: 'center',
        fontSize: 18,
        marginBottom: 10,
    },
    emptySubtext: {
        color: '#ccc',
        textAlign: 'center',
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        color: '#00ff88',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
    },
    refreshButton: {
        backgroundColor: '#1e1e1e',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#00ff88',
    },
    refreshText: {
        color: '#00ff88',
        fontSize: 14,
        fontWeight: 'bold',
    },
    card: {
        backgroundColor: '#1e1e1e',
        borderRadius: 14,
        padding: 22,
        marginBottom: 34,
        borderLeftWidth: 4,
        borderLeftColor: '#00ff88',
        alignItems: 'center',
        width: '100%',
        maxWidth: 650,
        alignSelf: 'center',
    },
    equipe: {
        color: '#00ff88',
        fontSize: 19,
        fontWeight: 'bold',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    debugInfo: {
        color: '#666',
        fontSize: 12,
        marginBottom: 18,
        fontStyle: 'italic',
        textAlign: 'center',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 16,
        width: '100%',
        gap: 18,
        maxWidth: 440,
        alignSelf: 'center',
    },
    sideBlock: {
        alignItems: 'center',
        flex: 1,
    },
    centerBlock: {
        alignItems: 'center',
        flex: 1.2,
    },
    label: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 3,
    },
    value: {
        color: '#00ff88',
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 0,
    },
    badgeSide: {
        width: 44,
        height: 44,
        marginTop: 4,
        marginBottom: 0,
    },
    labelGlobale: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    valueGlobale: {
        color: '#00ff88',
        fontSize: 38,
        fontWeight: 'bold',
        marginBottom: 0,
    },
    badgeCenter: {
        width: 60,
        height: 60,
        marginTop: 4,
        marginBottom: 0,
    },
    highfive: {
        width: '100%',
        aspectRatio: 1,
        borderRadius: 12,
        marginTop: 28,
        marginBottom: 8,
        maxWidth: 440,
        alignSelf: 'center',
    },
});
