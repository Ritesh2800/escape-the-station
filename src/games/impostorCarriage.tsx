import { useState } from 'react';
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

            return (
              <div
                key={c.id}
                className={`train-car train-carriage impostor-car ${
                  isTarget ? 'is-solved' : ''
                } ${isShaking ? 'shake-active' : ''}`}
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
                    filter: c.bodyHueRotate ? `hue-rotate(${c.bodyHueRotate}deg)` : undefined,
                  }}
                />

                {/* Overlaid Trait Elements */}
                {/* 1. Custom Roof Stripe */}
                <div
                  className="carriage-roof-stripe-overlay"
                  style={{
                    position: 'absolute',
                    top: 14,
                    left: 20,
                    right: 20,
                    height: 5,
                    backgroundColor: c.roofStripeColor,
                    boxShadow: `0 0 6px ${c.roofStripeColor}`,
                    zIndex: 12,
                    pointerEvents: 'none',
                  }}
                />

                {/* 2. Custom Lantern on roof */}
                {c.hasLantern && (
                  <div
                    className="roof-lantern-pixel"
                    style={{
                      position: 'absolute',
                      top: -16,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 14,
                      height: 18,
                      backgroundColor: '#f59e0b',
                      border: '2px solid #78350f',
                      borderRadius: 3,
                      boxShadow: '0 0 10px #f59e0b',
                      zIndex: 15,
                    }}
                  >
                    <span style={{ fontSize: 8, display: 'block', textAlign: 'center' }}>🔥</span>
                  </div>
                )}

                {/* 3. Number Plate */}
                <div
                  className="carriage-number-plate-tag"
                  style={{
                    position: 'absolute',
                    top: 38,
                    left: 22,
                    padding: '2px 6px',
                    fontFamily: 'var(--font-pixel)',
                    fontSize: 8,
                    background: 'rgba(0,0,0,0.85)',
                    color: '#fff',
                    border: '1.5px solid #aaa',
                    borderRadius: 2,
                    transform: c.mirroredPlate ? 'scaleX(-1)' : 'none',
                    zIndex: 14,
                    pointerEvents: 'none',
                  }}
                >
                  {c.plate}
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
                      background: 'rgba(0,0,0,0.9)',
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
            CARRIAGE {activeIdx + 1} OF {puzzle.carriages.length}
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
