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

export type GetClubStaff = Awaited<ReturnType<typeof getClubStaff>>;

export const getClubStaff = async ({ clubId }: { clubId: string }) => {
    const { data, error } = await supabase
        .from('staff')
        .select('id, nom, prenom, photo_url, email, telephone, date_naissance, diplome, role')
        .eq('club_id', clubId)
        .order('nom', { ascending: true });

    if (error) {
        throw error;
    }

    return data;
};

export const updateStaff = async ({
    staffId,
    staff,
}: {
    staffId: string;
    staff: Database['public']['Tables']['staff']['Update'];
}) => {
    const { error } = await supabase.from('staff').update(staff).eq('id', staffId);

    if (error) {
        throw error;
    }
};

export const createStaff = async ({
    staff,
}: {
    staff: Database['public']['Tables']['staff']['Insert'];
}) => {
    const { error } = await supabase.from('staff').insert(staff);

    if (error) {
        throw error;
    }
};

export const deleteStaff = async ({ staffId }: { staffId: string }) => {
    const { error } = await supabase.from('staff').delete().eq('id', staffId);

    if (error) {
        throw error;
    }
};
