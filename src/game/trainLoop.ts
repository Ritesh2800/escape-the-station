import { useRef, useCallback, useEffect } from 'react';
import { TRAIN } from './config';
import type { TrainPhase } from './state';

/**
 * Train loop hook (Section 5)
 * ARRIVING(3s) → DOCKED(45s) → DEPARTING(15s) → EMPTY(5s) → repeat
 */

const PHASE_ORDER: TrainPhase[] = ['ARRIVING', 'DOCKED', 'DEPARTING', 'EMPTY'];
const PHASE_DURATION: Record<TrainPhase, number> = {
  ARRIVING: TRAIN.ARRIVE_MS,
  DOCKED: TRAIN.DOCKED_MS,
  DEPARTING: TRAIN.DEPART_MS,
  EMPTY: TRAIN.EMPTY_MS,
};

export function useTrainLoop(
  active: boolean,
  onPhaseChange: (phase: TrainPhase, timeLeft: number) => void
) {
  const phaseRef = useRef<TrainPhase>('EMPTY');
  const phaseStartRef = useRef(0);
  const rafRef = useRef(0);
  const frozenRef = useRef(false);

  const freeze = useCallback(() => {
    frozenRef.current = true;
  }, []);

  const tick = useCallback(() => {
    if (frozenRef.current) return;
    
    const now = performance.now();
    const elapsed = now - phaseStartRef.current;
    const duration = PHASE_DURATION[phaseRef.current];
    const timeLeft = Math.max(0, duration - elapsed);

    onPhaseChange(phaseRef.current, timeLeft);

    if (elapsed >= duration) {
      const idx = PHASE_ORDER.indexOf(phaseRef.current);
      phaseRef.current = PHASE_ORDER[(idx + 1) % PHASE_ORDER.length];
      phaseStartRef.current = now;
    }

    rafRef.current = requestAnimationFrame(tick);
  }, [onPhaseChange]);

  useEffect(() => {
    if (!active) {
      cancelAnimationFrame(rafRef.current);
      return;
    }

    frozenRef.current = false;
    phaseRef.current = 'ARRIVING';
    phaseStartRef.current = performance.now();
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [active, tick]);

  return { freeze };
}
