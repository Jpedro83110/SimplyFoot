import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';

// FIXME: bof mais required et non nullable ne fonctionne pas
export interface SuiviPersonnalise {
    point_fort: string;
    axe_travail: string;
}

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
    dataToUpdate,
}: {
    suivisPersonnalisesId: string | null;
    dataToUpdate: Database['public']['Tables']['suivis_personnalises']['Update'];
}) => {
    const { data, error } = await supabase
        .from('suivis_personnalises')
        .upsert({ ...dataToUpdate, id: suivisPersonnalisesId || undefined })
        .select('id, created_at, updated_at')
        .single();

    if (error) {
        throw error;
    }

    return data;
};

export const deleteCoachSuiviPersonnalise = async (args: { suivisPersonnalisesId: string }) => {
    const { suivisPersonnalisesId } = args;

    const { error } = await supabase
        .from('suivis_personnalises')
        .delete()
        .eq('id', suivisPersonnalisesId);

    if (error) {
        throw error;
    }

    return;
};
