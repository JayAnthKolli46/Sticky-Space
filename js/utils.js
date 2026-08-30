/**
 * Sticky Space — Utility Functions (Hardened)
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

  const ADJECTIVES = [
    'swift', 'brave', 'calm', 'clever', 'daring',
    'eager', 'fierce', 'gentle', 'happy', 'jolly',
    'keen', 'lively', 'mighty', 'noble', 'proud',
    'quick', 'radiant', 'silent', 'stellar', 'vibrant',
    'wise', 'zen', 'cosmic', 'lucid', 'bold',
    'mystic', 'epic', 'vivid', 'nimble', 'dazzling'
  ];

  const ANIMALS = [
    'falcon', 'tiger', 'otter', 'panda', 'fox',
    'badger', 'dolphin', 'hawk', 'koala', 'lynx',
    'owl', 'panther', 'raven', 'wolf', 'cheetah',
    'eagle', 'jaguar', 'lemur', 'sparrow', 'hedgehog',
    'orca', 'bison', 'gazelle', 'chameleon', 'phoenix',
    'badger', 'badger', 'peacock', 'dragon', 'griffin'
  ];

  /**
   * Generates a memorable room code: adjective-animal-##
   */
  function generateRoomCode() {
    let randIndex1 = 0, randIndex2 = 0, randNum = 0;
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
      const arr = new Uint32Array(3);
      crypto.getRandomValues(arr);
      randIndex1 = arr[0] % ADJECTIVES.length;
      randIndex2 = arr[1] % ANIMALS.length;
      randNum = 10 + (arr[2] % 90);
    } else {
      randIndex1 = Math.floor(Math.random() * ADJECTIVES.length);
      randIndex2 = Math.floor(Math.random() * ANIMALS.length);
      randNum = Math.floor(10 + Math.random() * 90);
    }
    return `${ADJECTIVES[randIndex1]}-${ANIMALS[randIndex2]}-${randNum}`;
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
