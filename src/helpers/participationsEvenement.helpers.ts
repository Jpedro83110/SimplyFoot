import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';

export const bulkCreateParticipationsEvenement = async ({
    joueursId,
    dataToInsert,
}: {
    joueursId: string[];
    dataToInsert: Database['public']['Tables']['participations_evenement']['Insert'];
}) => {
    const { error } = await supabase.from('participations_evenement').insert(
        joueursId.map((joueurId) => ({
            ...dataToInsert,
            utilisateur_id: joueurId,
        })),
    );

    if (error) {
        throw error;
    }
};
