import { useState, useEffect } from 'react';
import type { Era, GameDefinition } from '../game/types';
import { randomInt, shuffleArray } from '../game/rng';
import { sound } from '../game/audio';

import enginePast from '../assets/engine_past.png';
import carriagePast from '../assets/carriage_past.png';
import enginePresent from '../assets/engine_present.png';
import carriagePresent from '../assets/carriage_present.png';
import engineFuture from '../assets/engine_future.png';
import carriageFuture from '../assets/carriage_future.png';

export interface PinClue {
  digitIndex: number; // 0, 1, 2, 3
  digit: number;
  template: 'ARITH' | 'COUNT' | 'LEGEND' | 'POSITION' | 'ERA_STYLE';
  title: string;
  sub: string;
  colorName?: string;
  colorHex?: string;
  windowCount?: number;
  plateNum?: number;
}

export interface DecoyCarriage {
  isDecoy: true;
  title: string;
  sub: string;
}

export type CarriageItem = (PinClue & { isDecoy: false }) | DecoyCarriage;

export interface PinDecoderPuzzle {
  pin: string; // 4 digits e.g. "7251"
  carriages: CarriageItem[];
  legend?: Record<string, number>;
  legendText?: string;
}

const COLOR_PALETTES = [
  { name: 'RED', hex: '#ef4444' },
  { name: 'BLUE', hex: '#3b82f6' },
  { name: 'GREEN', hex: '#22c55e' },
  { name: 'GOLD', hex: '#eab308' },
  { name: 'PURPLE', hex: '#a855f7' },
  { name: 'CYAN', hex: '#06b6d4' },
];

const ROMAN_NUMERALS = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'];

const DECOY_TEXTS = [
  { title: 'MIND THE GAP', sub: 'Platform 07' },
  { title: 'NO SMOKING', sub: 'Quiet Carriage' },
  { title: 'FIRST CLASS', sub: 'Priority Seating' },
  { title: 'LUGGAGE VAN', sub: 'Baggage Only' },
  { title: 'DINING CAR', sub: 'Refreshments' },
];

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

