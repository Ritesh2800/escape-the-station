import { useMemo } from 'react';
import type { RoundPhase } from '../game/types';

interface RoundResultOverlayProps {
  phase: RoundPhase;
  failReason: string;
  durationSeconds: number;
  onTryAgain?: () => void;
  onNextGame?: () => void;
  onClose?: () => void;
}

const CONFETTI_COLORS = ['#ffd445', '#4ade80', '#3aa0e0', '#ff5de0', '#4ff0ff', '#ffffff'];

export function RoundResultOverlay({
  phase,
  failReason,
  durationSeconds,
  onTryAgain,
  onNextGame,
  onClose,
}: RoundResultOverlayProps) {
  const confetti = useMemo(() => {
    if (phase !== 'PASS') return [];
    return Array.from({ length: 45 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      delay: Math.random() * 0.4,
    }));
  }, [phase]);

  if (phase !== 'PASS' && phase !== 'FAIL') return null;

  return (
    <div className={`round-result-modal-overlay ${phase === 'PASS' ? 'is-pass' : 'is-fail'}`}>
      {/* Confetti Burst on Pass */}
      {phase === 'PASS' && (
        <div className="confetti-container" aria-hidden="true">
          {confetti.map((p) => (
            <div
              key={p.id}
              className="confetti-piece"
              style={{
                left: `${p.x}%`,
                backgroundColor: p.color,
                animationDelay: `${p.delay}s`,
              }}
            />
          ))}
        </div>
      )}

      <div className={`result-card-box ${phase === 'FAIL' ? 'failed' : ''}`}>
        {phase === 'PASS' ? (
          <>
            <div className="result-pass-title">VERIFIED ✓ HUMAN</div>
            <div className="result-pass-sub">
              Station Escaped in {durationSeconds.toFixed(1)}s!
            </div>
            <div className="result-returning-note">
              Returning to portal...
            </div>
          </>
        ) : (
          <>
            <div className="result-fail-title">FAILED ✗</div>
            <div className="result-fail-reason">{failReason || "Time's up!"}</div>
            <div className="result-actions-row">
              <button
                type="button"
                className="result-action-btn try-again-btn"
                onClick={onTryAgain}
              >
                🔄 TRY AGAIN
              </button>
              <button
                type="button"
                className="result-action-btn next-game-btn"
                onClick={onNextGame}
              >
                ▶ NEXT GAME
              </button>
            </div>
            <button
              type="button"
              className="result-close-link"
              onClick={onClose}
            >
              ✕ Close to CAPTCHA
            </button>
          </>
        )}
      </div>
    </div>
  );
}
