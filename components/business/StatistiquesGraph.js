// components/StatistiquesGraph.js
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

// FIXME: seams not used
export default function StatistiquesGraph({ data, equipe = 'U17', dateMaj = '15 mai 2025' }) {
    const chartConfig = {
        backgroundGradientFrom: '#1a1a1a',
        backgroundGradientTo: '#1a1a1a',
        decimalPlaces: 0,
        color: (opacity = 1) => `rgba(0, 255, 136, ${opacity})`,
        labelColor: () => '#fff',
        propsForDots: {
            r: '4',
            strokeWidth: '2',
            stroke: '#00ff88',
        },
    };

    return (
        <View>
            <Text style={styles.sub}>Équipe : {equipe}</Text>
            <LineChart
                data={data}
                width={Dimensions.get('window').width - 40}
                height={220}
                chartConfig={chartConfig}
                style={styles.chart}
                bezier
            />
            <Text style={styles.note}>Dernière mise à jour : {dateMaj}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    sub: { color: '#fff', fontSize: 16, marginBottom: 8 },
    chart: { borderRadius: 12, marginBottom: 30 },
    note: { color: '#888', fontSize: 12, textAlign: 'center' },
});
