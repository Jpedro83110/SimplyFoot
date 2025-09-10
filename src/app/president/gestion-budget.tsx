import { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    Alert,
    ScrollView,
    Platform,
    Dimensions,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as ExpoSharing from 'expo-sharing';
import * as Print from 'expo-print';
import { PieChart } from 'react-native-chart-kit';
import { formatDateForDisplay } from '@/utils/date.utils';
import { COLOR_BLACK_900 } from '@/utils/styleContants.utils';
import {
    createBudget,
    deleteClubBudgets,
    getBudgetsByClubId,
    GetBudgetsByClubId,
} from '@/helpers/budgets.helpers';
import { useSession } from '@/hooks/useSession';

export default function GestionBudget() {
    const [filtreMois, setFiltreMois] = useState('');
    const [budgets, setBudgets] = useState<GetBudgetsByClubId | undefined>(undefined);
    const [loading, setLoading] = useState(false);
    const [nouvelleLigne, setNouvelleLigne] = useState({
        date: '',
        type: 'Recette',
        intitule: '',
        montant: '',
        categorie: '',
        commentaire: '',
    });

    const { utilisateur } = useSession();

    const fetchBudgets = async (clubId: string) => {
        setLoading(true);

        const budgets = await getBudgetsByClubId({ clubId });
        setBudgets(budgets);

        setLoading(false);
    };

    useEffect(() => {
        if (!utilisateur?.club_id || loading || budgets) {
            return;
        }

        fetchBudgets(utilisateur.club_id);
    }, [budgets, loading, utilisateur?.club_id]);

    // --- AJOUT / SUPPRIME / ARCHIVE = On refresh le cache
    const ajouterLigne = useCallback(async () => {
        let { date, type, intitule, montant, categorie, commentaire } = nouvelleLigne;

        if (!utilisateur?.club_id) {
            Alert.alert('Erreur', "Le club n'a pas encore été chargé.");
            return;
        }

        if (!intitule || !montant || isNaN(parseFloat(montant))) {
            Alert.alert(
                'Erreur',
                'Tous les champs obligatoires doivent être remplis correctement.',
            );
            return;
        }

        if (!date) {
            date = new Date().toISOString();
        }

        await createBudget({
            budget: {
                date,
                type,
                intitule,
                montant: parseFloat(montant),
                categorie,
                commentaire,
                club_id: utilisateur.club_id,
            },
        });

        setNouvelleLigne({
            date: '',
            type: 'Recette',
            intitule: '',
            montant: '',
            categorie: '',
            commentaire: '',
        });

        await fetchBudgets(utilisateur.club_id);
    }, [nouvelleLigne, utilisateur?.club_id]);

    const exporterCSV = useCallback(async () => {
        const header = 'Date,Type,Intitulé,Montant,Catégorie,Commentaire\n';
        const rows = (budgets || [])
            .map(
                (budget) =>
                    `${formatDateForDisplay({ date: budget.date })},${budget.type},${budget.intitule},${budget.montant} € ,${budget.categorie},${budget.commentaire}`,
            )
            .join('\n');
        const csv = header + rows;

        if (Platform.OS === 'web') {
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'budget.csv');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            const path = FileSystem.documentDirectory + 'budget.csv';
            await FileSystem.writeAsStringAsync(path, csv, {
                encoding: FileSystem.EncodingType.UTF8,
            });
            await ExpoSharing.shareAsync(path);
        }
    }, [budgets]);

    const exporterPDF = useCallback(async () => {
        const html = `
      <html><body><h1>Budget Club</h1><table border='1' style='width:100%; border-collapse:collapse;'>
      <tr><th>Date</th><th>Type</th><th>Intitulé</th><th>Montant</th><th>Catégorie</th><th>Commentaire</th></tr>
      ${(budgets || [])
          .map(
              (budget) =>
                  `<tr>
          <td>${formatDateForDisplay({ date: budget.date })}</td>
          <td>${budget.type}</td>
          <td>${budget.intitule}</td>
          <td style="color:${budget.type === 'Recette' ? '#00b85b' : '#e30000'}; font-weight:bold">${budget.montant} €</td>
          <td>${budget.categorie}</td>
          <td>${budget.commentaire}</td>
        </tr>`,
          )
          .join('')}
      </table></body></html>`;
        const { uri } = await Print.printToFileAsync({ html });
        await ExpoSharing.shareAsync(uri);
    }, [budgets]);

    const archiverEtVider = useCallback(async () => {
        if (!utilisateur?.club_id) {
            Alert.alert('Erreur', "Le club n'a pas encore été chargé.");
            return;
        }

        await exporterCSV();
        await deleteClubBudgets({ clubId: utilisateur.club_id });

        Alert.alert('Archivé', 'Les données ont été exportées et supprimées.');
        await fetchBudgets(utilisateur.club_id);
    }, [exporterCSV, utilisateur?.club_id]);

    const totalRecettes = (budgets || [])
        .filter((budget) => budget.type === 'Recette')
        .reduce((sum, budget) => sum + (budget.montant || 0), 0);
    const totalDepenses = (budgets || [])
        .filter((budget) => budget.type === 'Dépense')
        .reduce((sum, budget) => sum + (budget.montant || 0), 0);

    const pieData = [
        totalRecettes > 0 && {
            name: 'Recettes 💶',
            population: totalRecettes,
            color: '#00ff88',
            legendFontColor: '#fff',
            legendFontSize: 15,
        },
        totalDepenses > 0 && {
            name: 'Dépenses 💶',
            population: totalDepenses,
            color: '#ff4444',
            legendFontColor: '#fff',
            legendFontSize: 15,
        },
    ].filter(Boolean);

    const renderItem = ({ item }: { item: GetBudgetsByClubId[number] }) => (
        <View style={styles.ligne}>
            <Text style={styles.texteDate}>{formatDateForDisplay({ date: item.date })}</Text>
            <Text style={styles.texte}>
                <Text
                    style={{
                        color: item.type === 'Recette' ? '#00ff88' : '#ff4444',
                        fontWeight: 'bold',
                    }}
                >
                    {item.type} •
                </Text>{' '}
                <Text style={{ color: '#fff' }}>{item.intitule}</Text>
                {'  '}
                <Text
                    style={{
                        color: item.type === 'Recette' ? '#00ff88' : '#ff4444',
                        fontWeight: 'bold',
                    }}
                >
                    {item.type === 'Recette' ? '+' : '-'}
                    {item.montant ? item.montant.toFixed(2) : '0.00'} €
                </Text>
            </Text>
            {item.categorie ? <Text style={styles.categorie}>{item.categorie}</Text> : null}
            {item.commentaire ? <Text style={styles.commentaire}>{item.commentaire}</Text> : null}
        </View>
    );

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <ScrollView contentContainerStyle={styles.scroll}>
                <Text style={styles.titre}>💰 Gestion du budget</Text>

                <View style={styles.graphiqueContainer}>
                    {pieData.length > 0 && (
                        <PieChart
                            data={pieData}
                            width={Dimensions.get('window').width - 40}
                            height={210}
                            chartConfig={{
                                backgroundColor: '#121212',
                                backgroundGradientFrom: '#121212',
                                backgroundGradientTo: '#121212',
                                color: (opacity = 1) => `rgba(0,255,136,${opacity})`,
                                labelColor: (opacity = 1) => `rgba(255,255,255,${opacity})`,
                                strokeWidth: 2,
                            }}
                            accessor="population"
                            backgroundColor="transparent"
                            paddingLeft="12"
                            absolute
                            hasLegend={true}
                            avoidFalseZero
                        />
                    )}

                    <Text style={{ color: '#fff', fontWeight: 'bold', marginTop: 8 }}>
                        💶 Solde actuel :{' '}
                        <Text
                            style={{
                                color: totalRecettes - totalDepenses >= 0 ? '#00ff88' : '#ff4444',
                            }}
                        >
                            {(totalRecettes - totalDepenses).toLocaleString('fr-FR', {
                                minimumFractionDigits: 2,
                            })}{' '}
                            €
                        </Text>
                    </Text>
                </View>

                <TextInput
                    style={styles.input}
                    placeholder="Filtrer par mois (ex: 2025-05)"
                    placeholderTextColor="#bbb"
                    value={filtreMois}
                    onChangeText={setFiltreMois}
                />

                <View style={styles.formulaire}>
                    <View
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            marginBottom: 10,
                        }}
                    >
                        <TouchableOpacity
                            style={[
                                styles.bouton,
                                {
                                    backgroundColor:
                                        nouvelleLigne.type === 'Recette' ? '#00ff88' : '#333',
                                    flex: 1,
                                    marginRight: 5,
                                },
                            ]}
                            onPress={() => setNouvelleLigne({ ...nouvelleLigne, type: 'Recette' })}
                        >
                            <Text style={styles.boutonTexte}>Recette</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.bouton,
                                {
                                    backgroundColor:
                                        nouvelleLigne.type === 'Dépense' ? '#ff4444' : '#333',
                                    flex: 1,
                                    marginLeft: 5,
                                },
                            ]}
                            onPress={() => setNouvelleLigne({ ...nouvelleLigne, type: 'Dépense' })}
                        >
                            <Text style={styles.boutonTexte}>Dépense</Text>
                        </TouchableOpacity>
                    </View>

                    <TextInput
                        style={styles.input}
                        placeholder="Date (optionnel, sinon automatique)"
                        placeholderTextColor="#888"
                        value={nouvelleLigne.date}
                        onChangeText={(text) => setNouvelleLigne({ ...nouvelleLigne, date: text })}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Intitulé"
                        placeholderTextColor="#888"
                        value={nouvelleLigne.intitule}
                        onChangeText={(text) =>
                            setNouvelleLigne({ ...nouvelleLigne, intitule: text })
                        }
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Montant"
                        placeholderTextColor="#888"
                        keyboardType="numeric"
                        value={nouvelleLigne.montant}
                        onChangeText={(text) =>
                            setNouvelleLigne({ ...nouvelleLigne, montant: text })
                        }
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Catégorie"
                        placeholderTextColor="#888"
                        value={nouvelleLigne.categorie}
                        onChangeText={(text) =>
                            setNouvelleLigne({ ...nouvelleLigne, categorie: text })
                        }
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Commentaire"
                        placeholderTextColor="#888"
                        value={nouvelleLigne.commentaire}
                        onChangeText={(text) =>
                            setNouvelleLigne({ ...nouvelleLigne, commentaire: text })
                        }
                    />

                    <TouchableOpacity
                        style={[
                            styles.bouton,
                            {
                                backgroundColor:
                                    nouvelleLigne.type === 'Recette' ? '#00ff88' : '#ff4444',
                            },
                        ]}
                        onPress={ajouterLigne}
                    >
                        <Text style={[styles.boutonTexte, { color: '#111' }]}>Ajouter</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.export} onPress={exporterCSV}>
                        <Text style={styles.boutonTexte}>📤 Exporter CSV</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.export} onPress={exporterPDF}>
                        <Text style={styles.boutonTexte}>🧾 Exporter PDF</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.danger} onPress={archiverEtVider}>
                        <Text style={styles.boutonTexte}>🗑️ Archiver et Vider</Text>
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <Text style={{ color: '#bbb', textAlign: 'center', marginTop: 12 }}>
                        Chargement…
                    </Text>
                ) : budgets?.length === 0 ? (
                    <Text style={{ color: '#bbb', textAlign: 'center', marginTop: 12 }}>
                        Aucune ligne de budget trouvée.
                    </Text>
                ) : (
                    <FlatList
                        data={budgets}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.id.toString()}
                        style={{ marginBottom: 40 }}
                    />
                )}
            </ScrollView>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLOR_BLACK_900,
    },
    scroll: { padding: 20, alignSelf: 'center', maxWidth: 790, width: '92%' },
    titre: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#00ff88',
        marginBottom: 20,
        textAlign: 'center',
    },
    formulaire: { marginBottom: 20 },
    input: {
        backgroundColor: '#1e1e1e',
        color: '#fff',
        padding: 10,
        borderRadius: 8,
        marginBottom: 10,
        fontSize: 15,
    },
    bouton: { padding: 14, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
    export: {
        backgroundColor: '#448aff',
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 10,
    },
    danger: {
        backgroundColor: '#ff4444',
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 10,
    },
    boutonTexte: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    ligne: { padding: 10, borderBottomColor: '#444', borderBottomWidth: 1, marginBottom: 2 },
    texte: { color: '#fff', fontSize: 15 },
    texteDate: { color: '#aaa', fontSize: 13, marginBottom: 2 },
    categorie: { color: '#facc15', fontSize: 13 },
    commentaire: { color: '#bbb', fontSize: 13, fontStyle: 'italic' },
    graphiqueContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        backgroundColor: '#1e1e1e',
        borderRadius: 12,
        marginBottom: 16,
        minHeight: 250,
    },
});
