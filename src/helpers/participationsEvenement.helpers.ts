import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';

export const bulkCreateParticipationsEvenement = async ({
    joueursIds,
    dataToInsert,
}: {
    joueursIds: string[];
    dataToInsert: Database['public']['Tables']['participations_evenement']['Insert'];
}) => {
    const { error } = await supabase.from('participations_evenement').insert(
        joueursIds.map((joueursId) => ({
            ...dataToInsert,
            utilisateur_id: joueursId,
        })),
    );

    if (error) {
        throw error;
    }
};
