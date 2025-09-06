import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';

export type GetBesoinTransport = Awaited<ReturnType<typeof getBesoinTransport>>;

export const getBesoinTransport = async ({ clubId }: { clubId: string }) => {
    const { data, error } = await supabase
        .from('participations_evenement')
        .select(
            'id, evenements(titre, date, heure, created_by), utilisateurs!utilisateur_id(nom, prenom)',
        )
        .eq('evenements.club_id', clubId)
        .eq('besoin_transport', true)
        .is('transport_valide_par', null);

    if (error) {
        throw error;
    }

    return data;
};

export const updateParticipationsEvenement = async ({
    participationId,
    dataToUpdate,
}: {
    participationId: string;
    dataToUpdate: Database['public']['Tables']['participations_evenement']['Update'];
}) => {
    const { error } = await supabase
        .from('participations_evenement')
        .update(dataToUpdate)
        .eq('id', participationId);

    if (error) {
        throw error;
    }
};

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
