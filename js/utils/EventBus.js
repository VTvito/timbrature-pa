/**
 * EventBus - Pattern Pub/Sub per comunicazione disaccoppiata tra componenti
 * 
 * @description Sistema di eventi centralizzato che permette ai componenti
 * di comunicare senza dipendenze dirette. Supporta eventi tipizzati,
 * listener multipli e unsubscribe automatico.
 * 
 * @example
 * // Subscribe
 * const unsubscribe = eventBus.on('entryAdded', (data) => console.log(data));
 * 
 * // Emit
 * eventBus.emit('entryAdded', { date: '2026-02-03', type: 'entrata' });
 * 
 * // Unsubscribe
 * unsubscribe();
 */

class EventBus {
    constructor() {
        /** @type {Map<string, Set<Function>>} */
        this.listeners = new Map();
        
        /** @type {Map<string, any>} */
        this.lastEmitted = new Map();
    }

    /**
     * Registra un listener per un evento specifico
     * @param {string} event - Nome dell'evento
     * @param {Function} callback - Funzione da eseguire quando l'evento viene emesso
     * @param {Object} options - Opzioni aggiuntive
     * @param {boolean} options.once - Se true, il listener viene rimosso dopo la prima esecuzione
     * @param {boolean} options.immediate - Se true, esegue immediatamente con l'ultimo valore emesso
     * @returns {Function} Funzione per annullare la sottoscrizione
     */
    on(event, callback, options = {}) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }

        const wrappedCallback = options.once 
            ? (...args) => {
                this.off(event, wrappedCallback);
                callback(...args);
            }
            : callback;

        this.listeners.get(event).add(wrappedCallback);

        // Se richiesto, esegui immediatamente con l'ultimo valore
        if (options.immediate && this.lastEmitted.has(event)) {
            callback(this.lastEmitted.get(event));
        }

        // Ritorna funzione unsubscribe
        return () => this.off(event, wrappedCallback);
    }

    /**
     * Registra un listener che viene eseguito una sola volta
     * @param {string} event - Nome dell'evento
     * @param {Function} callback - Funzione da eseguire
     * @returns {Function} Funzione per annullare la sottoscrizione
     */
    once(event, callback) {
        return this.on(event, callback, { once: true });
    }

    /**
     * Rimuove un listener specifico per un evento
     * @param {string} event - Nome dell'evento
     * @param {Function} callback - Funzione da rimuovere
     */
    off(event, callback) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).delete(callback);
        }
    }

    /**
     * Rimuove tutti i listener per un evento specifico
     * @param {string} event - Nome dell'evento (se omesso, rimuove tutti)
     */
    offAll(event = null) {
        if (event) {
            this.listeners.delete(event);
        } else {
            this.listeners.clear();
        }
    }

    /**
     * Emette un evento con dati opzionali
     * @param {string} event - Nome dell'evento
     * @param {any} data - Dati da passare ai listener
     */
    emit(event, data = null) {
        // Salva l'ultimo valore emesso
        this.lastEmitted.set(event, data);

        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`EventBus: Errore nel listener per '${event}':`, error);
                }
            });
        }
    }

    /**
     * Verifica se esistono listener per un evento
     * @param {string} event - Nome dell'evento
     * @returns {boolean}
     */
    hasListeners(event) {
        return this.listeners.has(event) && this.listeners.get(event).size > 0;
    }

    /**
     * Restituisce il numero di listener per un evento
     * @param {string} event - Nome dell'evento
     * @returns {number}
     */
    listenerCount(event) {
        return this.listeners.has(event) ? this.listeners.get(event).size : 0;
    }
}

// Eventi predefiniti dell'applicazione
export const EVENTS = {
    // Entry events
    ENTRY_ADDED: 'entry:added',
    ENTRY_UPDATED: 'entry:updated',
    ENTRY_DELETED: 'entry:deleted',
    
    // Week events
    WEEK_CHANGED: 'week:changed',
    WEEK_DATA_LOADED: 'week:dataLoaded',
    
    // Storage events
    DATA_SAVED: 'storage:saved',
    DATA_LOADED: 'storage:loaded',
    BACKUP_CREATED: 'storage:backupCreated',
    BACKUP_NEEDED: 'storage:backupNeeded',
    
    // UI events
    TOAST_SHOW: 'ui:toast',
    MODAL_OPEN: 'ui:modalOpen',
    MODAL_CLOSE: 'ui:modalClose',
    RENDER_REQUESTED: 'ui:renderRequested',
    
    // App events
    APP_INITIALIZED: 'app:initialized',
    APP_ERROR: 'app:error',
    CLEAN_DATA_NEEDED: 'app:cleanDataNeeded'
};

// Istanza singleton
export const eventBus = new EventBus();

export default EventBus;
