import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';

// FIXME: bof mais required et non nullable ne fonctionne pas
export interface SuiviPersonnalise {
    point_fort: string;
    axe_travail: string;
}

export type GetSuiviPersonnalisesByUtilisateurId = Awaited<
    ReturnType<typeof getSuiviPersonnalisesByUtilisateurId>
>;

export const getSuiviPersonnalisesByUtilisateurId = async ({
    utilisateurId,
}: {
    utilisateurId: string;
}) => {
    const { data, error } = await supabase
        .from('suivis_personnalises')
        .select('*')
        .eq('joueur_id', utilisateurId)
        .order('created_at', { ascending: false });

    if (error) {
        throw error;
    }

    return data;
};

export type GetCoachSuivisPersonnalisesByJoueurId = Awaited<
    ReturnType<typeof getCoachSuivisPersonnalisesByJoueurId>
>;

export const getCoachSuivisPersonnalisesByJoueurId = async ({
    coachId,
    joueurId,
}: {
    coachId: string;
    joueurId: string;
}) => {
    const { data, error } = await supabase
        .from('utilisateurs')
        .select(
            'id, prenom, nom, joueurs:joueur_id(poste), suivis_personnalises!joueur_id(id, point_fort, axe_travail, created_at, updated_at)',
        )
        .eq('suivis_personnalises.coach_id', coachId)
        .eq('joueur_id', joueurId)
        .single();

    if (error) {
        throw error;
    }

    return data;
};

export const upsertCoachSuiviPersonnalise = async ({
    suivisPersonnalisesId,
    suivisPersonnalises,
}: {
    suivisPersonnalisesId: string | null;
    suivisPersonnalises: Database['public']['Tables']['suivis_personnalises']['Update'];
}) => {
    const { data, error } = await supabase
        .from('suivis_personnalises')
        .upsert({ ...suivisPersonnalises, id: suivisPersonnalisesId || undefined })
        .select('id, created_at, updated_at')
        .single();

    if (error) {
        throw error;
    }

    return data;
};

export const deleteCoachSuiviPersonnalise = async ({
    suivisPersonnalisesId,
}: {
    suivisPersonnalisesId: string;
}) => {
    const { error } = await supabase
        .from('suivis_personnalises')
        .delete()
        .eq('id', suivisPersonnalisesId);

    if (error) {
        throw error;
    }

    return;
};
