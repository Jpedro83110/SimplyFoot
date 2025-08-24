import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    TouchableOpacity,
    Modal,
    TextInput,
    Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { formatDateForDisplay } from '@/utils/date.utils';

export default function ConvocationDetail() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [event, setEvent] = useState(null);
    const [presents, setPresents] = useState([]);
    const [absents, setAbsents] = useState([]);
    const [sansReponse, setSansReponse] = useState([]);
    const [stats, setStats] = useState({ nbBesoinTransport: 0, nbPrisEnCharge: 0 });

    // Modal transport
    const [showModal, setShowModal] = useState(false);
    const [modalJoueur, setModalJoueur] = useState(null);
    const [lieuRdv, setLieuRdv] = useState('');
    const [heureRdv, setHeureRdv] = useState('');

    useEffect(() => {
        async function fetchData() {
            setLoading(true);

            console.log('🏆 COACH: Début fetchData pour événement:', id);

            try {
                // 1. Récupérer l'événement
                const { data: evt, error: eventError } = await supabase
                    .from('evenements')
                    .select('*')
                    .eq('id', id)
                    .single();

                console.log('🏆 COACH: Événement récupéré:', evt);
                console.log('🏆 COACH: Erreur événement:', eventError);

                if (eventError || !evt) {
                    console.log('🏆 COACH: Aucun événement trouvé');
                    setLoading(false);
                    return;
                }
                setEvent(evt);

                // 2. Récupérer tous les joueurs de l'équipe
                const { data: joueurs, error: joueursError } = await supabase
                    .from('joueurs')
                    .select('id, nom, prenom, poste, equipe_id')
                    .eq('equipe_id', evt.equipe_id);

                console.log("🏆 COACH: Joueurs de l'équipe récupérés:", joueurs?.length || 0);
                console.log('🏆 COACH: Erreur joueurs:', joueursError);

                if (joueursError) {
                    console.log('🏆 COACH: Erreur joueurs:', joueursError);
                }

                // 3. Récupérer toutes les participations à cet événement
                const { data: participations, error: participationsError } = await supabase
                    .from('participations_evenement')
                    .select('*')
                    .eq('evenement_id', id);

                console.log('🏆 COACH: Participations récupérées:', participations?.length || 0);
                console.log('🏆 COACH: Participations détails:', participations);
                console.log('🏆 COACH: Erreur participations:', participationsError);

                if (participationsError) {
                    console.log('🏆 COACH: Erreur participations:', participationsError);
                }

                // 4. 🎯 CORRECTION : Récupérer les utilisateurs correctement
                // participations contient des joueur_id qui sont des IDs d'utilisateurs
                const participationUserIds = (participations || []).map((p) => p.utilisateur_id);
                console.log('🏆 COACH: IDs utilisateurs des participations:', participationUserIds);

                // Récupérer tous les utilisateurs joueurs de cette équipe
                const joueursIds = (joueurs || []).map((j) => j.id);
                console.log("🏆 COACH: IDs joueurs de l'équipe:", joueursIds);

                let utilisateursMap = {};
                let utilisateursParJoueurId = {};

                if (joueursIds.length) {
                    const { data: utilisateurs, error: utilisateursError } = await supabase
                        .from('utilisateurs')
                        .select('id, joueur_id, nom, prenom, email, telephone')
                        .eq('role', 'joueur')
                        .in('joueur_id', joueursIds);

                    console.log('🏆 COACH: Utilisateurs récupérés:', utilisateurs?.length || 0);
                    console.log('🏆 COACH: Utilisateurs détails:', utilisateurs);
                    console.log('🏆 COACH: Erreur utilisateurs:', utilisateursError);

                    if (utilisateursError) {
                        console.log('🏆 COACH: Erreur utilisateurs:', utilisateursError);
                    }

                    // Créer les maps pour les liaisons
                    (utilisateurs || []).forEach((u) => {
                        utilisateursMap[u.id] = u; // Map par ID utilisateur
                        utilisateursParJoueurId[u.joueur_id] = u; // Map par joueur_id
                    });
                }

                console.log('🏆 COACH: Map utilisateurs par ID:', Object.keys(utilisateursMap));
                console.log(
                    '🏆 COACH: Map utilisateurs par joueur_id:',
                    Object.keys(utilisateursParJoueurId),
                );

                // 5. 🎯 CORRECTION : Construction des listes avec la bonne logique
                const presentsArr = [];
                const absentsArr = [];
                const sansReponseArr = [];

                for (const joueur of joueurs || []) {
                    console.log(
                        `🏆 COACH: Traitement joueur ${joueur.nom} ${joueur.prenom} (ID: ${joueur.id})`,
                    );

                    // Récupérer les données utilisateur via joueur_id
                    const userData = utilisateursParJoueurId[joueur.id] || {};
                    const joueurComplet = { ...joueur, utilisateur: userData };

                    console.log(`🏆 COACH: Données utilisateur pour ${joueur.nom}:`, userData);

                    // 🎯 CORRECTION : Chercher la participation par ID utilisateur
                    const part = (participations || []).find((p) => {
                        // participations.utilisateur_id = ID utilisateur
                        // userData.id = ID utilisateur
                        const match =
                            userData.id && String(p.utilisateur_id) === String(userData.id);
                        console.log(
                            `🏆 COACH: Vérification participation pour ${joueur.nom}: p.utilisateur_id=${p.utilisateur_id} vs userData.id=${userData.id} => ${match}`,
                        );
                        return match;
                    });

                    console.log(`🏆 COACH: Participation trouvée pour ${joueur.nom}:`, part);

                    if (!part) {
                        console.log(`🏆 COACH: ${joueur.nom} => SANS RÉPONSE`);
                        sansReponseArr.push(joueurComplet);
                    } else {
                        switch (part.reponse) {
                            case 'present':
                                console.log(`🏆 COACH: ${joueur.nom} => PRÉSENT`);
                                presentsArr.push({ ...joueurComplet, ...part });
                                break;
                            case 'absent':
                                console.log(`🏆 COACH: ${joueur.nom} => ABSENT`);
                                absentsArr.push({ ...joueurComplet, ...part });
                                break;
                            case null:
                            case undefined:
                            default:
                                console.log(
                                    `🏆 COACH: ${joueur.nom} => SANS RÉPONSE (null/undefined)`,
                                );
                                sansReponseArr.push({ ...joueurComplet, ...part });
                        }
                    }
                }

                console.log('🏆 COACH: Résultat final:');
                console.log(
                    '🏆 COACH: Présents:',
                    presentsArr.length,
                    presentsArr.map((p) => p.nom),
                );
                console.log(
                    '🏆 COACH: Absents:',
                    absentsArr.length,
                    absentsArr.map((p) => p.nom),
                );
                console.log(
                    '🏆 COACH: Sans réponse:',
                    sansReponseArr.length,
                    sansReponseArr.map((p) => p.nom),
                );

                // Stats transport
                const nbBesoinTransport = presentsArr.filter((j) => j.besoin_transport).length;
                const nbPrisEnCharge = presentsArr.filter(
                    (j) => j.besoin_transport && j.conducteur_id,
                ).length;

                setPresents(presentsArr);
                setAbsents(absentsArr);
                setSansReponse(sansReponseArr);
                setStats({ nbBesoinTransport, nbPrisEnCharge });
            } catch (error) {
                console.error('🏆 COACH: Erreur lors du chargement des données:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [id, showModal]);

    // Modal Transport
    const openModal = (joueur) => {
        setModalJoueur(joueur);
        setLieuRdv('');
        setHeureRdv('');
        setShowModal(true);
    };

    const validerTransport = async () => {
        if (!lieuRdv || !heureRdv) {
            alert("Merci de renseigner le lieu et l'heure de RDV");
            return;
        }
        const session = await supabase.auth.getSession();
        const coachId = session.data.session.user.id;

        // 🎯 CORRECTION : Utiliser l'ID utilisateur pour la mise à jour
        const { error } = await supabase
            .from('participations_evenement')
            .update({
                conducteur_id: coachId,
                lieu_rdv: lieuRdv,
                heure_rdv: heureRdv,
            })
            .eq('utilisateur_id', modalJoueur.utilisateur.id) // ID utilisateur
            .eq('evenement_id', id);

        if (error) {
            console.error('🏆 COACH: Erreur mise à jour transport:', error);
            alert(error.message);
        } else {
            console.log('🏆 COACH: Transport mis à jour avec succès');
        }
        setShowModal(false);
    };

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: '#121212', justifyContent: 'center' }}>
                <ActivityIndicator color="#00ff88" style={{ marginTop: 40 }} />
                <Text style={{ color: '#ccc', textAlign: 'center', marginTop: 10 }}>
                    Chargement des réponses...
                </Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: '#121212' }}>
            <ScrollView style={styles.container}>
                <Text style={styles.title}>Convocation : {event?.titre || ''}</Text>
                {event && (
                    <Text style={styles.info}>
                        📅 {formatDateForDisplay({ date: event.date })}{' '}
                        {event.heure ? 'à ' + event.heure : ''} - 📍 {event.lieu}
                    </Text>
                )}

                <View style={styles.statsRecap}>
                    <View style={styles.statItem}>
                        <Text style={styles.statsPresent}>✅ Présents : {presents.length}</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statsAbsent}>❌ Absents : {absents.length}</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statsSansReponse}>
                            ❔ Sans réponse : {sansReponse.length}
                        </Text>
                    </View>
                </View>
                <View style={styles.statsTransport}>
                    <Text style={styles.statsTransportText}>
                        🚗 Besoin transport : {stats.nbBesoinTransport} | Pris en charge :{' '}
                        {stats.nbPrisEnCharge}
                    </Text>
                </View>

                {/* Présents */}
                <Section
                    title="✅ Présents"
                    data={presents}
                    showTransport
                    onTransport={openModal}
                    router={router}
                />
                {/* Absents */}
                <Section title="❌ Absents" data={absents} />
                {/* Sans réponse */}
                <Section title="❔ Sans réponse" data={sansReponse} />
            </ScrollView>

            {/* MODAL TRANSPORT */}
            <Modal
                visible={showModal}
                animationType="slide"
                transparent
                onRequestClose={() => setShowModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>🚗 Proposer un transport</Text>
                        <Text style={styles.modalInfo}>
                            Pour : {modalJoueur?.utilisateur?.prenom}{' '}
                            {modalJoueur?.utilisateur?.nom}
                        </Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Lieu de RDV"
                            value={lieuRdv}
                            onChangeText={setLieuRdv}
                            placeholderTextColor="#aaa"
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Heure de RDV (HH:MM)"
                            value={heureRdv}
                            onChangeText={setHeureRdv}
                            placeholderTextColor="#aaa"
                            keyboardType={
                                Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default'
                            }
                        />
                        <View
                            style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                marginTop: 16,
                            }}
                        >
                            <TouchableOpacity style={styles.modalBtn} onPress={validerTransport}>
                                <Text style={styles.modalBtnText}>Valider</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalBtn, { backgroundColor: '#333' }]}
                                onPress={() => setShowModal(false)}
                            >
                                <Text style={[styles.modalBtnText, { color: '#fff' }]}>
                                    Annuler
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

