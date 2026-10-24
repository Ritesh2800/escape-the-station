import type { Era } from './state';

export interface ClueDefinition {
  id: string;
  era: Era;
  label: string;
  text: string;
  x: number;
  y: number;
  requiresDocked: boolean;
}

export interface CarriageClue {
  carriageNum: 1 | 2 | 3;
  target: string;
  badge: string;
  title: string;
  hint: string;
  explanation: string;
}

export const ERA_CARRIAGE_CLUES: Record<Era, CarriageClue[]> = {
  past: [
    {
      carriageNum: 1,
      target: '07',
      badge: 'CAR 1 · PLATFORM',
      title: 'PLATFORM 07',
      hint: 'Steam Line: Track 07',
      explanation: 'Locomotive docked at Platform 07',
    },
    {
      carriageNum: 2,
      target: '25',
      badge: 'CAR 2 · RULEBOOK',
      title: '(PLATFORM × 3) + 4',
      hint: 'Speed Regulation: (7 × 3) + 4',
      explanation: 'Take Platform 7, multiply by 3, add 4 = 25',
    },
    {
      carriageNum: 3,
      target: '16',
      badge: 'CAR 3 · COAL TONNAGE',
      title: '(12 / 2) + 10',
      hint: 'Coal Weight: (12 / 2) + 10',
      explanation: '12 divided by 2 plus 10 = 16',
    },
  ],
  present: [
    {
      carriageNum: 1,
      target: '07',
      badge: 'CAR 1 · PLATFORM',
      title: 'PLATFORM 07',
      hint: 'Route Info: EXP-07 Line',
      explanation: 'Shinkansen docked at Platform 07',
    },
    {
      carriageNum: 2,
      target: '25',
      badge: 'CAR 2 · TIMETABLE',
      title: '(PLATFORM × 3) + 4',
      hint: 'Schedule Rule: (7 × 3) + 4',
      explanation: 'Take Platform 7, multiply by 3, add 4 = 25',
    },
    {
      carriageNum: 3,
      target: '16',
      badge: 'CAR 3 · BAGGAGE MANIFEST',
      title: '(12 / 2) + 10',
      hint: 'Cargo Weight: (12 / 2) + 10',
      explanation: '12 divided by 2 plus 10 = 16',
    },
  ],
  future: [
    {
      carriageNum: 1,
      target: '07',
      badge: 'MAG-1 · DOCK NODE',
      title: 'DOCK PORT 07',
      hint: 'Quantum Node: Sector 07',
      explanation: 'Maglev locked at Docking Port 07',
    },
    {
      carriageNum: 2,
      target: '25',
      badge: 'MAG-2 · FLUX MATRIX',
      title: '(PORT × 3) + 4',
      hint: 'Warp Formula: (7 × 3) + 4',
      explanation: 'Take Port 7, multiply by 3, add 4 = 25',
    },
    {
      carriageNum: 3,
      target: '16',
      badge: 'MAG-3 · PLASMA CORE',
      title: '(12 / 2) + 10',
      hint: 'Core Power: (12 / 2) + 10',
      explanation: '12 divided by 2 plus 10 = 16',
    },
  ],
};

export function getCarriageCluesForEra(era: Era): CarriageClue[] {
  return ERA_CARRIAGE_CLUES[era] || ERA_CARRIAGE_CLUES.present;
}
