import { useEffect, useRef, useState, useCallback } from 'react';
import { ANIMATION } from '../game/config';
import type { UiMode } from '../game/state';
import presentBg from '../assets/pixel_bg_1280x720.png';

interface GameOverlayProps {
  uiMode: UiMode;
  inputRect: DOMRect | null;
  onExpandComplete: () => void;
  onCollapseComplete: () => void;
  onSolve: () => void;
}

export function GameOverlay({
  uiMode,
  inputRect,
  onExpandComplete,
  onCollapseComplete,
  onSolve,
}: GameOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [animProgress, setAnimProgress] = useState(0); // 0 = collapsed, 1 = expanded
  const [showContent, setShowContent] = useState(false);
  const animFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  // Recompute the input rect for collapse (Section 9.5 step 2)
  const getInputRect = useCallback((): DOMRect => {
    const input = document.getElementById('password-field');
    if (input) {
      return input.getBoundingClientRect();
    }
    // fallback to stored rect
    return inputRect || new DOMRect(
      window.innerWidth / 2 - 200,
      window.innerHeight / 2 - 24,
      400,
      48
    );
  }, [inputRect]);

  // EXPAND animation
  useEffect(() => {
    if (uiMode !== 'EXPANDING' || !inputRect) return;

    document.body.classList.add('scroll-locked');
    setShowContent(false);
    setAnimProgress(0);

    const duration = ANIMATION.EXPAND_DURATION_MS;
    startTimeRef.current = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const rawProgress = Math.min(elapsed / duration, 1);

      // Apply the cubic-bezier easing approximation
      const progress = easeOutExpo(rawProgress);
      setAnimProgress(progress);

      // Show game content in the last 40% of animation
      if (rawProgress > 0.6 && !showContent) {
        setShowContent(true);
      }

      if (rawProgress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        setAnimProgress(1);
        setShowContent(true);
        onExpandComplete();
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uiMode]);

  // COLLAPSE animation
  useEffect(() => {
    if (uiMode !== 'COLLAPSING') return;

    setShowContent(false);
    const duration = ANIMATION.COLLAPSE_DURATION_MS;
    startTimeRef.current = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const rawProgress = Math.min(elapsed / duration, 1);
      const progress = 1 - easeOutExpo(rawProgress);

      setAnimProgress(progress);

      if (rawProgress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        setAnimProgress(0);
        document.body.classList.remove('scroll-locked');
        onCollapseComplete();
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uiMode]);

  // Handle reduced motion
  useEffect(() => {
    if (uiMode === 'EXPANDING') {
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReduced) {
        document.body.classList.add('scroll-locked');
        setAnimProgress(1);
        setShowContent(true);
        onExpandComplete();
      }
    }
    if (uiMode === 'COLLAPSING') {
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReduced) {
        setAnimProgress(0);
        setShowContent(false);
        document.body.classList.remove('scroll-locked');
        onCollapseComplete();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uiMode]);

  // Don't render if fully collapsed
  if (uiMode === 'COLLAPSED') return null;

  const rect = inputRect || new DOMRect(
    window.innerWidth / 2 - 200,
    window.innerHeight / 2 - 24,
    400,
    48
  );

  // For collapse, recompute the target rect
  const targetRect = uiMode === 'COLLAPSING' ? getInputRect() : rect;

  // Interpolate between input rect and full viewport
  const currentTop = lerp(targetRect.top, 0, animProgress);
  const currentLeft = lerp(targetRect.left, 0, animProgress);
  const currentWidth = lerp(targetRect.width, window.innerWidth, animProgress);
  const currentHeight = lerp(targetRect.height, window.innerHeight, animProgress);
  const currentBorderRadius = lerp(10, 0, animProgress);

  // Cross-fade: plain style → pixel style in the first 40%
  const pixelStyleOpacity = Math.min(animProgress / 0.4, 1);
  const plainStyleOpacity = 1 - pixelStyleOpacity;

  // Background fade-in in the last 40%
  const bgOpacity = Math.max((animProgress - 0.6) / 0.4, 0);

  const overlayStyle: React.CSSProperties = {
    top: currentTop,
    left: currentLeft,
    width: currentWidth,
    height: currentHeight,
    borderRadius: currentBorderRadius,
    background: `rgba(20, 18, 46, ${pixelStyleOpacity})`,
    willChange: 'top, left, width, height',
  };

  // During animation — show a transitioning input field
  const isAnimating = uiMode === 'EXPANDING' || uiMode === 'COLLAPSING';

  return (
    <div
      ref={overlayRef}
      className={`game-overlay ${isAnimating ? 'animating' : 'expanded'}`}
      style={uiMode === 'EXPANDED' ? undefined : overlayStyle}
    >
      {/* Animated input field during transition */}
      {isAnimating && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: `min(90%, ${lerp(targetRect.width, 480, animProgress)}px)`,
            zIndex: 15,
          }}
        >
          {/* Plain style input (fading out) */}
          <div
            style={{
              opacity: plainStyleOpacity,
              position: 'absolute',
              width: '100%',
              top: 0,
            }}
          >
            <div
              style={{
                height: 48,
                background: '#ffffff',
                border: '1.5px solid #d1d5db',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                padding: '0 16px',
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: 16,
                color: '#9ca3af',
              }}
            >
              Enter password
            </div>
          </div>

          {/* Pixel style input (fading in) */}
          <div
            style={{
              opacity: pixelStyleOpacity,
              width: '100%',
            }}
          >
            <div
              style={{
                height: 52,
                background: 'rgba(255,255,255,0.06)',
                border: '4px solid #3aa0e0',
                boxShadow: '4px 4px 0 rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                padding: '0 16px',
                fontFamily: "'Press Start 2P', monospace",
                fontSize: 10,
                color: 'rgba(244, 234, 210, 0.3)',
                letterSpacing: 2,
              }}
            >
              ENTER CODE...
            </div>
          </div>
        </div>
      )}

      {/* Full expanded game layout */}
      {uiMode === 'EXPANDED' && (
        <>
          {/* Warning banner */}
          <div className="warning-banner">
            ⚠ DON'T USE A REAL PASSWORD — THIS IS A GAME ⚠
          </div>

          {/* Game panel (top) */}
          <div className={`game-panel ${showContent ? 'visible' : ''}`}>
            <div className="game-input-wrapper">
              <input
                type="text"
                className="game-input"
                placeholder="ENTER CODE..."
                autoFocus
                id="game-input-field"
              />
            </div>

            {/* Temporary Solve button (Stage 1 only) */}
            <button className="solve-btn" onClick={onSolve}>
              ▶ SOLVE
            </button>
          </div>

          {/* Scene (bottom) */}
          <div className={`scene-container ${showContent ? 'visible' : ''}`}>
            <div
              className="scene-bg"
              style={{
                backgroundImage: `url(${presentBg})`,
                opacity: bgOpacity,
              }}
            />
          </div>
        </>
      )}

      {/* Background fade during animation */}
      {isAnimating && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${presentBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center bottom',
            imageRendering: 'pixelated' as React.CSSProperties['imageRendering'],
            opacity: bgOpacity,
            zIndex: 1,
          }}
        />
      )}
    </div>
  );
}

/** Linear interpolation */
function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/** Exponential ease-out (close to cubic-bezier(0.22, 1, 0.36, 1)) */
function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}
