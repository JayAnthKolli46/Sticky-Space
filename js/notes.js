/**
 * Sticky Space — Notes Manager
 * Handles sticky note DOM rendering, drag physics, 4-corner resizing, in-place edit mode, and z-indexing.
 * Author: Jayanth
 */

(function() {
  class NotesManager {
    constructor({ canvasInnerEl, canvasController, db, getRoom, getUser, onContextMenu, onNotesChanged }) {
      this.container = canvasInnerEl;
      this.canvas = canvasController;
      this.db = db || window.StickySpace.db;
      this.getRoom = getRoom;
      this.getUser = getUser;
      this.onContextMenu = onContextMenu;
      this.onNotesChanged = onNotesChanged;

      const NS = window.StickySpace || {};
      this.defaults = NS.NOTE_DEFAULTS || {
        width: 220, height: 200, minWidth: 160, minHeight: 140, maxWidth: 480, maxHeight: 600
      };

      this.notes = [];
      this.noteElements = new Map(); // id -> HTMLElement
      this.activeEditingId = null;

      this.dragState = null;
      this.resizeState = null;

      this.initGlobalEvents();
    }

    setNotes(notes) {
      // Validate and sanitize data records defensively
      this.notes = (Array.isArray(notes) ? notes : []).map(n => this.sanitizeNote(n));
      this.render();
    }

    sanitizeNote(note) {
      if (!note || typeof note !== 'object') return null;
      const validColors = ['pink', 'yellow', 'blue', 'green', 'orange'];
      return {
        id: String(note.id || (window.StickySpace?.generateId() || Date.now())),
        color: validColors.includes(note.color) ? note.color : 'yellow',
        title: typeof note.title === 'string' ? note.title.slice(0, 300) : '',
        body: typeof note.body === 'string' ? note.body.slice(0, 10000) : '',
        x: Number.isFinite(note.x) ? Math.round(note.x) : 100,
        y: Number.isFinite(note.y) ? Math.round(note.y) : 100,
        width: Number.isFinite(note.width) ? Math.max(this.defaults.minWidth, Math.min(this.defaults.maxWidth, note.width)) : this.defaults.width,
        height: Number.isFinite(note.height) ? Math.max(this.defaults.minHeight, Math.min(this.defaults.maxHeight, note.height)) : this.defaults.height,
        rotation: Number.isFinite(note.rotation) ? Math.max(-10, Math.min(10, note.rotation)) : 0,
        zIndex: Number.isFinite(note.zIndex) ? Math.max(1, note.zIndex) : 10,
        locked: Boolean(note.locked),
        createdAt: note.createdAt || new Date().toISOString(),
        updatedAt: note.updatedAt || new Date().toISOString(),
        createdBy: typeof note.createdBy === 'string' ? note.createdBy.slice(0, 40) : 'Anonymous',
        deleted: Boolean(note.deleted),
        deletedAt: note.deletedAt || null,
      };
    }

    getNotes() {
      return this.notes;
    }

    getActiveNotes() {
      return this.notes.filter(n => n && !n.deleted);
    }

    getDeletedNotes() {
      return this.notes.filter(n => n && n.deleted);
    }

    initGlobalEvents() {
      // Window-level mousemove & mouseup for drag and resize
      window.addEventListener('mousemove', (e) => {
        if (this.dragState) {
          this.handleDragMove(e);
        } else if (this.resizeState) {
          this.handleResizeMove(e);
        }
      });

      const finishInteraction = () => {
        if (this.dragState) {
          this.handleDragEnd();
        }
        if (this.resizeState) {
          this.handleResizeEnd();
        }
      };

      window.addEventListener('mouseup', finishInteraction);
      window.addEventListener('blur', finishInteraction);

      // Global click outside to close editing mode
      document.addEventListener('mousedown', (e) => {
        if (!this.activeEditingId) return;
        const noteEl = this.noteElements.get(this.activeEditingId);
        if (noteEl && !noteEl.contains(e.target) && !e.target.closest('.context-menu')) {
          this.stopEditing(this.activeEditingId);
        }
      });
    }

    render() {
      const activeNotes = this.getActiveNotes();
      const activeIds = new Set(activeNotes.map(n => n.id));

      // Remove DOM elements for deleted notes
      for (const [id, el] of this.noteElements.entries()) {
        if (!activeIds.has(id)) {
          el.remove();
          this.noteElements.delete(id);
        }
      }

      // Update or create active notes
      activeNotes.forEach(note => {
        let el = this.noteElements.get(note.id);
        if (!el) {
          el = this.createNoteElement(note);
          this.container.appendChild(el);
          this.noteElements.set(note.id, el);
        }
        this.updateNoteElement(el, note);
      });

      if (this.onNotesChanged) {
        this.onNotesChanged(this.notes);
      }
    }

    createNoteElement(note) {
      const el = document.createElement('div');
      el.className = 'sticky-note';
      el.dataset.id = note.id;

      el.innerHTML = `
        <div class="resize-handle tl" data-handle="tl"></div>
        <div class="resize-handle tr" data-handle="tr"></div>
        <div class="resize-handle bl" data-handle="bl"></div>
        <div class="resize-handle br" data-handle="br"></div>

        <div class="note-header">
          <div class="note-title-wrap">
            <input class="note-title-input" value="" placeholder="Title" maxlength="300" readonly />
          </div>
          <span class="note-locked-icon" style="display: none;">🔒</span>
        </div>

        <div class="note-body-area">
          <textarea class="note-body-input" placeholder="Type something..." maxlength="10000" readonly></textarea>
        </div>

        <div class="note-footer">
          <span class="note-author"></span>
          <span class="note-date"></span>
        </div>
      `;

      const titleInput = el.querySelector('.note-title-input');
      const bodyInput = el.querySelector('.note-body-input');
      const header = el.querySelector('.note-header');
      const bodyArea = el.querySelector('.note-body-area');

      // Drag initiation on header or body when not editing and not locked
      const startDrag = (e) => {
        if (e.button !== 0) return; // Only left click
        if (el.classList.contains('editing') || el.classList.contains('locked')) return;
        if (e.target.classList.contains('resize-handle')) return;

        e.stopPropagation();
        this.bringToFront(note.id);

        const zoom = this.canvas.zoom;
        const panX = this.canvas.panX;
        const panY = this.canvas.panY;

        this.dragState = {
          noteId: note.id,
          el,
          offsetX: e.clientX - note.x * zoom - panX,
          offsetY: e.clientY - note.y * zoom - panY,
          currentX: note.x,
          currentY: note.y,
        };

        el.classList.add('dragging');
      };

      header.addEventListener('mousedown', startDrag);
      bodyArea.addEventListener('mousedown', (e) => {
        if (!el.classList.contains('editing')) {
          startDrag(e);
        }
      });

      // Resize handles mousedown
      el.querySelectorAll('.resize-handle').forEach(handleEl => {
        handleEl.addEventListener('mousedown', (e) => {
          if (e.button !== 0) return;
          if (note.locked) return;
          e.stopPropagation();
          this.bringToFront(note.id);

          this.resizeState = {
            noteId: note.id,
            el,
            handle: handleEl.dataset.handle,
            startX: e.clientX,
            startY: e.clientY,
            origX: note.x,
            origY: note.y,
            origW: note.width || this.defaults.width,
            origH: note.height || this.defaults.height,
            currentX: note.x,
            currentY: note.y,
            currentW: note.width || this.defaults.width,
            currentH: note.height || this.defaults.height,
          };
        });
      });

      // Double-click to edit
      el.addEventListener('dblclick', (e) => {
        if (note.locked) return;
        e.stopPropagation();
        this.startEditing(note.id);
      });

      // Right-click context menu
      el.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.bringToFront(note.id);
        if (this.onContextMenu) {
          this.onContextMenu(note, e.clientX, e.clientY);
        }
      });

      // Input change listeners
      titleInput.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
          e.preventDefault();
          bodyInput.focus();
        } else if (e.key === 'Enter') {
          e.preventDefault();
          bodyInput.focus();
        } else if (e.key === 'Escape') {
          this.stopEditing(note.id);
        }
      });

      bodyInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          this.stopEditing(note.id);
        }
      });

      // Click anywhere on note elevates z-index
      el.addEventListener('mousedown', () => {
        this.bringToFront(note.id);
      });

      return el;
    }

    updateNoteElement(el, note) {
      const NS = window.StickySpace || {};
      const formatDate = NS.formatDate || ((s) => s);

      el.dataset.color = note.color || 'yellow';
      el.style.setProperty('--rot', `${note.rotation || 0}deg`);
      el.style.left = `${note.x}px`;
      el.style.top = `${note.y}px`;
      el.style.width = `${note.width || this.defaults.width}px`;
      el.style.height = `${note.height || this.defaults.height}px`;
      el.style.zIndex = note.zIndex || 10;

      if (note.locked) {
        el.classList.add('locked');
      } else {
        el.classList.remove('locked');
      }

      const lockedIcon = el.querySelector('.note-locked-icon');
      if (lockedIcon) {
        lockedIcon.style.display = note.locked ? 'inline' : 'none';
      }

      // Owner ring styling
      const currentUser = this.getUser();
      if (currentUser && note.createdBy === currentUser.displayName) {
        el.classList.add('own-note');
        el.style.setProperty('--user-ring', `${currentUser.userColor}44`);
      } else {
        el.classList.remove('own-note');
      }

      // Form fields (only update if not currently being actively typed into)
      const titleInput = el.querySelector('.note-title-input');
      const bodyInput = el.querySelector('.note-body-input');
      if (document.activeElement !== titleInput) {
        titleInput.value = note.title || '';
      }
      if (document.activeElement !== bodyInput) {
        bodyInput.value = note.body || '';
      }

      const authorEl = el.querySelector('.note-author');
      if (authorEl) {
        authorEl.textContent = note.createdBy || 'Anonymous';
      }

      const dateEl = el.querySelector('.note-date');
      if (dateEl) {
        dateEl.textContent = formatDate(note.createdAt);
      }
    }

    handleDragMove(e) {
      const { noteId, el, offsetX, offsetY } = this.dragState;
      const zoom = this.canvas.zoom;
      const panX = this.canvas.panX;
      const panY = this.canvas.panY;

      const newX = (e.clientX - offsetX - panX) / zoom;
      const newY = (e.clientY - offsetY - panY) / zoom;

      this.dragState.currentX = newX;
      this.dragState.currentY = newY;

      el.style.left = `${newX}px`;
      el.style.top = `${newY}px`;
    }

    handleDragEnd() {
      const { noteId, el, currentX, currentY } = this.dragState;
      el.classList.remove('dragging');

      const note = this.notes.find(n => n.id === noteId);
      if (note) {
        note.x = Math.round(currentX);
        note.y = Math.round(currentY);
        note.updatedAt = new Date().toISOString();
        this.db.saveNote(this.getRoom(), note);
      }

      this.dragState = null;
    }

    handleResizeMove(e) {
      const NS = window.StickySpace || {};
      const clamp = NS.clamp || ((v, min, max) => Math.min(max, Math.max(min, v)));

      const {
        noteId, el, handle, startX, startY, origX, origY, origW, origH
      } = this.resizeState;
      const zoom = this.canvas.zoom;

      const deltaX = (e.clientX - startX) / zoom;
      const deltaY = (e.clientY - startY) / zoom;

      let newW = origW;
      let newH = origH;
      let newX = origX;
      let newY = origY;

      if (handle.includes('r')) {
        newW = clamp(origW + deltaX, this.defaults.minWidth, this.defaults.maxWidth);
      }
      if (handle.includes('l')) {
        newW = clamp(origW - deltaX, this.defaults.minWidth, this.defaults.maxWidth);
        newX = origX + (origW - newW);
      }
      if (handle.includes('b')) {
        newH = clamp(origH + deltaY, this.defaults.minHeight, this.defaults.maxHeight);
      }
      if (handle.includes('t')) {
        newH = clamp(origH - deltaY, this.defaults.minHeight, this.defaults.maxHeight);
        newY = origY + (origH - newH);
      }

      this.resizeState.currentX = newX;
      this.resizeState.currentY = newY;
      this.resizeState.currentW = newW;
      this.resizeState.currentH = newH;

      el.style.left = `${newX}px`;
      el.style.top = `${newY}px`;
      el.style.width = `${newW}px`;
      el.style.height = `${newH}px`;
    }

    handleResizeEnd() {
      const { noteId, currentX, currentY, currentW, currentH } = this.resizeState;
      const note = this.notes.find(n => n.id === noteId);
      if (note) {
        note.x = Math.round(currentX);
        note.y = Math.round(currentY);
        note.width = Math.round(currentW);
        note.height = Math.round(currentH);
        note.updatedAt = new Date().toISOString();
        this.db.saveNote(this.getRoom(), note);
      }
      this.resizeState = null;
    }

    startEditing(noteId) {
      if (this.activeEditingId && this.activeEditingId !== noteId) {
        this.stopEditing(this.activeEditingId);
      }

      const note = this.notes.find(n => n.id === noteId);
      if (!note || note.locked) return;

      this.activeEditingId = noteId;
      const el = this.noteElements.get(noteId);
      if (!el) return;

      el.classList.add('editing');
      const titleInput = el.querySelector('.note-title-input');
      const bodyInput = el.querySelector('.note-body-input');

      titleInput.readOnly = false;
      bodyInput.readOnly = false;

      this.bringToFront(noteId);
      titleInput.focus();
      titleInput.select();
    }

    stopEditing(noteId) {
      if (this.activeEditingId !== noteId) return;

      const note = this.notes.find(n => n.id === noteId);
      const el = this.noteElements.get(noteId);

      if (el) {
        el.classList.remove('editing');
        const titleInput = el.querySelector('.note-title-input');
        const bodyInput = el.querySelector('.note-body-input');
        titleInput.readOnly = true;
        bodyInput.readOnly = true;

        if (note) {
          note.title = titleInput.value;
          note.body = bodyInput.value;
          note.updatedAt = new Date().toISOString();
          this.db.saveNote(this.getRoom(), note);
        }
      }

      this.activeEditingId = null;
    }

    bringToFront(noteId) {
      const activeNotes = this.getActiveNotes();
      const note = this.notes.find(n => n.id === noteId);
      if (!note) return;

      const maxZ = Math.max(10, ...activeNotes.map(n => n.zIndex || 10));
      const nextZ = maxZ + 1;

      if (nextZ > 498) {
        // Re-rank active notes starting from 10
        const sorted = [...activeNotes].sort((a, b) => (a.zIndex || 10) - (b.zIndex || 10));
        sorted.forEach((n, idx) => {
          n.zIndex = 10 + idx;
          const noteEl = this.noteElements.get(n.id);
          if (noteEl) noteEl.style.zIndex = n.zIndex;
          this.db.saveNote(this.getRoom(), n);
        });
        note.zIndex = 10 + sorted.length;
      } else {
        note.zIndex = nextZ;
      }

      const el = this.noteElements.get(noteId);
      if (el) {
        el.style.zIndex = note.zIndex;
      }
      this.db.saveNote(this.getRoom(), note);
    }

    spawnNote(color = 'yellow') {
      const NS = window.StickySpace || {};
      const getRandomRotation = NS.getRandomRotation || (() => 0);
      const generateId = NS.generateId || (() => String(Date.now()));

      const center = this.canvas.getCanvasCenter();
      const offsetW = (this.defaults.width / 2);
      const offsetH = (this.defaults.height / 2);
      const jitterX = (Math.random() * 80) - 40;
      const jitterY = (Math.random() * 80) - 40;

      const user = this.getUser();
      const activeNotes = this.getActiveNotes();
      const maxZ = Math.max(10, ...activeNotes.map(n => n.zIndex || 10));

      const newNote = {
        id: generateId(),
        color: color,
        title: '',
        body: '',
        x: Math.round(center.x - offsetW + jitterX),
        y: Math.round(center.y - offsetH + jitterY),
        width: this.defaults.width,
        height: this.defaults.height,
        rotation: getRandomRotation(),
        zIndex: maxZ + 1,
        locked: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: user?.displayName || 'Anonymous',
        deleted: false,
        deletedAt: null,
      };

      this.db.saveNote(this.getRoom(), newNote);

      // Auto-enter edit mode for the freshly spawned note
      setTimeout(() => {
        this.startEditing(newNote.id);
      }, 50);

      return newNote;
    }

    duplicateNote(noteId) {
      const NS = window.StickySpace || {};
      const getRandomRotation = NS.getRandomRotation || (() => 0);
      const generateId = NS.generateId || (() => String(Date.now()));

      const note = this.notes.find(n => n.id === noteId);
      if (!note) return;

      const user = this.getUser();
      const activeNotes = this.getActiveNotes();
      const maxZ = Math.max(10, ...activeNotes.map(n => n.zIndex || 10));

      const cloned = {
        ...note,
        id: generateId(),
        x: note.x + 24,
        y: note.y + 24,
        rotation: getRandomRotation(),
        zIndex: maxZ + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: user?.displayName || 'Anonymous',
        deleted: false,
        deletedAt: null,
      };

      this.db.saveNote(this.getRoom(), cloned);
    }

    changeColor(noteId, newColor) {
      const note = this.notes.find(n => n.id === noteId);
      if (!note) return;
      note.color = newColor;
      note.updatedAt = new Date().toISOString();
      this.db.saveNote(this.getRoom(), note);
      this.render();
    }

    toggleLock(noteId) {
      const note = this.notes.find(n => n.id === noteId);
      if (!note) return;
      note.locked = !note.locked;
      note.updatedAt = new Date().toISOString();
      this.db.saveNote(this.getRoom(), note);
      this.render();
    }

    softDelete(noteId) {
      this.db.deleteNote(this.getRoom(), noteId);
    }

    restore(noteId) {
      this.db.restoreNote(this.getRoom(), noteId);
    }

    hardDelete(noteId) {
      this.db.hardDeleteNote(this.getRoom(), noteId);
    }

    emptyRecycleBin() {
      this.db.hardDeleteAll(this.getRoom());
    }

    dimNotesExcept(matchingIds, isSearching) {
      for (const [id, el] of this.noteElements.entries()) {
        if (!isSearching) {
          el.classList.remove('dimmed');
        } else if (matchingIds.has(id)) {
          el.classList.remove('dimmed');
        } else {
          el.classList.add('dimmed');
        }
      }
    }
  }

  window.StickySpace = window.StickySpace || {};
  window.StickySpace.NotesManager = NotesManager;
})();