export const pinDecoderGame: GameDefinition<PinDecoderPuzzle> = {
  id: 'pin',
  title: 'PIN DECODER',
  shortName: 'PIN Decoder',
  defaultLives: 3,
  usesTrain: true,
  stationBoardText: (p) => p.legendText || 'STATION 07 · DEPARTURE GATE',
  goal: () => 'Find the 4 carriage clues to crack the 4-digit PIN.',

  generate: (rng: () => number, era: Era): PinDecoderPuzzle => {
    // Generate 4 random digits
    const digits = [
      randomInt(rng, 0, 9),
      randomInt(rng, 0, 9),
      randomInt(rng, 0, 9),
      randomInt(rng, 0, 9),
    ];

    // Template pool guaranteeing at least 3 distinct templates
    const templates: Array<'ARITH' | 'COUNT' | 'LEGEND' | 'POSITION' | 'ERA_STYLE'> = [
      'ARITH',
      'COUNT',
      'LEGEND',
      'ERA_STYLE',
    ];
    // Shuffle template assignment
    const shuffledTemplates = shuffleArray(rng, templates);

    // Color legend generator
    const chosenColors = shuffleArray(rng, COLOR_PALETTES).slice(0, 4);
    const legendValues = shuffleArray(rng, [1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 4);
    const legend: Record<string, number> = {};
    chosenColors.forEach((c, i) => {
      legend[c.name] = legendValues[i];
    });
    const legendText = chosenColors.map((c) => `${c.name}=${legend[c.name]}`).join('  ');

    const clueCarriages: CarriageItem[] = [];

    digits.forEach((targetDigit, idx) => {
      let t = shuffledTemplates[idx];

      // Guard: COUNT template needs 2..6
      if (t === 'COUNT' && (targetDigit < 2 || targetDigit > 6)) {
        t = 'ARITH';
      }

      if (t === 'COUNT') {
        clueCarriages.push({
          isDecoy: false,
          digitIndex: idx,
          digit: targetDigit,
          template: 'COUNT',
          title: `PIN ${['①', '②', '③', '④'][idx]}: COUNT WINDOWS`,
          sub: `${targetDigit} Windows on Coach`,
          windowCount: targetDigit,
        });
      } else if (t === 'LEGEND') {
        const colorEntry = chosenColors[idx % chosenColors.length];
        const val = legend[colorEntry.name];
        digits[idx] = val; // align pin digit with legend value
        clueCarriages.push({
          isDecoy: false,
          digitIndex: idx,
          digit: val,
          template: 'LEGEND',
          title: `PIN ${['①', '②', '③', '④'][idx]}: ${colorEntry.name} CAR`,
          sub: 'Check Board Legend',
          colorName: colorEntry.name,
          colorHex: colorEntry.hex,
        });
      } else if (t === 'ERA_STYLE') {
        let title = '';
        if (era === 'past') {
          title = `PIN ${['①', '②', '③', '④'][idx]}: ${ROMAN_NUMERALS[targetDigit] || targetDigit}`;
        } else if (era === 'future') {
          title = `PIN ${['①', '②', '③', '④'][idx]}: BINARY ${targetDigit.toString(2).padStart(4, '0')}`;
        } else {
          title = `PIN ${['①', '②', '③', '④'][idx]}: (${targetDigit + 2} - 2)`;
        }
        clueCarriages.push({
          isDecoy: false,
          digitIndex: idx,
          digit: targetDigit,
          template: 'ERA_STYLE',
          title,
          sub: era === 'past' ? 'Roman Numeral' : era === 'future' ? 'Binary Code' : 'Calculated Value',
        });
      } else {
        // ARITH
        const a = randomInt(rng, 1, 4);
        const b = targetDigit - a >= 0 ? targetDigit - a : 0;
        clueCarriages.push({
          isDecoy: false,
          digitIndex: idx,
          digit: targetDigit,
          template: 'ARITH',
          title: `PIN ${['①', '②', '③', '④'][idx]}: (${a} + ${b})`,
          sub: 'Solve Formula',
        });
      }
    });

    // Recalculate true pin in case legend modified a digit
    const finalPin = clueCarriages.map((c) => (!c.isDecoy ? c.digit : 0)).join('');

    // Add 2 decoy carriages
    const decoys = shuffleArray(rng, DECOY_TEXTS).slice(0, 2);
    const decoyCarriages: CarriageItem[] = decoys.map((d) => ({
      isDecoy: true,
      title: d.title,
      sub: d.sub,
    }));

    const allCarriages = shuffleArray(rng, [...clueCarriages, ...decoyCarriages]);

    return {
      pin: finalPin,
      carriages: allCarriages,
      legend,
      legendText,
    };
  },

  isSolvable: (p: PinDecoderPuzzle) => {
    return p.pin.length === 4 && p.carriages.filter((c) => !c.isDecoy).length === 4;
  },

  Component: function PinDecoderComponent({ puzzle, era, phase, api, timeLeft }) {
    const [inputVal, setInputVal] = useState('');
    const [digitStatus, setDigitStatus] = useState<('correct' | 'wrong' | null)[]>([
      null,
      null,
      null,
      null,
    ]);
    const [activeIdx, setActiveIdx] = useState(0);

    const isDeparted = timeLeft <= 6;
    const isDeparting = timeLeft <= 8 && timeLeft > 6;

    const data = TRAIN_DATA[era] || TRAIN_DATA.present;
    const engineW = Math.round(data.engineH * data.engineAspect);
    const carriageW = Math.round(data.carriageH * data.carriageAspect);

    // Keyboard support
    useEffect(() => {
      if (phase !== 'PLAYING') return;

      const handleKey = (e: KeyboardEvent) => {
        if (/^[0-9]$/.test(e.key)) {
          e.preventDefault();
          handleDigit(e.key);
        } else if (e.key === 'Backspace' || e.key === 'Delete') {
          e.preventDefault();
          handleBackspace();
        } else if (e.key === 'Enter') {
          e.preventDefault();
          handleSubmit();
        }
      };
      window.addEventListener('keydown', handleKey);
      return () => window.removeEventListener('keydown', handleKey);
    }, [phase, inputVal]);

    const handleDigit = (d: string) => {
      if (inputVal.length >= 4) return;
      sound.playClick(1.0 + parseInt(d, 10) * 0.05);
      const next = inputVal + d;
      setInputVal(next);
      if (next.length === 4) {
        // Auto-check on 4 digits
        checkPin(next);
      }
    };

    const handleBackspace = () => {
      if (inputVal.length === 0) return;
      sound.playClick(0.7);
      setInputVal(inputVal.slice(0, -1));
      setDigitStatus([null, null, null, null]);
    };

    const checkPin = (submitted: string) => {
      const statuses: ('correct' | 'wrong' | null)[] = [];
      let allCorrect = true;

      for (let i = 0; i < 4; i++) {
        if (submitted[i] === puzzle.pin[i]) {
          statuses.push('correct');
        } else {
          statuses.push('wrong');
          allCorrect = false;
        }
      }

      setDigitStatus(statuses);

      if (allCorrect) {
        sound.playVictoryFanfare();
        api.pass();
      } else {
        api.triggerShake();
        sound.playError();
        const livesLeft = api.loseLife();
        if (livesLeft <= 0) {
          api.fail('Too many wrong PIN attempts.');
        }
      }
    };

    const handleSubmit = () => {
      if (inputVal.length === 4) {
        checkPin(inputVal);
      }
    };

    // Train horizontal position to inspect carriages
    const totalTrainW = engineW + puzzle.carriages.length * (carriageW - data.overlap);
    const scrollOffset = isDeparted
      ? -totalTrainW - 500
      : isDeparting
      ? -totalTrainW * 0.6
      : -activeIdx * (carriageW - data.overlap) + 120;

    return (
      <div className="pin-decoder-game-layer">
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
            transition: isDeparting || isDeparted
              ? 'transform 2.2s cubic-bezier(0.4, 0, 1, 1)'
              : 'transform 0.4s ease-out',
            zIndex: 10,
          }}
        >
          {/* Locomotive */}
          <div
            className="train-car train-engine"
            style={{ width: engineW, height: data.engineH, flexShrink: 0 }}
          >
            <img src={data.engine} alt="engine" className="train-sprite-img" />
          </div>

          {/* Carriages */}
          {puzzle.carriages.map((c, i) => (
            <div
              key={i}
              className={`train-car train-carriage ${i === activeIdx ? 'inspected-carriage' : ''}`}
              onClick={() => setActiveIdx(i)}
              style={{
                width: carriageW,
                height: data.carriageH,
                marginLeft: -data.overlap,
                flexShrink: 0,
                cursor: 'pointer',
              }}
            >
              {/* Carriage Sprite */}
              <img
                src={data.carriage}
                alt="carriage"
                className="train-sprite-img"
                style={{
                  filter: !c.isDecoy && c.colorHex
                    ? `drop-shadow(0 0 10px ${c.colorHex})`
                    : undefined,
                }}
              />

              {/* Clue plate on carriage body */}
              <div
                className={`carriage-clue-plate era-${era} active`}
                style={{
                  borderColor: !c.isDecoy && c.colorHex ? c.colorHex : undefined,
                }}
              >
                <div className="plate-top-row">
                  <span className="plate-car-tag">
                    {c.isDecoy ? 'COACH' : `CAR ${i + 1}`}
                  </span>
                  <span className="plate-status-tag">
                    {c.isDecoy ? 'TRANSIT' : 'CLUE'}
                  </span>
                </div>
                <div className="plate-clue-text">{c.title}</div>
                <div className="plate-clue-sub">{c.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Carousel slide controls */}
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

        {/* Floating PIN Keypad Console (Top Center) */}
        <div className="keypad-console">
          {/* 4 Digit Boxes with Live Feedback */}
          <div className="pin-boxes-row">
            {[0, 1, 2, 3].map((idx) => {
              const char = inputVal[idx] || '';
              const status = digitStatus[idx];
              return (
                <div
                  key={idx}
                  className={`pin-box ${char ? 'filled' : ''} ${status || ''}`}
                >
                  <span className="pin-digit-char">{char || '_'}</span>
                </div>
              );
            })}
          </div>

          {/* 10-Key Pad */}
          <div className="keypad-grid">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <button
                key={n}
                type="button"
                className="keypad-key-btn"
                onClick={() => handleDigit(String(n))}
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              className="keypad-key-btn zero-btn"
              onClick={() => handleDigit('0')}
            >
              0
            </button>
            <button
              type="button"
              className="keypad-key-btn del-btn"
              onClick={handleBackspace}
            >
              ⌫ DEL
            </button>
          </div>
        </div>
      </div>
    );
  },
};
