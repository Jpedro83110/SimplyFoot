export interface ParticipationEvenement {
  id: string;
  evenement_id: string;
  joueur_id: string;
  reponse?: 'present' | 'absent' | 'incertain';
  commentaire?: string;
  besoin_transport?: boolean;
  heure_depart?: string;
  lieu_rdv?: string;
  created_at?: string;
  updated_at?: string;
}
