import { supabase } from '@/lib/supabase';
import { Day } from '@/types/date.types';
import { parseJson } from './json.helpers';
import { Database } from '@/types/database.types';

export interface Programme {
    lieu: string;
    matin: string;
    apresMidi: string;
    heureDebut: string;
    heureFin: string;
}

export const emptyProgramme: Programme = {
    lieu: '',
    matin: '',
    apresMidi: '',
    heureDebut: '',
    heureFin: '',
};

export type ProgrammeByDay = Record<Day, Programme>;

export const getProgrammeFromStage = (stage: GetStagesByClubId[number]): ProgrammeByDay => {
    const {
        programme_lundi,
        programme_mardi,
        programme_mercredi,
        programme_jeudi,
        programme_vendredi,
    } = stage;

    return {
        lundi: parseJson<Programme>(programme_lundi) ?? emptyProgramme,
        mardi: parseJson<Programme>(programme_mardi) ?? emptyProgramme,
        mercredi: parseJson<Programme>(programme_mercredi) ?? emptyProgramme,
        jeudi: parseJson<Programme>(programme_jeudi) ?? emptyProgramme,
        vendredi: parseJson<Programme>(programme_vendredi) ?? emptyProgramme,
    };
};

export type GetStagesByClubId = Awaited<ReturnType<typeof getStagesByClubId>>;

export const getStagesByClubId = async ({ clubId, since }: { clubId: string; since?: Date }) => {
    let request = supabase
        .from('stages')
        .select(
            'id, titre, date_debut, heure_debut, date_fin, heure_fin, age_min, age_max, programme_lundi, programme_mardi, programme_mercredi, programme_jeudi, programme_vendredi',
        )
        .eq('club_id', clubId);

    if (since) {
        request = request.gte('date_debut', since.toISOString().split('T')[0]);
    }

    const { data: stages, error } = await request.order('date_debut', { ascending: false });

    if (error) {
        throw error;
    }

    return stages;
};

export const createStage = async ({
    stage,
}: {
    stage: Database['public']['Tables']['stages']['Insert'];
}) => {
    const { error } = await supabase.from('stages').insert([stage]);

    if (error) {
        throw error;
    }
};

export const updateStage = async ({
    stageId,
    stage,
}: {
    stageId: string;
    stage: Database['public']['Tables']['stages']['Update'];
}) => {
    const { error } = await supabase.from('stages').update(stage).eq('id', stageId);

    if (error) {
        throw error;
    }
};

export const deleteStage = async ({ stageId }: { stageId: string }) => {
    const { error } = await supabase.from('stages').delete().eq('id', stageId);

    if (error) {
        throw error;
    }
};

// FIXME: replace by a true ttl in bdd
export const deleteExpiredStages = async ({ clubId }: { clubId: string }) => {
    await supabase
        .from('stages')
        .delete()
        .eq('club_id', clubId)
        .lt('date_fin', new Date().toISOString());
};
