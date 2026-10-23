import type { Era } from '../game/state';

interface EraToggleProps {
  era: Era;
  locked: boolean;
  onChange: (era: Era) => void;
}

const ERAS: { key: Era; label: string }[] = [
  { key: 'past', label: '1890' },
  { key: 'present', label: 'NOW' },
  { key: 'future', label: '2080' },
];

export function EraToggle({ era, locked, onChange }: EraToggleProps) {
  return (
    <div className="era-toggle">
      {ERAS.map((e) => (
        <button
          key={e.key}
          className={`era-toggle-btn ${e.key} ${era === e.key ? 'active' : ''}`}
          disabled={locked && e.key !== 'present'}
          onClick={() => onChange(e.key)}
        >
          {e.label}
        </button>
      ))}
    </div>
  );
}
