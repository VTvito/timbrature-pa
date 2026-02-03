/**
 * UIManager - Gestione interfaccia utente
 * 
 * @description Responsabile del rendering dell'interfaccia, gestione eventi UI,
 * toast notifications e aggiornamento elementi DOM.
 */

import { eventBus, EVENTS } from '../utils/EventBus.js';
import { formatDateWithDay, formatDateISO, isToday, isFriday } from '../utils/DateUtils.js';
import { sanitizeString } from '../utils/Validators.js';
import { timeCalculator } from '../services/TimeCalculator.js';

/**
 * Classe per gestione UI
 */
export class UIManager {
    /**
     * @param {Object} options
     * @param {Function} options.onEntrata - Callback per click Entrata
     * @param {Function} options.onUscita - Callback per click Uscita
     * @param {Function} options.onSmart - Callback per click Smart
     * @param {Function} options.onAssente - Callback per click Assente
     * @param {Function} options.onPrevWeek - Callback per navigazione indietro
     * @param {Function} options.onNextWeek - Callback per navigazione avanti
     * @param {Function} options.onEditEntry - Callback per modifica entry
     * @param {Function} options.onExportJSON - Callback per export JSON
     * @param {Function} options.onExportExcel - Callback per export Excel
     * @param {Function} options.onImport - Callback per import
     * @param {Function} options.onBackup - Callback per backup
     */
    constructor(options = {}) {
        this.callbacks = options;
        
        // Riferimenti DOM
        this.elements = {
            weekLabel: document.getElementById('weekLabel'),
            yearLabel: document.getElementById('yearLabel'),
            currentWeekBadge: document.getElementById('currentWeekBadge'),
            weekDays: document.getElementById('weekDays'),
            totalHours: document.getElementById('totalHours'),
            balanceHours: document.getElementById('balanceHours'),
            backupStatus: document.getElementById('backupStatus'),
            backupText: document.getElementById('backupText'),
            toast: document.getElementById('toast'),
            
            // Buttons
            entrataBtn: document.getElementById('entrataBtn'),
            uscitaBtn: document.getElementById('uscitaBtn'),
            smartBtn: document.getElementById('smartBtn'),
            assenteBtn: document.getElementById('assenteBtn'),
            prevWeekBtn: document.getElementById('prevWeekBtn'),
            nextWeekBtn: document.getElementById('nextWeekBtn'),
            exportJsonBtn: document.getElementById('exportJsonBtn'),
            exportExcelBtn: document.getElementById('exportExcelBtn'),
            importBtn: document.getElementById('importBtn'),
            importFile: document.getElementById('importFile'),
            backupBtn: document.getElementById('backupBtn'),
            installBtn: document.getElementById('installBtn')
        };

        this.init();
    }

    /**
     * Inizializza l'UI
     */
    init() {
        this.setupEventListeners();
        this.setupPWAInstall();
    }

    /**
     * Configura gli event listeners
     */
    setupEventListeners() {
        const { elements, callbacks } = this;

        // Action buttons
        elements.entrataBtn?.addEventListener('click', () => {
            callbacks.onEntrata?.();
        });

        elements.uscitaBtn?.addEventListener('click', () => {
            callbacks.onUscita?.();
        });

        elements.smartBtn?.addEventListener('click', () => {
            callbacks.onSmart?.();
        });

        elements.assenteBtn?.addEventListener('click', () => {
            callbacks.onAssente?.();
        });

        // Navigation
        elements.prevWeekBtn?.addEventListener('click', () => {
            callbacks.onPrevWeek?.();
        });

        elements.nextWeekBtn?.addEventListener('click', () => {
            callbacks.onNextWeek?.();
        });

        // Export/Import
        elements.exportJsonBtn?.addEventListener('click', () => {
            callbacks.onExportJSON?.();
        });

        elements.exportExcelBtn?.addEventListener('click', () => {
            callbacks.onExportExcel?.();
        });

        elements.importBtn?.addEventListener('click', () => {
            elements.importFile?.click();
        });

        elements.importFile?.addEventListener('change', (e) => {
            const file = e.target.files?.[0];
            if (file) {
                callbacks.onImport?.(file);
                e.target.value = ''; // Reset per permettere reimport stesso file
            }
        });

        elements.backupBtn?.addEventListener('click', () => {
            callbacks.onBackup?.();
        });

        // Subscribe to events
        eventBus.on(EVENTS.TOAST_SHOW, (data) => {
            this.showToast(data.message, data.type);
        });
    }

