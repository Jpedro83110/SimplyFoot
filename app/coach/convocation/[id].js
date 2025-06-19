import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '../../../lib/supabase';

export default function ConvocationDetail() {
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState(null);
  const [present, setPresent] = useState([]);
  const [absent, setAbsent] = useState([]);
  const [sansReponse, setSansReponse] = useState([]);
  // Modal transport
  const [showModal, setShowModal] = useState(false);
  const [modalJoueurId, setModalJoueurId] = useState(null);
  const [lieuRdv, setLieuRdv] = useState('');
  const [heureRdv, setHeureRdv] = useState('');
  // Stats
  const [stats, setStats] = useState({
    nbBesoinTransport: 0,
    nbTransportPris: 0,
  });

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      // 1. Récupérer l’événement
      const { data: evt, error: errEvt } = await supabase
        .from('evenements')
        .select('*')
        .eq('id', id)
        .single();
      if (errEvt || !evt) {
        Alert.alert('Erreur', errEvt?.message || "Événement introuvable");
        setLoading(false);
        return;
      }

      // 2. Récupérer les joueurs de l'équipe concernée
      const { data: joueursEquipe, error: errJoueurs } = await supabase
        .from('joueurs')
        .select('id, utilisateur_id, poste')
        .eq('equipe_id', evt.equipe_id);

      // 3. Récupérer les infos utilisateurs pour ces joueurs
      const utilisateurIds = joueursEquipe?.map(j => j.utilisateur_id) || [];
      let utilisateursInfos = [];
      if (utilisateurIds.length > 0) {
        const { data: usersInfos } = await supabase
          .from('utilisateurs')
          .select('id, nom, prenom')
          .in('id', utilisateurIds);
        utilisateursInfos = usersInfos || [];
      }

      // 4. Récupérer toutes les participations à cet événement
      const { data: participations } = await supabase
        .from('participations_evenement')
        .select('*')
        .eq('evenement_id', id);

      // 5. Préparer la liste de joueurs par réponse
      const joueursParReponse = {
        present: [],
        absent: [],
        sansReponse: [],
      };

      for (const joueur of (joueursEquipe || [])) {
        const user = utilisateursInfos.find(u => u.id === joueur.utilisateur_id);
        const p = (participations || []).find(item => item.joueur_id === joueur.id);

        const base = {
          id: joueur.id,
          nom: user ? `${user.prenom} ${user.nom}` : '???',
          poste: joueur.poste,
        };

        if (!p) {
          joueursParReponse.sansReponse.push(base);
        } else if (p.reponse === 'present') {
          joueursParReponse.present.push({ ...base, ...p });
        } else if (p.reponse === 'absent') {
          joueursParReponse.absent.push({ ...base, ...p });
        }
      }

      // Stats transport
      const nbBesoinTransport = joueursParReponse.present.filter(j => j.besoin_transport === true).length;
      const nbTransportPris = joueursParReponse.present.filter(j => j.besoin_transport === true && j.conducteur_id).length;

      setEvent(evt);
      setPresent(joueursParReponse.present);
      setAbsent(joueursParReponse.absent);
      setSansReponse(joueursParReponse.sansReponse);
      setStats({
        nbBesoinTransport,
        nbTransportPris,
      });
      setLoading(false);
    }

    fetchData();
  }, [id, showModal]);

  // Ouvre la modale transport
  const openModal = (joueurId) => {
    setModalJoueurId(joueurId);
    setLieuRdv('');
    setHeureRdv('');
    setShowModal(true);
  };

  // Valide le transport (modale)
  const validerTransport = async () => {
    if (!lieuRdv || !heureRdv) {
      Alert.alert('Erreur', 'Merci de renseigner le lieu et l\'heure de RDV');
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
      .eq('joueur_id', modalJoueurId)
      .eq('evenement_id', id);

    if (error) Alert.alert('Erreur', error.message);
    else {
      Alert.alert('✅ Transport pris en charge');
      setShowModal(false);
    }
  };

  if (loading) return <ActivityIndicator color="#00ff88" style={{ marginTop: 40 }} />;

  return (
    <View style={{ flex: 1, backgroundColor: '#121212' }}>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>📋 Convocation {event?.titre ? `(${event.titre})` : ''}</Text>
        {event && (
          <>
            <Text style={styles.info}>
              📅 {event.date} {event.heure ? 'à ' + event.heure : ''} - 📍 {event.lieu}
            </Text>
            {event.lieu_complement && (
              <Text style={{ color: '#8fd6ff', fontStyle: 'italic', textAlign: 'center' }}>
                🏟️ {event.lieu_complement}
              </Text>
            )}
            {event.meteo && (
              <Text style={{ color: '#00ff88', fontWeight: '700', textAlign: 'center' }}>
                🌦️ {event.meteo}
              </Text>
            )}
            {event.latitude && event.longitude && (
              <Text style={{ color: '#00ff88', fontWeight: '400', fontSize: 14, textAlign: 'center' }}>
                GPS: {event.latitude}, {event.longitude}
              </Text>
            )}
          </>
        )}

        {/* ---- RECAP STATS ---- */}
        <View style={styles.statsRecap}>
          <Text style={styles.statsPresent}>✅ Présents : {present.length}</Text>
          <Text style={styles.statsAbsent}>❌ Absents : {absent.length}</Text>
          <Text style={styles.statsSansReponse}>❔ Sans réponse : {sansReponse.length}</Text>
        </View>
        <View style={styles.statsTransport}>
          <Text style={styles.statsTransportText}>
            🚗 Besoins transport : {stats.nbBesoinTransport} | Pris en charge : {stats.nbTransportPris}
          </Text>
        </View>
        {/* ---- FIN RECAP ---- */}

        <Section
          title="✅ Présents"
          data={present}
          showTransport
          onTransport={openModal}
        />
        <Section title="❌ Absents" data={absent} />
        <Section title="❔ Sans réponse" data={sansReponse} />
      </ScrollView>

      {/* MODALE TRANSPORT */}
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
            <Text style={styles.cardName}>{j.nom}</Text>
            <Text style={styles.cardPoste}>Poste : {j.poste}</Text>
            {showTransport && j.besoin_transport && !j.conducteur_id && (
              <TouchableOpacity style={styles.transportBtn} onPress={() => onTransport(j.id)}>
                <Text style={styles.transportText}>🚗 Proposer un transport</Text>
              </TouchableOpacity>
            )}
            {showTransport && j.besoin_transport && j.conducteur_id && (
              <Text style={styles.transportInfo}>
                ✅ Pris en charge - {j.lieu_rdv} à {j.heure_rdv}
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
  title: { fontSize: 24, fontWeight: 'bold', color: '#00ff88', marginBottom: 10, textAlign: 'center' },
  info: { color: '#aaa', fontSize: 16, textAlign: 'center', marginBottom: 5 },
  section: { marginBottom: 30 },
  sectionTitle: { color: '#00ff88', fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  card: {
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    padding: 16,
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
  statsTransport: {
    alignItems: 'center',
    marginBottom: 14,
  },
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
