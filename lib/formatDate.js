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
