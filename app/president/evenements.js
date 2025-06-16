import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '../../lib/supabase';
import * as Notifications from 'expo-notifications';

export default function Evenements() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [titre, setTitre] = useState('');
  const [categorie, setCategorie] = useState('repas');
  const [lieu, setLieu] = useState('');
  const [description, setDescription] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [heureStr, setHeureStr] = useState('');
  const [clubId, setClubId] = useState(null);

  const fetchEvents = async () => {
    setLoading(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;

    const { data: club } = await supabase
      .from('clubs')
      .select('id')
      .eq('created_by', userId)
      .single();

    if (!club) return Alert.alert("Erreur", "Club introuvable.");
    setClubId(club.id);

    const { data, error } = await supabase
      .from('evenements')
      .select('*')
      .eq('club_id', club.id)
      .order('date', { ascending: true });

    if (error) Alert.alert('Erreur', error.message);
    else setEvents(data);

    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const envoyerNotifications = async (message, clubId) => {
    const { data: utilisateurs } = await supabase
      .from('utilisateurs')
      .select('token_push')
      .eq('club_id', clubId)
      .not('token_push', 'is', null);

    const tokens = utilisateurs.map(u => u.token_push);

    for (const token of tokens) {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: token,
          title: 'Nouvel événement',
          body: message,
        }),
      });
    }
  };

  const handleSubmit = async () => {
    if (!titre || !lieu || !description || !dateStr || !heureStr) {
      return Alert.alert("Erreur", "Tous les champs sont requis.");
    }

    const [jour, mois, annee] = dateStr.split('/');
    const date = `${annee}-${mois}-${jour}`;
    const heure = heureStr;

    const { error } = await supabase.from('evenements').insert({
      titre,
      type: categorie,
      date,
      heure,
      lieu,
      description,
      club_id: clubId,
    });

    if (error) {
      console.error(error);
      Alert.alert('Erreur Supabase', error.message);
    } else {
      await envoyerNotifications(`${titre} prévu le ${dateStr} à ${heureStr}`, clubId);
      Alert.alert('✅ Créé', 'Événement ajouté avec succès !');
      setTitre('');
      setCategorie('repas');
      setLieu('');
      setDescription('');
      setDateStr('');
      setHeureStr('');
      fetchEvents();
    }
  };

  const getEmoji = (type) => {
    switch (type) {
      case 'repas': return '🍽️';
      case 'tournoi': return '🏆';
      case 'loisir': return '🎉';
      case 'reunion': return '📣';
      case 'autre': return '📌';
      default: return '📅';
    }
  };

  return (
    <LinearGradient colors={['#0a0a0a', '#0f0f0f']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>📆 Organisation Club</Text>

        <View style={styles.form}>
          <TextInput
            placeholder="Nom de l'événement"
            placeholderTextColor="#888"
            style={styles.input}
            value={titre}
            onChangeText={setTitre}
          />

          <Picker
            selectedValue={categorie}
            onValueChange={(itemValue) => setCategorie(itemValue)}
            style={styles.picker}
            dropdownIconColor="#00ff88"
          >
            <Picker.Item label="Repas" value="repas" />
            <Picker.Item label="Tournoi" value="tournoi" />
            <Picker.Item label="Loisir / fête" value="loisir" />
            <Picker.Item label="Réunion" value="reunion" />
            <Picker.Item label="Autre" value="autre" />
          </Picker>

          <TextInput
            placeholder="Lieu"
            placeholderTextColor="#888"
            style={styles.input}
            value={lieu}
            onChangeText={setLieu}
          />

          <TextInput
            placeholder="Date (JJ/MM/AAAA)"
            placeholderTextColor="#888"
            style={styles.input}
            value={dateStr}
            onChangeText={setDateStr}
            keyboardType="numeric"
          />

          <TextInput
            placeholder="Heure (HH:MM)"
            placeholderTextColor="#888"
            style={styles.input}
            value={heureStr}
            onChangeText={setHeureStr}
            keyboardType="numeric"
          />

          <TextInput
            placeholder="Détail de l'événement"
            placeholderTextColor="#888"
            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
            value={description}
            onChangeText={setDescription}
            multiline
          />

          <TouchableOpacity style={styles.createButton} onPress={handleSubmit}>
            <Ionicons name="add-circle" size={20} color="#000" />
            <Text style={styles.buttonText}>Créer l'événement</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color="#00ff88" style={{ marginTop: 40 }} />
        ) : (
          events.map((event) => (
            <View key={event.id} style={styles.card}>
              <Text style={styles.cardTitle}>{getEmoji(event.type)} {event.titre}</Text>
              <Text style={styles.detailText}>📍 {event.lieu}</Text>
              <Text style={styles.detailText}>🕒 {event.date} à {event.heure}</Text>
              <Text style={styles.detailText}>📝 {event.description}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20 },
  title: {
    fontSize: 24,
    color: '#00ff88',
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  form: {
    backgroundColor: '#1e1e1e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 30,
    borderLeftWidth: 4,
    borderLeftColor: '#00ff88',
  },
  input: {
    backgroundColor: '#2a2a2a',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  picker: {
    backgroundColor: '#2a2a2a',
    color: '#fff',
    marginBottom: 12,
    borderRadius: 8,
  },
  createButton: {
    backgroundColor: '#00ff88',
    paddingVertical: 12,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  card: {
    backgroundColor: '#1e1e1e',
    padding: 18,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#00ff88',
  },
  cardTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  detailText: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 4,
  },
  buttonText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 14,
  },
});