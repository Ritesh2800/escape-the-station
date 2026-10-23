import type { TrainPhase } from '../game/state';

interface HUDProps {
  phase: TrainPhase;
  timeLeft: number;
  level: 1 | 2;
  rulePassCount?: number;
  ruleTotalCount?: number;
}

export function HUD({ phase, timeLeft, level, rulePassCount = 0, ruleTotalCount = 0 }: HUDProps) {
  const seconds = Math.ceil(timeLeft / 1000);

  return (
    <div className="hud-bar">
      <span className="level-indicator">LVL {level}/2</span>
      <span className={`hud-phase ${phase}`}>{phase}</span>
      {phase !== 'EMPTY' && (
        <span className={`hud-countdown ${phase === 'DEPARTING' ? 'departing' : phase === 'DOCKED' ? 'docked' : ''}`}>
          {seconds}s
        </span>
      )}
      {level === 2 && (
        <span className="rule-counter">RULES {rulePassCount}/{ruleTotalCount}</span>
      )}
    </div>
  );
}
