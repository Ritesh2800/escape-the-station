import { useState, useEffect, useRef } from 'react';
import type { Era, TrainPhase } from '../game/state';
import type { ClueDefinition } from '../game/levels';
import { sound } from '../game/audio';

interface ClueHotspotProps {
  clue: ClueDefinition;
  era: Era;
  trainPhase: TrainPhase;
  isOpen: boolean;
  onOpen: (id: string) => void;
  onClose: () => void;
}

export function ClueHotspot({ clue, era, trainPhase, isOpen, onOpen, onClose }: ClueHotspotProps) {
  const [typedText, setTypedText] = useState('');
  const timerRef = useRef<number>(0);

  // Only show hotspot if it belongs to current era
  if (clue.era !== era) return null;

  const handleClick = () => {
    sound.playClick(1.1);
    if (isOpen) {
      onClose();
      return;
    }

    if (clue.requiresDocked && trainPhase !== 'DOCKED') {
      // Show "train is gone" message
      onOpen(clue.id);
      return;
    }

    onOpen(clue.id);
  };

  // Typewriter effect for popup text
  useEffect(() => {
    if (!isOpen) {
      setTypedText('');
      return;
    }

    const fullText = clue.requiresDocked && trainPhase !== 'DOCKED'
      ? 'The train is gone. Wait for the next one.'
      : clue.text;

    let idx = 0;
    setTypedText('');

    const type = () => {
      if (idx < fullText.length) {
        setTypedText(fullText.substring(0, idx + 1));
        if (idx % 2 === 0) sound.playClueType();
        idx++;
        timerRef.current = window.setTimeout(type, 25);
      }
    };
    type();

    return () => {
      clearTimeout(timerRef.current);
    };
  }, [isOpen, clue.text, clue.requiresDocked, trainPhase]);

  // Position popup to the right of hotspot, or left if near right edge
  const popupLeft = clue.x > 0.7 ? 'auto' : '36px';
  const popupRight = clue.x > 0.7 ? '36px' : 'auto';

  return (
    <div
      className="clue-hotspot"
      style={{
        left: `${clue.x * 100}%`,
        top: `${clue.y * 100}%`,
      }}
      onClick={handleClick}
      title={clue.label}
    >
      <span className="clue-hotspot-sparkle">✦</span>

      {isOpen && (
        <div
          className={`clue-popup era-${era}`}
          style={{ left: popupLeft, right: popupRight, top: '-10px' }}
          onClick={(e) => e.stopPropagation()}
        >
          <button className="clue-popup-close" onClick={onClose}>✕</button>
          <div style={{ marginTop: 8 }}>
            <strong>{clue.label}</strong>
            <br />
            {typedText}
            <span style={{ opacity: 0.4 }}>|</span>
          </div>
        </div>
      )}
    </div>
  );
}
