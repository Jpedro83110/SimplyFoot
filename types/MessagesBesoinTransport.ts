import { Evenement, EvenementFields } from './Evenement';
import { Utilisateur, UtilisateurFields } from './Utilisateur';

export type MessagesBesoinTransportFields = keyof MessagesBesoinTransport;

export type MessagesBesoinTransportEtat = 'en_attente' | 'proposition_faite' | 'signe';

export interface MessagesBesoinTransport {
    id: string;
    evenement_id?: string; // FIXME: can be null
    utilisateur_id?: string; // FIXME: can be null
    adresse_demande?: string;
    heure_demande?: string;
    etat?: MessagesBesoinTransportEtat;
    adresse_proposee?: string;
    heure_proposee?: string;
    signature_parent?: string;
    signature_transporteur?: string;
    created_at?: string;
    signature_demandeur?: string;
    signature_conducteur?: string;
    signature_demandeur_date?: string;
    signature_conducteur_date?: string;
}

export type MessagesBesoinTransportWithEvenementAndUtilisateurPicked<
    M extends MessagesBesoinTransportFields,
    E extends EvenementFields,
    U extends UtilisateurFields,
> = Pick<MessagesBesoinTransport, M> & {
    evenements: Pick<Evenement, E>;
    utilisateur: Pick<Utilisateur, U>;
};
