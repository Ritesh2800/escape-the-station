import type { GameId, GameDefinition, Era } from '../game/types';
import { pinDecoderGame } from './pinDecoder';
import { impostorCarriageGame } from './impostorCarriage';
import { sortTrainGame } from './sortTrain';
import { spotRobotsGame } from './spotRobots';
import { lockpickDialGame } from './lockpickDial';
import { getUrlParams } from '../game/rng';

export const ALL_GAMES: GameDefinition[] = [
  pinDecoderGame,
  impostorCarriageGame,
  sortTrainGame,
  spotRobotsGame,
  lockpickDialGame,
];

export const GAME_MAP: Record<GameId, GameDefinition> = {
  pin: pinDecoderGame,
  impostor: impostorCarriageGame,
  sort: sortTrainGame,
  robots: spotRobotsGame,
  lockpick: lockpickDialGame,
};

let lastRandomGameId: GameId | null = null;

export function selectNextGame(
  requestedGameId: GameId | 'random',
  rng: () => number
): GameDefinition {
  if (requestedGameId !== 'random' && GAME_MAP[requestedGameId]) {
    return GAME_MAP[requestedGameId];
  }

  // Random mode: avoid same game twice in a row
  const candidates = ALL_GAMES.filter((g) => g.id !== lastRandomGameId);
  const picked = candidates[Math.floor(rng() * candidates.length)] || ALL_GAMES[0];
  lastRandomGameId = picked.id;
  return picked;
}

export function getInitialEra(rng: () => number): Era {
  const params = getUrlParams();
  if (params.era === 'past' || params.era === 'present' || params.era === 'future') {
    return params.era;
  }
  const eras: Era[] = ['past', 'present', 'future'];
  return eras[Math.floor(rng() * eras.length)];
}
