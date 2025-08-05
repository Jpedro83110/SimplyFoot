import { supabase } from '@/lib/supabase';
import { EvenementFields } from '@/types/Evenement';
import {
    MessagesBesoinTransportFields,
    MessagesBesoinTransportWithEvenementAndUtilisateurPicked,
} from '@/types/MessagesBesoinTransport';
import { UtilisateurFields } from '@/types/Utilisateur';

export const getMessagesBesoinTransportAndUtilisateurByEquipeId = async <
    M extends MessagesBesoinTransportFields,
    E extends EvenementFields,
    U extends UtilisateurFields,
>(
    equipeId: string,
    fields: M[],
    evenementFields?: E[],
    utilisateurFields?: U[],
): Promise<MessagesBesoinTransportWithEvenementAndUtilisateurPicked<M, E, U>[]> => {
    if (!fields || fields.length === 0) {
        fields = ['id'] as M[];
    }

    if (!evenementFields || evenementFields.length === 0) {
        evenementFields = ['id'] as E[];
    }

    if (!utilisateurFields || utilisateurFields.length === 0) {
        utilisateurFields = ['id'] as U[];
    }

    const { data, error } = await supabase
        .from('messages_besoin_transport')
        .select(
            `${fields.join(', ')}, evenements(equipe_id, ${evenementFields?.filter((field) => field !== 'equipe_id').join(', ')}) , utilisateurs(${utilisateurFields?.join(', ')})`,
        )
        .eq('evenements.equipe_id', equipeId);

    if (error) {
        throw error;
    } else if (!data) {
        throw new Error(`MessagesBesoinTransport with equipeId ${equipeId} not found`); // FIXME custom exception
    }

    return data as unknown as MessagesBesoinTransportWithEvenementAndUtilisateurPicked<M, E, U>[];
};
