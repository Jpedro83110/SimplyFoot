import { useEffect, useState } from 'react';
import CalendrierAnniversaires from '@/components/business/CalendrierAnniversaires';
import { ActivityIndicator, View, ScrollView, Alert } from 'react-native';
import { useSession } from '@/hooks/useSession';
import { getUtilisateursByClubId, GetUtilisateursByClubId } from '@/helpers/utilisateurs.helpers';

export default function CoachAnniversaires() {
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
                <ActivityIndicator color="#00ff88" size="large" />
            </View>
        );
    }

    return (
        <ScrollView style={{ flex: 1, backgroundColor: '#111417' }}>
            <CalendrierAnniversaires membres={membres || []} zoneInitiale="B" />
        </ScrollView>
    );
}
