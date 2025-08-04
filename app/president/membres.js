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
import { supabase } from '../../lib/supabase';

const GREEN = '#00ff88';
const DARK = '#101415';
const DARK_LIGHT = '#161b20';

export default function Membres() {
    const [equipeFiltre, setEquipeFiltre] = useState('');
    const [clubId, setClubId] = useState(null);
    const [joueurs, setJoueurs] = useState([]);
    const [equipes, setEquipes] = useState([]);
    const [loading, setLoading] = useState(true);

    const router = useRouter();

    useEffect(() => {
        async function getClubId() {
            setLoading(true);
            const session = await supabase.auth.getSession();
            const userId = session?.data?.session?.user?.id;
            if (!userId) return Alert.alert('Erreur', 'Utilisateur non authentifié');

            const { data: club } = await supabase
                .from('clubs')
                .select('id')
                .eq('created_by', userId)
                .single();

            if (!club?.id) return Alert.alert('Erreur', 'Club introuvable');
            setClubId(club.id);
            setLoading(false);
        }
        getClubId();
    }, []);

    useEffect(() => {
        if (!clubId) return;
        setLoading(true);

        async function fetchData() {
            try {
                // 1. Toutes les équipes du club
                const { data: equipesData } = await supabase
                    .from('equipes')
                    .select('id, nom, categorie')
                    .eq('club_id', clubId);

                setEquipes(equipesData || []);

                // 2. Tous les joueurs de ces équipes
                const equipeIds = (equipesData || []).map((e) => e.id);
                let joueursData = [];
                if (equipeIds.length) {
                    const { data: joueursResult } = await supabase
                        .from('joueurs')
                        .select(
                            'id, prenom, nom, equipe_id, numero_licence, visite_medicale_valide, equipement, photo_profil_url, photo_url',
                        )
                        .in('equipe_id', equipeIds);
                    joueursData = joueursResult || [];
                }
                setJoueurs(joueursData);
            } catch (error) {
                Alert.alert('Erreur', 'Impossible de charger les joueurs.');
                console.error('Erreur chargement joueurs:', error);
            }
            setLoading(false);
        }

        fetchData();
    }, [clubId]);

    // Map équipe_id -> {nom, categorie}
    const equipeMap = Object.fromEntries(
        (equipes || []).map((eq) => [eq.id?.toString(), { nom: eq.nom, categorie: eq.categorie }]),
    );

    // Filtre + tri
    const joueursFiltres = joueurs
        .filter((j) => {
            if (!equipeFiltre) return true;
            return (j.equipe_id?.toString() || '') === equipeFiltre;
        })
        .sort((a, b) => {
            // Catégorie > nom équipe > nom joueur
            const equipeA = equipeMap[a.equipe_id?.toString()] || {};
            const equipeB = equipeMap[b.equipe_id?.toString()] || {};
            return (
                (equipeA.categorie || '').localeCompare(equipeB.categorie || '', 'fr', {
                    sensitivity: 'base',
                }) ||
                (equipeA.nom || '').localeCompare(equipeB.nom || '', 'fr', {
                    sensitivity: 'base',
                }) ||
                (a.nom || '').localeCompare(b.nom || '', 'fr', { sensitivity: 'base' })
            );
        });

    const nbTotal = joueurs.length;
    const nbEquipe = equipeFiltre
        ? joueurs.filter((j) => (j.equipe_id?.toString() || '') === equipeFiltre).length
        : nbTotal;

    return (
        <ScrollView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scroll}>
                <Text style={styles.title}>👥 Joueurs du club</Text>

                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={equipeFiltre}
                        onValueChange={(value) => setEquipeFiltre(value.toString())}
                        style={styles.picker}
                    >
                        <Picker.Item label={`Toutes les équipes (${nbTotal})`} value="" />
                        {(equipes || [])
                            .sort((a, b) => {
                                return (
                                    (a.categorie || '').localeCompare(b.categorie || '', 'fr', {
                                        sensitivity: 'base',
                                    }) ||
                                    (a.nom || '').localeCompare(b.nom || '', 'fr', {
                                        sensitivity: 'base',
                                    })
                                );
                            })
                            .map((eq) => (
                                <Picker.Item
                                    key={eq.id}
                                    label={`${eq.nom}${eq.categorie ? ` (${eq.categorie})` : ''}`}
                                    value={eq.id.toString()}
                                />
                            ))}
                    </Picker>
                </View>

                <Text style={styles.nbLicencieText}>
                    {nbEquipe} licencié{nbEquipe > 1 ? 's' : ''}
                </Text>

                {loading ? (
                    <ActivityIndicator color="#00ff88" size="large" style={{ marginTop: 40 }} />
                ) : joueursFiltres.length === 0 ? (
                    <Text style={{ color: '#888', marginTop: 20, textAlign: 'center' }}>
                        Aucun joueur trouvé.
                    </Text>
                ) : (
                    joueursFiltres.map((j) => {
                        const eq = equipeMap[j.equipe_id?.toString()] || {};
                        // Gestion photo profil
                        let photo =
                            j.photo_profil_url && j.photo_profil_url.trim() !== ''
                                ? j.photo_profil_url
                                : null;

                        if (!photo) {
                            // fallback initiales
                            let nom = (j.prenom || '') + ' ' + (j.nom || '');
                            if (nom.trim() === '') nom = 'FC'; // fallback total
                            photo =
                                'https://ui-avatars.com/api/?name=' +
                                encodeURIComponent(nom.trim()) +
                                '&background=232b28&color=fff&rounded=true';
                        }
                        return (
                            <View key={j.id} style={styles.card}>
                                <View style={styles.row}>
                                    <Image source={{ uri: photo }} style={styles.avatar} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.name}>
                                            {j.prenom} {j.nom}
                                        </Text>
                                        <Text style={styles.role}>
                                            {eq.nom}
                                            {eq.categorie ? (
                                                <Text
                                                    style={{ color: '#00ffcc', fontWeight: '600' }}
                                                >
                                                    {' '}
                                                    ({eq.categorie})
                                                </Text>
                                            ) : null}
                                        </Text>
                                        <Text style={styles.detail}>
                                            🎫 Licence : {j.numero_licence || '—'}
                                        </Text>
                                        <Text style={styles.detail}>
                                            🩺 Visite médicale :{' '}
                                            {j.visite_medicale_valide ? '✅ OK' : '❌'}
                                        </Text>
                                        <Text style={styles.detail}>
                                            🎒 Équipement : {j.equipement ? '✅ Fourni' : '❌'}
                                        </Text>
                                        <View style={styles.buttonRow}>
                                            <TouchableOpacity
                                                style={styles.smallButton}
                                                onPress={() =>
                                                    router.push(`/joueur/eval-mentale?user=${j.id}`)
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
                                                        `/joueur/eval-technique?user=${j.id}`,
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
        backgroundColor: DARK,
    },
    scroll: { padding: 20, alignSelf: 'center', maxWidth: 790, width: '92%' },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: GREEN,
        marginBottom: 20,
        textAlign: 'center',
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: GREEN,
        borderRadius: 8,
        marginBottom: 12,
        overflow: 'hidden',
    },
    picker: {
        height: 50,
        color: '#bbb',
        backgroundColor: DARK_LIGHT,
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
        borderLeftColor: GREEN,
        backgroundColor: DARK_LIGHT,
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
        borderColor: GREEN,
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
        borderColor: GREEN,
        borderRadius: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginRight: 10,
    },
    smallButtonText: {
        color: GREEN,
        fontWeight: '600',
        fontSize: 13,
    },
});
