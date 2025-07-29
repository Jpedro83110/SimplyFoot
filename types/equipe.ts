export interface Equipe {
  id: string;
  nom: string;
  categorie?: string;
  description?: string;
  coach_id?: string;
  club_id: string;
  code_equipe?: string;
  created_at?: string;
  updated_at?: string;
}

export interface EquipeWithJoueurs extends Equipe {
  joueurs: [{count: number}];
}
