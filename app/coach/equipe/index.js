import React from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { supabase } from '../../../lib/supabase';
import useCacheData from '../../../lib/cache';

export default function ListeEquipes() {
  const router = useRouter();

  // Utilise le cache pour les équipes
  const fetchEquipes = async () => {
    const { data: equipesData, error } = await supabase.from('equipes').select('*');
    if (error) return [];
    const equipesWithCounts = await Promise.all(
      equipesData.map(async (eq) => {
        const { count } = await supabase
          .from('utilisateurs')
          .select('*', { count: 'exact', head: true })
          .eq('equipe_id', eq.id);
        return {
          id: eq.id,
          nom: eq.nom,
          categorie: eq.categorie,
          nbJoueurs: count,
          presence: 'À calculer',
        };
      })
    );
    return equipesWithCounts;
  };

  const [equipes, refresh, loading] = useCacheData(
    'coach_liste_equipes',
    fetchEquipes,
    600 // 10 minutes
  );

  if (loading) return <ActivityIndicator style={{ marginTop: 50 }} color="#00ff88" />;

  return (
    <LinearGradient colors={["#0a0a0a", "#0f0f0f"]} style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <TouchableOpacity onPress={refresh} style={{ marginBottom: 10, alignSelf: 'flex-end' }}>
          <Text style={{ color: '#00ff88', fontSize: 14 }}>🔄 Rafraîchir</Text>
        </TouchableOpacity>
        <Text style={styles.title}>MES ÉQUIPES</Text>
        {equipes.map((equipe, index) => (
          <MotiView
            key={equipe.id}
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: index * 150 }}
            style={styles.card}
          >
            <Pressable onPress={() => router.push(`/coach/equipe/${equipe.id}`)}>
              <View style={styles.row}>
                <Ionicons name="people" size={24} color="#00ff88" style={{ marginRight: 10 }} />
                <View>
                  <Text style={styles.cardTitle}>{equipe.nom}</Text>
                  <Text style={styles.cardSub}>Catégorie : {equipe.categorie}</Text>
                  <Text style={styles.cardSub}>Joueurs : {equipe.nbJoueurs}</Text>
                  <Text style={styles.cardStat}>Présence : {equipe.presence}</Text>
                </View>
              </View>
            </Pressable>
          </MotiView>
        ))}

        <Pressable
          onPress={() => router.push('/coach/creation-equipe')}
          style={({ pressed }) => [styles.addButton, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name="add-circle" size={24} color="#fff" />
          <Text style={styles.addText}>Créer une équipe</Text>
        </Pressable>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    color: '#00ff88',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#00ff88',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00ff88',
  },
  cardSub: {
    color: '#ccc',
    fontSize: 14,
    marginTop: 2,
  },
  cardStat: {
    color: '#00ff88',
    marginTop: 6,
    fontSize: 14,
    fontWeight: '600',
  },
  addButton: {
    marginTop: 30,
    backgroundColor: '#00ff88',
    borderRadius: 10,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  addText: {
    color: '#111',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
