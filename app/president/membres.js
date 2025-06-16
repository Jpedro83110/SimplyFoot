import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import useCacheData from '../../lib/cache'; // <-- AJOUT

export default function Membres() {
  const [equipeFiltre, setEquipeFiltre] = useState('');
  const [clubId, setClubId] = useState(null);
  const router = useRouter();

  // --- On charge clubId (session)
  useEffect(() => {
    async function getClubId() {
      const session = await supabase.auth.getSession();
      const userId = session?.data?.session?.user?.id;
      if (!userId) return Alert.alert("Erreur", "Utilisateur non authentifié");

      const { data: club } = await supabase
        .from('clubs')
        .select('id')
        .eq('created_by', userId)
        .single();

      if (!club?.id) return Alert.alert("Erreur", "Club introuvable");
      setClubId(club.id);
    }
    getClubId();
  }, []);

  // --- FONCTION DE FETCH
  const fetchMembresEtEquipes = async () => {
    // On récupère équipes et utilisateurs d'un coup
    const { data: allEquipes, error: eqErr } = await supabase
      .from('equipes')
      .select('id, nom')
      .eq('club_id', clubId);

    if (eqErr) throw new Error(eqErr.message);

    const { data: utilisateurs, error: err1 } = await supabase
      .from('utilisateurs')
      .select('id, nom, prenom, role, joueur_id')
      .eq('club_id', clubId)
      .ilike('role', 'joueur');

    if (err1) throw new Error(err1.message);

    const joueurIds = utilisateurs
      .map(u => u.joueur_id)
      .filter(id => typeof id === 'string' && id.trim() !== '');

    let joueurs = [];
    if (joueurIds.length > 0) {
      const { data: joueursData, error: err2 } = await supabase
        .from('joueurs')
        .select('id, equipe_id, numero_licence, visite_medicale_valide, equipement')
        .in('id', joueurIds);
      if (err2) throw new Error(err2.message);
      joueurs = joueursData;
    }

    const equipeMap = Object.fromEntries((allEquipes || []).map(eq => [eq.id, eq.nom]));

    // Mapping utilisateurs + joueurs
    const mapped = utilisateurs.map((u) => {
      const j = joueurs.find(j => j.id === u.joueur_id);
      return {
        id: u.id,
        joueur_id: u.joueur_id,
        nom: `${u.prenom} ${u.nom}`,
        equipe: j?.equipe_id ? equipeMap[j.equipe_id] || '-' : '-',
        equipe_id: j?.equipe_id?.toString() || '',
        licence: j?.numero_licence || '—',
        visite_medicale: j?.visite_medicale_valide || false,
        equipement: j?.equipement || false,
      };
    });

    return {
      membres: mapped,
      equipes: allEquipes || [],
    };
  };

  // --- USECACHEDATA (clé unique par club)
  const cacheKey = clubId ? `membres_club_${clubId}` : null;
  const [data, refreshData, loading] = useCacheData(
    cacheKey,
    fetchMembresEtEquipes,
    3600 // 1h
  );
  const membres = data?.membres || [];
  const equipes = data?.equipes || [];

  // --- Filtre instantané
  const joueursFiltres = membres.filter(m => {
    if (!equipeFiltre) return true;
    return m.equipe_id === equipeFiltre;
  });

  return (
    <LinearGradient colors={["#0a0a0a", "#0f0f0f"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>👥 Joueurs du club</Text>

        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={equipeFiltre}
            onValueChange={value => setEquipeFiltre(value.toString())}
            style={styles.picker}
          >
            <Picker.Item label="Toutes les équipes" value="" />
            {equipes.map(eq => (
              <Picker.Item key={eq.id} label={eq.nom} value={eq.id.toString()} />
            ))}
          </Picker>
        </View>

        {loading ? (
          <ActivityIndicator color="#00ff88" size="large" style={{ marginTop: 40 }} />
        ) : joueursFiltres.length === 0 ? (
          <Text style={{ color: '#888', marginTop: 20, textAlign: 'center' }}>
            Aucun joueur trouvé.
          </Text>
        ) : (
          joueursFiltres.map((m) => (
            <View key={m.id} style={styles.card}>
              <Text style={[styles.name, { textAlign: 'center' }]}>{m.nom}</Text>
              <Text style={[styles.role, { textAlign: 'center' }]}>{m.equipe}</Text>
              <Text style={[styles.detail, { textAlign: 'center' }]}>🎫 Licence : {m.licence}</Text>
              <Text style={[styles.detail, { textAlign: 'center' }]}>🩺 Visite médicale : {m.visite_medicale ? '✅ OK' : '❌'}</Text>
              <Text style={[styles.detail, { textAlign: 'center' }]}>🎒 Équipement : {m.equipement ? '✅ Fourni' : '❌'}</Text>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.smallButton}
                  onPress={() => router.push(`/joueur/eval-mentale?user=${m.joueur_id}`)}
                >
                  <Text style={styles.smallButtonText}>🧠 Mentale</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.smallButton}
                  onPress={() => router.push(`/joueur/eval-technique?user=${m.joueur_id}`)}
                >
                  <Text style={styles.smallButtonText}>⚽ Technique</Text>
                </TouchableOpacity>
              </View>
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
    fontSize: 22,
    fontWeight: 'bold',
    color: '#00ff88',
    marginBottom: 20,
    textAlign: 'center',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#00ff88',
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    color: '#00ff88',
    backgroundColor: '#181818',
  },
  card: {
    backgroundColor: '#1e1e1e',
    padding: 18,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#00ff88',
  },
  name: {
    fontSize: 17,
    color: '#fff',
    fontWeight: '700',
    marginBottom: 4,
  },
  role: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 8,
  },
  detail: {
    color: '#aaa',
    fontSize: 13,
    marginBottom: 3,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 12,
  },
  smallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00ff88',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  smallButtonText: {
    color: '#00ff88',
    fontWeight: '600',
    fontSize: 13,
  },
});
