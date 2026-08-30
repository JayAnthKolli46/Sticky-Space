/**
 * Sticky Space — Room Entry Modal & User Presence Controller (Hardened)
 * Manages user sessions, room code assignment, presence badges, and URL hash routing.
 * Author: Jayanth
 */

(function() {
  class RoomManager {
    constructor({ modalEl, presenceEl, db, onJoinRoom }) {
      this.modalEl = modalEl;
      this.presenceEl = presenceEl;
      this.db = db || window.StickySpace.db;
      this.onJoinRoom = onJoinRoom;

      this.currentUser = null;
      this.currentRoom = null;

      this.initDOM();
      this.initEvents();
    }

    initDOM() {
      // Room Modal Markup
      this.modalEl.className = 'modal-overlay hidden';
      this.modalEl.innerHTML = `
        <div class="room-modal">
          <div class="modal-brand">
            <div class="modal-title">
              <span class="logo-icon">🗒️</span>
              <span>Sticky Space</span>
            </div>
            <div class="modal-tagline">Your Shared Thinking Space.</div>
          </div>

          <form class="modal-fields" id="room-form">
            <div class="modal-field-group">
              <label class="modal-field-label" for="user-name-input">Your Display Name</label>
              <input type="text" id="user-name-input" class="modal-input" placeholder="e.g. Jayanth" maxlength="24" autocomplete="name" required />
            </div>

            <div class="modal-field-group">
              <label class="modal-field-label" for="room-code-input">Room Code</label>
              <div class="modal-room-row">
                <input type="text" id="room-code-input" class="modal-input" placeholder="e.g. space-7k2m-9p4q-x8vw" maxlength="48" pattern="[a-zA-Z0-9_-]+" title="Alphanumeric characters, dashes and underscores only" required />
                <button type="button" class="modal-random-btn" id="btn-random-code" title="Generate secure random room code">🎲 Random</button>
              </div>
            </div>

            <button type="submit" class="modal-enter-btn">Enter Space →</button>
          </form>
        </div>
      `;

      // Presence Badge Markup
      this.presenceEl.className = 'user-presence';
      this.presenceEl.innerHTML = `
        <div class="user-avatar" style="background: #1971c2;">A</div>
        <span class="user-name-label">Anonymous</span>
        <span class="room-badge">#default</span>
      `;

      this.nameInput = this.modalEl.querySelector('#user-name-input');
      this.roomInput = this.modalEl.querySelector('#room-code-input');
      this.randomBtn = this.modalEl.querySelector('#btn-random-code');
      this.form = this.modalEl.querySelector('#room-form');
    }

    initEvents() {
      const NS = window.StickySpace || {};
      const generateRoomCode = NS.generateRoomCode || (() => 'space-' + Math.random().toString(36).substring(2, 10));

      this.randomBtn.addEventListener('click', () => {
        this.roomInput.value = generateRoomCode();
      });

      this.form.addEventListener('submit', (e) => {
        e.preventDefault();
        const rawName = this.nameInput.value.trim();
        const rawRoom = this.roomInput.value.trim();

        const cleanName = (NS.sanitizeString ? NS.sanitizeString(rawName, 24) : rawName.slice(0, 24)) || 'Anonymous';
        const cleanRoom = rawRoom.toLowerCase().replace(/[^a-z0-9_-]/g, '') || generateRoomCode();

        this.joinRoom(cleanName, cleanRoom);
      });

      // Clicking presence badge allows switching rooms
      this.presenceEl.addEventListener('click', () => {
        this.openModal();
      });

      // Listen to hash changes
      window.addEventListener('hashchange', () => {
        const hashRoom = window.location.hash.slice(1).trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
        if (hashRoom && hashRoom !== this.currentRoom) {
          const session = this.db.getSession();
          if (session && session.displayName) {
            this.joinRoom(session.displayName, hashRoom);
          } else {
            this.roomInput.value = hashRoom;
            this.openModal();
          }
        }
      });
    }

    initSession() {
      const NS = window.StickySpace || {};
      const generateRoomCode = NS.generateRoomCode || (() => 'space-' + Math.random().toString(36).substring(2, 10));
      const session = this.db.getSession();
      const hashRoom = window.location.hash.slice(1).trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');

      if (hashRoom) {
        if (session && session.displayName) {
          // Direct auto-entry with existing name into hash room
          this.joinRoom(session.displayName, hashRoom, session.userId, session.userColor);
          return;
        }
        this.roomInput.value = hashRoom;
      } else if (session && session.roomCode && session.displayName) {
        // Auto-entry into last visited session room
        this.joinRoom(session.displayName, session.roomCode, session.userId, session.userColor);
        return;
      } else {
        this.roomInput.value = generateRoomCode();
      }

      if (session && session.displayName) {
        this.nameInput.value = session.displayName;
      }

      this.openModal();
    }

    openModal() {
      const NS = window.StickySpace || {};
      const generateRoomCode = NS.generateRoomCode || (() => 'space-' + Math.random().toString(36).substring(2, 10));

      this.modalEl.classList.remove('hidden');
      if (!this.roomInput.value) {
        this.roomInput.value = this.currentRoom || generateRoomCode();
      }
      setTimeout(() => {
        if (!this.nameInput.value) {
          this.nameInput.focus();
        } else {
          this.roomInput.focus();
        }
      }, 100);
    }

    closeModal() {
      this.modalEl.classList.add('hidden');
    }

    joinRoom(displayName, roomCode, userId = null, userColor = null) {
      const NS = window.StickySpace || {};
      const generateId = NS.generateId || (() => String(Date.now()));
      const getRandomUserColor = NS.getRandomUserColor || (() => '#1971c2');

      const sName = typeof displayName === 'string' ? displayName.trim().slice(0, 24) || 'Anonymous' : 'Anonymous';
      const sRoom = typeof roomCode === 'string' ? roomCode.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '') || 'default-space' : 'default-space';

      this.currentRoom = sRoom;
      this.currentUser = {
        userId: userId || generateId(),
        displayName: sName,
        roomCode: sRoom,
        userColor: userColor || getRandomUserColor(),
      };

      // Save session
      this.db.saveSession(this.currentUser);

      // Update URL Hash
      if (window.location.hash.slice(1) !== sRoom) {
        window.location.hash = `#${sRoom}`;
      }

      // Update presence badge
      const avatar = this.presenceEl.querySelector('.user-avatar');
      const nameLabel = this.presenceEl.querySelector('.user-name-label');
      const roomBadge = this.presenceEl.querySelector('.room-badge');

      if (avatar) {
        avatar.style.backgroundColor = this.currentUser.userColor;
        avatar.textContent = (sName[0] || 'A').toUpperCase();
      }
      if (nameLabel) {
        nameLabel.textContent = sName;
      }
      if (roomBadge) {
        roomBadge.textContent = `#${sRoom}`;
      }

      this.closeModal();

      if (this.onJoinRoom) {
        this.onJoinRoom(sRoom, this.currentUser);
      }
    }

    getRoom() {
      return this.currentRoom || 'default-space';
    }

    getUser() {
      return this.currentUser;
    }
  }

  window.StickySpace = window.StickySpace || {};
  window.StickySpace.RoomManager = RoomManager;
})();
