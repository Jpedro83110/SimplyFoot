import { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    Platform,
    ScrollView,
    KeyboardAvoidingView,
    Keyboard,
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import InputDate from '@/components/molecules/InputDate';
import { formatDateToYYYYMMDD } from '@/utils/date.utils';
import { GetCoachEquipes, getCoachEquipes } from '@/helpers/equipes.helpers';
import { useSession } from '@/hooks/useSession';
import { LocationIQ } from '@/types/locationiq.types';
import { getJoueursByEquipeId, GetJoueursByEquipeId } from '@/helpers/joueurs.helpers';
import Button from '@/components/atoms/Button';
import { LOCATIONIQ_KEY, OPENWEATHER_KEY } from '@/utils/constants.utils';
import { createEvenement } from '@/helpers/evenements.helpers';
import { EvenementType } from '@/types/evenements.types';

const TYPE_LABELS: { label: string; value: EvenementType }[] = [
    { label: 'Match', value: 'match' },
    { label: 'Entraînement', value: 'entrainement' },
    { label: 'Tournoi', value: 'tournoi' },
    { label: 'Plateau', value: 'plateau' },
    { label: 'Autre', value: 'autre' },
];

export default function CreateEvent() {
    const [type, setType] = useState<EvenementType>('match');
    const [titre, setTitre] = useState('');
    const [date, setDate] = useState(new Date());
    const [heure, setHeure] = useState('');
    const [lieu, setLieu] = useState('');
    const [lieuxResultats, setLieuxResultats] = useState<LocationIQ[]>([]);
    const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
    const [complement, setComplement] = useState('');
    const [meteo, setMeteo] = useState('');
    const [equipe, setEquipe] = useState('');
    const [equipes, setEquipes] = useState<GetCoachEquipes | undefined>(undefined);
    const [adversaires, setAdversaires] = useState('');

    const [joueursEquipe, setJoueursEquipe] = useState<GetJoueursByEquipeId>([]);
    const [selectedJoueursIds, setSelectedJoueursIds] = useState<string[]>([]);
    const [loadingJoueurs, setLoadingJoueurs] = useState(false);

    const [fetchingLieu, setFetchingLieu] = useState(false);
    const { utilisateur } = useSession();

    const router = useRouter();

    const fetchEquipes = async (coachId: string, clubId: string) => {
        const fetchedEquipes = await getCoachEquipes({
            coachId,
            clubId,
        });

        setEquipes(fetchedEquipes);
    };

    useEffect(() => {
        if (!utilisateur?.id || !utilisateur.club_id || equipes) {
            return;
        }

        fetchEquipes(utilisateur.id, utilisateur.club_id);
    }, [utilisateur?.id, utilisateur?.club_id, equipes]);

    let timerLieu = useRef<NodeJS.Timeout | undefined>(undefined);
    const chercherLieu = (text: string) => {
        setLieu(text);
        setCoords(null);
        setMeteo('');
        setLieuxResultats([]);
        if (timerLieu.current) {
            clearTimeout(timerLieu.current);
        }
        if (text.length < 3) {
            return;
        }
        setFetchingLieu(true);
        timerLieu.current = setTimeout(async () => {
            try {
                const url = `https://api.locationiq.com/v1/autocomplete?key=${LOCATIONIQ_KEY}&q=${encodeURIComponent(text)}&limit=5&format=json`;
                const res = await fetch(url);
                const data: LocationIQ | LocationIQ[] = await res.json();
                setLieuxResultats(Array.isArray(data) ? data : [data]);
            } catch {
                setLieuxResultats([]);
            } finally {
                setFetchingLieu(false);
            }
        }, 500);
    };

    useEffect(() => {
        const fetchMeteo = async () => {
            if (!date || !coords?.lat || !coords?.lon) {
                setMeteo('');
                return;
            }
            try {
                const meteoUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lon}&units=metric&appid=${OPENWEATHER_KEY}&lang=fr`;
                const res = await fetch(meteoUrl);
                const data = await res.json();
                if (data && data.weather && data.main) {
                    setMeteo(`${data.weather[0].description}, ${data.main.temp}°C`);
                } else {
                    setMeteo('Indisponible');
                }
            } catch {
                setMeteo('Indisponible');
            }
        };
        fetchMeteo();
    }, [date, coords]);

    const choisirLieu = async (item: LocationIQ) => {
        setLieu(item.display_name);
        setCoords({ lat: Number(item.lat), lon: Number(item.lon) });
        setLieuxResultats([]);
        Keyboard.dismiss();
    };

    const fetchJoueursEquipe = async (equipeId: string) => {
        setSelectedJoueursIds([]);
        setJoueursEquipe([]);
        setLoadingJoueurs(true);

        try {
            const fetchedJoueursEquipe = await getJoueursByEquipeId({ equipeId });

            setJoueursEquipe(fetchedJoueursEquipe);
            setSelectedJoueursIds(fetchedJoueursEquipe.map((joueur) => joueur.utilisateurs[0].id));
        } catch (error) {
            console.error('Erreur générale fetchJoueursEquipe:', error);
            setJoueursEquipe([]);
        } finally {
            setLoadingJoueurs(false);
        }
    };

    const handleCreate = useCallback(async () => {
        if (!titre || !date || !heure || !lieu || !equipe) {
            Alert.alert('Erreur', 'Merci de remplir tous les champs.');
            return;
        }

        if (!coords?.lat || !coords?.lon) {
            Alert.alert(
                'Erreur',
                'Sélectionne le lieu dans la suggestion (pour la météo et GPS), puis ajoute le nom du stade dans "Complément".',
            );
            return;
        }

        if (!meteo || meteo === 'Indisponible') {
            Alert.alert(
                'Attention',
                'Météo non récupérée, tu peux continuer mais la météo ne sera pas affichée.',
            );
        }

        try {
            await createEvenement({
                dataToInsert: {
                    type,
                    titre,
                    date: formatDateToYYYYMMDD(date) ?? '',
                    heure,
                    lieu,
                    lieu_complement: complement,
                    equipe_id: equipe,
                    adversaires,
                    meteo,
                    latitude: coords.lat,
                    longitude: coords.lon,
                    created_by: utilisateur?.id ?? '',
                    club_id: utilisateur?.club_id ?? '',
                },
                joueursIds: selectedJoueursIds,
            });

            Alert.alert('✅ Évènement bien créé !');
            router.replace('/coach/dashboard');
        } catch (error) {
            Alert.alert(
                'Erreur',
                `Une erreur inattendue s'est produite: ${(error as Error).message}`,
            );
        }
    }, [
        adversaires,
        complement,
        coords?.lat,
        coords?.lon,
        date,
        equipe,
        heure,
        lieu,
        meteo,
        router,
        selectedJoueursIds,
        titre,
        type,
        utilisateur?.id,
        utilisateur?.club_id,
    ]);

    const toggleJoueur = (userId: string) => {
        setSelectedJoueursIds((prev) =>
            prev.includes(userId) ? prev.filter((uid) => uid !== userId) : [...prev, userId],
        );
    };

    const toggleAllJoueurs = () => {
        if (selectedJoueursIds.length === joueursEquipe.length) {
            setSelectedJoueursIds([]);
        } else {
            setSelectedJoueursIds(joueursEquipe.map((joueur) => joueur.utilisateurs[0].id));
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
            keyboardVerticalOffset={80}
        >
            <ScrollView
                style={{ flex: 1, backgroundColor: '#121212' }}
                contentContainerStyle={{ padding: 24, paddingBottom: 24 }}
                keyboardShouldPersistTaps="handled"
            >
                <Text style={styles.title}>🗓️ Créer un Événement</Text>

                {/* Type */}
                <Text style={styles.label}>Type</Text>
                <View style={styles.choicesContainer}>
                    {TYPE_LABELS.map((opt) => (
                        <TouchableOpacity
                            key={opt.value}
                            style={[
                                styles.choiceButton,
                                type === opt.value && styles.choiceSelected,
                            ]}
                            onPress={() => setType(opt.value)}
                        >
                            <Text
                                style={
                                    type === opt.value
                                        ? styles.choiceSelectedText
                                        : styles.choiceText
                                }
                            >
                                {opt.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Équipe */}
                <Text style={styles.label}>Équipe concernée</Text>
                <View style={styles.choicesContainer}>
                    {equipes?.map((eq) => (
                        <TouchableOpacity
                            key={eq.id}
                            style={[styles.choiceButton, equipe === eq.id && styles.choiceSelected]}
                            onPress={async () => {
                                setEquipe(eq.id);
                                if (!loadingJoueurs) {
                                    await fetchJoueursEquipe(eq.id);
                                }
                            }}
                        >
                            <Text
                                style={
                                    equipe === eq.id ? styles.choiceSelectedText : styles.choiceText
                                }
                            >
                                {eq.nom} <Text style={styles.categorie}>{eq.categorie}</Text>
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Lieu */}
                <Text style={styles.label}>Lieu (ville/quartier)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Commence à taper pour voir les suggestions"
                    placeholderTextColor="#aaa"
                    value={lieu}
                    onChangeText={chercherLieu}
                    autoCorrect={false}
                />
                {fetchingLieu && <Text style={styles.suggestion}>Recherche...</Text>}
                {lieuxResultats.length > 0 && (
                    <View style={styles.suggestionList}>
                        {lieuxResultats.map((item) => (
                            <TouchableOpacity
                                key={item.place_id}
                                onPress={() => choisirLieu(item)}
                                style={styles.suggestionItem}
                            >
                                <Text style={styles.suggestionText}>{item.display_name}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Complément */}
                <Text style={styles.label}>Complément (nom du stade, gymnase...)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ex : Stade Delaune"
                    placeholderTextColor="#aaa"
                    value={complement}
                    onChangeText={setComplement}
                />

                {/* Titre */}
                <Text style={styles.label}>Nom de l&apos;événement</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ex : 16e journée D2"
                    placeholderTextColor="#aaa"
                    value={titre}
                    onChangeText={setTitre}
                />

                {/* Date */}
                <Text style={styles.label}>Date</Text>
                <InputDate
                    value={date}
                    onChange={(selectedDate) => {
                        if (selectedDate) {
                            setDate(selectedDate);
                        }
                    }}
                    placeholder="Date de naissance"
                />

                {/* Heure */}
                <Text style={styles.label}>Heure</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Heure (ex: 15:00)"
                    placeholderTextColor="#aaa"
                    value={heure}
                    onChangeText={setHeure}
                />

                {/* Adversaires */}
                <Text style={styles.label}>Adversaires (séparés par virgule)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Adversaires"
                    placeholderTextColor="#aaa"
                    value={adversaires}
                    onChangeText={setAdversaires}
                />

                {/* Météo */}
                {meteo ? <Text style={styles.meteo}>🌦️ Météo prévue : {meteo}</Text> : null}

                {/* --- Sélection joueurs --- */}
                <Text style={styles.label}>Sélection des joueurs ({joueursEquipe.length})</Text>
                {loadingJoueurs ? (
                    <ActivityIndicator color="#00ff88" style={{ marginVertical: 8 }} />
                ) : (
                    <>
                        {joueursEquipe.length > 0 && (
                            <TouchableOpacity
                                style={styles.selectAllBtn}
                                onPress={toggleAllJoueurs}
                            >
                                <Text style={styles.selectAllText}>
                                    {selectedJoueursIds.length === joueursEquipe.length
                                        ? 'Tout désélectionner'
                                        : "Sélectionner toute l'équipe"}
                                </Text>
                            </TouchableOpacity>
                        )}
                        <View>
                            {joueursEquipe.map((joueur) => (
                                <TouchableOpacity
                                    key={joueur.utilisateurs[0].id}
                                    style={styles.joueurItem}
                                    onPress={() => toggleJoueur(joueur.utilisateurs[0].id)}
                                >
                                    <View
                                        style={[
                                            styles.checkbox,
                                            selectedJoueursIds.includes(
                                                joueur.utilisateurs[0].id,
                                            ) && styles.checkboxChecked,
                                        ]}
                                    />
                                    <Text style={styles.joueurText}>
                                        {joueur.utilisateurs[0].nom} {joueur.utilisateurs[0].prenom}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                            {joueursEquipe.length === 0 && (
                                <Text style={{ color: '#555', marginTop: 5, fontStyle: 'italic' }}>
                                    Aucun joueur trouvé pour cette équipe.
                                </Text>
                            )}
                        </View>
                    </>
                )}
            </ScrollView>
            <Button
                text="Créer"
                onPress={handleCreate}
                loading={loadingJoueurs}
                disabled={!titre || !date || !heure || !lieu || !equipe || loadingJoueurs}
                color="primary"
            />
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#00ff88',
        marginBottom: 30,
        textAlign: 'center',
    },
    label: { color: '#aaa', marginTop: 12, marginBottom: 4, fontSize: 16 },
    input: {
        backgroundColor: '#1e1e1e',
        color: '#fff',
        borderRadius: 10,
        paddingVertical: 14,
        paddingHorizontal: 18,
        fontSize: 16,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#333',
        width: '100%',
    },
    choicesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 10,
    },
    choiceButton: {
        backgroundColor: '#232323',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 16,
        marginRight: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#333',
    },
    choiceSelected: { backgroundColor: '#00ff88', borderColor: '#00ff88' },
    choiceText: { color: '#fff', fontWeight: '500', fontSize: 16 },
    choiceSelectedText: { color: '#232323', fontWeight: 'bold', fontSize: 16 },
    categorie: { color: '#00ff88', fontWeight: 'bold', fontSize: 14 },
    suggestionList: {
        backgroundColor: '#232323',
        borderRadius: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#00ff88',
        maxHeight: 200,
        overflow: 'hidden',
    },
    suggestionItem: {
        padding: 10,
        borderBottomColor: '#222',
        borderBottomWidth: 1,
    },
    suggestionText: { color: '#00ff88', fontSize: 15 },
    suggestion: { color: '#aaa', fontSize: 14, fontStyle: 'italic' },
    meteo: { color: '#00ff88', marginTop: 10, textAlign: 'center' },
    buttonSticky: {
        backgroundColor: '#00ff88',
        paddingVertical: 18,
        borderRadius: 10,
        alignItems: 'center',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        marginHorizontal: 0,
        marginBottom: 0,
    },
    buttonText: { color: '#000', fontSize: 17, fontWeight: '800', letterSpacing: 1 },
    joueurItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    joueurText: { color: '#fff', fontSize: 15, marginLeft: 10 },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 5,
        borderWidth: 2,
        borderColor: '#00ff88',
        backgroundColor: '#232323',
    },
    checkboxChecked: { backgroundColor: '#00ff88' },
    selectAllBtn: { alignSelf: 'flex-end', marginVertical: 6, marginRight: 5 },
    selectAllText: { color: '#00ff88', fontWeight: 'bold', fontSize: 14 },
});
