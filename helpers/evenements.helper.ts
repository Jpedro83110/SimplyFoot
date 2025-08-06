import { supabase } from '@/lib/supabase';
import { EvenementFields } from '@/types/Evenement';
import { MessagesBesoinTransportFields } from '@/types/MessagesBesoinTransport';
import { ParticipationsEvenementFields } from '@/types/ParticipationsEvenement';
import { Utilisateur, UtilisateurFields } from '@/types/Utilisateur';

export const getEvenementInfosByUtilisateurId = async (args: {
    evenementId: string;
    utilisateurId: string;
}) => {
    let { evenementId, utilisateurId } = args;

    const { data, error } = await supabase
        .from('evenements')
        .select(
            `id, titre, date, heure, lieu, lieu_complement, meteo, latitude, longitude, participations_evenement(id, besoin_transport, reponse, utilisateurs:utilisateur_id(id, prenom, nom)), messages_besoin_transport(id, etat, adresse_demande, heure_demande, signature_demandeur, signature_conducteur, utilisateurs:utilisateur_id(id, prenom, nom))`,
        )
        // .neq('messages_besoin_transport.utilisateur_id', utilisateurId)
        .eq('participations_evenement.utilisateur_id', utilisateurId)
        .eq('id', evenementId)
        .single();

    if (error) {
        throw error;
    } else if (!data) {
        throw new Error(
            `MessagesBesoinTransport with utilisateur_id ${utilisateurId} and evenement_id ${evenementId} not found`,
        ); // FIXME custom exception
    }

    // because supabase type inference is not always accurate
    let dataRefined = data;

    dataRefined.participations_evenement[0].utilisateurs = [
        data.participations_evenement[0].utilisateurs as any,
    ];

    dataRefined.messages_besoin_transport = data.messages_besoin_transport.map((message: any) => {
        return {
            ...message,
            utilisateurs: [message.utilisateurs as Utilisateur],
        };
    });

    return dataRefined;
};
