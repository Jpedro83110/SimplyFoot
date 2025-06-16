import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';

dayjs.locale('fr');

export default function ConvocationsList() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const router = useRouter();

  useEffect(() => {
    async function fetchEvents() {
      setLoading(true);
      // Session coach
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (!userId) {
        setEvents([]);
        setLoading(false);
        return;
      }
      // Récupère tous les événements à venir pour ce coach
      const today = dayjs().format('YYYY-MM-DD');
      const { data: eventsList, error } = await supabase
        .from('evenements')
        .select('*')
        .eq('coach_id', userId)
        .gte('date', today)
        .order('date', { ascending: true });
      setEvents(eventsList || []);
      setLoading(false);
    }
    fetchEvents();
  }, []);

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} color="#00ff88" />;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Convocations à venir ({events.length})</Text>
      {events.length === 0 && (
        <Text style={styles.noEvents}>Aucun événement à venir.</Text>
      )}
      {events.map(event => (
        <TouchableOpacity
          key={event.id}
          style={styles.card}
          onPress={() => router.push(`/coach/convocation/${event.id}`)}
        >
          <Text style={styles.eventTitle}>{event.titre} — {dayjs(event.date).format('dddd D MMMM YYYY')}</Text>
          <Text style={styles.eventInfo}>⏰ {event.heure} - 📍 {event.lieu}</Text>
          {event.lieu_complement && (
            <Text style={styles.eventComplement}>🏟️ {event.lieu_complement}</Text>
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 18 },
  title: { color: '#00ff88', fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 22 },
  noEvents: { color: '#aaa', fontStyle: 'italic', textAlign: 'center', marginTop: 32 },
  card: { backgroundColor: '#1e1e1e', borderRadius: 12, borderLeftWidth: 4, borderLeftColor: '#00ff88', padding: 16, marginBottom: 18 },
  eventTitle: { color: '#fff', fontWeight: 'bold', fontSize: 17 },
  eventInfo: { color: '#aaa', fontSize: 14, marginTop: 5 },
  eventComplement: { color: '#8fd6ff', fontSize: 14, fontStyle: 'italic' },
});
