import { useState, useEffect, useRef } from 'react';
import type { Era, GameDefinition } from '../game/types';
import { shuffleArray } from '../game/rng';
import { sound } from '../game/audio';

export interface Passenger {
  id: number;
  isRobot: boolean;
  x: number; // 40 - 1200
  y: number; // 590 - 680
  vx: number;
  vy: number;
  speed: number;
  directionTimer: number;
  pauseTimer: number;
  wobblePhase: number;
  caught: boolean;
  speechText: string | null;
  speechTimer: number;
  hatColor: string;
  shirtColor: string;
  pantsColor: string;
}

export interface SpotRobotsPuzzle {
  robotCount: number;
  passengers: Passenger[];
}

const PALETTES = {
  past: {
    hats: ['#292524', '#78350f', '#44403c', '#1c1917'],
    shirts: ['#7c2d12', '#9a3412', '#78350f', '#854d0e'],
    pants: ['#1c1917', '#292524', '#44403c'],
  },
  present: {
    hats: ['#2563eb', '#dc2626', '#16a34a', '#4b5563'],
    shirts: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'],
    pants: ['#1e293b', '#334155', '#475569'],
  },
  future: {
    hats: ['#06b6d4', '#d946ef', '#3b82f6', '#14b8a6'],
    shirts: ['#0ea5e9', '#ec4899', '#6366f1', '#06b6d4'],
    pants: ['#0f172a', '#1e1b4b', '#172554'],
  },
};

