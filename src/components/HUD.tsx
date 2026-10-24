import { useState } from 'react';
import type { Era } from '../game/state';
import { ERA_INFO } from '../game/config';
import { sound } from '../game/audio';

interface HUDProps {
  era: Era;
  timeLeft: number;
  activeStage: 0 | 1 | 2;
  isDeparting?: boolean;
  onExit?: () => void;
}

export function HUD({
  era,
  timeLeft,
  activeStage,
  isDeparting = false,
  onExit,
}: HUDProps) {
  const [muted, setMuted] = useState(sound.getMuted());
  const info = ERA_INFO[era];
  const isUrgent = timeLeft <= 10 && !isDeparting;

  const handleToggleSound = () => {
    const isNowMuted = sound.toggleMute();
    setMuted(isNowMuted);
    if (!isNowMuted) {
      sound.playClick(1.2);
    }
  };

  return (
    <div className="hud-bar-container">
      {/* 1. Timeline / Era Badge */}
      <div className={`hud-era-badge era-${era}`}>
        <span className="era-dot" />
        <span className="era-text">
          {info.label} · {info.name.toUpperCase()}
        </span>
      </div>

      {/* 2. 30s Countdown Timer */}
      <div
        className={`hud-countdown-badge ${
          isDeparting ? 'departing' : isUrgent ? 'urgent' : 'normal'
        }`}
      >
        <span className="timer-icon">{isDeparting ? '🚂' : isUrgent ? '⚠' : '⏳'}</span>
        <span className="timer-seconds">
          {isDeparting ? 'DEPARTED' : `${timeLeft}s`}
        </span>
      </div>

      {/* 3. Carriage Stage Indicator */}
      <div className="hud-stage-badge">
        <span>CAR {activeStage + 1}/3</span>
      </div>

      {/* 4. Controls */}
      <div className="hud-actions">
        <button
          type="button"
          onClick={handleToggleSound}
          className="hud-control-btn sound-btn"
          title={muted ? 'Unmute Audio' : 'Mute Audio'}
        >
          {muted ? '🔇' : '🔊'}
        </button>

        {onExit && (
          <button
            type="button"
            onClick={onExit}
            className="hud-control-btn exit-btn"
            title="Return to Login (ESC)"
          >
            ✕ ESC
          </button>
        )}
      </div>
    </div>
  );
}
