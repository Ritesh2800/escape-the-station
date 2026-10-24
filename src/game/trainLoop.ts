import { useRef, useCallback, useEffect } from 'react';
import { GAME_RULES } from './config';

/**
 * 30-Second Countdown & Departure Hook
 * Runs when game is EXPANDED.
 * If 30 seconds elapse, triggers onTimeout.
 */

export function useTrainCountdown(
  active: boolean,
  onTick: (secondsLeft: number) => void,
  onTimeout: () => void
) {
  const startTimeRef = useRef<number>(0);
  const rafRef = useRef<number>(0);
  const frozenRef = useRef<boolean>(false);
  const timedOutRef = useRef<boolean>(false);

  const freeze = useCallback(() => {
    frozenRef.current = true;
    cancelAnimationFrame(rafRef.current);
  }, []);

  const tick = useCallback(() => {
    if (frozenRef.current || timedOutRef.current) return;

    const now = performance.now();
    const elapsedMs = now - startTimeRef.current;
    const totalMs = GAME_RULES.TOTAL_TIME_SEC * 1000;
    const remainingMs = Math.max(0, totalMs - elapsedMs);
    const secondsLeft = Math.ceil(remainingMs / 1000);

    onTick(secondsLeft);

    if (remainingMs <= 0) {
      timedOutRef.current = true;
      onTimeout();
      return;
    }

    rafRef.current = requestAnimationFrame(tick);
  }, [onTick, onTimeout]);

  useEffect(() => {
    if (!active) {
      cancelAnimationFrame(rafRef.current);
      return;
    }

    frozenRef.current = false;
    timedOutRef.current = false;
    startTimeRef.current = performance.now();
    onTick(GAME_RULES.TOTAL_TIME_SEC);

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [active, tick, onTick]);

  return { freeze };
}
