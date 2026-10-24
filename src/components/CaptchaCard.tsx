import { useRef, useState } from 'react';

interface CaptchaCardProps {
  solved: boolean;
  solveDurationSeconds?: number;
  onExpand: (rect: DOMRect) => void;
  onReset: () => void;
}

export function CaptchaCard({
  solved,
  solveDurationSeconds = 0,
  onExpand,
  onReset,
}: CaptchaCardProps) {
  const captchaBoxRef = useRef<HTMLDivElement>(null);
  const [isActivating, setIsActivating] = useState(false);

  const handleCaptchaClick = () => {
    if (solved || isActivating) return;

    if (captchaBoxRef.current) {
      setIsActivating(true);
      const rect = captchaBoxRef.current.getBoundingClientRect();
      onExpand(rect);
      setTimeout(() => setIsActivating(false), 500);
    }
  };

  return (
    <div className="collapsed-page">
      <div className="captcha-only-container">
        {/* Main CAPTCHA Box */}
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
                {solved ? "I'm not a robot" : "I'm not a robot"}
              </span>
              <span className="captcha-hint-text">
                {solved
                  ? `Verified human in ${solveDurationSeconds.toFixed(1)} s`
                  : 'Station Security · Click to verify'}
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

        {/* Small persistent disclaimer required by spec */}
        <div className="captcha-disclaimer-note">
          This is a game. No real security.
        </div>

        {/* Reset link when solved */}
        {solved && (
          <button className="play-again-link" onClick={onReset} type="button">
            Reset CAPTCHA
          </button>
        )}
      </div>
    </div>
  );
}
