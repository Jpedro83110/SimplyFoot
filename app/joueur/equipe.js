import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, ScrollView } from 'react-native';
import { supabase } from '../../lib/supabase';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function Equipe() {
  const [players, setPlayers] = useState([]);
  const [coach, setCoach] = useState(null);
  const [coachTeams, setCoachTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const session = await supabase.auth.getSession();
        const userId = session.data.session?.user?.id;
        if (!userId) { alert("Utilisateur non connecté."); setLoading(false); return; }

        const { data: joueur } = await supabase
          .from('joueurs').select('id, equipe_id')
          .eq('id', userId).single();

        if (!joueur?.equipe_id) { alert("Aucune équipe trouvée."); setLoading(false); return; }

        const { data: equipe } = await supabase
          .from('equipes').select('id, coach_id, nom')
          .eq('id', joueur.equipe_id).single();

        if (!equipe?.coach_id) { alert("Équipe introuvable ou coach non défini."); setLoading(false); return; }

        const { data: coachUser } = await supabase
          .from('utilisateurs').select('prenom, nom, email, id')
          .eq('id', equipe.coach_id).single();

        // Ici, la jointure est sur utilisateur_id !
        let coachPhone = null;
        if (coachUser && coachUser.id) {
          const { data: staffInfo, error: staffError } = await supabase
            .from('staff').select('telephone')
            .eq('utilisateur_id', coachUser.id)
            .maybeSingle();
          console.log('STAFF INFO', staffInfo, staffError);
          coachPhone = staffInfo?.telephone || null;
        }

        setCoach({
          ...coachUser,
          telephone: coachPhone
        });

        const { data: teamsOfCoach } = await supabase
          .from('equipes').select('nom')
          .eq('coach_id', equipe.coach_id);
        setCoachTeams(teamsOfCoach || []);

        const { data: joueursEquipe } = await supabase
          .from('joueurs').select('id, nom, prenom, poste')
          .eq('equipe_id', joueur.equipe_id);

        setPlayers(joueursEquipe);
      } catch (e) {
        console.error('Erreur Equipe.js:', e.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} color="#00ff88" />;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>
        <Ionicons name="people-circle-outline" size={22} color="#00ff88" /> Mon Équipe
      </Text>
      {coach && (
        <View style={styles.coachCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
            <MaterialCommunityIcons name="account-tie" size={18} color="#00ff88" style={{ marginRight: 7 }} />
            <Text style={styles.coachTitle}>
              Coach : <Text style={{ color: '#fff' }}>{coach.prenom} {coach.nom}</Text>
            </Text>
          </View>
          <View style={styles.coachInfoRow}>
            <Ionicons name="call-outline" size={16} color="#00ff88" style={{ marginRight: 4 }} />
            <Text style={styles.coachText}>
              {coach.telephone
                ? <Text style={{ color: '#fff', fontWeight: '600' }}>{coach.telephone}</Text>
                : <Text style={{ color: '#666' }}>Non communiqué</Text>
              }
            </Text>
          </View>
          <View style={styles.coachInfoRow}>
            <Ionicons name="mail-outline" size={16} color="#00ff88" style={{ marginRight: 4 }} />
            <Text style={styles.coachText}>{coach.email || <Text style={{ color: '#666' }}>Non communiqué</Text>}</Text>
          </View>
          <Text style={styles.coachTeams}>
            {coachTeams.length > 0
              ? <><MaterialCommunityIcons name="soccer-field" size={15} color="#00ff88" /> <Text style={{ color: '#bbb' }}>Équipe du coach : </Text><Text style={{ color: '#fff' }}>{coachTeams.map(e => e.nom).join(', ')}</Text></>
              : <Text style={{ color: '#666' }}>Aucune équipe trouvée</Text>
            }
          </Text>
        </View>
      )}

      <Text style={styles.equipeTitle}>Membres de l'équipe</Text>
      <FlatList
        data={players}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.playerCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="person-circle-outline" size={20} color="#00ff88" style={{ marginRight: 8 }} />
              <Text style={styles.cardTitle}>{item.prenom} {item.nom}</Text>
            </View>
            <Text style={styles.cardDetail}>{item.poste ? `Poste : ${item.poste}` : 'Poste non défini'}</Text>
          </View>
        )}
        style={{ marginBottom: 30 }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#121212',
    padding: 18,
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#00ff88',
    marginBottom: 18,
    textAlign: 'center',
    letterSpacing: 1,
  },
  coachCard: {
    backgroundColor: '#18251a',
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#00ff8855',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 5,
    elevation: 2,
  },
  coachTitle: {
    color: '#00ff88',
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  coachInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 1,
    marginLeft: 2,
  },
  coachText: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 1,
  },
  coachTeams: {
    marginTop: 4,
    fontSize: 13,
    color: '#bbb',
    marginLeft: 2,
  },
  equipeTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#00ff88',
    marginTop: 8,
    marginBottom: 8,
    marginLeft: 2,
  },
  playerCard: {
    backgroundColor: '#191a1f',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'column',
    shadowColor: '#00ff8833',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.13,
    shadowRadius: 2,
    elevation: 1,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  cardDetail: {
    color: '#bbb',
    fontSize: 13,
    marginLeft: 28,
    marginTop: -2,
  },
});
