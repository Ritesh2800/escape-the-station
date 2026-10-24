import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CaptchaCard } from './components/CaptchaCard';
import { GameOverlay } from './components/GameOverlay';
import { Scene } from './components/Scene';
import { HUD } from './components/HUD';
import { RoundResultOverlay } from './components/RoundResultOverlay';
import { sound } from './game/audio';
import type { Era, GameId, RoundPhase, GameApi, GameDefinition } from './game/types';
import { createRNG, getUrlParams } from './game/rng';
import { selectNextGame, getInitialEra, GAME_MAP } from './games/registry';

export default function App() {
  // Read optional URL parameters
  const urlParams = getUrlParams();
  const [selectedGameSetting, setSelectedGameSetting] = useState<string>(
    urlParams.game && GAME_MAP[urlParams.game as GameId] ? urlParams.game : 'random'
  );

  const [seed, setSeed] = useState<number>(() => urlParams.seed || Date.now());
  const rng = useRef<(() => number) | null>(null);
  if (!rng.current) {
    rng.current = createRNG(seed);
  }

  const initialData = useRef<{ era: Era; game: GameDefinition; puzzle: any } | null>(null);
  if (!initialData.current) {
    const initialEra = getInitialEra(rng.current);
    const initialGame = selectNextGame(
      urlParams.game && GAME_MAP[urlParams.game as GameId]
        ? (urlParams.game as GameId)
        : 'random',
      rng.current
    );
    const initialPuzzle = initialGame.generate(rng.current, initialEra);
    initialData.current = { era: initialEra, game: initialGame, puzzle: initialPuzzle };
  }

  const [era, setEra] = useState<Era>(initialData.current.era);
  const [activeGame, setActiveGame] = useState<GameDefinition>(initialData.current.game);
  const [puzzle, setPuzzle] = useState<any>(initialData.current.puzzle);

  // UI state
  const [uiMode, setUiMode] = useState<'COLLAPSED' | 'EXPANDING' | 'EXPANDED' | 'COLLAPSING'>('COLLAPSED');
  const [inputRect, setInputRect] = useState<DOMRect | null>(null);

  // Round lifecycle
  const [roundPhase, setRoundPhase] = useState<RoundPhase>('IDLE');
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [lives, setLives] = useState<number | null>(activeGame.defaultLives);
  const [statusText, setStatusText] = useState<string>('');
  const [failReason, setFailReason] = useState<string>('');
  const [isShaking, setIsShaking] = useState(false);
  const [solveDuration, setSolveDuration] = useState(0);
  const [isVerified, setIsVerified] = useState(false);

  const roundStartTimeRef = useRef<number>(0);
  const timerIntervalRef = useRef<number>(0);
  const livesRef = useRef<number | null>(activeGame.defaultLives);

  // Initialize a fresh round (called immediately when expanding or switching games)
  const startNewRound = useCallback(
    (gameChoice?: string, customSeed?: number, autoStartTimer = true) => {
      // Clear previous timer
      clearInterval(timerIntervalRef.current);

      const nextSeed = customSeed || Date.now();
      setSeed(nextSeed);
      rng.current = createRNG(nextSeed);

      const nextEra = getInitialEra(rng.current);
      setEra(nextEra);

      const choice = gameChoice !== undefined ? gameChoice : selectedGameSetting;
      const nextGameDef = selectNextGame(
        choice !== 'random' && GAME_MAP[choice as GameId]
          ? (choice as GameId)
          : 'random',
        rng.current
      );

      setActiveGame(nextGameDef);

      // Solvability guard with up to 20 attempts
      let newPuzzle = nextGameDef.generate(rng.current, nextEra);
      let attempts = 0;
      while (!nextGameDef.isSolvable(newPuzzle) && attempts < 20) {
        newPuzzle = nextGameDef.generate(rng.current, nextEra);
        attempts++;
      }
      setPuzzle(newPuzzle);

      livesRef.current = nextGameDef.defaultLives;
      setLives(nextGameDef.defaultLives);
      setTimeLeft(30);
      setStatusText('');
      setFailReason('');

      if (autoStartTimer) {
        setRoundPhase('PLAYING');
        roundStartTimeRef.current = performance.now();
      } else {
        // Ready in INTRO state while transition opens
        setRoundPhase('INTRO');
      }
    },
    [selectedGameSetting]
  );

  // Fail handler - keeps overlay open with Try Again & Next Game buttons
  const handleFail = useCallback((reason: string) => {
    clearInterval(timerIntervalRef.current);
    sound.stopBGM();
    sound.playError();
    sound.startTrainSound();
    setFailReason(reason);
    setRoundPhase('FAIL');
  }, []);

  // Pass handler - celebratory victory then collapses to verified CAPTCHA box
  const handlePass = useCallback(() => {
    clearInterval(timerIntervalRef.current);
    const duration = Math.max(0.5, (performance.now() - roundStartTimeRef.current) / 1000);
    setSolveDuration(duration);
    setRoundPhase('PASS');
    setIsVerified(true);
    sound.stopBGM();
    sound.playVictoryFanfare();

    // After 1.3s victory celebration -> shrink back to CAPTCHA box
    setTimeout(() => {
      setUiMode('COLLAPSING');
    }, 1300);
  }, []);

  // Lose life handler
  const handleLoseLife = useCallback((): number => {
    if (livesRef.current === null) return 0;
    const remaining = Math.max(0, livesRef.current - 1);
    livesRef.current = remaining;
    setLives(remaining);
    if (remaining <= 0) {
      handleFail('Out of lives! Train departed.');
    }
    return remaining;
  }, [handleFail]);

  // 30s Countdown timer during PLAYING phase
  useEffect(() => {
    if (roundPhase === 'PLAYING') {
      timerIntervalRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current);
            handleFail("Time's up! Train departed.");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerIntervalRef.current);
    }
    return () => clearInterval(timerIntervalRef.current);
  }, [roundPhase, handleFail]);

  // Shake trigger
  const triggerShake = useCallback(() => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 200);
  }, []);

  const timeLeftRef = useRef(timeLeft);
  timeLeftRef.current = timeLeft;

  // Game API contract passed to components (completely stable across timer ticks)
  const gameApi: GameApi = useMemo(
    () => ({
      pass: handlePass,
      fail: handleFail,
      loseLife: handleLoseLife,
      setStatus: (text: string) => setStatusText(text),
      now: () => performance.now() - roundStartTimeRef.current,
      timeLeft: () => timeLeftRef.current,
      triggerShake,
    }),
    [handlePass, handleFail, handleLoseLife, triggerShake]
  );

  // Expanding from CAPTCHA Box: Setup round BEFORE transition starts!
  const handleExpand = useCallback(
    (rect: DOMRect) => {
      sound.playClick(1.2);
      setInputRect(rect);

      // Pre-initialize the round so the revealed game is 100% the true round!
      startNewRound(selectedGameSetting, undefined, false);
      setUiMode('EXPANDING');
    },
    [selectedGameSetting, startNewRound]
  );

  const handleExpandComplete = useCallback(() => {
    setUiMode('EXPANDED');
    sound.startBGM();
    // Smoothly transition from INTRO to PLAYING without re-rolling the game or era
    setRoundPhase('PLAYING');
    roundStartTimeRef.current = performance.now();
  }, []);

  const handleCollapseComplete = useCallback(() => {
    sound.stopBGM();
    sound.stopTrainSound();
    setUiMode('COLLAPSED');
    setRoundPhase('IDLE');
    if (roundPhase === 'PASS') {
      setIsVerified(true);
    }
  }, [roundPhase]);

  // Dropdown game selector change
  const handleSelectGame = (gameId: string) => {
    setSelectedGameSetting(gameId);
    sound.playClick(1.1);
    startNewRound(gameId, undefined, true);
  };

  // Reset CAPTCHA
  const handleResetCaptcha = () => {
    sound.playClick(0.9);
    setIsVerified(false);
    setSolveDuration(0);
    setRoundPhase('IDLE');
  };

  // ESC key to return
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && uiMode === 'EXPANDED') {
        e.preventDefault();
        sound.stopBGM();
        sound.stopTrainSound();
        setUiMode('COLLAPSING');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [uiMode]);

  const GameComponent = activeGame.Component;

  return (
    <>
      {/* 1. Host Page CAPTCHA Card */}
      <CaptchaCard
        solved={isVerified && uiMode === 'COLLAPSED'}
        solveDurationSeconds={solveDuration}
        onExpand={handleExpand}
        onReset={handleResetCaptcha}
      />

      {/* 2. Fullscreen Pixel Game Overlay */}
      <GameOverlay
        uiMode={uiMode}
        inputRect={inputRect}
        era={era}
        onExpandComplete={handleExpandComplete}
        onCollapseComplete={handleCollapseComplete}
        onSolve={() => {}}
      >
        {uiMode !== 'COLLAPSED' && (
          <div className={`game-viewport-container ${isShaking ? 'screen-shake' : ''}`}>
            {/* Fullscreen Pixel Scene Background & Station Signboard */}
            <Scene
              era={era}
              stationBoardText={
                activeGame.stationBoardText ? activeGame.stationBoardText(puzzle) : null
              }
            >
              {/* Active Game Component Layer */}
              <GameComponent
                puzzle={puzzle}
                era={era}
                phase={roundPhase}
                api={gameApi}
                timeLeft={timeLeft}
                lives={lives}
              />
            </Scene>

            {/* Top HUD with Game Dropdown Selector, Timer, Lives, and Goal */}
            <HUD
              era={era}
              gameTitle={activeGame.title}
              gameGoal={activeGame.goal(puzzle)}
              selectedGame={selectedGameSetting}
              onSelectGame={handleSelectGame}
              lives={lives}
              timeLeft={timeLeft}
              seed={seed}
              statusText={statusText}
              onExit={() => {
                sound.stopBGM();
                sound.stopTrainSound();
                setUiMode('COLLAPSING');
              }}
            />

            {/* Intro "GO!" Splash (brief during expand) */}
            {roundPhase === 'INTRO' && (
              <div className="round-intro-overlay">
                <div className="intro-title-text">{activeGame.title}</div>
                <div className="intro-goal-text">{activeGame.goal(puzzle)}</div>
                <div className="intro-go-flash">GO!</div>
              </div>
            )}

            {/* Pass / Fail Result Modal */}
            <RoundResultOverlay
              phase={roundPhase}
              failReason={failReason}
              durationSeconds={solveDuration}
              onTryAgain={() => {
                sound.playClick(1.2);
                startNewRound(selectedGameSetting, undefined, true);
              }}
              onNextGame={() => {
                sound.playClick(1.2);
                setSelectedGameSetting('random');
                startNewRound('random', undefined, true);
              }}
              onClose={() => {
                sound.stopBGM();
                sound.stopTrainSound();
                setUiMode('COLLAPSING');
              }}
            />

            {/* Bottom Disclaimer Strip required by spec */}
            <div className="game-footer-strip">
              This is a game. Not real security.
            </div>
          </div>
        )}
      </GameOverlay>
    </>
  );
}
