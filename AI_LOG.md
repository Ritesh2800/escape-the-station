# AI_LOG.md — Escape the Station: Chrono-Shift

## Stage 1 — Shell (commit 1)
- **AI tool:** Google Antigravity (Gemini)
- **Prompt:** Build Stage 1: Vite + React + TypeScript + Tailwind project, collapsed password card with FLIP expand/collapse.
- **Output:** Full project scaffolding, PasswordField component, GameOverlay with FLIP animation, game state reducer, config.
- **Manual changes:** None.

## Stage 2–4 — Pixel Transition Fix + All Stages (commit 2)

### Part A: Pixel Train Transition
- **AI tool:** Google Antigravity (Gemini)
- **Prompt:** Replace FLIP animation with pixel-block technique from reference/Login_Pixel_Train_Demo.html.
- **Output:** `pixelTransition.ts` — 8px block grid covering input, glitch flicker (4×70ms), blocks fall to bottom as pixel train via Web Animations API, train chugs right while game screen rises via clip-path wipe. Reverse on collapse.
- **Manual changes:** None.

### Part B: 2D Pixel Backgrounds
- **AI tool:** Google Antigravity (Gemini)
- **Prompt:** Replace 3D-looking AI background with user's actual 2D pixel-art PNGs.
- **Output:** `Scene.tsx` — 16:9 bottom-anchored scaling, era-switched backgrounds, glitch transition support. Copied original pixel_bg PNGs from user's Downloads.
- **Manual changes:** None.

### Stage 2: Scene + Train Loop
- **AI tool:** Google Antigravity (Gemini)
- **Output:** `trainLoop.ts` (ARRIVING→DOCKED→DEPARTING→EMPTY cycle via rAF), `Train.tsx` (colored rectangle engine + 7 carriages with windows/wheels, phase-based x-position), `HUD.tsx` (phase badge, countdown timer, level indicator). Scene uses percentage-based layout zones from spec Section 3.1.
- **Manual changes:** None.

### Stage 3: Level 1 — Platform Dispatch Console
- **AI tool:** Google Antigravity (Gemini)
- **Output:** `Keypad.tsx` (on-screen 0-9 + keyboard support, 6-digit input), `ClueHotspot.tsx` (sparkle pulse, typewriter popup, docked-only gating), `levels.ts` (3 clue definitions with % coordinates), `validators.ts` (`validateLevel1Segments` for PLATFORM/RULEBOOK/BOXCAR badges). 3 segment badges turn green/red. Win at `072516` → ACCESS GRANTED + confetti.
- **Manual changes:** None.

### Stage 4: Level 2 — Chrono-Vault + Eras
- **AI tool:** Google Antigravity (Gemini)
- **Output:** `EraToggle.tsx` (1890/NOW/2080, locked during Level 1), `RuleList.tsx` (5 validators with live badges), `WinScreen.tsx` (confetti burst, VAULT OPEN), `validators.ts` (5 pure functions: charTypes, anchors, digitSum, symbolLogic, stationId — all pass for `@S2!E8`). 6 clue hotspots across 3 eras. Glitch transition on era switch. Win triggers collapse back to verified field.
- **Manual changes:** None.

### App.tsx Integration
- **AI tool:** Google Antigravity (Gemini)
- **Output:** Complete wiring of all components: pixel transition, train loop, Level 1 keypad + badges, Level 2 text input + rule list, era toggle, clue hotspots, win screens, interstitial "CHRONO-SHIFT DEVICE ONLINE".
- **Manual changes:** None.

### Stage 5: Polish & 8-Bit Audio Engine
- **AI tool:** Google Antigravity (Gemini)
- **Prompt:** "add some game music giving pixelated vibes fast pls, click sounds, trains soundts etc."
- **Output:** Pure Web Audio API 8-bit chiptune synthesizer `audio.ts` (authentic arcade BGM, train steam whistle & rhythmic chug, typewriter clue dialogue blips, UI click/keystroke blips, era glitch frequency sweep, rule pass sparkle chime, error buzz, and victory fanfare) with HUD mute toggle.
- **Manual changes:** None.

