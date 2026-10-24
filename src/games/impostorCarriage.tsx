import { useState, useEffect } from 'react';
import type { Era, GameDefinition } from '../game/types';
import { randomChoice, randomInt } from '../game/rng';
import { sound } from '../game/audio';

import enginePast from '../assets/engine_past.png';
import carriagePast from '../assets/carriage_past.png';
import enginePresent from '../assets/engine_present.png';
import carriagePresent from '../assets/carriage_present.png';
import engineFuture from '../assets/engine_future.png';
import carriageFuture from '../assets/carriage_future.png';

export type ImpostorTrait =
  | 'wheels'
  | 'windows'
  | 'window_color'
  | 'roof_stripe'
  | 'body_tint'
  | 'number_plate'
  | 'lantern';

export interface CarriageVisual {
  id: number;
  isImpostor: boolean;
  plate: string;
  mirroredPlate: boolean;
  wheelCount: number;
  windowCount: number;
  windowColor: string;
  roofStripeColor: string;
  bodyHueRotate: number;
  hasLantern: boolean;
}

export interface ImpostorPuzzle {
  trait: ImpostorTrait;
  hintCategory: string;
  impostorIndex: number;
  carriages: CarriageVisual[];
}

const TRAIN_DATA = {
  past: {
    engine: enginePast,
    carriage: carriagePast,
    engineAspect: 126 / 56,
    carriageAspect: 1009 / 421,
    carriageH: 220,
    engineH: 300,
    overlap: 28,
  },
  present: {
    engine: enginePresent,
    carriage: carriagePresent,
    engineAspect: 117 / 59,
    carriageAspect: 955 / 386,
    carriageH: 230,
    engineH: 230,
    overlap: 6,
  },
  future: {
    engine: engineFuture,
    carriage: carriageFuture,
    engineAspect: 124 / 80,
    carriageAspect: 1010 / 601,
    carriageH: 230,
    engineH: 230,
    overlap: 12,
  },
};

