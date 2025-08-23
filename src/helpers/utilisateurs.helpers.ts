import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';

export type GetUtilisateurById = Awaited<ReturnType<typeof getUtilisateurById>>;

export const getUtilisateurById = async (args: { utilisateurId: string }) => {
    let { utilisateurId } = args;

    const { data, error } = await supabase
        .from('utilisateurs')
        .select(
            'id, email, nom, prenom, role, club_id, joueur_id, date_creation, date_naissance, telephone, expo_push_token',
        )
        .eq('id', utilisateurId)
        .single();

    if (error) {
        throw error;
    }

    return data;
};

export type GetUtilisateursByClubId = Awaited<ReturnType<typeof getUtilisateursByClubId>>;

export const getUtilisateursByClubId = async (args: { clubId: string }) => {
    const { clubId } = args;

    const { data, error } = await supabase
        .from('utilisateurs')
        .select('id, nom, prenom, date_naissance, role')
        .eq('club_id', clubId);

    if (error) {
        throw error;
    }

    return data;
};

export const updateUtilisateur = async (args: {
    utilisateurId: string;
    dataToUpdate: Database['public']['Tables']['utilisateurs']['Update'];
}) => {
    const { utilisateurId, dataToUpdate } = args;

    const { error } = await supabase
        .from('utilisateurs')
        .update(dataToUpdate)
        .eq('id', utilisateurId);

    if (error) {
        throw error;
    }
};
