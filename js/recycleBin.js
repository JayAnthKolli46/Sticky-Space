/**
 * Sticky Space — Recycle Bin Drawer Controller
 * Handles soft-deleted note listings, restoration, permanent deletion, and empty bin actions.
 * Author: Jayanth
 */

(function() {
  class RecycleBinPanel {
    constructor({ panelEl, notesManager, onUpdate }) {
      this.panel = panelEl;
      this.notesManager = notesManager;
      this.onUpdate = onUpdate;
      this.isOpen = false;

      this.initDOM();
      this.initEvents();
    }

    initDOM() {
      this.panel.className = 'recycle-panel closed';
      this.panel.innerHTML = `
        <div class="recycle-header">
          <span>Recycle Bin</span>
          <button class="recycle-close-btn" aria-label="Close Recycle Bin">✕</button>
        </div>

        <div class="recycle-list"></div>

        <div class="recycle-footer">
          <button class="empty-bin-btn" disabled>Empty Bin</button>
        </div>
      `;

      this.listEl = this.panel.querySelector('.recycle-list');
      this.emptyBtn = this.panel.querySelector('.empty-bin-btn');
      this.closeBtn = this.panel.querySelector('.recycle-close-btn');
    }

    initEvents() {
      this.closeBtn.addEventListener('click', () => {
        this.close();
      });

      this.emptyBtn.addEventListener('click', () => {
        const deletedNotes = this.notesManager.getDeletedNotes();
        if (deletedNotes.length === 0) return;

        const confirmed = window.confirm(
          `Are you sure you want to permanently delete all ${deletedNotes.length} item(s) in the Recycle Bin? This action cannot be undone.`
        );
        if (confirmed) {
          this.notesManager.emptyRecycleBin();
          if (this.onUpdate) this.onUpdate();
        }
      });

      // Close on escape
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen) {
          this.close();
        }
      });

      // Close when clicking outside panel
      document.addEventListener('mousedown', (e) => {
        if (this.isOpen && !this.panel.contains(e.target) && !e.target.closest('.btn-recycle')) {
          this.close();
        }
      });
    }

    toggle() {
      if (this.isOpen) {
        this.close();
      } else {
        this.open();
      }
    }

    open() {
      this.isOpen = true;
      this.panel.classList.remove('closed');
      this.panel.classList.add('open');
      this.render();
    }

    close() {
      this.isOpen = false;
      this.panel.classList.remove('open');
      this.panel.classList.add('closed');
    }

    render() {
      const NS = window.StickySpace || {};
      const formatDate = NS.formatDate || ((s) => s);
      const deletedNotes = this.notesManager.getDeletedNotes();
      this.emptyBtn.disabled = deletedNotes.length === 0;

      if (deletedNotes.length === 0) {
        this.listEl.innerHTML = `
          <div class="recycle-empty-state">
            <span class="recycle-empty-icon">🗑️</span>
            <p>No deleted notes</p>
            <span style="font-size: 11px; opacity: 0.6;">Deleted notes will appear here.</span>
          </div>
        `;
        return;
      }

      this.listEl.innerHTML = '';

      // Secure DOM construction using textContent to eliminate DOM-based XSS vectors
      deletedNotes.forEach(note => {
        const itemEl = document.createElement('div');
        itemEl.className = 'recycle-item';
        itemEl.dataset.id = note.id;

        const titleText = (note.title && note.title.trim()) || (note.body && note.body.trim()) || 'Untitled note';
        const authorText = note.createdBy || 'Anonymous';
        const dateText = formatDate(note.deletedAt || note.updatedAt);

        const headerEl = document.createElement('div');
        headerEl.className = 'recycle-item-header';

        const dotEl = document.createElement('div');
        dotEl.className = `recycle-color-dot ${sanitizeColorClass(note.color)}`;

        const titleSpan = document.createElement('span');
        titleSpan.className = 'recycle-item-title';
        titleSpan.textContent = titleText;

        headerEl.appendChild(dotEl);
        headerEl.appendChild(titleSpan);

        const metaEl = document.createElement('div');
        metaEl.className = 'recycle-item-meta';
        const metaSpan = document.createElement('span');
        metaSpan.textContent = `Deleted by ${authorText} • ${dateText}`;
        metaEl.appendChild(metaSpan);

        const actionsEl = document.createElement('div');
        actionsEl.className = 'recycle-item-actions';

        const restoreBtn = document.createElement('button');
        restoreBtn.className = 'recycle-restore-btn';
        restoreBtn.textContent = 'Restore';
        restoreBtn.addEventListener('click', () => {
          this.notesManager.restore(note.id);
          if (this.onUpdate) this.onUpdate();
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'recycle-hard-delete-btn';
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', () => {
          this.notesManager.hardDelete(note.id);
          if (this.onUpdate) this.onUpdate();
        });

        actionsEl.appendChild(restoreBtn);
        actionsEl.appendChild(deleteBtn);

        itemEl.appendChild(headerEl);
        itemEl.appendChild(metaEl);
        itemEl.appendChild(actionsEl);

        this.listEl.appendChild(itemEl);
      });
    }
  }

  function sanitizeColorClass(color) {
    const allowed = ['pink', 'yellow', 'blue', 'green', 'orange'];
    return allowed.includes(color) ? color : 'yellow';
  }

  window.StickySpace = window.StickySpace || {};
  window.StickySpace.RecycleBinPanel = RecycleBinPanel;
})();