export const impostorCarriageGame: GameDefinition<ImpostorPuzzle> = {
  id: 'impostor',
  title: 'IMPOSTOR CARRIAGE',
  shortName: 'Impostor',
  defaultLives: 3,
  usesTrain: true,
  stationBoardText: () => 'INSPECTION NOTICE: ONE CARRIAGE IS FAKE',
  goal: () => 'Spot the odd carriage with the counterfeit trait and tap it.',

  generate: (rng: () => number, era: Era): ImpostorPuzzle => {
    const totalCarriages = randomInt(rng, 5, 6);
    const impostorIndex = randomInt(rng, 0, totalCarriages - 1);

    const traits: ImpostorTrait[] = [
      'wheels',
      'windows',
      'window_color',
      'roof_stripe',
      'body_tint',
      'number_plate',
      'lantern',
    ];
    const trait = randomChoice(rng, traits);

    // Base trait defaults
    const baseWheels = 4;
    const baseWindows = 4;
    const baseWindowColor = '#38bdf8';
    const baseRoofStripe = era === 'past' ? '#eab308' : era === 'future' ? '#22d3ee' : '#818cf8';
    const baseBodyTint = 0;
    const baseLantern = false;

    // Hint text shown at 15s
    const hintMap: Record<ImpostorTrait, string> = {
      wheels: 'Check the wheel counts',
      windows: 'Count the passenger windows',
      window_color: 'Notice the window tint',
      roof_stripe: 'Inspect the roof stripe colour',
      body_tint: 'Look for an abnormal paint hue',
      number_plate: 'Check the plate numbers',
      lantern: 'Look for a rooftop lantern',
    };

    const carriages: CarriageVisual[] = [];

    for (let i = 0; i < totalCarriages; i++) {
      const isImp = i === impostorIndex;
      const baseNum = 100 + i * 12;

      carriages.push({
        id: i,
        isImpostor: isImp,
        plate: `EXP-${baseNum}`,
        mirroredPlate: isImp && trait === 'number_plate',
        wheelCount: isImp && trait === 'wheels' ? 3 : baseWheels,
        windowCount: isImp && trait === 'windows' ? 3 : baseWindows,
        windowColor: isImp && trait === 'window_color' ? '#f43f5e' : baseWindowColor,
        roofStripeColor: isImp && trait === 'roof_stripe' ? '#ec4899' : baseRoofStripe,
        bodyHueRotate: isImp && trait === 'body_tint' ? 65 : baseBodyTint,
        hasLantern: isImp && trait === 'lantern' ? true : baseLantern,
      });
    }

    return {
      trait,
      hintCategory: hintMap[trait],
      impostorIndex,
      carriages,
    };
  },

  isSolvable: (p: ImpostorPuzzle) => {
    return p.carriages.filter((c) => c.isImpostor).length === 1;
  },

  Component: function ImpostorComponent({ puzzle, era, phase, api, timeLeft }) {
    const [shakeIdx, setShakeIdx] = useState<number | null>(null);
    const [solvedIdx, setSolvedIdx] = useState<number | null>(null);
    const [activeIdx, setActiveIdx] = useState(0);

    // Reset when puzzle changes
    useEffect(() => {
      setSolvedIdx(null);
      setShakeIdx(null);
      setActiveIdx(0);
    }, [puzzle]);

    // Keyboard navigation
    useEffect(() => {
      if (phase !== 'PLAYING') return;
      const handleKey = (e: KeyboardEvent) => {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          setActiveIdx((prev) => Math.max(0, prev - 1));
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          setActiveIdx((prev) => Math.min(puzzle.carriages.length - 1, prev + 1));
        }
      };
      window.addEventListener('keydown', handleKey);
      return () => window.removeEventListener('keydown', handleKey);
    }, [phase, puzzle.carriages.length]);

    const data = TRAIN_DATA[era] || TRAIN_DATA.present;
    const engineW = Math.round(data.engineH * data.engineAspect);
    const carriageW = Math.round(data.carriageH * data.carriageAspect);

    const handleCarriageClick = (idx: number) => {
      if (phase !== 'PLAYING' || solvedIdx !== null) return;

      const c = puzzle.carriages[idx];
      if (c.isImpostor) {
        sound.playVictoryFanfare();
        setSolvedIdx(idx);
        api.pass();
      } else {
        sound.playError();
        api.triggerShake();
        setShakeIdx(idx);
        setTimeout(() => setShakeIdx(null), 400);

        const livesLeft = api.loseLife();
        if (livesLeft <= 0) {
          api.fail('Too many wrong carriage taps.');
        }
      }
    };

    const showHint = timeLeft <= 15;

    // Train scroll offset
    const scrollOffset = -activeIdx * (carriageW - data.overlap) + 120;

    return (
      <div className="impostor-game-layer">
        {/* Train Layer */}
        <div
          className="train-container"
          style={{
            position: 'absolute',
            bottom: '24.8%',
            left: 0,
            display: 'flex',
            alignItems: 'flex-end',
            transform: `translateX(${scrollOffset}px)`,
            transition: 'transform 0.4s ease-out',
            zIndex: 10,
          }}
        >
          {/* Engine */}
          <div
            className="train-car train-engine"
            style={{ width: engineW, height: data.engineH, flexShrink: 0 }}
          >
            <img src={data.engine} alt="engine" className="train-sprite-img" />
          </div>

          {/* Carriages */}
          {puzzle.carriages.map((c, i) => {
            const isTarget = solvedIdx === i;
            const isShaking = shakeIdx === i;
            const isInspected = activeIdx === i;

            return (
              <div
                key={c.id}
                className={`train-car train-carriage impostor-car ${
                  isTarget ? 'is-solved' : ''
                } ${isShaking ? 'shake-active' : ''} ${isInspected ? 'inspected-carriage' : ''}`}
                onClick={() => {
                  setActiveIdx(i);
                  handleCarriageClick(i);
                }}
                style={{
                  width: carriageW,
                  height: data.carriageH,
                  marginLeft: -data.overlap,
                  flexShrink: 0,
                  cursor: 'pointer',
                  position: 'relative',
                }}
              >
                {/* Carriage Sprite with Body Tint */}
                <img
                  src={data.carriage}
                  alt="carriage"
                  className="train-sprite-img"
                  style={{
                    filter: c.bodyHueRotate ? `hue-rotate(${c.bodyHueRotate}deg) saturate(1.4)` : undefined,
                  }}
                />

                {/* Overlaid Trait 1: Roof Stripe */}
                <div
                  className="carriage-roof-stripe-overlay"
                  style={{
                    position: 'absolute',
                    top: 14,
                    left: 20,
                    right: 20,
                    height: 6,
                    backgroundColor: c.roofStripeColor,
                    boxShadow: `0 0 8px ${c.roofStripeColor}`,
                    zIndex: 12,
                    pointerEvents: 'none',
                    borderRadius: 2,
                  }}
                />

                {/* Overlaid Trait 2: Lantern on roof */}
                {c.hasLantern && (
                  <div
                    className="roof-lantern-pixel"
                    style={{
                      position: 'absolute',
                      top: -18,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 16,
                      height: 20,
                      backgroundColor: '#f59e0b',
                      border: '2px solid #78350f',
                      borderRadius: 3,
                      boxShadow: '0 0 14px #f59e0b',
                      zIndex: 15,
                    }}
                  >
                    <span style={{ fontSize: 10, display: 'block', textAlign: 'center', lineHeight: '18px' }}>🔥</span>
                  </div>
                )}

                {/* Overlaid Trait 3: Number Plate */}
                <div
                  className="carriage-number-plate-tag"
                  style={{
                    position: 'absolute',
                    top: 36,
                    left: 22,
                    padding: '2px 8px',
                    fontFamily: 'var(--font-pixel)',
                    fontSize: 8,
                    background: 'rgba(0,0,0,0.88)',
                    color: '#fff',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: 2,
                    transform: c.mirroredPlate ? 'scaleX(-1)' : 'none',
                    zIndex: 14,
                    pointerEvents: 'none',
                    boxShadow: c.mirroredPlate ? '0 0 6px rgba(239, 68, 68, 0.6)' : 'none',
                  }}
                >
                  {c.plate}
                </div>

                {/* Overlaid Trait 4: Visible Windows & Color */}
                <div
                  className="carriage-windows-overlay"
                  style={{
                    position: 'absolute',
                    top: '36%',
                    left: '12%',
                    right: '12%',
                    display: 'flex',
                    justifyContent: 'space-evenly',
                    alignItems: 'center',
                    zIndex: 13,
                    pointerEvents: 'none',
                  }}
                >
                  {Array.from({ length: c.windowCount }).map((_, wIdx) => (
                    <div
                      key={wIdx}
                      style={{
                        width: 28,
                        height: 20,
                        backgroundColor: c.windowColor,
                        border: '2px solid #1e293b',
                        borderRadius: 2,
                        boxShadow: `0 0 8px ${c.windowColor}, inset 0 0 4px #ffffff`,
                      }}
                    />
                  ))}
                </div>

                {/* Overlaid Trait 5: Visible Wheels Overlay */}
                <div
                  className="carriage-wheels-overlay"
                  style={{
                    position: 'absolute',
                    bottom: 6,
                    left: '10%',
                    right: '10%',
                    display: 'flex',
                    justifyContent: 'space-around',
                    alignItems: 'center',
                    zIndex: 13,
                    pointerEvents: 'none',
                  }}
                >
                  {Array.from({ length: c.wheelCount }).map((_, whIdx) => (
                    <div
                      key={whIdx}
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, #cbd5e1 30%, #475569 70%, #0f172a 100%)',
                        border: '2px solid #94a3b8',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.8)',
                      }}
                    />
                  ))}
                </div>

                {/* Stamp if caught */}
                {isTarget && (
                  <div
                    className="fake-stamp-banner"
                    style={{
                      position: 'absolute',
                      top: '40%',
                      left: '50%',
                      transform: 'translate(-50%, -50%) rotate(-12deg)',
                      fontFamily: 'var(--font-pixel)',
                      fontSize: 22,
                      color: '#22c55e',
                      border: '4px solid #22c55e',
                      padding: '4px 16px',
                      background: 'rgba(0,0,0,0.92)',
                      boxShadow: '0 0 20px #22c55e',
                      zIndex: 25,
                    }}
                  >
                    FAKE! ✓
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Carousel Navigation */}
        <div className="train-slide-nav">
          <button
            type="button"
            className="nav-arrow-btn"
            disabled={activeIdx <= 0}
            onClick={() => setActiveIdx(Math.max(0, activeIdx - 1))}
          >
            ◀ PREV CAR
          </button>
          <span className="nav-car-index">
            CARRIAGE {activeIdx + 1} OF {puzzle.carriages.length} · [TAP TO INSPECT / ACCUSE]
          </span>
          <button
            type="button"
            className="nav-arrow-btn"
            disabled={activeIdx >= puzzle.carriages.length - 1}
            onClick={() => setActiveIdx(Math.min(puzzle.carriages.length - 1, activeIdx + 1))}
          >
            NEXT CAR ▶
          </button>
        </div>

        {/* 15s Hint Badge */}
        {showHint && (
          <div className="impostor-hint-banner">
            💡 INSPECTOR HINT: {puzzle.hintCategory}!
          </div>
        )}
      </div>
    );
  },
};