// Section d'affichage de chaque liste
function Section({ title, data, showTransport = false, onTransport, router }) {
    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {!data || data.length === 0 ? (
                <Text style={styles.empty}>Aucun joueur</Text>
            ) : (
                data.map((j) => (
                    <View key={j.id} style={styles.card}>
                        <Text style={styles.cardName}>
                            {j.utilisateur?.prenom || j.prenom || ''}{' '}
                            {j.utilisateur?.nom || j.nom || ''}
                        </Text>
                        <Text style={styles.cardPoste}>Poste : {j.poste || 'NC'}</Text>
                        <Text style={{ color: '#fff', fontSize: 12 }}>
                            Email : {j.utilisateur?.email || '-'}
                        </Text>
                        <Text style={{ color: '#fff', fontSize: 12 }}>
                            Tél : {j.utilisateur?.telephone || '-'}
                        </Text>
                        {showTransport && j.besoin_transport && !j.conducteur_id && (
                            <View style={styles.transportInfo}>
                                <Text style={styles.transportInfoText}>🚗 Besoin de transport</Text>
                                <TouchableOpacity
                                    style={styles.transportButton}
                                    onPress={() => router.push('/coach/messages/besoin-transport')}
                                >
                                    <Text style={styles.transportButtonText}>Gérer</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                        {showTransport && j.besoin_transport && j.conducteur_id && (
                            <View style={styles.transportSuccess}>
                                <Text style={styles.transportSuccessText}>
                                    ✅ Pris en charge
                                    {j.lieu_rdv ? ` — ${j.lieu_rdv} à ${j.heure_rdv}` : ''}
                                </Text>
                            </View>
                        )}
                    </View>
                ))
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
        padding: Platform.OS === 'web' ? 24 : 20,
        ...(Platform.OS === 'web' && {
            maxWidth: 800,
            alignSelf: 'center',
            width: '100%',
        }),
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#00ff88',
        textAlign: 'center',
        marginBottom: 10,
    },
    info: { color: '#aaa', fontSize: 16, textAlign: 'center', marginBottom: 5 },
    section: { marginBottom: 30 },
    sectionTitle: { color: '#00ff88', fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
    card: {
        backgroundColor: '#1e1e1e',
        borderRadius: 10,
        padding: Platform.OS === 'web' ? 16 : 12,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#00ff88',
        ...(Platform.OS === 'web' && {
            maxWidth: '100%',
            minWidth: 300,
        }),
    },
    cardName: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    cardPoste: { color: '#aaa', marginBottom: 8 },
    transportBtn: {
        backgroundColor: '#00ff88',
        padding: 10,
        borderRadius: 6,
        alignItems: 'center',
        marginTop: 8,
    },
    transportText: { color: '#111', fontWeight: 'bold' },
    transportInfo: {
        backgroundColor: '#ffa500',
        padding: 10,
        borderRadius: 6,
        marginTop: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#ff8c00',
    },
    transportButton: {
        backgroundColor: '#ff8c00',
        padding: 6,
        borderRadius: 4,
        marginTop: 4,
        alignItems: 'center',
    },
    transportButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
    },
    transportSuccess: {
        backgroundColor: '#00ff88',
        padding: 8,
        borderRadius: 6,
        marginTop: 8,
    },
    transportSuccessText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 13,
        textAlign: 'center',
    },
    empty: { color: '#888', fontStyle: 'italic' },
    statsRecap: {
        flexDirection: Platform.OS === 'web' ? 'row' : 'column',
        justifyContent: Platform.OS === 'web' ? 'space-around' : 'center',
        marginVertical: 14,
        backgroundColor: '#191e1c',
        borderRadius: 10,
        padding: Platform.OS === 'web' ? 10 : 12,
        borderWidth: 1,
        borderColor: '#00ff88',
    },
    statItem: {
        alignItems: Platform.OS === 'web' ? 'center' : 'flex-start',
        marginBottom: Platform.OS === 'web' ? 0 : 8,
    },
    statsPresent: {
        color: '#00ff88',
        fontWeight: 'bold',
        fontSize: Platform.OS === 'web' ? 15 : 16,
        textAlign: Platform.OS === 'web' ? 'center' : 'left',
    },
    statsAbsent: {
        color: '#ff3e60',
        fontWeight: 'bold',
        fontSize: Platform.OS === 'web' ? 15 : 16,
        textAlign: Platform.OS === 'web' ? 'center' : 'left',
    },
    statsSansReponse: {
        color: '#ffe44d',
        fontWeight: 'bold',
        fontSize: Platform.OS === 'web' ? 15 : 16,
        textAlign: Platform.OS === 'web' ? 'center' : 'left',
    },
    statsTransport: { alignItems: 'center', marginBottom: 14 },
    statsTransportText: { color: '#0ff', fontSize: 14, fontWeight: 'bold' },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(16, 16, 16, 0.92)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#171e20',
        borderRadius: 18,
        padding: 24,
        width: '100%',
        maxWidth: 370,
        shadowColor: '#00ff88',
        shadowOpacity: 0.13,
        shadowRadius: 20,
        elevation: 8,
    },
    modalTitle: {
        color: '#00ff88',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    modalInfo: { color: '#ccc', fontSize: 14, marginBottom: 15, textAlign: 'center' },
    input: {
        backgroundColor: '#1e1e1e',
        color: '#fff',
        borderRadius: 10,
        paddingVertical: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#333',
    },
    modalBtn: {
        backgroundColor: '#00ff88',
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    modalBtnText: { color: '#000', fontWeight: 'bold', fontSize: 15 },
});
