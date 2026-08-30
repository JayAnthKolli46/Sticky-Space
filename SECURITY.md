# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability within **Sticky Space**, please report it responsibly:

1. **Do not create a public GitHub issue.**
2. Open a private Security Advisory on GitHub via [Security Advisories](https://github.com/JayAnthKolli46/Sticky-Space/security/advisories).
3. Provide a detailed summary including:
   - Description of the vulnerability.
   - Steps to reproduce / proof-of-concept.
   - Potential impact.
   - Suggested mitigations (if available).

We will review, acknowledge, and address valid reports promptly.

---

## Threat Model & Architecture Overview

Sticky Space is built as a client-side web application:
- **Client Storage (`localStorage`)**: Note data and room sessions are stored in the browser's origin-scoped `localStorage`. Data is unencrypted at rest within the user's browser profile.
- **XSS Mitigation**: Dynamic DOM insertion uses native `textContent` and property bindings rather than unescaped `innerHTML` to prevent script execution vectors.
- **Input Sanitization**: Note fields, coordinate bounds, dimensions, and color categories are strictly validated against allowable boundaries.
- **Cloud Backend Readiness**: When migrating `js/db.js` to Firebase Firestore or any WebSocket server, secure authentication and Firestore Security Rules must be implemented on the backend.

