import { supabase } from '@/lib/supabase';

export const getEvenementByCoachId = async (args: { coachId: string; filterDate?: string }) => {
    const { coachId, filterDate } = args;

    let request = supabase
        .from('evenements')
        .select('id, titre, date, heure, lieu')
        .eq('coach_id', coachId);

    if (filterDate) {
        request = request.gte('date', filterDate);
    }

    const { data, error } = await request.order('date', { ascending: true });

    if (error) {
        throw error;
    }

    return data;
};

export const getEvenementInfosByUtilisateurId = async (args: {
    evenementId: string;
    utilisateurId: string;
}) => {
    let { evenementId, utilisateurId } = args;

    const { data, error } = await supabase
        .from('evenements')
        .select(
            `id, titre, date, heure, lieu, lieu_complement, meteo, latitude, longitude, participations_evenement(id, besoin_transport, reponse, utilisateurs:utilisateur_id(id, prenom, nom, joueurs:joueur_id(decharges_generales(accepte_transport)))), messages_besoin_transport(id, etat, adresse_demande, heure_demande, signature_demandeur, signature_conducteur, utilisateurs:utilisateur_id(id, prenom, nom))`,
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
        {
            ...(data.participations_evenement[0].utilisateurs as any),
            joueurs: [(data.participations_evenement[0].utilisateurs as any).joueurs as any],
        },
    ];

    dataRefined.messages_besoin_transport = data.messages_besoin_transport.map((message: any) => {
        return {
            ...message,
            utilisateurs: [message.utilisateurs],
        };
    });

    return dataRefined;
};
