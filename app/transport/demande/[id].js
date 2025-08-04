import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Modal,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '../../../lib/supabase';

const GREEN = '#00ff88';
const YELLOW = '#ffe44d';

export default function TransportDetail() {
    const { id } = useLocalSearchParams(); // id de la demande
    const [loading, setLoading] = useState(true);
    const [demande, setDemande] = useState(null);
    const [joueur, setJoueur] = useState(null);
    const [decharge, setDecharge] = useState(null);
    const [evenement, setEvenement] = useState(null);
    const [propositions, setPropositions] = useState([]);
    const [userId, setUserId] = useState(null);
    const [showPropModal, setShowPropModal] = useState(false);
    const [lieu, setLieu] = useState('');
    const [heure, setHeure] = useState('');
    const [editPropId, setEditPropId] = useState(null);
    const [signatureModal, setSignatureModal] = useState({ open: false, prop: null });
    const [signatureStatus, setSignatureStatus] = useState({ demandeur: false, conducteur: false });
    const [autorise, setAutorise] = useState(false);

    useEffect(() => {
        fetchAll();
        // eslint-disable-next-line
  }, [id]);

    async function fetchAll() {
        setLoading(true);
        setAutorise(false);

        // 1. Récupération session
        const { data: session } = await supabase.auth.getSession();
        const connectedId = session?.session?.user?.id;
        setUserId(connectedId);

        // 2. Récupération de la demande
        const { data: dmd, error: demandeError } = await supabase
            .from('messages_besoin_transport')
            .select('*')
            .eq('id', id)
            .single();
        if (demandeError) {
            setLoading(false);
            return;
        }
        setDemande(dmd);

        // 3. Joueur
        let joueurData = null;
        if (dmd?.joueur_id) {
            const { data: j } = await supabase
                .from('utilisateurs')
                .select('id, prenom, nom')
                .eq('id', dmd.joueur_id)
                .single();
            joueurData = j;
        }
        setJoueur(joueurData);

        // 4. Décharge parentale
        let dechargeData = null;
        if (dmd?.joueur_id) {
            const { data: d } = await supabase
                .from('decharges_generales')
                .select('parent_prenom, parent_nom, accepte_transport')
                .eq('joueur_id', dmd.joueur_id)
                .single();
            dechargeData = d;
        }
        setDecharge(dechargeData);

        // 5. Evènement
        let eventData = null;
        if (dmd?.evenement_id) {
            const { data: evt } = await supabase
                .from('evenements')
                .select('id, titre, date, heure, equipe_id')
                .eq('id', dmd.evenement_id)
                .single();
            eventData = evt;
        }
        setEvenement(eventData);

        // 6. Autorisation
        let isAuthorized = false;
        console.log('🔥 DEBUG AUTH - Début autorisation 🔥');
        console.log('🔥 connectedId:', connectedId);
        console.log('🔥 dechargeData:', dechargeData);

        // Coach de l'équipe peut proposer
        if (eventData?.equipe_id) {
            const { data: equipe } = await supabase
                .from('equipes')
                .select('coach_id')
                .eq('id', eventData.equipe_id)
                .single();
            console.log('🔥 Équipe coach_id:', equipe?.coach_id);
            console.log('🔥 Est coach?', equipe?.coach_id === connectedId);
            if (equipe?.coach_id === connectedId) isAuthorized = true;
        }

        // Vérifier la décharge du joueur CONNECTÉ (Lyam), pas du demandeur (Lisandro)
        if (connectedId) {
            const { data: currentUser } = await supabase
                .from('utilisateurs')
                .select('prenom, nom, joueur_id')
                .eq('id', connectedId)
                .single();

            console.log('🔥 currentUser (Lyam):', currentUser);

            // Récupérer la décharge de LYAM (pas de Lisandro)
            const { data: currentUserDecharge } = await supabase
                .from('decharges_generales')
                .select('accepte_transport')
                .eq('joueur_id', currentUser?.joueur_id)
                .eq('accepte_transport', true)
                .single();

            console.log('🔥 Décharge de Lyam:', currentUserDecharge);

            if (currentUserDecharge?.accepte_transport) {
                isAuthorized = true;
            }
        }

        console.log('🔥 AUTORISATION FINALE:', isAuthorized);
        setAutorise(isAuthorized);

        // 7. Propositions transport
        const { data: props } = await supabase
            .from('propositions_transport')
            .select('*, parent_proposeur:parent_proposeur_id(prenom, nom)')
            .eq('demande_id', id);
        setPropositions(props || []);

        // 8. Signatures
        const propAcceptee = (props || []).find((p) => p.accepte);
        if (propAcceptee) {
            const { data: sigs } = await supabase
                .from('signatures_transport')
                .select('*')
                .eq('proposition_id', propAcceptee.id);
            setSignatureStatus({
                demandeur: !!(sigs && sigs.find((s) => s.parent1_id === dmd.joueur_id)),
                conducteur: !!(
                    sigs && sigs.find((s) => s.parent2_id === propAcceptee.parent_proposeur_id)
                ),
            });
        } else {
            setSignatureStatus({ demandeur: false, conducteur: false });
        }

        setLoading(false);
    }

    // Ajouter ou éditer une proposition
    async function proposerOuModifierTransport(autopick = false) {
        if (!autorise) {
            Alert.alert('Non autorisé');
            return;
        }
        let finalLieu = lieu,
            finalHeure = heure;
        if (autopick && demande) {
            finalLieu = demande.adresse_demande;
            finalHeure = demande.heure_demande;
        }
        if (!finalLieu || !finalHeure) {
            Alert.alert('Remplis bien tous les champs.');
            return;
        }
        // EDITION
        if (editPropId) {
            const { error } = await supabase
                .from('propositions_transport')
                .update({ lieu_rdv: finalLieu, heure_rdv: finalHeure })
                .eq('id', editPropId);
            if (error) {
                Alert.alert('Erreur modification', error.message);
                return;
            }
            setEditPropId(null);
            setShowPropModal(false);
            setLieu('');
            setHeure('');
            fetchAll();
            Alert.alert('Proposition modifiée !');
            return;
        }
        // AJOUT
        const exist = propositions.find(
            (p) =>
                p.lieu_rdv === finalLieu &&
                p.heure_rdv === finalHeure &&
                p.parent_proposeur_id === userId,
        );
        if (exist) {
            Alert.alert('Déjà proposé !');
            return;
        }
        const { error } = await supabase.from('propositions_transport').insert({
            demande_id: id,
            parent_proposeur_id: userId,
            lieu_rdv: finalLieu,
            heure_rdv: finalHeure,
            date_proposition: new Date(),
            accepte: false,
        });
        if (error) {
            Alert.alert('Erreur', error.message);
            return;
        }
        setShowPropModal(false);
        setLieu('');
        setHeure('');
        fetchAll();
        Alert.alert('Proposition envoyée !');
    }

    // Supprimer proposition (seulement auteur, et pas si validé)
    async function supprimerProposition(propId) {
        Alert.alert('Supprimer la proposition', 'Tu es sûr ? Cette action est irréversible.', [
            { text: 'Annuler', style: 'cancel' },
            {
                text: 'Supprimer',
                style: 'destructive',
                onPress: async () => {
                    const { error } = await supabase
                        .from('propositions_transport')
                        .delete()
                        .eq('id', propId);
                    if (error) Alert.alert('Erreur', error.message);
                    fetchAll();
                },
            },
        ]);
    }

    // Signature
    async function signer(prop, role) {
        let data = { proposition_id: prop.id, date_signature: new Date(), status: 'signed' };
        if (role === 'demandeur') data.parent1_id = userId;
        if (role === 'conducteur') data.parent2_id = userId;

        const { data: exists } = await supabase
            .from('signatures_transport')
            .select('*')
            .eq('proposition_id', prop.id)
            .eq(role === 'demandeur' ? 'parent1_id' : 'parent2_id', userId);

        if (exists && exists.length > 0) {
            Alert.alert('Déjà signé.');
            return;
        }

        await supabase
            .from('signatures_transport')
            .upsert(data, { onConflict: ['proposition_id', 'parent1_id', 'parent2_id'] });

        const { data: sigs } = await supabase
            .from('signatures_transport')
            .select('*')
            .eq('proposition_id', prop.id);

        if (sigs && sigs.find((s) => s.parent1_id) && sigs.find((s) => s.parent2_id)) {
            await supabase
                .from('messages_besoin_transport')
                .update({ statut: 'signe' })
                .eq('id', id);
            await supabase
                .from('propositions_transport')
                .update({ statut: 'signe' })
                .eq('id', prop.id);
            Alert.alert('Transport validé et signé par les deux parties !');
            setSignatureModal({ open: false, prop: null });
        } else {
            Alert.alert('Signature enregistrée, en attente de la 2ème partie.');
        }
        fetchAll();
    }

    // Accepter proposition (pour demandeur = joueur)
    async function accepterProposition(prop) {
        await supabase
            .from('propositions_transport')
            .update({ accepte: false })
            .eq('demande_id', id);

        await supabase.from('propositions_transport').update({ accepte: true }).eq('id', prop.id);

        setSignatureModal({ open: true, prop });
        fetchAll();
    }

    return (
        <ScrollView style={styles.container}>
            {loading && <ActivityIndicator color={GREEN} style={{ marginTop: 30 }} />}
            {!loading && !demande && (
                <Text style={{ color: 'red', textAlign: 'center', marginTop: 40 }}>
                    Demande introuvable ou inaccessible !{'\n'}(ID: {id})
                </Text>
            )}
            {!loading && demande && (
                <View style={styles.card}>
                    <Text style={styles.title}>
                        <Ionicons name="football" color={YELLOW} size={18} />{' '}
                        {evenement?.titre || 'Évènement'}
                    </Text>
                    <Text style={styles.info}>
                        <Ionicons name="calendar" color={GREEN} size={13} /> {evenement?.date}{' '}
                        {evenement?.heure && `- ${evenement.heure}`}
                    </Text>
                    <Text style={styles.info}>
                        <Ionicons name="person-circle" color={GREEN} size={15} /> {joueur?.prenom}{' '}
                        {joueur?.nom}
                    </Text>
                    {decharge && (
                        <Text style={styles.info}>
                            <Ionicons name="people-circle" color={YELLOW} size={13} /> Parent :{' '}
                            {decharge.parent_prenom} {decharge.parent_nom}
                            {decharge.accepte_transport
                                ? ' (décharge acceptée)'
                                : ' (décharge non signée)'}
                        </Text>
                    )}
                    <Text style={styles.info}>
                        <Ionicons name="location" color={YELLOW} size={13} /> Adresse demandée :{' '}
                        {demande.adresse_demande}
                    </Text>
                    <Text style={styles.info}>
                        <Ionicons name="time" color={YELLOW} size={13} /> Heure demandée :{' '}
                        {demande.heure_demande}
                    </Text>
                    <Text style={styles.statut}>
                        <Ionicons name="alert-circle" color={YELLOW} size={15} /> Statut :{' '}
                        <Text style={{ color: YELLOW }}>{demande.etat || demande.statut}</Text>
                    </Text>
                </View>
            )}

            {!loading && demande && autorise && (
                <>
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => {
                            setEditPropId(null);
                            proposerOuModifierTransport(true);
                        }}
                    >
                        <Ionicons name="checkmark-circle" size={15} color="#111" />
                        <Text style={styles.actionText}>Je le prends (lieu/heure demandés)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#666' }]}
                        onPress={() => {
                            setEditPropId(null);
                            setShowPropModal(true);
                        }}
                    >
                        <Ionicons name="car-sport" size={15} color="#111" />
                        <Text style={styles.actionText}>Proposer un autre lieu/heure</Text>
                    </TouchableOpacity>
                </>
            )}

            {!loading && demande && !autorise && (
                <Text style={{ color: '#ffe44d', margin: 18, fontStyle: 'italic' }}>
                    <Ionicons name="lock-closed" size={16} color="#ffe44d" /> Vous n'êtes pas
                    autorisé à proposer ou valider un transport pour cette demande.
                </Text>
            )}

            {!loading && demande && (
                <>
                    <Text style={styles.subtitle}>
                        <Ionicons name="git-branch" size={16} color={GREEN} /> Propositions reçues :
                    </Text>
                    {propositions.length === 0 && (
                        <Text style={{ color: '#aaa', marginBottom: 8 }}>
                            Aucune proposition reçue pour le moment.
                        </Text>
                    )}
                    {propositions.map((prop) => {
                        const estAuteur = prop.parent_proposeur_id === userId;
                        const signatureOk = signatureStatus.demandeur && signatureStatus.conducteur;
                        return (
                            <View key={prop.id} style={styles.propositionCard}>
                                <Text style={{ color: GREEN }}>
                                    <Ionicons name="car-sport" size={13} color={GREEN} /> Par{' '}
                                    {prop.parent_proposeur?.prenom} {prop.parent_proposeur?.nom}
                                </Text>
                                <Text style={{ color: '#fff' }}>
                                    <Ionicons name="location" size={11} color={YELLOW} /> Lieu :{' '}
                                    {prop.lieu_rdv}
                                </Text>
                                <Text style={{ color: '#fff' }}>
                                    <Ionicons name="time" size={11} color={YELLOW} /> Heure :{' '}
                                    {prop.heure_rdv}
                                </Text>

                                {/* Boutons édition auteur */}
                                {estAuteur && !signatureOk && (
                                    <View
                                        style={{ flexDirection: 'row', gap: 10, marginVertical: 7 }}
                                    >
                                        <TouchableOpacity
                                            style={[styles.acceptBtn, { backgroundColor: '#444' }]}
                                            onPress={() => {
                                                setLieu(prop.lieu_rdv);
                                                setHeure(prop.heure_rdv);
                                                setEditPropId(prop.id);
                                                setShowPropModal(true);
                                            }}
                                        >
                                            <Text style={{ color: '#fff' }}>Modifier</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.acceptBtn, { backgroundColor: '#d00' }]}
                                            onPress={() => supprimerProposition(prop.id)}
                                        >
                                            <Text style={{ color: '#fff' }}>Supprimer</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}

                                {/* Validation demandeur (joueur) */}
                                {demande.joueur_id === userId && !prop.accepte && (
                                    <TouchableOpacity
                                        style={styles.acceptBtn}
                                        onPress={() => accepterProposition(prop)}
                                    >
                                        <Text style={styles.acceptText}>
                                            Valider ce transporteur
                                        </Text>
                                    </TouchableOpacity>
                                )}

                                {/* Signatures */}
                                {prop.accepte && (
                                    <>
                                        {!signatureStatus.demandeur && (
                                            <TouchableOpacity
                                                style={styles.acceptBtn}
                                                onPress={() => signer(prop, 'demandeur')}
                                            >
                                                <Text style={styles.acceptText}>
                                                    Je suis le parent du joueur, je signe
                                                </Text>
                                            </TouchableOpacity>
                                        )}
                                        {!signatureStatus.conducteur && (
                                            <TouchableOpacity
                                                style={styles.acceptBtn}
                                                onPress={() => signer(prop, 'conducteur')}
                                            >
                                                <Text style={styles.acceptText}>
                                                    Je suis le conducteur, je signe
                                                </Text>
                                            </TouchableOpacity>
                                        )}
                                        <Text style={{ color: '#0f0', marginTop: 7 }}>
                                            {signatureStatus.demandeur &&
                                                '✔️ Parent joueur signé  '}
                                            {signatureStatus.conducteur && '✔️ Conducteur signé  '}
                                            {signatureStatus.demandeur &&
                                                signatureStatus.conducteur &&
                                                ' | Validé ✅'}
                                        </Text>
                                    </>
                                )}
                            </View>
                        );
                    })}
                </>
            )}

            {/* MODAL PROPOSER / MODIFIER */}
            <Modal visible={showPropModal} animationType="slide" transparent>
                <View style={styles.modalBg}>
                    <View style={styles.modalBox}>
                        <Text style={styles.modalTitle}>
                            {editPropId
                                ? 'Modifier la proposition'
                                : 'Proposer un autre lieu/heure'}
                        </Text>
                        <TextInput
                            placeholder="Lieu de RDV"
                            placeholderTextColor="#aaa"
                            style={styles.input}
                            value={lieu}
                            onChangeText={setLieu}
                        />
                        <TextInput
                            placeholder="Heure de RDV"
                            placeholderTextColor="#aaa"
                            style={styles.input}
                            value={heure}
                            onChangeText={setHeure}
                        />
                        <TouchableOpacity
                            style={styles.modalBtn}
                            onPress={() => proposerOuModifierTransport(false)}
                        >
                            <Text style={styles.modalBtnText}>
                                {editPropId ? 'Modifier' : 'Envoyer'}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modalBtn, { backgroundColor: '#444' }]}
                            onPress={() => {
                                setShowPropModal(false);
                                setEditPropId(null);
                                setLieu('');
                                setHeure('');
                            }}
                        >
                            <Text style={styles.modalBtnText}>Annuler</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* MODAL SIGNATURE */}
            <Modal visible={signatureModal.open} animationType="slide" transparent>
                <View style={styles.modalBg}>
                    <View style={styles.modalBox}>
                        <Text style={styles.modalTitle}>Décharge de transport</Text>
                        <Text style={{ color: '#fff', marginBottom: 10 }}>
                            Les deux parties doivent signer pour valider ce transport.{'\n'}
                            <Text style={{ color: '#aaa', fontStyle: 'italic' }}>
                                “Je m’engage à transporter le joueur selon les modalités convenues,
                                sous ma responsabilité.”
                            </Text>
                        </Text>
                        {!signatureStatus.demandeur && (
                            <TouchableOpacity
                                style={styles.modalBtn}
                                onPress={() => signer(signatureModal.prop, 'demandeur')}
                            >
                                <Text style={styles.modalBtnText}>
                                    Je suis le parent DEMANDEUR, je signe
                                </Text>
                            </TouchableOpacity>
                        )}
                        {!signatureStatus.conducteur && (
                            <TouchableOpacity
                                style={styles.modalBtn}
                                onPress={() => signer(signatureModal.prop, 'conducteur')}
                            >
                                <Text style={styles.modalBtnText}>
                                    Je suis le parent CONDUCTEUR, je signe
                                </Text>
                            </TouchableOpacity>
                        )}
                        {signatureStatus.demandeur && signatureStatus.conducteur && (
                            <Text
                                style={{ color: '#00ff88', marginVertical: 10, fontWeight: 'bold' }}
                            >
                                ✔️ Double signature enregistrée, transport validé.
                            </Text>
                        )}
                        <TouchableOpacity
                            style={[styles.modalBtn, { backgroundColor: '#444' }]}
                            onPress={() => setSignatureModal({ open: false, prop: null })}
                        >
                            <Text style={styles.modalBtnText}>Fermer</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#181f22' },
    card: { backgroundColor: '#232b2d', borderRadius: 10, margin: 18, padding: 18 },
    title: { fontSize: 20, color: GREEN, fontWeight: 'bold', marginBottom: 4 },
    info: { color: '#fff', marginBottom: 3 },
    statut: { color: '#ffe44d', fontWeight: 'bold', marginTop: 8, marginBottom: 4 },
    actionBtn: {
        backgroundColor: GREEN,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 9,
        padding: 13,
        marginTop: 8,
        justifyContent: 'center',
    },
    actionText: { color: '#111', fontWeight: 'bold', marginLeft: 8 },
    acceptBtn: {
        backgroundColor: GREEN,
        borderRadius: 9,
        marginTop: 8,
        padding: 10,
        alignItems: 'center',
    },
    acceptText: { color: '#181f22', fontWeight: 'bold' },
    subtitle: { color: GREEN, fontSize: 15, fontWeight: 'bold', marginTop: 14 },
    propositionCard: { backgroundColor: '#222', borderRadius: 10, marginBottom: 12, padding: 13 },
    modalBg: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.7)' },
    modalBox: { backgroundColor: '#232b2d', borderRadius: 12, padding: 22, margin: 25 },
    modalTitle: { color: GREEN, fontSize: 17, fontWeight: 'bold', textAlign: 'center' },
    input: {
        backgroundColor: '#292929',
        color: '#fff',
        borderRadius: 8,
        padding: 10,
        marginVertical: 8,
        borderColor: GREEN,
        borderWidth: 1,
    },
    modalBtn: {
        backgroundColor: GREEN,
        borderRadius: 7,
        marginTop: 8,
        padding: 12,
        alignItems: 'center',
    },
    modalBtnText: { color: '#111', fontWeight: 'bold' },
});
