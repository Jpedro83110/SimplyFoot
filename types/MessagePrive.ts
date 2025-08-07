import { getCoachMessagesPrives } from '@/helpers/messagesPrives.helper';

export interface MessagePrive {
    id: string;
    emmetteur_id: string;
    receveur_id: string;
    texte: string;
    created_at: string;
    auteur: string; // FIXME: delete
}

export type CoachMessagesPrives = Awaited<ReturnType<typeof getCoachMessagesPrives>>;
