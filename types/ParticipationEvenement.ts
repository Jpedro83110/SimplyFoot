export type ParticipationEvenementReponse = 'present' | 'absent' | 'incertain';

export interface ParticipationEvenement {
    id: string;
    evenement_id?: string; // FIXME: can be null
    joueur_id?: string; // FIXME: can be null
    reponse?: ParticipationEvenementReponse;
    besoin_transport?: boolean;
    transport_valide_par?: string; // FIXME: id
    commentaire?: string;
    created_at?: string;
    lieu_rdv?: string;
    heure_rdv?: string;
}
