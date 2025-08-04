import { supabase } from '@/lib/supabase';
import { Utilisateur, UtilisateurField } from '@/types/utilisateur';

export const getUtilisateurById = async <U extends UtilisateurField>(
    id: string,
    fields: U[],
): Promise<Pick<Utilisateur, U> | undefined> => {
    if (!fields || fields.length === 0) {
        fields = ['id'] as U[];
    }

    const { data, error } = await supabase
        .from('utilisateurs')
        .select(fields.join(', '))
        .eq('id', id)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return data ? (data as unknown as Pick<Utilisateur, U>) : undefined;
};
