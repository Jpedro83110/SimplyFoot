export interface EvaluationsMentales {
    id: string;
    joueur_id: string;
    coach_id: string;
    date: string;
    motivation: number;
    ponctualite: number;
    implication: number;
    rigueur: number;
    commentaire: string;
    created_at: string;
    moyenne: number;
    attitude: number;
    respect: number;
    updated_at?: string;
    note_globale: number;
}
