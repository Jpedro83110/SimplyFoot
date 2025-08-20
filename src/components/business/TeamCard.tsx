import { FC } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GetCoachEquipesWithJoueursCount } from '@/helpers/equipes.helpers';

interface TeamCardProps {
    equipe: GetCoachEquipesWithJoueursCount[number];
}

export const TeamCard: FC<TeamCardProps> = ({ equipe }) => {
    return (
        <View style={styles.card}>
            <View style={styles.headerRow}>
                <Text style={styles.title}>⚽ {equipe.nom}</Text>
                <Ionicons name="chevron-forward" size={16} color="#00ff88" style={styles.chevron} />
            </View>

            <Text style={styles.detail}>👥 {equipe.joueurs[0]?.count || 0} joueurs inscrits</Text>
            <Text style={styles.detail}>
                📊 Dernier match : {/* FIXME: equipe.dernier_match || */ '—'}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#161b20',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        borderColor: '#00ff88',
        borderWidth: 1.5,
        shadowColor: '#00ff88',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
        elevation: 4,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    title: {
        color: '#00ff88',
        fontSize: 15,
        fontWeight: 'bold',
    },
    chevron: {
        opacity: 0.6,
    },
    detail: {
        color: '#ccc',
        fontSize: 12,
        marginVertical: 1,
    },
});
