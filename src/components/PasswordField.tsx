import { useRef } from 'react';

interface PasswordFieldProps {
  solved: boolean;
  onExpand: (rect: DOMRect) => void;
  onReset: () => void;
}

export function PasswordField({ solved, onExpand, onReset }: PasswordFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (solved) return;
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      onExpand(rect);
    }
  };

  return (
    <div className="collapsed-page">
      <div className="password-card">
        <h1>Create a password</h1>

        <div className="input-wrapper">
          <input
            ref={inputRef}
            type="password"
            className={`password-input ${solved ? 'verified' : ''}`}
            placeholder="Enter password"
            readOnly
            onClick={handleClick}
            value={solved ? '••••••••••' : ''}
            aria-label="Password input"
            id="password-field"
          />
          <svg
            className="eye-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </div>

        {solved ? (
          <>
            <div className="verified-text">
              <span>✓</span> Password cracked — you beat the station!
            </div>
            <p className="helper-text">
              Reminder: never use a real password in a game.
            </p>
            <button className="play-again" onClick={onReset}>
              Play again
            </button>
          </>
        ) : (
          <p className="helper-text">
            Click the field to start the challenge.<br />
            <strong>Don't use a real password.</strong>
          </p>
        )}
      </div>
    </div>
  );
}
