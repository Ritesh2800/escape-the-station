import { useReducer, useCallback } from 'react';

// Types from Section 10
export type Era = 'past' | 'present' | 'future';
export type TrainPhase = 'ARRIVING' | 'DOCKED' | 'DEPARTING' | 'EMPTY';
export type Level = 1 | 2;
export type UiMode = 'COLLAPSED' | 'EXPANDING' | 'EXPANDED' | 'COLLAPSING';

export interface GameState {
  uiMode: UiMode;
  level: Level;
  era: Era;
  trainPhase: TrainPhase;
  phaseTimeLeft: number;
  input: string;
  ruleResults: Record<string, boolean>;
  openPopupId: string | null;
  solved: boolean;
  /** The bounding rect of the password input when it was clicked */
  inputRect: DOMRect | null;
}

type GameAction =
  | { type: 'START_EXPAND'; inputRect: DOMRect }
  | { type: 'FINISH_EXPAND' }
  | { type: 'START_COLLAPSE' }
  | { type: 'FINISH_COLLAPSE' }
  | { type: 'SOLVE' }
  | { type: 'RESET' }
  | { type: 'SET_INPUT'; value: string }
  | { type: 'SET_ERA'; era: Era }
  | { type: 'SET_TRAIN_PHASE'; phase: TrainPhase; timeLeft: number };

const initialState: GameState = {
  uiMode: 'COLLAPSED',
  level: 1,
  era: 'present',
  trainPhase: 'EMPTY',
  phaseTimeLeft: 0,
  input: '',
  ruleResults: {},
  openPopupId: null,
  solved: false,
  inputRect: null,
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_EXPAND':
      return { ...state, uiMode: 'EXPANDING', inputRect: action.inputRect };
    case 'FINISH_EXPAND':
      return { ...state, uiMode: 'EXPANDED' };
    case 'START_COLLAPSE':
      return { ...state, uiMode: 'COLLAPSING' };
    case 'FINISH_COLLAPSE':
      return { ...state, uiMode: 'COLLAPSED' };
    case 'SOLVE':
      return { ...state, solved: true };
    case 'RESET':
      return { ...initialState };
    case 'SET_INPUT':
      return { ...state, input: action.value };
    case 'SET_ERA':
      return { ...state, era: action.era };
    case 'SET_TRAIN_PHASE':
      return { ...state, trainPhase: action.phase, phaseTimeLeft: action.timeLeft };
    default:
      return state;
  }
}

export function useGameState() {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const startExpand = useCallback((inputRect: DOMRect) => {
    dispatch({ type: 'START_EXPAND', inputRect });
  }, []);

  const finishExpand = useCallback(() => {
    dispatch({ type: 'FINISH_EXPAND' });
  }, []);

  const startCollapse = useCallback(() => {
    dispatch({ type: 'START_COLLAPSE' });
  }, []);

  const finishCollapse = useCallback(() => {
    dispatch({ type: 'FINISH_COLLAPSE' });
  }, []);

  const solve = useCallback(() => {
    dispatch({ type: 'SOLVE' });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  return {
    state,
    dispatch,
    startExpand,
    finishExpand,
    startCollapse,
    finishCollapse,
    solve,
    reset,
  };
}
