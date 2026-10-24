import type { Era, TrainPhase } from '../game/state';
import { getCarriageCluesForEra } from '../game/levels';

import enginePast from '../assets/engine_past.png';
import carriagePast from '../assets/carriage_past.png';
import enginePresent from '../assets/engine_present.png';
import carriagePresent from '../assets/carriage_present.png';
import engineFuture from '../assets/engine_future.png';
import carriageFuture from '../assets/carriage_future.png';

interface TrainProps {
  era: Era;
  phase: TrainPhase;
  activeStage: 0 | 1 | 2;
  solvedStages: [boolean, boolean, boolean];
  stageWidth: number;
}

const TRAIN_DATA = {
  past: {
    engine: enginePast,
    carriage: carriagePast,
    engineAspect: 126 / 56, // ~2.25
    carriageAspect: 1009 / 421, // ~2.40
    carriageHeight: 240,
    engineHeight: 330, // scaled so steam cab matches carriage roof height including smoke
    couplerOverlap: 28, // overlap bumper platforms flush
    trackBottomPercent: 24.8,
  },
  present: {
    engine: enginePresent,
    carriage: carriagePresent,
    engineAspect: 117 / 59, // ~1.98
    carriageAspect: 955 / 386, // ~2.47
    carriageHeight: 250,
    engineHeight: 250,
    couplerOverlap: 6, // overlap gangway rubber bellows flush
    trackBottomPercent: 24.8,
  },
  future: {
    engine: engineFuture,
    carriage: carriageFuture,
    engineAspect: 124 / 80, // ~1.55
    carriageAspect: 1010 / 601, // ~1.68
    carriageHeight: 250,
    engineHeight: 250,
    couplerOverlap: 12, // overlap maglev couplers flush
    trackBottomPercent: 24.8,
  },
};

export function Train({
  era,
  phase,
  activeStage,
  solvedStages,
  stageWidth,
}: TrainProps) {
  const data = TRAIN_DATA[era] || TRAIN_DATA.present;
  const clues = getCarriageCluesForEra(era);

  const carriageH = data.carriageHeight;
  const engineH = data.engineHeight;
  const engineW = Math.round(engineH * data.engineAspect);
  const carriageW = Math.round(carriageH * data.carriageAspect);
  const overlap = data.couplerOverlap;

  // Horizontal position to center the active carriage on screen
  // Car 0 starts at (engineW - overlap)
  // Car 1 starts at (engineW - overlap) + (carriageW - overlap)
  // Car 2 starts at (engineW - overlap) + (carriageW - overlap) * 2
  const carriageCenterOffsets = [
    engineW - overlap + carriageW / 2,
    engineW - overlap + (carriageW - overlap) + carriageW / 2,
    engineW - overlap + (carriageW - overlap) * 2 + carriageW / 2,
  ];

  const screenCenterX = stageWidth / 2;
  const targetX = screenCenterX - carriageCenterOffsets[activeStage];

  const transformStyle =
    phase === 'DEPARTING'
      ? `translateX(-3800px)`
      : `translateX(${targetX}px)`;

  const transitionStyle =
    phase === 'DEPARTING'
      ? 'transform 1.8s cubic-bezier(0.4, 0, 1, 1)'
      : 'transform 0.85s cubic-bezier(0.22, 1, 0.36, 1)';

  return (
    <div
      className={`train-container era-${era} phase-${phase}`}
      style={{
        position: 'absolute',
        bottom: `${data.trackBottomPercent}%`,
        left: 0,
        height: Math.max(engineH, carriageH),
        display: 'flex',
        alignItems: 'flex-end',
        transform: transformStyle,
        transition: transitionStyle,
        zIndex: 10,
        pointerEvents: 'auto',
      }}
    >
      {/* 1. Locomotive Engine */}
      <div
        className="train-car train-engine"
        style={{
          width: engineW,
          height: engineH,
          position: 'relative',
          flexShrink: 0,
          zIndex: 12,
        }}
      >
        <img
          src={data.engine}
          alt={`${era} locomotive engine`}
          className="train-sprite-img"
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
            imageRendering: 'pixelated',
          }}
        />
      </div>

      {/* 2. Carriages (1, 2, 3) coupled tightly flush */}
      {[0, 1, 2].map((idx) => {
        const isSolved = solvedStages[idx];
        const isActive = activeStage === idx && !isSolved && phase === 'DOCKED';
        const clue = clues[idx];

        return (
          <div
            key={idx}
            className={`train-car train-carriage car-unit-${idx + 1} ${isActive ? 'is-active' : ''} ${
              isSolved ? 'is-solved' : ''
            }`}
            style={{
              width: carriageW,
              height: carriageH,
              position: 'relative',
              marginLeft: -overlap,
              flexShrink: 0,
              zIndex: 10 - idx,
            }}
          >
            {/* Floating Active Marker above carriage roof in the sky */}
            {isActive && (
              <div className="active-carriage-marker">
                <span className="marker-arrow">▼</span>
                <span className="marker-text">ACTIVE CARRIAGE {idx + 1}</span>
              </div>
            )}

              {/* Carriage Sprite Image */}
              <img
                src={data.carriage}
                alt={`${era} carriage ${idx + 1}`}
                className="train-sprite-img"
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'block',
                  imageRendering: 'pixelated',
                }}
              />

              {/* Integrated Clue Plate on carriage body side panel */}
              <div
                className={`carriage-clue-plate era-${era} ${
                  isActive ? 'active' : isSolved ? 'solved' : 'locked'
                }`}
              >
                <div className="plate-top-row">
                  <span className="plate-car-tag">CAR {idx + 1}</span>
                  <span className="plate-status-tag">
                    {isSolved ? '✓ SOLVED' : isActive ? '● ACTIVE' : '🔒 LOCKED'}
                  </span>
                </div>

                <div className="plate-clue-text">{clue.title}</div>
                <div className="plate-clue-sub">{clue.hint}</div>
              </div>
            </div>
        );
      })}
    </div>
  );
}
