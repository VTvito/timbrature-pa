/**
 * DateUtils - Utility per gestione date e settimane ISO 8601
 * 
 * @description Funzioni helper per manipolazione date, calcolo settimane ISO,
 * formattazione e parsing. Implementa lo standard ISO 8601 per le settimane.
 */

/**
 * Nomi dei giorni della settimana in italiano
 */
export const DAY_NAMES = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];

/**
 * Nomi dei giorni abbreviati
 */
export const DAY_NAMES_SHORT = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];

/**
 * Nomi dei mesi in italiano
 */
export const MONTH_NAMES = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
];

/**
 * Calcola il numero della settimana ISO 8601 per una data
 * @param {Date} date - Data di riferimento
 * @returns {number} Numero settimana (1-53)
 */
export function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    // ISO: il giorno 4 di gennaio è sempre nella settimana 1
    const dayNum = d.getUTCDay() || 7; // Domenica = 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

/**
 * Calcola l'anno ISO della settimana (può differire dall'anno calendario)
 * @param {Date} date - Data di riferimento
 * @returns {number} Anno ISO
 */
export function getWeekYear(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    return d.getUTCFullYear();
}

/**
 * Genera la chiave settimana in formato ISO (YYYY-Www)
 * @param {Date|number} dateOrYear - Data o anno
 * @param {number} [week] - Numero settimana (se primo param è anno)
 * @returns {string} Chiave formato "2026-W05"
 */
export function getWeekKey(dateOrYear, week) {
    if (dateOrYear instanceof Date) {
        const weekNum = getWeekNumber(dateOrYear);
        const year = getWeekYear(dateOrYear);
        return `${year}-W${String(weekNum).padStart(2, '0')}`;
    }
    return `${dateOrYear}-W${String(week).padStart(2, '0')}`;
}

/**
 * Ottiene il primo giorno (lunedì) di una settimana ISO
 * @param {number} year - Anno ISO
 * @param {number} week - Numero settimana
 * @returns {Date} Data del lunedì della settimana
 */
export function getWeekStartDate(year, week) {
    // Trova il 4 gennaio dell'anno (sempre nella settimana 1)
    const jan4 = new Date(Date.UTC(year, 0, 4));
    const dayOfWeek = jan4.getUTCDay() || 7; // Domenica = 7
    
    // Trova il lunedì della settimana 1
    const week1Monday = new Date(jan4);
    week1Monday.setUTCDate(jan4.getUTCDate() - dayOfWeek + 1);
    
    // Aggiungi le settimane necessarie
    const targetDate = new Date(week1Monday);
    targetDate.setUTCDate(week1Monday.getUTCDate() + (week - 1) * 7);
    
    return targetDate;
}

/**
 * Ottiene tutte le date di una settimana lavorativa (lun-ven)
 * @param {number} year - Anno ISO
 * @param {number} week - Numero settimana
 * @returns {Date[]} Array di 5 date (lunedì-venerdì)
 */
export function getWorkWeekDates(year, week) {
    const monday = getWeekStartDate(year, week);
    const dates = [];
    
    for (let i = 0; i < 5; i++) {
        const date = new Date(monday);
        date.setUTCDate(monday.getUTCDate() + i);
        dates.push(date);
    }
    
    return dates;
}

/**
 * Ottiene tutte le date di una settimana completa (lun-dom)
 * @param {number} year - Anno ISO
 * @param {number} week - Numero settimana
 * @returns {Date[]} Array di 7 date
 */
export function getFullWeekDates(year, week) {
    const monday = getWeekStartDate(year, week);
    const dates = [];
    
    for (let i = 0; i < 7; i++) {
        const date = new Date(monday);
        date.setUTCDate(monday.getUTCDate() + i);
        dates.push(date);
    }
    
    return dates;
}

/**
 * Formatta una data in formato ISO (YYYY-MM-DD)
 * @param {Date} date - Data da formattare
 * @returns {string} Data in formato ISO
 */
export function formatDateISO(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Formatta una data in formato italiano (DD/MM/YYYY)
 * @param {Date} date - Data da formattare
 * @param {boolean} [includeYear=true] - Includere l'anno
 * @returns {string} Data formattata
 */
export function formatDateIT(date, includeYear = true) {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    
    if (includeYear) {
        return `${day}/${month}/${year}`;
    }
    return `${day}/${month}`;
}

/**
 * Formatta una data con nome del giorno
 * @param {Date} date - Data da formattare
 * @returns {string} Es: "Lunedì 27/1"
 */
export function formatDateWithDay(date) {
    const dayName = DAY_NAMES[date.getDay()];
    const dateStr = formatDateIT(date, false);
    return `${dayName} ${dateStr}`;
}

/**
 * Parse una stringa data ISO in oggetto Date
 * @param {string} dateStr - Data in formato YYYY-MM-DD
 * @returns {Date} Oggetto Date
 */
export function parseDateISO(dateStr) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
}

