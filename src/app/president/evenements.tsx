import { useCallback, useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    TextInput,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useSession } from '@/hooks/useSession';
import {
    COLOR_BLACK_900,
    COLOR_BLACK_LIGHT_900,
    COLOR_GREEN_300,
} from '@/utils/styleContants.utils';
import {
    createEvenement,
    GetEvenementsByClubId,
    getEvenementsByClubId,
} from '@/helpers/evenements.helpers';
import { sendNotificationToClubUsers } from '@/lib/supabase';

export default function Evenements() {
    const [events, setEvents] = useState<GetEvenementsByClubId | undefined>(undefined);
    const [loading, setLoading] = useState(false);
    const [titre, setTitre] = useState('');
    const [categorie, setCategorie] = useState('repas');
    const [lieu, setLieu] = useState('');
    const [description, setDescription] = useState('');
    const [dateStr, setDateStr] = useState('');
    const [heureStr, setHeureStr] = useState('');

    const { utilisateur } = useSession();

    const fetchEvents = async (clubId: string) => {
        setLoading(true);

        const fetchedEvenements = await getEvenementsByClubId({ clubId });
        setEvents(fetchedEvenements);

        setLoading(false);
    };

    useEffect(() => {
        if (!utilisateur?.club_id || loading || events) {
            return;
        }

        fetchEvents(utilisateur.club_id);
    }, [events, loading, utilisateur?.club_id]);

    const handleSubmit = useCallback(async () => {
        if (!titre || !lieu || !description || !dateStr || !heureStr) {
            return Alert.alert('Erreur', 'Tous les champs sont requis.');
        }

        // Securité : clubId
        if (!utilisateur?.club_id) {
            return Alert.alert('Erreur', "Impossible de créer l'événement : club introuvable.");
        }

        // Correction date/heure
        const [jour, mois, annee] = dateStr.split('/');
        const date = `${annee}-${mois}-${jour}`;
        const heure = heureStr;

        await createEvenement({
            dataToInsert: {
                titre,
                type: categorie,
                date,
                heure,
                lieu,
                description,
                club_id: utilisateur.club_id,
                created_by: utilisateur.id,
            },
        });

        await sendNotificationToClubUsers({
            message: `${titre} prévu le ${dateStr} à ${heureStr}`,
            clubId: utilisateur.club_id,
        });
        Alert.alert('✅ Créé', 'Événement ajouté avec succès !');
        setTitre('');
        setCategorie('repas');
        setLieu('');
        setDescription('');
        setDateStr('');
        setHeureStr('');
        fetchEvents(utilisateur.club_id);
    }, [
        categorie,
        dateStr,
        description,
        heureStr,
        lieu,
        titre,
        utilisateur?.club_id,
        utilisateur?.id,
    ]);

    const getEmoji = (type: string) => {
        switch (type) {
            case 'repas':
                return '🍽️';
            case 'tournoi':
                return '🏆';
            case 'loisir':
                return '🎉';
            case 'reunion':
                return '📣';
            case 'autre':
                return '📌';
            default:
                return '📅';
        }
    };

    return (
        <ScrollView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scroll}>
                <Text style={styles.title}>📆 Organisation Club</Text>

                <View style={styles.form}>
                    <TextInput
                        placeholder="Nom de l'événement"
                        placeholderTextColor="#888"
                        style={styles.input}
                        value={titre}
                        onChangeText={setTitre}
                    />

                    <Picker
                        selectedValue={categorie}
                        onValueChange={(itemValue) => setCategorie(itemValue)}
                        style={styles.picker}
                        dropdownIconColor="#00ff88"
                    >
                        <Picker.Item label="Repas" value="repas" />
                        <Picker.Item label="Tournoi" value="tournoi" />
                        <Picker.Item label="Loisir / fête" value="loisir" />
                        <Picker.Item label="Réunion" value="reunion" />
                        <Picker.Item label="Autre" value="autre" />
                    </Picker>

                    <TextInput
                        placeholder="Lieu"
                        placeholderTextColor="#888"
                        style={styles.input}
                        value={lieu}
                        onChangeText={setLieu}
                    />

                    <TextInput
                        placeholder="Date (JJ/MM/AAAA)"
                        placeholderTextColor="#888"
                        style={styles.input}
                        value={dateStr}
                        onChangeText={setDateStr}
                        keyboardType="numeric"
                    />

                    <TextInput
                        placeholder="Heure (HH:MM)"
                        placeholderTextColor="#888"
                        style={styles.input}
                        value={heureStr}
                        onChangeText={setHeureStr}
                    />

                    <TextInput
                        placeholder="Détail de l'événement"
                        placeholderTextColor="#888"
                        style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                        value={description}
                        onChangeText={setDescription}
                        multiline
                    />

                    <TouchableOpacity style={styles.createButton} onPress={handleSubmit}>
                        <Ionicons name="add-circle" size={20} color="#000" />
                        <Text style={styles.buttonText}>Créer l&apos;événement</Text>
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <ActivityIndicator color="#00ff88" style={{ marginTop: 40 }} />
                ) : (
                    events?.map((event) => (
                        <View key={event.id} style={styles.card}>
                            <Text style={styles.cardTitle}>
                                {event.type && getEmoji(event.type)} {event.titre}
                            </Text>
                            <Text style={styles.detailText}>📍 {event.lieu}</Text>
                            <Text style={styles.detailText}>
                                🕒 {event.date} à {event.heure}
                            </Text>
                            <Text style={styles.detailText}>📝 {event.description}</Text>
                        </View>
                    ))
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
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLOR_GREEN_300,
        marginBottom: 20,
        textAlign: 'center',
    },
    form: {
        backgroundColor: COLOR_BLACK_900,
        padding: 16,
        borderRadius: 12,
        marginBottom: 30,
        borderLeftWidth: 4,
        borderLeftColor: COLOR_GREEN_300,
    },
    input: {
        backgroundColor: COLOR_BLACK_LIGHT_900,
        color: '#fff',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
    },
    picker: {
        backgroundColor: COLOR_BLACK_LIGHT_900,
        color: '#fff',
        marginBottom: 12,
        paddingVertical: 15,
        paddingLeft: 10,
        borderRadius: 8,
    },
    createButton: {
        backgroundColor: COLOR_GREEN_300,
        paddingVertical: 12,
        borderRadius: 10,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    card: {
        backgroundColor: '#1e1e1e',
        padding: 18,
        borderRadius: 12,
        marginBottom: 20,
        borderLeftWidth: 4,
        borderLeftColor: COLOR_GREEN_300,
    },
    cardTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 8,
    },
    detailText: {
        color: '#ccc',
        fontSize: 14,
        marginBottom: 4,
    },
    buttonText: {
        color: '#000',
        fontWeight: '700',
        fontSize: 14,
    },
});
