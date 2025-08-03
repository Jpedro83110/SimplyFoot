import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, Pressable, Platform } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

// FIXME: seams not used
export default function NutritionScanner() {
  // --- WEB BLOQUÉ ---
  if (Platform.OS === 'web') {
    return (
      <View style={styles.webContainer}>
        <View style={styles.webIcon}>
          <Text style={{ fontSize: 100, opacity: 0.3 }}>📱</Text>
        </View>
        <Text style={styles.webTitle}>📷 Scanner Nutrition</Text>
        <Text style={styles.webText}>
          Cette fonctionnalité nécessite l'accès à la caméra de votre smartphone.
        </Text>
        <Text style={styles.webSubtext}>
          🚫 <Text style={{ fontWeight: 'bold' }}>Non disponible sur ordinateur</Text>
          {"\n"}
          ✅ <Text style={{ fontWeight: 'bold' }}>Disponible sur l'app mobile</Text>
        </Text>
        <View style={styles.webInstructions}>
          <Text style={styles.webInstructionsTitle}>Pour utiliser le scanner :</Text>
          <Text style={styles.webInstructionsText}>
            1. Ouvrez l'app sur votre téléphone{"\n"}
            2. Allez dans "Scanner Nutrition"{"\n"}
            3. Pointez la caméra vers un code-barres
          </Text>
        </View>
      </View>
    );
  }

  // --- MOBILE UNIQUEMENT ---
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
      console.log(`Code scanné: ${data} (type: ${type})`);
      
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${data}.json`);
      const json = await response.json();
      
      if (json.status === 1) {
        const produit = json.product;
        setProductData({
          nom: produit.product_name,
          nutriscore: produit.nutriscore_grade,
          image: produit.image_front_url,
          code: data,
          marque: produit.brands,
          quantite: produit.quantity,
          ingredients: produit.ingredients_text_fr,
        });
      } else {
        setProductData(null);
        setError("Produit introuvable dans la base OpenFoodFacts.\nEssaie avec un autre article ou vérifie le code-barres.");
      }
    } catch (error) {
      console.error('Erreur API:', error);
      setError("Erreur de connexion à la base OpenFoodFacts.\nVérifie ta connexion internet.");
      setProductData(null);
    } finally {
      setLoading(false);
    }
  };

  const interpreteNutriScore = (score) => {
    if (!score) return "Nutri-Score inconnu pour ce produit.";
    switch (score.toUpperCase()) {
      case 'A': return "✅ Excellent choix pour un sportif !";
      case 'B': return "🟢 Bon choix, tu peux en consommer régulièrement.";
      case 'C': return "🟡 Moyen : consomme avec modération.";
      case 'D': return "🟠 Limite ce produit, surtout avant l'entraînement.";
      case 'E': return "🔴 À éviter, surtout en période de compétition !";
      default: return "Nutri-Score inconnu.";
    }
  };

  const getSportAdvice = (nutriscore) => {
    switch ((nutriscore || '').toUpperCase()) {
      case 'A':
        return "Ce produit est idéal avant ou après l'entraînement pour rester en forme.";
      case 'B':
        return "Parfait en collation ! Évite d'en abuser juste avant un match.";
      case 'C':
        return "À consommer plutôt après le sport ou pendant un repas.";
      case 'D':
        return "Pas top pour l'énergie : privilégie-le rarement, surtout les jours d'entraînement.";
      case 'E':
        return "Produit à éviter pour rester performant sur le terrain ! Préfère des aliments frais.";
      default:
        return "Produit non évalué, privilégie une alimentation variée et équilibrée.";
    }
  };

  const getNutriScoreColor = (score) => {
    switch ((score || '').toUpperCase()) {
      case 'A': return '#00ff88';
      case 'B': return '#85d1ce';
      case 'C': return '#ffd700';
      case 'D': return '#ff8c00';
      case 'E': return '#ff4444';
      default: return '#fff';
    }
  };

  const renderStepMessage = () => {
    if (loading) return "🔍 Recherche des infos nutritionnelles...";
    if (error) return error;
    if (scanned && !productData) return "❌ Aucun produit trouvé. Essaie à nouveau.";
    if (productData) return "✅ Produit analysé !";
    if (!scanned) return "📷 Place le code-barres dans le cadre";
    return '';
  };

  // Vérification des permissions
  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#00ff88" />
        <Text style={styles.text}>Chargement des permissions...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionTitle}>⛔ Accès à la caméra requis</Text>
        <Text style={styles.permissionText}>
          Pour scanner les codes-barres nutritionnels, nous avons besoin d'accéder à la caméra de votre téléphone.
        </Text>
        <Pressable style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>📱 Autoriser l'accès</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.stepMessage}>{renderStepMessage()}</Text>
      
      {/* Caméra + cadre de scan */}
      {!scanned && (
        <View style={styles.cameraWrapper}>
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{
              barCodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'qr'],
            }}
            onBarcodeScanned={handleBarCodeScanned}
          />
          <View style={styles.scanFrame}>
            <View style={styles.scanCorner} />
            <View style={[styles.scanCorner, styles.scanCornerTopRight]} />
            <View style={[styles.scanCorner, styles.scanCornerBottomLeft]} />
            <View style={[styles.scanCorner, styles.scanCornerBottomRight]} />
          </View>
          <Text style={styles.scanTip}>
            💡 Tiens ton téléphone à 20 cm du code-barres
          </Text>
        </View>
      )}

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00ff88" />
          <Text style={styles.loadingText}>Analyse en cours...</Text>
        </View>
      )}

      {/* Résultat détaillé */}
      {productData && !loading && (
        <View style={styles.result}>
          <Text style={styles.title}>{productData.nom || "Nom inconnu"}</Text>
          
          {productData.marque && (
            <Text style={styles.brand}>🏷️ {productData.marque}</Text>
          )}
          
          {productData.quantite && (
            <Text style={styles.quantity}>📦 {productData.quantite}</Text>
          )}
          
          {productData.image && (
            <Image source={{ uri: productData.image }} style={styles.image} />
          )}
          
          <View style={styles.nutriScoreContainer}>
            <Text style={styles.score}>
              Nutri-Score : 
              <Text style={[
                styles.nutriscore,
                { color: getNutriScoreColor(productData.nutriscore) }
              ]}>
                {productData.nutriscore?.toUpperCase() || "?"}
              </Text>
            </Text>
          </View>
          
          <Text style={styles.interpretation}>
            {interpreteNutriScore(productData.nutriscore)}
          </Text>
          
          {productData.ingredients && (
            <Text style={styles.ingredients}>
              <Text style={{ fontWeight: 'bold', color: '#00ff88' }}>🧪 Ingrédients : </Text>
              {productData.ingredients.length > 200 
                ? productData.ingredients.substring(0, 200) + "..."
                : productData.ingredients
              }
            </Text>
          )}
          
          <View style={styles.adviceContainer}>
            <Text style={styles.sportTip}>
              ⚽ {getSportAdvice(productData.nutriscore)}
            </Text>
          </View>
          
          <Pressable
            style={styles.scanAgainButton}
            onPress={() => {
              setProductData(null);
              setScanned(false);
              setError('');
            }}
          >
            <Text style={styles.scanAgainText}>🔄 Scanner un autre produit</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#0f0f0f', 
    justifyContent: 'flex-start', 
    padding: 18 
  },
  webContainer: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  webIcon: {
    marginBottom: 20,
    opacity: 0.4,
  },
  webTitle: {
    fontSize: 28,
    color: '#00ff88',
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  webText: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 24,
  },
  webSubtext: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  webInstructions: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#00ff88',
    maxWidth: 300,
  },
  webInstructionsTitle: {
    fontSize: 16,
    color: '#00ff88',
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  webInstructionsText: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
    textAlign: 'center',
  },
  permissionTitle: {
    fontSize: 24,
    color: '#00ff88',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionText: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  permissionButton: {
    backgroundColor: '#00ff88',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  permissionButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepMessage: {
    color: '#00ff88',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 14,
    marginTop: 10,
    minHeight: 32,
  },
  cameraWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  camera: {
    width: '100%',
    height: Platform.OS === 'ios' ? 340 : 360,
    borderRadius: 16,
    overflow: 'hidden',
    alignSelf: 'center',
    marginBottom: 12,
  },
  scanFrame: {
    position: 'absolute',
    top: '25%',
    left: '25%',
    width: '50%',
    height: '25%',
    borderColor: '#00ff88',
  },
  scanCorner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#00ff88',
    borderWidth: 3,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  scanCornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  scanCornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderTopWidth: 0,
    borderRightWidth: 0,
  },
  scanCornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  scanTip: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 32,
  },
  loadingText: {
    color: '#00ff88',
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },
  result: { 
    alignItems: 'center', 
    marginTop: 18, 
    paddingBottom: 22 
  },
  title: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    marginBottom: 6, 
    color: '#00ff88', 
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  brand: { 
    fontSize: 16, 
    color: '#aaa', 
    marginBottom: 4,
    textAlign: 'center',
  },
  quantity: { 
    fontSize: 15, 
    color: '#bbb', 
    marginBottom: 12,
    textAlign: 'center',
  },
  image: { 
    width: 150, 
    height: 150, 
    resizeMode: 'contain', 
    marginBottom: 15, 
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#333',
  },
  nutriScoreContainer: {
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#00ff88',
    minWidth: 200,
  },
  score: { 
    fontSize: 18, 
    color: '#fff',
    textAlign: 'center',
  },
  nutriscore: { 
    fontWeight: 'bold', 
    fontSize: 24,
    marginLeft: 8,
  },
  interpretation: { 
    fontSize: 16, 
    fontStyle: 'italic', 
    marginBottom: 12, 
    color: '#ccc', 
    textAlign: 'center',
    paddingHorizontal: 15,
    lineHeight: 22,
  },
  ingredients: { 
    fontSize: 13, 
    color: '#ccc', 
    marginBottom: 15, 
    textAlign: 'center',
    paddingHorizontal: 15,
    lineHeight: 18,
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 8,
  },
  adviceContainer: {
    backgroundColor: '#001a33',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#00cfff',
    maxWidth: '90%',
  },
  sportTip: { 
    color: '#00cfff', 
    fontSize: 15, 
    fontStyle: 'italic', 
    textAlign: 'center',
    lineHeight: 20,
  },
  scanAgainButton: {
    backgroundColor: '#00ff88',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  scanAgainText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  text: { 
    color: 'white', 
    textAlign: 'center', 
    marginTop: 50, 
    fontSize: 17 
  },
});
