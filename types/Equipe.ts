export interface Equipe {
    id: string;
    club_id?: string; // FIXME: can be null
    nom: string;
    categorie?: string;
    coach_id?: string; // FIXME: can be null
    date_creation?: string;
    description?: string;
    code_equipe?: string;
}

export interface EquipeWithJoueurs extends Equipe {
    joueurs: [{ count: number }];
}
