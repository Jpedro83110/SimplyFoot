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
        .from('suivis_personnalises')
        .select(
            'id, point_fort, axe_travail, created_at, updated_at, utilisateurs!joueur_id(id, prenom, nom, joueurs:joueur_id(poste))',
        )
        .eq('coach_id', coachId)
        .eq('utilisateurs.joueur_id', joueurId)
        .single();

    if (error) {
        throw error;
    }

    return data;
};

export const upsertCoachSuiviPersonnalise = async ({
    suiviPersonnaliseId,
    dataToUpdate,
}: {
    suiviPersonnaliseId: string;
    dataToUpdate: Database['public']['Tables']['suivis_personnalises']['Update'];
}) => {
    const { error } = await supabase
        .from('suivis_personnalises')
        .upsert(dataToUpdate)
        .eq('id', suiviPersonnaliseId)
        .single();

    if (error) {
        throw error;
    }
};

export const deleteCoachSuiviPersonnalise = async (args: { suiviPersonnaliseId: string }) => {
    const { suiviPersonnaliseId } = args;

    const { error } = await supabase
        .from('suivis_personnalises')
        .delete()
        .eq('id', suiviPersonnaliseId);

    if (error) {
        throw error;
    }

    return;
};
