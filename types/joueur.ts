export type JoueurField = keyof Joueur;

export type JoueurPoste = 'gardien' | 'defenseur' | 'milieu' | 'attaquant';

export interface Joueur {
    id: string;
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
