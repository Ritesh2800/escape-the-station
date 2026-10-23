import { useEffect, useRef, useState, useMemo } from 'react';
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 1280,
    height: 720,
  });

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

  // Keep stage 16:9, anchored to bottom (never crop platform and tracks, crop sky first)
  useEffect(() => {
    if (!containerRef.current) return;

    const updateSize = () => {
      if (!containerRef.current) return;
      const { clientWidth, clientHeight } = containerRef.current;
      if (clientWidth === 0 || clientHeight === 0) return;

      const targetRatio = 16 / 9;
      const containerRatio = clientWidth / clientHeight;

      let stageW: number;
      let stageH: number;

      if (containerRatio > targetRatio) {
        // Container is wider than 16:9 -> fill width, height extends upwards (sky cropped)
        stageW = clientWidth;
        stageH = clientWidth / targetRatio;
      } else {
        // Container is taller than 16:9 -> fill height, width extends horizontally
        stageH = clientHeight;
        stageW = clientHeight * targetRatio;
      }

      setDimensions({ width: stageW, height: stageH });
    };

    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);
    window.addEventListener('resize', updateSize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  return (
    <div ref={containerRef} className="scene-container">
      {/* 16:9 Stage anchored to bottom */}
      <div
        className={`scene-stage ${isGlitching ? 'glitch-active' : ''}`}
        style={{
          width: dimensions.width,
          height: dimensions.height,
          left: '50%',
          transform: 'translateX(-50%)',
          bottom: 0,
          position: 'absolute',
          backgroundImage: `url(${bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center bottom',
          imageRendering: 'pixelated',
        }}
      >
        {children}
      </div>
    </div>
  );
}
