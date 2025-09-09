import { FC, useEffect, useState } from 'react';
import CalendrierAnniversaires from '../../components/business/CalendrierAnniversaires';
import { ActivityIndicator, View, ScrollView, Alert } from 'react-native';
import { COLOR_GREEN_300 } from '@/utils/styleContants.utils';
import { getUtilisateursByClubId, GetUtilisateursByClubId } from '@/helpers/utilisateurs.helpers';
import { useSession } from '@/hooks/useSession';

export const Anniversaires: FC = () => {
    const [membres, setMembres] = useState<GetUtilisateursByClubId | undefined>(undefined);
    const [loading, setLoading] = useState(false);

    const { utilisateur } = useSession();

    const loadData = async (clubId: string) => {
        setLoading(true);
        try {
            const membres = await getUtilisateursByClubId({ clubId });
            setMembres(membres);
        } catch (error) {
            Alert.alert(
                'Erreur',
                (error as Error).message || 'Impossible de charger les anniversaires.',
            );
        }
        setLoading(false);
    };

    useEffect(() => {
        if (!utilisateur?.club_id || loading || membres) {
            return;
        }

        loadData(utilisateur.club_id);
    }, [loading, membres, utilisateur?.club_id]);

    if (loading) {
        return (
            <View
                style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: '#14181b',
                }}
            >
                <ActivityIndicator color={COLOR_GREEN_300} size="large" />
            </View>
        );
    }

    if (loading) {
        return (
            <View
                style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: '#14181b',
                }}
            >
                <ActivityIndicator color={COLOR_GREEN_300} size="large" />
            </View>
        );
    }

    return (
        <ScrollView style={{ flex: 1, backgroundColor: '#111417' }}>
            <CalendrierAnniversaires membres={membres || []} zoneInitiale="B" />
        </ScrollView>
    );
};
