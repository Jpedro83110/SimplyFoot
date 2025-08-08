import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';

const defaultEvalData = {
    motivation: 50,
    rigueur: 50,
    ponctualite: 50,
    attitude: 50,
    respect: 50,
};

interface Critere {
    key: keyof typeof defaultEvalData;
    label: string;
    color: string;
}

export default function EvalMentale() {
    const { user } = useLocalSearchParams();
    const [evalData, setEvalData] = useState<{
        note_globale?: any;
        motivation: any;
        rigueur: any;
        ponctualite: any;
        attitude: any;
        respect: any;
    }>();
    const [loading, setLoading] = useState(true);
    const [role, setRole] = useState('');
    const [error, setError] = useState('');

    const criteres = useMemo<Critere[]>(
        () => [
            { key: 'motivation', label: 'Motivation', color: '#00ff88' },
            { key: 'rigueur', label: 'Rigueur', color: '#4fd1c5' },
            { key: 'ponctualite', label: 'Ponctualité', color: '#facc15' },
            { key: 'attitude', label: 'Attitude', color: '#f97316' },
            { key: 'respect', label: 'Respect', color: '#fb7185' },
        ],
        [],
    );

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            setError('');
            try {
                const { data: sessionData } = await supabase.auth.getSession();
                const userId = sessionData?.session?.user?.id;
                if (!userId) {
                    throw new Error('Utilisateur non identifié.');
                }

                const { data: utilisateur } = await supabase
                    .from('utilisateurs')
                    .select('role')
                    .eq('id', userId)
                    .single();

                const currentRole = utilisateur?.role || 'joueur';
                setRole(currentRole);

                const joueurId = user || userId;

                const { data, error } = await supabase
                    .from('evaluations_mentales')
                    .select('note_globale, motivation, rigueur, ponctualite, attitude, respect')
                    .eq('joueur_id', joueurId)
                    .single();

                if (error && error.code !== 'PGRST116') {
                    throw new Error("Impossible de charger l'évaluation.");
                }
                setEvalData(data || defaultEvalData);
            } catch (error) {
                setError((error as Error).message);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [criteres, user]);

    // Calcul dynamique de la note globale au cas où elle n'existe pas
    const computeNoteGlobale = () => {
        if (!evalData) {
            return 0;
        }

        const notes = Object.values(evalData).filter((value) => Number(value));
        return Math.round(notes.reduce((a, b) => a + b, 0) / notes.length);
    };

    if (loading) {
        return <ActivityIndicator size="large" color="#00ff88" style={{ marginTop: 40 }} />;
    }
    if (error) {
        return <Text style={{ color: 'red', margin: 30, textAlign: 'center' }}>{error}</Text>;
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>🧠 Évaluation mentale</Text>
            {role !== 'coach' && <Text style={styles.readonly}>Lecture seule</Text>}

            {criteres.map(({ key, label, color }) => (
                <View key={key} style={styles.block}>
                    <Text style={[styles.label, { color }]}>{label.toUpperCase()}</Text>
                    <View style={styles.progressBarBackground}>
                        <View
                            style={[
                                styles.progressBarFill,
                                {
                                    width: `${evalData?.[key] || 0}%`,
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
                    🟢 Note globale : {evalData?.note_globale ?? computeNoteGlobale()} / 100
                </Text>
            </View>

            {/* Si tu stockes coach et date :
      <Text style={styles.small}>
        Évalué par {evalData?.coach_nom ?? '...'} le {evalData?.updated_at ? new Date(evalData.updated_at).toLocaleDateString('fr-FR') : '-'}
      </Text>
      */}
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
