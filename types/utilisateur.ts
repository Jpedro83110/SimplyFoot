import { DechargeGenerale, DechargeGeneraleFields } from './DechargesGenerales';
import { Joueur, JoueurField } from './Joueur';

export type UtilisateurField = keyof Utilisateur;

export type UtilisateurRole = 'joueur' | 'coach' | 'president' | 'admin'; // FIXME: admin is necessary ?

export interface Utilisateur {
    id: string;
    email: string;
    nom?: string;
    prenom?: string;
    role: UtilisateurRole;
    club_id?: string; // FIXME: can be null
    joueur_id?: string;
    date_creation?: string;
    expo_push_token?: string;
    date_naissance?: string;
    telephone?: string;
}

export type UtilisateurWithJoueurAndDechargesGeneralesPicked<
    U extends UtilisateurField,
    J extends JoueurField,
    D extends DechargeGeneraleFields,
> = Pick<Utilisateur, U> & {
    joueurs: Pick<Joueur, J> & { decharges_generales: [Pick<DechargeGenerale, D>] };
};
