import { Json } from '@/types/database.types';

export const parseJson = <T extends object>(json: Json) => {
    try {
        return JSON.parse(json as never) as T;
    } catch {
        return undefined;
    }
};