    /**
     * Setup PWA install prompt
     */
    setupPWAInstall() {
        let deferredPrompt = null;
        const installBtn = this.elements.installBtn;
        const installBanner = document.getElementById('installBanner');
        const installBannerBtn = document.getElementById('installBannerBtn');
        const installBannerClose = document.getElementById('installBannerClose');
        
        // Chiave localStorage per tracciare dismissioni
        const INSTALL_DISMISSED_KEY = 'pwa_install_dismissed';
        const INSTALL_DISMISSED_EXPIRES = 7 * 24 * 60 * 60 * 1000; // 7 giorni

        /**
         * Controlla se l'utente ha già chiuso il banner di recente
         */
        const wasDismissedRecently = () => {
            const dismissed = localStorage.getItem(INSTALL_DISMISSED_KEY);
            if (!dismissed) return false;
            const dismissedTime = parseInt(dismissed, 10);
            return (Date.now() - dismissedTime) < INSTALL_DISMISSED_EXPIRES;
        };

        /**
         * Controlla se è iOS (Safari)
         */
        const isIOS = () => {
            return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        };

        /**
         * Controlla se l'app è già installata (standalone mode)
         */
        const isStandalone = () => {
            return window.matchMedia('(display-mode: standalone)').matches ||
                   window.navigator.standalone === true;
        };

        /**
         * Mostra banner installazione
         */
        const showInstallBanner = () => {
            if (installBanner && !wasDismissedRecently() && !isStandalone()) {
                installBanner.style.display = 'block';
                document.body.classList.add('has-install-banner');
            }
        };

        /**
         * Nascondi banner installazione
         */
        const hideInstallBanner = () => {
            if (installBanner) {
                installBanner.style.display = 'none';
                document.body.classList.remove('has-install-banner');
            }
        };

        /**
         * Mostra hint per iOS
         */
        const showIOSHint = () => {
            if (isIOS() && !isStandalone() && !wasDismissedRecently()) {
                // Crea hint iOS se non esiste
                let iosHint = document.getElementById('iosInstallHint');
                if (!iosHint) {
                    iosHint = document.createElement('div');
                    iosHint.id = 'iosInstallHint';
                    iosHint.className = 'ios-install-hint';
                    iosHint.innerHTML = `
                        <p><strong>📲 Installa Orari Lavoro</strong></p>
                        <p>Tocca <span class="ios-icon">⬆️</span> e poi <strong>"Aggiungi a Home"</strong></p>
                        <button class="btn btn-close-ios" id="closeIOSHint">Ho capito</button>
                    `;
                    document.body.appendChild(iosHint);
                    
                    document.getElementById('closeIOSHint')?.addEventListener('click', () => {
                        iosHint.remove();
                        localStorage.setItem(INSTALL_DISMISSED_KEY, Date.now().toString());
                    });
                }
            }
        };

        // Evento: prompt installazione disponibile (Chrome, Edge, etc.)
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            
            // Mostra bottone header
            if (installBtn) {
                installBtn.style.display = 'block';
            }
            
            // Mostra banner (solo se non dismissato di recente)
            showInstallBanner();
        });

        // Click su bottone header
        installBtn?.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                
                if (outcome === 'accepted') {
                    this.showToast('🎉 App installata!', 'success');
                }
                
                deferredPrompt = null;
                installBtn.style.display = 'none';
                hideInstallBanner();
            }
        });

        // Click su bottone banner
        installBannerBtn?.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                
                if (outcome === 'accepted') {
                    this.showToast('🎉 App installata con successo!', 'success');
                }
                
                deferredPrompt = null;
                hideInstallBanner();
                if (installBtn) installBtn.style.display = 'none';
            }
        });

        // Click su chiudi banner
        installBannerClose?.addEventListener('click', () => {
            hideInstallBanner();
            localStorage.setItem(INSTALL_DISMISSED_KEY, Date.now().toString());
            this.showToast('Puoi installare l\'app dal pulsante in alto', 'info');
        });

        // App installata
        window.addEventListener('appinstalled', () => {
            hideInstallBanner();
            if (installBtn) installBtn.style.display = 'none';
            this.showToast('🎉 App installata con successo!', 'success');
        });

        // Per iOS mostra hint dopo un delay
        if (isIOS() && !isStandalone()) {
            setTimeout(showIOSHint, 3000);
        }
    }

    /**
     * Aggiorna la vista della settimana
     * @param {Object} weekInfo - Info settimana
     * @param {Object} weekData - Dati della settimana
     */
    renderWeek(weekInfo, weekData) {
        // Aggiorna header settimana
        this.elements.weekLabel.textContent = `Settimana ${weekInfo.week}`;
        this.elements.yearLabel.textContent = weekInfo.year;
        
        // Badge settimana corrente
        if (weekInfo.isCurrent) {
            this.elements.currentWeekBadge.style.display = 'inline-flex';
        } else {
            this.elements.currentWeekBadge.style.display = 'none';
        }

        // Render giorni
        this.renderDays(weekInfo.days, weekData);

        // Calcola e mostra totali
        this.updateTotals(weekData);
    }

    /**
     * Render dei giorni della settimana
     * @param {Array} days - Info giorni
     * @param {Object} weekData - Dati settimana
     */
    renderDays(days, weekData) {
        const container = this.elements.weekDays;
        container.innerHTML = '';

        for (const day of days) {
            const entries = weekData[day.dateKey] || [];
            const dayCard = this.createDayCard(day, entries);
            container.appendChild(dayCard);
        }
    }

    /**
     * Crea la card di un giorno
     * @param {Object} day - Info giorno
     * @param {Array} entries - Entry del giorno
     * @returns {HTMLElement}
     */
    createDayCard(day, entries) {
        const card = document.createElement('article');
        card.className = 'day-card';
        
        if (day.isToday) {
            card.classList.add('is-today');
        }

        // Calcola ore del giorno
        const dayHours = timeCalculator.calculateDayHours(entries, day.dateKey);

        // Header
        const header = document.createElement('header');
        header.className = 'day-header';
        header.innerHTML = `
            <div>
                <span class="day-name">${this.getDayName(day.dayOfWeek)}</span>
                <span class="day-date">${this.formatDate(day.date)}</span>
            </div>
            <span class="day-hours">${dayHours.formatted}</span>
        `;
        card.appendChild(header);

        // Entries
        const entriesContainer = document.createElement('div');
        entriesContainer.className = 'day-entries';

        if (entries.length === 0) {
            entriesContainer.classList.add('empty');
            entriesContainer.textContent = 'Nessuna registrazione';
        } else {
            entries.forEach((entry, index) => {
                const entryEl = this.createEntryItem(entry, day.dateKey, index);
                entriesContainer.appendChild(entryEl);
            });
        }

        card.appendChild(entriesContainer);
        return card;
    }

    /**
     * Crea l'elemento di una singola entry
     * @param {Object} entry - Dati entry
     * @param {string} dateKey - Data ISO
     * @param {number} index - Indice entry
     * @returns {HTMLElement}
     */
    createEntryItem(entry, dateKey, index) {
        const item = document.createElement('div');
        item.className = 'entry-item';
        item.setAttribute('role', 'button');
        item.setAttribute('tabindex', '0');
        item.setAttribute('aria-label', `Modifica ${entry.type}`);

        const displayValue = entry.time || `${entry.hours}h`;
        const typeLabel = this.getTypeLabel(entry.type);
        const typeClass = `type-${entry.type}`;

        item.innerHTML = `
            <div class="entry-info">
                <span class="entry-time">${sanitizeString(displayValue)}</span>
                <span class="entry-type ${typeClass}">${typeLabel}</span>
            </div>
            <button class="entry-edit-btn" aria-label="Modifica">✏️</button>
        `;

        // Click handler per modifica
        const handleClick = () => {
            this.callbacks.onEditEntry?.(dateKey, index, entry);
        };

        item.addEventListener('click', handleClick);
        item.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleClick();
            }
        });

        return item;
    }

    /**
     * Aggiorna i totali della settimana
     * @param {Object} weekData - Dati settimana
     */
    updateTotals(weekData) {
        const weekTotal = timeCalculator.calculateWeekTotal(weekData);
        const balance = timeCalculator.calculateBalance(weekTotal.minutes);

        this.elements.totalHours.textContent = weekTotal.formatted;
        this.elements.balanceHours.textContent = balance.formatted;

        // Aggiorna classe per colore
        this.elements.balanceHours.classList.remove('balance-positive', 'balance-negative', 'balance-neutral');
        
        if (balance.isPositive) {
            this.elements.balanceHours.classList.add('balance-positive');
        } else if (balance.isNegative) {
            this.elements.balanceHours.classList.add('balance-negative');
        } else {
            this.elements.balanceHours.classList.add('balance-neutral');
        }
    }

    /**
     * Aggiorna lo stato del backup
     * @param {Object|null} backupInfo - Info backup
     */
    updateBackupStatus(backupInfo) {
        const { backupStatus, backupText } = this.elements;

        if (!backupInfo) {
            // Prima apertura - messaggio neutro
            backupStatus.className = 'backup-status';
            backupText.textContent = 'Backup: non ancora effettuato';
            return;
        }

        const { hoursSince, isRecent } = backupInfo;

        if (isRecent) {
            backupStatus.className = 'backup-status';
            backupText.textContent = hoursSince < 1 
                ? 'Ultimo backup: meno di 1 ora fa'
                : `Ultimo backup: ${hoursSince}h fa`;
        } else {
            backupStatus.className = 'backup-status status-warning';
            backupText.textContent = `Ultimo backup: ${hoursSince}h fa ⚠️`;
        }
    }

    /**
     * Mostra un toast notification
     * @param {string} message - Messaggio
     * @param {string} [type='info'] - Tipo: success, error, warning, info
     * @param {number} [duration=3000] - Durata in ms
     */
    showToast(message, type = 'info', duration = 3000) {
        const toast = this.elements.toast;
        
        // Reset classi
        toast.className = 'toast';
        
        if (type !== 'info') {
            toast.classList.add(`toast-${type}`);
        }
        
        toast.textContent = message;
        toast.classList.add('is-visible');

        // Auto-hide
        setTimeout(() => {
            toast.classList.remove('is-visible');
        }, duration);
    }

    /**
     * Ottiene il nome del giorno
     * @param {number} dayOfWeek - Giorno (0=Dom, 1=Lun, ...)
     * @returns {string}
     */
    getDayName(dayOfWeek) {
        const names = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
        return names[dayOfWeek];
    }

    /**
     * Formatta una data per la UI
     * @param {Date} date - Data
     * @returns {string}
     */
    formatDate(date) {
        return `${date.getDate()}/${date.getMonth() + 1}`;
    }

    /**
     * Ottiene l'etichetta del tipo entry
     * @param {string} type - Tipo
     * @returns {string}
     */
    getTypeLabel(type) {
        const labels = {
            'entrata': 'Entrata',
            'uscita': 'Uscita',
            'smart': 'Smart Working',
            'assente': 'Assente'
        };
        return labels[type] || type;
    }

    /**
     * Abilita/disabilita un bottone
     * @param {string} buttonName - Nome bottone
     * @param {boolean} enabled - Stato
     */
    setButtonEnabled(buttonName, enabled) {
        const btn = this.elements[buttonName];
        if (btn) {
            btn.disabled = !enabled;
        }
    }

    /**
     * Mostra indicatore di caricamento
     * @param {boolean} show - Mostrare/nascondere
     */
    showLoading(show) {
        // Implementazione semplice: disabilita tutti i bottoni
        const buttons = ['entrataBtn', 'uscitaBtn', 'smartBtn', 'assenteBtn'];
        buttons.forEach(btn => this.setButtonEnabled(btn, !show));
    }
}

export default UIManager;
