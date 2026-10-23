import { useCallback } from 'react';
import { PasswordField } from './components/PasswordField';
import { GameOverlay } from './components/GameOverlay';
import { useGameState } from './game/state';

export default function App() {
  const {
    state,
    startExpand,
    finishExpand,
    startCollapse,
    finishCollapse,
    solve,
    reset,
  } = useGameState();

  const handleExpand = useCallback(
    (rect: DOMRect) => {
      startExpand(rect);
    },
    [startExpand]
  );

  const handleSolve = useCallback(() => {
    // Trigger solve → then collapse after 2 seconds (Section 9.5)
    solve();
    setTimeout(() => {
      startCollapse();
    }, 2000);
  }, [solve, startCollapse]);

  const handleCollapseComplete = useCallback(() => {
    finishCollapse();
  }, [finishCollapse]);

  return (
    <>
      {/* The collapsed page — always rendered but hidden under the overlay */}
      <PasswordField
        solved={state.solved && state.uiMode === 'COLLAPSED'}
        onExpand={handleExpand}
        onReset={reset}
      />

      {/* The game overlay — renders during EXPANDING, EXPANDED, COLLAPSING */}
      <GameOverlay
        uiMode={state.uiMode}
        inputRect={state.inputRect}
        onExpandComplete={finishExpand}
        onCollapseComplete={handleCollapseComplete}
        onSolve={handleSolve}
      />
    </>
  );
}
