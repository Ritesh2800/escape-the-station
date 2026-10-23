import { useEffect, useRef, useState, useCallback } from 'react';
import type { UiMode } from '../game/state';
import { launchPixelTrainTransition, collapsePixelTrainTransition } from './pixelTransition';

interface GameOverlayProps {
  uiMode: UiMode;
  inputRect: DOMRect | null;
  era?: string;
  isGlitching?: boolean;
  onExpandComplete: () => void;
  onCollapseComplete: () => void;
  onSolve: () => void;
  children?: React.ReactNode;
}

export function GameOverlay({
  uiMode,
  onExpandComplete,
  onCollapseComplete,
  children,
}: GameOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [, setContentVisible] = useState(false);
  const isTransitioningRef = useRef(false);

  // EXPAND
  useEffect(() => {
    if (uiMode !== 'EXPANDING' || isTransitioningRef.current) return;
    const inputEl = document.getElementById('password-field');
    const gameEl = overlayRef.current;
    if (!inputEl || !gameEl) return;

    isTransitioningRef.current = true;
    document.body.classList.add('scroll-locked');

    setTimeout(() => setContentVisible(true), 300);

    launchPixelTrainTransition(inputEl, gameEl, () => {
      isTransitioningRef.current = false;
      onExpandComplete();
    });
  }, [uiMode, onExpandComplete]);

  // COLLAPSE
  const handleCollapse = useCallback(() => {
    if (isTransitioningRef.current) return;
    const inputEl = document.getElementById('password-field');
    const gameEl = overlayRef.current;
    if (!inputEl || !gameEl) return;

    isTransitioningRef.current = true;
    setContentVisible(false);

    collapsePixelTrainTransition(inputEl, gameEl, () => {
      document.body.classList.remove('scroll-locked');
      isTransitioningRef.current = false;
      onCollapseComplete();
    });
  }, [onCollapseComplete]);

  useEffect(() => {
    if (uiMode === 'COLLAPSING') handleCollapse();
  }, [uiMode, handleCollapse]);

  if (uiMode === 'COLLAPSED') return null;

  return (
    <div
      ref={overlayRef}
      id="game-overlay"
      className="game-overlay on"
    >
      {children}
    </div>
  );
}
