import { useCallback, useEffect, useRef, useState } from 'react';
import { CaptchaCard } from './components/CaptchaCard';
import { GameOverlay } from './components/GameOverlay';
import { Scene } from './components/Scene';
import { Train } from './components/Train';
import { HUD } from './components/HUD';
import { Keypad } from './components/Keypad';
import { WinScreen } from './components/WinScreen';
import { useGameState, getRandomEra } from './game/state';
import { useTrainCountdown } from './game/trainLoop';
import { GAME_RULES } from './game/config';
import { sound } from './game/audio';

export default function App() {
  const {
    state,
    dispatch,
    startExpand,
    finishExpand,
    startCollapse,
    finishCollapse,
    solve,
    reset,
  } = useGameState();

  const [showWin, setShowWin] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1280
  );
  const shakeTimeoutRef = useRef<number>(0);

  // Track window resize to center active carriage precisely
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 30-Second Countdown Hook
  const onTick = useCallback(
    (secondsLeft: number) => {
      dispatch({ type: 'SET_TIME_LEFT', timeLeft: secondsLeft });
    },
    [dispatch]
  );

  const onTimeout = useCallback(() => {
    sound.playTrainWhistle();
    sound.startTrainSound();
    dispatch({ type: 'GAME_TIMEOUT' });

    // After train speeds away (1.8s), shrink back to captcha box
    setTimeout(() => {
      sound.stopTrainSound();
      sound.stopBGM();
      startCollapse();
    }, 1800);
  }, [dispatch, startCollapse]);

  const { freeze: freezeCountdown } = useTrainCountdown(
    state.uiMode === 'EXPANDED' && !state.solved,
    onTick,
    onTimeout
  );

  // Expand with randomized era
  const handleExpand = useCallback(
    (rect: DOMRect) => {
      sound.playClick(1.2);
      const randomEra = getRandomEra();
      startExpand(rect, randomEra);
    },
    [startExpand]
  );

  const handleExpandComplete = useCallback(() => {
    finishExpand();
    sound.startBGM();
  }, [finishExpand]);

  const handleCollapseComplete = useCallback(() => {
    sound.stopBGM();
    sound.stopTrainSound();
    finishCollapse();
  }, [finishCollapse]);

  // Shake animation trigger on incorrect input
  const triggerShake = useCallback(() => {
    sound.playError();
    setIsShaking(true);
    clearTimeout(shakeTimeoutRef.current);
    shakeTimeoutRef.current = window.setTimeout(() => {
      setIsShaking(false);
    }, 350);
  }, []);

  // Handle digit entry on active carriage
  const handleDigit = useCallback(
    (digit: string) => {
      if (state.solved || state.isExpired || state.trainPhase === 'DEPARTING') {
        return;
      }

      const currentStage = state.activeStage;
      const currentVal = state.stageValues[currentStage] || '';

      if (currentVal.length >= 2) return;

      const newVal = currentVal + digit;
      dispatch({ type: 'SET_STAGE_INPUT', stage: currentStage, value: newVal });

      // When 2 digits entered, check match against stage target
      if (newVal.length === 2) {
        const target = GAME_RULES.STAGE_TARGETS[currentStage];

        if (newVal === target) {
          // Success!
          sound.playRulePass();
          dispatch({ type: 'STAGE_PASSED', stage: currentStage });

          // If last stage (Stage 2) completed -> WIN!
          if (currentStage === 2) {
            freezeCountdown();
            setShowWin(true);
            sound.playVictoryFanfare();

            setTimeout(() => {
              solve();
              setTimeout(() => {
                setShowWin(false);
                sound.stopBGM();
                sound.stopTrainSound();
                startCollapse();
              }, 2200);
            }, 1800);
          }
        } else {
          // Wrong 2-digit code for this carriage -> Shake and clear
          triggerShake();
          setTimeout(() => {
            dispatch({ type: 'STAGE_FAILED', stage: currentStage });
          }, 350);
        }
      }
    },
    [
      state.solved,
      state.isExpired,
      state.trainPhase,
      state.activeStage,
      state.stageValues,
      dispatch,
      freezeCountdown,
      solve,
      startCollapse,
      triggerShake,
    ]
  );

  // Backspace on active carriage
  const handleBackspace = useCallback(() => {
    if (state.solved || state.isExpired || state.trainPhase === 'DEPARTING') {
      return;
    }
    const currentStage = state.activeStage;
    const currentVal = state.stageValues[currentStage] || '';
    if (currentVal.length > 0) {
      dispatch({
        type: 'SET_STAGE_INPUT',
        stage: currentStage,
        value: currentVal.slice(0, -1),
      });
    }
  }, [
    state.solved,
    state.isExpired,
    state.trainPhase,
    state.activeStage,
    state.stageValues,
    dispatch,
  ]);

  // ESC key to return to login
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && state.uiMode === 'EXPANDED') {
        e.preventDefault();
        sound.stopBGM();
        sound.stopTrainSound();
        startCollapse();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.uiMode, startCollapse]);

  return (
    <>
      <CaptchaCard
        solved={state.solved && state.uiMode === 'COLLAPSED'}
        isExpired={state.isExpired && state.uiMode === 'COLLAPSED'}
        onExpand={handleExpand}
        onReset={reset}
      />

      <GameOverlay
        uiMode={state.uiMode}
        inputRect={state.inputRect}
        era={state.era}
        isGlitching={false}
        onExpandComplete={handleExpandComplete}
        onCollapseComplete={handleCollapseComplete}
        onSolve={() => {}}
      >
        {state.uiMode !== 'COLLAPSED' && (
          <>
            {/* Fullscreen Scene covering entire viewport */}
            <Scene era={state.era} isGlitching={false}>
              {/* Train with Sprites & Carriage Clues */}
              <Train
                era={state.era}
                phase={state.trainPhase}
                activeStage={state.activeStage}
                solvedStages={state.solvedStages}
                stageWidth={windowWidth}
              />
            </Scene>

            {/* Floating HUD & Compact Keypad Overlay */}
            <div className="game-hud-overlay">
              {/* Top Warning Banner */}
              <div
                className={`warning-banner ${
                  state.isExpired ? 'expired-banner' : ''
                }`}
              >
                {state.isExpired
                  ? '⚠ 30s TIME EXPIRED — THE TRAIN HAS DEPARTED! ⚠'
                  : '▲ INVESTIGATE THE ACTIVE CARRIAGE FOR THE 2-DIGIT CODE ▲'}
              </div>

              {/* Slim Top Bar: Timeline, Timer, Controls */}
              <HUD
                era={state.era}
                timeLeft={state.timeLeft}
                activeStage={state.activeStage}
                isDeparting={state.trainPhase === 'DEPARTING'}
                onExit={() => {
                  sound.stopBGM();
                  sound.stopTrainSound();
                  startCollapse();
                }}
              />

              {/* Compact Keypad Console - only ~220px wide! */}
              <div className="keypad-console">
                <Keypad
                  activeStage={state.activeStage}
                  stageValues={state.stageValues}
                  solvedStages={state.solvedStages}
                  onDigit={handleDigit}
                  onBackspace={handleBackspace}
                  isShaking={isShaking}
                />
              </div>
            </div>

            {/* Win Screen Overlay */}
            {showWin && <WinScreen />}
          </>
        )}
      </GameOverlay>
    </>
  );
}
