import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import useCacheData from '../../../lib/cache';

export default function EquipeDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [equipeNom, setEquipeNom] = useState('');
  const [joueurs, setJoueurs] = useState([]);

  // Responsive params
  const screenWidth = Dimensions.get('window').width;
  const isMobile = screenWidth < 700 || Platform.OS !== 'web';

  // Utilise le cache, TTL 10 min
  const fetchEquipe = async () => {
    const { data: equipe, error: err1 } = await supabase
      .from('equipes')
      .select('nom')
      .eq('id', id)
      .single();

    const { data: joueursEquipe, error: err2 } = await supabase
      .from('joueurs')
      .select('*')
      .eq('equipe_id', id);

    if (err1 || err2) {
      return { equipeNom: 'Erreur de chargement', joueurs: [] };
    } else {
      return {
        equipeNom: equipe?.nom || 'Équipe',
        joueurs: joueursEquipe || [],
      };
    }
  };

  const [cacheData, refresh, loading] = useCacheData(
    `coach_equipe_${id}`,
    fetchEquipe,
    600 // 10 min
  );

  useEffect(() => {
    if (cacheData) {
      setEquipeNom(cacheData.equipeNom);
      setJoueurs(cacheData.joueurs);
    }
  }, [cacheData]);

  if (loading) return <ActivityIndicator style={{ marginTop: 50 }} color="#00ff88" />;

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={refresh} style={{ marginBottom: 18, alignSelf: 'flex-end' }}>
        <Text style={{ color: '#00ff88', fontSize: 14 }}>🔄 Rafraîchir</Text>
      </TouchableOpacity>
      <Text style={styles.title}>⚽ {equipeNom}</Text>
      <View style={styles.block}>
        <Text style={styles.label}>Nom de l'équipe :</Text>
        <Text style={styles.value}>{equipeNom}</Text>
      </View>

      <Text style={styles.sectionTitle}>👥 Liste des joueurs</Text>
      <FlatList
        data={joueurs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 32 }}
        renderItem={({ item }) => (
          <View style={[
            styles.playerCard,
            isMobile ? styles.playerCardMobile : styles.playerCardWeb
          ]}>
            <Image
              source={{
                uri: item.photo_profil_url && item.photo_profil_url.trim() !== ''
                  ? item.photo_profil_url
                  : 'https://ui-avatars.com/api/?name=' +
                    encodeURIComponent(`${item.prenom || ''} ${item.nom || ''}`) +
                    '&background=222&color=fff&rounded=true'
              }}
              style={styles.avatar}
            />
            <View style={styles.playerInfoContainer}>
              <Text style={styles.playerName}>{item.prenom} {item.nom}</Text>
              <Text style={styles.playerInfo}>Date naissance : {item.date_naissance || '—'}</Text>
              <Text style={styles.playerInfo}>Poste : {item.poste || '—'}</Text>
              <Text style={styles.playerInfo}>Licence : {item.numero_licence || '—'}</Text>
              <Text style={styles.playerInfo}>Visite médicale : {item.visite_medicale_valide ? '✅ OK' : '❌'}</Text>
              <Text style={styles.playerInfo}>Équipement : {item.equipement ? '✅ OK' : '❌'}</Text>
            </View>
            <Pressable
              onPress={() => router.push(`/coach/joueur/${item.id}`)}
              style={({ pressed }) => [
                styles.button,
                pressed && { opacity: 0.6 },
                isMobile && { alignSelf: 'flex-start', marginLeft: 10 },
              ]}
            >
              <Text style={styles.buttonText}>Fiche</Text>
            </Pressable>
          </View>
        )}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 20,
  },
  title: {
    fontSize: 24,
    color: '#00ff88',
    fontWeight: 'bold',
    marginBottom: 20,
  },
  block: {
    marginBottom: 15,
  },
  label: {
    color: '#aaa',
    fontSize: 16,
  },
  value: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 20,
    color: '#00ff88',
    fontWeight: 'bold',
    marginVertical: 20,
  },
  // Carte responsive : row everywhere, wrap/align depending on screen
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    padding: 14,
    borderRadius: 13,
    marginBottom: 13,
    borderLeftWidth: 4,
    borderLeftColor: '#00ff88',
    width: '100%',
    minHeight: 82,
    shadowColor: '#00ff8844',
    shadowOpacity: 0.10,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  playerCardMobile: {
    // Sur mobile : stack le bouton sous l'avatar pour éviter d'être trop serré si la largeur est faible
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  playerCardWeb: {
    // Sur web ou grand écran : aligné en ligne, tout sur la même rangée
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 15,
    borderWidth: 2,
    borderColor: '#00ff88',
    backgroundColor: '#222',
  },
  playerInfoContainer: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 120,
    marginRight: 8,
  },
  playerName: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  playerInfo: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 1,
  },
  button: {
    backgroundColor: '#00ff88',
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 5,
    alignSelf: 'center',
    minWidth: 64,
  },
  buttonText: {
    color: '#111',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
