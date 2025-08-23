import { supabase } from '@/lib/supabase';

export type GetCoachEquipes = Awaited<ReturnType<typeof getCoachEquipes>>;

export const getCoachEquipes = async ({ coachId, clubId }: { coachId: string; clubId: string }) => {
    const { data, error } = await supabase
        .from('equipes')
        .select('id')
        .eq('coach_id', coachId)
        .eq('club_id', clubId);

    if (error) {
        throw error;
    }

    return data;
};

export type GetCoachEquipesWithJoueursCount = Awaited<
    Awaited<ReturnType<typeof getCoachEquipesWithJoueursCount>>
>;

export const getCoachEquipesWithJoueursCount = async ({
    coachId,
    clubId,
}: {
    coachId: string;
    clubId: string;
}) => {
    const { data, error } = await supabase
        .from('equipes')
        .select('*, joueurs(count)')
        .eq('coach_id', coachId)
        .eq('club_id', clubId);

    if (error) {
        throw error;
    }

    return data;
};

export type GetJoueurEquipeById = Awaited<ReturnType<typeof getJoueurEquipeById>>;

export const getJoueurEquipeById = async (equipeId: string) => {
    const { data, error } = await supabase
        .from('equipes')
        .select('id, club_id, nom, categorie, club:club_id(logo_url)')
        .eq('id', equipeId)
        .single();

    if (error) {
        throw error;
    }

    return data;
};
