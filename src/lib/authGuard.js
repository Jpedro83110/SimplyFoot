export function isAdmin(email) {
    return email?.toLowerCase() === 'demo@simplyfoot.fr';
}

export function canAccessSection(user, section) {
    const role = user?.role;

    if (isAdmin(user?.email)) {
        return true;
    }

    const rules = {
        president: ['president'],
        coach: ['staff', 'coach'],
        joueur: ['joueur', 'parent'],
    };

    return rules[section]?.includes(role);
}
