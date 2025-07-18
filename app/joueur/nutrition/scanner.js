import React from 'react';
import { View, Text, StyleSheet, Platform, Pressable } from 'react-native';

// Importez le vrai scanner
import NutritionScannerReal from './NutritionScannerReal';

export default function NutritionScanner() {
  // FLAG de sécurité - changez à true pour tester
  const SCANNER_ENABLED = true;
  
  console.log('NutritionScanner - Platform:', Platform.OS, 'Enabled:', SCANNER_ENABLED);
  
  // Placeholder - Votre app reste sûre
  if (Platform.OS === 'web' || !SCANNER_ENABLED) {
    return (
      <View style={styles.container}>
        <Text style={styles.emoji}>🥗</Text>
        <Text style={styles.title}>Scan nutrition</Text>
        <Text style={styles.text}>
          Notre scanner nutritionnel arrive bientôt sur SimplyFoot !
          {"\n\n"}
          Tu pourras bientôt scanner n'importe quel aliment ou boisson
          pour connaître leur Nutri-Score, avoir des conseils personnalisés et améliorer ta récupération.
        </Text>
        
        {/* Bouton de test pour développement */}
        {__DEV__ && Platform.OS !== 'web' && (
          <Pressable 
            style={styles.devButton}
            onPress={() => console.log('🔧 Pour activer: changez SCANNER_ENABLED à true')}
          >
            <Text style={styles.devButtonText}>🔧 Scanner désactivé - Mode DEV</Text>
          </Pressable>
        )}
        
        <Text style={styles.footer}>
          🚀 Reste connecté, on te prévient dès que la fonctionnalité est dispo !
        </Text>
      </View>
    );
  }

  // Le vrai scanner (quand activé)
  return <NutritionScannerReal />;
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#101822', 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 22 
  },
  emoji: { 
    fontSize: 54, 
    marginBottom: 14 
  },
  title: { 
    fontSize: 26, 
    fontWeight: 'bold', 
    color: '#00ff88', 
    marginBottom: 18, 
    textAlign: 'center' 
  },
  text: { 
    color: '#e6ffe7', 
    fontSize: 16, 
    textAlign: 'center', 
    lineHeight: 25, 
    opacity: 0.9,
    marginBottom: 20,
  },
  footer: {
    color: '#00ff88',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  devButton: {
    backgroundColor: '#333',
    padding: 10,
    borderRadius: 8,
    marginVertical: 15,
    borderWidth: 1,
    borderColor: '#666',
  },
  devButtonText: {
    color: '#ffa500',
    fontSize: 12,
    textAlign: 'center',
  },
});