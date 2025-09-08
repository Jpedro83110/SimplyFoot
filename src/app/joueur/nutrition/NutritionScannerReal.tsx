import { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    ActivityIndicator,
    Pressable,
    ScrollView,
} from 'react-native';
import { BarcodeScanningResult, CameraView, useCameraPermissions } from 'expo-camera';

// FIXME: a extraire dans un fichier de types / revoir la feature
interface ProductInfo {
    nom: string;
    marque: string;
    quantite: string;
    code: string;
    image?: string;
    nutriscore?: string;
    ecoscore?: string;
    nova?: number;
    nutrition: {
        calories?: number | null;
        proteines?: number | null;
        glucides?: number | null;
        lipides?: number | null;
        fibres?: number | null;
        sucres?: number | null;
        sel?: number | null;
        sodium?: number | null;
    };
    ingredients: string;
    allergenes: string[];
    labels: string[];
    categories: string[];
}

export default function NutritionScannerReal() {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [productData, setProductData] = useState<ProductInfo | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!permission) {
            requestPermission();
        }
    }, [permission, requestPermission]);

    const handleBarCodeScanned = async ({ data }: BarcodeScanningResult) => {
        if (scanned) {
            return;
        }

        setScanned(true);
        setLoading(true);
        setError('');

        try {
            console.log(`Code scanné: ${data}`);

            const response = await fetch(
                `https://world.openfoodfacts.org/api/v0/product/${data}.json`,
            );
            const json = await response.json();

            if (json.status === 1) {
                const produit = json.product;

                // Extraction complète des données
                const productInfo = {
                    // Infos de base
                    nom: produit.product_name || produit.product_name_fr || 'Nom inconnu',
                    marque: produit.brands || 'Marque inconnue',
                    quantite: produit.quantity || 'Quantité non précisée',
                    code: data,

                    // Image
                    image: produit.image_front_url || produit.image_url,

                    // Nutri-Score et scores
                    nutriscore: produit.nutriscore_grade,
                    ecoscore: produit.ecoscore_grade,
                    nova: produit.nova_group,

                    // Valeurs nutritionnelles (pour 100g)
                    nutrition: {
                        calories:
                            produit.nutriments?.['energy-kcal_100g'] ||
                            produit.nutriments?.['energy-kcal'] ||
                            null,
                        proteines:
                            produit.nutriments?.['proteins_100g'] ||
                            produit.nutriments?.proteins ||
                            null,
                        glucides:
                            produit.nutriments?.['carbohydrates_100g'] ||
                            produit.nutriments?.carbohydrates ||
                            null,
                        lipides:
                            produit.nutriments?.['fat_100g'] || produit.nutriments?.fat || null,
                        fibres:
                            produit.nutriments?.['fiber_100g'] || produit.nutriments?.fiber || null,
                        sucres:
                            produit.nutriments?.['sugars_100g'] ||
                            produit.nutriments?.sugars ||
                            null,
                        sel: produit.nutriments?.['salt_100g'] || produit.nutriments?.salt || null,
                        sodium:
                            produit.nutriments?.['sodium_100g'] ||
                            produit.nutriments?.sodium ||
                            null,
                    },

                    // Ingrédients et allergènes
                    ingredients:
                        produit.ingredients_text_fr ||
                        produit.ingredients_text ||
                        'Ingrédients non disponibles',
                    allergenes: produit.allergens_tags || [],

                    // Labels et certifications
                    labels: produit.labels_tags || [],
                    categories: produit.categories_tags || [],
                };

                setProductData(productInfo);
            } else {
                setProductData(null);
                setError(
                    'Produit introuvable dans la base OpenFoodFacts.\nVérifiez le code-barres ou essayez un autre produit.',
                );
            }
        } catch (error) {
            console.error('Erreur API:', error);
            setError(
                'Erreur de connexion à la base de données.\nVérifiez votre connexion internet.',
            );
            setProductData(null);
        } finally {
            setLoading(false);
        }
    };

    // Fonctions d'analyse pour footballeurs
    const getNutriScoreColor = (score?: string) => {
        switch ((score || '').toUpperCase()) {
            case 'A':
                return '#00ff88';
            case 'B':
                return '#85d1ce';
            case 'C':
                return '#ffd700';
            case 'D':
                return '#ff8c00';
            case 'E':
                return '#ff4444';
            default:
                return '#666';
        }
    };

    const getFootballAdvice = (product: ProductInfo) => {
        const { nutriscore, nutrition } = product;
        // const calories = nutrition.calories; // FIXME: not used
        const proteines = nutrition.proteines;
        const glucides = nutrition.glucides;
        const sucres = nutrition.sucres;

        let advice = {
            timing: 'À éviter',
            performance: 'Neutre',
            color: '#ff4444',
            icon: '⚠️',
        };

        // Analyse basée sur le Nutri-Score et les macros
        if (nutriscore === 'A' || nutriscore === 'a') {
            advice = {
                timing: "Idéal avant et après l'entraînement",
                performance: 'Excellent pour la performance',
                color: '#00ff88',
                icon: '⭐',
            };
        } else if (nutriscore === 'B' || nutriscore === 'b') {
            if (proteines && proteines >= 10) {
                advice = {
                    timing: "Parfait après l'entraînement pour la récupération",
                    performance: 'Bon pour développer les muscles',
                    color: '#85d1ce',
                    icon: '💪',
                };
            } else if (glucides && glucides >= 15) {
                advice = {
                    timing: "Bien avant l'entraînement pour l'énergie",
                    performance: "Bonne source d'énergie",
                    color: '#85d1ce',
                    icon: '⚡',
                };
            } else {
                advice = {
                    timing: 'Consommation modérée recommandée',
                    performance: 'Correct en collation',
                    color: '#85d1ce',
                    icon: '👍',
                };
            }
        } else if (nutriscore === 'C' || nutriscore === 'c') {
            advice = {
                timing: 'Occasionnellement, loin des entraînements',
                performance: 'Impact modéré sur les performances',
                color: '#ffd700',
                icon: '⚖️',
            };
        } else {
            if (sucres && sucres >= 15) {
                advice = {
                    timing: 'Éviter avant les matchs - risque de pic glycémique',
                    performance: 'Peut nuire aux performances',
                    color: '#ff8c00',
                    icon: '📉',
                };
            } else {
                advice = {
                    timing: "À limiter fortement dans l'alimentation sportive",
                    performance: 'Déconseillé pour les sportifs',
                    color: '#ff4444',
                    icon: '❌',
                };
            }
        }

        return advice;
    };

    const formatNutrition = (value?: number | null) => {
        if (!value) {
            return 'N/A';
        }
        return value < 1 ? `${(value * 1000).toFixed(0)}mg` : `${value.toFixed(1)}g`;
    };

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
                <Text style={styles.permissionTitle}>📷 Autorisation caméra requise</Text>
                <Text style={styles.permissionText}>
                    Pour scanner les codes-barres nutritionnels, nous avons besoin d&apos;accéder à
                    la caméra.
                </Text>
                <Pressable style={styles.permissionButton} onPress={requestPermission}>
                    <Text style={styles.permissionButtonText}>Autoriser l&apos;accès</Text>
                </Pressable>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.stepMessage}>
                {loading
                    ? '🔍 Analyse nutritionnelle...'
                    : scanned
                      ? '✅ Produit analysé !'
                      : '📷 Scannez un code-barres'}
            </Text>

            {/* Caméra */}
            {!scanned && (
                <View style={styles.cameraWrapper}>
                    <CameraView
                        style={styles.camera}
                        facing="back"
                        barcodeScannerSettings={{
                            barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128'],
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
                        💡 Tenez votre téléphone à 20cm du code-barres
                    </Text>
                </View>
            )}

            {/* Loading */}
            {loading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#00ff88" />
                    <Text style={styles.loadingText}>Analyse en cours...</Text>
                </View>
            )}

            {/* Résultats complets */}
            {productData && !loading && (
                <View style={styles.resultContainer}>
                    {/* En-tête produit */}
                    <View style={styles.productHeader}>
                        {productData.image && (
                            <Image
                                source={{ uri: productData.image }}
                                style={styles.productImage}
                            />
                        )}
                        <View style={styles.productInfo}>
                            <Text style={styles.productName}>{productData.nom}</Text>
                            <Text style={styles.productBrand}>🏷️ {productData.marque}</Text>
                            <Text style={styles.productQuantity}>📦 {productData.quantite}</Text>
                        </View>
                    </View>

                    {/* Scores */}
                    <View style={styles.scoresContainer}>
                        <View
                            style={[
                                styles.scoreCard,
                                { borderColor: getNutriScoreColor(productData.nutriscore) },
                            ]}
                        >
                            <Text style={styles.scoreLabel}>Nutri-Score</Text>
                            <Text
                                style={[
                                    styles.scoreValue,
                                    { color: getNutriScoreColor(productData.nutriscore) },
                                ]}
                            >
                                {productData.nutriscore?.toUpperCase() || '?'}
                            </Text>
                        </View>
                        {productData.ecoscore && (
                            <View style={styles.scoreCard}>
                                <Text style={styles.scoreLabel}>Eco-Score</Text>
                                <Text style={styles.scoreValue}>
                                    {productData.ecoscore.toUpperCase()}
                                </Text>
                            </View>
                        )}
                        {productData.nova && (
                            <View style={styles.scoreCard}>
                                <Text style={styles.scoreLabel}>NOVA</Text>
                                <Text style={styles.scoreValue}>{productData.nova}</Text>
                            </View>
                        )}
                    </View>

                    {/* Conseils Football */}
                    {(() => {
                        const advice = getFootballAdvice(productData);
                        return (
                            <View
                                style={[styles.adviceContainer, { borderLeftColor: advice.color }]}
                            >
                                <Text style={styles.adviceTitle}>⚽ Conseils Football</Text>
                                <Text style={[styles.adviceIcon, { color: advice.color }]}>
                                    {advice.icon}
                                </Text>
                                <Text style={styles.adviceTiming}>{advice.timing}</Text>
                                <Text style={[styles.advicePerformance, { color: advice.color }]}>
                                    {advice.performance}
                                </Text>
                            </View>
                        );
                    })()}

                    {/* Valeurs nutritionnelles */}
                    <View style={styles.nutritionContainer}>
                        <Text style={styles.sectionTitle}>
                            📊 Valeurs nutritionnelles (pour 100g)
                        </Text>
                        <View style={styles.nutritionGrid}>
                            <View style={styles.nutritionItem}>
                                <Text style={styles.nutritionLabel}>Calories</Text>
                                <Text style={styles.nutritionValue}>
                                    {productData.nutrition.calories
                                        ? `${productData.nutrition.calories} kcal`
                                        : 'N/A'}
                                </Text>
                            </View>
                            <View style={styles.nutritionItem}>
                                <Text style={styles.nutritionLabel}>Protéines</Text>
                                <Text style={styles.nutritionValue}>
                                    {formatNutrition(productData.nutrition.proteines)}
                                </Text>
                            </View>
                            <View style={styles.nutritionItem}>
                                <Text style={styles.nutritionLabel}>Glucides</Text>
                                <Text style={styles.nutritionValue}>
                                    {formatNutrition(productData.nutrition.glucides)}
                                </Text>
                            </View>
                            <View style={styles.nutritionItem}>
                                <Text style={styles.nutritionLabel}>Lipides</Text>
                                <Text style={styles.nutritionValue}>
                                    {formatNutrition(productData.nutrition.lipides)}
                                </Text>
                            </View>
                            <View style={styles.nutritionItem}>
                                <Text style={styles.nutritionLabel}>Fibres</Text>
                                <Text style={styles.nutritionValue}>
                                    {formatNutrition(productData.nutrition.fibres)}
                                </Text>
                            </View>
                            <View style={styles.nutritionItem}>
                                <Text style={styles.nutritionLabel}>Sucres</Text>
                                <Text style={styles.nutritionValue}>
                                    {formatNutrition(productData.nutrition.sucres)}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Ingrédients */}
                    <View style={styles.ingredientsContainer}>
                        <Text style={styles.sectionTitle}>🧪 Ingrédients</Text>
                        <Text style={styles.ingredientsText}>
                            {productData.ingredients.length > 300
                                ? productData.ingredients.substring(0, 300) + '...'
                                : productData.ingredients}
                        </Text>
                    </View>

                    {/* Allergènes */}
                    {productData.allergenes.length > 0 && (
                        <View style={styles.allergenesContainer}>
                            <Text style={styles.sectionTitle}>⚠️ Allergènes</Text>
                            <Text style={styles.allergenesText}>
                                {productData.allergenes.map((a) => a.replace('en:', '')).join(', ')}
                            </Text>
                        </View>
                    )}

                    {/* Bouton scanner à nouveau */}
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

            {/* Erreur */}
            {error && (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <Pressable
                        style={styles.retryButton}
                        onPress={() => {
                            setError('');
                            setScanned(false);
                        }}
                    >
                        <Text style={styles.retryText}>Réessayer</Text>
                    </Pressable>
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#101822',
    },
    stepMessage: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#00ff88',
        textAlign: 'center',
        margin: 20,
    },
    cameraWrapper: {
        position: 'relative',
        height: 300,
        margin: 20,
        borderRadius: 15,
        overflow: 'hidden',
    },
    camera: {
        flex: 1,
    },
    scanFrame: {
        position: 'absolute',
        top: 50,
        left: 50,
        right: 50,
        bottom: 50,
    },
    scanCorner: {
        position: 'absolute',
        width: 20,
        height: 20,
        borderColor: '#00ff88',
        borderWidth: 3,
        borderTopLeftRadius: 3,
        top: 0,
        left: 0,
        borderRightWidth: 0,
        borderBottomWidth: 0,
    },
    scanCornerTopRight: {
        top: 0,
        right: 0,
        left: 'auto',
        borderRightWidth: 3,
        borderLeftWidth: 0,
        borderTopRightRadius: 3,
        borderTopLeftRadius: 0,
    },
    scanCornerBottomLeft: {
        bottom: 0,
        top: 'auto',
        borderBottomWidth: 3,
        borderTopWidth: 0,
        borderBottomLeftRadius: 3,
        borderTopLeftRadius: 0,
    },
    scanCornerBottomRight: {
        bottom: 0,
        right: 0,
        top: 'auto',
        left: 'auto',
        borderBottomWidth: 3,
        borderRightWidth: 3,
        borderTopWidth: 0,
        borderLeftWidth: 0,
        borderBottomRightRadius: 3,
        borderTopLeftRadius: 0,
    },
    scanTip: {
        position: 'absolute',
        bottom: 10,
        left: 0,
        right: 0,
        textAlign: 'center',
        color: '#fff',
        fontSize: 12,
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: 5,
    },
    loadingContainer: {
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        color: '#00ff88',
        fontSize: 16,
        marginTop: 10,
    },
    resultContainer: {
        padding: 20,
    },
    productHeader: {
        flexDirection: 'row',
        backgroundColor: '#1a2332',
        padding: 15,
        borderRadius: 12,
        marginBottom: 15,
    },
    productImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
        marginRight: 15,
    },
    productInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    productName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 5,
    },
    productBrand: {
        fontSize: 14,
        color: '#00ff88',
        marginBottom: 3,
    },
    productQuantity: {
        fontSize: 12,
        color: '#aaa',
    },
    scoresContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    scoreCard: {
        backgroundColor: '#1a2332',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        flex: 1,
        marginHorizontal: 3,
        borderWidth: 2,
    },
    scoreLabel: {
        fontSize: 12,
        color: '#aaa',
        marginBottom: 5,
    },
    scoreValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    adviceContainer: {
        backgroundColor: '#1a2332',
        padding: 15,
        borderRadius: 12,
        marginBottom: 15,
        borderLeftWidth: 4,
    },
    adviceTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#00ff88',
        marginBottom: 10,
    },
    adviceIcon: {
        fontSize: 24,
        textAlign: 'center',
        marginBottom: 8,
    },
    adviceTiming: {
        fontSize: 14,
        color: '#fff',
        marginBottom: 5,
        fontWeight: '500',
    },
    advicePerformance: {
        fontSize: 13,
        fontStyle: 'italic',
    },
    nutritionContainer: {
        backgroundColor: '#1a2332',
        padding: 15,
        borderRadius: 12,
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#00ff88',
        marginBottom: 12,
    },
    nutritionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    nutritionItem: {
        width: '50%',
        paddingVertical: 8,
        paddingHorizontal: 5,
    },
    nutritionLabel: {
        fontSize: 12,
        color: '#aaa',
        marginBottom: 2,
    },
    nutritionValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#fff',
    },
    ingredientsContainer: {
        backgroundColor: '#1a2332',
        padding: 15,
        borderRadius: 12,
        marginBottom: 15,
    },
    ingredientsText: {
        fontSize: 13,
        color: '#e6ffe7',
        lineHeight: 18,
    },
    allergenesContainer: {
        backgroundColor: '#2d1810',
        padding: 15,
        borderRadius: 12,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#ff8c00',
    },
    allergenesText: {
        fontSize: 13,
        color: '#ff8c00',
        fontWeight: '500',
    },
    scanAgainButton: {
        backgroundColor: '#00ff88',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
    },
    scanAgainText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#101822',
    },
    errorContainer: {
        backgroundColor: '#2d1010',
        padding: 20,
        margin: 20,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#ff4444',
        alignItems: 'center',
    },
    errorText: {
        fontSize: 14,
        color: '#ff4444',
        textAlign: 'center',
        marginBottom: 15,
        lineHeight: 20,
    },
    retryButton: {
        backgroundColor: '#ff4444',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    retryText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    // Styles pour les permissions
    text: {
        color: '#e6ffe7',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 10,
    },
    permissionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#00ff88',
        textAlign: 'center',
        marginBottom: 15,
    },
    permissionText: {
        fontSize: 16,
        color: '#e6ffe7',
        textAlign: 'center',
        marginBottom: 25,
        lineHeight: 22,
        paddingHorizontal: 20,
    },
    permissionButton: {
        backgroundColor: '#00ff88',
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 12,
    },
    permissionButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#101822',
    },
});
