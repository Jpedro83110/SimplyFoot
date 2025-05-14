// CompositionDragDrop.js - version split visuelle : terrain collé à gauche + icônes plus petites
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  Animated,
  Image,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

const initialPositions = {
  1: { x: 20, y: 30 },
  2: { x: 80, y: 100 },
  3: { x: 200, y: 100 },
  4: { x: 80, y: 170 },
  5: { x: 200, y: 170 },
  6: { x: 120, y: 240 },
};

export default function CompositionDragDrop() {
  const [players] = useState([
    { id: 1, nom: 'Jean', poste: 'Gardien' },
    { id: 2, nom: 'Paul', poste: 'Défenseur' },
    { id: 3, nom: 'Max', poste: 'Défenseur' },
    { id: 4, nom: 'Alex', poste: 'Milieu' },
    { id: 5, nom: 'Léo', poste: 'Milieu' },
    { id: 6, nom: 'Yanis', poste: 'Attaquant' },
  ]);

  const [positions] = useState(
    players.reduce((acc, p) => {
      acc[p.id] = new Animated.ValueXY(initialPositions[p.id]);
      return acc;
    }, {})
  );

  const createPanResponder = (playerId) =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        positions[playerId].setOffset({
          x: positions[playerId].x._value,
          y: positions[playerId].y._value,
        });
        positions[playerId].setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: positions[playerId].x, dy: positions[playerId].y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: () => {
        positions[playerId].flattenOffset();
      },
    });

  const handleValider = () => {
    Alert.alert('✅ Composition validée', 'Les positions ont été sauvegardées (simulation).');
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.titre}>📋 Composition d'équipe</Text>
      <View style={styles.haut}>
        <Image
          source={require('../assets/terrain.png')}
          style={styles.terrain}
          resizeMode="contain"
        />
        <View style={styles.joueurOverlay}>
          {players.map((player) => {
            const panResponder = createPanResponder(player.id);
            return (
              <Animated.View
                key={player.id}
                style={[styles.joueur, positions[player.id].getLayout()]}
                {...panResponder.panHandlers}
              >
                <Text style={styles.joueurNom}>{player.nom}</Text>
                <Text style={styles.joueurPoste}>{player.poste}</Text>
              </Animated.View>
            );
          })}
        </View>
      </View>

      <View style={styles.bas}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {players.map((player) => (
            <View key={player.id} style={styles.bulle}>
              <Text style={styles.bulleText}>{player.nom}</Text>
              <Text style={styles.bullePoste}>{player.poste}</Text>
            </View>
          ))}
        </ScrollView>
        <TouchableOpacity style={styles.bouton} onPress={handleValider}>
          <Text style={styles.boutonText}>Valider</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#000',
  },
  titre: {
    color: '#00ff88',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingTop: 20,
    paddingBottom: 10,
  },
  haut: {
    flex: 1,
    alignItems: 'flex-start',
    position: 'relative',
  },
  terrain: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.5,
    alignSelf: 'flex-start',
  },
  joueurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  joueur: {
    position: 'absolute',
    width: 40,
    height: 24,
    backgroundColor: '#00c896',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00ff88',
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 10,
    padding: 2,
  },
  joueurNom: {
    color: '#000',
    fontWeight: '700',
    fontSize: 10,
  },
  joueurPoste: {
    color: '#111',
    fontSize: 6,
    opacity: 0.6,
  },
  bas: {
    backgroundColor: '#111',
    paddingVertical: 12,
    borderTopColor: '#00ff88',
    borderTopWidth: 1,
    paddingBottom: 30,
  },
  bulle: {
    backgroundColor: '#00c896',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  bulleText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 10,
  },
  bullePoste: {
    color: '#111',
    fontSize: 6,
    opacity: 0.7,
    marginTop: 1,
  },
  bouton: {
    marginTop: 12,
    alignSelf: 'center',
    backgroundColor: '#00ff88',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 30,
    elevation: 6,
  },
  boutonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14,
  },
});