import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function NutritionScanner() {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🥗</Text>
      <Text style={styles.title}>Scan nutrition</Text>
      <Text style={styles.text}>
        Notre scanner nutritionnel arrive bientôt sur SimplyFoot !
        {"\n\n"}
        Tu pourras bientôt scanner n’importe quel aliment ou boisson
        pour connaître leur Nutri-Score, avoir des conseils personnalisés et améliorer ta récupération.
        {"\n\n"}
        🚀 Reste connecté, on te prévient dès que la fonctionnalité est dispo !
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#101822', justifyContent: 'center', alignItems: 'center', padding: 22 },
  emoji: { fontSize: 54, marginBottom: 14 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#00ff88', marginBottom: 18, textAlign: 'center' },
  text: { color: '#e6ffe7', fontSize: 16, textAlign: 'center', lineHeight: 25, opacity: 0.9 },
});