/**
 * Parse una chiave settimana ISO in anno e numero settimana
 * @param {string} weekKey - Chiave formato "2026-W05"
 * @returns {{year: number, week: number}} Anno e settimana
 */
export function parseWeekKey(weekKey) {
    const match = weekKey.match(/^(\d{4})-W(\d{2})$/);
    if (!match) {
        throw new Error(`Formato chiave settimana non valido: ${weekKey}`);
    }
    return {
        year: parseInt(match[1], 10),
        week: parseInt(match[2], 10)
    };
}

/**
 * Verifica se una data è oggi
 * @param {Date|string} date - Data da verificare
 * @returns {boolean}
 */
export function isToday(date) {
    const d = typeof date === 'string' ? parseDateISO(date) : date;
    const today = new Date();
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear();
}

/**
 * Verifica se una data è nel weekend
 * @param {Date|string} date - Data da verificare
 * @returns {boolean}
 */
export function isWeekend(date) {
    const d = typeof date === 'string' ? parseDateISO(date) : date;
    const day = d.getDay();
    return day === 0 || day === 6;
}

/**
 * Verifica se è venerdì
 * @param {Date|string} date - Data da verificare
 * @returns {boolean}
 */
export function isFriday(date) {
    const d = typeof date === 'string' ? parseDateISO(date) : date;
    return d.getDay() === 5;
}

/**
 * Ottiene la data corrente senza orario
 * @returns {Date}
 */
export function getToday() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/**
 * Ottiene la settimana e anno correnti
 * @returns {{year: number, week: number}}
 */
export function getCurrentWeek() {
    const today = new Date();
    return {
        year: getWeekYear(today),
        week: getWeekNumber(today)
    };
}

/**
 * Calcola la differenza in giorni tra due date
 * @param {Date} date1 - Prima data
 * @param {Date} date2 - Seconda data
 * @returns {number} Differenza in giorni
 */
export function daysDifference(date1, date2) {
    const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
    const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
    return Math.floor((d2 - d1) / 86400000);
}

/**
 * Calcola la differenza in settimane tra due chiavi settimana
 * @param {string} weekKey1 - Prima chiave settimana
 * @param {string} weekKey2 - Seconda chiave settimana
 * @returns {number} Differenza in settimane (positiva se weekKey2 > weekKey1)
 */
export function weeksDifference(weekKey1, weekKey2) {
    const w1 = parseWeekKey(weekKey1);
    const w2 = parseWeekKey(weekKey2);
    
    const date1 = getWeekStartDate(w1.year, w1.week);
    const date2 = getWeekStartDate(w2.year, w2.week);
    
    return Math.round((date2 - date1) / (7 * 86400000));
}

/**
 * Ottiene la settimana precedente
 * @param {number} year - Anno corrente
 * @param {number} week - Settimana corrente
 * @returns {{year: number, week: number}}
 */
export function getPreviousWeek(year, week) {
    if (week === 1) {
        // Vai all'ultima settimana dell'anno precedente
        const lastWeek = getWeekNumber(new Date(year - 1, 11, 28));
        return { year: year - 1, week: lastWeek };
    }
    return { year, week: week - 1 };
}

/**
 * Ottiene la settimana successiva
 * @param {number} year - Anno corrente
 * @param {number} week - Settimana corrente
 * @returns {{year: number, week: number}}
 */
export function getNextWeek(year, week) {
    const maxWeek = getWeekNumber(new Date(year, 11, 28));
    if (week >= maxWeek) {
        return { year: year + 1, week: 1 };
    }
    return { year, week: week + 1 };
}

/**
 * Verifica se una chiave settimana è la settimana corrente
 * @param {string} weekKey - Chiave settimana da verificare
 * @returns {boolean}
 */
export function isCurrentWeek(weekKey) {
    const current = getCurrentWeek();
    return weekKey === getWeekKey(current.year, current.week);
}

/**
 * Calcola quanti mesi fa è una data
 * @param {Date|string} date - Data da verificare
 * @returns {number} Numero di mesi (approssimativo)
 */
export function monthsAgo(date) {
    const d = typeof date === 'string' ? parseDateISO(date) : date;
    const now = new Date();
    const months = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
    return months;
}

export default {
    DAY_NAMES,
    DAY_NAMES_SHORT,
    MONTH_NAMES,
    getWeekNumber,
    getWeekYear,
    getWeekKey,
    getWeekStartDate,
    getWorkWeekDates,
    getFullWeekDates,
    formatDateISO,
    formatDateIT,
    formatDateWithDay,
    parseDateISO,
    parseWeekKey,
    isToday,
    isWeekend,
    isFriday,
    getToday,
    getCurrentWeek,
    daysDifference,
    weeksDifference,
    getPreviousWeek,
    getNextWeek,
    isCurrentWeek,
    monthsAgo
};
