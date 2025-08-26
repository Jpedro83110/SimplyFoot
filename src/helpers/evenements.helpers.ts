import { supabase } from '@/lib/supabase';

export type GetEvenementByCoachId = Awaited<ReturnType<typeof getEvenementByCoachId>>;

/**
 * @deprecated use getEvenementsByClubId instead
 */
export const getEvenementByCoachId = async ({
    coachId,
    since,
}: {
    coachId: string;
    since?: Date;
}) => {
    let request = supabase
        .from('evenements')
        .select('id, titre, date, heure, lieu')
        .eq('created_by', coachId);

    if (since) {
        request = request.gte('date', since);
    }

    const { data, error } = await request.order('date', { ascending: true });

    if (error) {
        throw error;
    }

    return data;
};

export type GetEvenementsByClubId = Awaited<ReturnType<typeof getEvenementsByClubId>>;

export const getEvenementsByClubId = async ({
    clubId,
    since,
}: {
    clubId: string;
    since?: Date;
}) => {
    let request = supabase
        .from('evenements')
        .select(
            'id, type, titre, lieu, lieu_complement, date, heure, description, utilisateurs:created_by(prenom, nom)',
        )
        .eq('club_id', clubId);

    if (since) {
        request = request.gte('date', since);
    }

    const { data, error } = await request.order('date', { ascending: true });

    if (error) {
        throw error;
    }

    return data;
};

export type GetEvenementInfosByUtilisateurId = Awaited<
    ReturnType<typeof getEvenementInfosByUtilisateurId>
>;

export const getEvenementInfosByUtilisateurId = async (args: {
    evenementId: string;
    utilisateurId: string;
}) => {
    let { evenementId, utilisateurId } = args;

    const { data, error } = await supabase
        .from('evenements')
        .select(
            `id, titre, date, heure, lieu, lieu_complement, meteo, latitude, longitude, participations_evenement(id, besoin_transport, reponse, utilisateurs!utilisateur_id(id, prenom, nom, joueurs:joueur_id(decharges_generales(accepte_transport)))), messages_besoin_transport(id, etat, adresse_demande, heure_demande, signature_demandeur, signature_conducteur, utilisateurs:utilisateur_id(id, prenom, nom))`,
        )
        // .neq('messages_besoin_transport.utilisateur_id', utilisateurId)
        .eq('participations_evenement.utilisateur_id', utilisateurId)
        .eq('id', evenementId)
        .single();

    if (error) {
        throw error;
    }

    return data;
};

export type GetEvenementInfosById = Awaited<ReturnType<typeof getEvenementInfosById>>;

export const getEvenementInfosById = async ({ evenementId }: { evenementId: string }) => {
    const { data, error } = await supabase
        .from('evenements')
        .select(
            `titre, date, heure, lieu, participations_evenement(id, reponse, besoin_transport, transport_valide_par, lieu_rdv, heure_rdv, utilisateurs!utilisateur_id(nom, prenom, email, telephone, joueurs:joueur_id(poste)))`,
        )
        .eq('id', evenementId)
        .single();

    if (error) {
        throw error;
    }

    return data;
};

// also cascading delete participations_evenement linked to this evenement
export const deleteEvenementById = async ({ evenementId }: { evenementId: string }) => {
    const { error } = await supabase.from('evenements').delete().eq('id', evenementId);

    if (error) {
        throw error;
    }
};
