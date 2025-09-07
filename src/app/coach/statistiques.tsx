import { useEffect, useState } from 'react';
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
import { useSession } from '@/hooks/useSession';
import { getCoachEquipesEvaluations } from '@/helpers/equipes.helpers';

interface StatEquipe {
    equipe: string;
    mentale: number;
    technique: number;
    globale: number;
    nbJoueurs: number;
    nbJoueursEvalues: number;
    nbEvalsMentales: number;
    nbEvalsTechniques: number;
}

function getBadge(note: number) {
    if (note >= 90) {
        return require('../../assets/badges/platine.png');
    } else if (note >= 75) {
        return require('../../assets/badges/or.png');
    } else if (note >= 60) {
        return require('../../assets/badges/argent.png');
    } else {
        return require('../../assets/badges/bronze.png');
    }
}

export default function Statistiques() {
    const [stats, setStats] = useState<StatEquipe[] | undefined>(undefined);
    const [loading, setLoading] = useState(false);

    const { utilisateur } = useSession();

    const fetchStats = async (coachId: string, clubId: string) => {
        try {
            setLoading(true);

            const evaluations = await getCoachEquipesEvaluations({
                coachId,
                clubId,
            });

            if (evaluations.length === 0) {
                setStats([]);
                setLoading(false);
                return;
            }

            let statsEquipes = [];

            for (let evaluation of evaluations) {
                const mentales = evaluation.joueurs
                    .map((joueur) => joueur.utilisateurs.evaluations_mentales)
                    .flat();

                const moyMentale =
                    mentales && mentales.length
                        ? Math.round(
                              mentales.reduce(
                                  (a, e) => a + Number(e.note_globale || e.moyenne || 0),
                                  0,
                              ) / mentales.length,
                          )
                        : 0;

                const techniques = evaluation.joueurs
                    .map((joueur) => joueur.utilisateurs.evaluations_techniques)
                    .filter((evaluation) => evaluation);

                const moyTechnique =
                    techniques && techniques.length
                        ? Math.round(
                              techniques.reduce(
                                  (prev, evaluation) => prev + Number(evaluation?.moyenne || 0),
                                  0,
                              ) / techniques.length,
                          )
                        : 0;

                const moyGlobale =
                    moyMentale > 0 && moyTechnique > 0
                        ? Math.round((moyMentale + moyTechnique) / 2)
                        : Math.max(moyMentale, moyTechnique);

                const nbJoueursEvalues = evaluation.joueurs.filter(
                    (joueur) =>
                        joueur.utilisateurs.evaluations_mentales.length > 0 ||
                        joueur.utilisateurs.evaluations_techniques,
                ).length;

                if (moyMentale > 0 || moyTechnique > 0) {
                    const statEquipe = {
                        equipe: evaluation.nom,
                        mentale: moyMentale,
                        technique: moyTechnique,
                        globale: moyGlobale,
                        nbJoueurs: evaluation.joueurs.length,
                        nbJoueursEvalues,
                        nbEvalsMentales: mentales ? mentales.length : 0,
                        nbEvalsTechniques: techniques ? techniques.length : 0,
                    };

                    statsEquipes.push(statEquipe);
                }
            }

            setStats(statsEquipes);
        } catch (error) {
            console.error(error);
            setStats([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!utilisateur?.club_id || !loading || stats) {
            return;
        }

        fetchStats(utilisateur.id, utilisateur.club_id);
    }, [loading, stats, utilisateur?.club_id, utilisateur?.id]);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator style={{ marginTop: 60 }} color="#00ff88" />
                <Text style={styles.loadingText}>Calcul des statistiques...</Text>
            </View>
        );
    }

    if (!stats) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Aucune statistique disponible.</Text>
                <Text style={styles.emptySubtext}>
                    Créez des évaluations pour vos joueurs pour voir les statistiques d&apos;équipe.
                </Text>
                <Pressable
                    onPress={() =>
                        utilisateur?.club_id &&
                        !loading &&
                        fetchStats(utilisateur.id, utilisateur.club_id)
                    }
                    style={styles.refreshButton}
                    disabled={loading}
                >
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
                        onPress={() =>
                            utilisateur?.club_id &&
                            !loading &&
                            fetchStats(utilisateur.id, utilisateur.club_id)
                        }
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
