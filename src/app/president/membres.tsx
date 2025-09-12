import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Image,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import {
    COLOR_BLACK_900,
    COLOR_BLACK_LIGHT_900,
    COLOR_GREEN_300,
} from '@/utils/styleContants.utils';
import { useSession } from '@/hooks/useSession';
import { getClubEquipesWithJoueurs, GetClubEquipesWithJoueurs } from '@/helpers/equipes.helpers';

export default function Membres() {
    const [equipes, setEquipes] = useState<GetClubEquipesWithJoueurs | undefined>(undefined);
    const [loading, setLoading] = useState(false);
    const [selectedEquipe, setSelectedEquipe] = useState<
        GetClubEquipesWithJoueurs[number] | undefined
    >(undefined);

    const { utilisateur } = useSession();

    const router = useRouter();

    async function fetchData(clubId: string) {
        setLoading(true);

        try {
            const fetchClubEquipes = await getClubEquipesWithJoueurs({ clubId });
            setEquipes(fetchClubEquipes);
        } catch (error) {
            Alert.alert('Erreur', 'Impossible de charger les joueurs.');
            console.error('Erreur chargement joueurs:', error);
        }

        setLoading(false);
    }

    useEffect(() => {
        if (!utilisateur?.club_id || loading || equipes) {
            return;
        }

        fetchData(utilisateur.club_id);
    }, [equipes, loading, utilisateur?.club_id]);

    return (
        <ScrollView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scroll}>
                <Text style={styles.title}>👥 Joueurs du club</Text>

                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={selectedEquipe?.id}
                        onValueChange={(equipeId) =>
                            setSelectedEquipe(equipes?.find((equipe) => equipe.id === equipeId))
                        }
                        style={styles.picker}
                    >
                        <Picker.Item
                            label={`Toutes les équipes (${equipes?.length ?? 0})`}
                            value=""
                        />
                        {equipes?.map((equipe) => (
                            <Picker.Item
                                key={equipe.id}
                                label={`${equipe.nom}${equipe.categorie ? ` (${equipe.categorie})` : ''}`}
                                value={equipe.id.toString()}
                            />
                        ))}
                    </Picker>
                </View>

                {selectedEquipe && (
                    <Text style={styles.nbLicencieText}>
                        {selectedEquipe.joueurs.length ?? 0} licencié
                        {selectedEquipe.joueurs.length !== 1 ? 's' : ''}
                    </Text>
                )}

                {loading ? (
                    <ActivityIndicator color="#00ff88" size="large" style={{ marginTop: 40 }} />
                ) : selectedEquipe && selectedEquipe.joueurs.length === 0 ? (
                    <Text style={{ color: '#888', marginTop: 20, textAlign: 'center' }}>
                        Aucun joueur trouvé.
                    </Text>
                ) : (
                    selectedEquipe?.joueurs?.map((joueur) => {
                        let photo =
                            joueur.photo_profil_url && joueur.photo_profil_url.trim() !== ''
                                ? joueur.photo_profil_url
                                : null;

                        if (!photo) {
                            // fallback initiales
                            let nom =
                                (joueur.utilisateurs[0].prenom || '') +
                                ' ' +
                                (joueur.utilisateurs[0].nom || '');
                            if (nom.trim() === '') {
                                nom = 'FC';
                            } // fallback total
                            photo =
                                'https://ui-avatars.com/api/?name=' +
                                encodeURIComponent(nom.trim()) +
                                '&background=232b28&color=fff&rounded=true';
                        }
                        return (
                            <View key={joueur.id} style={styles.card}>
                                <View style={styles.row}>
                                    <Image source={{ uri: photo }} style={styles.avatar} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.name}>
                                            {joueur.utilisateurs[0].prenom}{' '}
                                            {joueur.utilisateurs[0].nom}
                                        </Text>
                                        <Text style={styles.role}>
                                            {selectedEquipe.nom}
                                            {selectedEquipe.categorie ? (
                                                <Text
                                                    style={{ color: '#00ffcc', fontWeight: '600' }}
                                                >
                                                    {' '}
                                                    ({selectedEquipe.categorie})
                                                </Text>
                                            ) : null}
                                        </Text>
                                        <Text style={styles.detail}>
                                            🎫 Licence : {joueur.numero_licence || '—'}
                                        </Text>
                                        <Text style={styles.detail}>
                                            🩺 Visite médicale :{' '}
                                            {joueur.visite_medicale_valide ? '✅ OK' : '❌'}
                                        </Text>
                                        <Text style={styles.detail}>
                                            🎒 Équipement : {joueur.equipement ? '✅ Fourni' : '❌'}
                                        </Text>
                                        <View style={styles.buttonRow}>
                                            <TouchableOpacity
                                                style={styles.smallButton}
                                                onPress={() =>
                                                    router.push(
                                                        `/joueur/eval-mentale?user=${joueur.id}`,
                                                    )
                                                }
                                            >
                                                <Text style={styles.smallButtonText}>
                                                    🧠 Mentale
                                                </Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={styles.smallButton}
                                                onPress={() =>
                                                    router.push(
                                                        `/joueur/eval-technique?user=${joueur.id}`,
                                                    )
                                                }
                                            >
                                                <Text style={styles.smallButtonText}>
                                                    ⚽ Technique
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        );
                    })
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
    pickerContainer: {
        borderWidth: 1,
        borderColor: COLOR_GREEN_300,
        borderRadius: 8,
        marginBottom: 12,
        overflow: 'hidden',
    },
    picker: {
        height: 50,
        color: '#bbb',
        backgroundColor: COLOR_BLACK_LIGHT_900,
        paddingHorizontal: 15,
    },
    nbLicencieText: {
        textAlign: 'center',
        color: '#00ffcc',
        fontWeight: 'bold',
        marginBottom: 9,
        fontSize: 15,
    },
    card: {
        padding: 18,
        borderRadius: 12,
        marginBottom: 20,
        borderLeftWidth: 4,
        borderLeftColor: COLOR_GREEN_300,
        backgroundColor: COLOR_BLACK_LIGHT_900,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 46,
        height: 46,
        borderRadius: 23,
        marginRight: 12,
        borderWidth: 2,
        borderColor: COLOR_GREEN_300,
        backgroundColor: '#232b28',
    },
    name: {
        fontSize: 17,
        color: '#fff',
        fontWeight: '700',
        marginBottom: 2,
    },
    role: {
        color: '#ccc',
        fontSize: 14,
        marginBottom: 6,
    },
    detail: {
        color: '#aaa',
        fontSize: 13,
        marginBottom: 3,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginTop: 8,
        gap: 12,
    },
    smallButton: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLOR_GREEN_300,
        borderRadius: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginRight: 10,
    },
    smallButtonText: {
        color: COLOR_GREEN_300,
        fontWeight: '600',
        fontSize: 13,
    },
});
