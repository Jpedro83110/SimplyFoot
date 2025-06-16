import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Switch,
  Linking,
  Platform
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import { Ionicons } from '@expo/vector-icons';

dayjs.locale('fr');

export default function ConvocationReponse() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState(null);
  const [accepteTransport, setAccepteTransport] = useState(false);
  const [besoinTransport, setBesoinTransport] = useState(false);
  const [reponse, setReponse] = useState(null);
  const [reponseLoading, setReponseLoading] = useState(false);
  const [joueurId, setJoueurId] = useState(null);

  // Fetch event + joueurId + participation + décharge
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const session = await supabase.auth.getSession();
        const utilisateurId = session.data.session?.user?.id;
        if (!utilisateurId) throw new Error('Utilisateur non trouvé.');

        // Get joueurId depuis "utilisateurs"
        const { data: utilisateur, error: userErr } = await supabase
          .from('utilisateurs')
          .select('joueur_id')
          .eq('id', utilisateurId)
          .single();
        if (userErr || !utilisateur || !utilisateur.joueur_id) throw userErr || new Error('joueur_id manquant');
        setJoueurId(utilisateur.joueur_id);

        // Get event
        const { data: evt, error: evtErr } = await supabase
          .from('evenements')
          .select('titre, date, heure, lieu, lieu_complement, meteo, latitude, longitude')
          .eq('id', id)
          .single();
        if (evtErr || !evt) throw evtErr;
        setEvent(evt);

        // Décharge transport (optionnel)
        const { data: decharge } = await supabase
          .from('decharges_generales')
          .select('accepte_transport')
          .eq('joueur_id', utilisateur.joueur_id)
          .single();
        setAccepteTransport(decharge?.accepte_transport || false);

        // Participation (pour afficher réponse déjà envoyée)
        const { data: participation } = await supabase
          .from('participations_evenement')
          .select('reponse, besoin_transport')
          .eq('joueur_id', utilisateur.joueur_id)
          .eq('evenement_id', id)
          .single();
        setReponse(participation?.reponse ?? null);
        setBesoinTransport(participation?.besoin_transport ?? false);
      } catch (err) {
        Alert.alert('Erreur', 'Impossible de charger la convocation.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  // Quand on change le switch, update besoin_transport si présent
  useEffect(() => {
    if (reponse === 'present') {
      envoyerReponse('present', true);
    }
    // eslint-disable-next-line
  }, [besoinTransport]);

  // Fonction pour répondre à la convocation
  const envoyerReponse = async (valeur, triggeredBySwitch = false) => {
    try {
      setReponseLoading(true);
      if (!joueurId || !id || !valeur) {
        Alert.alert('Erreur', 'Données manquantes (joueur ou événement).');
        setReponseLoading(false);
        return;
      }

      const besoinTransportFinal = accepteTransport && besoinTransport && valeur === 'present';

      // Si c'est triggered par le switch, mais la réponse n'est pas présent, on ne fait rien
      if (triggeredBySwitch && reponse !== 'present') {
        setReponseLoading(false);
        return;
      }

      // Upsert dans participations_evenement
      const { error } = await supabase
        .from('participations_evenement')
        .upsert(
          [{
            joueur_id: joueurId,
            evenement_id: id,
            reponse: valeur,
            besoin_transport: besoinTransportFinal,
          }],
          { onConflict: ['joueur_id', 'evenement_id'] }
        );

      if (error) {
        Alert.alert('Erreur', error.message || 'Erreur lors de l’envoi.');
        setReponseLoading(false);
        return;
      }

      setReponse(valeur);
      setBesoinTransport(besoinTransportFinal);
      setReponseLoading(false);
      if (!triggeredBySwitch) Alert.alert('✅ Réponse enregistrée !');
    } catch (err) {
      setReponseLoading(false);
      Alert.alert('Erreur', 'Erreur critique dans l’envoi.');
    }
  };

  if (loading || !event) return <ActivityIndicator style={{ marginTop: 40 }} color="#00ff88" />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{event?.titre}</Text>
      <Text style={styles.info}>📅 {dayjs(event?.date).format('dddd D MMMM YYYY')} à {event?.heure}</Text>
      <Text style={styles.info}>📍 {event?.lieu}</Text>
      {event?.lieu_complement && (
        <Text style={[styles.info, { fontStyle: 'italic', color: '#8fd6ff' }]}>
          🏟️ {event.lieu_complement}
        </Text>
      )}

      {/* METEO */}
      {event?.meteo && (
        <Text style={[styles.info, { color: '#62d4ff', fontWeight: '700' }]}>
          <Ionicons name="cloud-outline" size={16} color="#62d4ff" /> {event.meteo}
        </Text>
      )}
      {/* GPS */}
      {(event?.latitude && event?.longitude) && (
        <TouchableOpacity
          style={{ marginTop: 8, alignSelf: 'center', backgroundColor: '#181f22', borderRadius: 8, paddingHorizontal: 13, paddingVertical: 6 }}
          onPress={() => {
            const url = `https://www.google.com/maps/search/?api=1&query=${event.latitude},${event.longitude}`;
            if (Platform.OS === 'web') window.open(url, '_blank');
            else Linking.openURL(url);
          }}
        >
          <Text style={{ color: '#00ff88', fontSize: 14 }}>
            <Ionicons name="navigate-outline" size={15} color="#00ff88" /> Voir sur Google Maps
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
          <Text style={[styles.buttonText, reponse === 'present' && { color: '#111' }]}>✅ Présent</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, reponse === 'absent' && styles.selected]}
          onPress={() => {
            setBesoinTransport(false);
            envoyerReponse('absent');
          }}
          disabled={reponseLoading}
        >
          <Text style={[styles.buttonText, reponse === 'absent' && { color: '#111' }]}>❌ Absent</Text>
        </TouchableOpacity>
      </View>

      {accepteTransport && reponse === 'present' && (
        <View style={styles.switchBlock}>
          <Text style={styles.label}>Je n'ai pas de moyen de transport</Text>
          <Switch
            value={besoinTransport}
            onValueChange={setBesoinTransport}
            thumbColor={besoinTransport ? '#00ff88' : '#666'}
            trackColor={{ false: '#333', true: '#00ff8860' }}
            disabled={reponse !== 'present'}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#121212', flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#00ff88', textAlign: 'center', marginBottom: 10 },
  info: { color: '#ccc', textAlign: 'center', marginBottom: 6 },
  section: { marginTop: 30, fontSize: 18, color: '#00ff88', fontWeight: 'bold', marginBottom: 10 },
  buttons: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 30 },
  button: { backgroundColor: '#1e1e1e', borderColor: '#00ff88', borderWidth: 2, borderRadius: 10, paddingVertical: 14, paddingHorizontal: 24 },
  selected: { backgroundColor: '#00ff88' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  switchBlock: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingVertical: 10, borderTopWidth: 1, borderColor: '#333' },
  label: { color: '#ccc', fontSize: 15 },
});
