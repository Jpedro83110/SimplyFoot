import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, Button, Platform } from 'react-native';

export default function NutritionScanner() {
  // --- WEB Fallback ---
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>
          🚫 Le scan nutrition n’est pas disponible sur la version web.{"\n"}
          Merci d’utiliser l’application sur un smartphone !
        </Text>
      </View>
    );
  }

  // --- MOBILE ONLY ---
  // On déclare les hooks en avance, mais on importera les modules caméra dynamiquement.
  const [Camera, setCamera] = useState(null);
  const [useCameraDevices, setUseCameraDevices] = useState(null);
  const [useScanBarcodes, setUseScanBarcodes] = useState(null);
  const [BarcodeFormat, setBarcodeFormat] = useState(null);

  // États du scanner (identique)
  const [hasPermission, setHasPermission] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [productData, setProductData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const camera = useRef(null);

  // On importe dynamiquement les modules natifs après le check web
  useEffect(() => {
    let isMounted = true;
    (async () => {
      if (Platform.OS !== 'web') {
        // Dynamically import the camera modules
        const vc = await import('react-native-vision-camera');
        const sc = await import('vision-camera-code-scanner');
        if (isMounted) {
          setCamera(() => vc.Camera);
          setUseCameraDevices(() => vc.useCameraDevices);
          setUseScanBarcodes(() => sc.useScanBarcodes);
          setBarcodeFormat(() => sc.BarcodeFormat);
        }
      }
    })();
    return () => { isMounted = false; };
  }, []);

  // Quand les hooks sont chargés, on peut continuer
  if (!Camera || !useCameraDevices || !useScanBarcodes || !BarcodeFormat) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#00ff88" style={{ marginTop: 32 }} />
      </View>
    );
  }

  // ... Reste de la logique du scanner (identique à avant)
  const devices = useCameraDevices();
  const device = devices.back;

  const [frameProcessor, barcodes] = useScanBarcodes([
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.UPC_A,
    BarcodeFormat.UPC_E,
  ]);

  useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === 'authorized');
    })();
  }, [Camera]);

  useEffect(() => {
    if (!scanned && barcodes && barcodes.length > 0) {
      const barcodeValue = barcodes[0]?.rawValue;
      if (barcodeValue) {
        handleBarCodeScanned(barcodeValue);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barcodes]);

  const handleBarCodeScanned = async (data) => {
    setScanned(true);
    setLoading(true);
    setError('');
    try {
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
      case 'D': return "🟠 Limite ce produit, surtout avant l’entraînement.";
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

  const renderStepMessage = () => {
    if (loading) return "Recherche des infos nutritionnelles...";
    if (error) return error;
    if (scanned && !productData) return "Aucun produit trouvé. Essaie à nouveau.";
    if (productData) return "Produit analysé !";
    if (!scanned) return "Place le code-barres dans le cadre et attends quelques secondes.";
    return '';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.stepMessage}>{renderStepMessage()}</Text>
      {/* Caméra + cadre de scan */}
      {!scanned && hasPermission && device && (
        <View style={styles.cameraWrapper}>
          <Camera
            ref={camera}
            style={styles.camera}
            device={device}
            isActive={!scanned}
            frameProcessor={frameProcessor}
            frameProcessorFps={6}
          />
          <Text style={styles.scanTip}>
            📷 Astuce : tiens ton téléphone à 20 cm du code-barres pour une détection optimale.
          </Text>
        </View>
      )}

      {loading && (
        <ActivityIndicator size="large" color="#00ff88" style={{ marginTop: 32 }} />
      )}

      {/* Résultat détaillé */}
      {productData && !loading && (
        <View style={styles.result}>
          <Text style={styles.title}>{productData.nom || "Nom inconnu"}</Text>
          {productData.marque && (
            <Text style={styles.brand}>{`Marque : ${productData.marque}`}</Text>
          )}
          {productData.quantite && (
            <Text style={styles.quantity}>{`Quantité : ${productData.quantite}`}</Text>
          )}
          {productData.image && (
            <Image source={{ uri: productData.image }} style={styles.image} />
          )}
          <Text style={styles.score}>
            Nutri-Score : <Text style={styles.nutriscore}>{productData.nutriscore?.toUpperCase() || "?"}</Text>
          </Text>
          <Text style={styles.interpretation}>
            {interpreteNutriScore(productData.nutriscore)}
          </Text>
          {productData.ingredients && (
            <Text style={styles.ingredients}>
              <Text style={{ fontWeight: 'bold' }}>Ingrédients : </Text>
              {productData.ingredients}
            </Text>
          )}
          <Text style={styles.sportTip}>
            {getSportAdvice(productData.nutriscore)}
          </Text>
          <Button
            title="Scanner un autre produit"
            onPress={() => {
              setProductData(null);
              setScanned(false);
              setError('');
            }}
            color="#00ff88"
          />
        </View>
      )}

      {/* Permissions caméra non accordées */}
      {!hasPermission && Platform.OS !== 'web' && (
        <View style={{ marginTop: 60 }}>
          <Text style={styles.text}>⛔ Pas d'accès à la caméra</Text>
          <Text style={[styles.text, { fontSize: 15, color: '#ff8888', marginTop: 8 }]}>
            Pour utiliser le scanner, active l'accès à la caméra dans les réglages du téléphone.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f', justifyContent: 'flex-start', padding: 18 },
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
  },
  camera: {
    width: '100%',
    height: Platform.OS === 'ios' ? 340 : 360,
    borderRadius: 16,
    overflow: 'hidden',
    alignSelf: 'center',
    marginBottom: 12,
  },
  scanTip: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  result: { alignItems: 'center', marginTop: 18, paddingBottom: 22 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 6, color: '#00ff88', textAlign: 'center' },
  brand: { fontSize: 16, color: '#aaa', marginBottom: 2 },
  quantity: { fontSize: 15, color: '#bbb', marginBottom: 7 },
  image: { width: 150, height: 150, resizeMode: 'contain', marginBottom: 9, borderRadius: 10 },
  score: { fontSize: 18, marginBottom: 3, color: '#fff' },
  nutriscore: { fontWeight: 'bold', fontSize: 19, color: '#00ff88' },
  interpretation: { fontSize: 16, fontStyle: 'italic', marginBottom: 8, color: '#ccc', textAlign: 'center' },
  ingredients: { fontSize: 13, color: '#ccc', marginBottom: 14, textAlign: 'center' },
  sportTip: { color: '#00cfff', fontSize: 15, marginBottom: 15, fontStyle: 'italic', textAlign: 'center' },
  text: { color: 'white', textAlign: 'center', marginTop: 50, fontSize: 17 },
});
