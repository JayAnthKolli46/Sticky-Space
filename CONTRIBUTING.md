# Contributing to Sticky Space

Thank you for your interest in contributing to **Sticky Space**!

---

## 🛠️ Development Setup

Sticky Space is built with pure HTML5, CSS3, and JavaScript:
1. Fork and clone the repository:
   ```bash
   git clone https://github.com/JayAnthKolli46/Sticky-Space.git
   ```
2. Open `index.html` directly in your browser or serve it using any local static file server.
3. No build step or package installations are required.

---

## 📋 Code Guidelines

- **Vanilla Web Technologies**: Maintain zero-dependency architecture unless explicitly approved.
- **Styling**: Use CSS custom properties defined in `css/styles.css`.
- **Storage**: Maintain the `js/db.js` abstraction pattern so storage backends can be upgraded seamlessly.
- **Security**: Always use `textContent` and safe DOM APIs rather than raw `innerHTML` for dynamic user content.

---

## 🚀 Submitting Pull Requests

1. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Commit your changes with clear, descriptive messages:
   ```bash
   git commit -m "feat: add keyboard shortcut for color cycling"
   ```
3. Push to your branch and open a Pull Request against `main`.

