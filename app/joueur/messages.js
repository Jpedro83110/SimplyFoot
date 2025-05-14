import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';

export default function Messages() {
  const messages = [
    { id: 1, from: 'Coach John', text: 'Rappel : entraînement à 17h demain.' },
    { id: 2, from: 'Coach John', text: 'Match contre Team A à 15h samedi.' },
  ];

  const handleRead = (msg) => {
    Alert.alert(`📩 Message de ${msg.from}`, msg.text);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>📨 Mes Messages</Text>

      {messages.map((msg) => (
        <View key={msg.id} style={styles.card}>
          <Text style={styles.cardFrom}>De : {msg.from}</Text>
          <Text style={styles.cardText}>{msg.text.slice(0, 50)}...</Text>

          <TouchableOpacity
            style={styles.button}
            onPress={() => handleRead(msg)}
          >
            <Text style={styles.buttonText}>Lire plus</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#121212',
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00ff88',
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#1e1e1e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#00ff88',
  },
  cardFrom: {
    color: '#00ff88',
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 5,
  },
  cardText: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 12,
  },
  button: {
    alignSelf: 'flex-start',
    backgroundColor: '#00ff88',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  buttonText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 14,
  },
});
