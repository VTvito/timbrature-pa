/**
 * App Entry Point - Inizializzazione applicazione
 * 
 * @description Bootstrap dell'applicazione. Gestisce il caricamento iniziale,
 * la registrazione del Service Worker e l'avvio del controller principale.
 */

import { AppController } from './controllers/AppController.js';
import { eventBus, EVENTS } from './utils/EventBus.js';

// Istanza globale del controller (per debug)
let app = null;

/**
 * Inizializza l'applicazione
 */
async function initApp() {
    console.log('🕐 Orari Lavoro - Inizializzazione...');

    try {
        // Crea e inizializza il controller
        app = new AppController();
        await app.init();

        // Registra Service Worker per PWA
        await registerServiceWorker();

        console.log('✅ Applicazione inizializzata');

    } catch (error) {
        console.error('❌ Errore inizializzazione:', error);
        showFatalError(error);
    }
}

/**
 * Registra il Service Worker
 */
async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            // Usa path relativo per supportare GitHub Pages
            const swPath = './service-worker.js';
            const registration = await navigator.serviceWorker.register(swPath);

            console.log('Service Worker registrato:', registration.scope);

            // Gestione aggiornamenti
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        // Nuova versione disponibile
                        console.log('Nuova versione dell\'app disponibile');
                        eventBus.emit(EVENTS.TOAST_SHOW, {
                            message: 'Nuova versione disponibile! Ricarica la pagina.',
                            type: 'info'
                        });
                    }
                });
            });

        } catch (error) {
            console.warn('Service Worker non registrato:', error.message);
            // Non bloccare l'app se il SW fallisce
        }
    }
}

// Debug: mostra base URL
console.log('App base URL:', window.location.pathname);

/**
 * Mostra errore fatale
 * @param {Error} error 
 */
function showFatalError(error) {
    const container = document.querySelector('.app-container');
    if (container) {
        container.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <h1>⚠️ Errore</h1>
                <p>Si è verificato un errore durante il caricamento dell'applicazione.</p>
                <p style="color: #666; font-size: 0.9rem;">${error.message}</p>
                <button onclick="location.reload()" style="
                    margin-top: 1rem;
                    padding: 0.5rem 1rem;
                    background: #2563eb;
                    color: white;
                    border: none;
                    border-radius: 0.5rem;
                    cursor: pointer;
                ">
                    Ricarica pagina
                </button>
            </div>
        `;
    }
}

/**
 * Gestione errori globali
 */
window.addEventListener('error', (event) => {
    console.error('Errore globale:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Promise non gestita:', event.reason);
});

// Avvia l'app quando il DOM è pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Esporta per debug da console
window.__app = () => app;
