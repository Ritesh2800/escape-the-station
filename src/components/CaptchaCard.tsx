import { useRef, useState } from 'react';

interface CaptchaCardProps {
  solved: boolean;
  isExpired?: boolean;
  onExpand: (rect: DOMRect) => void;
  onReset: () => void;
}

export function CaptchaCard({ solved, isExpired = false, onExpand, onReset }: CaptchaCardProps) {
  const captchaBoxRef = useRef<HTMLDivElement>(null);
  const [isActivating, setIsActivating] = useState(false);

  const handleCaptchaClick = () => {
    if (solved || isActivating) return;

    if (captchaBoxRef.current) {
      setIsActivating(true);
      const rect = captchaBoxRef.current.getBoundingClientRect();
      onExpand(rect);
      // Reset activating state shortly after transition takes over
      setTimeout(() => setIsActivating(false), 500);
    }
  };

  return (
    <div className="collapsed-page">
      <div className="login-card">
        {/* Header */}
        <div className="login-header">
          <div className="brand-badge">
            <svg
              className="brand-train-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="4" y="3" width="16" height="16" rx="2" />
              <path d="M4 11h16" />
              <path d="M12 3v8" />
              <path d="m8 19-2 3" />
              <path d="m16 19 2 3" />
              <circle cx="8" cy="15" r="1" />
              <circle cx="16" cy="15" r="1" />
            </svg>
            <span>STATION 07 · TRANSIT PORTAL</span>
          </div>
          <h1>Terminal Access</h1>
          <p className="login-subheading">
            Enter credentials and complete human verification to access departure controls.
          </p>
        </div>

        {/* Mock form fields for convincing login UI */}
        <div className="login-form-fields">
          <div className="field-group">
            <label htmlFor="operator-id">Operator ID</label>
            <div className="input-container">
              <input
                id="operator-id"
                type="text"
                readOnly
                value="operator_07@chronorail.net"
                className="mock-input"
              />
              <svg className="field-lock-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
          </div>

          <div className="field-group">
            <label htmlFor="operator-password">Password</label>
            <div className="input-container">
              <input
                id="operator-password"
                type="password"
                readOnly
                value="••••••••••••"
                className="mock-input"
              />
              <svg className="field-lock-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        {/* CAPTCHA Box */}
        <div className="captcha-container">
          <div
            id="captcha-box"
            ref={captchaBoxRef}
            className={`captcha-box ${solved ? 'verified' : ''} ${isActivating ? 'activating' : ''}`}
            onClick={handleCaptchaClick}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleCaptchaClick();
              }
            }}
            role="button"
            tabIndex={0}
            aria-label={solved ? 'Human verification passed' : "Verification: I'm not a robot"}
          >
            <div className="captcha-left">
              <div className={`captcha-checkbox ${solved ? 'checked' : ''} ${isActivating ? 'spinning' : ''}`}>
                {solved ? (
                  <svg
                    className="captcha-check-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#16a34a"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : isActivating ? (
                  <div className="captcha-spinner" />
                ) : null}
              </div>

              <div className="captcha-label-group">
                <span className="captcha-main-text">
                  {solved
                    ? 'Verification Complete'
                    : isExpired
                    ? 'Verification Expired'
                    : "I'm not a robot"}
                </span>
                <span className="captcha-hint-text">
                  {solved
                    ? 'Human operator confirmed'
                    : isExpired
                    ? 'Train departed (30s) · Click to retry'
                    : 'Click to verify'}
                </span>
              </div>
            </div>

            <div className="captcha-right">
              <div className="captcha-brand-logo">
                <svg viewBox="0 0 48 48" className="captcha-svg-icon" fill="none">
                  <path
                    d="M24 4C14.06 4 6 12.06 6 22c0 3.7.12 7.2 3.1 9.9l3.5-3.5c-1.6-1.9-2.6-4.3-2.6-6.4 0-7.73 6.27-14 14-14 5.3 0 9.9 2.94 12.3 7.3L31 20h13V7l-4.7 4.7C35.9 7.3 30.3 4 24 4z"
                    fill="#1A73E8"
                  />
                  <path
                    d="M42 24c0 9.94-8.06 18-18 18-3.7 0-7.2-.12-9.9-3.1l3.5-3.5c1.9 1.6 4.3 2.6 6.4 2.6 7.73 0 14-6.27 14-14 0-5.3-2.94-9.9-7.3-12.3L28 17V4h13l-4.7 4.7C39.7 12.1 42 17.7 42 24z"
                    fill="#4285F4"
                    opacity="0.85"
                  />
                </svg>
              </div>
              <span className="captcha-brand-name">reCAPTCHA</span>
              <span className="captcha-policy-links">Privacy · Terms</span>
            </div>
          </div>
        </div>

        {/* Status / Submit button */}
        {solved ? (
          <div className="login-success-state">
            <div className="verified-badge">
              <span className="badge-icon">✓</span>
              <span>Passcode Verified: Station Escaped!</span>
            </div>
            <button className="login-btn active" type="button">
              Access Terminal
            </button>
            <button className="play-again-link" onClick={onReset} type="button">
              Reset challenge & play again
            </button>
          </div>
        ) : (
          <div className="login-locked-state">
            <button className="login-btn disabled" disabled type="button">
              Sign In (Verification Required)
            </button>
            <p className="login-helper">
              Click the CAPTCHA box to begin verification challenge.<br />
              <strong>Hint: Investigate the station platform, board, and carriage.</strong>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
