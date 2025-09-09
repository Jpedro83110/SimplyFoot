import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';

export type GetUtilisateurById = Awaited<ReturnType<typeof getUtilisateurById>>;

export const getUtilisateurById = async ({ utilisateurId }: { utilisateurId: string }) => {
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

export const getUtilisateursByClubId = async ({ clubId }: { clubId: string }) => {
    const { data, error } = await supabase
        .from('utilisateurs')
        .select('id, nom, prenom, date_naissance, role')
        .eq('club_id', clubId);

    if (error) {
        throw error;
    }

    return data;
};

export type GetUtilisateursPushTokenByClubId = Awaited<
    ReturnType<typeof getUtilisateursPushTokenByClubId>
>;

export const getUtilisateursPushTokenByClubId = async ({ clubId }: { clubId: string }) => {
    const { data, error } = await supabase
        .from('utilisateurs')
        .select('expo_push_token')
        .eq('club_id', clubId);

    if (error) {
        throw error;
    }

    return data;
};

export const insertUtilisateur = async ({
    dataToInsert,
}: {
    dataToInsert: Database['public']['Tables']['utilisateurs']['Insert'];
}) => {
    const { error } = await supabase.from('utilisateurs').insert(dataToInsert);

    if (error) {
        throw error;
    }
};

export const updateUtilisateur = async ({
    utilisateurId,
    dataToUpdate,
}: {
    utilisateurId: string;
    dataToUpdate: Database['public']['Tables']['utilisateurs']['Update'];
}) => {
    const { error } = await supabase
        .from('utilisateurs')
        .update(dataToUpdate)
        .eq('id', utilisateurId);

    if (error) {
        throw error;
    }
};
