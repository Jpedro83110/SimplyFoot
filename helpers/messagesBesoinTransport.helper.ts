import { supabase } from '@/lib/supabase';
import { EvenementFields } from '@/types/Evenement0';
import {
    MessagesBesoinTransportFields,
    MessagesBesoinTransportWithEvenementAndUtilisateurPicked,
} from '@/types/MessagesBesoinTransport0';
import { UtilisateurFields } from '@/types/Utilisateur0';

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
            `${fields.join(', ')}, evenements:evenement_id(equipe_id, ${evenementFields?.filter((field) => field !== 'equipe_id').join(', ')}) , utilisateurs:utilisateur_id(${utilisateurFields?.join(', ')})`,
        )
        .not('evenements', 'is', null)
        .eq('evenements.equipe_id', equipeId);

    if (error) {
        throw error;
    } else if (!data) {
        throw new Error(`MessagesBesoinTransport with equipeId ${equipeId} not found`); // FIXME custom exception
    }

    return data as unknown as MessagesBesoinTransportWithEvenementAndUtilisateurPicked<M, E, U>[];
};
