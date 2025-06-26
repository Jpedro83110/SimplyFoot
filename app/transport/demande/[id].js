import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '../../../lib/supabase';

const GREEN = '#00ff88';

export default function TransportDetail() {
  const { id } = useLocalSearchParams(); // id de la demande
  const [loading, setLoading] = useState(true);
  const [demande, setDemande] = useState(null);
  const [propositions, setPropositions] = useState([]);
  const [userId, setUserId] = useState(null);
  const [showPropModal, setShowPropModal] = useState(false);
  const [lieu, setLieu] = useState('');
  const [heure, setHeure] = useState('');
  const [signatureModal, setSignatureModal] = useState({ open: false, prop: null });
  const [signatureStatus, setSignatureStatus] = useState({ demandeur: false, conducteur: false });

  useEffect(() => { fetchAll(); }, [id]);

  async function fetchAll() {
    setLoading(true);

    // Récupère l’utilisateur connecté
    const { data: session } = await supabase.auth.getSession();
    setUserId(session?.session?.user?.id);

    // Récupère la demande
    const { data: dmd } = await supabase
      .from('messages_besoin_transport')
      .select('*, joueur:joueur_id(prenom, nom), evenement:evenement_id(titre, date, heure)')
      .eq('id', id)
      .single();
    setDemande(dmd);

    // Récupère toutes les propositions associées
    const { data: props } = await supabase
      .from('propositions_transport')
      .select('*, parent_proposeur:parent_proposeur_id(prenom, nom)')
      .eq('demande_id', id);
    setPropositions(props || []);

    // Récupère les signatures si une proposition est acceptée
    const propAcceptee = (props || []).find(p => p.accepte);
    if (propAcceptee) {
      const { data: sigs } = await supabase
        .from('signatures_transport')
        .select('*')
        .eq('proposition_id', propAcceptee.id);

      // Si tu veux afficher qui a signé
      setSignatureStatus({
        demandeur: !!(sigs && sigs.find(s => s.parent1_id === dmd.joueur_id)),
        conducteur: !!(sigs && sigs.find(s => s.parent2_id === propAcceptee.parent_proposeur_id)),
      });
    } else {
      setSignatureStatus({ demandeur: false, conducteur: false });
    }
    setLoading(false);
  }

  async function proposerTransport(autopick = false) {
    if (!userId) return;
    let finalLieu = lieu, finalHeure = heure;
    if (autopick && demande) {
      finalLieu = demande.adresse_demande;
      finalHeure = demande.heure_demande;
    }
    if (!finalLieu || !finalHeure) {
      Alert.alert("Remplis bien tous les champs.");
      return;
    }
    await supabase.from('propositions_transport').insert({
      demande_id: id,
      parent_proposeur_id: userId,
      lieu_rdv: finalLieu,
      heure_rdv: finalHeure,
      date_proposition: new Date(),
      accepte: false
    });
    setShowPropModal(false);
    setLieu(''); setHeure('');
    fetchAll();
    Alert.alert("Proposition envoyée !");
  }

  async function accepterProposition(prop) {
    // 1. Passe prop.accepte à true et met toutes les autres à false (single acceptée)
    await supabase
      .from('propositions_transport')
      .update({ accepte: false })
      .eq('demande_id', id);

    await supabase
      .from('propositions_transport')
      .update({ accepte: true })
      .eq('id', prop.id);

    setSignatureModal({ open: true, prop });
    fetchAll();
  }

  // === Signature modale ===
  async function signer(prop, role) {
    // parent1_id = demandeur, parent2_id = proposeur
    let data = { proposition_id: prop.id, date_signature: new Date(), status: 'signed' };
    if (role === 'demandeur') data.parent1_id = userId;
    if (role === 'conducteur') data.parent2_id = userId;

    // Vérifie si la personne a déjà signé
    const { data: exists } = await supabase
      .from('signatures_transport')
      .select('*')
      .eq('proposition_id', prop.id)
      .eq(role === 'demandeur' ? 'parent1_id' : 'parent2_id', userId);

    if (exists && exists.length > 0) {
      Alert.alert('Déjà signé.');
      return;
    }

    await supabase.from('signatures_transport').upsert(data, { onConflict: ['proposition_id', 'parent1_id', 'parent2_id'] });

    // On vérifie si les 2 signatures sont là
    const { data: sigs } = await supabase
      .from('signatures_transport')
      .select('*')
      .eq('proposition_id', prop.id);

    // Si les deux parties ont signé :
    if (sigs && sigs.find(s => s.parent1_id) && sigs.find(s => s.parent2_id)) {
      // On valide la proposition + la demande (archive)
      await supabase.from('messages_besoin_transport').update({ statut: 'signe' }).eq('id', id);
      await supabase.from('propositions_transport').update({ statut: 'signe' }).eq('id', prop.id);
      Alert.alert('Transport validé et signé par les deux parties !');
      setSignatureModal({ open: false, prop: null });
    } else {
      Alert.alert('Signature enregistrée, en attente de la 2ème partie.');
    }
    fetchAll();
  }

  return (
    <ScrollView style={styles.container}>
      {loading && <Text style={{ color: GREEN, marginTop: 40 }}>Chargement…</Text>}
      {demande && (
        <View style={styles.card}>
          <Text style={styles.title}>{demande.evenement.titre}</Text>
          <Text style={styles.info}>👤 {demande.joueur.prenom} {demande.joueur.nom}</Text>
          <Text style={styles.info}>📅 {demande.evenement.date} {demande.evenement.heure && `à ${demande.evenement.heure}`}</Text>
          <Text style={styles.info}>Adresse demandée : {demande.adresse_demande}</Text>
          <Text style={styles.info}>Heure demandée : {demande.heure_demande}</Text>
        </View>
      )}

      {/* --- Pour parent/joueur/coach --- */}
      {(demande && userId !== demande.joueur_id) && (
        <>
          <TouchableOpacity style={styles.actionBtn} onPress={() => proposerTransport(true)}>
            <Text style={styles.actionText}>Je le prends (lieu/heure demandés)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#666' }]} onPress={() => setShowPropModal(true)}>
            <Text style={styles.actionText}>Proposer un autre lieu/heure</Text>
          </TouchableOpacity>
        </>
      )}

      {/* --- Propositions reçues (côté demandeur) --- */}
      <Text style={styles.subtitle}>Propositions reçues :</Text>
      {propositions.map(prop => (
        <View key={prop.id} style={styles.propositionCard}>
          <Text style={{ color: GREEN }}>Par {prop.parent_proposeur?.prenom} {prop.parent_proposeur?.nom}</Text>
          <Text style={{ color: '#fff' }}>Lieu : {prop.lieu_rdv}</Text>
          <Text style={{ color: '#fff' }}>Heure : {prop.heure_rdv}</Text>
          {demande?.joueur_id === userId && !prop.accepte && (
            <TouchableOpacity style={styles.acceptBtn} onPress={() => accepterProposition(prop)}>
              <Text style={styles.acceptText}>Accepter et lancer la signature</Text>
            </TouchableOpacity>
          )}
          {prop.accepte && (
            <Text style={{ color: '#0f0', marginTop: 7 }}>
              Proposition acceptée (en attente signatures)
              {signatureStatus.demandeur && " | Demandeur signé"}
              {signatureStatus.conducteur && " | Conducteur signé"}
              {signatureStatus.demandeur && signatureStatus.conducteur && " | Validé ✅"}
            </Text>
          )}
        </View>
      ))}

      {/* --- Modal proposer lieu/heure --- */}
      <Modal visible={showPropModal} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Proposer un autre lieu/heure</Text>
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
            <TouchableOpacity style={styles.modalBtn} onPress={() => proposerTransport(false)}>
              <Text style={styles.modalBtnText}>Envoyer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#444' }]} onPress={() => setShowPropModal(false)}>
              <Text style={styles.modalBtnText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* --- Modal signature légale --- */}
      <Modal visible={signatureModal.open} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Décharge de transport</Text>
            <Text style={{ color: '#fff', marginBottom: 10 }}>
              Les deux parties doivent signer pour valider ce transport.{"\n"}
              <Text style={{ color: '#aaa', fontStyle: 'italic' }}>
                “Je m’engage à transporter le joueur selon les modalités convenues, sous ma responsabilité.”
              </Text>
            </Text>
            {!signatureStatus.demandeur && (
              <TouchableOpacity style={styles.modalBtn} onPress={() => signer(signatureModal.prop, 'demandeur')}>
                <Text style={styles.modalBtnText}>Je suis le parent DEMANDEUR, je signe</Text>
              </TouchableOpacity>
            )}
            {!signatureStatus.conducteur && (
              <TouchableOpacity style={styles.modalBtn} onPress={() => signer(signatureModal.prop, 'conducteur')}>
                <Text style={styles.modalBtnText}>Je suis le parent CONDUCTEUR, je signe</Text>
              </TouchableOpacity>
            )}
            {(signatureStatus.demandeur && signatureStatus.conducteur) && (
              <Text style={{ color: '#00ff88', marginVertical: 10, fontWeight: 'bold' }}>✔️ Double signature enregistrée, transport validé.</Text>
            )}
            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#444' }]} onPress={() => setSignatureModal({ open: false, prop: null })}>
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
  actionBtn: { backgroundColor: GREEN, padding: 14, margin: 8, borderRadius: 9, alignItems: 'center' },
  actionText: { color: '#111', fontWeight: 'bold' },
  acceptBtn: { backgroundColor: '#00ff88', borderRadius: 8, marginTop: 8, padding: 10, alignItems: 'center' },
  acceptText: { color: '#181f22', fontWeight: 'bold' },
  subtitle: { color: '#fff', fontSize: 16, margin: 14 },
  propositionCard: { backgroundColor: '#222', padding: 13, borderRadius: 10, marginBottom: 12 },
  modalBg: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.7)' },
  modalBox: { backgroundColor: '#232b2d', borderRadius: 12, padding: 22, margin: 25 },
  modalTitle: { color: GREEN, fontSize: 18, marginBottom: 14, fontWeight: 'bold', textAlign: 'center' },
  input: { backgroundColor: '#292929', color: '#fff', borderRadius: 8, padding: 10, marginVertical: 8, borderColor: GREEN, borderWidth: 1 },
  modalBtn: { backgroundColor: GREEN, borderRadius: 7, marginTop: 8, padding: 12, alignItems: 'center' },
  modalBtnText: { color: '#111', fontWeight: 'bold' }
});
