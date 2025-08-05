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

export type UtilisateurWithJoueurPicked<U extends UtilisateurField, J extends JoueurField> = Pick<
    Utilisateur,
    U
> & {
    joueurs: Pick<Joueur, J>;
};
