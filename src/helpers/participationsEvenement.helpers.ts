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

export const updateBesoinTransport = async ({
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
