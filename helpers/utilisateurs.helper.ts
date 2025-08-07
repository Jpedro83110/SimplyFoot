import { supabase } from '@/lib/supabase';
import { Utilisateur, UtilisateurFields } from '@/types/Utilisateur';

export const getUtilisateurById = async <U extends UtilisateurFields>(args: {
    utilisateurId: string;
    utilisateurFields: U[];
}): Promise<Pick<Utilisateur, U>> => {
    let { utilisateurId, utilisateurFields } = args;

    if (!utilisateurFields || utilisateurFields.length === 0) {
        utilisateurFields = ['id'] as U[];
    }

    const { data, error } = await supabase
        .from('utilisateurs')
        .select(utilisateurFields.join(', '))
        .eq('id', utilisateurId)
        .single();

    if (error) {
        throw error;
    } else if (!data) {
        throw new Error(`Utilisateur with id ${utilisateurId} not found`); // FIXME custom exception
    }

    return data as unknown as Pick<Utilisateur, U>;
};