export const spotRobotsGame: GameDefinition<SpotRobotsPuzzle> = {
  id: 'robots',
  title: 'SPOT THE ROBOTS',
  shortName: 'Spot Robots',
  defaultLives: 3,
  usesTrain: false,
  stationBoardText: () => 'NEXT TRAIN: DELAYED · SECURITY ALERT',
  goal: (p) => `Find all ${p.robotCount} disguised robots! Robots never stop or wobble.`,

  generate: (rng: () => number, era: Era): SpotRobotsPuzzle => {
    const total = 11;
    const robotCount = 3;
    const palette = PALETTES[era] || PALETTES.present;

    const passengers: Passenger[] = [];
    for (let i = 0; i < total; i++) {
      const isRobot = i < robotCount;
      const x = 80 + (i * 95) % 1000 + (rng() * 40 - 20);
      const y = 595 + (i * 25) % 80;

      passengers.push({
        id: i,
        isRobot,
        x,
        y,
        vx: isRobot ? 40 : 25,
        vy: 0,
        speed: isRobot ? 40 : 25,
        directionTimer: 0,
        pauseTimer: 0,
        wobblePhase: rng() * Math.PI * 2,
        caught: false,
        speechText: null,
        speechTimer: 0,
        hatColor: palette.hats[Math.floor(rng() * palette.hats.length)],
        shirtColor: palette.shirts[Math.floor(rng() * palette.shirts.length)],
        pantsColor: palette.pants[Math.floor(rng() * palette.pants.length)],
      });
    }

    return {
      robotCount,
      passengers: shuffleArray(rng, passengers),
    };
  },

  isSolvable: (p: SpotRobotsPuzzle) => p.robotCount > 0,

  Component: function SpotRobotsComponent({ puzzle, phase, api, timeLeft }) {
    const [passengers, setPassengers] = useState<Passenger[]>(puzzle.passengers);
    const [caughtCount, setCaughtCount] = useState(0);
    const lockoutRef = useRef(false);
    const animRef = useRef<number>(0);

    const robotsRemaining = puzzle.robotCount - caughtCount;

    // 15s Hint: brighter eye glow
    const isHintActive = timeLeft <= 15 && timeLeft > 13;

    // Animation Loop: movement update
    useEffect(() => {
      if (phase !== 'PLAYING') return;

      let lastTime = performance.now();

      const loop = (nowTime: number) => {
        const dt = Math.min((nowTime - lastTime) / 1000, 0.1);
        lastTime = nowTime;

        setPassengers((prev) =>
          prev.map((p) => {
            if (p.caught) return p;

            let nextX = p.x;
            let nextY = p.y;
            let nextVx = p.vx;
            let nextVy = p.vy;
            let nextSpeed = p.speed;
            let nextDirTimer = p.directionTimer + dt;
            let nextPauseTimer = p.pauseTimer - dt;
            let nextSpeechTimer = p.speechTimer - dt;
            let nextSpeech = nextSpeechTimer > 0 ? p.speechText : null;

            if (p.isRobot) {
              // Robot movement: constant 40 px/s, strict 90 degree turns
              if (nextDirTimer > 2.0) {
                nextDirTimer = 0;
                // Switch axis: if moving horizontal, go vertical
                if (Math.abs(nextVx) > 0) {
                  nextVx = 0;
                  nextVy = Math.random() < 0.5 ? 40 : -40;
                } else {
                  nextVy = 0;
                  nextVx = Math.random() < 0.5 ? 40 : -40;
                }
              }

              nextX += nextVx * dt;
              nextY += nextVy * dt;

              // Boundary bounces
              if (nextX < 60) { nextX = 60; nextVx = 40; nextVy = 0; }
              if (nextX > 1180) { nextX = 1180; nextVx = -40; nextVy = 0; }
              if (nextY < 590) { nextY = 590; nextVy = 40; nextVx = 0; }
              if (nextY > 675) { nextY = 675; nextVy = -40; nextVx = 0; }
            } else {
              // Human movement: organic, variable speeds, frequent pauses
              if (nextPauseTimer > 0) {
                // Pausing
              } else {
                if (nextDirTimer > 2.5) {
                  nextDirTimer = 0;
                  // 50% chance to pause
                  if (Math.random() < 0.5) {
                    nextPauseTimer = 1.0;
                  } else {
                    nextSpeed = 20 + Math.random() * 25;
                    const angle = Math.random() * Math.PI * 2;
                    nextVx = Math.cos(angle) * nextSpeed;
                    nextVy = Math.sin(angle) * (nextSpeed * 0.4); // flatter platform y
                  }
                }

                nextX += nextVx * dt;
                nextY += nextVy * dt;

                // Soft boundaries
                if (nextX < 60) { nextX = 60; nextVx = Math.abs(nextVx); }
                if (nextX > 1180) { nextX = 1180; nextVx = -Math.abs(nextVx); }
                if (nextY < 590) { nextY = 590; nextVy = Math.abs(nextVy); }
                if (nextY > 675) { nextY = 675; nextVy = -Math.abs(nextVy); }
              }
            }

            return {
              ...p,
              x: nextX,
              y: nextY,
              vx: nextVx,
              vy: nextVy,
              speed: nextSpeed,
              directionTimer: nextDirTimer,
              pauseTimer: nextPauseTimer,
              wobblePhase: p.wobblePhase + dt * 4,
              speechText: nextSpeech,
              speechTimer: Math.max(0, nextSpeechTimer),
            };
          })
        );

        animRef.current = requestAnimationFrame(loop);
      };

      animRef.current = requestAnimationFrame(loop);
      return () => cancelAnimationFrame(animRef.current);
    }, [phase]);

    const handlePassengerClick = (p: Passenger) => {
      if (phase !== 'PLAYING' || p.caught || lockoutRef.current) return;

      if (p.isRobot) {
        sound.playRulePass();
        setPassengers((prev) =>
          prev.map((item) => (item.id === p.id ? { ...item, caught: true } : item))
        );

        const nextCaught = caughtCount + 1;
        setCaughtCount(nextCaught);

        if (nextCaught >= puzzle.robotCount) {
          sound.playVictoryFanfare();
          api.pass();
        }
      } else {
        // Tapped a human
        sound.playError();
        api.triggerShake();
        lockoutRef.current = true;
        setTimeout(() => (lockoutRef.current = false), 500);

        setPassengers((prev) =>
          prev.map((item) =>
            item.id === p.id
              ? { ...item, speechText: 'Hey! Im human!', speechTimer: 1.2 }
              : item
          )
        );

        const livesLeft = api.loseLife();
        if (livesLeft <= 0) {
          api.fail('Tapped too many innocent humans!');
        }
      }
    };

    return (
      <div className="spot-robots-game-layer">
        {/* Robots Left Counter HUD */}
        <div className="robots-counter-badge">
          ROBOTS REMAINING: {robotsRemaining} / {puzzle.robotCount}
        </div>

        {/* Passengers on the Platform floor */}
        {passengers.map((p) => {
          const wobble = !p.isRobot && p.pauseTimer <= 0 ? Math.sin(p.wobblePhase) * 2 : 0;
          const isFacingLeft = p.vx < 0;

          // Scaled coordinates relative to 1280x720 space
          const leftPercent = (p.x / 1280) * 100;
          const topPercent = ((p.y + wobble) / 720) * 100;

          return (
            <div
              key={p.id}
              className={`passenger-sprite-hitbox ${p.caught ? 'robot-caught' : ''}`}
              onClick={() => handlePassengerClick(p)}
              style={{
                position: 'absolute',
                left: `${leftPercent}%`,
                top: `${topPercent}%`,
                transform: `translate(-50%, -100%) ${isFacingLeft ? 'scaleX(-1)' : 'scaleX(1)'}`,
                cursor: p.caught ? 'default' : 'pointer',
                zIndex: Math.round(p.y),
              }}
            >
              {/* Speech bubble */}
              {p.speechText && (
                <div className="passenger-speech-bubble">
                  {p.speechText}
                </div>
              )}

              {/* Bot Caught Stamp */}
              {p.caught && (
                <div className="bot-caught-stamp">
                  BOT ✓
                </div>
              )}

              {/* Pixel Person Character Sprite */}
              <div className="pixel-character">
                {/* Hat */}
                <div
                  className="char-hat"
                  style={{ backgroundColor: p.hatColor }}
                />

                {/* Head with Eye */}
                <div className="char-head">
                  {/* Robot Cyan Eye */}
                  {p.isRobot && (
                    <div
                      className={`robot-eye-pixel ${isHintActive ? 'hint-bright' : ''}`}
                    />
                  )}
                </div>

                {/* Shirt Body */}
                <div
                  className="char-body"
                  style={{ backgroundColor: p.shirtColor }}
                />

                {/* Legs */}
                <div
                  className="char-legs"
                  style={{ backgroundColor: p.pantsColor }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  },
};
