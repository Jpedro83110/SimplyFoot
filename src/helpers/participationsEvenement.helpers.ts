import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';

export type GetParticipationsEvenementByUtilisateurId = Awaited<
    ReturnType<typeof getParticipationsEvenementByUtilisateurId>
>;

export const getParticipationsEvenementByUtilisateurId = async ({
    utilisateurId,
}: {
    utilisateurId: string;
}) => {
    const { data, error } = await supabase
        .from('participations_evenement')
        .select('reponse')
        .eq('utilisateur_id', utilisateurId);

    if (error) {
        throw error;
    }

    return data;
};

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

export const upsertParticipationEvenement = async ({
    utilisateurId,
    evenementId,
    participationEvenement,
}: {
    utilisateurId: string;
    evenementId: string;
    participationEvenement: Database['public']['Tables']['participations_evenement']['Insert'];
}) => {
    const { error } = await supabase.from('participations_evenement').upsert(
        {
            ...participationEvenement,
            utilisateur_id: utilisateurId,
            evenement_id: evenementId,
        },
        { onConflict: 'utilisateur_id,evenement_id' },
    );
    if (error) {
        throw error;
    }
};
