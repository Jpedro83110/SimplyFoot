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
>(args: {
    equipeId: string;
    fields: M[];
    utilisateurFields?: U[];
    evenementFields?: E[];
}): Promise<MessagesBesoinTransportWithEvenementAndUtilisateurPicked<M, E, U>[]> => {
    let { equipeId, fields, evenementFields, utilisateurFields } = args;

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
        throw new Error(`MessagesBesoinTransport with equipe_id ${equipeId} not found`); // FIXME custom exception
    }

    return data as unknown as MessagesBesoinTransportWithEvenementAndUtilisateurPicked<M, E, U>[];
};

export const getMessagesBesoinTransportAndUtilisateurByEquipeIdAndEvenementId = async <
    M extends MessagesBesoinTransportFields,
    E extends EvenementFields,
    U extends UtilisateurFields,
>(args: {
    equipeId: string;
    evenementId: string;
    fields: M[];
    evenementFields?: E[];
    utilisateurFields?: U[];
}): Promise<MessagesBesoinTransportWithEvenementAndUtilisateurPicked<M, E, U>[]> => {
    let { equipeId, evenementId, fields, evenementFields, utilisateurFields } = args;

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
        .eq('evenements.equipe_id', equipeId)
        .eq('messages_besoin_transport.evenement_id', evenementId);

    if (error) {
        throw error;
    } else if (!data) {
        throw new Error(
            `MessagesBesoinTransport with equipe_id ${equipeId} and evenement_id ${evenementId} not found`,
        ); // FIXME custom exception
    }

    return data as unknown as MessagesBesoinTransportWithEvenementAndUtilisateurPicked<M, E, U>[];
};
