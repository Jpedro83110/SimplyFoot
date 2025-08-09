import { supabase } from '@/lib/supabase';
import { DechargeGeneraleFields } from '@/types/DechargesGenerales';
import { JoueurFields, PublicJoueur } from '@/types/Joueur';
import {
    UtilisateurFields,
    UtilisateurWithJoueurAndDechargesGeneralesPicked,
    UtilisateurWithJoueurPicked,
} from '@/types/Utilisateur';

export const getJoueurById = async (args: { joueurId: string }) => {
    let { joueurId } = args;

    const { data, error } = await supabase
        .from('joueurs')
        .select(
            'id, equipe_id, poste, numero_licence, visite_medicale_valide, photo_url, date_naissance, equipement, photo_profil_url',
        )
        .eq('id', joueurId)
        .single();

    if (error) {
        throw error;
    }

    return data as PublicJoueur;
};

export const getJoueurByUtilisateurId = async <
    U extends UtilisateurFields,
    J extends JoueurFields,
>(args: {
    utilisateurId: string;
    joueurFields?: J[];
    utilisateurFields?: U[];
}): Promise<UtilisateurWithJoueurPicked<U, J>> => {
    let { utilisateurId, joueurFields, utilisateurFields } = args;

    if (!joueurFields || joueurFields.length === 0) {
        joueurFields = ['id'] as J[];
    }

    if (!utilisateurFields || utilisateurFields.length === 0) {
        utilisateurFields = ['id'] as U[];
    }

    const { data, error } = await supabase
        .from('utilisateurs')
        .select(`${utilisateurFields.join(', ')}, joueurs:joueur_id(${joueurFields.join(', ')})`)
        .eq('id', utilisateurId)
        .single();

    if (error) {
        throw error;
    } else if (!data) {
        throw new Error(`Utilisateur with id ${utilisateurId} not found`); // FIXME custom exception
    }

    return data as unknown as UtilisateurWithJoueurPicked<U, J>;
};

export const getJoueurAndDechargesGeneralesByUtilisateurId = async <
    U extends UtilisateurFields,
    J extends JoueurFields,
    D extends DechargeGeneraleFields,
>(args: {
    utilisateurId: string;
    joueurFields?: J[];
    utilisateurFields?: U[];
    dechargeGeneraleFields?: D[];
}): Promise<UtilisateurWithJoueurAndDechargesGeneralesPicked<U, J, D>> => {
    let { utilisateurId, joueurFields, utilisateurFields, dechargeGeneraleFields } = args;

    if (!joueurFields || joueurFields.length === 0) {
        joueurFields = ['id'] as J[];
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
            `${utilisateurFields.join(', ')}, joueurs:joueur_id(${joueurFields.join(', ')}, decharges_generales(${dechargeGeneraleFields.join(', ')}))`,
        )
        .eq('id', utilisateurId)
        .single();

    if (error) {
        throw error;
    } else if (!data) {
        throw new Error(`Utilisateur with id ${utilisateurId} not found`); // FIXME custom exception
    }

    return data as unknown as UtilisateurWithJoueurAndDechargesGeneralesPicked<U, J, D>;
};

export const updateJoueur = async (args: {
    joueurId: string;
    dataToUpdate: Partial<PublicJoueur>;
}) => {
    const { joueurId, dataToUpdate } = args;

    const { error } = await supabase.from('joueurs').update(dataToUpdate).eq('id', joueurId);

    if (error) {
        throw error;
    }
};
