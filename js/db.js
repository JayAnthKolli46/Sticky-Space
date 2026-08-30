/**
 * Sticky Space — Storage Abstraction Layer (Hardened)
 *
 * This file is the ONLY file that needs to change when Firebase Firestore is integrated.
 * All UI and business logic interact exclusively with db.* methods.
 * Author: Jayanth
 */

(function() {
  // Sanitize room identifier to prevent key collisions or prototype pollution
  function sanitizeRoomKey(room) {
    if (typeof room !== 'string') return 'default-space';
    return encodeURIComponent(room.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '')) || 'default-space';
  }

  const NOTES_KEY   = (room) => `stickyspace:${sanitizeRoomKey(room)}:notes`;
  const PACKS_KEY   = (room) => `stickyspace:${sanitizeRoomKey(room)}:packs`;
  const SESSION_KEY = () => `stickyspace:session`;

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      const parsed = JSON.parse(raw);
      return parsed !== null ? parsed : fallback;
    } catch (err) {
      console.warn(`[Sticky Space Storage] Corrupted data in key "${key}", using fallback.`, err);
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      if (err.name === 'QuotaExceededError' || err.code === 22 || err.code === 1014) {
        console.error('[Sticky Space Storage] LocalStorage quota exceeded!', err);
        showStorageWarning('Storage quota full. Please clean up the Recycle Bin or delete unused notes.');
      } else {
        console.error('[Sticky Space Storage] Write failed:', err);
      }
      return false;
    }
  }

  function showStorageWarning(msg) {
    let toast = document.querySelector('.storage-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'storage-toast';
      toast.style.cssText = `
        position: fixed;
        bottom: 90px;
        left: 50%;
        transform: translateX(-50%);
        background: #f38ba8;
        color: #1e1e2e;
        padding: 10px 18px;
        border-radius: 10px;
        font-family: 'Inter', sans-serif;
        font-size: 12px;
        font-weight: 600;
        box-shadow: 0 8px 24px rgba(0,0,0,0.4);
        z-index: 9999;
        transition: opacity 0.3s;
      `;
      document.body.appendChild(toast);
    }
    toast.textContent = `⚠️ ${msg}`;
    toast.style.opacity = '1';
    setTimeout(() => {
      if (toast) toast.style.opacity = '0';
    }, 4000);
  }

  // In-memory subscribers for local change events
  const listeners = new Map();

  function notifyListeners(room) {
    const sRoom = sanitizeRoomKey(room);
    const cbs = listeners.get(sRoom);
    if (cbs) {
      const notes = db.getNotes(sRoom);
      cbs.forEach(cb => {
        try { cb(notes); } catch (e) { console.error(e); }
      });
    }
  }

  // Multi-tab sync via window storage event
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (!e.key) return;
      for (const sRoom of listeners.keys()) {
        if (e.key === `stickyspace:${sRoom}:notes`) {
          notifyListeners(sRoom);
        }
      }
    });
  }

  const db = {
    // ── Notes ──────────────────────────────────────────────────────────────────
    getNotes: (room) => {
      // FIREBASE: db.collection('rooms').doc(room).collection('notes').get()
      const list = readJSON(NOTES_KEY(room), []);
      return Array.isArray(list) ? list : [];
    },

    saveNote: (room, note) => {
      // FIREBASE: db.collection('rooms').doc(room).collection('notes').doc(note.id).set(note)
      if (!note || !note.id) return;
      const current = db.getNotes(room);
      const index = current.findIndex(n => n && n.id === note.id);
      let updated;
      if (index >= 0) {
        updated = [...current];
        updated[index] = note;
      } else {
        updated = [...current, note];
      }
      if (writeJSON(NOTES_KEY(room), updated)) {
        notifyListeners(room);
      }
    },

    deleteNote: (room, noteId) => {
      // FIREBASE: update note doc with { deleted: true, deletedAt: new Date().toISOString() }
      if (!noteId) return;
      const now = new Date().toISOString();
      const updated = db.getNotes(room).map(n =>
        n && n.id === noteId ? { ...n, deleted: true, deletedAt: now } : n
      );
      if (writeJSON(NOTES_KEY(room), updated)) {
        notifyListeners(room);
      }
    },

    restoreNote: (room, noteId) => {
      // FIREBASE: update note doc with { deleted: false, deletedAt: null }
      if (!noteId) return;
      const updated = db.getNotes(room).map(n =>
        n && n.id === noteId ? { ...n, deleted: false, deletedAt: null } : n
      );
      if (writeJSON(NOTES_KEY(room), updated)) {
        notifyListeners(room);
      }
    },

    hardDeleteNote: (room, noteId) => {
      // FIREBASE: db.collection('rooms').doc(room).collection('notes').doc(noteId).delete()
      if (!noteId) return;
      const updated = db.getNotes(room).filter(n => n && n.id !== noteId);
      if (writeJSON(NOTES_KEY(room), updated)) {
        notifyListeners(room);
      }
    },

    hardDeleteAll: (room) => {
      // FIREBASE: batch delete all notes where deleted === true
      const updated = db.getNotes(room).filter(n => n && !n.deleted);
      if (writeJSON(NOTES_KEY(room), updated)) {
        notifyListeners(room);
      }
    },

    // ── Real-time listener stub ───────────────────────────────────────────────
    onNotesChange: (room, callback) => {
      // FIREBASE: replace entire body with:
      //   return db.collection('rooms').doc(room).collection('notes').onSnapshot(snap => {
      //     callback(snap.docs.map(d => d.data()));
      //   });
      // FIREBASE: add Firestore presence tracking (user online/offline)
      // FIREBASE: add Firestore security rules: allow read/write if room matches
      const sRoom = sanitizeRoomKey(room);
      if (!listeners.has(sRoom)) {
        listeners.set(sRoom, new Set());
      }
      const set = listeners.get(sRoom);
      set.add(callback);

      // Initial trigger
      try {
        callback(db.getNotes(sRoom));
      } catch (err) {
        console.error(err);
      }

      // Return unsubscribe handler
      return () => {
        set.delete(callback);
        if (set.size === 0) {
          listeners.delete(sRoom);
        }
      };
    },

    // ── Packs ─────────────────────────────────────────────────────────────────
    getPacks: (room) => {
      // FIREBASE: read doc('rooms/' + room).data().packs
      return readJSON(PACKS_KEY(room), {
        pink: 20,
        yellow: 20,
        blue: 20,
        green: 20,
        orange: 20,
      });
    },

    setPack: (room, color, count) => {
      // FIREBASE: update room doc field `packs.${color}`: count
      const safeCount = Math.max(0, Math.min(1000, Number.isFinite(count) ? count : 20));
      const packs = db.getPacks(room);
      packs[color] = safeCount;
      writeJSON(PACKS_KEY(room), packs);
    },

    // ── Session / User ────────────────────────────────────────────────────────
    getSession: () => {
      return readJSON(SESSION_KEY(), null);
    },

    saveSession: (session) => {
      writeJSON(SESSION_KEY(), session);
    },
  };

  window.StickySpace = window.StickySpace || {};
  window.StickySpace.db = db;
})();
