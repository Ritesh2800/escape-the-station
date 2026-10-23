import { useCallback, useEffect, useRef, useState } from 'react';
import { PasswordField } from './components/PasswordField';
import { GameOverlay } from './components/GameOverlay';
import { Scene } from './components/Scene';
import { Train } from './components/Train';
import { HUD } from './components/HUD';
import { Keypad } from './components/Keypad';
import { ClueHotspot } from './components/ClueHotspot';
import { EraToggle } from './components/EraToggle';
import { RuleList } from './components/RuleList';
import { WinScreen } from './components/WinScreen';
import { useGameState } from './game/state';
import { useTrainLoop } from './game/trainLoop';
import { LEVEL1_CLUES, LEVEL2_CLUES, getCluesForEra } from './game/levels';
import { validateAll, validateLevel1Segments, VALIDATORS } from './game/validators';
import { LEVEL1_TARGET } from './game/config';
import { sound } from './game/audio';
import type { Era, TrainPhase } from './game/state';

export default function App() {
  const { state, dispatch, startExpand, finishExpand, startCollapse, finishCollapse, solve, reset } = useGameState();
  const [showWin, setShowWin] = useState(false);
  const [isGlitching, setIsGlitching] = useState(false);
  const [stageSize, setStageSize] = useState({ width: 1280, height: 720 });
  const gameInputRef = useRef<HTMLInputElement>(null);
  const shakeTimeoutRef = useRef<number>(0);
  const prevPassedCountRef = useRef<number>(0);
  const prevTrainPhaseRef = useRef<TrainPhase>(state.trainPhase);

  // Train loop
  const onPhaseChange = useCallback((phase: TrainPhase, timeLeft: number) => {
    dispatch({ type: 'SET_TRAIN_PHASE', phase, timeLeft });
  }, [dispatch]);

  const { freeze: freezeTrain } = useTrainLoop(
    state.uiMode === 'EXPANDED',
    onPhaseChange
  );

  // Train sound effects on phase change
  useEffect(() => {
    if (state.uiMode !== 'EXPANDED') return;
    if (state.trainPhase !== prevTrainPhaseRef.current) {
      prevTrainPhaseRef.current = state.trainPhase;
      if (state.trainPhase === 'ARRIVING' || state.trainPhase === 'DEPARTING') {
        sound.playTrainWhistle();
        sound.startTrainSound();
      } else {
        sound.stopTrainSound();
      }
    }
  }, [state.trainPhase, state.uiMode]);

  // Level 1 segment badges
  const l1Segments = state.level === 1 ? validateLevel1Segments(state.input) : {};

  // Level 2 rule results
  useEffect(() => {
    if (state.level === 2 && state.input.length > 0) {
      const results = validateAll(state.input);
      dispatch({ type: 'SET_RULES', results });
      const passCount = Object.values(results).filter(Boolean).length;
      if (passCount > prevPassedCountRef.current) {
        sound.playRulePass();
      }
      prevPassedCountRef.current = passCount;
    } else {
      prevPassedCountRef.current = 0;
    }
  }, [state.input, state.level, dispatch]);

  const handleExpand = useCallback((rect: DOMRect) => {
    sound.playClick(1.2);
    startExpand(rect);
  }, [startExpand]);

  const handleExpandComplete = useCallback(() => {
    finishExpand();
    sound.startBGM();
    // Focus game input after expand
    setTimeout(() => {
      gameInputRef.current?.focus();
    }, 100);
  }, [finishExpand]);

  // Level 1 input change
  const handleL1Input = useCallback((value: string) => {
    dispatch({ type: 'SET_INPUT', value });

    // Check win when 6 digits entered
    if (value.length === 6) {
      if (value === LEVEL1_TARGET) {
        // WIN Level 1
        setShowWin(true);
        sound.playVictoryFanfare();
        freezeTrain();
        setTimeout(() => {
          setShowWin(false);
          dispatch({ type: 'WIN_LEVEL1' });
          // Show interstitial then start Level 2
          setTimeout(() => {
            dispatch({ type: 'START_LEVEL2' });
          }, 1500);
        }, 2000);
      } else {
        // Shake the display
        triggerShake();
      }
    }
  }, [dispatch, freezeTrain]);

  // Level 2 input change
  const handleL2Input = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.length <= 6) {
      sound.playClick(1.0 + val.length * 0.05);
      dispatch({ type: 'SET_INPUT', value: val });
    }
  }, [dispatch]);

  // Check Level 2 win
  useEffect(() => {
    if (state.level === 2 && state.input.length > 0) {
      const results = validateAll(state.input);
      const allPass = VALIDATORS.every(v => results[v.id]);
      if (allPass && !showWin && !state.solved) {
        setShowWin(true);
        sound.playVictoryFanfare();
        freezeTrain();
        setTimeout(() => {
          solve();
          setTimeout(() => {
            setShowWin(false);
            sound.stopBGM();
            sound.stopTrainSound();
            startCollapse();
          }, 2000);
        }, 1500);
      }
    }
  }, [state.input, state.level, state.solved, showWin, freezeTrain, solve, startCollapse]);

  const handleCollapseComplete = useCallback(() => {
    sound.stopBGM();
    sound.stopTrainSound();
    finishCollapse();
  }, [finishCollapse]);

  // Era change with glitch
  const handleEraChange = useCallback((era: Era) => {
    if (era === state.era) return;
    setIsGlitching(true);
    sound.playGlitchWarp();
    dispatch({ type: 'SET_POPUP', id: null });
    setTimeout(() => {
      dispatch({ type: 'SET_ERA', era });
      setIsGlitching(false);
    }, 400);
  }, [state.era, dispatch]);

  // Hotspot open/close
  const handleOpenPopup = useCallback((id: string) => {
    dispatch({ type: 'SET_POPUP', id });
  }, [dispatch]);
  const handleClosePopup = useCallback(() => {
    dispatch({ type: 'SET_POPUP', id: null });
  }, [dispatch]);

  // Shake input on wrong answer
  const triggerShake = () => {
    sound.playError();
    const el = document.querySelector('.keypad-digits');
    if (el) {
      el.classList.add('shake');
      clearTimeout(shakeTimeoutRef.current);
      shakeTimeoutRef.current = window.setTimeout(() => {
        el.classList.remove('shake');
      }, 300);
    }
  };

  // Track stage size for Train positioning
  const handleStageResize = useCallback((entries: ResizeObserverEntry[]) => {
    const entry = entries[0];
    if (entry) {
      setStageSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    }
  }, []);

  // Observe scene stage size
  useEffect(() => {
    if (state.uiMode !== 'EXPANDED') return;
    const el = document.querySelector('.scene-stage');
    if (!el) return;
    const obs = new ResizeObserver(handleStageResize);
    obs.observe(el);
    return () => obs.disconnect();
  }, [state.uiMode, handleStageResize]);

  // Get current clues
  const currentClues = state.level === 1 ? LEVEL1_CLUES : LEVEL2_CLUES;
  const visibleClues = getCluesForEra(currentClues, state.era);

  const rulePassCount = Object.values(state.ruleResults).filter(Boolean).length;

  return (
    <>
      <PasswordField
        solved={state.solved && state.uiMode === 'COLLAPSED'}
        onExpand={handleExpand}
        onReset={reset}
      />

      <GameOverlay
        uiMode={state.uiMode}
        inputRect={state.inputRect}
        era={state.era}
        isGlitching={isGlitching}
        onExpandComplete={handleExpandComplete}
        onCollapseComplete={handleCollapseComplete}
        onSolve={() => {}}
      >
        {state.uiMode === 'EXPANDED' && (
          <>
            {/* Fullscreen Scene taking entire viewport */}
            <Scene era={state.era} isGlitching={isGlitching}>
              {/* Train */}
              <Train
                era={state.era}
                phase={state.trainPhase}
                timeLeft={state.phaseTimeLeft}
                stageWidth={stageSize.width}
                stageHeight={stageSize.height}
              />

              {/* Clue Hotspots */}
              {visibleClues.map(clue => (
                <ClueHotspot
                  key={clue.id}
                  clue={clue}
                  era={state.era}
                  trainPhase={state.trainPhase}
                  isOpen={state.openPopupId === clue.id}
                  onOpen={handleOpenPopup}
                  onClose={handleClosePopup}
                />
              ))}
            </Scene>

            {/* Floating HUD & Password / Keypad Overlay directly on the main train background */}
            <div className="game-hud-overlay">
              {/* Warning Banner */}
              <div className="warning-banner">
                ⚠ SECURITY NOTE: THIS IS A GAME. DO NOT ENTER ANY REAL PASSWORD. ⚠
              </div>

              {/* Floating Game Panel */}
              <div className="game-panel floating-panel">
                <div className="game-panel-row">
                  <HUD
                    phase={state.trainPhase}
                    timeLeft={state.phaseTimeLeft}
                    level={state.level}
                    rulePassCount={rulePassCount}
                    ruleTotalCount={VALIDATORS.length}
                  />
                  <EraToggle
                    era={state.era}
                    locked={state.level === 1}
                    onChange={handleEraChange}
                  />
                </div>

                {state.level === 1 ? (
                  /* Level 1: Keypad + Segment Badges */
                  <div className="game-panel-row" style={{ flexDirection: 'column', gap: 6 }}>
                    <Keypad
                      value={state.input}
                      maxLength={6}
                      onChange={handleL1Input}
                    />
                    <div className="badge-row">
                      {(['PLATFORM', 'RULEBOOK', 'BOXCAR'] as const).map(seg => {
                        const status = l1Segments[seg] || 'pending';
                        return (
                          <span key={seg} className={`badge ${status}`}>
                            {status === 'pass' ? '✓' : status === 'fail' ? '✗' : '○'} {seg}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* Level 2: Text Input + Rule List */
                  <div className="game-panel-row" style={{ flexDirection: 'column', gap: 6, alignItems: 'center' }}>
                    <div className="game-input-wrapper">
                      <input
                        ref={gameInputRef}
                        type="text"
                        className="game-input"
                        placeholder="ENTER CODE..."
                        value={state.input}
                        onChange={handleL2Input}
                        maxLength={6}
                        autoFocus
                        id="game-input-field"
                        autoComplete="off"
                      />
                      <span style={{
                        position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                        fontFamily: 'var(--font-pixel)', fontSize: 8, color: 'rgba(244,234,210,.6)',
                      }}>
                        {state.input.length}/6
                      </span>
                    </div>
                    <RuleList results={state.ruleResults} input={state.input} />
                  </div>
                )}
              </div>
            </div>

            {/* Win Screen Overlay */}
            {showWin && <WinScreen level={state.level} />}

            {/* Interstitial */}
            {state.showInterstitial && (
              <div className="interstitial-overlay">
                <div className="interstitial-text">CHRONO-SHIFT DEVICE ONLINE</div>
              </div>
            )}
          </>
        )}
      </GameOverlay>
    </>
  );
}
