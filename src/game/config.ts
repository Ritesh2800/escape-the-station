// Game configuration constants for Carriage-Based Station Escape
export const GAME_RULES = {
  TOTAL_TIME_SEC: 30, // Max 30s to complete the game
  STAGE_TARGETS: ['07', '25', '16'] as const,
  FULL_PIN: '072516',
};

export const TRAIN_SPECS = {
  ENGINE_W: 220,
  CARRIAGE_W: 260,
  COUPLING_W: 8,
  TRAIN_H: 160,
  CARRIAGE_COUNT: 3,
};

export const ERA_INFO = {
  past: {
    label: '1890',
    name: 'Victorian Steam',
    accent: '#e8b84a',
    bg: '#2c1e14',
    textColor: '#f4ead2',
  },
  present: {
    label: 'NOW',
    name: 'Commuter Express',
    accent: '#7c6ca7',
    bg: '#0f172a',
    textColor: '#f8fafc',
  },
  future: {
    label: '2080',
    name: 'Cyber Maglev',
    accent: '#06b6d4',
    bg: '#0d0722',
    textColor: '#e0f2fe',
  },
} as const;

export const PALETTE = {
  panelBg: '#14122e',
  panelText: '#f4ead2',
  success: '#4ade80',
  fail: '#ff5252',
  warning: '#ffd445',
} as const;

export const ZONES = {
  TRACK_Y_PERCENT: 520 / 720,
} as const;
