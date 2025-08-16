import React from 'react';
import { Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';

// FIXME: seams not used
export default function EvenementCard({
    title,
    type,
    date,
    time,
    location,
    lieuComplement, // <-- le complément du lieu (champ à afficher)
    meteo,
    latitude,
    longitude,
    onPress,
}) {
    const getEmoji = (type) => {
        switch (type) {
            case 'match':
                return '⚽';
            case 'entrainement':
                return '🏋️‍♂️';
            case 'tournoi':
                return '🏆';
            case 'plateau':
                return '🎯';
            case 'repas':
                return '🍽️';
            default:
                return '📌';
        }
    };

    const getBorderColor = (type) => {
        switch (type) {
            case 'match':
                return '#ff4d4d';
            case 'entrainement':
                return '#00bfff';
            case 'tournoi':
                return '#ffd700';
            case 'plateau':
                return '#8a2be2';
            case 'repas':
                return '#ffa500';
            default:
                return '#00ff88';
        }
    };

    return (
        <TouchableOpacity
            style={[styles.card, { borderLeftColor: getBorderColor(type) }]}
            onPress={onPress}
            activeOpacity={0.85}
        >
            <Text style={styles.cardTitle}>
                {getEmoji(type)} {title}
            </Text>
            <Text style={styles.detail}>
                📅 {date} à {time}
            </Text>
            <Text style={styles.detail}>📍 {location}</Text>
            {/* Affichage du complément si présent */}
            {lieuComplement && <Text style={styles.complement}>🏟️ {lieuComplement}</Text>}
            {meteo && <Text style={[styles.detail, { color: '#00ff88' }]}>🌦️ {meteo}</Text>}
            {latitude && longitude && (
                <TouchableOpacity
                    onPress={() =>
                        Linking.openURL(
                            `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
                        )
                    }
                    style={{ marginTop: 6, alignSelf: 'flex-start' }}
                >
                    <Text
                        style={{ color: '#00ff88', textDecorationLine: 'underline', fontSize: 14 }}
                    >
                        🗺️ Itinéraire
                    </Text>
                </TouchableOpacity>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#1e1e1e',
        padding: 16,
        borderRadius: 12,
        marginBottom: 20,
        borderLeftWidth: 4,
    },
    cardTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 8,
    },
    detail: {
        color: '#aaa',
        fontSize: 14,
        marginBottom: 4,
    },
    complement: {
        color: '#8fd6ff',
        fontSize: 13,
        fontStyle: 'italic',
        marginBottom: 6,
        marginLeft: 4,
    },
});
