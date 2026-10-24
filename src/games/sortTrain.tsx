import { useState, useEffect } from 'react';
import type { Era, GameDefinition } from '../game/types';
import { randomChoice, shuffleArray } from '../game/rng';
import { sound } from '../game/audio';

import carriagePast from '../assets/carriage_past.png';
import carriagePresent from '../assets/carriage_present.png';
import carriageFuture from '../assets/carriage_future.png';

export type SortRuleType =
  | 'WINDOWS_ASC'
  | 'NUMBER_ASC'
  | 'DESTINATION_ALPHA'
  | 'WEIGHT_ASC'
  | 'WEIGHT_DESC'
  | 'COLOR_ORDER';

export interface SortCarriage {
  uid: string;
  num: number;
  destination: string;
  weightTons: number;
  windowCount: number;
  colorName: string;
  colorHex: string;
}

export interface SortTrainPuzzle {
  ruleType: SortRuleType;
  ruleTitle: string;
  initialOrder: SortCarriage[];
  targetOrder: SortCarriage[];
}

const DESTINATIONS = ['AMSTERDAM', 'BERLIN', 'CHICAGO', 'DUBLIN', 'EDINBURGH', 'FLORENCE'];

const COLOR_SPECS = [
  { name: 'RED', hex: '#ef4444' },
  { name: 'BLUE', hex: '#3b82f6' },
  { name: 'GOLD', hex: '#eab308' },
  { name: 'GREEN', hex: '#22c55e' },
  { name: 'PURPLE', hex: '#a855f7' },
];

