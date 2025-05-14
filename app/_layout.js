import React from 'react';
import { View, StyleSheet, ImageBackground, StatusBar } from 'react-native';
import { Slot } from 'expo-router';

export default function GlobalLayout() {
  return (
    <ImageBackground
      source={require('../assets/chat.png')} // image de fond personnalisée
      style={styles.container}
      resizeMode="cover"
    >
      <StatusBar barStyle="light-content" />
      <View style={styles.overlay}>
        <Slot />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)', // voile sombre par-dessus le fond
    padding: 20,
  },
});
