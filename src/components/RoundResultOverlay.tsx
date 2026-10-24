import { useEffect, useState } from 'react';
import type { RoundPhase } from '../game/types';

interface RoundResultOverlayProps {
  phase: RoundPhase;
  failReason: string;
  durationSeconds: number;
  onTryAgain: () => void;
  onNextGame: () => void;
  onClose: () => void;
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
  const [confetti, setConfetti] = useState<Array<{ id: number; x: number; color: string; delay: number }>>([]);

  useEffect(() => {
    if (phase === 'PASS') {
      const pieces = Array.from({ length: 45 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        delay: Math.random() * 0.4,
      }));
      setConfetti(pieces);
    } else {
      setConfetti([]);
    }
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

      <div className="result-card-box">
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
                🔄 Try Again
              </button>
              <button
                type="button"
                className="result-action-btn next-game-btn"
                onClick={onNextGame}
              >
                ⏩ Next Game
              </button>
              <button
                type="button"
                className="result-action-btn close-btn"
                onClick={onClose}
              >
                ✕ Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
