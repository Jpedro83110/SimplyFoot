// components/StatGlobalEquipe.js
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';

export default function StatGlobalEquipe({ stats, equipe = 'U17', dateMaj = '15 mai 2025' }) {
  const chartConfig = {
    backgroundGradientFrom: '#0f0f0f',
    backgroundGradientTo: '#0f0f0f',
    fillShadowGradient: '#00ff88',
    fillShadowGradientOpacity: 1,
    color: (opacity = 1) => `rgba(0, 255, 136, ${opacity})`,
    labelColor: () => '#fff',
    propsForLabels: { fontSize: 13, fontWeight: 'bold' },
    propsForBackgroundLines: {
      stroke: '#333',
      strokeDasharray: '',
    },
    barPercentage: 0.6,
  };

  const data = {
    labels: ['Matchs', 'Victoires', 'Nuls', 'Défaites'],
    datasets: [
      {
        data: [stats.matchs || 0, stats.victoires || 0, stats.nuls || 0, stats.defaites || 0],
      },
    ],
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📊 Statistiques Globales - {equipe}</Text>
      <BarChart
        data={data}
        width={Dimensions.get('window').width - 40}
        height={240}
        yAxisLabel=""
        chartConfig={chartConfig}
        style={styles.chart}
        fromZero
        showValuesOnTopOfBars
      />
      <Text style={styles.note}>📅 Données mises à jour le {dateMaj}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    padding: 16,
    marginVertical: 20,
    borderWidth: 2,
    borderColor: '#00ff88',
    shadowColor: '#00ff88',
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  title: {
    fontSize: 18,
    color: '#00ff88',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
  },
  chart: {
    borderRadius: 16,
    marginBottom: 12,
  },
  note: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
  },
});
