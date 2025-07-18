import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, Pressable, Platform } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function NutritionScannerReal() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [productData, setProductData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

  const handleBarCodeScanned = async ({ type, data }) => {
    if (scanned) return;
    
    setScanned(true);
    setLoading(true);
    setError('');
    
    try {
      console.log(`Code scanné: ${data}`);
      
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${data}.json`);
      const json = await response.json();
      
      if (json.status === 1) {
        const produit = json.product;
        setProductData({
          nom: produit.product_name,
          nutriscore: produit.nutriscore_grade,
          marque: produit.brands,
        });
      } else {
        setProductData(null);
        setError("Produit introuvable");
      }
    } catch (error) {
      console.error('Erreur API:', error);
      setError("Erreur de connexion");
      setProductData(null);
    } finally {
      setLoading(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Chargement...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Autorisation caméra requise</Text>
        <Pressable style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Autoriser</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.stepMessage}>
        {loading ? "Recherche..." : scanned ? "Produit scanné !" : "Scannez un code-barres"}
      </Text>
      
      {!scanned && (
        <CameraView
          style={styles.camera}
          facing="back"
          barcodeScannerSettings={{
            barCodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'],
          }}
          onBarcodeScanned={handleBarCodeScanned}
        />
      )}

      {loading && <ActivityIndicator size="large" color="#00ff88" />}

      {productData && (
        <View style={styles.result}>
          <Text style={styles.title}>{productData.nom || "Produit"}</Text>
          <Text style={styles.brand}>{productData.marque}</Text>
          <Text style={styles.score}>Nutri-Score: {productData.nutriscore || "?"}</Text>
          
          <Pressable
            style={styles.button}
            onPress={() => {
              setProductData(null);
              setScanned(false);
              setError('');
            }}
          >
            <Text style={styles.buttonText}>Scanner un autre</Text>
          </Pressable>
        </View>
      )}

      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#101822', padding: 20 },
  stepMessage: { color: '#00ff88', fontSize: 18, textAlign: 'center', marginBottom: 20 },
  camera: { flex: 1, borderRadius: 10, marginBottom: 20 },
  result: { alignItems: 'center', padding: 20, backgroundColor: '#1a1a1a', borderRadius: 10 },
  title: { fontSize: 20, color: '#00ff88', fontWeight: 'bold', marginBottom: 10 },
  brand: { fontSize: 16, color: '#fff', marginBottom: 5 },
  score: { fontSize: 16, color: '#fff', marginBottom: 20 },
  button: { backgroundColor: '#00ff88', padding: 15, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
  text: { color: '#fff', fontSize: 16, textAlign: 'center' },
  error: { color: '#ff4444', fontSize: 16, textAlign: 'center', marginTop: 10 },
});