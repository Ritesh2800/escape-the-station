# ESCAPE THE STATION: CHRONO-SHIFT — Full Build Spec

> You are building this project from this file. Follow it exactly. Where something is not specified, choose the simplest option that works in the browser. Build in the stages listed in Section 12 and commit after each stage.

> **SECURITY NOTE (must be visible in the UI):** "This is a game. DO NOT enter any real password." Never send, store or log anything the player types. All checking happens locally in the browser.

---

## 1. One-paragraph pitch

A normal-looking password field sits on a plain web page. When the user clicks it, it **smoothly expands to cover the whole page** and turns into a pixel-art game: a train station platform with a train that arrives, docks and leaves on a loop. The player reads clues from the environment (signs, boards, the train's carriages), shifts the station between three eras (1890 / Present / 2080) and types a password that satisfies a growing set of rules with **live PASS / FAIL feedback**. When the password is cracked, the game **collapses smoothly back into the original simple password field**, which now shows a verified state.

Hackathon problem statement: **PS2 — Puzzle Passwords** (must-haves: runs in browser, at least 8 rules/clues/levels, live feedback on which rules pass/fail, clear win state, visible "don't use a real password" note).

---

## 2. Tech stack and project setup

- **Vite + React + TypeScript + Tailwind CSS** (plain CSS is fine for the pixel effects). No backend. No external APIs required.
- Pixel font: **"Press Start 2P"** (Google Fonts), with `monospace` fallback. Use it for the game UI only. The collapsed, normal field uses a normal system font.
- Global rule: every image uses `image-rendering: pixelated;`.
- Respect `prefers-reduced-motion` (replace the expand animation with a quick fade).
- Must run with `npm install && npm run dev`, and build with `npm run build`.
- Folder layout:
  ```
  /src
    /components   (PasswordField, GameOverlay, Scene, Train, HUD, RuleList, Keypad, ClueHotspot, EraToggle, WinScreen)
    /game         (config.ts, levels.ts, validators.ts, trainLoop.ts)
    /assets       (bg and train images, see Section 3)
  AI_LOG.md       (see Section 13)
  README.md
  ```

---

## 3. Assets (already generated, put in `/src/assets`)

Backgrounds, all 1280×720, pixel art, same layout in every era:

| Era | File |
|---|---|
| Past (1890, Victorian steam) | `pixel_bg_past_1280x720.png` |
| Present | `pixel_bg_1280x720.png` |
| Future (2080) | `pixel_bg_future_1280x720.png` |

Trains (generated in Pixel Labs, sidescroller view, transparent background). Expected names; if any file is missing, draw a simple colored rectangle placeholder so the game still works:

- `engine_past.png`, `carriage_past.png` (maroon, steam era)
- `engine_present.png`, `carriage_present.png`
- `engine_future.png`, `carriage_future.png`

The train is built from **1 engine + 6 to 8 carriages**, repeating the carriage sprite and overlaying text on its windows in code (carriage windows are empty on purpose).

### 3.1 Background layout zones (in the 1280×720 image, scale proportionally)

- **Track/rails:** y ≈ 515–560. Train wheels sit on the rails at y ≈ 520–555.
- **Platform floor:** y ≥ 560. The player-facing platform area.
- **Station room:** x ≈ 25–315, y ≈ 200–560 (on the left). Train spawns/ends beyond x ≈ 330 on the right side of the room so it never overlaps the room. (The train may slide in from the left edge *behind/over* the room only during arrival, then dock between x ≈ 340 and the right edge. Simple option: arrival from the right edge, departure to the left edge.)
- **Station name board** (blank sign above the clock): x ≈ 88–248, y ≈ 270–298. Overlay text here.
- **Analogue clock:** center ≈ (172, 345), radius ≈ 48. Painted into the bg. Do not animate hands (optional extra).
- **Door:** x ≈ 192–272, y ≈ 384–560. **Window:** x ≈ 56–152, y ≈ 392–480.
- **Bench:** x ≈ 880–1010, y ≈ 585–655. **Lamp post:** x ≈ 1195–1205.

---

## 4. Eras (three timelines)

The player switches era with the **Chrono-Shift Device** (an era toggle in the HUD: three pixel buttons 1890 | NOW | 2080, with a short screen-flash + glitch transition of about 400 ms). Switching era changes: background image, train sprites, clue text, ambient sound (optional), and UI accent color.

| Era id | Label | Look | Accent color | Era vowel |
|---|---|---|---|---|
| `past` | 1890 — Steam | warm sunset, brick station, wooden platform | amber `#e8b84a` | **E** |
| `present` | NOW — Present | bright daytime, red station, grey platform | sky blue `#3aa0e0` | **A** |
| `future` | 2080 — Cyber | neon night, holograms, metal platform | cyan `#4ff0ff` and magenta `#ff5de0` | **I** |

(Note: the earlier draft called the middle era "1980 Analog Neon". It is now "Present" to match the bright daytime background we generated. The clue content below is unchanged.)

---

## 5. Train dispatch loop (global, runs always)

Constants live in `config.ts` so they are easy to tune:

```ts
export const TRAIN = {
  DOCKED_MS: 45000,   // train stationary, clues readable
  DEPART_MS: 15000,   // train leaves, platform empty, rear-car clue hidden
  ARRIVE_MS: 3000,    // slide-in animation, included at the start of DOCKED
};
```

State machine: `ARRIVING (3 s slide in, bell sound) -> DOCKED (clues readable) -> DEPARTING (train accelerates away, ease-in) -> EMPTY (short pause) -> new train ARRIVES`. A visible **countdown ring/bar** in the HUD shows time left in the current state. Each new arrival uses a **new randomized carriage count (6-8)** and random window decorations/hint text (flavor only).

Rule: **the rear carriage of the docked train displays era-specific clue text only while state is DOCKED.** While DEPARTING/EMPTY/ARRIVING the text is hidden (render as scratched/blurred text). This is what makes the player wait for the train.

Optional (if time allows): the middle carriages show short flavor hints like "Check the sign board" or "Era vowels are not random".

---

## 6. Level 1 — Platform Dispatch Console (tutorial)

**Input:** 6-digit numeric keypad (an on-screen pixel keypad plus physical keyboard digits). **Target: `072516`.**

Clues (clickable hotspots, see Section 8):

| Digits | Source object | Text | Value |
|---|---|---|---|
| 1-2 | **Platform signpost** (pole at the right side of the platform, x ≈ 1040, y ≈ 450) | "PLATFORM 07" | `07` |
| 3-4 | **Rulebook board** (notice board on the platform near the station room, x ≈ 330–470, y ≈ 400) | "To calculate the middle digits: take the Platform Number, multiply by 3, add 4." (7×3 + 4 = 25) | `25` |
| 5-6 | **Rear carriage of docked train** (only readable in DOCKED) | stenciled `(12 / 2) + 10` | `16` |

Live feedback: the console shows **3 segment badges** (`PLATFORM`, `RULEBOOK`, `BOXCAR`). A badge turns green (PASS ✓) as soon as its two digits are correct, red (FAIL ✗) if the two digits are entered and wrong, grey while incomplete.

Win: all three badges green and 6 digits entered -> door unlocks (door sprite swaps to open or a green flash) and "ACCESS GRANTED" -> start Level 2.

Level 1 is played in the **Present** era (era toggle disabled/locked until Level 1 is solved). After the win, show a 1.5 s transition "CHRONO-SHIFT DEVICE ONLINE" and unlock the era toggle.

---

## 7. Level 2 — The Chrono-Vault (multi-era alphanumeric)

**Input:** a real text field (visible text, NOT masked, because the player must see what they type) with a character counter. A "show/hide" toggle is not needed. **Target (canonical answer): `@S2!E8`**, but the game accepts **any string that passes all rules** (there can be more than one valid answer).

### 7.1 Clues per era (each era has 2 clickable clue objects)

| Era | Object | Text shown | What it gives |
|---|---|---|---|
| Past 1890 | Brass plaque on the **station name board** | "Power Symbol Anchor = @" | `@` |
| Past 1890 | Steam engine nameplate (the engine sprite, clickable while docked) | "Engine Vowel: E" | `E` |
| Present | **Station name board** (as a departure board) | "Station Sector Code = S2" | `S2` |
| Present | **Rear carriage of the docked train** (only readable while DOCKED) | split-flap style digit "8" with label "Split Value" | `8` |
| Future 2080 | Hologram log above the station name board | "Target Digit Sum = sum of the Present-era numbers (2 + 8 = 10)" | sum = 10 |
| Future 2080 | Hologram note near the platform | "Signal rule: ! must be followed by the 1890 engine vowel" | reminder |

Era vowels A and I are decorative (they appear in flavor text only). Do not add rules for them.

### 7.2 Rules (live validated on every keystroke; 5 rules, each shown as a badge)

1. **CHAR_TYPES** — exactly 6 characters, with at least 1 letter, 1 digit and 1 symbol from `# @ ! * &`.
2. **ANCHORS** — character 1 is the Power Symbol Anchor (`@`, from the plaque) and character 6 is the Split Value digit (`8`).
3. **DIGIT_SUM** — the sum of all digit characters equals 10.
4. **SYMBOL_LOGIC** — if `@` is present then `#` is forbidden; and `!` must be present and immediately followed by the 1890 engine vowel `E`.
5. **STATION_ID** — the password contains the station code `S2`.

Each badge: label + short human-readable description (not the answer), state `PENDING` (grey) / `PASS ✓` (green) / `FAIL ✗` (red). A top bar shows "RULES 3/5". When all 5 pass -> Win.

Note for validator: implement each rule as a pure function `(password: string) => boolean` in `validators.ts` with unit-testable examples (`@S2!E8` must pass all five).

---

## 8. Clue interaction

- Each clue object is a **hotspot** over the background (absolutely positioned with percentage coordinates so it scales with the scene).
- Idle: a subtle pulsing pixel sparkle `✦` (2-frame animation, 1 s). Hover: pixel outline.
- Click: opens a small **pixel tooltip/popup** next to the object with the clue text (typed out character by character, 25 ms per char) and a close button. Only one popup at a time. Popups close when the era changes.
- The train rear-carriage clue is a hotspot too, but while the train is not DOCKED, clicking shows: "The train is gone. Wait for the next one."

---

## 9. THE UI — expanding password field (core experience; follow exactly)

### 9.1 Collapsed state (the host page)

A simple, clean, ordinary page (white or light grey background) with one centered card: a title ("Create a password"), a standard-looking **password input** (system font, rounded border, 48 px height, eye icon on the right), and a small helper text: "Click the field to start the challenge. Don't use a real password." The normal input looks exactly like on any website. No game visuals here.

### 9.2 Expand transition (on click/focus of the input)

Smooth, around **700-900 ms**, easing `cubic-bezier(0.22, 1, 0.36, 1)`. Implement with the FLIP technique:

1. On click, measure the input with `getBoundingClientRect()`.
2. Render a **fixed-position overlay element** that starts at exactly that rect (same top/left/width/height/border-radius), then animate to `top:0; left:0; width:100vw; height:100vh; border-radius:0` (animate `clip-path: inset()` or transform, whichever is smoothest; avoid layout thrash).
3. **During the transition the input itself restyles to the pixel look**: border becomes a chunky 4 px pixel border (stepped corners via `clip-path: polygon(...)` or box-shadow stacking), the font changes to Press Start 2P, the background becomes the dark game panel color. Cross-fade between the plain style and the pixel style over the first ~40% of the animation.
4. In the **last ~40% of the animation**, fade in the era background image (starting at Present) behind it, then fade in the HUD and scene. Everything is pixelated; the background uses `image-rendering: pixelated` and `background-size: cover`.
5. Lock page scroll (`overflow:hidden` on body) during the overlay. Focus moves to the game's input.

### 9.3 Expanded layout (the full-page game)

Full-viewport overlay with two regions, stacked vertically:

- **TOP: the Game Panel (the transformed password input + HUD).** Contains the pixel-styled password input box (large, centered), the rule badges (Level 2) or the segment badges + keypad (Level 1), the era toggle, the train countdown, the "DON'T USE A REAL PASSWORD" warning banner (always visible, bright yellow pixel strip), and a level indicator ("LEVEL 1/2").
- **BOTTOM: the Scene.** The era background image, anchored to the bottom (`background-position: center bottom`), showing the platform, tracks and the animated train. The scene keeps its 16:9 proportions (scale to fit width; the sky area is cropped first, never the platform and tracks).

If the viewport is not tall enough for both: **the password panel stays pinned at the top and becomes compact** (rules collapse to icon-only badges that expand on hover/tap), and the scene takes the remaining height. On narrow/portrait screens, stack: panel on top (compact), scene below, keypad overlays the scene's lower area as a drawer. The train and platform must always remain visible.

Z-order from back to front: era background, clue hotspots, train, sparkles/popups, HUD panel, warning banner.

### 9.4 Gameplay inside the expanded view

- The password panel is always the primary focus. The train arrives and leaves in the scene while the player reads clues and types.
- Era toggle changes the scene with a 400 ms glitch/flash transition. The train respawns in the new era's sprites at the same phase of the loop.
- Wrong inputs: the input box shakes (150 ms, 4 px) and failed badges flash red once. Right inputs: badges pop (scale 1.15 -> 1) with a short pixel chime (optional sound; add a mute button).

### 9.5 Win and collapse transition

1. Win: freeze the loop, play "ACCESS GRANTED" / "VAULT OPEN" with a pixel confetti burst and a 1.5 s success chime. The train departs one last time.
2. After about 2 s, run the **reverse FLIP animation**: the overlay shrinks back to the original input's rect (recompute the rect at that moment), the pixel style cross-fades back to the plain style, the background fades out, then the overlay unmounts. Same duration and easing as the expand.
3. Final collapsed state: the normal password field is now **filled with masked dots**, has a green border and a small green check "✓ Password cracked — you beat the station!" and the helper text "Reminder: never use a real password in a game." A "Play again" link resets everything without a page reload.

### 9.6 Visual style guide

- Palette for the game panel: dark navy `#14122e` panel, cream `#f4ead2` text, accent per era (Section 4), success green `#4ade80`, fail red `#ff5252`, warning yellow `#ffd445`.
- All borders 4 px solid with a 4 px offset hard shadow (no blur). Buttons are blocky with a pressed state (translateY 2 px).
- Sounds are optional and must be off by default with a visible mute/unmute toggle.

---

## 10. Game state (single source of truth)

```ts
type Era = 'past' | 'present' | 'future';
type TrainPhase = 'ARRIVING' | 'DOCKED' | 'DEPARTING' | 'EMPTY';
type Level = 1 | 2;
type UiMode = 'COLLAPSED' | 'EXPANDING' | 'EXPANDING' | 'COLLAPSING';
// state: uiMode, level, era, trainPhase, phaseTimeLeft, input, ruleResults, openPopupId, solved
```

Use a single reducer or Zustand store. The train loop runs on a `requestAnimationFrame` timer and continues across era shifts.

---

## 11. Hackathon must-have checklist (verify at the end)

- [ ] Runs in the browser (`npm run dev` works)
- [ ] At least 8 rules/clues/levels (Level 1: 3 segment checks + Level 2: 5 rules = 8, plus the train loop)
- [ ] Live feedback for which rules pass/fail (badges update per keystroke)
- [ ] Clear win state (Access Granted screen + collapse + verified field)
- [ ] Visible "don't use a real password" note (collapsed page helper text AND the expanded warning banner)
- [ ] Original game idea (train loop + multi-era rule corruption)

---

## 12. Build order (commit after each stage with a clear message)

1. **Stage 1 — Shell:** project setup, collapsed password card, the FLIP expand/collapse animation with an empty overlay (this is the signature effect; get it perfect first).
2. **Stage 2 — Scene:** era backgrounds, responsive layout (top panel + bottom scene), train loop with placeholder rectangles, countdown HUD.
3. **Stage 3 — Level 1:** keypad, three clue hotspots, segment badges, door unlock.
4. **Stage 4 — Level 2 and eras:** era toggle + glitch transition, six clue hotspots, the 5 validators with live badges, win screen.
5. **Stage 5 — Polish:** real train sprites, sounds with mute, shake/pop animations, collapse-to-verified-field, reduced motion, README.

If time runs short, cut Stage 5 first, never Stages 1-4.

---

## 13. Submission requirements

- Public GitHub repo with a meaningful commit history (one commit per stage at minimum).
- `AI_LOG.md` listing every AI tool and prompt used, what it produced, and what was manually changed. Append an entry after each stage.
- README with: one-line pitch, how to run, how to play, the era/rule summary, the "don't use a real password" note.
- Prepare a 60-second pitch: problem (password rules are a puzzle nobody asked for) -> our twist (the password is the escape, rules change with time) -> live demo of expand, solve, collapse.
