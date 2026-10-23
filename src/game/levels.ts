import type { Era } from './state';

/**
 * Clue definitions for both levels (Sections 6, 7.1, 8)
 * Coordinates as percentages of 1280x720 background
 */

export interface ClueDefinition {
  id: string;
  era: Era;
  level: 1 | 2;
  label: string;
  text: string;
  /** x position as fraction of scene width */
  x: number;
  /** y position as fraction of scene height */
  y: number;
  /** Requires train to be docked? */
  requiresDocked: boolean;
}

// Level 1 clues (Section 6)
export const LEVEL1_CLUES: ClueDefinition[] = [
  {
    id: 'L1_PLATFORM',
    era: 'present',
    level: 1,
    label: 'Platform Signpost',
    text: 'PLATFORM 07',
    x: 1040 / 1280,
    y: 450 / 720,
    requiresDocked: false,
  },
  {
    id: 'L1_RULEBOOK',
    era: 'present',
    level: 1,
    label: 'Rulebook Board',
    text: 'To calculate the middle digits: take the Platform Number, multiply by 3, add 4.',
    x: 400 / 1280,
    y: 400 / 720,
    requiresDocked: false,
  },
  {
    id: 'L1_BOXCAR',
    era: 'present',
    level: 1,
    label: 'Rear Carriage',
    text: 'Stenciled on the side: (12 / 2) + 10',
    x: 900 / 1280,
    y: 490 / 720,
    requiresDocked: true,
  },
];

// Level 2 clues (Section 7.1)
export const LEVEL2_CLUES: ClueDefinition[] = [
  {
    id: 'L2_PAST_PLAQUE',
    era: 'past',
    level: 2,
    label: 'Brass Plaque',
    text: 'Power Symbol Anchor = @',
    x: 168 / 1280,
    y: 280 / 720,
    requiresDocked: false,
  },
  {
    id: 'L2_PAST_ENGINE',
    era: 'past',
    level: 2,
    label: 'Steam Engine Nameplate',
    text: 'Engine Vowel: E',
    x: 500 / 1280,
    y: 500 / 720,
    requiresDocked: true,
  },
  {
    id: 'L2_PRESENT_BOARD',
    era: 'present',
    level: 2,
    label: 'Departure Board',
    text: 'Station Sector Code = S2',
    x: 168 / 1280,
    y: 280 / 720,
    requiresDocked: false,
  },
  {
    id: 'L2_PRESENT_CARRIAGE',
    era: 'present',
    level: 2,
    label: 'Rear Carriage',
    text: 'Split-flap digit: 8  —  "Split Value"',
    x: 900 / 1280,
    y: 490 / 720,
    requiresDocked: true,
  },
  {
    id: 'L2_FUTURE_HOLOGRAM',
    era: 'future',
    level: 2,
    label: 'Hologram Log',
    text: 'Target Digit Sum = sum of Present-era numbers (2 + 8 = 10)',
    x: 168 / 1280,
    y: 250 / 720,
    requiresDocked: false,
  },
  {
    id: 'L2_FUTURE_NOTE',
    era: 'future',
    level: 2,
    label: 'Hologram Note',
    text: 'Signal rule: ! must be followed by the 1890 engine vowel',
    x: 700 / 1280,
    y: 420 / 720,
    requiresDocked: false,
  },
];

export function getCluesForLevel(level: 1 | 2): ClueDefinition[] {
  return level === 1 ? LEVEL1_CLUES : LEVEL2_CLUES;
}

export function getCluesForEra(clues: ClueDefinition[], era: Era): ClueDefinition[] {
  return clues.filter((c) => c.era === era);
}
