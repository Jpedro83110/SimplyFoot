import { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    FlatList,
    ScrollView,
    Image,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { getEquipeWithJoueurById, GetEquipeWithJoueurById } from '@/helpers/equipes.helpers';
import { useSession } from '@/hooks/useSession';
import { COLOR_GREEN_300 } from '@/utils/styleContants.utils';

const DARK = '#101415';
const DARK_LIGHT = '#161b20';

export default function Equipe() {
    const [loading, setLoading] = useState(false);
    const [equipeData, setEquipeData] = useState<GetEquipeWithJoueurById | null>(null);

    const { joueur } = useSession();

    async function fetchData(equipeId: string) {
        setLoading(true);

        try {
            const fetchedEquipe = await getEquipeWithJoueurById({ equipeId });
            setEquipeData(fetchedEquipe);
        } catch (error) {
            alert(`Erreur: ${(error as Error).message}`);
        }

        setLoading(false);
    }

    useEffect(() => {
        if (!joueur?.equipe_id || loading || equipeData) {
            return;
        }

        fetchData(joueur.equipe_id);
    }, [equipeData, joueur?.equipe_id, loading]);

    if (loading) {
        return <ActivityIndicator style={{ marginTop: 40 }} color={COLOR_GREEN_300} />;
    }

    return (
        <ScrollView style={styles.container}>
            <ScrollView style={styles.scroll}>
                <Text style={styles.title}>
                    <Ionicons name="people-circle-outline" size={22} color={COLOR_GREEN_300} /> Mon
                    Équipe
                </Text>

                {equipeData?.coach && (
                    <View style={styles.coachCard}>
                        <View
                            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}
                        >
                            <Image
                                source={{
                                    uri:
                                        equipeData.coach.staff.photo_url &&
                                        equipeData.coach.staff.photo_url.trim() !== ''
                                            ? equipeData.coach.staff.photo_url
                                            : 'https://ui-avatars.com/api/?name=' +
                                              encodeURIComponent(
                                                  `${equipeData.coach.prenom || ''} ${equipeData.coach.nom || ''}`,
                                              ) +
                                              '&background=232b28&color=fff&rounded=true',
                                }}
                                style={styles.avatarCoach}
                            />
                            <View style={{ marginLeft: 13, flex: 1, flexShrink: 1 }}>
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        flexWrap: 'wrap',
                                    }}
                                >
                                    <MaterialCommunityIcons
                                        name="account-tie"
                                        size={19}
                                        color={COLOR_GREEN_300}
                                        style={{ marginRight: 7 }}
                                    />
                                    <Text style={styles.coachTitle}>
                                        Coach :{' '}
                                        <Text style={{ color: '#fff' }}>
                                            {equipeData.coach.prenom} {equipeData.coach.nom}
                                        </Text>
                                    </Text>
                                </View>
                                <View style={styles.coachInfoRow}>
                                    <Ionicons
                                        name="call-outline"
                                        size={16}
                                        color={COLOR_GREEN_300}
                                        style={{ marginRight: 4 }}
                                    />
                                    <Text style={styles.coachText}>
                                        {equipeData.coach.telephone ? (
                                            <Text style={{ color: '#fff', fontWeight: '600' }}>
                                                {equipeData.coach.telephone}
                                            </Text>
                                        ) : (
                                            <Text style={{ color: '#666' }}>Non communiqué</Text>
                                        )}
                                    </Text>
                                </View>
                                <View style={styles.coachInfoRow}>
                                    <Ionicons
                                        name="mail-outline"
                                        size={16}
                                        color={COLOR_GREEN_300}
                                        style={{ marginRight: 4 }}
                                    />
                                    <Text style={styles.coachText}>
                                        {equipeData.coach.email || (
                                            <Text style={{ color: '#666' }}>Non communiqué</Text>
                                        )}
                                    </Text>
                                </View>
                                {equipeData.categorie ? (
                                    <Text style={styles.coachCategorie}>
                                        <Ionicons
                                            name="school-outline"
                                            size={15}
                                            color={COLOR_GREEN_300}
                                        />{' '}
                                        <Text style={{ color: '#bbb' }}>Catégorie : </Text>
                                        <Text style={{ color: '#fff' }}>
                                            {equipeData.categorie}
                                        </Text>
                                    </Text>
                                ) : null}
                            </View>
                        </View>
                    </View>
                )}

                <Text style={styles.equipeTitle}>
                    Membres de l&apos;équipe ({equipeData?.joueurs.length || 0})
                </Text>
                {equipeData?.joueurs.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>Aucun joueur trouvé dans cette équipe.</Text>
                    </View>
                ) : (
                    <FlatList
                        data={equipeData?.joueurs}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({ item }) => (
                            <View style={styles.playerCard}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Image
                                        source={{
                                            uri:
                                                item.photo_profil_url &&
                                                item.photo_profil_url.trim() !== ''
                                                    ? item.photo_profil_url
                                                    : 'https://ui-avatars.com/api/?name=' +
                                                      encodeURIComponent(
                                                          `${item.utilisateurs[0].prenom || ''} ${item.utilisateurs[0].nom || ''}`,
                                                      ) +
                                                      '&background=222&color=fff&rounded=true',
                                        }}
                                        style={styles.avatar}
                                    />
                                    <Text style={styles.cardTitle}>
                                        {item.utilisateurs[0].prenom} {item.utilisateurs[0].nom}
                                    </Text>
                                </View>
                                <Text style={styles.cardDetail}>
                                    {item.poste ? `Poste : ${item.poste}` : 'Poste non défini'}
                                </Text>
                            </View>
                        )}
                        style={{ marginBottom: 30 }}
                    />
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
        color: '#00ff88',
        marginBottom: 18,
        textAlign: 'center',
        letterSpacing: 1,
    },
    coachCard: {
        backgroundColor: DARK_LIGHT,
        padding: 14,
        borderWidth: 2,
        borderStyle: 'solid',
        borderColor: COLOR_GREEN_300,
        borderRadius: 12,
        marginBottom: 20,
        shadowColor: '#00ff8855',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.16,
        shadowRadius: 5,
        elevation: 2,
    },
    avatarCoach: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: COLOR_GREEN_300,
        backgroundColor: DARK_LIGHT,
        marginRight: 10,
    },
    coachTitle: {
        color: COLOR_GREEN_300,
        fontWeight: '700',
        fontSize: 15,
        marginBottom: 2,
        letterSpacing: 0.5,
    },
    coachInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 1,
        marginLeft: 2,
    },
    coachText: {
        color: '#fff',
        fontSize: 14,
        marginBottom: 1,
    },
    coachTeams: {
        marginTop: 4,
        fontSize: 13,
        color: '#bbb',
        marginLeft: 2,
    },
    coachCategorie: {
        marginTop: 3,
        fontSize: 13,
        color: '#bbb',
        marginLeft: 2,
    },
    equipeTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: COLOR_GREEN_300,
        marginTop: 8,
        marginBottom: 8,
        marginLeft: 2,
    },
    playerCard: {
        backgroundColor: DARK_LIGHT,
        padding: 10,
        borderRadius: 8,
        marginBottom: 12,
        flexDirection: 'column',
        shadowColor: '#00ff8833',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.13,
        shadowRadius: 2,
        elevation: 1,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginRight: 10,
        borderWidth: 2,
        borderColor: COLOR_GREEN_300,
        backgroundColor: DARK_LIGHT,
    },
    cardTitle: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 2,
    },
    cardDetail: {
        color: '#bbb',
        fontSize: 13,
        marginLeft: 58,
        marginTop: -4,
    },
    emptyContainer: {
        padding: 20,
        alignItems: 'center',
    },
    emptyText: {
        color: '#666',
        fontSize: 16,
        textAlign: 'center',
    },
});
