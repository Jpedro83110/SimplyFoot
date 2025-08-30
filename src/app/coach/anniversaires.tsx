import { useCallback, useEffect, useState } from 'react';
import CalendrierAnniversaires from '@/components/business/CalendrierAnniversaires';
import { ActivityIndicator, View, ScrollView, Alert } from 'react-native';
import { useSession } from '@/hooks/useSession';
import { getUtilisateursByClubId, GetUtilisateursByClubId } from '@/helpers/utilisateurs.helpers';

export default function CoachAnniversaires() {
    const [membres, setMembres] = useState<GetUtilisateursByClubId>([]);
    const [loading, setLoading] = useState(false);

    const { staff } = useSession();

    const loadData = useCallback(async () => {
        if (!staff?.club_id || loading) {
            return;
        }

        setLoading(true);
        try {
            const membres = await getUtilisateursByClubId({ clubId: staff.club_id });
            setMembres(membres);
        } catch (error) {
            Alert.alert(
                'Erreur',
                (error as Error).message || 'Impossible de charger les anniversaires.',
            );
        }
        setLoading(false);
    }, [loading, staff?.club_id]);

    useEffect(() => {
        loadData();
    }, [loadData]);

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
            <CalendrierAnniversaires membres={membres} zoneInitiale="B" />
        </ScrollView>
    );
}
