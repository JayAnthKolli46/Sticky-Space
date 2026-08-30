/**
 * Sticky Space — Constants & Configuration
 */

(function() {
  const COLORS = ['pink', 'yellow', 'blue', 'green', 'orange'];

  const COLOR_META = {
    pink: {
      label: 'Personal Reminders',
      emoji: '🌸',
      face: '#ffc6d9',
      header: '#ff8fab',
      shadow: 'rgba(255, 143, 171, 0.35)',
      ink: '#4a1628',
    },
    yellow: {
      label: 'Urgent / Action Items',
      emoji: '⚡',
      face: '#fff3b0',
      header: '#ffd166',
      shadow: 'rgba(255, 209, 102, 0.35)',
      ink: '#3d2e00',
    },
    blue: {
      label: 'Informational',
      emoji: '💡',
      face: '#c8e6ff',
      header: '#74b9ff',
      shadow: 'rgba(116, 185, 255, 0.35)',
      ink: '#00264d',
    },
    green: {
      label: 'Ideas & Insights',
      emoji: '🌿',
      face: '#c3fae8',
      header: '#63e6be',
      shadow: 'rgba(99, 230, 190, 0.35)',
      ink: '#003322',
    },
    orange: {
      label: 'High Priority',
      emoji: '🔥',
      face: '#ffd8a8',
      header: '#ff9f43',
      shadow: 'rgba(255, 159, 67, 0.35)',
      ink: '#3d1a00',
    },
  };

  const USER_COLORS = [
    '#e64980',
    '#f59f00',
    '#2f9e44',
    '#1971c2',
    '#7048e8',
    '#0c8599',
    '#e8590c',
    '#c2255c',
  ];

  const NOTE_DEFAULTS = {
    width: 220,
    height: 200,
    minWidth: 160,
    minHeight: 140,
    maxWidth: 480,
    maxHeight: 600,
  };

  const ZOOM = {
    min: 0.3,
    max: 2.5,
    factor: 1.1,
    default: 1.0,
  };

  const PACK_REFILL = 20;

  const SEED_NOTES = [
    {
      color: 'yellow',
      title: '⚡ Try dragging!',
      body: 'Drag me anywhere on the canvas.',
      x: 160,
      y: 130,
      rotation: -3,
    },
    {
      color: 'blue',
      title: '💡 Right-click me',
      body: 'Right-click any note for a full options menu.',
      x: 480,
      y: 100,
      rotation: 2,
    },
    {
      color: 'green',
      title: '🌿 Zoom & Pan',
      body: 'Scroll to zoom. Drag the dark background to pan.',
      x: 320,
      y: 310,
      rotation: -1.5,
    },
  ];

  window.StickySpace = window.StickySpace || {};
  window.StickySpace.COLORS = COLORS;
  window.StickySpace.COLOR_META = COLOR_META;
  window.StickySpace.USER_COLORS = USER_COLORS;
  window.StickySpace.NOTE_DEFAULTS = NOTE_DEFAULTS;
  window.StickySpace.ZOOM = ZOOM;
  window.StickySpace.PACK_REFILL = PACK_REFILL;
  window.StickySpace.SEED_NOTES = SEED_NOTES;
})();

