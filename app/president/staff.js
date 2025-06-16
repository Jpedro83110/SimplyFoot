import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import useCacheData from '../../lib/cache'; // <-- AJOUT

export default function Staff() {
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [clubId, setClubId] = useState(null);

  // Récupération clubId (session)
  useEffect(() => {
    async function getClubId() {
      const session = await supabase.auth.getSession();
      const userId = session.data.session.user.id;
      const { data: utilisateur, error: errorUser } = await supabase
        .from('utilisateurs')
        .select('club_id')
        .eq('id', userId)
        .single();
      if (!errorUser && utilisateur) {
        setClubId(utilisateur.club_id);
      }
    }
    getClubId();
  }, []);

  // --- Fonction fetch staff
  const fetchStaff = async () => {
    if (!clubId) return [];
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('club_id', clubId);
    if (error) throw new Error(error.message);
    return data || [];
  };

  // --- useCacheData
  const cacheKey = clubId ? `staff_club_${clubId}` : null;
  const [staff, refreshStaff, loading] = useCacheData(
    cacheKey,
    fetchStaff,
    3600 // 1h
  );

  // --- Ajout coach
  const handleAddCoach = async () => {
    if (!nom || !prenom) {
      Alert.alert("Champs manquants", "Merci de remplir le nom et le prénom.");
      return;
    }
    const { error } = await supabase.from('staff').insert({
      nom,
      prenom,
      club_id: clubId,
    });
    if (error) {
      Alert.alert("Erreur", "Impossible de créer le coach.");
      console.error("Erreur insertion coach :", error);
    } else {
      Alert.alert("✅ Coach ajouté", `${prenom} ${nom} a été ajouté au staff.`);
      setNom('');
      setPrenom('');
      refreshStaff(); // <-- Refresh auto
    }
  };

  // --- Suppression coach
  const handleDeleteCoach = async (coachId) => {
    Alert.alert(
      "Confirmer la suppression",
      "Es-tu sûr de vouloir supprimer ce coach ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase.from('staff').delete().eq('id', coachId);
            if (error) {
              Alert.alert("Erreur", "Impossible de supprimer ce coach.");
              console.error("Erreur suppression :", error);
            } else {
              refreshStaff(); // <-- Refresh auto
            }
          }
        }
      ]
    );
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} color="#00ff88" />;

  return (
    <LinearGradient colors={["#0a0a0a", "#0f0f0f"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>👥 Membres du Staff</Text>

        {staff.length === 0 ? (
          <Text style={{ color: '#ccc', marginBottom: 20 }}>Aucun coach encore créé.</Text>
        ) : (
          staff.map((membre) => (
            <View key={membre.id} style={styles.card}>
              <View style={styles.cardRow}>
                <Text style={styles.cardName}>{membre.prenom} {membre.nom}</Text>
                <TouchableOpacity onPress={() => handleDeleteCoach(membre.id)}>
                  <Ionicons name="trash" size={22} color="#ff4444" />
                </TouchableOpacity>
              </View>
              <Text style={styles.cardDetail}>📧 {membre.email || 'Email non renseigné'}</Text>
              <Text style={styles.cardDetail}>📞 {membre.telephone || 'Téléphone non renseigné'}</Text>
              <Text style={styles.cardDetail}>🎂 {membre.date_naissance || 'Date non renseignée'}</Text>
              <Text style={styles.cardDetail}>🎓 Diplôme : {membre.diplome ? '✅ Oui' : '❌ Non'}</Text>
              <Text style={styles.cardRole}>Rôle : {membre.role || 'Coach'}</Text>
            </View>
          ))
        )}

        <View style={styles.form}>
          <Text style={styles.subtitle}>➕ Ajouter un coach</Text>
          <TextInput
            style={styles.input}
            placeholder="Prénom"
            placeholderTextColor="#aaa"
            value={prenom}
            onChangeText={setPrenom}
          />
          <TextInput
            style={styles.input}
            placeholder="Nom"
            placeholderTextColor="#aaa"
            value={nom}
            onChangeText={setNom}
          />
          <TouchableOpacity style={styles.button} onPress={handleAddCoach}>
            <Ionicons name="add-circle" size={20} color="#111" />
            <Text style={styles.buttonText}>Créer le coach</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20 },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#00ff88',
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#1e1e1e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#00ff88',
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  cardRole: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 6,
  },
  cardDetail: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 2,
  },
  form: {
    marginTop: 30,
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
  },
  subtitle: {
    fontSize: 18,
    color: '#00ff88',
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#2a2a2a',
    color: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#444',
  },
  button: {
    backgroundColor: '#00ff88',
    borderRadius: 10,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#111',
  },
});