export const sortTrainGame: GameDefinition<SortTrainPuzzle> = {
  id: 'sort',
  title: 'SORT THE TRAIN',
  shortName: 'Sort Train',
  defaultLives: null, // No lives, 30s timer constraint
  usesTrain: true,
  stationBoardText: (p) => `SHUNTER RULE: ${p.ruleTitle}`,
  goal: (p) => `Rearrange carriages: ${p.ruleTitle}`,

  generate: (rng: () => number, _era: Era): SortTrainPuzzle => {
    const count = 4; // 4 carriages for fun quick 30s puzzle

    const shuffledDestinations = shuffleArray(rng, DESTINATIONS).slice(0, count);
    const shuffledColors = shuffleArray(rng, COLOR_SPECS).slice(0, count);

    // Create unique properties
    const carriages: SortCarriage[] = [];
    for (let i = 0; i < count; i++) {
      carriages.push({
        uid: `car-${i}`,
        num: i + 1,
        destination: shuffledDestinations[i],
        weightTons: 15 + i * 5, // 15, 20, 25, 30
        windowCount: 2 + i, // 2, 3, 4, 5
        colorName: shuffledColors[i].name,
        colorHex: shuffledColors[i].hex,
      });
    }

    const rules: Array<{ type: SortRuleType; title: string }> = [
      { type: 'WINDOWS_ASC', title: 'FEWEST WINDOWS FIRST' },
      { type: 'NUMBER_ASC', title: 'NUMBER 1 TO 4, FRONT TO BACK' },
      { type: 'DESTINATION_ALPHA', title: 'DESTINATIONS A TO Z' },
      { type: 'WEIGHT_ASC', title: 'LIGHTEST FIRST' },
      { type: 'WEIGHT_DESC', title: 'HEAVIEST FIRST' },
      {
        type: 'COLOR_ORDER',
        title: `COLOUR ORDER: ${shuffledColors.map((c) => c.name).join(' ➜ ')}`,
      },
    ];

    const chosenRule = randomChoice(rng, rules);

    // Calculate target sorted order based on rule
    let target = [...carriages];
    if (chosenRule.type === 'WINDOWS_ASC') {
      target.sort((a, b) => a.windowCount - b.windowCount);
    } else if (chosenRule.type === 'NUMBER_ASC') {
      target.sort((a, b) => a.num - b.num);
    } else if (chosenRule.type === 'DESTINATION_ALPHA') {
      target.sort((a, b) => a.destination.localeCompare(b.destination));
    } else if (chosenRule.type === 'WEIGHT_ASC') {
      target.sort((a, b) => a.weightTons - b.weightTons);
    } else if (chosenRule.type === 'WEIGHT_DESC') {
      target.sort((a, b) => b.weightTons - a.weightTons);
    } else if (chosenRule.type === 'COLOR_ORDER') {
      const colorOrder = shuffledColors.map((c) => c.name);
      target.sort((a, b) => colorOrder.indexOf(a.colorName) - colorOrder.indexOf(b.colorName));
    }

    // Shuffle into a non-solved starting order that requires at least 2 swaps
    let initial = shuffleArray(rng, target);
    let attempts = 0;
    while (attempts < 20 && initial.every((c, i) => c.uid === target[i].uid)) {
      initial = shuffleArray(rng, target);
      attempts++;
    }

    return {
      ruleType: chosenRule.type,
      ruleTitle: chosenRule.title,
      initialOrder: initial,
      targetOrder: target,
    };
  },

  isSolvable: (p: SortTrainPuzzle) => {
    return p.targetOrder.length === p.initialOrder.length;
  },

  Component: function SortComponent({ puzzle, era, phase, api }) {
    const [currentOrder, setCurrentOrder] = useState<SortCarriage[]>(puzzle.initialOrder);
    const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

    const spriteImg =
      era === 'past' ? carriagePast : era === 'future' ? carriageFuture : carriagePresent;

    // Check correct positions
    const correctCount = currentOrder.filter(
      (c, i) => c.uid === puzzle.targetOrder[i]?.uid
    ).length;

    useEffect(() => {
      api.setStatus(`${correctCount}/${puzzle.targetOrder.length} in place`);
      if (correctCount === puzzle.targetOrder.length) {
        sound.playVictoryFanfare();
        api.pass();
      }
    }, [correctCount, puzzle.targetOrder.length, api]);

    const handleCarriageClick = (clickedIdx: number) => {
      if (phase !== 'PLAYING') return;

      if (selectedIdx === null) {
        // Select first carriage
        sound.playClick(1.2);
        setSelectedIdx(clickedIdx);
      } else if (selectedIdx === clickedIdx) {
        // Deselect
        sound.playClick(0.8);
        setSelectedIdx(null);
      } else {
        // Swap selected with clicked
        sound.playClick(1.5);
        const next = [...currentOrder];
        const temp = next[selectedIdx];
        next[selectedIdx] = next[clickedIdx];
        next[clickedIdx] = temp;

        setCurrentOrder(next);
        setSelectedIdx(null);
      }
    };

    return (
      <div className="sort-train-game-layer">
        {/* Track / Train Area */}
        <div className="sort-train-container">
          {/* Front of Train Marker */}
          <div className="train-front-marker">
            FRONT ➜
          </div>

          <div className="sort-carriages-row">
            {currentOrder.map((c, idx) => {
              const isSelected = selectedIdx === idx;
              const isCorrect = c.uid === puzzle.targetOrder[idx]?.uid;

              return (
                <div
                  key={c.uid}
                  className={`sort-carriage-slot ${isSelected ? 'is-selected' : ''} ${
                    isCorrect ? 'slot-correct' : ''
                  }`}
                  onClick={() => handleCarriageClick(idx)}
                >
                  {/* Status Coupler Light */}
                  <div className={`slot-coupler-light ${isCorrect ? 'active-green' : ''}`}>
                    {isCorrect ? '●' : '○'}
                  </div>

                  {/* Carriage Sprite Box */}
                  <div className="sort-carriage-card">
                    <img
                      src={spriteImg}
                      alt={c.destination}
                      className="sort-carriage-img"
                    />

                    {/* Color Ribbon */}
                    <div
                      className="carriage-color-ribbon"
                      style={{ backgroundColor: c.colorHex }}
                    />

                    {/* Data Plate */}
                    <div className="sort-data-plate">
                      <div className="sort-plate-top">
                        <span className="plate-slot-num">#{c.num}</span>
                        <span className="plate-windows-tag">{c.windowCount} WINS</span>
                      </div>
                      <div className="plate-dest-text">{c.destination}</div>
                      <div className="plate-weight-text">{c.weightTons} TONNES</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Shunter Guide Bar */}
        <div className="sort-helper-bar">
          {selectedIdx !== null ? (
            <span className="helper-active-text">
              ▲ Carriage #{currentOrder[selectedIdx].num} selected — Tap another to swap!
            </span>
          ) : (
            <span className="helper-idle-text">
              Tap any carriage to pick it up, then tap another to swap positions.
            </span>
          )}
        </div>
      </div>
    );
  },
};
