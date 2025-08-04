import { supabase } from '@/lib/supabase';
import { JoueurField } from '@/types/joueur';
import { UtilisateurField, UtilisateurWithJoueurPicked } from '@/types/utilisateur';

export const getJoueurByUtilisateurId = async <U extends UtilisateurField, J extends JoueurField>(
    id: string,
    fields?: J[],
    utilisateurFields?: U[],
): Promise<UtilisateurWithJoueurPicked<U, J> | undefined> => {
    if (!fields || fields.length === 0) {
        fields = ['id'] as J[];
    }

    if (!utilisateurFields || utilisateurFields.length === 0) {
        utilisateurFields = ['id'] as U[];
    }

    const { data, error } = await supabase
        .from('utilisateurs')
        .select(`${utilisateurFields.join(', ')}, joueurs(${fields.join(', ')})`)
        .eq('id', id)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return data ? (data as unknown as UtilisateurWithJoueurPicked<U, J>) : undefined;
};
