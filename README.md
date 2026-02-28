# ⏰ Timbra PA

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-brightgreen.svg)](https://web.dev/progressive-web-apps/)
[![Made in Italy](https://img.shields.io/badge/Made%20in-Italy%20🇮🇹-green.svg)](#)
[![Offline First](https://img.shields.io/badge/Offline-First-orange.svg)](#)
[![No Backend](https://img.shields.io/badge/Backend-Non%20richiesto-purple.svg)](#)

> 📱 **L'app gratuita per tracciare le ore di lavoro dei dipendenti pubblici italiani.**  
> Funziona offline, si installa come un'app nativa, i tuoi dati restano solo sul tuo dispositivo.

![Screenshot App](docs/screenshot.svg)

---

## 🎯 Perché Timbra PA?

| ❌ Altre app | ✅ Timbra PA |
|---|---|
| Richiedono account | **Nessuna registrazione** |
| Dati su server esterni | **Dati solo sul TUO dispositivo** |
| Abbonamento mensile | **100% gratuita, per sempre** |
| Progettate per il settore privato | **Pensata per la PA italiana (CCNL Funzioni Locali)** |
| Calcoli manuali | **36h/settimana calcolate in automatico** |

---

## ✨ Funzionalità

### 📊 Calcolo automatico ore
- **Target settimanale 36 ore** — standard CCNL Funzioni Locali
- **Saldo positivo/negativo** aggiornato in tempo reale
- **Pausa pranzo 30 min** dedotta automaticamente (tutti i giorni, se ore lorde > 6h)
- **Settimane ISO 8601** — navigazione veloce avanti/indietro

### 🏠 Smart Working & Assenze
- **Lavoro Agile**: registra 7h 30m (Lun–Gio) o 6h (Venerdì) con un tocco
- **Assenze**: traccia ferie, permessi, malattia
- **Entrate/Uscite multiple** nello stesso giorno (pause reali considerate)

### 📅 Suggerimento uscita venerdì
- L'app calcola gli extra accumulati da lunedì a giovedì
- Venerdì suggerisce l'**ora di uscita anticipata** in base al credito ore

### 🔒 Privacy assoluta
- **Zero cloud**: i dati non lasciano MAI il tuo dispositivo
- **Nessun tracciamento**: no analytics, no cookies di terze parti
- **Open source**: codice verificabile da chiunque

### 📴 Funziona offline
- **Installabile come app nativa** su smartphone e desktop
- **Funziona senza internet** — perfetto in ufficio senza Wi-Fi
- **Si aggiorna automaticamente** quando torni online

### 📤 Export dati
- **JSON**: backup completo, reimportabile nell'app
- **CSV/Excel**: per elaborazioni e report
- **Nessun backup cloud**: scarichi tu il file quando vuoi

---

## 🔐 I tuoi dati sono tuoi

```
┌─────────────────────────────────────────────────────┐
│              📱 IL TUO DISPOSITIVO                  │
│                                                     │
│   ┌───────────────┐    ┌──────────────────────┐    │
│   │ localStorage  │    │     IndexedDB        │    │
│   │  (Primario)   │    │    (Fallback)        │    │
│   └───────────────┘    └──────────────────────┘    │
│                                                     │
│   ✅ Dati salvati SOLO qui                          │
│   ✅ Nessun server esterno                          │
│   ✅ Nessun account richiesto                       │
│   ✅ Export manuale quando vuoi                     │
│                                                     │
└─────────────────────────────────────────────────────┘
                         │
                         ✕ NESSUN DATO ESCE
```

> ⚠️ **Nota iOS**: Safari può eliminare i dati PWA dopo 7 giorni di inutilizzo.  
> Apri l'app almeno 1 volta a settimana o esporta periodicamente con "Esporta Backup JSON".

---

## 🚀 Inizia subito

### Usa online (nessuna installazione)
👉 **[Apri Timbra PA](https://vtvito.github.io/italian-pa-employee-attendance/)**

### Installa come app

#### 📱 Android (Chrome)
1. Apri il link sopra in **Chrome**
2. Tocca **"Installa"** nel banner che appare automaticamente
3. Oppure: Menu (⋮) → **"Aggiungi a schermata Home"**

#### 🍎 iPhone / iPad (Safari o Chrome)

1. Apri il link in **Safari** o **Chrome**
2. Tocca **Condividi**: Safari → icona ⬆️ in basso; Chrome → menu **⋯** poi "Condividi"
3. Scegli **"Aggiungi a Home"** ➕
4. Tocca **"Aggiungi"** in alto a destra ✅

> 💡 L'app mostra una guida visiva animata al primo accesso da iPhone.

#### 💻 Desktop (Chrome / Edge)
1. Apri il link nel browser
2. Clicca l'icona **⊕** nella barra indirizzi
3. Conferma "Installa"

---

## 🏗️ Per sviluppatori

### Architettura

Pattern **MVC + Observer + Repository**, zero dipendenze:

```
js/
├── app.js               # Bootstrap, SW registration, update flow
├── controllers/
│   └── AppController.js # Orchestrazione MVC
├── models/
│   ├── TimeEntry.js     # Singola timbratura
│   └── WeekData.js      # Dati settimana
├── views/
│   ├── UIManager.js     # Rendering UI, toast, PWA install
│   └── ModalManager.js  # Modali (edit, add, confirm, clean)
├── services/
│   ├── TimeCalculator.js # Calcoli ore, pause, delta, suggerimento venerdì
│   ├── WeekNavigator.js  # Navigazione settimane ISO 8601
│   └── ExportService.js  # Export JSON / CSV, import
├── storage/
│   ├── StorageManager.js     # Repository pattern, dual storage
│   ├── LocalStorageAdapter.js
│   └── IndexedDBAdapter.js
└── utils/
    ├── EventBus.js      # Pub/Sub con eventi tipizzati
    ├── DateUtils.js     # ISO 8601, formatting, parsing
    └── Validators.js    # Validazione orari
```

### Stack tecnologico

| Layer | Tecnologia |
|---|---|
| Linguaggio | Vanilla JavaScript ES6+ — no framework, no bundler |
| Moduli | ES Modules nativi (`<script type="module">`) |
| Stile | Single CSS file, variabili CSS custom, design iOS-inspired |
| Storage | localStorage (primario) + IndexedDB (fallback) |
| Offline | Service Worker con pre-cache + stale-while-revalidate |
| Manifesto | `manifest.json` — PWA standalone con shortcuts |
| Icone | SVG con linear gradient (192px, 512px) |

### Sviluppo locale

```bash
git clone https://github.com/VTvito/italian-pa-employee-attendance.git
cd italian-pa-employee-attendance

# Avvia server locale
python -m http.server 8000
# Apri http://localhost:8000
```

### Test

```bash
# Apri nel browser
http://localhost:8000/tests/
```

---

## 📋 Configurazione

Le costanti sono in [`js/services/TimeCalculator.js`](js/services/TimeCalculator.js):

```javascript
export const CONFIG = {
    WEEKLY_TARGET_HOURS: 36,        // Ore settimanali target PA
    PAUSE_MINUTES: 30,              // Pausa minima obbligatoria
    PAUSE_THRESHOLD_HOURS: 6,       // Soglia per applicare pausa (tutti i giorni)
    SMART_HOURS_DEFAULT: 7.5,       // Smart working Lun–Gio
    SMART_HOURS_FRIDAY: 6,          // Smart working Venerdì
    DAILY_TARGET_HOURS: 7.5,        // Target Lun–Gio
    FRIDAY_TARGET_HOURS: 6          // Target Venerdì
};
// Verifica: 7.5×4 + 6 = 36h ✓
```

---

## 🌐 Self-hosting

### GitHub Pages (gratuito)
Già configurato — basta abilitare Pages nelle impostazioni del repo.

### Netlify / Vercel / Cloudflare Pages
Collega il repo e deploya automaticamente. Non servono build step.

### Docker
```dockerfile
FROM nginx:alpine
COPY . /usr/share/nginx/html
EXPOSE 80
```

---

## 🤝 Contribuisci

Le Pull Request sono benvenute! Per modifiche importanti, apri prima una Issue.

1. Fork del repository
2. Crea un branch (`git checkout -b feature/nuova-funzione`)
3. Commit (`git commit -am 'Aggiunge nuova funzione'`)
4. Push (`git push origin feature/nuova-funzione`)
5. Apri una Pull Request

---

## 📄 Licenza

Distribuito sotto licenza **MIT** — vedi [LICENSE](LICENSE).

---

## 👤 Autore

**VTvito** — [@VTvito](https://github.com/VTvito)

---

<p align="center">
  <strong>⭐ Se ti è utile, lascia una stella! ⭐</strong>
</p>
