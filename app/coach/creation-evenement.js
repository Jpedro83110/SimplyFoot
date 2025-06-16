import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  Keyboard,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';

const LOCATIONIQ_KEY = 'pk.1bc03891ccd317c6ca47a6d1b87bdbe1';
const OPENWEATHER_KEY = '1c27efe2712135cb33936abb88a3d28a';

export default function CreateEvent() {
  const [type, setType] = useState('match');
  const [titre, setTitre] = useState('');
  const [date, setDate] = useState('');
  const [heure, setHeure] = useState('');
  const [lieu, setLieu] = useState('');
  const [lieuxResultats, setLieuxResultats] = useState([]);
  const [coords, setCoords] = useState(null);
  const [complement, setComplement] = useState('');
  const [meteo, setMeteo] = useState('');
  const [equipe, setEquipe] = useState('');
  const [equipes, setEquipes] = useState([]);
  const [adversaires, setAdversaires] = useState('');
  const [coachId, setCoachId] = useState(null);
  const [fetchingLieu, setFetchingLieu] = useState(false);
  const scrollViewRef = useRef();
  const router = useRouter();

  // --- Equipes du coach ---
  useEffect(() => {
    const fetchEquipes = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      setCoachId(userId);
      const { data: eq } = await supabase
        .from('equipes')
        .select('*')
        .eq('coach_id', userId);
      setEquipes(eq || []);
    };
    fetchEquipes();
  }, []);

  // --- Suggestions de lieux ---
  let timerLieu = useRef();
  const chercherLieu = (text) => {
    setLieu(text);
    setCoords(null);
    setMeteo('');
    setLieuxResultats([]);
    if (timerLieu.current) clearTimeout(timerLieu.current);
    if (text.length < 3) return;
    setFetchingLieu(true);
    timerLieu.current = setTimeout(async () => {
      try {
        const url = `https://api.locationiq.com/v1/autocomplete?key=${LOCATIONIQ_KEY}&q=${encodeURIComponent(text)}&limit=5&format=json`;
        const res = await fetch(url);
        const data = await res.json();
        setLieuxResultats(Array.isArray(data) ? data : []);
      } catch {
        setLieuxResultats([]);
      } finally {
        setFetchingLieu(false);
      }
    }, 500);
  };

  // --- Rafraîchit la météo dès que date ou coords changent ---
  useEffect(() => {
    const fetchMeteo = async () => {
      if (!date || !coords?.lat || !coords?.lon) {
        setMeteo('');
        return;
      }
      try {
        const meteoUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lon}&units=metric&appid=${OPENWEATHER_KEY}&lang=fr`;
        const res = await fetch(meteoUrl);
        const data = await res.json();
        if (data && data.weather && data.main) {
          setMeteo(`${data.weather[0].description}, ${data.main.temp}°C`);
        } else {
          setMeteo('Indisponible');
        }
      } catch {
        setMeteo('Indisponible');
      }
    };
    fetchMeteo();
  }, [date, coords]);

  const choisirLieu = async (item) => {
    setLieu(item.display_name);
    setCoords({ lat: item.lat, lon: item.lon });
    setLieuxResultats([]);
    Keyboard.dismiss();
    // La météo sera récupérée automatiquement via useEffect dès que coords changent
  };

  // --- Création évènement ---
  const handleCreate = async () => {
    if (!titre || !date || !heure || !lieu || !equipe) {
      Alert.alert('Erreur', 'Merci de remplir tous les champs.');
      return;
    }
    if (!coords?.lat || !coords?.lon) {
      Alert.alert('Erreur', 'Sélectionne le lieu dans la suggestion (pour la météo et GPS), puis ajoute le nom du stade dans “Complément”.');
      return;
    }
    if (!meteo || meteo === 'Indisponible') {
      Alert.alert('Attention', 'Météo non récupérée, tu peux continuer mais la météo ne sera pas affichée.');
    }

    // 1. Création de l'évènement
    const insertPayload = {
      type,
      titre,
      date,
      heure,
      lieu,
      lieu_complement: complement,
      equipe_id: equipe,
      adversaires,
      meteo,
      latitude: coords.lat,
      longitude: coords.lon,
      coach_id: coachId,
    };

    const { data: nouvelEvenement, error } = await supabase
      .from('evenements')
      .insert(insertPayload)
      .select()
      .single();
    if (error) {
      Alert.alert('Erreur', error.message);
      return;
    }

    // 2. Récupérer TOUS les joueurs de l’équipe sélectionnée
    const { data: joueurs, error: joueursErr } = await supabase
      .from('joueurs')
      .select('id')
      .eq('equipe_id', equipe);

    if (joueursErr) {
      Alert.alert('Erreur', joueursErr.message);
      return;
    }

    // 3. Insérer une participation pour chaque joueur
    if (joueurs && joueurs.length > 0) {
      const participations = joueurs.map(joueur => ({
        joueur_id: joueur.id,
        evenement_id: nouvelEvenement.id,
        reponse: null,
        besoin_transport: false,
      }));
      const { error: partError } = await supabase.from('participations_evenement').insert(participations);
      if (partError) {
        Alert.alert('Erreur', partError.message);
        return;
      }
    }

    Alert.alert('✅ Évènement bien créé !');
    router.replace('/coach/dashboard');
    // Reset le formulaire
    setType('match');
    setTitre('');
    setDate('');
    setHeure('');
    setLieu('');
    setLieuxResultats([]);
    setCoords(null);
    setComplement('');
    setMeteo('');
    setEquipe('');
    setAdversaires('');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
      keyboardVerticalOffset={80}
    >
      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1, backgroundColor: '#121212' }}
        contentContainerStyle={{ padding: 24, paddingBottom: 80 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>🗓️ Créer un Événement</Text>
        {/* Type */}
        <Text style={styles.label}>Type</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={type}
            onValueChange={setType}
            style={styles.picker}
            dropdownIconColor="#00ff88"
          >
            <Picker.Item label="Match" value="match" />
            <Picker.Item label="Entraînement" value="entrainement" />
            <Picker.Item label="Tournoi" value="tournoi" />
            <Picker.Item label="Plateau" value="plateau" />
            <Picker.Item label="Autre" value="autre" />
          </Picker>
        </View>

        {/* Équipe */}
        <Text style={styles.label}>Équipe concernée</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={equipe}
            onValueChange={setEquipe}
            style={styles.picker}
          >
            <Picker.Item label="-- Choisir une équipe --" value="" />
            {equipes.map(eq => (
              <Picker.Item key={eq.id} label={eq.nom} value={eq.id} />
            ))}
          </Picker>
        </View>

        {/* Lieu */}
        <Text style={styles.label}>Lieu (ville/quartier)</Text>
        <TextInput
          style={styles.input}
          placeholder="Commence à taper pour voir les suggestions"
          placeholderTextColor="#aaa"
          value={lieu}
          onChangeText={chercherLieu}
          autoCorrect={false}
        />
        {fetchingLieu && <Text style={styles.suggestion}>Recherche...</Text>}
        {lieuxResultats.length > 0 && (
          <View style={styles.suggestionList}>
            {lieuxResultats.map((item) => (
              <TouchableOpacity
                key={item.place_id}
                onPress={() => choisirLieu(item)}
                style={styles.suggestionItem}
              >
                <Text style={styles.suggestionText}>{item.display_name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Complément */}
        <Text style={styles.label}>Complément (nom du stade, gymnase...)</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex : Stade Delaune"
          placeholderTextColor="#aaa"
          value={complement}
          onChangeText={setComplement}
        />

        {/* Titre */}
        <Text style={styles.label}>Nom de l'événement</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex : 16e journée D2"
          placeholderTextColor="#aaa"
          value={titre}
          onChangeText={setTitre}
        />

        {/* Date */}
        <Text style={styles.label}>Date</Text>
        <TextInput
          style={styles.input}
          placeholder="Date (ex: 2025-06-30)"
          placeholderTextColor="#aaa"
          value={date}
          onChangeText={setDate}
        />

        {/* Heure */}
        <Text style={styles.label}>Heure</Text>
        <TextInput
          style={styles.input}
          placeholder="Heure (ex: 15:00)"
          placeholderTextColor="#aaa"
          value={heure}
          onChangeText={setHeure}
        />

        {/* Adversaires */}
        <Text style={styles.label}>Adversaires (séparés par virgule)</Text>
        <TextInput
          style={styles.input}
          placeholder="Adversaires"
          placeholderTextColor="#aaa"
          value={adversaires}
          onChangeText={setAdversaires}
        />

        {/* Météo */}
        {meteo && <Text style={styles.meteo}>🌦️ Météo prévue : {meteo}</Text>}
      </ScrollView>

      <TouchableOpacity style={styles.buttonSticky} onPress={handleCreate}>
        <Text style={styles.buttonText}>Créer</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: 'bold', color: '#00ff88', marginBottom: 30, textAlign: 'center' },
  label: { color: '#aaa', marginTop: 10, marginBottom: 5, fontSize: 16 },
  pickerContainer: {
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  picker: {
    color: '#fff',
    height: Platform.OS === 'android' ? 50 : undefined,
    width: '100%',
  },
  input: {
    backgroundColor: '#1e1e1e',
    color: '#fff',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 18,
    fontSize: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#333',
    width: '100%',
  },
  suggestionList: {
    backgroundColor: '#232323',
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#00ff88',
    maxHeight: 200,
    overflow: 'hidden',
  },
  suggestionItem: {
    padding: 10,
    borderBottomColor: '#222',
    borderBottomWidth: 1,
  },
  suggestionText: {
    color: '#00ff88',
    fontSize: 15,
  },
  meteo: { color: '#00ff88', marginTop: 10, textAlign: 'center' },
  buttonSticky: {
    backgroundColor: '#00ff88',
    paddingVertical: 18,
    borderRadius: 10,
    alignItems: 'center',
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    marginHorizontal: 0,
    marginBottom: 0,
  },
  buttonText: { color: '#000', fontSize: 17, fontWeight: '800', letterSpacing: 1 },
});
