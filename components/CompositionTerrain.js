// CompositionTerrain.js - version réaliste avec fond terrain.png et lignes
import React from 'react';
import { View, Text, StyleSheet, ImageBackground, Dimensions } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function CompositionTerrain({ joueurs }) {
  const lignes = {
    gardien: joueurs.filter((j) => j.poste === 'Gardien'),
    defense: joueurs.filter((j) => j.poste === 'Défenseur'),
    milieu: joueurs.filter((j) => j.poste === 'Milieu'),
    attaque: joueurs.filter((j) => j.poste === 'Attaquant'),
  };

  return (
    <ImageBackground
      source={require('../../assets/terrain.png')}
      style={styles.terrain}
      resizeMode="cover"
    >
      {Object.entries(lignes).map(([ligne, joueursLigne]) => (
        <View key={ligne} style={styles.ligne}>
          {joueursLigne.map((j) => (
            <View key={j.id} style={styles.joueur}>
              <Text style={styles.joueurNom}>{j.nom}</Text>
              <Text style={styles.joueurPoste}>{j.poste}</Text>
            </View>
          ))}
        </View>
      ))}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  terrain: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingVertical: 20,
  },
  ligne: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 10,
    paddingVertical: 5,
  },
  joueur: {
    backgroundColor: '#00ff88cc',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 40,
    shadowColor: '#00ff88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
    alignItems: 'center',
  },
  joueurNom: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14,
  },
  joueurPoste: {
    color: '#111',
    fontSize: 10,
    opacity: 0.6,
  },
});