/**
 * Sticky Space — Main Application Orchestrator
 * Connects Canvas, Notes, Dock, Search, Recycle Bin, Context Menu, and Room sessions.
 */

(function() {
  class StickySpaceApp {
    constructor() {
      const NS = window.StickySpace || {};

      this.db = NS.db;
      this.seedNotes = NS.SEED_NOTES || [];
      this.defaults = NS.NOTE_DEFAULTS || { width: 220, height: 200 };

      this.CanvasClass = NS.CanvasController;
      this.NotesClass = NS.NotesManager;
      this.DockClass = NS.PaletteDock;
      this.RecycleClass = NS.RecycleBinPanel;
      this.SearchClass = NS.SearchBar;
      this.ContextClass = NS.ContextMenu;
      this.RoomClass = NS.RoomManager;

      this.unsubscribeRoom = null;

      this.initElements();
      this.initControllers();
    }

    initElements() {
      this.wrapperEl = document.querySelector('.canvas-wrapper');
      this.innerEl = document.querySelector('.canvas-inner');
      this.emptyHintEl = document.querySelector('.canvas-empty-hint');
      this.zoomPillEl = document.querySelector('.zoom-pill');
      this.dockEl = document.querySelector('.palette-dock');
      this.recycleEl = document.querySelector('.recycle-panel');
      this.searchEl = document.querySelector('.search-bar-wrap');
      this.contextEl = document.querySelector('.context-menu');
      this.modalEl = document.querySelector('.modal-overlay');
      this.presenceEl = document.querySelector('.user-presence');
    }

    initControllers() {
      // 1. Canvas Controller
      this.canvas = new this.CanvasClass({
        wrapperEl: this.wrapperEl,
        innerEl: this.innerEl,
        zoomPillEl: this.zoomPillEl,
      });

      // 2. Room & Session Manager
      this.roomManager = new this.RoomClass({
        modalEl: this.modalEl,
        presenceEl: this.presenceEl,
        db: this.db,
        onJoinRoom: (roomCode, user) => this.handleRoomJoined(roomCode, user),
      });

      // 3. Notes Manager
      this.notesManager = new this.NotesClass({
        canvasInnerEl: this.innerEl,
        canvasController: this.canvas,
        db: this.db,
        getRoom: () => this.roomManager.getRoom(),
        getUser: () => this.roomManager.getUser(),
        onContextMenu: (note, x, y) => this.contextMenu.show(note, x, y),
        onNotesChanged: (notes) => this.handleNotesUpdated(notes),
      });

      // 4. Context Menu
      this.contextMenu = new this.ContextClass({
        menuEl: this.contextEl,
        notesManager: this.notesManager,
      });

      // 5. Search Bar
      this.searchBar = new this.SearchClass({
        wrapperEl: this.searchEl,
        notesManager: this.notesManager,
      });

      // 6. Recycle Bin Panel
      this.recycleBin = new this.RecycleClass({
        panelEl: this.recycleEl,
        notesManager: this.notesManager,
        onUpdate: () => {
          this.handleNotesUpdated(this.notesManager.getNotes());
        },
      });

      // 7. Palette Dock
      this.dock = new this.DockClass({
        dockEl: this.dockEl,
        db: this.db,
        getRoom: () => this.roomManager.getRoom(),
        onSpawnNote: (color) => {
          this.notesManager.spawnNote(color);
        },
        onToggleRecycle: () => {
          this.recycleBin.toggle();
        },
        onToggleSearch: () => {
          this.searchBar.toggle();
        },
      });

      // 8. Now that all components are initialized, start session
      this.roomManager.initSession();
    }

    handleRoomJoined(roomCode, user) {
      if (this.unsubscribeRoom) {
        this.unsubscribeRoom();
      }

      // Check seed notes for a new/empty room
      const existing = this.db.getNotes(roomCode);
      const initializedKey = `stickyspace:${roomCode}:initialized`;
      const isInitialized = localStorage.getItem(initializedKey);

      if (existing.length === 0 && !isInitialized) {
        this.seedInitialNotes(roomCode, user);
        localStorage.setItem(initializedKey, 'true');
      }

      // Load pack counts for this room
      const packs = this.db.getPacks(roomCode);
      if (this.dock) {
        this.dock.setPacks(packs);
      }

      // Subscribe to changes in this room
      this.unsubscribeRoom = this.db.onNotesChange(roomCode, (notes) => {
        if (this.notesManager) {
          this.notesManager.setNotes(notes);
        }
        this.handleNotesUpdated(notes);
      });
    }

    seedInitialNotes(roomCode, user) {
      const NS = window.StickySpace || {};
      const generateId = NS.generateId || (() => String(Date.now()));

      const seeded = this.seedNotes.map((s, idx) => ({
        id: generateId(),
        color: s.color,
        title: s.title,
        body: s.body,
        x: s.x,
        y: s.y,
        width: this.defaults.width,
        height: this.defaults.height,
        rotation: s.rotation,
        zIndex: 10 + idx,
        locked: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: user?.displayName || 'Sticky Space',
        deleted: false,
        deletedAt: null,
      }));

      seeded.forEach(note => {
        this.db.saveNote(roomCode, note);
      });
    }

    handleNotesUpdated(notes) {
      const active = notes.filter(n => !n.deleted);
      const deleted = notes.filter(n => n.deleted);

      // Update empty canvas hint
      if (this.emptyHintEl) {
        if (active.length === 0) {
          this.emptyHintEl.classList.remove('hidden');
        } else {
          this.emptyHintEl.classList.add('hidden');
        }
      }

      // Update dock badge
      if (this.dock) {
        this.dock.setDeletedCount(deleted.length);
      }

      // If recycle bin is open, refresh its list
      if (this.recycleBin && this.recycleBin.isOpen) {
        this.recycleBin.render();
      }

      // If search is active, refresh dimming
      if (this.searchBar && this.searchBar.isVisible && this.searchBar.query) {
        this.searchBar.applyFilter();
      }
    }
  }

  window.StickySpace = window.StickySpace || {};
  window.StickySpace.StickySpaceApp = StickySpaceApp;

  // Bootstrap on DOM ready
  const start = () => {
    if (!window.app) {
      window.app = new StickySpaceApp();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
