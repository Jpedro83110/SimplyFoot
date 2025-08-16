// CompositionTerrain.js - version carte FIFA avec terrain latéral et liste joueurs
import React from 'react';
import {
    LogBox,
    View,
    Text,
    StyleSheet,
    ImageBackground,
    Dimensions,
    ScrollView,
} from 'react-native';
LogBox.ignoreLogs([
    'VirtualizedLists should never be nested', // ignore l'avertissement
]);

const SCREEN_HEIGHT = Dimensions.get('window').height;

// FIXME: seams not used
export default function CompositionTerrain({ joueurs }) {
    const lignes = {
        gardien: joueurs.filter((j) => j.poste === 'Gardien' && j.present),
        defense: joueurs.filter((j) => j.poste === 'Défenseur' && j.present),
        milieu: joueurs.filter((j) => j.poste === 'Milieu' && j.present),
        attaque: joueurs.filter((j) => j.poste === 'Attaquant' && j.present),
    };

    const absents = joueurs.filter((j) => !j.present);

    return (
        <View style={styles.wrapper}>
            <View style={styles.terrainWrapper}>
                <ImageBackground
                    source={require('../../assets/terrain.png')}
                    style={styles.terrain}
                    resizeMode="cover"
                >
                    {Object.entries(lignes).map(([ligne, joueursLigne]) => (
                        <View key={ligne} style={styles.ligne}>
                            {joueursLigne.map((j) => (
                                <View key={j.id} style={styles.carte}>
                                    <Text style={styles.nom}>{j.nom}</Text>
                                    <Text style={styles.prenom}>{j.prenom}</Text>
                                </View>
                            ))}
                        </View>
                    ))}
                </ImageBackground>
            </View>

            <ScrollView style={styles.listeWrapper} contentContainerStyle={styles.listeContent}>
                <Text style={styles.titre}>✅ Présents</Text>
                {joueurs
                    .filter((j) => j.present)
                    .map((j) => (
                        <View key={j.id} style={styles.listeItem}>
                            <Text style={styles.listeNom}>
                                {j.nom} {j.prenom} · {j.poste}
                            </Text>
                        </View>
                    ))}

                <Text style={styles.titre}>❌ Absents</Text>
                {absents.map((j) => (
                    <View key={j.id} style={[styles.listeItem, { opacity: 0.5 }]}>
                        <Text style={styles.listeNom}>
                            {j.nom} {j.prenom} · {j.poste}
                        </Text>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#0a0a0a',
    },
    terrainWrapper: {
        flex: 1.2,
    },
    terrain: {
        width: '100%',
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
        paddingVertical: 6,
    },
    carte: {
        backgroundColor: '#fff',
        width: 60,
        height: 80,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#00ff88',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 8,
        marginHorizontal: 5,
    },
    nom: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#000',
    },
    prenom: {
        fontSize: 9,
        color: '#333',
        marginTop: 2,
    },
    listeWrapper: {
        flex: 0.8,
        backgroundColor: '#111',
        padding: 10,
    },
    listeContent: {
        paddingBottom: 50,
    },
    titre: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#00ff88',
        marginTop: 10,
        marginBottom: 6,
    },
    listeItem: {
        backgroundColor: '#1e1e1e',
        padding: 10,
        borderRadius: 8,
        marginBottom: 6,
    },
    listeNom: {
        color: '#fff',
        fontSize: 13,
    },
});
