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
        
        console.log('🔐 Utilisateur connecté:', utilisateurId);

        if (!utilisateurId) {
          throw new Error('Utilisateur non connecté');
        }

        // Vérifier le rôle de l'utilisateur
        const { data: utilisateur, error: userError } = await supabase
          .from('utilisateurs')
          .select('id, role, joueur_id')
          .eq('id', utilisateurId)
          .single();

        console.log('👤 Données utilisateur:', utilisateur);

        if (userError || !utilisateur) {
          throw new Error('Utilisateur non trouvé');
        }

        if (utilisateur.role !== 'joueur') {
          throw new Error('Utilisateur non joueur');
        }

        // 🎯 CORRECTION : Utiliser l'ID utilisateur directement
        // car participations_evenement.joueur_id contient maintenant des IDs d'utilisateurs
        const { data: participations, error: partError } = await supabase
          .from('participations_evenement')
          .select('evenement_id, reponse, joueur_id')
          .eq('joueur_id', utilisateurId);  // Utiliser directement l'ID utilisateur

        console.log('🎯 Participations trouvées:', participations);

        if (partError) {
          console.error('❌ Erreur participations:', partError);
          throw partError;
        }

        if (!participations || participations.length === 0) {
          console.log('ℹ️ Aucune participation trouvée');
          setConvocations([]);
          setLoading(false);
          return;
        }

        const evenementIds = participations.map(p => p.evenement_id);
        console.log('📅 IDs événements:', evenementIds);

        // 3. Récupérer les événements à venir
        const { data: evenements, error: evtError } = await supabase
          .from('evenements')
          .select('*')
          .in('id', evenementIds)
          .gte('date', dayjs().format('YYYY-MM-DD'))
          .order('date', { ascending: true })
          .limit(4);

        console.log('📅 Événements trouvés:', evenements);

        if (evtError) {
          console.error('❌ Erreur événements:', evtError);
          throw evtError;
        }

        // 4. Mapper avec la participation (présent/absent)
        const convocationsList = (evenements || []).map(evt => {
          const participation = participations.find(p => p.evenement_id === evt.id);
          return { 
            ...evt, 
            reponse: participation?.reponse || null,
            participation_id: participation?.joueur_id
          };
        });

        console.log('📋 Convocations finales:', convocationsList);
        setConvocations(convocationsList);

      } catch (e) {
        console.error('💥 Erreur fetchConvocations:', e);
        setConvocations([]);
      }
      setLoading(false);
    }
    fetchConvocations();
  }, []);

  if (loading) return (
    <View style={styles.container}>
      <ActivityIndicator style={{ marginTop: 40 }} color="#00ff88" />
      <Text style={{ color: '#ccc', textAlign: 'center', marginTop: 10 }}>
        Chargement des convocations...
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📋 Mes Convocations</Text>
      
      {/* Debug info */}
      <Text style={styles.debugText}>
        {convocations.length} convocation(s) trouvée(s)
      </Text>
      
      {convocations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Aucune convocation à venir.</Text>
          <Text style={styles.emptySubtext}>
            Vérifiez que votre coach a créé des événements et vous a convoqué.
          </Text>
        </View>
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
              <Text style={styles.cardText}>
                📅 {dayjs(item.date).format('dddd D MMMM YYYY')} à {item.heure}
              </Text>
              <Text style={styles.cardText}>📍 {item.lieu}</Text>
              {item.lieu_complement && (
                <Text style={styles.cardComplement}>
                  🏟️ {item.lieu_complement}
                </Text>
              )}
              <Text style={styles.cardType}>🏷️ {item.type}</Text>
              {item.adversaires && (
                <Text style={styles.cardAdversaires}>⚔️ vs {item.adversaires}</Text>
              )}
              <Text style={[
                styles.cardReponse,
                item.reponse === 'present' && { color: '#00ff88' },
                item.reponse === 'absent' && { color: '#ff4444' },
                !item.reponse && { color: '#ffaa00' }
              ]}>
                {item.reponse === 'present' && '✅ Présent'}
                {item.reponse === 'absent' && '❌ Absent'}
                {!item.reponse && '❔ Pas encore répondu'}
              </Text>
            </TouchableOpacity>
          )}
          showsVerticalScrollIndicator={false}
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
  debugText: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    color: '#ccc',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#00ff88',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cardText: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 4,
  },
  cardComplement: {
    color: '#8fd6ff',
    fontStyle: 'italic',
    fontSize: 14,
    marginBottom: 4,
  },
  cardType: {
    color: '#ffaa00',
    fontSize: 14,
    marginBottom: 4,
    fontWeight: '500',
  },
  cardAdversaires: {
    color: '#ff6b6b',
    fontSize: 14,
    marginBottom: 4,
    fontWeight: '500',
  },
  cardReponse: {
    marginTop: 8,
    fontWeight: 'bold',
    fontSize: 15,
  },
});