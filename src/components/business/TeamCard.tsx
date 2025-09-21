import { FC } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GetCoachClubData } from '@/helpers/clubs.helpers';
import { COLOR_GREEN_300 } from '@/utils/styleContants.utils';
import { copyToClipboard } from '@/utils/copyToClipboard.utils';

interface TeamCardProps {
    equipe: GetCoachClubData['equipes'][number];
}

export const TeamCard: FC<TeamCardProps> = ({ equipe }) => {
    return (
        <View style={styles.card}>
            <View style={styles.headerRow}>
                <Text style={styles.title}>⚽ {equipe.nom}</Text>
                <Ionicons name="chevron-forward" size={16} color="#00ff88" style={styles.chevron} />
            </View>
            <Text style={styles.detail}>👥 {equipe.joueurs[0]?.count || 0} joueurs inscrits</Text>
            <View style={styles.line}>
                <TouchableOpacity
                    style={styles.detail}
                    onPress={() => equipe.code_equipe && copyToClipboard(equipe.code_equipe)}
                >
                    <Ionicons name="copy-outline" size={16} color={COLOR_GREEN_300} />
                </TouchableOpacity>
                <Text style={styles.detail}>Code équipe : {equipe.code_equipe}</Text>
            </View>{' '}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#161b20',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        borderColor: COLOR_GREEN_300,
        borderWidth: 1.5,
        shadowColor: COLOR_GREEN_300,
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
        color: COLOR_GREEN_300,
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
    line: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 6,
    },
});
