// lib/formatDate.js

/**
 * Formatte une date en format JJ/MM/AAAA
 * @param {Date | string | number} dateInput
 */
export function formatDateFR(dateInput) {
    if (!dateInput) return '';
    const d = new Date(dateInput);
    if (isNaN(d)) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
}

/**
 * Formatte une heure en format HH:MM ou HHhMM
 * @param {Date | string | number} dateInput
 * @param {Object} options
 * @param {boolean} options.useH - true pour 'h' (14h30), false pour ':' (14:30)
 */
export function formatHourFR(dateInput, options = { useH: false }) {
    if (!dateInput) return '';
    const d = new Date(dateInput);
    if (isNaN(d)) return '';
    const hour = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return options.useH ? `${hour}h${min}` : `${hour}:${min}`;
}

/**
 * Formatte date + heure, avec choix du séparateur
 * @param {Date | string | number} dateInput
 * @param {Object} options
 * @param {boolean} options.useH - true pour 'h' (14h30), false pour ':' (14:30)
 * @param {boolean} options.withA - true pour 'à' (ex: 18/02/2025 à 14h30)
 */
export function formatDateTimeFR(dateInput, options = { useH: false, withA: false }) {
    if (!dateInput) return '';
    const date = formatDateFR(dateInput);
    const hour = formatHourFR(dateInput, options);
    if (options.withA) {
        return `${date} à ${hour}`;
    }
    return `${date} ${hour}`;
}

/**
 * Transforme n'importe quelle heure (ex: "9h", "9:00", "09:00", "9h00", " 14h30 ") en "HH:MM"
 * @param {string} str
 * @returns {string}
 */
export function normalizeHour(str) {
    if (!str) return '';
    // Nettoie les espaces et remplace h/H par :
    let cleaned = String(str).replace(/[hH]/g, ':').replace(/\s/g, '');
    // On force le split :
    let [h, m] = cleaned.split(':');
    if (!h) return '';
    if (!m) m = '00';
    h = h.padStart(2, '0');
    m = m.padStart(2, '0');
    return `${h}:${m}`;
}

// ===============================================
// 🆕 NOUVELLES FONCTIONS AJOUTÉES
// ===============================================

/**
 * Formate une date en ISO (YYYY-MM-DD) pour la base de données
 * @param {Date | string} dateInput
 * @returns {string} Format YYYY-MM-DD
 */
export function formatDateToISO(dateInput) {
    if (!dateInput) return '';

    try {
        const d = new Date(dateInput);
        if (isNaN(d)) return '';

        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    } catch (error) {
        console.error('❌ Erreur formatDateToISO:', error);
        return '';
    }
}

/**
 * Formate une date pour l'affichage dans l'interface (JJ/MM/AAAA)
 * @param {Date | string} dateInput
 * @returns {string} Format JJ/MM/AAAA
 */
export function formatDateForDisplay(dateInput) {
    if (!dateInput) return '';

    try {
        const d = new Date(dateInput);
        if (isNaN(d)) return '';

        return formatDateFR(d);
    } catch (error) {
        console.error('❌ Erreur formatDateForDisplay:', error);
        return '';
    }
}

/**
 * Parse une date d'input (JJ/MM/AAAA ou YYYY-MM-DD) vers le format ISO
 * @param {string} dateString
 * @returns {string} Format YYYY-MM-DD
 */
export function parseDateInputToISO(dateString) {
    if (!dateString) return '';

    try {
        const trimmed = dateString.trim();

        // Format français JJ/MM/AAAA
        if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
            const [day, month, year] = trimmed.split('/');
            const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

            if (isNaN(date)) return '';
            return formatDateToISO(date);
        }

        // Format ISO YYYY-MM-DD
        if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(trimmed)) {
            const date = new Date(trimmed);
            if (isNaN(date)) return '';
            return formatDateToISO(date);
        }

        // Essayer de parser comme date générique
        const date = new Date(trimmed);
        if (isNaN(date)) return '';
        return formatDateToISO(date);
    } catch (error) {
        console.error('❌ Erreur parseDateInputToISO:', error);
        return '';
    }
}

/**
 * Calcule l'âge à partir d'une date de naissance
 * @param {Date | string} birthDate
 * @returns {number} Âge en années
 */
export function calculateAge(birthDate) {
    if (!birthDate) return 0;

    try {
        const birth = new Date(birthDate);
        const today = new Date();

        if (isNaN(birth)) return 0;

        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }

        return Math.max(0, age);
    } catch (error) {
        console.error('❌ Erreur calculateAge:', error);
        return 0;
    }
}

/**
 * Vérifie si une personne est mineure (moins de 18 ans)
 * @param {Date | string} birthDate
 * @returns {boolean}
 */
export function isMinor(birthDate) {
    return calculateAge(birthDate) < 18;
}

/**
 * Formate une date relative (il y a X jours, dans X jours)
 * @param {Date | string} dateInput
 * @returns {string}
 */
export function formatRelativeDate(dateInput) {
    if (!dateInput) return '';

    try {
        const date = new Date(dateInput);
        const today = new Date();

        if (isNaN(date)) return '';

        const diffTime = date.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return "Aujourd'hui";
        if (diffDays === 1) return 'Demain';
        if (diffDays === -1) return 'Hier';
        if (diffDays > 0) return `Dans ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
        return `Il y a ${Math.abs(diffDays)} jour${Math.abs(diffDays) > 1 ? 's' : ''}`;
    } catch (error) {
        console.error('❌ Erreur formatRelativeDate:', error);
        return '';
    }
}

/**
 * Vérifie si une date est valide
 * @param {any} dateInput
 * @returns {boolean}
 */
export function isValidDate(dateInput) {
    if (!dateInput) return false;

    try {
        const date = new Date(dateInput);
        return !isNaN(date.getTime());
    } catch {
        return false;
    }
}

/**
 * Obtient le début de la journée (00:00:00)
 * @param {Date | string} dateInput
 * @returns {Date}
 */
export function getStartOfDay(dateInput) {
    const date = new Date(dateInput);
    date.setHours(0, 0, 0, 0);
    return date;
}

/**
 * Obtient la fin de la journée (23:59:59)
 * @param {Date | string} dateInput
 * @returns {Date}
 */
export function getEndOfDay(dateInput) {
    const date = new Date(dateInput);
    date.setHours(23, 59, 59, 999);
    return date;
}
