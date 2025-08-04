import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    FlatList,
    ScrollView,
    Image,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const DARK = '#101415';
const DARK_LIGHT = '#161b20';

export default function Equipe() {
    const [players, setPlayers] = useState([]);
    const [coach, setCoach] = useState(null);
    const [coachTeams, setCoachTeams] = useState([]);
    const [equipeCategorie, setEquipeCategorie] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const session = await supabase.auth.getSession();
                const userId = session.data.session?.user?.id;
                if (!userId) {
                    alert('Utilisateur non connecté.');
                    setLoading(false);
                    return;
                }

                console.log('=== DÉBUT RÉCUPÉRATION ÉQUIPE ===');
                console.log('User ID connecté:', userId);

                // 1. Récupérer l'utilisateur connecté pour avoir son joueur_id
                const { data: utilisateur, error: userError } = await supabase
                    .from('utilisateurs')
                    .select('id, joueur_id, nom, prenom, role')
                    .eq('id', userId)
                    .single();

                console.log('Utilisateur connecté:', utilisateur);
                console.log('Erreur utilisateur:', userError);

                if (!utilisateur) {
                    alert('Utilisateur introuvable.');
                    setLoading(false);
                    return;
                }

                if (!utilisateur.joueur_id) {
                    alert("Vous n'êtes pas associé à un joueur.");
                    setLoading(false);
                    return;
                }

                // 2. Récupérer le joueur pour avoir son equipe_id
                const { data: joueur, error: joueurError } = await supabase
                    .from('joueurs')
                    .select('id, equipe_id, nom, prenom')
                    .eq('id', utilisateur.joueur_id)
                    .single();

                console.log('Joueur trouvé:', joueur);
                console.log('Erreur joueur:', joueurError);

                if (!joueur || !joueur.equipe_id) {
                    alert('Aucune équipe trouvée pour ce joueur.');
                    setLoading(false);
                    return;
                }

                // 3. Récupérer l'équipe (coach_id, categorie)
                const { data: equipe, error: equipeError } = await supabase
                    .from('equipes')
                    .select('id, coach_id, nom, categorie')
                    .eq('id', joueur.equipe_id)
                    .single();

                console.log('Équipe trouvée:', equipe);
                console.log('Erreur équipe:', equipeError);

                if (!equipe || !equipe.coach_id) {
                    alert('Équipe introuvable ou coach non défini.');
                    setLoading(false);
                    return;
                }

                setEquipeCategorie(equipe.categorie || '');

                // 4. Récupérer le coach (info utilisateur)
                const { data: coachUser, error: coachError } = await supabase
                    .from('utilisateurs')
                    .select('prenom, nom, email, id')
                    .eq('id', equipe.coach_id)
                    .single();

                console.log('Coach trouvé:', coachUser);
                console.log('Erreur coach:', coachError);

                // 5. Récupérer la photo du coach dans staff
                let coachPhoto = null;
                let coachPhone = null;
                if (coachUser && coachUser.id) {
                    const { data: staffInfo } = await supabase
                        .from('staff')
                        .select('photo_url, telephone')
                        .eq('utilisateur_id', coachUser.id)
                        .maybeSingle();
                    coachPhoto = staffInfo?.photo_url || null;
                    coachPhone = staffInfo?.telephone || null;
                }

                setCoach({
                    ...coachUser,
                    telephone: coachPhone,
                    photo_url: coachPhoto,
                });

                // 6. Équipes du coach
                const { data: teamsOfCoach } = await supabase
                    .from('equipes')
                    .select('nom')
                    .eq('coach_id', equipe.coach_id);
                setCoachTeams(teamsOfCoach || []);

                // 7. Récupérer tous les joueurs de l'équipe (avec photo_profil_url)
                const { data: joueursEquipe, error: joueursError } = await supabase
                    .from('joueurs')
                    .select('id, nom, prenom, poste, photo_profil_url')
                    .eq('equipe_id', joueur.equipe_id);

                console.log("Joueurs de l'équipe:", joueursEquipe);
                console.log('Erreur joueurs équipe:', joueursError);

                setPlayers(joueursEquipe || []);
                console.log('=== FIN RÉCUPÉRATION ÉQUIPE ===');
            } catch (e) {
                console.error('Erreur Equipe.js:', e.message);
                alert(`Erreur: ${e.message}`);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    if (loading) return <ActivityIndicator style={{ marginTop: 40 }} color="#00ff88" />;

    return (
        <ScrollView style={styles.container}>
            <ScrollView style={styles.scroll}>
                <Text style={styles.title}>
                    <Ionicons name="people-circle-outline" size={22} color="#00ff88" /> Mon Équipe
                </Text>

                {coach && (
                    <View style={styles.coachCard}>
                        <View
                            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}
                        >
                            <Image
                                source={{
                                    uri:
                                        coach.photo_url && coach.photo_url.trim() !== ''
                                            ? coach.photo_url
                                            : 'https://ui-avatars.com/api/?name=' +
                                              encodeURIComponent(
                                                  `${coach.prenom || ''} ${coach.nom || ''}`,
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
                                        color="#00ff88"
                                        style={{ marginRight: 7 }}
                                    />
                                    <Text style={styles.coachTitle}>
                                        Coach :{' '}
                                        <Text style={{ color: '#fff' }}>
                                            {coach.prenom} {coach.nom}
                                        </Text>
                                    </Text>
                                </View>
                                <View style={styles.coachInfoRow}>
                                    <Ionicons
                                        name="call-outline"
                                        size={16}
                                        color="#00ff88"
                                        style={{ marginRight: 4 }}
                                    />
                                    <Text style={styles.coachText}>
                                        {coach.telephone ? (
                                            <Text style={{ color: '#fff', fontWeight: '600' }}>
                                                {coach.telephone}
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
                                        color="#00ff88"
                                        style={{ marginRight: 4 }}
                                    />
                                    <Text style={styles.coachText}>
                                        {coach.email || (
                                            <Text style={{ color: '#666' }}>Non communiqué</Text>
                                        )}
                                    </Text>
                                </View>
                                <Text style={styles.coachTeams}>
                                    {coachTeams.length > 0 ? (
                                        <>
                                            <MaterialCommunityIcons
                                                name="soccer-field"
                                                size={15}
                                                color="#00ff88"
                                            />{' '}
                                            <Text style={{ color: '#bbb' }}>
                                                Équipe du coach :{' '}
                                            </Text>
                                            <Text style={{ color: '#fff' }}>
                                                {coachTeams.map((e) => e.nom).join(', ')}
                                            </Text>
                                        </>
                                    ) : (
                                        <Text style={{ color: '#666' }}>Aucune équipe trouvée</Text>
                                    )}
                                </Text>
                                {equipeCategorie ? (
                                    <Text style={styles.coachCategorie}>
                                        <Ionicons name="school-outline" size={15} color="#00ff88" />{' '}
                                        <Text style={{ color: '#bbb' }}>Catégorie : </Text>
                                        <Text style={{ color: '#fff' }}>{equipeCategorie}</Text>
                                    </Text>
                                ) : null}
                            </View>
                        </View>
                    </View>
                )}

                <Text style={styles.equipeTitle}>Membres de l&apos;équipe ({players.length})</Text>
                {players.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>Aucun joueur trouvé dans cette équipe.</Text>
                    </View>
                ) : (
                    <FlatList
                        data={players}
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
                                                          `${item.prenom || ''} ${item.nom || ''}`,
                                                      ) +
                                                      '&background=222&color=fff&rounded=true',
                                        }}
                                        style={styles.avatar}
                                    />
                                    <Text style={styles.cardTitle}>
                                        {item.prenom} {item.nom}
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
        border: '2px solid #00ff88',
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
        borderColor: '#00ff88',
        backgroundColor: DARK_LIGHT,
        marginRight: 10,
    },
    coachTitle: {
        color: '#00ff88',
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
        color: '#00ff88',
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
        borderColor: '#00ff88',
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
