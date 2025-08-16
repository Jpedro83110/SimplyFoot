import { supabase } from '@/lib/supabase';

export type GetCoachEquipesWithJoueursCount = Awaited<
    Awaited<ReturnType<typeof getCoachEquipesWithJoueursCount>>
>;

export const getCoachEquipesWithJoueursCount = async (args: { coachId: string }) => {
    const { coachId } = args;

    const { data, error } = await supabase
        .from('equipes')
        .select('*, joueurs(count)')
        .eq('coach_id', coachId);

    if (error) {
        throw error;
    }

    return data;
};
