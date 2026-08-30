/**
 * Sticky Space — Custom Context Menu Controller (Hardened)
 * Provides rich right-click options for sticky notes (Edit, Duplicate, Color, Lock, Delete).
 * Author: Jayanth
 */

(function() {
  class ContextMenu {
    constructor({ menuEl, notesManager }) {
      this.menu = menuEl;
      this.notesManager = notesManager;
      this.targetNote = null;
      this.isOpen = false;

      const NS = window.StickySpace || {};
      this.colors = NS.COLORS || ['pink', 'yellow', 'blue', 'green', 'orange'];

      this.initDOM();
      this.initEvents();
    }

    initDOM() {
      this.menu.className = 'context-menu';
      this.menu.innerHTML = `
        <div class="ctx-item" data-action="edit">
          <span class="icon">✏️</span>
          <span class="label">Edit</span>
        </div>
        <div class="ctx-item" data-action="duplicate">
          <span class="icon">📋</span>
          <span class="label">Duplicate</span>
        </div>
        <div class="ctx-item ctx-color-item" data-action="color">
          <span class="icon">🎨</span>
          <span class="label">Change Color</span>
          <span class="arrow">▶</span>
          <div class="ctx-submenu">
            ${this.colors.map(c => `<div class="ctx-color-swatch ${c}" data-color="${c}" title="${c}"></div>`).join('')}
          </div>
        </div>
        <div class="ctx-item" data-action="lock">
          <span class="icon ctx-lock-icon">🔒</span>
          <span class="label ctx-lock-label">Lock</span>
        </div>
        <div class="ctx-separator"></div>
        <div class="ctx-item danger" data-action="delete">
          <span class="icon">🗑️</span>
          <span class="label">Delete</span>
        </div>
      `;
    }

    initEvents() {
      // Menu item clicks
      this.menu.addEventListener('click', (e) => {
        e.stopPropagation();
        const colorSwatch = e.target.closest('.ctx-color-swatch');
        if (colorSwatch && this.targetNote) {
          const validColors = ['pink', 'yellow', 'blue', 'green', 'orange'];
          const selectedColor = colorSwatch.dataset.color;
          if (validColors.includes(selectedColor)) {
            this.notesManager.changeColor(this.targetNote.id, selectedColor);
          }
          this.close();
          return;
        }

        const item = e.target.closest('.ctx-item');
        if (!item || !this.targetNote) return;

        const action = item.dataset.action;
        if (action === 'edit') {
          this.notesManager.startEditing(this.targetNote.id);
        } else if (action === 'duplicate') {
          this.notesManager.duplicateNote(this.targetNote.id);
        } else if (action === 'lock') {
          this.notesManager.toggleLock(this.targetNote.id);
        } else if (action === 'delete') {
          this.notesManager.softDelete(this.targetNote.id);
        }

        this.close();
      });

      // Dismiss events
      document.addEventListener('mousedown', (e) => {
        if (this.isOpen && !this.menu.contains(e.target)) {
          this.close();
        }
      });

      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen) {
          this.close();
        }
      });

      window.addEventListener('wheel', () => {
        if (this.isOpen) this.close();
      }, { passive: true });
    }

    show(note, clientX, clientY) {
      if (!note || !note.id) return;
      this.targetNote = note;
      this.isOpen = true;

      // Update lock label & icon dynamically
      const lockIcon = this.menu.querySelector('.ctx-lock-icon');
      const lockLabel = this.menu.querySelector('.ctx-lock-label');
      if (lockIcon && lockLabel) {
        if (note.locked) {
          lockIcon.textContent = '🔓';
          lockLabel.textContent = 'Unlock';
        } else {
          lockIcon.textContent = '🔒';
          lockLabel.textContent = 'Lock';
        }
      }

      this.menu.classList.add('open');

      // Position menu and clamp to screen viewport
      const menuWidth = 200;
      const menuHeight = 220;
      const posX = Math.min(window.innerWidth - menuWidth - 10, Math.max(10, clientX));
      const posY = Math.min(window.innerHeight - menuHeight - 10, Math.max(10, clientY));

      this.menu.style.left = `${posX}px`;
      this.menu.style.top = `${posY}px`;
    }

    close() {
      this.isOpen = false;
      this.targetNote = null;
      this.menu.classList.remove('open');
    }
  }

  window.StickySpace = window.StickySpace || {};
  window.StickySpace.ContextMenu = ContextMenu;
})();
