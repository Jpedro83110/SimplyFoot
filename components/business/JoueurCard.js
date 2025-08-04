// JoueurCard enrichie - Avec badge licence et présence
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';

// FIXME: seams not used
export default function JoueurCard({ nom, poste, stats, avatar, licenceOK, presence, onPress }) {
    const presenceColor = presence >= 75 ? '#00ff88' : presence >= 50 ? '#ffa500' : '#ff4d4d';
    const licenceColor = licenceOK ? '#00ff88' : '#ff4d4d';

    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
            <Image
                source={
                    avatar && avatar.startsWith('http')
                        ? { uri: avatar }
                        : require('../../assets/avatar.png')
                }
                style={styles.avatar}
            />
            <View style={styles.infoContainer}>
                <Text style={styles.nom}>{nom}</Text>
                <Text style={styles.detail}>🎯 Poste : {poste}</Text>
                <Text style={styles.detail}>📊 Stats : {stats}</Text>
                <Text style={[styles.detail, { color: licenceColor }]}>
                    🎫 Licence : {licenceOK ? 'Validée' : 'Non validée'}
                </Text>
                <Text style={[styles.detail, { color: presenceColor }]}>
                    📈 Présence : {presence}%
                </Text>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        backgroundColor: '#1e1e1e',
        padding: 16,
        borderRadius: 12,
        marginBottom: 15,
        borderLeftWidth: 4,
        borderLeftColor: '#00ff88',
        alignItems: 'center',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 16,
        borderWidth: 2,
        borderColor: '#00ff88',
    },
    infoContainer: {
        flex: 1,
    },
    nom: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 4,
    },
    detail: {
        fontSize: 14,
        color: '#aaa',
        marginBottom: 2,
    },
});
