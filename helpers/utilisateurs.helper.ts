import { supabase } from '@/lib/supabase';
import { Utilisateur, UtilisateurField } from '@/types/Utilisateur';

export const getUtilisateurById = async <U extends UtilisateurField>(
    id: string,
    fields: U[],
): Promise<Pick<Utilisateur, U>> => {
    if (!fields || fields.length === 0) {
        fields = ['id'] as U[];
    }

    const { data, error } = await supabase
        .from('utilisateurs')
        .select(fields.join(', '))
        .eq('id', id)
        .single();

    if (error) {
        throw error;
    } else if (!data) {
        throw new Error(`Utilisateur with id ${id} not found`); // FIXME custom exception
    }

    return data as unknown as Pick<Utilisateur, U>;
};
