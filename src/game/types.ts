import type { ReactNode } from 'react';

export type Era = 'past' | 'present' | 'future';

export type GameId = 'pin' | 'impostor' | 'sort' | 'robots' | 'lockpick';

export type RoundPhase = 'IDLE' | 'INTRO' | 'PLAYING' | 'PASS' | 'FAIL';

export interface GameApi {
  pass: () => void;
  fail: (reason: string) => void;
  loseLife: () => number;
  setStatus: (text: string) => void;
  now: () => number;
  timeLeft: () => number;
  triggerShake: () => void;
}

export interface GameDefinition<P = any> {
  id: GameId;
  title: string;
  shortName: string;
  defaultLives: number | null;
  usesTrain: boolean;
  stationBoardText?: (p: P) => string | null;
  goal: (p: P) => string;
  generate: (rng: () => number, era: Era) => P;
  isSolvable: (p: P) => boolean;
  Component: (props: {
    puzzle: P;
    era: Era;
    phase: RoundPhase;
    api: GameApi;
    timeLeft: number;
    lives: number | null;
  }) => ReactNode;
}
