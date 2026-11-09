⚠️ STRICT COPYRIGHT NOTICE — ALL RIGHTS RESERVED
Copyright © 2026 Sabareesh M (saba1207B)

This repository is NOT open source.
Unauthorized copying, redistribution, modification, or use of any code, text, or materials from this repository is strictly prohibited.

Especially forbidden:

Copying or adapting any program/project for submission as your own work

Sharing or redistributing the code

Using any content for AI / machine learning training or generation

This repository is public only so that authorized mentors can review progress.
Full legal terms: LICENSE | COPYRIGHT | AI_INSTRUCTION.md

---

# ✦ AURELION — The Sovereign ✦
### 3D Watch Exploded-View Explorer & Interactive Showcase

[![License: MIT](https://img.shields.io/badge/License-MIT-gold.svg)](LICENSE)
[![Format: WebP](https://img.shields.io/badge/Assets-WebP%20Optimized-00d26a.svg)](#)
[![Stack: Vanilla%20JS%20%2B%20TailwindCSS](https://img.shields.io/badge/Stack-HTML5%20%2F%20CSS3%20%2F%20JS-blue.svg)](#)
[![App: Electron%20Compatible](https://img.shields.io/badge/Platform-Browser%20%26%20Electron-9cf.svg)](#)

> *"Every gear is a poem. Every second is a promise."*  
> **AURELION — The Sovereign** is a luxury horology interactive showcase featuring a cinematic, scroll-driven exploded-view sequence of a skeleton mechanical watch movement.

---

## ✨ Features

- **Smooth Scroll-Driven Scrubbing**: 300 high-fidelity frames rendered through an HTML5 Canvas with sub-pixel interpolation, frame blending, and DPR capping for ultra-smooth 60/120fps interaction.
- **Exploded Mechanical Inspection**: Follow the movement across four distinct stages:
  1. *Skeleton Architecture* (312 individual hand-finished parts)
  2. *Golden Gear Train* (18K gold-treated wheel transmission)
  3. *Exploded Component Assembly* (Full 3D part dispersion)
  4. *Precision Reassembly & Winding* (Back to living rhythm)
- **WebP Asset Optimization**: All 300 frames are losslessly tuned and compressed into modern `.webp` format for instant preloading and minimal bandwidth footprint.
- **Luxury Haute Horlogerie UI**: Crafted with Cormorant Garamond and Inter typography, gold accent glows, dark slate gradients, and subtle glassmorphic backdrop filters.
- **Interactive Experience**:
  - Live technical specifications grid
  - Interactive reservation modal with case material selection
  - Dual runtime: runs natively in any modern web browser or as a borderless desktop application via Electron

---

## 🚀 Quick Start

### 1. View in Any Browser
You don't need any build steps to run the web experience!

#### Option A: Windows Shortcut
Double-click `Open in Browser.bat` to launch the local preview server.

#### Option B: Simple Local Server
Using Node.js:
```bash
npx serve . -p 3000
```
Or using Python:
```bash
python -m http.server 3000
```
Then open `http://localhost:3000` in your browser.

---

### 2. Run as a Desktop App (Electron)

If you'd like to run it as a standalone borderless desktop app:

```bash
# Install dependencies
npm install

# Start the Electron application
npm start
```

To compile TailwindCSS styling changes:
```bash
npm run build:css
```

---

## 📁 Project Structure

```text
watch-explorer/
├── images/                  # 300 WebP animation frames (ezgif-frame-001.webp - 300.webp)
├── src/
│   └── input.css            # TailwindCSS design tokens & base stylesheet
├── index.html               # Main application markup & sections
├── sequence.js              # 120fps canvas rendering engine & scroll scrub logic
├── styles.css               # Compiled production styling & glassmorphism
├── scene.js                 # Three.js procedural watch engine
├── ui.js                    # Interaction handlers & UI state controller
├── main.js                  # Electron desktop application main process
├── package.json             # Project dependencies & npm scripts
├── Open in Browser.bat      # Quick launcher script for local testing
└── .gitignore               # Ignores node_modules and OS metadata
```

---

## 🛠 Tech Stack

- **Frontend**: Vanilla JavaScript (ES6+), HTML5 Canvas 2D Context
- **Styling**: TailwindCSS v4, Custom CSS Glassmorphism
- **Fonts**: Cormorant Garamond, Inter (Google Fonts)
- **Runtime**: Browser / Electron 33+
- **Assets**: 300 WebP frames with delta-time lerp smoothing

---

## 📜 License

Created with precision for horology enthusiasts. Distributed under the MIT License.
