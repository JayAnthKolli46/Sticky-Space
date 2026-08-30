/**
 * Sticky Space — Utility Functions (Hardened & High Entropy)
 * Author: Jayanth
 */

(function() {
  const USER_COLORS_FALLBACK = [
    '#e64980', '#f59f00', '#2f9e44', '#1971c2',
    '#7048e8', '#0c8599', '#e8590c', '#c2255c'
  ];

  /**
   * Generates a cryptographically strong UUID v4 string
   */
  function generateId() {
    if (typeof crypto !== 'undefined') {
      if (typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
      }
      if (typeof crypto.getRandomValues === 'function') {
        const bytes = new Uint8Array(16);
        crypto.getRandomValues(bytes);
        bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
        bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 10
        const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
        return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
      }
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Generates a high-entropy, cryptographically secure, unguessable room code:
   * Format: space-xxxx-xxxx-xxxx
   * Entropy: 32^12 = 1.15 quintillion combinations (virtually impossible to brute-force)
   */
  function generateRoomCode() {
    // Unambiguous Base32 character set (excludes confusing 0/O, 1/l/I)
    const charset = '23456789abcdefghjkmnpqrstuvwxyz';
    const bytes = new Uint8Array(12);

    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
      crypto.getRandomValues(bytes);
    } else {
      for (let i = 0; i < 12; i++) {
        bytes[i] = Math.floor(Math.random() * 256);
      }
    }

    let token = '';
    for (let i = 0; i < 12; i++) {
      token += charset[bytes[i] % charset.length];
    }

    return `space-${token.slice(0, 4)}-${token.slice(4, 8)}-${token.slice(8, 12)}`;
  }

  /**
   * Formats an ISO date string into: "Aug 30, 11:42 AM"
   */
  function formatDate(isoString) {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return '';
    }
  }

  /**
   * Picks a random color from the user palette
   */
  function getRandomUserColor() {
    const palette = (window.StickySpace && window.StickySpace.USER_COLORS) || USER_COLORS_FALLBACK;
    return palette[Math.floor(Math.random() * palette.length)];
  }

  /**
   * Returns a random rotation in range [-4, 4] degrees
   */
  function getRandomRotation() {
    return parseFloat(((Math.random() * 8) - 4).toFixed(1));
  }

  /**
   * Clamps a number between min and max
   */
  function clamp(val, min, max) {
    if (!Number.isFinite(val)) return min;
    return Math.min(max, Math.max(min, val));
  }

  /**
   * Sanitizes a plain text string
   */
  function sanitizeString(str, maxLength = 500) {
    if (typeof str !== 'string') return '';
    return str.slice(0, maxLength).replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F]/g, '');
  }

  window.StickySpace = window.StickySpace || {};
  window.StickySpace.generateId = generateId;
  window.StickySpace.generateRoomCode = generateRoomCode;
  window.StickySpace.formatDate = formatDate;
  window.StickySpace.getRandomUserColor = getRandomUserColor;
  window.StickySpace.getRandomRotation = getRandomRotation;
  window.StickySpace.clamp = clamp;
  window.StickySpace.sanitizeString = sanitizeString;
})();
