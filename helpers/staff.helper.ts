import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';

export type GetStaffByUtilisateurId = Awaited<ReturnType<typeof getStaffByUtilisateurId>>;

export const getStaffByUtilisateurId = async (args: { utilisateurId: string }) => {
    const { utilisateurId } = args;

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

export const updateStaff = async (args: {
    staffId: string;
    dataToUpdate: Database['public']['Tables']['staff']['Update'];
}) => {
    const { staffId, dataToUpdate } = args;

    const { error } = await supabase.from('staff').update(dataToUpdate).eq('id', staffId);

    if (error) {
        throw error;
    }
};
