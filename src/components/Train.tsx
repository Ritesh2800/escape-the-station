import type { Era, TrainPhase } from '../game/state';
import { TRAIN, TRAIN_ERA_COLORS, ZONES } from '../game/config';

interface TrainProps {
  era: Era;
  phase: TrainPhase;
  timeLeft: number;
  stageWidth: number;
  stageHeight: number;
}

export function Train({ era, phase, timeLeft, stageWidth, stageHeight }: TrainProps) {
  const colors = TRAIN_ERA_COLORS[era];
  const engineW = TRAIN.ENGINE_W;
  const carriageW = TRAIN.CARRIAGE_W;
  const carriageCount = TRAIN.CARRIAGE_COUNT;
  const totalW = engineW + carriageW * carriageCount;
  const trainH = TRAIN.ENGINE_H;

  // Track position (Section 3.1)
  const trackY = stageHeight * ZONES.TRACK_Y_START;
  const trainTop = trackY - trainH + 10;

  // Calculate X position based on phase
  const dockX = stageWidth * ZONES.TRAIN_DOCK_X;
  let trainX: number;

  const phaseDuration = {
    ARRIVING: TRAIN.ARRIVE_MS,
    DOCKED: TRAIN.DOCKED_MS,
    DEPARTING: TRAIN.DEPART_MS,
    EMPTY: TRAIN.EMPTY_MS,
  }[phase];

  const progress = 1 - timeLeft / phaseDuration;

  switch (phase) {
    case 'ARRIVING':
      // Slide in from right edge to dock position
      trainX = stageWidth + totalW - (stageWidth + totalW - dockX) * progress;
      break;
    case 'DOCKED':
      trainX = dockX;
      break;
    case 'DEPARTING':
      // Slide out to left
      trainX = dockX - (dockX + totalW + 50) * progress;
      break;
    case 'EMPTY':
    default:
      return null; // No train visible
  }

  return (
    <div
      className="train-sprite"
      style={{
        left: trainX,
        top: trainTop,
        height: trainH,
      }}
    >
      {/* Engine */}
      <div
        className="train-car train-car-rect"
        style={{
          width: engineW,
          height: trainH,
          background: colors.engine,
          borderRadius: '4px 8px 2px 2px',
        }}
      >
        {/* Windows */}
        <div style={{
          position: 'absolute', top: 8, left: 8, right: 8, height: 12,
          display: 'flex', gap: 4,
        }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              flex: 1, background: 'rgba(180,220,255,.7)', border: '1px solid rgba(0,0,0,.3)',
            }} />
          ))}
        </div>
        {/* Wheels */}
        <div style={{
          position: 'absolute', bottom: -4, left: 8, display: 'flex', gap: 12,
        }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 10, height: 10, borderRadius: '50%', background: '#333',
              border: '2px solid #666',
            }} />
          ))}
        </div>
      </div>

      {/* Carriages */}
      {Array.from({ length: carriageCount }, (_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'flex-end' }}>
          {/* Coupling */}
          <div style={{ width: 4, height: 6, background: '#555', alignSelf: 'center' }} />
          <div
            className="train-car train-car-rect"
            style={{
              width: carriageW - 4,
              height: trainH - 5,
              background: colors.carriage,
              borderRadius: '2px',
              position: 'relative',
            }}
          >
            {/* Carriage windows */}
            <div style={{
              position: 'absolute', top: 6, left: 4, right: 4, height: 10,
              display: 'flex', gap: 3,
            }}>
              {[0, 1, 2].map(j => (
                <div key={j} style={{
                  flex: 1, background: 'rgba(180,220,255,.5)', border: '1px solid rgba(0,0,0,.2)',
                }} />
              ))}
            </div>
            {/* Wheels */}
            <div style={{
              position: 'absolute', bottom: -4, left: 6, display: 'flex', gap: 10,
            }}>
              {[0, 1].map(j => (
                <div key={j} style={{
                  width: 8, height: 8, borderRadius: '50%', background: '#333',
                  border: '2px solid #666',
                }} />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
