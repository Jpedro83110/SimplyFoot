import { useCallback, useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    Dimensions,
    ActivityIndicator,
    ColorValue,
} from 'react-native';
import { COLOR_GREEN_300 } from '@/utils/styleContants.utils';
import {
    EvaluationsTechnique,
    getEvaluationsTechniquesByJoueur,
} from '@/helpers/evaluationsTechniques.helpers';
import { useSession } from '@/hooks/useSession';

interface Criteres {
    key: keyof EvaluationsTechnique;
    label: string;
    color: ColorValue;
}

const criteres: Criteres[] = [
    { key: 'tir', label: 'TIR', color: '#facc15' },
    { key: 'passe', label: 'PASSE', color: COLOR_GREEN_300 },
    { key: 'centre', label: 'CENTRE', color: '#38bdf8' },
    { key: 'tete', label: 'TÊTE', color: '#fb7185' },
    { key: 'vitesse', label: 'VITESSE', color: '#4fd1c5' },
    { key: 'defense', label: 'DÉFENSE', color: '#f97316' },
    { key: 'placement', label: 'PLACEMENT', color: '#a3e635' },
    { key: 'jeu_sans_ballon', label: 'J. SANS BALLON', color: '#818cf8' },
];

export default function EvalTechnique() {
    const [evalData, setEvalData] = useState<EvaluationsTechnique | null>(null);
    const [noteGlobale, setNoteGlobale] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { utilisateur } = useSession();

    async function fetchData(utilisateurId: string) {
        setLoading(true);

        try {
            const fetchedEvalData = await getEvaluationsTechniquesByJoueur({
                joueurId: utilisateurId,
            });

            setEvalData({
                tir: fetchedEvalData?.tir ?? 50,
                passe: fetchedEvalData?.passe ?? 50,
                centre: fetchedEvalData?.centre ?? 50,
                tete: fetchedEvalData?.tete ?? 50,
                vitesse: fetchedEvalData?.vitesse ?? 50,
                defense: fetchedEvalData?.defense ?? 50,
                placement: fetchedEvalData?.placement ?? 50,
                jeu_sans_ballon: fetchedEvalData?.jeu_sans_ballon ?? 50,
            });
            setNoteGlobale(fetchedEvalData?.moyenne ?? null);
        } catch (error) {
            setError((error as Error).message);
        }

        setLoading(false);
    }

    useEffect(() => {
        if (!utilisateur?.id || loading || evalData) {
            return;
        }

        fetchData(utilisateur.id);
    }, [evalData, loading, utilisateur?.id]);

    const computeMoyenne = useCallback(() => {
        if (!evalData) {
            return 0;
        }
        const notes = criteres.map((c) => Number(evalData[c.key]) || 0);
        return Math.round(notes.reduce((a, b) => a + b, 0) / criteres.length);
    }, [evalData]);

    if (loading) {
        return <ActivityIndicator size="large" color="#00ff88" style={{ marginTop: 50 }} />;
    }
    if (error) {
        return <Text style={{ color: 'red', margin: 30, textAlign: 'center' }}>{error}</Text>;
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>⚽ Évaluation technique</Text>

            <Text style={styles.globalNote}>
                Note globale : {noteGlobale ?? computeMoyenne()} / 100
            </Text>

            <View style={styles.jerseyWrapper}>
                <Image
                    source={require('../../assets/maillot-simplyfoot.png')}
                    style={styles.jersey}
                    resizeMode="contain"
                />
            </View>

            <View style={styles.underStatsBlock}>
                <Text style={styles.statsTitle}>Détails par critère</Text>
                {criteres.map(({ key, label, color }) => (
                    <View key={key} style={styles.statRow}>
                        <Text style={styles.statLabel}>{label}</Text>
                        <View style={styles.progressBarBackground}>
                            <View
                                style={[
                                    styles.progressBarFill,
                                    {
                                        width: `${evalData?.[key] ?? 0}%`,
                                        backgroundColor: color,
                                        shadowColor: color,
                                    },
                                ]}
                            />
                        </View>
                        <Text style={styles.statValue}>{evalData?.[key] ?? 50}</Text>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
}

const screenWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#121212',
        padding: 24,
        paddingBottom: 80,
        alignItems: 'center',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#00ff88',
        marginBottom: 10,
        textAlign: 'center',
    },
    globalNote: {
        fontSize: 18,
        color: '#00ff88',
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 16,
    },
    jerseyWrapper: {
        width: screenWidth * 0.9,
        alignItems: 'center',
        position: 'relative',
    },
    jersey: {
        width: '100%',
        height: undefined,
        aspectRatio: 3 / 4,
        zIndex: 0,
    },
    underStatsBlock: {
        marginTop: 30,
        width: '100%',
        backgroundColor: '#0e0e0e',
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: '#00ff88',
        paddingVertical: 20,
        paddingHorizontal: 18,
        shadowColor: '#00ff88',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 8,
    },
    statsTitle: {
        color: '#00ff88',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 14,
    },
    statRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    statLabel: {
        color: '#ccc',
        fontSize: 15,
        fontWeight: '500',
        flex: 1.3,
    },
    progressBarBackground: {
        height: 12,
        width: '45%',
        backgroundColor: '#222',
        borderRadius: 8,
        marginHorizontal: 8,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: 12,
        borderRadius: 8,
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 1 },
        elevation: 2,
    },
    statValue: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
        flex: 0.7,
        textAlign: 'right',
    },
});
