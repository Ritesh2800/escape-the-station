import { useState } from 'react';
import type { Era } from '../game/types';
import { sound } from '../game/audio';

interface HUDProps {
  era: Era;
  gameTitle: string;
  gameGoal: string;
  selectedGame: string;
  onSelectGame: (id: string) => void;
  lives: number | null;
  timeLeft: number;
  seed: number;
  statusText?: string;
  onExit?: () => void;
}

export function HUD({
  era,
  gameTitle,
  gameGoal,
  selectedGame,
  onSelectGame,
  lives,
  timeLeft,
  seed,
  statusText,
  onExit,
}: HUDProps) {
  const [muted, setMuted] = useState(sound.getMuted());
  const isUrgent = timeLeft <= 10;

  const handleToggleSound = () => {
    const isNowMuted = sound.toggleMute();
    setMuted(isNowMuted);
    if (!isNowMuted) {
      sound.playClick(1.2);
    }
  };

  return (
    <div className="hud-wrapper">
      {/* Top Header Bar */}
      <div className="hud-bar-container">
        {/* Left: Era + Game Title */}
        <div className="hud-left-group">
          <div className={`hud-era-badge era-${era}`}>
            <span className="era-dot" />
            <span className="era-text">{era.toUpperCase()}</span>
          </div>
          <div className="hud-title-badge">
            <span className="title-text">{gameTitle}</span>
          </div>
        </div>

        {/* Center: 30s Countdown Timer Bar */}
        <div className="hud-center-group">
          <div
            className={`hud-countdown-badge ${
              timeLeft <= 5 ? 'critical' : isUrgent ? 'urgent' : 'normal'
            }`}
          >
            <span className="timer-icon">⏳</span>
            <span className="timer-seconds">{timeLeft}s</span>
            <div className="timer-bar-track">
              <div
                className="timer-bar-fill"
                style={{ width: `${Math.max(0, (timeLeft / 30) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right: Lives Hearts + Game Selector Dropdown + Controls */}
        <div className="hud-right-group">
          {/* Lives (Pixel Hearts) */}
          {lives !== null && (
            <div className="hud-lives-badge">
              {[1, 2, 3].map((heart) => (
                <span
                  key={heart}
                  className={`heart-icon ${heart <= lives ? 'heart-full' : 'heart-empty'}`}
                >
                  {heart <= lives ? '♥' : '♡'}
                </span>
              ))}
            </div>
          )}

          {/* Game Selector Dropdown */}
          <div className="game-selector-dropdown-wrap">
            <span className="dropdown-label">GAME:</span>
            <select
              value={selectedGame}
              onChange={(e) => onSelectGame(e.target.value)}
              className="game-selector-select"
            >
              <option value="random">Random (default)</option>
              <option value="pin">PIN Decoder</option>
              <option value="impostor">Impostor Carriage</option>
              <option value="sort">Sort the Train</option>
              <option value="robots">Spot the Robots</option>
              <option value="lockpick">Lock-Pick Dial</option>
            </select>
          </div>

          {/* Audio toggle */}
          <button
            type="button"
            onClick={handleToggleSound}
            className="hud-control-btn sound-btn"
            title={muted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {muted ? '🔇' : '🔊'}
          </button>

          {/* Exit / ESC */}
          {onExit && (
            <button
              type="button"
              onClick={onExit}
              className="hud-control-btn exit-btn"
              title="Return to CAPTCHA (ESC)"
            >
              ✕ ESC
            </button>
          )}
        </div>
      </div>

      {/* Sub-bar: Goal line & Station Board / Status Info */}
      <div className="hud-goal-bar">
        <span className="goal-text">🎯 GOAL: {gameGoal}</span>
        {statusText && <span className="status-extra-text">[{statusText}]</span>}
        <span className="seed-text">seed: {seed}</span>
      </div>
    </div>
  );
}
