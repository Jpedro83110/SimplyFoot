import { supabase } from '@/lib/supabase';
import { DechargeGeneraleFields } from '@/types/DechargesGenerales';
import { JoueurField } from '@/types/Joueur';
import {
    UtilisateurField,
    UtilisateurWithJoueurAndDechargesGeneralesPicked,
} from '@/types/Utilisateur';

export const getJoueurAndDechargesGeneralesByUtilisateurId = async <
    U extends UtilisateurField,
    J extends JoueurField,
    D extends DechargeGeneraleFields,
>(
    id: string,
    fields?: J[],
    utilisateurFields?: U[],
    dechargeGeneraleFields?: D[],
): Promise<UtilisateurWithJoueurAndDechargesGeneralesPicked<U, J, D>> => {
    if (!fields || fields.length === 0) {
        fields = ['id'] as J[];
    }

    if (!utilisateurFields || utilisateurFields.length === 0) {
        utilisateurFields = ['id'] as U[];
    }

    if (!dechargeGeneraleFields || dechargeGeneraleFields.length === 0) {
        dechargeGeneraleFields = ['id'] as D[];
    }

    const { data, error } = await supabase
        .from('utilisateurs')
        .select(
            `${utilisateurFields.join(', ')}, joueurs(${fields.join(', ')}, decharges_generales(${dechargeGeneraleFields.join(', ')}))`,
        )
        .eq('id', id)
        .single();

    if (error) {
        throw error;
    } else if (!data) {
        throw new Error(`Utilisateur with id ${id} not found`); // FIXME custom exception
    }

    return data as unknown as UtilisateurWithJoueurAndDechargesGeneralesPicked<U, J, D>;
};
