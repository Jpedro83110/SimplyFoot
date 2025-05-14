import React from 'react';
import { View, StyleSheet } from 'react-native';
import CompositionDragDrop from '../../components/CompositionDragDrop';

export default function Composition() {
  return (
    <View style={styles.container}>
      <CompositionDragDrop />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
