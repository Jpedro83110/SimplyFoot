import React, { useCallback, useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Switch,
    Linking,
    Platform,
    Modal,
    TextInput,
    ScrollView,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import { Ionicons } from '@expo/vector-icons';

dayjs.locale('fr');

export default function ConvocationReponse() {
    const { id } = useLocalSearchParams();
    const [loading, setLoading] = useState(true);
    const [event, setEvent] = useState(null);
    const [accepteTransport, setAccepteTransport] = useState(false);
    const [besoinTransport, setBesoinTransport] = useState(false);
    const [reponse, setReponse] = useState(null);
    const [reponseLoading, setReponseLoading] = useState(false);
    const [utilisateurId, setUtilisateurId] = useState(null);
    const [, setJoueurId] = useState(null); // FIXME
    const [showTransportModal, setShowTransportModal] = useState(false);

    // Pour la messagerie transport
    const [messages, setMessages] = useState([]);
    const [nouvelleAdresse, setNouvelleAdresse] = useState('');
    const [nouvelleHeure, setNouvelleHeure] = useState('');
    const [sendingProposition, setSendingProposition] = useState(false);

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                const session = await supabase.auth.getSession();
                const userId = session.data.session?.user?.id;

                console.log('🔐 Utilisateur connecté:', userId);
                console.log('📅 ID événement:', id);

                if (!userId) throw new Error('Utilisateur non trouvé.');

                setUtilisateurId(userId);

                // Récupérer les infos utilisateur
                const { data: utilisateur, error: userErr } = await supabase
                    .from('utilisateurs')
                    .select('id, joueur_id, nom, prenom, role')
                    .eq('id', userId)
                    .single();

                console.log('👤 Données utilisateur:', utilisateur);

                if (userErr || !utilisateur) {
                    console.error('❌ Erreur utilisateur:', userErr);
                    throw userErr || new Error('Utilisateur non trouvé');
                }

                if (utilisateur.role !== 'joueur') {
                    throw new Error('Utilisateur non joueur');
                }

                setJoueurId(utilisateur.joueur_id);

                // Récupérer l'événement
                const { data: evt, error: evtErr } = await supabase
                    .from('evenements')
                    .select('titre, date, heure, lieu, lieu_complement, meteo, latitude, longitude')
                    .eq('id', id)
                    .single();

                console.log('📅 Données événement:', evt);

                if (evtErr || !evt) {
                    console.error('❌ Erreur événement:', evtErr);
                    throw evtErr;
                }
                setEvent(evt);

                // Récupérer la décharge de transport
                // ⚠️ ATTENTION : decharges_generales utilise l'ID de la table joueurs
                if (utilisateur.joueur_id) {
                    console.log('🚗 Recherche décharge pour joueur_id:', utilisateur.joueur_id);

                    const { data: decharge } = await supabase
                        .from('decharges_generales')
                        .select('accepte_transport')
                        .eq('joueur_id', utilisateur.joueur_id) // ID table joueurs
                        .single();

                    console.log('🚗 Décharge trouvée:', decharge);

                    setAccepteTransport(decharge?.accepte_transport || false);
                } else {
                    console.log('🚗 Pas de joueur_id, pas de décharge transport');
                    setAccepteTransport(false);
                }

                // 🎯 CORRECTION : Utiliser l'ID utilisateur directement
                const { data: participation, error: partErr } = await supabase
                    .from('participations_evenement')
                    .select('reponse, besoin_transport, joueur_id')
                    .eq('joueur_id', userId) // Utiliser l'ID utilisateur
                    .eq('evenement_id', id)
                    .single();

                console.log('🎯 Participation trouvée:', participation);
                console.log('🎯 Erreur participation:', partErr);

                if (participation) {
                    setReponse(participation.reponse);
                    setBesoinTransport(participation.besoin_transport || false);
                } else {
                    // Pas de participation trouvée, c'est normal pour un nouvel événement
                    setReponse(null);
                    setBesoinTransport(false);
                }

                await fetchTransportMessages();
            } catch (err) {
                console.error('💥 Erreur fetchData:', err);
                Alert.alert('Erreur', `Impossible de charger la convocation: ${err.message}`);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [fetchTransportMessages, id]);

    // Fetch messages pour la messagerie transport
    const fetchTransportMessages = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('messages_besoin_transport')
                .select(
                    `
          *, 
          joueurs:joueur_id(nom, prenom, age)
        `,
                )
                .eq('evenement_id', id);
            if (error) throw error;
            setMessages(data || []);
        } catch (err) {
            console.error('❌ Erreur messages transport:', err);
            setMessages([]);
        }
    }, [id]);

    // Réponse à la convocation
    const envoyerReponse = async (valeur) => {
        try {
            setReponseLoading(true);

            console.log('📤 Envoi réponse:', {
                valeur,
                utilisateurId,
                evenementId: id,
                besoinTransport,
            });

            if (!utilisateurId || !id || !valeur) {
                Alert.alert('Erreur', 'Données manquantes (utilisateur ou événement).');
                setReponseLoading(false);
                return;
            }

            const besoinTransportFinal =
                accepteTransport && besoinTransport && valeur === 'present';

            // 🎯 CORRECTION : Utiliser l'ID utilisateur
            const { data, error } = await supabase.from('participations_evenement').upsert(
                [
                    {
                        joueur_id: utilisateurId, // ID utilisateur au lieu de joueur_id
                        evenement_id: id,
                        reponse: valeur,
                        besoin_transport: besoinTransportFinal,
                    },
                ],
                { onConflict: 'joueur_id,evenement_id' }, // Correction syntaxe
            );

            console.log('✅ Réponse envoyée:', data);
            console.log('❌ Erreur réponse:', error);

            if (error) {
                Alert.alert('Erreur', error.message || "Erreur lors de l'envoi.");
                setReponseLoading(false);
                return;
            }

            setReponse(valeur);
            setBesoinTransport(besoinTransportFinal);
            setReponseLoading(false);
            await fetchTransportMessages();
            Alert.alert('✅ Réponse enregistrée !');
        } catch (err) {
            console.error('💥 Erreur envoyerReponse:', err);
            setReponseLoading(false);
            Alert.alert('Erreur', `Erreur critique dans l'envoi: ${err.message}`);
        }
    };

    // Insertion demande transport quand "Envoyer la demande"
    const envoyerDemandeTransport = async () => {
        if (!nouvelleAdresse || !nouvelleHeure) {
            Alert.alert("Merci de remplir le lieu et l'heure.");
            return;
        }
        try {
            setSendingProposition(true);

            // 🚗 messages_besoin_transport utilise les IDs UTILISATEURS
            const { error } = await supabase.from('messages_besoin_transport').insert({
                evenement_id: id,
                joueur_id: utilisateurId, // ID utilisateur
                auteur_id: utilisateurId, // ID utilisateur
                adresse_demande: nouvelleAdresse,
                heure_demande: nouvelleHeure,
                etat: 'en_attente',
                created_at: new Date(),
            });

            console.log('🚗 Résultat insertion transport:', { error });

            if (error) {
                Alert.alert('Erreur', 'Insertion échouée : ' + error.message);
            } else {
                setShowTransportModal(false);
                setNouvelleAdresse('');
                setNouvelleHeure('');
                Alert.alert('✅ Demande envoyée à la messagerie transport !');
                await fetchTransportMessages();
            }
        } catch (err) {
            console.error('💥 Erreur envoyerDemandeTransport:', err);
            Alert.alert('Erreur', err.message);
        } finally {
            setSendingProposition(false);
        }
    };

    // Propositions et signatures
    const proposerLieuHeure = async (msgId) => {
        try {
            setSendingProposition(true);
            const { error } = await supabase
                .from('messages_besoin_transport')
                .update({
                    adresse_demande: nouvelleAdresse,
                    heure_demande: nouvelleHeure,
                    etat: 'proposition_faite',
                })
                .eq('id', msgId);
            if (error) throw error;
            setNouvelleAdresse('');
            setNouvelleHeure('');
            await fetchTransportMessages();
        } catch (error) {
            console.error("Erreur lors de l'envoi de la proposition:", error);
            Alert.alert('Erreur', "Impossible d'envoyer la proposition.");
        } finally {
            setSendingProposition(false);
        }
    };

    const signerTransport = async (msgId, qui) => {
        try {
            let fields = {};
            if (qui === 'demandeur') {
                fields = {
                    signature_demandeur: true,
                    signature_demandeur_date: new Date(),
                    etat: 'proposition_faite',
                };
            }
            if (qui === 'conducteur') {
                fields = {
                    signature_conducteur: true,
                    signature_conducteur_date: new Date(),
                    etat: 'signe',
                };
            }
            const { error } = await supabase
                .from('messages_besoin_transport')
                .update(fields)
                .eq('id', msgId);
            if (error) throw error;
            await fetchTransportMessages();
        } catch (error) {
            console.error('Erreur lors de la signature:', error);
            Alert.alert('Erreur', 'Impossible de signer.');
        }
    };

    if (loading || !event)
        return (
            <View style={styles.container}>
                <ActivityIndicator style={{ marginTop: 40 }} color="#00ff88" />
                <Text style={{ color: '#ccc', textAlign: 'center', marginTop: 10 }}>
                    Chargement de l&apos;événement...
                </Text>
            </View>
        );

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>{event?.titre}</Text>
            <Text style={styles.info}>
                📅 {dayjs(event?.date).format('dddd D MMMM YYYY')} à {event?.heure}
            </Text>
            <Text style={styles.info}>📍 {event?.lieu}</Text>
            {event?.lieu_complement && (
                <Text style={[styles.info, { fontStyle: 'italic', color: '#8fd6ff' }]}>
                    🏟️ {event.lieu_complement}
                </Text>
            )}

            {event?.meteo && (
                <Text style={[styles.info, { color: '#62d4ff', fontWeight: '700' }]}>
                    <Ionicons name="cloud-outline" size={16} color="#62d4ff" /> {event.meteo}
                </Text>
            )}

            {/* Debug info */}
            <Text style={styles.debugText}>
                Réponse actuelle: {reponse || 'Aucune'} | Transport:{' '}
                {besoinTransport ? 'Oui' : 'Non'}
            </Text>

            {event?.latitude && event?.longitude && (
                <TouchableOpacity
                    style={{
                        marginTop: 8,
                        alignSelf: 'center',
                        backgroundColor: '#181f22',
                        borderRadius: 8,
                        paddingHorizontal: 13,
                        paddingVertical: 6,
                    }}
                    onPress={() => {
                        const url = `https://www.google.com/maps/search/?api=1&query=${event.latitude},${event.longitude}`;
                        if (Platform.OS === 'web') window.open(url, '_blank');
                        else Linking.openURL(url);
                    }}
                >
                    <Text style={{ color: '#00ff88', fontSize: 14 }}>
                        <Ionicons name="navigate-outline" size={15} color="#00ff88" /> Voir sur
                        Google Maps
                    </Text>
                </TouchableOpacity>
            )}

            <Text style={styles.section}>Ta réponse :</Text>

            <View style={styles.buttons}>
                <TouchableOpacity
                    style={[styles.button, reponse === 'present' && styles.selected]}
                    onPress={() => {
                        setBesoinTransport(false);
                        envoyerReponse('present');
                    }}
                    disabled={reponseLoading}
                >
                    <Text style={[styles.buttonText, reponse === 'present' && { color: '#111' }]}>
                        {reponseLoading ? '...' : '✅ Présent'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, reponse === 'absent' && styles.selected]}
                    onPress={() => {
                        setBesoinTransport(false);
                        envoyerReponse('absent');
                    }}
                    disabled={reponseLoading}
                >
                    <Text style={[styles.buttonText, reponse === 'absent' && { color: '#111' }]}>
                        {reponseLoading ? '...' : '❌ Absent'}
                    </Text>
                </TouchableOpacity>
            </View>

            {accepteTransport && reponse === 'present' && (
                <View style={styles.switchBlock}>
                    <Text style={styles.label}>Je n&apos;ai pas de moyen de transport</Text>
                    <Switch
                        value={besoinTransport}
                        onValueChange={setBesoinTransport}
                        thumbColor={besoinTransport ? '#00ff88' : '#666'}
                        trackColor={{ false: '#333', true: '#00ff8860' }}
                        disabled={reponse !== 'present'}
                    />
                </View>
            )}

            {/* Affiche le bouton transport SEULEMENT si besoinTransport === true ET reponse === 'present' */}
            {reponse === 'present' && besoinTransport && (
                <TouchableOpacity
                    style={styles.transportBtn}
                    onPress={() => setShowTransportModal(true)}
                >
                    <Ionicons name="car-outline" size={18} color="#fff" />
                    <Text style={{ color: '#fff', marginLeft: 8, fontWeight: 'bold' }}>
                        Messagerie Besoin de Transport
                    </Text>
                </TouchableOpacity>
            )}

            {/* MODALE MESSAGERIE BESOIN DE TRANSPORT */}
            <Modal
                visible={showTransportModal}
                animationType="slide"
                onRequestClose={() => setShowTransportModal(false)}
                transparent={false}
            >
                <ScrollView style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>
                        🚗 Besoins de transport pour cet événement
                    </Text>
                    {messages.length === 0 && (
                        <Text style={{ color: '#aaa', marginTop: 25, textAlign: 'center' }}>
                            Aucun besoin de transport déclaré.
                        </Text>
                    )}

                    {messages.map((msg) => (
                        <View key={msg.id} style={styles.messageCard}>
                            <Text style={{ color: '#00ff88', fontWeight: 'bold', fontSize: 16 }}>
                                {msg.joueurs?.prenom} {msg.joueurs?.nom}{' '}
                                {msg.joueurs?.age ? `(âge: ${msg.joueurs.age})` : ''}
                            </Text>
                            <Text style={{ color: '#fff', marginBottom: 4 }}>
                                Statut : <Text style={{ color: '#00ff88' }}>{msg.etat}</Text>
                            </Text>
                            {msg.adresse_demande && (
                                <Text style={{ color: '#fff' }}>Lieu : {msg.adresse_demande}</Text>
                            )}
                            {msg.heure_demande && (
                                <Text style={{ color: '#fff' }}>Heure : {msg.heure_demande}</Text>
                            )}
                            <View style={{ flexDirection: 'row', marginTop: 6 }}>
                                <TouchableOpacity
                                    style={styles.proposeBtn}
                                    onPress={() => {
                                        setNouvelleAdresse('');
                                        setNouvelleHeure('');
                                        proposerLieuHeure(msg.id);
                                    }}
                                    disabled={sendingProposition}
                                >
                                    <Ionicons name="navigate-outline" size={16} color="#111" />
                                    <Text style={{ color: '#111', marginLeft: 5 }}>
                                        Proposer lieu/heure
                                    </Text>
                                </TouchableOpacity>
                                {/* Si besoin, boutons signature */}
                                {!msg.signature_demandeur && (
                                    <TouchableOpacity
                                        style={styles.signatureBtn}
                                        onPress={() => signerTransport(msg.id, 'demandeur')}
                                    >
                                        <Ionicons name="pencil-outline" size={16} color="#00ff88" />
                                        <Text style={{ color: '#00ff88', marginLeft: 5 }}>
                                            Signer demandeur
                                        </Text>
                                    </TouchableOpacity>
                                )}
                                {msg.signature_demandeur && !msg.signature_conducteur && (
                                    <TouchableOpacity
                                        style={styles.signatureBtn}
                                        onPress={() => signerTransport(msg.id, 'conducteur')}
                                    >
                                        <Ionicons name="pencil" size={16} color="#00ff88" />
                                        <Text style={{ color: '#00ff88', marginLeft: 5 }}>
                                            Signer conducteur
                                        </Text>
                                    </TouchableOpacity>
                                )}
                                {msg.signature_demandeur && msg.signature_conducteur && (
                                    <Text
                                        style={{
                                            color: '#00ff88',
                                            fontWeight: 'bold',
                                            marginLeft: 10,
                                        }}
                                    >
                                        ✔️ Signé par les deux parties
                                    </Text>
                                )}
                            </View>
                        </View>
                    ))}

                    {/* ==== Champs à remplir pour ENVOYER LA DEMANDE ==== */}
                    <View style={{ marginTop: 20 }}>
                        <TextInput
                            style={styles.input}
                            placeholder="Lieu de RDV"
                            placeholderTextColor="#aaa"
                            value={nouvelleAdresse}
                            onChangeText={setNouvelleAdresse}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Heure"
                            placeholderTextColor="#aaa"
                            value={nouvelleHeure}
                            onChangeText={setNouvelleHeure}
                        />
                        <TouchableOpacity
                            style={[styles.closeBtn, { backgroundColor: '#00ff88', marginTop: 10 }]}
                            onPress={envoyerDemandeTransport}
                            disabled={sendingProposition}
                        >
                            <Text style={{ color: '#111', fontWeight: 'bold' }}>
                                {sendingProposition ? 'Envoi...' : 'Envoyer la demande'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                        style={styles.closeBtn}
                        onPress={() => setShowTransportModal(false)}
                    >
                        <Text style={{ color: '#111', fontWeight: 'bold' }}>Fermer</Text>
                    </TouchableOpacity>
                </ScrollView>
            </Modal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { backgroundColor: '#121212', flex: 1, padding: 20 },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#00ff88',
        textAlign: 'center',
        marginBottom: 10,
    },
    info: { color: '#ccc', textAlign: 'center', marginBottom: 6 },
    debugText: {
        color: '#666',
        fontSize: 12,
        textAlign: 'center',
        marginVertical: 10,
        fontStyle: 'italic',
    },
    section: {
        marginTop: 30,
        fontSize: 18,
        color: '#00ff88',
        fontWeight: 'bold',
        marginBottom: 10,
    },
    buttons: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 30 },
    button: {
        backgroundColor: '#1e1e1e',
        borderColor: '#00ff88',
        borderWidth: 2,
        borderRadius: 10,
        paddingVertical: 14,
        paddingHorizontal: 24,
    },
    selected: { backgroundColor: '#00ff88' },
    buttonText: { color: '#fff', fontWeight: 'bold' },
    switchBlock: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
        paddingVertical: 10,
        borderTopWidth: 1,
        borderColor: '#333',
    },
    label: { color: '#ccc', fontSize: 15 },
    transportBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#00ff88',
        padding: 10,
        borderRadius: 10,
        marginVertical: 15,
        alignSelf: 'center',
    },
    modalContainer: { backgroundColor: '#181f22', flex: 1, padding: 20 },
    modalTitle: {
        color: '#00ff88',
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
    },
    messageCard: {
        backgroundColor: '#242c2e',
        borderRadius: 10,
        marginBottom: 18,
        padding: 15,
        shadowColor: '#000',
        shadowOpacity: 0.09,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
    },
    proposeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#00ff88',
        borderRadius: 7,
        padding: 7,
        marginRight: 10,
    },
    signatureBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#181f22',
        borderRadius: 7,
        padding: 7,
        borderWidth: 1,
        borderColor: '#00ff88',
        marginRight: 10,
    },
    input: {
        backgroundColor: '#242c2e',
        color: '#fff',
        borderRadius: 8,
        padding: 9,
        marginTop: 8,
        borderColor: '#00ff88',
        borderWidth: 1,
        marginBottom: 6,
    },
    closeBtn: {
        backgroundColor: '#00ff88',
        borderRadius: 9,
        alignItems: 'center',
        marginTop: 16,
        padding: 12,
    },
});
