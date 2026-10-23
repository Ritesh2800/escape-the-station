import { useMemo } from 'react';

interface WinScreenProps {
  level: 1 | 2;
}

const CONFETTI_COLORS = ['#4ade80', '#ffd445', '#3aa0e0', '#ff5de0', '#4ff0ff', '#ef4444', '#f59e0b'];

export function WinScreen({ level }: WinScreenProps) {
  const confetti = useMemo(() => {
    return Array.from({ length: 40 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 1.5,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size: 4 + Math.random() * 8,
    }));
  }, []);

  return (
    <div className="win-overlay">
      <div className="confetti-container">
        {confetti.map((c) => (
          <div
            key={c.id}
            className="confetti-piece"
            style={{
              left: `${c.left}%`,
              animationDelay: `${c.delay}s`,
              background: c.color,
              width: c.size,
              height: c.size,
            }}
          />
        ))}
      </div>
      <div className="win-title">
        {level === 1 ? 'ACCESS GRANTED' : 'VAULT OPEN'}
      </div>
      <div className="win-subtitle">
        {level === 1
          ? 'Door unlocked — Chrono-Shift Device coming online...'
          : 'Password cracked — you escaped the station!'}
      </div>
    </div>
  );
}
