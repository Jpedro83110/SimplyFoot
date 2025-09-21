import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Image,
    Dimensions,
    Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
    GetUtilisateurEvaluationsMoyennes,
    getUtilisateurEvaluationsMoyennes,
} from '@/helpers/utilisateurs.helpers';
import { useSession } from '@/hooks/useSession';

const screenWidth = Dimensions.get('window').width;

export default function NoteGlobaleEquipe() {
    const [loading, setLoading] = useState(false);
    const [moyennes, setMoyennes] = useState<GetUtilisateurEvaluationsMoyennes | undefined>(
        undefined,
    );

    const { utilisateur } = useSession();

    async function fetchNotes(utilisateurId: string) {
        setLoading(true);

        try {
            const fetchedMoyennes = await getUtilisateurEvaluationsMoyennes({
                utilisateurId,
            });

            setMoyennes(fetchedMoyennes);
        } catch (err) {
            console.error(err);
        }

        setLoading(false);
    }

    useEffect(() => {
        if (!utilisateur?.id || loading || moyennes) {
            return;
        }

        fetchNotes(utilisateur.id);
    }, [loading, moyennes, utilisateur?.id]);

    function calcMoyenneGen(mentale: number | null, technique: number | null) {
        if (mentale !== null && technique !== null) {
            return Math.round((Number(mentale) + Number(technique)) / 2);
        }
        if (mentale !== null) {
            return Math.round(Number(mentale));
        }
        if (technique !== null) {
            return Math.round(Number(technique));
        }
        return null;
    }

    let moyenneGen = null;
    if (moyennes) {
        moyenneGen = calcMoyenneGen(
            moyennes.evaluations_mentales.length > 0
                ? moyennes.evaluations_mentales[0].moyenne
                : null,
            moyennes.evaluations_techniques?.moyenne || null,
        );
    }

    function getBadge(moyenneGen: number | null) {
        if (moyenneGen === null) {
            return null;
        }

        if (moyenneGen >= 95) {
            return {
                icon: require('../../assets/badges/platine.png'),
                label: 'PLATINE',
                color: '#9eeaff',
            };
        }

        if (moyenneGen >= 80) {
            return { icon: require('../../assets/badges/or.png'), label: 'OR', color: '#ffe773' };
        }

        if (moyenneGen >= 60) {
            return {
                icon: require('../../assets/badges/argent.png'),
                label: 'ARGENT',
                color: '#bfcbd6',
            };
        }

        return {
            icon: require('../../assets/badges/bronze.png'),
            label: 'BRONZE',
            color: '#d6964c',
        };
    }

    const badge = getBadge(moyenneGen);

    if (loading) {
        return <ActivityIndicator style={{ marginTop: 40 }} color="#00ff88" />;
    }

    if (!moyennes) {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>🏆 Note globale du joueur</Text>
                <Text style={{ color: '#fff', marginTop: 20, fontSize: 16, textAlign: 'center' }}>
                    Aucune note disponible pour le moment.
                </Text>
            </View>
        );
    }

    const isMobile = screenWidth < 600;
    const displayNote = (note: number | null) =>
        note !== null ? `${Math.round(note)}/100` : '—/100';

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>🏆 Note globale du joueur</Text>

            <View style={[styles.row, isMobile && styles.rowMobile]}>
                <View style={[styles.noteCard, isMobile && styles.noteCardMobile]}>
                    <MaterialCommunityIcons
                        name="emoticon-happy-outline"
                        size={isMobile ? 32 : 40}
                        color="#00ff88"
                    />
                    <Text style={styles.label}>Mentale</Text>
                    <Text style={styles.note}>
                        {displayNote(
                            moyennes.evaluations_mentales.length > 0
                                ? moyennes.evaluations_mentales[0].moyenne
                                : null,
                        )}
                    </Text>
                </View>

                <View style={styles.cupBlock}>
                    <Image
                        source={require('../../assets/coupe-simplyfoot.png')}
                        style={isMobile ? styles.cupImageMobile : styles.cupImage}
                        resizeMode="contain"
                    />
                </View>

                <View style={[styles.noteCard, isMobile && styles.noteCardMobile]}>
                    <MaterialCommunityIcons
                        name="soccer"
                        size={isMobile ? 32 : 40}
                        color="#00ff88"
                    />
                    <Text style={styles.label}>Technique</Text>
                    <Text style={styles.note}>
                        {displayNote(moyennes.evaluations_techniques?.moyenne || null)}
                    </Text>
                </View>
            </View>

            <View style={styles.badgeBlock}>
                <Text style={styles.badgeTitle}>Badge du joueur</Text>
                {badge && (
                    <View style={styles.badgeVisual}>
                        <Image
                            source={badge.icon}
                            style={isMobile ? styles.badgeImageMobile : styles.badgeImage}
                            resizeMode="contain"
                        />
                        <Text style={[styles.badgeLabel, { color: badge.color }]}>
                            {badge.label}
                        </Text>
                        <Text style={styles.bigNote}>
                            {moyenneGen !== null ? `${moyenneGen}/100` : '—/100'}
                        </Text>
                    </View>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: '#0a0a0a',
        alignItems: 'center',
        paddingVertical: 30,
        minHeight: 680,
        minWidth: '100%',
        justifyContent: 'flex-start',
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#00ff88',
        marginBottom: 30,
        textAlign: 'center',
        marginTop: 8,
        zIndex: 2,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 38,
        width: '100%',
        marginBottom: 38,
        zIndex: 2,
    },
    rowMobile: {
        flexDirection: 'column',
        gap: 0,
        marginBottom: 18,
    },
    noteCard: {
        backgroundColor: '#151a1e',
        borderRadius: 16,
        borderWidth: 3,
        borderColor: '#00ff88',
        padding: 24,
        alignItems: 'center',
        width: 140,
        minHeight: 110,
        justifyContent: 'center',
        shadowColor: '#00ff88',
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 2,
        marginHorizontal: 10,
        marginVertical: 0,
    },
    noteCardMobile: {
        width: 125,
        minHeight: 85,
        padding: 15,
        marginHorizontal: 0,
        marginVertical: 6,
    },
    label: {
        color: '#00ff88',
        fontSize: 16,
        marginTop: 8,
        marginBottom: 4,
        fontWeight: '600',
    },
    note: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 2,
        textShadowColor: '#00ff8850',
        textShadowOffset: { width: 1, height: 2 },
        textShadowRadius: 7,
    },
    cupBlock: {
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 3,
        marginHorizontal: 8,
    },
    cupImage: {
        width: 115,
        height: 120,
        opacity: 0.97,
    },
    cupImageMobile: {
        width: 70,
        height: 78,
        opacity: 0.97,
        marginVertical: 10,
    },
    badgeBlock: {
        marginTop: 24,
        alignItems: 'center',
        width: '100%',
        zIndex: 2,
    },
    badgeTitle: {
        color: '#00ff88',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center',
        letterSpacing: 1,
        textShadowColor: '#0a6c3f',
        textShadowOffset: { width: 1, height: 2 },
        textShadowRadius: 4,
    },
    badgeVisual: {
        alignItems: 'center',
        backgroundColor: '#141f1bcc',
        borderRadius: 26,
        padding: 28,
        marginTop: 8,
        shadowColor: '#00ff88',
        shadowOpacity: 0.17,
        shadowRadius: 18,
        elevation: 4,
        minWidth: 170,
        maxWidth: 300,
    },
    badgeImage: {
        width: 90,
        height: 90,
        marginBottom: 10,
        shadowColor: '#fff',
        shadowOpacity: Platform.OS === 'web' ? 0 : 0.25,
        shadowRadius: 13,
        shadowOffset: { width: 0, height: 0 },
    },
    badgeImageMobile: {
        width: 68,
        height: 68,
        marginBottom: 8,
        shadowColor: '#fff',
        shadowOpacity: 0,
    },
    badgeLabel: {
        fontSize: 27,
        fontWeight: 'bold',
        marginBottom: 4,
        textShadowColor: '#222',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 4,
        letterSpacing: 1.5,
    },
    bigNote: {
        fontSize: 30,
        fontWeight: 'bold',
        color: '#00ff88',
        marginTop: 7,
        textShadowColor: '#0f0',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 7,
    },
});
