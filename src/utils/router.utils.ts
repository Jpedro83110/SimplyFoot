import { router } from 'expo-router';

type RoutePermissions = Map<string, string[]>;

const routePermissions: RoutePermissions = new Map([
    ['/auth', ['visitor']],
    ['/joueur', ['joueur']],
    ['/coach', ['coach']],
    ['/president', ['president']],
]);

const VISITOR_HOME = '/';
const JOUEUR_HOME = '/joueur/dashboard';
const COACH_HOME = '/coach/dashboard';
const PRESIDENT_HOME = '/president/dashboard';

const getRedirectPathToRoleHome = (role?: string): string => {
    switch (role) {
        case 'joueur':
            return JOUEUR_HOME;
        case 'coach':
            return COACH_HOME;
        case 'president':
            return PRESIDENT_HOME;
        default:
            return VISITOR_HOME;
    }
};

const isAuthorizedToAccessRoute = (route: string, role?: string): boolean => {
    for (const [key, allowedRoles] of routePermissions) {
        if (route.startsWith(key)) {
            return allowedRoles.includes(role || 'visitor');
        }
    }

    return false;
};

export const redirectIfUnauthorized = (route: string, role?: string) => {
    if (!isAuthorizedToAccessRoute(route, role)) {
        router.replace(getRedirectPathToRoleHome(role));
    }
};
