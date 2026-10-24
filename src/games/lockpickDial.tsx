import { useState, useEffect, useRef } from 'react';
import type { Era, GameDefinition } from '../game/types';
import { randomInt } from '../game/rng';
import { sound } from '../game/audio';

export interface LockPickPuzzle {
  pinStages: Array<{
    arcWidth: number;
    speed: number;
    targetAngle: number;
    direction: 1 | -1;
  }>;
}

export const lockpickDialGame: GameDefinition<LockPickPuzzle> = {
  id: 'lockpick',
  title: 'LOCK-PICK DIAL',
  shortName: 'Lock-Pick',
  defaultLives: 3,
  usesTrain: false,
  stationBoardText: () => 'STATION LOCKER 07 · EMERGENCY BYPASS',
  goal: () => 'Pick all 3 pins! Tap or press Space when the needle hits the green arc.',

  generate: (rng: () => number, _era: Era): LockPickPuzzle => {
    return {
      pinStages: [
        {
          arcWidth: 60,
          speed: 130,
          targetAngle: randomInt(rng, 30, 330),
          direction: rng() < 0.5 ? 1 : -1,
        },
        {
          arcWidth: 44,
          speed: 170,
          targetAngle: randomInt(rng, 30, 330),
          direction: rng() < 0.5 ? 1 : -1,
        },
        {
          arcWidth: 30,
          speed: 210,
          targetAngle: randomInt(rng, 30, 330),
          direction: rng() < 0.5 ? 1 : -1,
        },
      ],
    };
  },

  isSolvable: (p: LockPickPuzzle) => p.pinStages.length === 3,

  Component: function LockPickComponent({ puzzle, era, phase, api }) {
    const [currentPin, setCurrentPin] = useState(0); // 0, 1, 2
    const [needleAngle, setNeedleAngle] = useState(0);
    const [currentArcAngle, setCurrentArcAngle] = useState(puzzle.pinStages[0].targetAngle);
    const [currentDir, setCurrentDir] = useState<1 | -1>(puzzle.pinStages[0].direction);
    const [shake, setShake] = useState(false);
    const [clickEffect, setClickEffect] = useState(false);

    const lockRef = useRef(false);
    const animRef = useRef<number>(0);

    const stageConfig = puzzle.pinStages[currentPin] || puzzle.pinStages[2];

    // Animation Loop: rotate needle
    useEffect(() => {
      if (phase !== 'PLAYING') return;

      let last = performance.now();
      const loop = (nowTime: number) => {
        const dt = (nowTime - last) / 1000;
        last = nowTime;

        setNeedleAngle((prev) => {
          let next = prev + currentDir * stageConfig.speed * dt;
          if (next >= 360) next -= 360;
          if (next < 0) next += 360;
          return next;
        });

        animRef.current = requestAnimationFrame(loop);
      };

      animRef.current = requestAnimationFrame(loop);
      return () => cancelAnimationFrame(animRef.current);
    }, [phase, currentDir, stageConfig.speed]);

    // Space / Enter Keyboard trigger
    useEffect(() => {
      if (phase !== 'PLAYING') return;

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.code === 'Space' || e.key === 'Enter') {
          e.preventDefault();
          attemptPick();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [phase, needleAngle, currentArcAngle, currentPin]);

    const attemptPick = () => {
      if (phase !== 'PLAYING' || lockRef.current) return;
      lockRef.current = true;
      setTimeout(() => (lockRef.current = false), 300);

      // Check if needle angle falls within arc [targetAngle, targetAngle + arcWidth]
      const minA = currentArcAngle;
      const maxA = currentArcAngle + stageConfig.arcWidth;

      let isHit = false;
      if (maxA <= 360) {
        isHit = needleAngle >= minA - 1 && needleAngle <= maxA + 1;
      } else {
        // Wraparound 360
        isHit = needleAngle >= minA - 1 || needleAngle <= (maxA - 360) + 1;
      }

      if (isHit) {
        sound.playRulePass();
        setClickEffect(true);
        setTimeout(() => setClickEffect(false), 200);

        if (currentPin >= 2) {
          // Solved all 3 pins!
          sound.playVictoryFanfare();
          api.pass();
        } else {
          // Advance to next pin
          const nextPin = currentPin + 1;
          setCurrentPin(nextPin);
          setCurrentArcAngle(puzzle.pinStages[nextPin].targetAngle);
          setCurrentDir(puzzle.pinStages[nextPin].direction);
        }
      } else {
        // Miss!
        sound.playError();
        api.triggerShake();
        setShake(true);
        setTimeout(() => setShake(false), 300);

        // Move arc to new angle on miss to prevent spamming
        setCurrentArcAngle(Math.floor(Math.random() * 300) + 30);

        const livesLeft = api.loseLife();
        if (livesLeft <= 0) {
          api.fail('Locker mechanism jammed after 3 failed picks.');
        }
      }
    };

    return (
      <div className={`lockpick-game-layer era-${era}`}>
        {/* Dim Overlay */}
        <div className="lockpick-backdrop-dim" />

        <div className="lockpick-console">
          {/* 3 Pin Indicators */}
          <div className="lock-pin-indicators">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`lock-pin-light ${i < currentPin ? 'solved-green' : i === currentPin ? 'active-yellow' : 'locked-dim'}`}
              >
                PIN {i + 1}
              </div>
            ))}
          </div>

          {/* 360 Dial */}
          <div
            className={`circular-dial-wrapper ${shake ? 'shake-active' : ''} ${clickEffect ? 'click-pop' : ''}`}
            onClick={attemptPick}
          >
            {/* SVG Arc and Needle */}
            <svg viewBox="0 0 240 240" className="dial-svg">
              {/* Outer dial ring */}
              <circle
                cx="120"
                cy="120"
                r="105"
                fill="none"
                stroke="currentColor"
                strokeWidth="12"
                className="dial-ring"
              />

              {/* Tick marks */}
              {[...Array(12)].map((_, i) => (
                <line
                  key={i}
                  x1="120"
                  y1="18"
                  x2="120"
                  y2="28"
                  stroke="currentColor"
                  strokeWidth="2"
                  transform={`rotate(${i * 30} 120 120)`}
                  opacity="0.6"
                />
              ))}

              {/* Target Green Arc */}
              <circle
                cx="120"
                cy="120"
                r="105"
                fill="none"
                stroke="#22c55e"
                strokeWidth="16"
                strokeDasharray={`${(stageConfig.arcWidth / 360) * (2 * Math.PI * 105)} ${(2 * Math.PI * 105)}`}
                strokeDashoffset={-((currentArcAngle / 360) * (2 * Math.PI * 105))}
                strokeLinecap="round"
                className="dial-target-arc"
              />

              {/* Center Needle */}
              <g transform={`rotate(${needleAngle} 120 120)`}>
                <line
                  x1="120"
                  y1="120"
                  x2="120"
                  y2="22"
                  stroke="#ef4444"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                <circle cx="120" cy="120" r="10" fill="#ef4444" />
              </g>

              {/* Center Pivot */}
              <circle cx="120" cy="120" r="4" fill="#ffffff" />
            </svg>

            {/* Tap Prompt Center */}
            <div className="dial-tap-center-prompt">
              <span>TAP / SPACE</span>
            </div>
          </div>

          <div className="dial-instruction-hint">
            {currentPin === 0 && 'Align needle with the green arc and tap or press Space.'}
            {currentPin === 1 && 'Pin 1 cleared! Speed increasing for Pin 2.'}
            {currentPin === 2 && 'Final Pin! Watch for sudden needle direction shifts.'}
          </div>
        </div>
      </div>
    );
  },
};
