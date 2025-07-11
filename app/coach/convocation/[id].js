import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Modal, TextInput, Platform
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';

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

  // ✅ CORRIGÉ : Un seul useEffect avec la fonction async à l'intérieur
  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      try {
        // 1. Récup événement (équipe etc)
        const { data: evt } = await supabase
          .from('evenements')
          .select('*')
          .eq('id', id)
          .single();
        if (!evt) { setLoading(false); return; }
        setEvent(evt);

        // 2. Récup tous les joueurs de l'équipe (clé: id)
        const { data: joueurs, error: joueursError } = await supabase
          .from('joueurs')
          .select('id, nom, prenom, poste, equipe_id')
          .eq('equipe_id', evt.equipe_id);
        if (joueursError) console.log("Erreur joueurs:", joueursError);

        // 3. Récup participations à cet événement
        const { data: participations, error: participationsError } = await supabase
          .from('participations_evenement')
          .select('*')
          .eq('evenement_id', id);
        if (participationsError) console.log("Erreur participations:", participationsError);

        // 4. Récup utilisateurs correspondant à ces joueurs (jointure sur joueur_id)
        const joueursIds = (joueurs || []).map(j => j.id);
        let utilisateursMap = {};
        if (joueursIds.length) {
          const { data: utilisateurs, error: utilisateursError } = await supabase
            .from('utilisateurs')
            .select('joueur_id, numero_licence, tel, nom, prenom')
            .in('joueur_id', joueursIds);
          if (utilisateursError) console.log("Erreur utilisateurs:", utilisateursError);

          (utilisateurs || []).forEach(u => { utilisateursMap[u.joueur_id] = u; });
        }

        // 5. Construction des listes pour l'affichage
        const presentsArr = [];
        const absentsArr = [];
        const sansReponseArr = [];

        for (const joueur of (joueurs || [])) {
          const userData = utilisateursMap[joueur.id] || {};
          const joueurComplet = { ...joueur, utilisateur: userData };

          const part = (participations || []).find(p => String(p.joueur_id) === String(joueur.id));

          if (!part) {
            sansReponseArr.push(joueurComplet);
          } else {
            switch (part.reponse) {
              case 'present':
                presentsArr.push({ ...joueurComplet, ...part });
                break;
              case 'absent':
                absentsArr.push({ ...joueurComplet, ...part });
                break;
              case null:
              case undefined:
              default:
                sansReponseArr.push({ ...joueurComplet, ...part });
            }
          }
        }

        // Stats transport
        const nbBesoinTransport = presentsArr.filter(j => j.besoin_transport).length;
        const nbPrisEnCharge = presentsArr.filter(j => j.besoin_transport && j.conducteur_id).length;

        setPresents(presentsArr);
        setAbsents(absentsArr);
        setSansReponse(sansReponseArr);
        setStats({ nbBesoinTransport, nbPrisEnCharge });
        
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      } finally {
        setLoading(false);
      }
    }

    // ✅ CORRIGÉ : Appel de la fonction ici, à l'intérieur du même useEffect
    fetchData();
  }, [id, showModal]); // ✅ CORRIGÉ : Dépendances correctes

  // Modal Transport
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
          <View style={styles.statItem}>
            <Text style={styles.statsPresent}>✅ Présents : {presents.length}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statsAbsent}>❌ Absents : {absents.length}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statsSansReponse}>❔ Sans réponse : {sansReponse.length}</Text>
          </View>
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

// Section d'affichage de chaque liste
function Section({ title, data, showTransport = false, onTransport, router }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {(!data || data.length === 0) ? (
        <Text style={styles.empty}>Aucun joueur</Text>
      ) : (
        data.map((j) => (
          <View key={j.id} style={styles.card}>
            <Text style={styles.cardName}>
              {j.utilisateur?.prenom || j.prenom || ''} {j.utilisateur?.nom || j.nom || ''}
            </Text>
            <Text style={styles.cardPoste}>Poste : {j.poste || 'NC'}</Text>
            <Text style={{ color: '#fff', fontSize: 12 }}>
              Email : {j.utilisateur?.email || '-'}
            </Text>
            <Text style={{ color: '#fff', fontSize: 12 }}>
              Tél : {j.utilisateur?.tel || '-'}
            </Text>
            {showTransport && j.besoin_transport && !j.conducteur_id && (
              <View style={styles.transportInfo}>
                <Text style={styles.transportInfoText}>
                  🚗 Besoin de transport
                </Text>
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
                  ✅ Pris en charge{j.lieu_rdv ? ` — ${j.lieu_rdv} à ${j.heure_rdv}` : ''}
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
    // Responsive sur web
    ...(Platform.OS === 'web' && {
      maxWidth: 800,
      alignSelf: 'center',
      width: '100%',
    }),
  },
  title: { fontSize: 22, fontWeight: 'bold', color: '#00ff88', textAlign: 'center', marginBottom: 10 },
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
    // Responsive width sur web
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
    borderLeftColor: '#ff8c00'
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
    textAlign: 'center'
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