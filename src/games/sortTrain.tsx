import { useState, useEffect, useCallback, useRef } from 'react';
import type { Era, GameDefinition } from '../game/types';
import { randomChoice, shuffleArray } from '../game/rng';
import { sound } from '../game/audio';

import enginePast from '../assets/engine_past.png';
import carriagePast from '../assets/carriage_past.png';
import enginePresent from '../assets/engine_present.png';
import carriagePresent from '../assets/carriage_present.png';
import engineFuture from '../assets/engine_future.png';
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

const TRAIN_SPEC = {
  past: {
    engine: enginePast,
    carriage: carriagePast,
    engineAspect: 126 / 56, // 2.25
    carriageAspect: 1009 / 421, // 2.40
    engineH: 215,
    carriageH: 155,
    engineW: 235,
    carriageW: 240,
    overlap: 18,
  },
  present: {
    engine: enginePresent,
    carriage: carriagePresent,
    engineAspect: 117 / 59, // 1.98
    carriageAspect: 955 / 386, // 2.47
    engineH: 158,
    carriageH: 158,
    engineW: 220,
    carriageW: 240,
    overlap: 8,
  },
  future: {
    engine: engineFuture,
    carriage: carriageFuture,
    engineAspect: 124 / 80, // 1.55
    carriageAspect: 1010 / 601, // 1.68
    engineH: 160,
    carriageH: 160,
    engineW: 215,
    carriageW: 240,
    overlap: 12,
  },
};

