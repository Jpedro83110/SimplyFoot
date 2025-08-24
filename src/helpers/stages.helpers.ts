import { supabase } from '@/lib/supabase';
import { Day } from '@/types/date.types';
import { parseJson } from './json.helpers';

export interface Programme {
    lieu: string;
    matin: string;
    apresMidi: string;
    heureDebut: string;
    heureFin: string;
}

const emptyProgramme: Programme = {
    lieu: '',
    matin: '',
    apresMidi: '',
    heureDebut: '',
    heureFin: '',
};

export type ProgrammeByDay = Record<Day, Programme>;

export const getProgrammeFromStage = (
    stage: GetStagesByClubId[number] | GetLastClubStage,
): ProgrammeByDay => {
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

export const getStagesByClubId = async ({ clubId }: { clubId: string }) => {
    const { data: stages, error } = await supabase
        .from('stages')
        .select(
            'id, titre, date_debut, date_fin, age_min, age_max, programme_lundi, programme_mardi, programme_mercredi, programme_jeudi, programme_vendredi',
        )
        .eq('club_id', clubId)
        .order('date_debut', { ascending: false });

    if (error) {
        throw error;
    }

    return stages;
};

export type GetLastClubStage = Awaited<ReturnType<typeof getLastClubStage>>;

export const getLastClubStage = async ({ clubId }: { clubId: string }) => {
    const { data: stage, error } = await supabase
        .from('stages')
        .select(
            'titre, lieu, date_debut, date_fin, programme_lundi, programme_mardi, programme_mercredi, programme_jeudi, programme_vendredi',
        )
        .eq('club_id', clubId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (error) {
        throw error;
    }

    return stage;
};
