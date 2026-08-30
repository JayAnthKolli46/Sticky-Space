/**
 * Sticky Space — Canvas Controller (Hardened)
 * Handles panning, cursor-centered zooming, background dot grid tracking, and transform updates.
 * Author: Jayanth
 */

(function() {
  class CanvasController {
    constructor({ wrapperEl, innerEl, zoomPillEl }) {
      this.wrapper = wrapperEl;
      this.inner = innerEl;
      this.zoomPill = zoomPillEl;

      const NS = window.StickySpace || {};
      this.zoomConfig = NS.ZOOM || { min: 0.3, max: 2.5, factor: 1.1, default: 1.0 };

      this.panX = 0;
      this.panY = 0;
      this.zoom = this.zoomConfig.default || 1.0;

      this.isPanning = false;
      this.startX = 0;
      this.startY = 0;

      this.onTransformChangeCallbacks = [];

      this.initEvents();
      this.update();
    }

    onTransformChange(cb) {
      this.onTransformChangeCallbacks.push(cb);
    }

    notifyTransform() {
      this.onTransformChangeCallbacks.forEach(cb => {
        try {
          cb({ panX: this.panX, panY: this.panY, zoom: this.zoom });
        } catch (e) {
          console.error(e);
        }
      });
    }

    initEvents() {
      // Pan via mouse drag on background
      this.wrapper.addEventListener('mousedown', (e) => {
        if (e.target.closest('.sticky-note') || e.target.closest('.palette-dock') ||
            e.target.closest('.recycle-panel') || e.target.closest('.search-bar-wrap') ||
            e.target.closest('.room-modal') || e.target.closest('.zoom-pill') ||
            e.target.closest('.user-presence') || e.target.closest('.context-menu')) {
          return;
        }
        if (e.button !== 0 && e.button !== 1) return;

        this.isPanning = true;
        this.startX = e.clientX - this.panX;
        this.startY = e.clientY - this.panY;
        this.wrapper.classList.add('panning');
      });

      window.addEventListener('mousemove', (e) => {
        if (!this.isPanning) return;
        // Bounds checking on pan coordinates (-50000 to +50000 px) to avoid numeric overflow
        this.panX = Math.max(-50000, Math.min(50000, e.clientX - this.startX));
        this.panY = Math.max(-50000, Math.min(50000, e.clientY - this.startY));
        this.update();
      });

      const stopPan = () => {
        if (this.isPanning) {
          this.isPanning = false;
          this.wrapper.classList.remove('panning');
        }
      };

      window.addEventListener('mouseup', stopPan);
      window.addEventListener('blur', stopPan);

      // Zoom via mouse wheel (cursor centered)
      this.wrapper.addEventListener('wheel', (e) => {
        if (e.target.closest('.note-body-input') || e.target.closest('.recycle-list')) {
          return;
        }
        e.preventDefault();
        this.zoomAt(e.clientX, e.clientY, e.deltaY);
      }, { passive: false });

      // Reset button on zoom pill
      if (this.zoomPill) {
        this.zoomPill.addEventListener('click', () => {
          this.resetView();
        });
      }
    }

    zoomAt(clientX, clientY, delta) {
      if (!Number.isFinite(clientX) || !Number.isFinite(clientY)) return;
      const minZ = this.zoomConfig.min;
      const maxZ = this.zoomConfig.max;
      const factor = delta < 0 ? this.zoomConfig.factor : 1 / this.zoomConfig.factor;
      const newZoom = Math.min(maxZ, Math.max(minZ, this.zoom * factor));
      if (newZoom === this.zoom || !Number.isFinite(newZoom)) return;

      const ratio = newZoom / this.zoom;
      this.panX = clientX - ratio * (clientX - this.panX);
      this.panY = clientY - ratio * (clientY - this.panY);
      this.zoom = newZoom;

      this.update();
    }

    update() {
      // Clean finite assertions
      const safePanX = Number.isFinite(this.panX) ? this.panX : 0;
      const safePanY = Number.isFinite(this.panY) ? this.panY : 0;
      const safeZoom = Number.isFinite(this.zoom) && this.zoom > 0 ? this.zoom : 1.0;

      // 1. Shift dot grid with pan on wrapper
      this.wrapper.style.backgroundPosition = `${safePanX}px ${safePanY}px`;

      // 2. Apply transform on inner layer
      this.inner.style.transform = `translate(${safePanX}px, ${safePanY}px) scale(${safeZoom})`;

      // 3. Update zoom pill text
      if (this.zoomPill) {
        this.zoomPill.textContent = `${Math.round(safeZoom * 100)}%`;
      }

      this.notifyTransform();
    }

    resetView() {
      const startPanX = this.panX;
      const startPanY = this.panY;
      const startZoom = this.zoom;
      const targetPanX = 0;
      const targetPanY = 0;
      const targetZoom = 1.0;
      const duration = 300;
      const startTime = performance.now();

      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(1, elapsed / duration);
        const ease = 1 - Math.pow(1 - progress, 3);

        this.panX = startPanX + (targetPanX - startPanX) * ease;
        this.panY = startPanY + (targetPanY - startPanY) * ease;
        this.zoom = startZoom + (targetZoom - startZoom) * ease;

        this.update();

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }

    screenToCanvas(clientX, clientY) {
      return {
        x: (clientX - this.panX) / this.zoom,
        y: (clientY - this.panY) / this.zoom,
      };
    }

    getCanvasCenter() {
      return {
        x: (window.innerWidth / 2 - this.panX) / this.zoom,
        y: (window.innerHeight / 2 - this.panY) / this.zoom,
      };
    }
  }

  window.StickySpace = window.StickySpace || {};
  window.StickySpace.CanvasController = CanvasController;
})();