export const sortTrainGame: GameDefinition<SortTrainPuzzle> = {
  id: 'sort',
  title: 'SORT THE TRAIN',
  shortName: 'Sort Train',
  defaultLives: null, // Timer based constraint
  usesTrain: true,
  stationBoardText: (p) => `SHUNTER RULE: ${p.ruleTitle}`,
  goal: (p) => `Rearrange the 4 carriages on the train: ${p.ruleTitle} (Front ➔ Back)`,

  generate: (rng: () => number, _era: Era): SortTrainPuzzle => {
    const count = 4; // 4 big coupled carriages

    const shuffledDestinations = shuffleArray(rng, DESTINATIONS).slice(0, count);
    const shuffledColors = shuffleArray(rng, COLOR_SPECS).slice(0, count);

    // Create unique properties
    const carriages: SortCarriage[] = [];
    for (let i = 0; i < count; i++) {
      carriages.push({
        uid: `car-${i}`,
        num: i + 1,
        destination: shuffledDestinations[i],
        weightTons: 15 + i * 12, // 15, 27, 39, 51
        windowCount: 1 + i, // 1, 2, 3, 4
        colorName: shuffledColors[i].name,
        colorHex: shuffledColors[i].hex,
      });
    }

    const rules: Array<{ type: SortRuleType; title: string }> = [
      { type: 'WINDOWS_ASC', title: 'FEWEST WINDOWS FIRST (1 ➔ 4)' },
      { type: 'NUMBER_ASC', title: 'NUMBER 1 TO 4 (FRONT TO BACK)' },
      { type: 'DESTINATION_ALPHA', title: 'DESTINATIONS A TO Z' },
      { type: 'WEIGHT_ASC', title: 'LIGHTEST FIRST (15t ➔ 51t)' },
      { type: 'WEIGHT_DESC', title: 'HEAVIEST FIRST (51t ➔ 15t)' },
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
    const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
    const [isDeparting, setIsDeparting] = useState<boolean>(false);
    const passedRef = useRef(false);

    const spec = TRAIN_SPEC[era] || TRAIN_SPEC.present;

    // Check correct positions
    const correctCount = currentOrder.filter(
      (c, i) => c.uid === puzzle.targetOrder[i]?.uid
    ).length;

    const isFullySolved = correctCount === puzzle.targetOrder.length;

    // Victory and Train departure
    useEffect(() => {
      api.setStatus(`${correctCount}/${puzzle.targetOrder.length} carriages in place`);
      if (isFullySolved && !passedRef.current && phase === 'PLAYING') {
        passedRef.current = true;
        setIsDeparting(true);
        sound.startTrainSound();
        api.pass();
      }
    }, [correctCount, puzzle.targetOrder.length, isFullySolved, phase, api]);

    const swapCarriages = useCallback(
      (idxA: number, idxB: number) => {
        if (idxA === idxB || idxA < 0 || idxB < 0 || idxA >= currentOrder.length || idxB >= currentOrder.length) return;
        sound.playClick(1.6);
        const next = [...currentOrder];
        const temp = next[idxA];
        next[idxA] = next[idxB];
        next[idxB] = temp;
        setCurrentOrder(next);
        setSelectedIdx(null);
        setDragOverIdx(null);
      },
      [currentOrder]
    );

    const handleCarriageClick = (clickedIdx: number) => {
      if (phase !== 'PLAYING' || isDeparting) return;

      if (selectedIdx === null) {
        // Select carriage to swap
        sound.playClick(1.2);
        setSelectedIdx(clickedIdx);
      } else if (selectedIdx === clickedIdx) {
        // Deselect
        sound.playClick(0.9);
        setSelectedIdx(null);
      } else {
        // Swap selected with clicked
        swapCarriages(selectedIdx, clickedIdx);
      }
    };

    return (
      <div className="sort-train-game-layer">
        {/* Sky Guide / Rule Banner */}
        <div className="sort-shunter-rule-banner">
          <div className="shunter-rule-pill">
            <span className="shunter-rule-icon">⚙</span>
            <span className="shunter-rule-title">RULE: {puzzle.ruleTitle}</span>
          </div>
          <div className="shunter-progress-pill">
            {isFullySolved ? (
              <span className="shunter-progress-complete">ALL COUPLED ✓ DEPARTING</span>
            ) : (
              <span>
                {correctCount} / {puzzle.targetOrder.length} IN PLACE ·{' '}
                {selectedIdx !== null
                  ? `Coach #${currentOrder[selectedIdx].num} selected: tap another to swap!`
                  : 'Tap or drag any two carriages to swap them'}
              </span>
            )}
          </div>
        </div>

        {/* Big Train Container directly sitting on Track */}
        <div
          className={`sort-big-train-container ${isDeparting ? 'train-departing' : ''}`}
          style={{
            transform: isDeparting ? 'translateX(-2600px)' : 'translateX(0)',
            transition: isDeparting
              ? 'transform 1.4s cubic-bezier(0.5, 0, 0.9, 0.6)'
              : 'transform 0.4s ease-out',
          }}
        >
          {/* Locomotive at Front (Left) */}
          <div
            className="sort-train-engine"
            style={{
              width: spec.engineW,
              height: spec.engineH,
              flexShrink: 0,
            }}
          >
            <div className="locomotive-label-tag">
              ◀ FRONT · LOCOMOTIVE
            </div>
            <img
              src={spec.engine}
              alt="Locomotive"
              className="train-sprite-img"
            />
          </div>

          {/* 4 Big Interactive Carriages */}
          <div className="sort-carriages-line">
            {currentOrder.map((c, idx) => {
              const isSelected = selectedIdx === idx;
              const isDragOver = dragOverIdx === idx;
              const isCorrectSlot = c.uid === puzzle.targetOrder[idx]?.uid;

              return (
                <div
                  key={c.uid}
                  className={`sort-big-carriage-wrapper ${isSelected ? 'is-selected' : ''} ${
                    isDragOver ? 'is-drag-over' : ''
                  } ${isCorrectSlot ? 'is-slot-correct' : ''}`}
                  style={{
                    width: spec.carriageW,
                    height: spec.carriageH,
                    marginLeft: -spec.overlap,
                  }}
                  onClick={() => handleCarriageClick(idx)}
                  draggable={phase === 'PLAYING' && !isDeparting}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', String(idx));
                    setSelectedIdx(idx);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (dragOverIdx !== idx) setDragOverIdx(idx);
                  }}
                  onDragLeave={() => {
                    if (dragOverIdx === idx) setDragOverIdx(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const fromIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
                    if (!isNaN(fromIdx)) {
                      swapCarriages(fromIdx, idx);
                    }
                  }}
                >
                  {/* Coupler Status Beacon above carriage */}
                  <div
                    className={`sort-coupler-beacon ${
                      isCorrectSlot ? 'beacon-correct' : 'beacon-uncoupled'
                    }`}
                  >
                    <span className="beacon-dot">{isCorrectSlot ? '●' : '○'}</span>
                    <span className="beacon-text">
                      {isCorrectSlot ? `SLOT ${idx + 1} ✓` : `SLOT ${idx + 1}`}
                    </span>
                  </div>

                  {/* Selected / Shunt Marker */}
                  {isSelected && (
                    <div className="sort-selected-floater">
                      <div className="floater-title">⇅ SWAP SELECTED</div>
                      <div className="floater-controls" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="floater-nav-btn"
                          disabled={idx === 0}
                          onClick={() => swapCarriages(idx, idx - 1)}
                        >
                          ◀
                        </button>
                        <span className="floater-idx-text">CAR #{c.num}</span>
                        <button
                          type="button"
                          className="floater-nav-btn"
                          disabled={idx === currentOrder.length - 1}
                          onClick={() => swapCarriages(idx, idx + 1)}
                        >
                          ▶
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Actual Big Carriage Sprite */}
                  <div className="sort-carriage-sprite-frame">
                    <img
                      src={spec.carriage}
                      alt={`Carriage ${c.destination}`}
                      className="train-sprite-img"
                    />

                    {/* Color Belt / Waistline Stripe */}
                    <div
                      className="sort-carriage-color-belt"
                      style={{
                        backgroundColor: c.colorHex,
                        boxShadow: `0 0 10px ${c.colorHex}`,
                      }}
                    >
                      <span className="color-belt-name">{c.colorName}</span>
                    </div>

                    {/* Carriage Route Plate & Metrics */}
                    <div className={`sort-carriage-plate era-${era}`}>
                      <div className="plate-header-line">
                        <span className="plate-carriage-id">COACH #{c.num}</span>
                        <span className="plate-carriage-weight">⚖ {c.weightTons}t</span>
                      </div>

                      {/* Destination LED */}
                      <div className="plate-destination-led">
                        {c.destination}
                      </div>

                      {/* Windows Metric */}
                      <div className="plate-footer-line">
                        <span className="plate-windows-tag">
                          🪟 {c.windowCount} {c.windowCount === 1 ? 'WINDOW' : 'WINDOWS'}
                        </span>
                        <span className="plate-slot-target-tag">
                          {isCorrectSlot ? 'LOCKED ✓' : 'TAP TO SWAP'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  },
};

