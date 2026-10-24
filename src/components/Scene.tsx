import { useMemo } from 'react';
import type { Era } from '../game/state';
import bgPast from '../assets/pixel_bg_past_1280x720.png';
import bgPresent from '../assets/pixel_bg_1280x720.png';
import bgFuture from '../assets/pixel_bg_future_1280x720.png';

interface SceneProps {
  era: Era;
  isGlitching?: boolean;
  children?: React.ReactNode;
}

export function Scene({ era, isGlitching = false, children }: SceneProps) {
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
        className={`scene-stage ${isGlitching ? 'glitch-active' : ''}`}
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
        {children}
      </div>
    </div>
  );
}
