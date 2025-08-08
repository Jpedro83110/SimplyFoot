import { supabase } from '@/lib/supabase';
import { PublicStaff } from '@/types/Staff';

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

    return data as PublicStaff;
};
