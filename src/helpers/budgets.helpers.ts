import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';

export type GetBudgetsByClubId = Awaited<ReturnType<typeof getBudgetsByClubId>>;

export const getBudgetsByClubId = async ({ clubId }: { clubId: string }) => {
    const { data, error } = await supabase
        .from('budgets')
        .select('id, date, type, intitule, montant, categorie, commentaire')
        .eq('club_id', clubId)
        .order('date', { ascending: false });

    if (error) {
        throw error;
    }

    return data;
};

export const createBudget = async ({
    budget,
}: {
    budget: Database['public']['Tables']['budgets']['Insert'];
}) => {
    const { error } = await supabase.from('budgets').insert(budget);

    if (error) {
        throw error;
    }
};

export const deleteClubBudgets = async ({ clubId }: { clubId: string }) => {
    const { error } = await supabase.from('budgets').delete().eq('club_id', clubId);

    if (error) {
        throw error;
    }
};
