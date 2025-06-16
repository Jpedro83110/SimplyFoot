import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';

dayjs.locale('fr');

export default function ConvocationsJoueur() {
  const [loading, setLoading] = useState(true);
  const [convocations, setConvocations] = useState([]);
  const router = useRouter();

  useEffect(() => {
    async function fetchConvocations() {
      setLoading(true);
      try {
        const session = await supabase.auth.getSession();
        const utilisateurId = session.data.session?.user?.id;

        // 1. Chercher le joueur_id du user connecté
        const { data: utilisateur } = await supabase
          .from('utilisateurs')
          .select('joueur_id')
          .eq('id', utilisateurId)
          .single();

        if (!utilisateur?.joueur_id) throw new Error('Aucun joueur lié à ce compte.');

        // 2. Chercher toutes les participations de ce joueur (avec id événement)
        const { data: participations } = await supabase
          .from('participations_evenement')
          .select('evenement_id, reponse')
          .eq('joueur_id', utilisateur.joueur_id);

        const evenementIds = participations.map(p => p.evenement_id);

        // 3. Récupérer les 4 événements à venir
        let { data: evenements } = await supabase
          .from('evenements')
          .select('*')
          .in('id', evenementIds)
          .gte('date', dayjs().format('YYYY-MM-DD'))
          .order('date', { ascending: true })
          .limit(4);

        // 4. Mapper avec la participation (présent/absent)
        const convocationsList = (evenements || []).map(evt => {
          const participation = participations.find(p => p.evenement_id === evt.id);
          return { ...evt, reponse: participation?.reponse || null };
        });

        setConvocations(convocationsList);
      } catch (e) {
        setConvocations([]);
      }
      setLoading(false);
    }
    fetchConvocations();
  }, []);

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} color="#00ff88" />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📋 Mes Convocations</Text>
      {convocations.length === 0 ? (
        <Text style={{ color: '#ccc', textAlign: 'center' }}>Aucune convocation à venir.</Text>
      ) : (
        <FlatList
          data={convocations}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/joueur/convocation/${item.id}`)}
            >
              <Text style={styles.cardTitle}>{item.titre}</Text>
              <Text style={styles.cardText}>📅 {dayjs(item.date).format('dddd D MMMM YYYY')} à {item.heure}</Text>
              <Text style={styles.cardText}>📍 {item.lieu}</Text>
              {item.lieu_complement && (
                <Text style={styles.cardComplement}>
                  🏟️ {item.lieu_complement}
                </Text>
              )}
              <Text style={styles.cardReponse}>
                {item.reponse === 'present' && '✅ Présent'}
                {item.reponse === 'absent' && '❌ Absent'}
                {!item.reponse && '❔ Pas encore répondu'}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
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
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#00ff88',
  },
  cardTitle: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 4,
  },
  cardText: {
    color: '#ccc',
  },
  cardComplement: {
    color: '#8fd6ff',
    fontStyle: 'italic',
    marginBottom: 2,
    marginLeft: 4,
  },
  cardReponse: {
    marginTop: 8,
    fontWeight: 'bold',
    color: '#00ff88',
  },
});
