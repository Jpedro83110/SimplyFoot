export type JoueurFields = keyof Joueur;

export type JoueurPoste = 'gardien' | 'defenseur' | 'milieu' | 'attaquant';

export interface Joueur {
    id: string;
    equipe_id?: string; // FIXME: can be null
    nom?: string;
    prenom?: string;
    poste?: JoueurPoste;
    numero_licence?: string;
    visite_medicale_valide?: boolean;
    photo_url?: string;
    date_naissance?: string;
    equipement?: string;
    telephone?: string;
    photo_profil_url?: string;
    code_equipe?: string; // FIXME: can be null
}
