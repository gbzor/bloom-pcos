# 🌸 Bloom — PCOS Pill Tracker

A lightweight, fully offline-capable Progressive Web App (PWA) built for women managing PCOS. Bloom helps track daily pill intake, cycle phases, mood, and personal health notes — all stored privately on-device with no backend or account required.

---

## ✨ Features

- **Daily Pill Log** — One-tap logging with streak counter and confetti reward
- **Monthly Stats** — Taken vs. missed count for the current month
- **Calendar View** — Visual month grid; tap any past day to mark/unmark
- **Pill Schedule** — Add, manage, and delete medications or supplements with dosage and time
- **Cycle Tracker** — Adjustable day ring showing current menstrual phase with personalized advice
- **Mood Tracker** — Daily emoji-based mood logging (Happy, Calm, Tired, Low, Grumpy)
- **Notes / Journal** — Timestamped symptom and feeling journal with delete support
- **PCOS Info Hub** — Educational content on symptoms, diet, lifestyle, and medications
- **Fully Offline** — Service Worker caches all assets on first load; works with no internet
- **PWA Installable** — Installs to iPhone Home Screen via Safari Share → Add to Home Screen

---

## 🗂 Project Structure

```
bloom-pwa/
├── index.html       # Main app (single-file HTML + CSS + JS)
├── manifest.json    # PWA manifest (name, icons, theme color, display mode)
├── sw.js            # Service Worker (cache-first offline strategy)
└── icons/
    ├── icon-192.png # App icon (192×192)
    └── icon-512.png # App icon (512×512)
```

---

## 🚀 Deployment (Netlify — Recommended)

1. Go to [netlify.com/drop](https://app.netlify.com/drop)
2. Drag and drop the entire `bloom-pwa/` folder
3. Netlify gives you an instant public URL (e.g. `https://bloom-pcos.netlify.app`)
4. Share the link — user opens it in **Safari on iPhone**, taps **Share ⬆ → Add to Home Screen**
5. App installs and runs fully offline from that point

> ⚠️ PWA Service Workers require HTTPS. Netlify provides this automatically. Do **not** open `index.html` as a local file — the SW won't register.

---

## 📲 iPhone Installation Steps (for the user)

1. Open the Netlify URL in **Safari** (not Chrome)
2. Tap the **Share** button (box with arrow at the bottom)
3. Scroll down and tap **"Add to Home Screen"**
4. Name it `Bloom` and tap **Add**
5. Open from the Home Screen icon — it now works fully offline 🌸

---

## 🔒 Privacy & Security

- **Zero backend** — no server, no database, no API calls
- **All data stored locally** in the browser's `localStorage`
- **No user accounts**, no login, no data collection
- **No external dependencies at runtime** — fonts are cached on first load
- Safe to upload to GitHub — contains no secrets, tokens, or credentials

---

## 🛠 Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Markup     | HTML5                             |
| Styling    | CSS3 (custom properties, flexbox, grid) |
| Logic      | Vanilla JavaScript (ES6+)         |
| Offline    | Service Worker API (Cache Storage)|
| Install    | Web App Manifest (PWA)            |
| Storage    | localStorage                      |
| Fonts      | Google Fonts (Playfair Display, DM Sans) |
| Icons      | Generated PNG (Pillow/Python)     |

---

## 🎨 Design

- **Palette:** Soft blush `#FDE8F0`, warm white `#FFFAF9`, rose accent `#E8729A`, deep mauve `#C45C82`
- **Typography:** Playfair Display (headings) + DM Sans (body)
- **UI style:** Minimal, two-toned, card-based layout optimized for mobile
- **Interactions:** Tap feedback, animated modals, toast notifications, confetti on pill log

---

## 📄 License

MIT — free to use, modify, and distribute.

---

> Built with 💕 as a personal health companion for PCOS management.
