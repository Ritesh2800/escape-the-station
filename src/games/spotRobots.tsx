import { useState, useEffect, useRef } from 'react';
import type { Era, GameDefinition } from '../game/types';
import { shuffleArray } from '../game/rng';
import { sound } from '../game/audio';

export interface Passenger {
  id: number;
  isRobot: boolean;
  x: number; // 70 - 1180
  y: number; // 590 - 675
  vx: number;
  vy: number;
  speed: number;
  directionTimer: number;
  changeInterval: number;
  pauseTimer: number;
  timeSinceLastPause: number;
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

    const ROBOT_DIRS = [
      { vx: 40, vy: 0 },
      { vx: -40, vy: 0 },
      { vx: 0, vy: 35 },
      { vx: 0, vy: -35 },
    ];

    const passengers: Passenger[] = [];
    for (let i = 0; i < total; i++) {
      const isRobot = i < robotCount;
      const x = 90 + ((i * 95) % 980) + (rng() * 40 - 20);
      const y = 595 + ((i * 25) % 75);

      let vx = 0;
      let vy = 0;
      let speed = 40;
      const directionTimer = rng() * 1.8; // staggered initial timers so each changes direction at different moments
      let pauseTimer = 0;
      const changeInterval = 1.6 + rng() * 2.2;
      const timeSinceLastPause = rng() * 1.5;

      if (isRobot) {
        // Robots start moving in one of the 4 cardinal directions
        const d = ROBOT_DIRS[Math.floor(rng() * ROBOT_DIRS.length)];
        vx = d.vx;
        vy = d.vy;
        speed = 40;
        pauseTimer = 0; // robots never pause
      } else {
        // Humans start moving at a random angle and organic speed
        speed = 22 + rng() * 23;
        const angle = rng() * Math.PI * 2;
        vx = Math.cos(angle) * speed;
        vy = Math.sin(angle) * (speed * 0.4);
        // Some humans start paused, others walking
        pauseTimer = rng() < 0.4 ? 0.6 + rng() * 0.8 : 0;
      }

      passengers.push({
        id: i,
        isRobot,
        x,
        y,
        vx,
        vy,
        speed,
        directionTimer,
        changeInterval,
        pauseTimer,
        timeSinceLastPause,
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
    const [caughtCount, setCaughtCount] = useState(0);
    const passengersRef = useRef<Passenger[]>([]);
    const domRefs = useRef<Record<number, HTMLDivElement | null>>({});
    const speechRefs = useRef<Record<number, HTMLDivElement | null>>({});
    const stampRefs = useRef<Record<number, HTMLDivElement | null>>({});
    const lockoutRef = useRef(false);
    const animRef = useRef<number>(0);
    const currentPuzzleRef = useRef<any>(null);

    // Initialize or reset ONLY when puzzle genuinely changes (never on 1s timer ticks!)
    useEffect(() => {
      if (currentPuzzleRef.current === puzzle) return;
      currentPuzzleRef.current = puzzle;

      passengersRef.current = puzzle.passengers.map((p) => ({
        ...p,
        caught: false,
        speechTimer: 0,
      }));
      setCaughtCount(0);
      lockoutRef.current = false;
      api.setStatus(`${puzzle.robotCount} robots disguised on platform`);

      // Reset DOM elements directly so new round displays cleanly
      puzzle.passengers.forEach((p) => {
        const el = domRefs.current[p.id];
        if (el) {
          el.classList.remove('robot-caught');
          el.style.left = `${(p.x / 1280) * 100}%`;
          el.style.top = `${(p.y / 720) * 100}%`;
          el.style.transform = `translate(-50%, -100%) ${p.vx < 0 ? 'scaleX(-1)' : 'scaleX(1)'}`;
          el.style.zIndex = String(Math.round(p.y));
        }
        const stEl = stampRefs.current[p.id];
        if (stEl) stEl.style.display = 'none';
        const spEl = speechRefs.current[p.id];
        if (spEl) spEl.style.display = 'none';
      });
    }, [puzzle, api]);

    const robotsRemaining = puzzle.robotCount - caughtCount;
    const isHintActive = timeLeft <= 15 && timeLeft > 13;

    // High performance continuous physics loop with zero React re-render overhead
    useEffect(() => {
      if (phase !== 'PLAYING') return;

      let lastTime = performance.now();

      const loop = (nowTime: number) => {
        const dt = Math.min((nowTime - lastTime) / 1000, 0.05);
        lastTime = nowTime;

        passengersRef.current.forEach((p) => {
          if (p.caught) return;

          let nextX = p.x;
          let nextY = p.y;
          let nextVx = p.vx;
          let nextVy = p.vy;
          let nextSpeed = p.speed;
          let nextDirTimer = p.directionTimer + dt;
          let nextPauseTimer = p.pauseTimer - dt;
          let nextSpeechTimer = p.speechTimer - dt;
          let nextTimeSincePause = p.timeSinceLastPause + dt;

          if (p.isRobot) {
            // Strict robot movement: constant speed 40 px/s, strict 90 degree turns every 2.0s
            if (nextDirTimer > 2.0) {
              nextDirTimer = 0;
              if (Math.abs(nextVx) > 0) {
                nextVx = 0;
                nextVy = Math.random() < 0.5 ? 35 : -35;
              } else {
                nextVy = 0;
                nextVx = Math.random() < 0.5 ? 40 : -40;
              }
            }

            nextX += nextVx * dt;
            nextY += nextVy * dt;

            // Boundaries: bounce strictly along perpendicular or reverse
            if (nextX < 70) { nextX = 70; nextVx = 40; nextVy = 0; }
            if (nextX > 1180) { nextX = 1180; nextVx = -40; nextVy = 0; }
            if (nextY < 590) { nextY = 590; nextVy = 35; nextVx = 0; }
            if (nextY > 675) { nextY = 675; nextVy = -35; nextVx = 0; }
          } else {
            // Organic human movement: variable speed, random angles, frequent pauses
            if (p.pauseTimer > 0 && nextPauseTimer <= 0) {
              // Just woke up from pause! Pick a fresh direction and speed
              nextSpeed = 22 + Math.random() * 23;
              const angle = Math.random() * Math.PI * 2;
              nextVx = Math.cos(angle) * nextSpeed;
              nextVy = Math.sin(angle) * (nextSpeed * 0.4);
              nextDirTimer = 0;
              p.changeInterval = 1.6 + Math.random() * 2.2;
              nextTimeSincePause = 0;
            } else if (nextPauseTimer <= 0) {
              // Walking: check if direction change or forced pause needed
              const mustPause = nextTimeSincePause >= 2.8;

              if (nextDirTimer > p.changeInterval || mustPause) {
                nextDirTimer = 0;
                p.changeInterval = 1.6 + Math.random() * 2.2;

                // 50% chance to pause (or 100% if mustPause per spec)
                if (Math.random() < 0.5 || mustPause) {
                  nextPauseTimer = 0.6 + Math.random() * 0.9;
                  nextTimeSincePause = 0;
                } else {
                  nextSpeed = 22 + Math.random() * 23;
                  const angle = Math.random() * Math.PI * 2;
                  nextVx = Math.cos(angle) * nextSpeed;
                  nextVy = Math.sin(angle) * (nextSpeed * 0.4);
                }
              }

              nextX += nextVx * dt;
              nextY += nextVy * dt;

              // Soft bounce towards center
              if (nextX < 70) { nextX = 70; nextVx = Math.abs(nextVx) || 24; }
              if (nextX > 1180) { nextX = 1180; nextVx = -Math.abs(nextVx) || -24; }
              if (nextY < 590) { nextY = 590; nextVy = Math.abs(nextVy) || 12; }
              if (nextY > 675) { nextY = 675; nextVy = -Math.abs(nextVy) || -12; }
            }
          }

          p.x = nextX;
          p.y = nextY;
          p.vx = nextVx;
          p.vy = nextVy;
          p.speed = nextSpeed;
          p.directionTimer = nextDirTimer;
          p.pauseTimer = nextPauseTimer;
          p.timeSinceLastPause = nextTimeSincePause;
          p.wobblePhase += dt * 4;
          p.speechTimer = Math.max(0, nextSpeechTimer);

          // Direct DOM style update (0ms garbage collection)
          const el = domRefs.current[p.id];
          if (el) {
            const wobble = !p.isRobot && p.pauseTimer <= 0 ? Math.sin(p.wobblePhase) * 2 : 0;
            const isFacingLeft = p.vx < 0;
            const leftPct = (p.x / 1280) * 100;
            const topPct = ((p.y + wobble) / 720) * 100;
            el.style.left = `${leftPct}%`;
            el.style.top = `${topPct}%`;
            el.style.transform = `translate(-50%, -100%) ${isFacingLeft ? 'scaleX(-1)' : 'scaleX(1)'}`;
            el.style.zIndex = String(Math.round(p.y));
          }

          const spEl = speechRefs.current[p.id];
          if (spEl) {
            spEl.style.display = p.speechTimer > 0 ? 'block' : 'none';
          }
        });

        animRef.current = requestAnimationFrame(loop);
      };

      animRef.current = requestAnimationFrame(loop);
      return () => cancelAnimationFrame(animRef.current);
    }, [phase]);

    const handlePassengerClick = (pId: number) => {
      if (phase !== 'PLAYING' || lockoutRef.current) return;

      const p = passengersRef.current.find((item) => item.id === pId);
      if (!p || p.caught) return;

      if (p.isRobot) {
        p.caught = true;
        sound.playRulePass();

        // Mark DOM caught
        const el = domRefs.current[pId];
        if (el) el.classList.add('robot-caught');
        const stEl = stampRefs.current[pId];
        if (stEl) stEl.style.display = 'block';

        const nextCaught = caughtCount + 1;
        setCaughtCount(nextCaught);
        api.setStatus(`${puzzle.robotCount - nextCaught} robots remaining`);

        if (nextCaught >= puzzle.robotCount) {
          sound.playVictoryFanfare();
          api.pass();
        }
      } else {
        // Tapped a human
        sound.playError();
        api.triggerShake();
        lockoutRef.current = true;
        setTimeout(() => (lockoutRef.current = false), 450);

        p.speechTimer = 1.2;
        const spEl = speechRefs.current[pId];
        if (spEl) spEl.style.display = 'block';

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
        {puzzle.passengers.map((p) => {
          return (
            <div
              key={p.id}
              ref={(el) => {
                domRefs.current[p.id] = el;
                if (el && !el.dataset.initialized) {
                  el.dataset.initialized = 'true';
                  el.style.left = `${(p.x / 1280) * 100}%`;
                  el.style.top = `${(p.y / 720) * 100}%`;
                  el.style.transform = `translate(-50%, -100%) ${p.vx < 0 ? 'scaleX(-1)' : 'scaleX(1)'}`;
                  el.style.zIndex = String(Math.round(p.y));
                }
              }}
              className="passenger-sprite-hitbox"
              onClick={() => handlePassengerClick(p.id)}
              style={{
                position: 'absolute',
                cursor: 'pointer',
              }}
            >
              {/* Speech bubble for humans */}
              <div
                ref={(el) => {
                  speechRefs.current[p.id] = el;
                }}
                className="passenger-speech-bubble"
                style={{ display: 'none' }}
              >
                Hey! I'm human!
              </div>

              {/* Bot Caught Stamp */}
              <div
                ref={(el) => {
                  stampRefs.current[p.id] = el;
                }}
                className="bot-caught-stamp"
                style={{ display: 'none' }}
              >
                BOT ✓
              </div>

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
