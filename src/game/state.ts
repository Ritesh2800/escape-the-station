import { useReducer, useCallback } from 'react';
import { GAME_RULES } from './config';

export type Era = 'past' | 'present' | 'future';
export type TrainPhase = 'DOCKED' | 'DEPARTING' | 'EMPTY';
export type UiMode = 'COLLAPSED' | 'EXPANDING' | 'EXPANDED' | 'COLLAPSING';

const ERAS: Era[] = ['past', 'present', 'future'];

export function getRandomEra(): Era {
  return ERAS[Math.floor(Math.random() * ERAS.length)];
}

export interface GameState {
  uiMode: UiMode;
  era: Era;
  trainPhase: TrainPhase;
  timeLeft: number;
  activeStage: 0 | 1 | 2;
  stageValues: [string, string, string];
  solvedStages: [boolean, boolean, boolean];
  solved: boolean;
  isExpired: boolean;
  inputRect: DOMRect | null;
}

type GameAction =
  | { type: 'START_EXPAND'; inputRect: DOMRect; era?: Era }
  | { type: 'FINISH_EXPAND' }
  | { type: 'START_COLLAPSE' }
  | { type: 'FINISH_COLLAPSE' }
  | { type: 'SET_TIME_LEFT'; timeLeft: number }
  | { type: 'SET_STAGE_INPUT'; stage: 0 | 1 | 2; value: string }
  | { type: 'STAGE_PASSED'; stage: 0 | 1 | 2 }
  | { type: 'STAGE_FAILED'; stage: 0 | 1 | 2 }
  | { type: 'GAME_TIMEOUT' }
  | { type: 'SOLVE' }
  | { type: 'RESET' };

const initialState: GameState = {
  uiMode: 'COLLAPSED',
  era: 'present',
  trainPhase: 'DOCKED',
  timeLeft: GAME_RULES.TOTAL_TIME_SEC,
  activeStage: 0,
  stageValues: ['', '', ''],
  solvedStages: [false, false, false],
  solved: false,
  isExpired: false,
  inputRect: null,
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_EXPAND': {
      // Pick random era if not provided
      const chosenEra = action.era || getRandomEra();
      return {
        ...initialState,
        uiMode: 'EXPANDING',
        inputRect: action.inputRect,
        era: chosenEra,
        trainPhase: 'DOCKED',
        timeLeft: GAME_RULES.TOTAL_TIME_SEC,
        isExpired: false,
      };
    }
    case 'FINISH_EXPAND':
      return { ...state, uiMode: 'EXPANDED' };
    case 'START_COLLAPSE':
      return { ...state, uiMode: 'COLLAPSING' };
    case 'FINISH_COLLAPSE':
      return { ...state, uiMode: 'COLLAPSED' };
    case 'SET_TIME_LEFT':
      return { ...state, timeLeft: action.timeLeft };
    case 'SET_STAGE_INPUT': {
      const nextValues = [...state.stageValues] as [string, string, string];
      nextValues[action.stage] = action.value;
      return { ...state, stageValues: nextValues };
    }
    case 'STAGE_PASSED': {
      const nextSolved = [...state.solvedStages] as [boolean, boolean, boolean];
      nextSolved[action.stage] = true;
      const nextStage = (Math.min(2, action.stage + 1)) as 0 | 1 | 2;
      return {
        ...state,
        solvedStages: nextSolved,
        activeStage: nextStage,
      };
    }
    case 'STAGE_FAILED': {
      const nextValues = [...state.stageValues] as [string, string, string];
      nextValues[action.stage] = '';
      return { ...state, stageValues: nextValues };
    }
    case 'GAME_TIMEOUT':
      return {
        ...state,
        isExpired: true,
        trainPhase: 'DEPARTING',
        timeLeft: 0,
      };
    case 'SOLVE':
      return {
        ...state,
        solved: true,
        trainPhase: 'DOCKED',
        solvedStages: [true, true, true],
      };
    case 'RESET':
      return {
        ...initialState,
        era: getRandomEra(),
      };
    default:
      return state;
  }
}

export function useGameState() {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const startExpand = useCallback((inputRect: DOMRect, customEra?: Era) => {
    dispatch({ type: 'START_EXPAND', inputRect, era: customEra });
  }, []);
  const finishExpand = useCallback(() => dispatch({ type: 'FINISH_EXPAND' }), []);
  const startCollapse = useCallback(() => dispatch({ type: 'START_COLLAPSE' }), []);
  const finishCollapse = useCallback(() => dispatch({ type: 'FINISH_COLLAPSE' }), []);
  const solve = useCallback(() => dispatch({ type: 'SOLVE' }), []);
  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  return { state, dispatch, startExpand, finishExpand, startCollapse, finishCollapse, solve, reset };
}
