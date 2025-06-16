// 📁 components/ChartPie.js
import React from 'react';
import { Platform } from 'react-native';

let VictoryPie;
try {
  if (Platform.OS === 'web') {
    // Utiliser 'victory' pour le web
    VictoryPie = require('victory').VictoryPie;
  } else {
    // Utiliser 'victory-native' pour mobile
    VictoryPie = require('victory-native').VictoryPie;
  }
} catch (e) {
  console.warn('❌ Erreur chargement VictoryPie :', e);
  VictoryPie = null;
}

export default function ChartPie(props) {
  if (!VictoryPie) {
    return (
      <Text style={{ color: 'red', textAlign: 'center' }}>
        Graphique indisponible : dépendance Victory non chargée.
      </Text>
    );
  }

  return <VictoryPie {...props} />;
}
