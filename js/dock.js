/**
 * Sticky Space — Palette Dock Controller (Hardened)
 * Manages the floating bottom palette dock, 3D stacked color swatches, pack inventory, and shortcuts.
 * Author: Jayanth
 */

(function() {
  class PaletteDock {
    constructor({ dockEl, db, getRoom, onSpawnNote, onToggleRecycle, onToggleSearch }) {
      this.dock = dockEl;
      this.db = db || window.StickySpace.db;
      this.getRoom = getRoom;
      this.onSpawnNote = onSpawnNote;
      this.onToggleRecycle = onToggleRecycle;
      this.onToggleSearch = onToggleSearch;

      const NS = window.StickySpace || {};
      this.colors = NS.COLORS || ['pink', 'yellow', 'blue', 'green', 'orange'];
      this.colorMeta = NS.COLOR_META || {};
      this.refillAmount = NS.PACK_REFILL || 20;

      this.packs = {
        pink: 20,
        yellow: 20,
        blue: 20,
        green: 20,
        orange: 20,
      };

      this.deletedCount = 0;
      this.render();
    }

    setPacks(packs) {
      if (packs && typeof packs === 'object') {
        this.packs = { ...this.packs, ...packs };
      }
      this.updatePackCounts();
    }

    setDeletedCount(count) {
      const safeCount = Number.isFinite(count) && count >= 0 ? count : 0;
      this.deletedCount = safeCount;
      const badge = this.dock.querySelector('.recycle-badge');
      if (badge) {
        badge.textContent = safeCount;
        if (safeCount > 0) {
          badge.classList.remove('hidden');
        } else {
          badge.classList.add('hidden');
        }
      }
    }

    render() {
      this.dock.innerHTML = `
        <!-- Recycle Bin Utility Button -->
        <button class="dock-util-btn btn-recycle" aria-label="Open Recycle Bin" title="Recycle Bin">
          <svg viewBox="0 0 24 24">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
          <span class="recycle-badge hidden">0</span>
          <span>Bin</span>
        </button>

        <div class="dock-divider"></div>

        <!-- Search Utility Button -->
        <button class="dock-util-btn btn-search" aria-label="Toggle Search" title="Search Notes">
          <svg viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <span>Search</span>
        </button>

        <div class="dock-divider"></div>

        <!-- Color Stack Buttons -->
        <div class="dock-colors" style="display: flex; gap: 8px;">
          ${this.colors.map(color => {
            const meta = this.colorMeta[color] || { label: color, emoji: '🗒️' };
            return `
              <button class="color-stack-btn" data-color="${color}" data-tip="${meta.label} ${meta.emoji}" aria-label="Add ${meta.label}">
                <div class="color-swatch ${color}">
                  <div class="stack-refill-btn" style="display: none;" title="Refill Pack">+</div>
                </div>
                <span class="stack-count" data-color="${color}">20</span>
              </button>
            `;
          }).join('')}
        </div>
      `;

      // Event listeners
      this.dock.querySelector('.btn-recycle').addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.onToggleRecycle) this.onToggleRecycle();
      });

      this.dock.querySelector('.btn-search').addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.onToggleSearch) this.onToggleSearch();
      });

      // Color stack click handling
      this.dock.querySelectorAll('.color-stack-btn').forEach(btn => {
        const color = btn.dataset.color;
        const refillBtn = btn.querySelector('.stack-refill-btn');

        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const currentCount = this.packs[color] ?? 20;

          // If clicked on refill button or exhausted
          if (e.target === refillBtn || currentCount <= 0) {
            const newCount = Math.min(1000, (currentCount <= 0 ? 0 : currentCount) + this.refillAmount);
            this.packs[color] = newCount;
            this.db.setPack(this.getRoom(), color, newCount);
            this.updatePackCounts();
            return;
          }

          // Spawn note
          if (currentCount > 0) {
            const newCount = currentCount - 1;
            this.packs[color] = newCount;
            this.db.setPack(this.getRoom(), color, newCount);
            this.updatePackCounts();

            if (this.onSpawnNote) {
              this.onSpawnNote(color);
            }
          }
        });
      });

      this.updatePackCounts();
    }

    updatePackCounts() {
      this.colors.forEach(color => {
        const count = this.packs[color] ?? 20;
        const btn = this.dock.querySelector(`.color-stack-btn[data-color="${color}"]`);
        if (!btn) return;

        const countEl = btn.querySelector('.stack-count');
        const refillBtn = btn.querySelector('.stack-refill-btn');

        if (countEl) countEl.textContent = count;

        if (count <= 0) {
          btn.classList.add('exhausted');
          if (refillBtn) refillBtn.style.display = 'flex';
        } else {
          btn.classList.remove('exhausted');
          if (refillBtn) refillBtn.style.display = 'none';
        }
      });
    }
  }

  window.StickySpace = window.StickySpace || {};
  window.StickySpace.PaletteDock = PaletteDock;
})();
