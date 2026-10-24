import { useEffect, useRef } from 'react';
import { sound } from '../game/audio';

interface KeypadProps {
  activeStage: 0 | 1 | 2;
  stageValues: [string, string, string];
  solvedStages: [boolean, boolean, boolean];
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  isShaking?: boolean;
}

export function Keypad({
  activeStage,
  stageValues,
  solvedStages,
  onDigit,
  onBackspace,
  isShaking = false,
}: KeypadProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Keyboard support (0-9 and Backspace)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        sound.playClick(1.0 + parseInt(e.key, 10) * 0.05);
        onDigit(e.key);
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        sound.playClick(0.7);
        onBackspace();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onDigit, onBackspace]);

  const handleButtonClick = (digit: string) => {
    sound.playClick(1.0 + parseInt(digit, 10) * 0.05);
    onDigit(digit);
  };

  const handleBackButtonClick = () => {
    sound.playClick(0.7);
    onBackspace();
  };

  return (
    <div
      ref={containerRef}
      className={`keypad-wrapper ${isShaking ? 'shake-active' : ''}`}
      tabIndex={0}
      style={{ outline: 'none' }}
    >
      {/* 3 Paired Carriage Code Slots */}
      <div className="carriage-code-slots">
        {[0, 1, 2].map((idx) => {
          const val = stageValues[idx] || '';
          const isSolved = solvedStages[idx];
          const isActive = activeStage === idx && !isSolved;
          const d1 = val[0] || (isSolved ? '✓' : '_');
          const d2 = val[1] || (isSolved ? '✓' : '_');

          return (
            <div
              key={idx}
              className={`carriage-slot-box ${
                isSolved ? 'solved' : isActive ? 'active' : 'locked'
              }`}
            >
              <div className="slot-car-label">CAR {idx + 1}</div>
              <div className="slot-digit-pair">
                <span className={`slot-digit ${val[0] ? 'filled' : 'empty'}`}>
                  {d1}
                </span>
                <span className={`slot-digit ${val[1] ? 'filled' : 'empty'}`}>
                  {d2}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Retro 10-Key Pad */}
      <div className="keypad-grid">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <button
            key={n}
            type="button"
            className="keypad-key-btn"
            onClick={() => handleButtonClick(String(n))}
          >
            {n}
          </button>
        ))}
        <button
          type="button"
          className="keypad-key-btn zero-btn"
          onClick={() => handleButtonClick('0')}
        >
          0
        </button>
        <button
          type="button"
          className="keypad-key-btn del-btn"
          onClick={handleBackButtonClick}
          title="Backspace"
        >
          ⌫ DEL
        </button>
      </div>
    </div>
  );
}
