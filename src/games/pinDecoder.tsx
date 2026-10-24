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
  goal: () => 'Inspect each of the 4 carriages for each digit of the 4-digit PIN.',

  generate: (rng: () => number, era: Era): PinDecoderPuzzle => {
    // Generate 4 random digits (0..9)
    const digits = [
      randomInt(rng, 0, 9),
      randomInt(rng, 0, 9),
      randomInt(rng, 0, 9),
      randomInt(rng, 0, 9),
    ];

    // Color for the color coach (Carriage 3)
    const chosenColor = shuffleArray(rng, COLOR_PALETTES)[0];
    const legendText = `${chosenColor.name} COACH = ${digits[2]} · DEPARTURE GATE`;

    const clueCarriages: (PinClue & { isDecoy: false })[] = [];

    // CARRIAGE 1 -> DIGIT 1 (Simple addition)
    const d0 = digits[0];
    let formula0 = '';
    if (d0 === 0) {
      formula0 = '0 + 0';
    } else {
      const a = randomInt(rng, 0, d0);
      const b = d0 - a;
      formula0 = `${a} + ${b}`;
    }
    clueCarriages.push({
      isDecoy: false,
      digitIndex: 0,
      digit: d0,
      template: 'ARITH',
      title: `PIN ①: ${formula0} = ?`,
      sub: 'Solve addition for Digit 1',
    });

    // CARRIAGE 2 -> DIGIT 2 (Lit Windows Count if 1..6, else subtraction)
    const d1 = digits[1];
    if (d1 >= 1 && d1 <= 6) {
      clueCarriages.push({
        isDecoy: false,
        digitIndex: 1,
        digit: d1,
        template: 'COUNT',
        title: `PIN ②: COUNT ${d1} LIT WINDOWS`,
        sub: 'Count illuminated windows for Digit 2',
        windowCount: d1,
      });
    } else {
      const k = randomInt(rng, 1, 3);
      clueCarriages.push({
        isDecoy: false,
        digitIndex: 1,
        digit: d1,
        template: 'ARITH',
        title: `PIN ②: ${d1 + k} - ${k} = ?`,
        sub: 'Solve subtraction for Digit 2',
      });
    }

    // CARRIAGE 3 -> DIGIT 3 (Color Legend matching Station Board)
    const d2 = digits[2];
    clueCarriages.push({
      isDecoy: false,
      digitIndex: 2,
      digit: d2,
      template: 'LEGEND',
      title: `PIN ③: ${chosenColor.name} COACH`,
      sub: `See Station Board: ${chosenColor.name} = ${d2}`,
      colorName: chosenColor.name,
      colorHex: chosenColor.hex,
    });

    // CARRIAGE 4 -> DIGIT 4 (Simple math or Roman/Direct code)
    const d3 = digits[3];
    if (d3 >= 1 && d3 <= 6 && clueCarriages[1].template !== 'COUNT') {
      clueCarriages.push({
        isDecoy: false,
        digitIndex: 3,
        digit: d3,
        template: 'COUNT',
        title: `PIN ④: COUNT ${d3} LIT WINDOWS`,
        sub: 'Count illuminated windows for Digit 4',
        windowCount: d3,
      });
    } else if (era === 'past' && d3 >= 1 && d3 <= 9) {
      clueCarriages.push({
        isDecoy: false,
        digitIndex: 3,
        digit: d3,
        template: 'ERA_STYLE',
        title: `PIN ④: ROMAN ${ROMAN_NUMERALS[d3]} (= ${d3})`,
        sub: 'Roman Numeral for Digit 4',
      });
    } else {
      const k = randomInt(rng, 1, 3);
      clueCarriages.push({
        isDecoy: false,
        digitIndex: 3,
        digit: d3,
        template: 'ARITH',
        title: `PIN ④: ${d3 + k} - ${k} = ?`,
        sub: 'Solve subtraction for Digit 4',
      });
    }

    const finalPin = digits.join('');

    return {
      pin: finalPin,
      carriages: clueCarriages,
      legendText,
    };
  },

  isSolvable: (p: PinDecoderPuzzle) => {
    return p.pin.length === 4 && p.carriages.length === 4 && p.carriages.every((c) => !c.isDecoy);
  },

  Component: function PinDecoderComponent({ puzzle, era, phase, api, timeLeft }) {
    const [inputVal, setInputVal] = useState('');
    const [selectedSlot, setSelectedSlot] = useState<number>(0);
    const [digitStatus, setDigitStatus] = useState<('correct' | 'wrong' | null)[]>([
      null,
      null,
      null,
      null,
    ]);
    const [activeIdx, setActiveIdx] = useState(0);

    // Reset when puzzle changes
    useEffect(() => {
      setInputVal('');
      setSelectedSlot(0);
      setDigitStatus([null, null, null, null]);
      setActiveIdx(0);
    }, [puzzle]);

    const isDeparted = timeLeft <= 5;
    const isDeparting = timeLeft <= 7 && timeLeft > 5;

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
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          setActiveIdx((prev) => {
            const next = Math.max(0, prev - 1);
            setSelectedSlot(next);
            return next;
          });
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          setActiveIdx((prev) => {
            const next = Math.min(puzzle.carriages.length - 1, prev + 1);
            setSelectedSlot(next);
            return next;
          });
        }
      };
      window.addEventListener('keydown', handleKey);
      return () => window.removeEventListener('keydown', handleKey);
    }, [phase, inputVal, selectedSlot, puzzle.pin]);

    const handleDigit = (d: string) => {
      sound.playClick(1.0 + parseInt(d, 10) * 0.05);

      let next = inputVal;
      if (next.length < 4) {
        next = next + d;
        setInputVal(next);
        setSelectedSlot(Math.min(3, next.length));
        if (next.length === 4) {
          checkPin(next);
        }
      } else {
        // Replace digit at selected slot
        const chars = next.split('');
        chars[selectedSlot] = d;
        const replaced = chars.join('');
        setInputVal(replaced);
        const nextSlot = (selectedSlot + 1) % 4;
        setSelectedSlot(nextSlot);
        checkPin(replaced);
      }
    };

    const handleBackspace = () => {
      if (inputVal.length === 0) return;
      sound.playClick(0.7);
      const next = inputVal.slice(0, -1);
      setInputVal(next);
      setSelectedSlot(next.length);
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
                position: 'relative',
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

              {/* Physical lit windows overlay for COUNT template */}
              {!c.isDecoy && c.windowCount && (
                <div
                  className="carriage-lit-windows-row"
                  style={{
                    position: 'absolute',
                    top: '32%',
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
                        height: 22,
                        backgroundColor: '#ffd445',
                        border: '2px solid #78350f',
                        borderRadius: 3,
                        boxShadow: '0 0 10px #ffd445, inset 0 0 4px #fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 9,
                        fontWeight: 700,
                        color: '#78350f',
                      }}
                    >
                      {wIdx + 1}
                    </div>
                  ))}
                </div>
              )}

              {/* Color belt for LEGEND template */}
              {!c.isDecoy && c.colorHex && (
                <div
                  className="carriage-color-band-clue"
                  style={{
                    position: 'absolute',
                    bottom: 24,
                    left: 14,
                    right: 14,
                    height: 8,
                    backgroundColor: c.colorHex,
                    boxShadow: `0 0 12px ${c.colorHex}`,
                    borderRadius: 2,
                    zIndex: 12,
                    pointerEvents: 'none',
                  }}
                />
              )}

              {/* Clue plate on carriage body */}
              <div
                className={`carriage-clue-plate era-${era} active`}
                style={{
                  borderColor: !c.isDecoy && c.colorHex ? c.colorHex : undefined,
                }}
              >
                <div className="plate-top-row">
                  <span className="plate-car-tag">
                    CAR {i + 1} OF 4
                  </span>
                  <span className="plate-status-tag">
                    PIN {['①', '②', '③', '④'][i]}
                  </span>
                </div>
                <div className="plate-clue-text">{c.title}</div>
                <div className="plate-clue-sub">{c.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Carousel slide controls & Direct Carriage Tabs */}
        <div className="train-slide-nav">
          <button
            type="button"
            className="nav-arrow-btn"
            disabled={activeIdx <= 0}
            onClick={() => {
              const prev = Math.max(0, activeIdx - 1);
              setActiveIdx(prev);
              setSelectedSlot(prev);
            }}
          >
            ◀ PREV
          </button>

          <div className="nav-car-pills">
            {puzzle.carriages.map((_, idx) => {
              const badge = ['①', '②', '③', '④'][idx];
              const isCurrent = activeIdx === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  className={`car-select-pill ${isCurrent ? 'active' : ''}`}
                  onClick={() => {
                    sound.playClick(1.1);
                    setActiveIdx(idx);
                    setSelectedSlot(idx);
                  }}
                >
                  CAR {idx + 1} {badge}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            className="nav-arrow-btn"
            disabled={activeIdx >= puzzle.carriages.length - 1}
            onClick={() => {
              const next = Math.min(puzzle.carriages.length - 1, activeIdx + 1);
              setActiveIdx(next);
              setSelectedSlot(next);
            }}
          >
            NEXT ▶
          </button>
        </div>

        {/* Floating PIN Keypad Console (Top Center) */}
        <div className="keypad-console">
          {/* 4 Digit Boxes with Live Feedback and Selection */}
          <div className="pin-boxes-row">
            {[0, 1, 2, 3].map((idx) => {
              const char = inputVal[idx] || '';
              const status = digitStatus[idx];
              const isSelected = selectedSlot === idx;
              return (
                <div
                  key={idx}
                  className={`pin-box ${char ? 'filled' : ''} ${status || ''} ${isSelected ? 'selected-slot' : ''}`}
                  onClick={() => {
                    setSelectedSlot(idx);
                    setActiveIdx(idx);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <span className="pin-digit-char">{char || '_'}</span>
                  <span className="pin-box-idx">DIGIT {idx + 1}</span>
                </div>
              );
            })}
          </div>

          {/* 10-Key Pad + DEL + CHECK */}
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
              className="keypad-key-btn del-btn"
              onClick={handleBackspace}
            >
              ⌫ DEL
            </button>
            <button
              type="button"
              className="keypad-key-btn zero-btn"
              onClick={() => handleDigit('0')}
            >
              0
            </button>
            <button
              type="button"
              className="keypad-key-btn enter-btn"
              onClick={handleSubmit}
            >
              ➔ OK
            </button>
          </div>
        </div>
      </div>
    );
  },
};
