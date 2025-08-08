import { supabase } from '@/lib/supabase';
import { PublicUtilisateur } from '@/types/Utilisateur';

export const getUtilisateurById = async (args: { utilisateurId: string }) => {
    let { utilisateurId } = args;

    const { data, error } = await supabase
        .from('utilisateurs')
        .select(
            'id, email, nom, prenom, role, club_id, joueur_id, date_creation, date_naissance, telephone',
        )
        .eq('id', utilisateurId)
        .single();

    if (error) {
        throw error;
    }

    return data as PublicUtilisateur;
};
