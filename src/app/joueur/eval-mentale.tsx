import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, ColorValue } from 'react-native';
import { useSession } from '@/hooks/useSession';
import { COLOR_GREEN_300 } from '@/utils/styleContants.utils';
import {
    EvaluationsMentale,
    getEvaluationsMentalesByJoueur,
} from '@/helpers/evaluationsMentales.helpers';

interface Criteres {
    key: keyof EvaluationsMentale;
    label: string;
    color: ColorValue;
}

const criteres: Criteres[] = [
    { key: 'motivation', label: 'Motivation', color: COLOR_GREEN_300 },
    { key: 'rigueur', label: 'Rigueur', color: '#4fd1c5' },
    { key: 'ponctualite', label: 'Ponctualité', color: '#facc15' },
    { key: 'attitude', label: 'Attitude', color: '#f97316' },
    { key: 'respect', label: 'Respect', color: '#fb7185' },
];

export default function EvalMentale() {
    const [evalData, setEvalData] = useState<EvaluationsMentale | null>(null);
    const [noteGlobale, setNoteGlobale] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { utilisateur } = useSession();

    const fetchData = async (utilisateurId: string) => {
        setLoading(true);

        try {
            const fetchedEvalData = await getEvaluationsMentalesByJoueur({
                joueurId: utilisateurId,
            });

            setEvalData({
                motivation: fetchedEvalData?.motivation ?? 50,
                rigueur: fetchedEvalData?.rigueur ?? 50,
                ponctualite: fetchedEvalData?.ponctualite ?? 50,
                attitude: fetchedEvalData?.attitude ?? 50,
                respect: fetchedEvalData?.respect ?? 50,
            });
            setNoteGlobale(fetchedEvalData?.note_globale ?? null);
        } catch (error) {
            setError((error as Error).message);
        }

        setLoading(false);
    };

    useEffect(() => {
        if (!utilisateur?.id || loading || evalData) {
            return;
        }

        fetchData(utilisateur.id);
    }, [evalData, loading, utilisateur?.id]);

    const computeNoteGlobale = useCallback(() => {
        if (!evalData) {
            return 0;
        }

        const notes = Object.values(evalData).filter((value) => Number(value));
        return Math.round(notes.reduce((a, b) => a + b, 0) / notes.length);
    }, [evalData]);

    if (loading) {
        return <ActivityIndicator size="large" color="#00ff88" style={{ marginTop: 40 }} />;
    }
    if (error) {
        return <Text style={{ color: 'red', margin: 30, textAlign: 'center' }}>{error}</Text>;
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>🧠 Évaluation mentale</Text>
            <Text style={styles.readonly}>Lecture seule</Text>

            {evalData &&
                criteres.map(({ key, label, color }) => (
                    <View key={key} style={styles.block}>
                        <Text style={[styles.label, { color }]}>{label.toUpperCase()}</Text>
                        <View style={styles.progressBarBackground}>
                            <View
                                style={[
                                    styles.progressBarFill,
                                    {
                                        width: `${evalData[key] || 0}%`,
                                        backgroundColor: color,
                                        shadowColor: color,
                                    },
                                ]}
                            />
                        </View>
                        <Text style={styles.score}>{evalData?.[key] ?? 0} / 100</Text>
                    </View>
                ))}

            <View style={styles.moyenneBlock}>
                <Text style={styles.moyenneLabel}>
                    🟢 Note globale : {noteGlobale ?? computeNoteGlobale()} / 100
                </Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#121212',
        padding: 24,
        paddingBottom: 80,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#00ff88',
        marginBottom: 10,
        textAlign: 'center',
    },
    readonly: {
        fontSize: 13,
        color: '#888',
        marginBottom: 24,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    block: {
        marginBottom: 22,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 6,
    },
    progressBarBackground: {
        width: '100%',
        height: 14,
        backgroundColor: '#333',
        borderRadius: 10,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 2,
        elevation: 2,
    },
    progressBarFill: {
        height: 14,
        borderRadius: 10,
        shadowOpacity: 0.25,
        shadowOffset: { width: 0, height: 1 },
        elevation: 2,
    },
    score: {
        color: '#aaa',
        fontSize: 14,
        marginTop: 4,
        textAlign: 'right',
    },
    moyenneBlock: {
        marginTop: 30,
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
    small: {
        color: '#888',
        fontSize: 13,
        textAlign: 'center',
        marginTop: 14,
    },
});
