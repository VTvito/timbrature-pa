/**
 * IndexedDBAdapter - Adapter per IndexedDB
 * 
 * @description Implementa l'interfaccia storage per IndexedDB.
 * Fornisce operazioni CRUD asincrone con supporto backup.
 */

const DB_NAME = 'OrariLavoroDB';
const DB_VERSION = 1;
const STORE_WEEKS = 'weeks';
const STORE_BACKUPS = 'backups';
const STORE_META = 'metadata';

export class IndexedDBAdapter {
    constructor() {
        /** @type {IDBDatabase|null} */
        this.db = null;
        this.isAvailable = this.checkAvailability();
    }

    /**
     * Verifica se IndexedDB è disponibile
     * @returns {boolean}
     */
    checkAvailability() {
        return typeof indexedDB !== 'undefined';
    }

    /**
     * Inizializza il database
     * @returns {Promise<boolean>}
     */
    async init() {
        if (!this.isAvailable) {
            console.warn('IndexedDB non disponibile');
            return false;
        }

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                console.error('Errore apertura IndexedDB:', request.error);
                resolve(false);
            };

            request.onsuccess = () => {
                this.db = request.result;
                resolve(true);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Store per i dati settimanali
                if (!db.objectStoreNames.contains(STORE_WEEKS)) {
                    db.createObjectStore(STORE_WEEKS, { keyPath: 'weekKey' });
                }

                // Store per i backup
                if (!db.objectStoreNames.contains(STORE_BACKUPS)) {
                    const backupStore = db.createObjectStore(STORE_BACKUPS, { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    backupStore.createIndex('timestamp', 'timestamp', { unique: false });
                }

                // Store per metadati
                if (!db.objectStoreNames.contains(STORE_META)) {
                    db.createObjectStore(STORE_META, { keyPath: 'key' });
                }
            };
        });
    }

    /**
     * Verifica se il DB è pronto
     * @returns {boolean}
     */
    isReady() {
        return this.db !== null;
    }

    /**
     * Salva tutti i dati
     * @param {Object} data - Dati da salvare
     * @returns {Promise<boolean>}
     */
    async saveAllData(data) {
        if (!this.isReady()) {
            throw new Error('IndexedDB non inizializzato');
        }

        const transaction = this.db.transaction([STORE_WEEKS], 'readwrite');
        const store = transaction.objectStore(STORE_WEEKS);

        // Prima pulisci tutti i dati esistenti
        await this.promisifyRequest(store.clear());

        // Poi salva i nuovi dati
        for (const [weekKey, weekData] of Object.entries(data)) {
            await this.promisifyRequest(store.put({ weekKey, data: weekData }));
        }

        return true;
    }

    /**
     * Carica tutti i dati
     * @returns {Promise<Object>}
     */
    async loadAllData() {
        if (!this.isReady()) {
            return {};
        }

        try {
            const transaction = this.db.transaction([STORE_WEEKS], 'readonly');
            const store = transaction.objectStore(STORE_WEEKS);
            const results = await this.promisifyRequest(store.getAll());

            const data = {};
            results.forEach(item => {
                data[item.weekKey] = item.data;
            });

            return data;
        } catch (e) {
            console.error('Errore caricamento IndexedDB:', e);
            return {};
        }
    }

    /**
     * Salva i dati di una settimana specifica
     * @param {string} weekKey - Chiave settimana
     * @param {Object} weekData - Dati della settimana
     * @returns {Promise<boolean>}
     */
    async saveWeekData(weekKey, weekData) {
        if (!this.isReady()) {
            throw new Error('IndexedDB non inizializzato');
        }

        const transaction = this.db.transaction([STORE_WEEKS], 'readwrite');
        const store = transaction.objectStore(STORE_WEEKS);
        
        await this.promisifyRequest(store.put({ weekKey, data: weekData }));
        return true;
    }

    /**
     * Carica i dati di una settimana specifica
     * @param {string} weekKey - Chiave settimana
     * @returns {Promise<Object|null>}
     */
    async loadWeekData(weekKey) {
        if (!this.isReady()) {
            return null;
        }

        try {
            const transaction = this.db.transaction([STORE_WEEKS], 'readonly');
            const store = transaction.objectStore(STORE_WEEKS);
            const result = await this.promisifyRequest(store.get(weekKey));
            
            return result ? result.data : null;
        } catch (e) {
            console.error(`Errore caricamento settimana ${weekKey}:`, e);
            return null;
        }
    }

    /**
     * Elimina i dati di una settimana
     * @param {string} weekKey - Chiave settimana
     * @returns {Promise<boolean>}
     */
    async deleteWeekData(weekKey) {
        if (!this.isReady()) {
            return false;
        }

        try {
            const transaction = this.db.transaction([STORE_WEEKS], 'readwrite');
            const store = transaction.objectStore(STORE_WEEKS);
            await this.promisifyRequest(store.delete(weekKey));
            return true;
        } catch (e) {
            console.error(`Errore eliminazione settimana ${weekKey}:`, e);
            return false;
        }
    }

    /**
     * Ottiene tutte le chiavi settimana salvate
     * @returns {Promise<string[]>}
     */
    async getWeekKeys() {
        if (!this.isReady()) {
            return [];
        }

        try {
            const transaction = this.db.transaction([STORE_WEEKS], 'readonly');
            const store = transaction.objectStore(STORE_WEEKS);
            const results = await this.promisifyRequest(store.getAllKeys());
            return results.sort();
        } catch (e) {
            console.error('Errore recupero chiavi settimana:', e);
            return [];
        }
    }

    /**
     * Crea un backup completo
     * @param {Object} data - Dati da salvare nel backup
     * @returns {Promise<number>} ID del backup creato
     */
    async createBackup(data) {
        if (!this.isReady()) {
            throw new Error('IndexedDB non inizializzato');
        }

        const backup = {
            timestamp: Date.now(),
            data: data
        };

        const transaction = this.db.transaction([STORE_BACKUPS], 'readwrite');
        const store = transaction.objectStore(STORE_BACKUPS);
        const id = await this.promisifyRequest(store.add(backup));

        // Pulisci backup vecchi (mantieni ultimi 10)
        await this.cleanOldBackups();

        return id;
    }

    /**
     * Ottiene l'ultimo backup
     * @returns {Promise<Object|null>}
     */
    async getLastBackup() {
        if (!this.isReady()) {
            return null;
        }

        try {
            const transaction = this.db.transaction([STORE_BACKUPS], 'readonly');
            const store = transaction.objectStore(STORE_BACKUPS);
            const index = store.index('timestamp');
            
            const cursor = await this.promisifyRequest(
                index.openCursor(null, 'prev')
            );

            if (cursor) {
                return cursor.value;
            }
            return null;
        } catch (e) {
            console.error('Errore recupero ultimo backup:', e);
            return null;
        }
    }

    /**
     * Ottiene tutti i backup
     * @returns {Promise<Array>}
     */
    async getAllBackups() {
        if (!this.isReady()) {
            return [];
        }

        try {
            const transaction = this.db.transaction([STORE_BACKUPS], 'readonly');
            const store = transaction.objectStore(STORE_BACKUPS);
            return await this.promisifyRequest(store.getAll());
        } catch (e) {
            console.error('Errore recupero backup:', e);
            return [];
        }
    }

    /**
     * Ripristina un backup
     * @param {number} backupId - ID del backup da ripristinare
     * @returns {Promise<Object|null>}
     */
    async restoreBackup(backupId) {
        if (!this.isReady()) {
            return null;
        }

        try {
            const transaction = this.db.transaction([STORE_BACKUPS], 'readonly');
            const store = transaction.objectStore(STORE_BACKUPS);
            const backup = await this.promisifyRequest(store.get(backupId));
            
            if (backup) {
                await this.saveAllData(backup.data);
                return backup.data;
            }
            return null;
        } catch (e) {
            console.error('Errore ripristino backup:', e);
            return null;
        }
    }

    /**
     * Pulisce i backup vecchi (mantiene ultimi 10)
     * @returns {Promise<number>} Numero di backup eliminati
     */
    async cleanOldBackups() {
        if (!this.isReady()) {
            return 0;
        }

        try {
            const backups = await this.getAllBackups();
            
            if (backups.length <= 10) {
                return 0;
            }

            // Ordina per timestamp e prendi quelli da eliminare
            backups.sort((a, b) => a.timestamp - b.timestamp);
            const toDelete = backups.slice(0, backups.length - 10);

            const transaction = this.db.transaction([STORE_BACKUPS], 'readwrite');
            const store = transaction.objectStore(STORE_BACKUPS);

            for (const backup of toDelete) {
                await this.promisifyRequest(store.delete(backup.id));
            }

            return toDelete.length;
        } catch (e) {
            console.error('Errore pulizia backup:', e);
            return 0;
        }
    }

    /**
     * Salva un metadato
     * @param {string} key - Chiave del metadato
     * @param {any} value - Valore da salvare
     * @returns {Promise<boolean>}
     */
    async setMeta(key, value) {
        if (!this.isReady()) {
            return false;
        }

        try {
            const transaction = this.db.transaction([STORE_META], 'readwrite');
            const store = transaction.objectStore(STORE_META);
            await this.promisifyRequest(store.put({ key, value }));
            return true;
        } catch (e) {
            console.error(`Errore salvataggio meta ${key}:`, e);
            return false;
        }
    }

    /**
     * Ottiene un metadato
     * @param {string} key - Chiave del metadato
     * @returns {Promise<any>}
     */
    async getMeta(key) {
        if (!this.isReady()) {
            return null;
        }

        try {
            const transaction = this.db.transaction([STORE_META], 'readonly');
            const store = transaction.objectStore(STORE_META);
            const result = await this.promisifyRequest(store.get(key));
            return result ? result.value : null;
        } catch (e) {
            console.error(`Errore lettura meta ${key}:`, e);
            return null;
        }
    }

    /**
     * Elimina tutti i dati
     * @returns {Promise<boolean>}
     */
    async clearAll() {
        if (!this.isReady()) {
            return false;
        }

        try {
            const transaction = this.db.transaction([STORE_WEEKS, STORE_META], 'readwrite');
            
            await this.promisifyRequest(
                transaction.objectStore(STORE_WEEKS).clear()
            );
            await this.promisifyRequest(
                transaction.objectStore(STORE_META).clear()
            );
            
            return true;
        } catch (e) {
            console.error('Errore pulizia IndexedDB:', e);
            return false;
        }
    }

    /**
     * Converte una IDBRequest in Promise
     * @param {IDBRequest} request
     * @returns {Promise<any>}
     */
    promisifyRequest(request) {
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Chiude la connessione al database
     */
    close() {
        if (this.db) {
            this.db.close();
            this.db = null;
        }
    }
}

export default IndexedDBAdapter;
