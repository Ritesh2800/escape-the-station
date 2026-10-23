import { sound } from '../game/audio';

interface KeypadProps {
  value: string;
  maxLength: number;
  onChange: (value: string) => void;
}

export function Keypad({ value, maxLength, onChange }: KeypadProps) {
  const handleDigit = (d: string) => {
    if (value.length < maxLength) {
      sound.playClick(1.0 + parseInt(d, 10) * 0.05);
      onChange(value + d);
    }
  };

  const handleBackspace = () => {
    sound.playClick(0.7);
    onChange(value.slice(0, -1));
  };

  // Also listen for keyboard
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (/^[0-9]$/.test(e.key) && value.length < maxLength) {
      sound.playClick(1.0 + parseInt(e.key, 10) * 0.05);
      onChange(value + e.key);
    } else if (e.key === 'Backspace') {
      handleBackspace();
    }
  };

  return (
    <div onKeyDown={handleKeyDown} tabIndex={0} style={{ outline: 'none' }}>
      <div className="keypad-digits">
        {value || '\u00A0'}
        <span style={{ opacity: 0.3 }}>{'_'.repeat(Math.max(0, maxLength - value.length))}</span>
      </div>
      <div className="keypad-container">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <button key={n} className="keypad-btn" onClick={() => handleDigit(String(n))}>
            {n}
          </button>
        ))}
        <button className="keypad-btn" onClick={() => handleDigit('0')}>0</button>
        <button className="keypad-btn backspace" onClick={handleBackspace}>⌫ DEL</button>
      </div>
    </div>
  );
}
