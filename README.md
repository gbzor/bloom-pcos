# 🌸 Bloom — PCOS Pill Tracker

A lightweight, fully offline-capable Progressive Web App (PWA) for women managing PCOS. Bloom tracks daily pill intake, cycle phases, mood, symptoms, and personal health notes — all stored privately on-device with no backend, no account, and no analytics.

---

## ✨ Features

- **Daily Pill Log** — One-tap logging with streak counter and confetti reward
- **Monthly Stats** — Taken vs. missed count for the current month
- **Calendar View** — Visual month grid; tap any past day to mark/unmark
- **Pill Schedule** — Add, manage, and delete medications or supplements with dosage and time
- **Cycle Tracker** — Adjustable day ring showing current menstrual phase with personalized advice
- **Mood Tracker** — Daily emoji-based mood logging
- **Symptom Checklist** — 16 PCOS-specific symptoms logged per day
- **Daily Report** — Formatted plain-text summary with one-tap copy (clipboard API + iOS Safari fallback)
- **Notes / Journal** — Timestamped entries with delete support
- **PCOS Info Hub** — Educational content on symptoms, diet, lifestyle, and medications
- **Fully Offline** — Service Worker caches all assets on first load; works with no internet
- **PWA Installable** — Add to iPhone Home Screen via Safari Share → Add to Home Screen

---

## 🗂 Project Structure

```
bloom-pwa/
├── index.html       # Markup + CSP only — no inline scripts
├── app.css          # All styles
├── app.js           # All logic + delegated event handlers
├── manifest.json    # PWA manifest
├── sw.js            # Service Worker (cache-first, origin-allowlisted)
├── netlify.toml     # Deploy config + HTTP security headers
├── icons/
│   ├── icon-192.png
│   └── icon-512.png
├── .gitignore
├── LICENSE
└── README.md
```

> **Why three files instead of one?** The previous single-file version required `'unsafe-inline'` in the CSP `script-src` directive, which materially weakened XSS protection. Splitting into external `app.css` and `app.js` lets the CSP drop `'unsafe-inline'` for scripts entirely.

---

## 🔒 Security Architecture

Bloom is designed for a single-user, on-device threat model. Within that scope:

### Implemented hardening

- **Content Security Policy** with `script-src 'self'` (no inline JS), `connect-src 'none'` (no outbound network), and clickjacking/base-tag/form-action lockdown
- **HTTP security headers** via `netlify.toml`: HSTS, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, restrictive `Permissions-Policy`, `Cross-Origin-Opener-Policy`, `Cross-Origin-Resource-Policy`
- **XSS escaping** — every user-controlled string passes through `esc()` (escapes `&`, `<`, `>`, `"`, `'`) before reaching `innerHTML`
- **Event delegation** — no inline `onclick` anywhere; static buttons use `data-action` attributes dispatched through one delegated listener
- **Input validation** — pill time regex (`/^\d{2}:\d{2}$/`), pill type allowlist (`💊🌿💉🍵`), defensive `esc()` on type at render
- **Custom confirm modal** — replaces native `confirm()` (broken in iOS standalone PWA), uses `textContent` for the message
- **Service Worker origin allowlist** — only caches responses from `self`, `fonts.googleapis.com`, `fonts.gstatic.com`. GET-only.
- **No third-party JS, no analytics, no trackers**

### Known limitations (by design)

- **localStorage is plaintext.** Anyone with physical access to the device + Safari DevTools can read all health data. Encryption-at-rest would require a PIN-derived key (planned feature, not yet built).
- **Google Fonts ping on first visit.** The initial CSS request to `fonts.googleapis.com` reveals the visitor's IP to Google. After first load, the Service Worker serves fonts from cache and no further outbound requests occur. Self-hosting the fonts would eliminate this (TODO).

---

## 🚀 Deployment

### Netlify (recommended — auto-deploys on Git push)

1. Push this repo to GitHub
2. Connect the repo to Netlify
3. Netlify reads `netlify.toml`, applies security headers automatically, and serves over HTTPS
4. Every push to `main` triggers a redeploy in ~30 seconds

### Manual drop deploy

1. Go to [netlify.com/drop](https://app.netlify.com/drop)
2. Drag and drop the entire project folder
3. Netlify provides a public HTTPS URL

> ⚠️ Service Workers require HTTPS. Do **not** open `index.html` as a local file — the SW won't register, and offline mode will not work.

---

## 📲 iPhone Installation (for the user)

1. Open the deployment URL in **Safari** (not Chrome)
2. Tap **Share** (box with arrow at the bottom)
3. Scroll down and tap **Add to Home Screen**
4. Name it `Bloom` and tap **Add**
5. Open from the Home Screen icon — works fully offline 🌸

---

## 🛠 Tech Stack

| Layer       | Technology                              |
|-------------|-----------------------------------------|
| Markup      | HTML5                                   |
| Styling     | CSS3 (custom properties, flexbox, grid) |
| Logic       | Vanilla JavaScript (ES6+)               |
| Offline     | Service Worker API + Cache Storage      |
| Install     | Web App Manifest (PWA)                  |
| Storage     | `localStorage`                          |
| Fonts       | Google Fonts (Playfair Display, DM Sans) — cached after first load |
| Icons       | PNG (Pillow/Python-generated)           |

---

## 🎨 Design

- **Palette:** Soft blush `#FDE8F0`, warm white `#FFFAF9`, rose accent `#E8729A`, deep mauve `#C45C82`
- **Typography:** Playfair Display (headings) + DM Sans (body)
- **UI:** Two-toned, card-based layout optimized for mobile
- **Interactions:** Tap feedback, animated modals, toast notifications, confetti on pill log

---

## 📄 License

MIT — see [LICENSE](LICENSE).

---

> Built with 💕 as a personal health companion for PCOS management.
