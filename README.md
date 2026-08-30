# 🗒️ Sticky Space — Your Shared Thinking Space

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Author](https://img.shields.io/badge/Author-Jayanth-89b4fa.svg)](https://github.com/JayAnthKolli46)
[![Repo](https://img.shields.io/badge/GitHub-JayAnthKolli46%2FSticky--Space-green.svg)](https://github.com/JayAnthKolli46/Sticky-Space)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero-success.svg)](#)

> **"Your Shared Thinking Space."**  
> An infinite, pannable, zoomable dark canvas web application where you can create color-coded sticky notes, organize thoughts, and collaborate in real-time.

**Developed by**: [Jayanth](https://github.com/JayAnthKolli46)  
**Repository**: [https://github.com/JayAnthKolli46/Sticky-Space](https://github.com/JayAnthKolli46/Sticky-Space)

---

## 🚀 Quick Start

1. **Direct Run**: Simply double-click `index.html` in File Explorer or open it in any web browser.
2. **Zero Dependencies**: Pure HTML5, CSS3, and JavaScript — no Node.js, npm, Python, or build step required.
3. **GitHub Pages Ready**: Host for free by enabling GitHub Pages on your repository branch (`main` / root).

---

## ✨ Features & Capabilities

- 🌌 **Infinite Dark Canvas**:
  - **Pan**: Click and drag the dark background; the dot grid shifts dynamically with your canvas position.
  - **Zoom**: Scroll your mouse wheel anywhere. Zoom is centered around your cursor and clamped between `0.3x` and `2.5x`.
  - **Reset View**: Click the **100%** zoom pill in the bottom right corner to smoothly animate back to center at 1.0x scale.

- 🎨 **Color-Coded Sticky Notes**:
  - 5 Categorized Palettes:
    - 🌸 **Pink**: Personal Reminders
    - ⚡ **Yellow**: Urgent / Action Items
    - 💡 **Blue**: Informational
    - 🌿 **Green**: Ideas & Insights
    - 🔥 **Orange**: High Priority
  - **Spawn**: Click any color stack in the bottom dock to pop a note at the canvas center with physical spawn animation.
  - **Pack Inventory**: Each stack tracks available notes (default 20). When exhausted, click the `+` overlay to refill (+20).
  - **Drag Physics**: Drag notes by their header or body with realistic elevation lift (1.04x) and ambient colored shadow.
  - **4-Corner Resizing**: Drag any of the 4 corner handles (`.tl`, `.tr`, `.bl`, `.br`) to resize notes within clamped dimensions.
  - **In-Place Editing**: Double-click any note to straighten rotation to 0° and edit in Google's `Caveat` handwritten typography.
  - **Author Rings**: Notes created by you display an ambient glowing ring in your personal avatar color.

- 📋 **Right-Click Context Menu**:
  - ✏️ **Edit**: Enter text editing mode.
  - 📋 **Duplicate**: Clone note offset by +24px with a new random rotation.
  - 🎨 **Change Color**: Instant flyout submenu with 5 color swatches.
  - 🔒 **Lock / Unlock**: Prevent accidental drag or editing.
  - 🗑️ **Delete**: Soft-delete note to the Recycle Bin.

- 🗑️ **Recycle Bin Drawer**:
  - Slide-out drawer on the right side.
  - View all soft-deleted notes with timestamps and author details.
  - **Restore** note back to its original canvas position.
  - **Delete** note permanently.
  - **Empty Bin** to wipe all deleted notes with confirmation.

- 🔍 **Live Search**:
  - Click the **Search** icon in the dock (or press `Ctrl+F` / `Cmd+F`).
  - As you type, non-matching notes smoothly dim (`opacity: 0.18`, grayscale `55%`).

- 👥 **Rooms & Multi-Tab Synchronization**:
  - Generate fun room codes (e.g. `swift-falcon-72`) with the **🎲 Random** button.
  - URL hash automatically updates to `#<roomCode>`. Share the URL to collaborate in the same space.
  - Real-time multi-tab synchronization via storage event listeners.

---

## 🛠️ Architecture & Firebase Cloud Ready

All storage and data synchronization logic is isolated within [`js/db.js`](js/db.js).

To connect **Firebase Firestore**:
1. Open `js/db.js`.
2. Replace each `localStorage` read/write method with the corresponding Firestore call documented in the `// FIREBASE:` comments.
3. No UI or component files need to be modified.

---

## 📂 Repository Structure

```
Sticky-Space/
├── index.html          # Main HTML entry point & CSP configuration
├── README.md           # Documentation and user guide
├── LICENSE             # MIT License
├── SECURITY.md         # Security policy & reporting guidelines
├── CONTRIBUTING.md     # Contribution instructions
├── .gitignore          # Git ignore rules
├── css/
│   └── styles.css      # CSS variables, animations, and component styles
└── js/
    ├── constants.js    # Colors, metadata, defaults, seed data
    ├── utils.js        # UUID generator, room codes, date formatters
    ├── db.js           # Storage abstraction layer (localStorage + Firebase)
    ├── canvas.js       # Pan, zoom, background dot grid tracking
    ├── notes.js        # Note rendering, drag, resize, edit mode
    ├── dock.js         # Palette dock, 3D swatches, pack inventory & refill
    ├── recycleBin.js   # Recycle bin drawer, restore, hard delete
    ├── search.js       # Top search bar, live query dimming
    ├── contextMenu.js  # Right-click context menu & actions
    ├── roomModal.js    # Room modal, user session, presence badge
    └── app.js          # Main orchestrator & lifecycle manager
```

---

## 👨‍💻 Author

**Jayanth**
- GitHub: [@JayAnthKolli46](https://github.com/JayAnthKolli46)
- Project Repository: [JayAnthKolli46/Sticky-Space](https://github.com/JayAnthKolli46/Sticky-Space)
