const CONFETTI_COLORS = ['#4ade80', '#ffd445', '#3aa0e0', '#ff5de0', '#4ff0ff', '#ef4444', '#f59e0b'];

const CONFETTI_PIECES = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  left: (i * 17 + 7) % 100,
  delay: ((i * 0.13) % 1.5).toFixed(2),
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  size: 4 + ((i * 3) % 8),
}));

export function WinScreen() {
  return (
    <div className="win-overlay">
      <div className="confetti-container">
        {CONFETTI_PIECES.map((c) => (
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
      <div className="win-title">ACCESS GRANTED</div>
      <div className="win-subtitle">
        Passcode 072516 Accepted — Human Verification Complete!
      </div>
    </div>
  );
}
