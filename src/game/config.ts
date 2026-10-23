// Game configuration constants (Section 5)
export const TRAIN = {
  DOCKED_MS: 45000,
  DEPART_MS: 15000,
  ARRIVE_MS: 3000,
};

// Era palette (Section 4)
export const ERA_COLORS = {
  past: { accent: '#e8b84a', label: '1890 — Steam' },
  present: { accent: '#3aa0e0', label: 'NOW — Present' },
  future: { accent: '#4ff0ff', label: '2080 — Cyber' },
} as const;

// Style palette (Section 9.6)
export const PALETTE = {
  panelBg: '#14122e',
  panelText: '#f4ead2',
  success: '#4ade80',
  fail: '#ff5252',
  warning: '#ffd445',
} as const;

// Animation constants (Section 9.2)
export const ANIMATION = {
  EXPAND_DURATION_MS: 800,
  EXPAND_EASING: 'cubic-bezier(0.22, 1, 0.36, 1)',
  COLLAPSE_DURATION_MS: 800,
} as const;
