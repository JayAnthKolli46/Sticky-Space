/**
 * Sticky Space — Search Bar Controller (Hardened)
 * Handles real-time note filtering, query clearing, and dimming non-matching notes.
 * Author: Jayanth
 */

(function() {
  class SearchBar {
    constructor({ wrapperEl, notesManager }) {
      this.wrapper = wrapperEl;
      this.notesManager = notesManager;
      this.isVisible = false;
      this.query = '';

      this.initDOM();
      this.initEvents();
    }

    initDOM() {
      this.wrapper.className = 'search-bar-wrap hidden';
      this.wrapper.innerHTML = `
        <div class="search-input-wrap">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input type="text" class="search-input" placeholder="Search notes by title or content..." maxlength="100" aria-label="Search notes" />
          <button class="search-clear-btn" style="display: none;" title="Clear search" aria-label="Clear search">✕</button>
        </div>
      `;

      this.input = this.wrapper.querySelector('.search-input');
      this.clearBtn = this.wrapper.querySelector('.search-clear-btn');
    }

    initEvents() {
      this.input.addEventListener('input', () => {
        this.query = this.input.value.trim().toLowerCase();
        this.clearBtn.style.display = this.query ? 'flex' : 'none';
        this.applyFilter();
      });

      this.clearBtn.addEventListener('click', () => {
        this.clear();
      });

      // Keyboard shortcuts
      this.input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          if (this.query) {
            this.clear();
          } else {
            this.hide();
          }
        }
      });

      // Global shortcut: Ctrl+F / Cmd+F to open search
      window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
          e.preventDefault();
          this.show();
        }
      });
    }

    toggle() {
      if (this.isVisible) {
        this.hide();
      } else {
        this.show();
      }
    }

    show() {
      this.isVisible = true;
      this.wrapper.classList.remove('hidden');
      this.input.focus();
      if (this.query) {
        this.applyFilter();
      }
    }

    hide() {
      this.isVisible = false;
      this.wrapper.classList.add('hidden');
      this.clear();
    }

    clear() {
      this.query = '';
      this.input.value = '';
      this.clearBtn.style.display = 'none';
      this.applyFilter();
    }

    applyFilter() {
      const activeNotes = this.notesManager.getActiveNotes();

      if (!this.query) {
        this.notesManager.dimNotesExcept(new Set(), false);
        return;
      }

      const matchingIds = new Set();
      activeNotes.forEach(note => {
        if (!note) return;
        const titleMatch = typeof note.title === 'string' && note.title.toLowerCase().includes(this.query);
        const bodyMatch = typeof note.body === 'string' && note.body.toLowerCase().includes(this.query);
        if (titleMatch || bodyMatch) {
          matchingIds.add(note.id);
        }
      });

      this.notesManager.dimNotesExcept(matchingIds, true);
    }
  }

  window.StickySpace = window.StickySpace || {};
  window.StickySpace.SearchBar = SearchBar;
})();
