// Game configuration constants (Sections 4, 5, 9)
export const TRAIN = {
  DOCKED_MS: 45000,
  DEPART_MS: 15000,
  ARRIVE_MS: 3000,
  EMPTY_MS: 5000,
  ENGINE_W: 80,
  ENGINE_H: 50,
  CARRIAGE_W: 60,
  CARRIAGE_H: 45,
  CARRIAGE_COUNT: 7,
};

export const ERA_COLORS = {
  past: { accent: '#e8b84a', label: '1890', bg: '#5c3a1e' },
  present: { accent: '#3aa0e0', label: 'NOW', bg: '#3aa0e0' },
  future: { accent: '#4ff0ff', label: '2080', bg: '#1a0a3e' },
} as const;

export const PALETTE = {
  panelBg: '#14122e',
  panelText: '#f4ead2',
  success: '#4ade80',
  fail: '#ff5252',
  warning: '#ffd445',
} as const;

export const ANIMATION = {
  EXPAND_DURATION_MS: 800,
  EXPAND_EASING: 'cubic-bezier(0.22, 1, 0.36, 1)',
  COLLAPSE_DURATION_MS: 800,
  GLITCH_DURATION_MS: 400,
} as const;

// Level 1 target
export const LEVEL1_TARGET = '072516';

// Level 2 target (canonical)
export const LEVEL2_TARGET = '@S2!E8';

// Train colors per era for placeholder rectangles
export const TRAIN_ERA_COLORS = {
  past: { engine: '#7a2e2e', carriage: '#8b4513' },
  present: { engine: '#4a7ab5', carriage: '#5588bb' },
  future: { engine: '#2a1a5e', carriage: '#3d2d7a' },
} as const;

// Layout zones (Section 3.1) as percentages of 1280x720
export const ZONES = {
  TRACK_Y_START: 515 / 720,
  TRACK_Y_END: 560 / 720,
  PLATFORM_Y: 560 / 720,
  STATION_ROOM_X_END: 315 / 1280,
  TRAIN_DOCK_X: 340 / 1280,
} as const;
