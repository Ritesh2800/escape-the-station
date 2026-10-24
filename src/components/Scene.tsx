import { useMemo } from 'react';
import type { Era } from '../game/types';
import bgPast from '../assets/pixel_bg_past_1280x720.png';
import bgPresent from '../assets/pixel_bg_1280x720.png';
import bgFuture from '../assets/pixel_bg_future_1280x720.png';

interface SceneProps {
  era: Era;
  stationBoardText?: string | null;
  children?: React.ReactNode;
}

export function Scene({ era, stationBoardText, children }: SceneProps) {
  const bgImage = useMemo(() => {
    switch (era) {
      case 'past':
        return bgPast;
      case 'future':
        return bgFuture;
      case 'present':
      default:
        return bgPresent;
    }
  }, [era]);

  return (
    <div className="scene-container">
      {/* Full-screen stage filling 100% of viewport with zero black bars */}
      <div
        className="scene-stage"
        style={{
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor:
            era === 'past'
              ? '#2c1e14'
              : era === 'future'
              ? '#0d0722'
              : '#0f172a',
          backgroundImage: `url(${bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center bottom',
          imageRendering: 'pixelated',
          overflow: 'hidden',
        }}
      >
        {/* Station Name Board Text Overlay (anchored over station signboard at x: 88-248, y: 270-298 in 1280x720 space) */}
        {stationBoardText && (
          <div className="station-signboard-overlay">
            <span className="signboard-text">{stationBoardText}</span>
          </div>
        )}

        {children}
      </div>
    </div>
  );
}
