import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';

export type GetStaffByUtilisateurId = Awaited<ReturnType<typeof getStaffByUtilisateurId>>;

export const getStaffByUtilisateurId = async ({ utilisateurId }: { utilisateurId: string }) => {
    const { data, error } = await supabase
        .from('staff')
        .select(
            'id, club_id, diplome, actif, role, created_at, niveau_diplome, experience, statut, date_embauche, photo_url',
        )
        .eq('utilisateur_id', utilisateurId)
        .single();

    if (error) {
        throw error;
    }

    return data;
};

export const updateStaff = async ({
    staffId,
    dataToUpdate,
}: {
    staffId: string;
    dataToUpdate: Database['public']['Tables']['staff']['Update'];
}) => {
    const { error } = await supabase.from('staff').update(dataToUpdate).eq('id', staffId);

    if (error) {
        throw error;
    }
};
