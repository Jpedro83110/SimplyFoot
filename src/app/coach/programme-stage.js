import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    useWindowDimensions,
    Platform,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import { supabase } from '../../lib/supabase';
import { formatDateForDisplay, normalizeHour } from '@/utils/date.utils';

const GREEN = '#00ff88';
const DARK = '#101415';
const DARK_LIGHT = '#161b20';

function downloadCSVWeb(filename, csv) {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

const jours = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'];

export default function ProgrammeStage() {
    const { width } = useWindowDimensions();
    const [stages, setStages] = useState([]);
    const [openedStageId, setOpenedStageId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [confirmation, setConfirmation] = useState('');

    useEffect(() => {
        const fetchStages = async () => {
            const { data: session } = await supabase.auth.getSession();
            const userId = session?.session?.user?.id;
            if (!userId) {
                return;
            }

            const { data: user } = await supabase
                .from('utilisateurs')
                .select('club_id')
                .eq('id', userId)
                .single();

            if (!user) {
                return;
            }

            const { data: stagesList } = await supabase
                .from('stages')
                .select('*')
                .eq('club_id', user.club_id)
                .order('date_debut', { ascending: false });

            setStages(stagesList || []);
            setLoading(false);
        };
        fetchStages();
    }, []);

    const imprimerStage = async (stage) => {
        try {
            const programme = {};
            jours.forEach((jour) => {
                programme[jour] = stage[`programme_${jour}`]
                    ? JSON.parse(stage[`programme_${jour}`])
                    : { lieu: '', matin: '', apresMidi: '', heureDebut: '', heureFin: '' };
            });
            const html = `
        <html><head>
        <style>
          body { font-family: Arial; padding: 20px; }
          h2 { color: #00ff88; }
          table { border-collapse: collapse; width: 100%; margin-top: 12px;}
          th, td { border: 1px solid #222; padding: 10px; text-align: center; }
          th { background: #e0ffe8; }
        </style>
        </head><body>
        <h2>${stage.titre}</h2>
        <p><strong>Dates :</strong> du ${formatDateForDisplay({ date: stage.date_debut })} au ${formatDateForDisplay({ date: stage.date_fin })}</p>
        ${stage.age_min && stage.age_max ? `<p><strong>Âge :</strong> ${stage.age_min} à ${stage.age_max} ans</p>` : ''}
        <table>
          <thead><tr><th>Jour</th><th>Lieu</th><th>Horaires</th><th>Matin</th><th>Après-midi</th></tr></thead>
          <tbody>
            ${jours
                .map((jour) => {
                    const prog = programme[jour];
                    let heureDebut = prog.heureDebut || stage.heure_debut || '09:00';
                    let heureFin = prog.heureFin || stage.heure_fin || '17:00';
                    return `<tr>
                <td>${jour.charAt(0).toUpperCase() + jour.slice(1)}</td>
                <td>${prog?.lieu || ''}</td>
                <td>${normalizeHour(heureDebut)} - ${normalizeHour(heureFin)}</td>
                <td>${prog?.matin || ''}</td>
                <td>${prog?.apresMidi || ''}</td>
              </tr>`;
                })
                .join('')}
          </tbody>
        </table>
        </body></html>
      `;
            const { uri } = await Print.printToFileAsync({ html });
            await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
            setConfirmation('📄 PDF généré');
        } catch (error) {
            console.error("Erreur lors de l'impression du PDF:", error);
            setConfirmation('❌ Erreur impression PDF');
        }
    };

    const exporterStageCSV = async (stage) => {
        try {
            let csv = `Titre;Date début;Date fin;Âge min;Âge max;Jour;Lieu;Horaires;Matin;Après-midi\n`;
            jours.forEach((jour) => {
                const prog = stage[`programme_${jour}`]
                    ? JSON.parse(stage[`programme_${jour}`])
                    : {};
                let heureDebut = prog.heureDebut || stage.heure_debut || '09:00';
                let heureFin = prog.heureFin || stage.heure_fin || '17:00';
                csv += `${stage.titre};${stage.date_debut};${stage.date_fin};${stage.age_min || ''};${stage.age_max || ''};${jour};${prog.lieu || ''};${normalizeHour(heureDebut)} - ${normalizeHour(heureFin)};${prog.matin || ''};${prog.apresMidi || ''}\n`;
            });
            if (Platform.OS === 'web') {
                downloadCSVWeb(`stage-${stage.titre}.csv`, csv);
                setConfirmation('📤 Export web OK');
            } else {
                const fileUri = FileSystem.documentDirectory + `stage-${stage.titre}.csv`;
                await FileSystem.writeAsStringAsync(fileUri, csv, {
                    encoding: FileSystem.EncodingType.UTF8,
                });
                await shareAsync(fileUri, { mimeType: 'text/csv' });
                setConfirmation('📤 Export CSV mobile OK');
            }
        } catch (error) {
            console.error("Erreur lors de l'export CSV:", error);
            setConfirmation('❌ Erreur export');
        }
    };

    if (loading) {
        return <ActivityIndicator color="#00ff88" style={{ marginTop: 40 }} />;
    }

    if (!stages.length) {
        return (
            <Text style={{ color: '#ccc', textAlign: 'center', marginTop: 40 }}>
                Aucun stage trouvé.
            </Text>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scroll}>
                <Text style={styles.title}>📘 Programmes des Stages</Text>

                {stages.map((stage) => (
                    <View
                        key={stage.id}
                        style={{ width: '100%', maxWidth: 600, alignSelf: 'center' }}
                    >
                        <TouchableOpacity
                            style={[
                                styles.stageCard,
                                openedStageId === stage.id && {
                                    borderColor: '#00ff88',
                                    borderWidth: 2,
                                },
                            ]}
                            onPress={() =>
                                setOpenedStageId(openedStageId === stage.id ? null : stage.id)
                            }
                        >
                            <Text style={styles.stageTitle}>{stage.titre}</Text>
                            <Text style={styles.stageDate}>
                                🗓️ Du {formatDateForDisplay({ date: stage.date_debut })} au{' '}
                                {formatDateForDisplay({ date: stage.date_fin })}
                            </Text>
                            {stage.age_min && stage.age_max && (
                                <Text style={styles.stageAge}>
                                    Âge : De {stage.age_min} à {stage.age_max} ans
                                </Text>
                            )}
                            <Text style={styles.openCloseBtn}>
                                {openedStageId === stage.id ? '▲' : '▼'}
                            </Text>
                        </TouchableOpacity>

                        {openedStageId === stage.id && (
                            <View
                                style={[
                                    styles.formBlock,
                                    { width: '100%', maxWidth: 600, alignSelf: 'center' },
                                ]}
                            >
                                {jours.map((day) => {
                                    const prog = stage[`programme_${day}`]
                                        ? JSON.parse(stage[`programme_${day}`])
                                        : {
                                              lieu: '',
                                              matin: '',
                                              apresMidi: '',
                                              heureDebut: '',
                                              heureFin: '',
                                          };
                                    let heureDebut =
                                        prog.heureDebut || stage.heure_debut || '09:00';
                                    let heureFin = prog.heureFin || stage.heure_fin || '17:00';
                                    return (
                                        <View key={day} style={styles.dayBlock}>
                                            <Text style={styles.dayTitle}>
                                                {day.charAt(0).toUpperCase() + day.slice(1)}
                                            </Text>

                                            <View style={styles.fieldRow}>
                                                <Text style={styles.labelField}>📍 Lieu :</Text>
                                                <Text style={styles.fieldValue}>
                                                    {prog.lieu || '—'}
                                                </Text>
                                            </View>

                                            <View style={styles.fieldRow}>
                                                <Text style={styles.labelField}>⌚ Horaires :</Text>
                                                <Text style={styles.fieldValue}>
                                                    {normalizeHour(heureDebut)} -{' '}
                                                    {normalizeHour(heureFin)}
                                                </Text>
                                            </View>

                                            <View style={styles.fieldRow}>
                                                <Text style={styles.labelField}>🌅 Matin :</Text>
                                                <Text style={styles.fieldValue}>
                                                    {prog.matin || '—'}
                                                </Text>
                                            </View>

                                            <View style={styles.fieldRow}>
                                                <Text style={styles.labelField}>
                                                    🌇 Après-midi :
                                                </Text>
                                                <Text
                                                    style={[styles.fieldValue, { marginLeft: -10 }]}
                                                >
                                                    {prog.apresMidi || '—'}
                                                </Text>
                                            </View>
                                        </View>
                                    );
                                })}

                                <View
                                    style={[
                                        styles.rowActions,
                                        width < 700
                                            ? { flexDirection: 'column', gap: 10 }
                                            : {
                                                  flexDirection: 'row',
                                                  gap: 20,
                                                  justifyContent: 'space-between',
                                              },
                                    ]}
                                >
                                    <TouchableOpacity
                                        style={[
                                            styles.actionBtn,
                                            { backgroundColor: '#0080ff', flex: 1 },
                                        ]}
                                        onPress={() => imprimerStage(stage)}
                                    >
                                        <Text style={[styles.buttonText, { color: '#fff' }]}>
                                            📄 Imprimer
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.actionBtn,
                                            { backgroundColor: '#facc15', flex: 1 },
                                        ]}
                                        onPress={() => exporterStageCSV(stage)}
                                    >
                                        <Text style={[styles.buttonText, { color: '#222' }]}>
                                            📤 Export
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>
                ))}

                {confirmation !== '' && (
                    <TouchableOpacity onPress={() => setConfirmation('')}>
                        <Text style={styles.confirmationMsg}>
                            {confirmation} (cliquer pour fermer)
                        </Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: DARK,
        flex: 1,
    },
    scroll: { padding: 20, alignSelf: 'center', maxWidth: 790, width: '92%' },
    title: {
        fontSize: 22,
        color: GREEN,
        fontWeight: 'bold',
        marginBottom: 18,
        alignSelf: 'center',
        marginTop: 6,
    },
    stageCard: {
        backgroundColor: '#222',
        borderRadius: 12,
        padding: 14,
        marginBottom: 8,
        borderColor: 'transparent',
        minWidth: 180,
        width: '100%',
        maxWidth: 600,
        alignSelf: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    stageTitle: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
    stageDate: { color: '#00ff88', fontSize: 14, marginTop: 6 },
    stageAge: { color: '#facc15', fontSize: 14, marginTop: 4 },
    openCloseBtn: {
        color: GREEN,
        fontWeight: 'bold',
        fontSize: 20,
        textAlign: 'center',
        marginTop: 2,
    },

    formBlock: {
        backgroundColor: DARK_LIGHT,
        borderRadius: 14,
        padding: 14,
        marginBottom: 20,
        marginTop: 12,
    },

    dayBlock: {
        borderBottomWidth: 1,
        borderBottomColor: '#444',
        paddingVertical: 8,
        marginBottom: 6,
    },

    dayTitle: {
        fontWeight: '600',
        fontSize: 16,
        color: GREEN,
        marginBottom: 10,
    },

    fieldRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    labelField: {
        fontWeight: '600',
        color: '#aaa',
        minWidth: 90,
        marginRight: 28,
    },
    fieldValue: {
        flex: 1,
        color: '#eee',
    },

    rowActions: {
        marginTop: 14,
    },

    actionBtn: {
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: 'center',
    },

    buttonText: {
        fontWeight: '600',
    },

    confirmationMsg: {
        textAlign: 'center',
        color: '#00ff88',
        marginTop: 12,
        marginBottom: 20,
    },
});