### Stage 6: Start Transition Fix, Game Optimization & Bug Fixes
- **AI tool:** Google Antigravity (Gemini)
- **Prompt:** "the project is not optimised. at the start of game ui it shows some other game and timeline, and after 1-2second delay it shows the actual game. Also there the games are least optimised having very bugs, pls fix all those bugs and make it very smooth and optimised"
- **Output:**
  1. **Fixed Start Glitch & Delay**: Initialized fresh round immediately on checkbox click in `handleExpand` so that what is revealed during pixel dissolve is 100% the true game and timeline. Removed delayed re-rolling in `handleExpandComplete`.
  2. **Transition Performance**: Replaced $O(N)$ array `shift()` with $O(1)$ queue pointer in `pixelTransition.ts`; tuned chunky canvas blocks (~2,200) for authentic 8-bit aesthetic and locked 60/120fps; reduced expand duration from ~3s to a snappy ~1s.
  3. **PIN Decoder**: Fixed formula calculation bug where generated math didn't match true PIN; added physical lit windows for COUNT template; added slot selection & editing; added OK/DEL buttons and puzzle resets.
  4. **Impostor Carriage**: Rendered visual overlays for all 7 traits (wheels, windows, window color, roof stripe, lantern, mirrored plate, body hue); added Arrow keys carousel navigation; added puzzle reset.
  5. **Sort the Train**: Added puzzle reset on retry; added 1-4 and Arrow key shortcuts for swapping; responsive coupler beacon lights.
  6. **Spot the Robots**: Eliminated 60fps React `setState` loop in favor of high-performance direct DOM transforms with 0ms GC overhead; fixed robot vs human movement and instant click hitboxes.
  7. **Lock-Pick Dial**: Replaced 60fps React state rotation and keydown listener thrashing with direct SVG needle transforms; fixed PIN badge overlapping with clean pill indicators; added Pin 3 direction reverse.
  8. **Round Result Modal**: Replaced premature 700ms auto-collapse on fail with Try Again, Next Game, and Close buttons per spec.

### Stage 7: Spot the Robots Motion & Snap-back Bug Fix
- **AI tool:** Google Antigravity (Gemini)
- **Prompt:** "theres a bug in spot the robot, all the figures are going ahead a few steps and then coming back to initial position which should happen, and their motion should be random for each one"
- **Output:**
  1. **Root Cause Analysis**: `gameApi` had `timeLeft` in its dependency array in `App.tsx`, re-creating `gameApi` on every 1-second timer tick. `SpotRobotsComponent` had an effect dependent on `[puzzle, api]` and the JSX had inline `left` and `top` properties bound to starting coordinates, causing React DOM diffing and component re-initialization to snap all figures back to initial coordinates every 1,000ms.
  2. **Decoupled Render & Physics**: Stabilized `gameApi` via `timeLeftRef`, guarded puzzle initialization in `SpotRobotsComponent` to only fire when `puzzle` identity changes, and removed `left`/`top`/`transform`/`zIndex` from JSX `style` prop so React reconciliation never overwrites animated styles.
  3. **Organic Randomized Motion**: Provided each human passenger with randomized initial velocity angles ($0$ to $2\pi$), randomized speeds (22–45 px/s), staggered direction timers, randomized change intervals (1.6–3.8s), staggered initial pauses, independent wobble phases, and waking-from-pause fresh angle selection with a guaranteed pause every 2.8s per spec. Robots maintain strict cardinal trajectories with 90° turns and staggered turn phases.
  4. **Visual Cues**: Implemented periodic 1.0s pulsing cyan eye for robots in CSS and bright hint glow at $t \le 15$s.

### Stage 8: 4-Carriage Easy PIN Decoder
- **AI tool:** Google Antigravity (Gemini)
- **Prompt:** "also make the pin decoder game easy, there should be only 4 carriages for 4 digit pin, each carraige will display clue or hint for one digit"
- **Output:**
  1. **Direct 4-Carriage Mapping**: Streamlined train composition to exactly 4 carriages with zero decoys, where Carriage 1 directly maps to PIN Digit 1, Carriage 2 to Digit 2, Carriage 3 to Digit 3, and Carriage 4 to Digit 4.
  2. **Simplified Intuitive Clues**:
     - **Carriage 1 (Digit 1)**: Simple mental addition formula ($a + b = ?$).
     - **Carriage 2 (Digit 2)**: Visual illuminated windows to count ($1$–$6$) or simple subtraction.
     - **Carriage 3 (Digit 3)**: Distinct color coach matching prominent Station Board departure gate legend.
     - **Carriage 4 (Digit 4)**: Illuminated windows or clean arithmetic/numeral value.
  3. **Seamless Navigation & UX**: Added direct clickable carriage pills (`[CAR 1 ①]`, `[CAR 2 ②]`, `[CAR 3 ③]`, `[CAR 4 ④]`) and synced PIN box clicks so clicking a digit box automatically slides the train directly to the matching carriage.



