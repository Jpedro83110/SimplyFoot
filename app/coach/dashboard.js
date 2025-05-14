// CoachDashboard.js - version complète immersive avec effets 3D et accès total aux pages
import React from 'react';
import { Dimensions, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../lib/theme';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import Animated, { FadeIn, FadeInUp, FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';

export default function CoachDashboard() {
  const router = useRouter();
  const { colors } = useTheme();

  const handleViewTeam = () => router.push('/coach/equipe');
  const handleViewConvocations = () => router.push('/coach/convocation');
  const handleCreateEvent = () => router.push('/coach/creation-evenement');
  const handleComposition = () => router.push('/coach/composition');

  const data = {
    labels: ['Fév', 'Mar', 'Avr', 'Mai', 'Juin'],
    datasets: [
      {
        data: [2, 4, 5, 9, 7],
        color: (opacity = 1) => `rgba(0, 255, 120, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  const actions = [
    { icon: 'calendar', text: 'Convocations', action: handleViewConvocations },
    { icon: 'add-circle', text: 'Créer Événement', action: handleCreateEvent },
    { icon: 'grid', text: 'Composition', action: handleComposition },
  ];

  return (
    <LinearGradient colors={["#0a0a0a", "#0f0f0f"]} style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 50 }}>
        <Animated.View entering={FadeIn.duration(800)} style={styles.header}>
          <Image
            source={{ uri: 'https://via.placeholder.com/100x100.png?text=Coach' }}
            style={styles.avatar}
          />
          <Text style={styles.title}>COACH JEAN</Text>
          <Text style={styles.subtitle}>Bienvenue dans ton espace</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200)} style={styles.card}>
          <Text style={styles.cardTitle}>Statistiques de participation</Text>
          <LineChart
            data={data}
            width={Dimensions.get('window').width - 40}
            height={200}
            chartConfig={{
              backgroundGradientFrom: '#121212',
              backgroundGradientTo: '#121212',
              color: () => `#00ff88`,
              labelColor: () => '#fff',
              propsForDots: {
                r: '4',
                strokeWidth: '2',
                stroke: '#00ff88',
              },
            }}
            bezier
            style={styles.chart}
          />
        </Animated.View>

        <Text style={styles.sectionTitle}>MES ÉQUIPES</Text>
        <View style={styles.teamList}>
          {['U17', 'U15', 'Seniors A'].map((team, i) => (
            <MotiView
              key={i}
              from={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 200 + i * 150 }}
              style={styles.teamCard}
            >
              <Pressable onPress={handleViewTeam}>
                <FontAwesome5 name="users" size={24} color="#00ff88" />
                <Text style={styles.teamText}>{team}</Text>
              </Pressable>
            </MotiView>
          ))}
        </View>

        <Animated.View entering={FadeInDown.delay(600)} style={styles.card}>
          <Text style={styles.cardTitle}>Prochain match</Text>
          <Text style={styles.eventText}>Samedi 15 juin vs Toulon</Text>
          <Text style={styles.eventSubText}>Stade de Toulon · 🌤️ 21°C</Text>
          <Text style={styles.eventPresence}>✅ 15 Présents · ❌ 4 Absents</Text>
        </Animated.View>

        <Text style={styles.sectionTitle}>ACTIONS RAPIDES</Text>
        <View style={styles.actions}>
          {actions.map((btn, i) => (
            <Pressable
              key={i}
              onPress={btn.action}
              style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
            >
              <Ionicons name={btn.icon} size={20} color="#00ff88" />
              <Text style={styles.actionText}>{btn.text}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    marginVertical: 30,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#00ff88',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    color: '#00ff88',
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#ccc',
    fontSize: 14,
    marginTop: 4,
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    padding: 20,
    marginBottom: 25,
    shadowColor: '#00ff88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  cardTitle: {
    color: '#00ff88',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  chart: {
    marginTop: 10,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#00ff88',
    fontWeight: 'bold',
    marginBottom: 12,
    marginLeft: 10,
  },
  teamList: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
  },
  teamCard: {
    backgroundColor: '#222',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    width: 100,
    borderWidth: 1,
    borderColor: '#00ff88',
  },
  teamText: {
    color: '#fff',
    marginTop: 6,
    fontSize: 14,
    textAlign: 'center',
  },
  eventText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
  },
  eventSubText: {
    color: '#ccc',
    marginTop: 4,
  },
  eventPresence: {
    color: '#00ff88',
    marginTop: 10,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: 10,
    gap: 10,
  },
  actionButton: {
    backgroundColor: '#111',
    borderColor: '#00ff88',
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexGrow: 1,
    justifyContent: 'center',
    minWidth: '30%',
  },
  actionButtonPressed: {
    backgroundColor: '#00ff8844',
    transform: [{ scale: 0.98 }],
  },
  actionText: {
    color: '#00ff88',
    fontWeight: '600',
  },
});
