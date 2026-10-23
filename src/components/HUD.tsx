import type { TrainPhase } from '../game/state';
import { sound } from '../game/audio';
import { useState } from 'react';

interface HUDProps {
  phase: TrainPhase;
  timeLeft: number;
  level: 1 | 2;
  rulePassCount?: number;
  ruleTotalCount?: number;
}

export function HUD({ phase, timeLeft, level, rulePassCount = 0, ruleTotalCount = 0 }: HUDProps) {
  const seconds = Math.ceil(timeLeft / 1000);
  const [muted, setMuted] = useState(sound.getMuted());

  const handleToggleSound = () => {
    const isNowMuted = sound.toggleMute();
    setMuted(isNowMuted);
    if (!isNowMuted) {
      sound.playClick(1.2);
    }
  };

  return (
    <div className="hud-bar">
      <span className="level-indicator">LVL {level}/2</span>
      <span className={`hud-phase ${phase}`}>{phase}</span>
      {phase !== 'EMPTY' && (
        <span className={`hud-countdown ${phase === 'DEPARTING' ? 'departing' : phase === 'DOCKED' ? 'docked' : ''}`}>
          {seconds}s
        </span>
      )}
      {level === 2 && (
        <span className="rule-counter">RULES {rulePassCount}/{ruleTotalCount}</span>
      )}
      <button
        onClick={handleToggleSound}
        className="sound-toggle-btn"
        title={muted ? 'Unmute 8-Bit Audio' : 'Mute 8-Bit Audio'}
        style={{
          background: muted ? 'rgba(255,82,82,.2)' : 'rgba(74,222,128,.2)',
          border: `1.5px solid ${muted ? '#ff5252' : '#4ade80'}`,
          color: muted ? '#ff5252' : '#4ade80',
          fontFamily: 'var(--font-pixel)',
          fontSize: '9px',
          padding: '4px 8px',
          borderRadius: '4px',
          cursor: 'pointer',
          marginLeft: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        {muted ? '🔇 OFF' : '🔊 8-BIT'}
      </button>
    </div>
  );
}
