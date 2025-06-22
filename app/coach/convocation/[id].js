import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Modal, TextInput, Platform
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '../../../lib/supabase';

export default function ConvocationDetail() {
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState(null);
  const [presents, setPresents] = useState([]);
  const [absents, setAbsents] = useState([]);
  const [sansReponse, setSansReponse] = useState([]);
  const [stats, setStats] = useState({ nbBesoinTransport: 0, nbPrisEnCharge: 0 });

  // Modal transport (pour prise en charge)
  const [showModal, setShowModal] = useState(false);
  const [modalJoueur, setModalJoueur] = useState(null);
  const [lieuRdv, setLieuRdv] = useState('');
  const [heureRdv, setHeureRdv] = useState('');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      // 1. Récup événement (équipe etc)
      const { data: evt } = await supabase
        .from('evenements')
        .select('*')
        .eq('id', id)
        .single();
      if (!evt) return setLoading(false);
      setEvent(evt);

      // 2. Récup tous les joueurs de l'équipe
      const { data: joueursEquipe } = await supabase
        .from('joueurs')
        .select('id, utilisateur_id, nom, prenom, poste')
        .eq('equipe_id', evt.equipe_id);

      // 3. Participations à cet événement
      const { data: participations } = await supabase
        .from('participations_evenement')
        .select('*')
        .eq('evenement_id', id);

      // 4. Classement
      const presents = [];
      const absents = [];
      const sansReponse = [];

      for (const joueur of joueursEquipe || []) {
        const part = (participations || []).find(p => String(p.joueur_id) === String(joueur.id));
        if (!part) {
          sansReponse.push(joueur);
        } else if (part.reponse === 'present') {
          presents.push({ ...joueur, ...part });
        } else if (part.reponse === 'absent') {
          absents.push({ ...joueur, ...part });
        }
      }

      // Stats transport (combien besoin/pris en charge)
      const nbBesoinTransport = presents.filter(j => j.besoin_transport).length;
      const nbPrisEnCharge = presents.filter(j => j.besoin_transport && j.conducteur_id).length;

      setPresents(presents);
      setAbsents(absents);
      setSansReponse(sansReponse);
      setStats({ nbBesoinTransport, nbPrisEnCharge });
      setLoading(false);
    }

    fetchData();
  }, [id, showModal]);

  // Modal Transport (prise en charge d'un joueur)
  const openModal = (joueur) => {
    setModalJoueur(joueur);
    setLieuRdv('');
    setHeureRdv('');
    setShowModal(true);
  };

  const validerTransport = async () => {
    if (!lieuRdv || !heureRdv) {
      alert('Merci de renseigner le lieu et l\'heure de RDV');
      return;
    }
    const session = await supabase.auth.getSession();
    const coachId = session.data.session.user.id;
    const { error } = await supabase
      .from('participations_evenement')
      .update({
        conducteur_id: coachId,
        lieu_rdv: lieuRdv,
        heure_rdv: heureRdv,
      })
      .eq('joueur_id', modalJoueur.id)
      .eq('evenement_id', id);
    if (error) alert(error.message);
    setShowModal(false);
  };

  if (loading)
    return <ActivityIndicator color="#00ff88" style={{ marginTop: 40 }} />;

  return (
    <View style={{ flex: 1, backgroundColor: '#121212' }}>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Convocation : {event?.titre || ''}</Text>
        {event && (
          <Text style={styles.info}>
            📅 {event.date} {event.heure ? 'à ' + event.heure : ''} - 📍 {event.lieu}
          </Text>
        )}

        <View style={styles.statsRecap}>
          <Text style={styles.statsPresent}>✅ Présents : {presents.length}</Text>
          <Text style={styles.statsAbsent}>❌ Absents : {absents.length}</Text>
          <Text style={styles.statsSansReponse}>❔ Sans réponse : {sansReponse.length}</Text>
        </View>
        <View style={styles.statsTransport}>
          <Text style={styles.statsTransportText}>
            🚗 Besoin transport : {stats.nbBesoinTransport} | Pris en charge : {stats.nbPrisEnCharge}
          </Text>
        </View>

        {/* Présents */}
        <Section
          title="✅ Présents"
          data={presents}
          showTransport
          onTransport={openModal}
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
              keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default'}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
              <TouchableOpacity style={styles.modalBtn} onPress={validerTransport}>
                <Text style={styles.modalBtnText}>Valider</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#333' }]}
                onPress={() => setShowModal(false)}
              >
                <Text style={[styles.modalBtnText, { color: '#fff' }]}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Section({ title, data, showTransport = false, onTransport }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {(!data || data.length === 0) ? (
        <Text style={styles.empty}>Aucun joueur</Text>
      ) : (
        data.map((j) => (
          <View key={j.id} style={styles.card}>
            <Text style={styles.cardName}>{j.prenom ? `${j.prenom} ` : ''}{j.nom}</Text>
            <Text style={styles.cardPoste}>Poste : {j.poste || 'NC'}</Text>
            {showTransport && j.besoin_transport && !j.conducteur_id && (
              <TouchableOpacity style={styles.transportBtn} onPress={() => onTransport(j)}>
                <Text style={styles.transportText}>🚗 Proposer un transport</Text>
              </TouchableOpacity>
            )}
            {showTransport && j.besoin_transport && j.conducteur_id && (
              <Text style={styles.transportInfo}>
                ✅ Pris en charge{j.lieu_rdv ? ` — ${j.lieu_rdv} à ${j.heure_rdv}` : ''}
              </Text>
            )}
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#00ff88', textAlign: 'center', marginBottom: 10 },
  info: { color: '#aaa', fontSize: 16, textAlign: 'center', marginBottom: 5 },
  section: { marginBottom: 30 },
  sectionTitle: { color: '#00ff88', fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  card: {
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#00ff88',
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
  transportInfo: { color: '#0f0', marginTop: 6 },
  empty: { color: '#888', fontStyle: 'italic' },
  statsRecap: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 14,
    backgroundColor: '#191e1c',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#00ff88',
  },
  statsPresent: { color: '#00ff88', fontWeight: 'bold', fontSize: 15 },
  statsAbsent: { color: '#ff3e60', fontWeight: 'bold', fontSize: 15 },
  statsSansReponse: { color: '#ffe44d', fontWeight: 'bold', fontSize: 15 },
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
  modalTitle: { color: '#00ff88', fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
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
