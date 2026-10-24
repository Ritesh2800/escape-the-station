# CAPTCHA GAMES — Detailed Mechanics Spec (Escape the Station: Human Check)

Problem statement: **PS1 — Reimagine CAPTCHA** ("Prove you're human. Make it fun.")
Must-haves: runs in browser · at least 3 challenge types or a random generator · clear pass/fail feedback · each challenge under 30 s · restart without reloading.
Don't build real security. This is a game about the idea of a CAPTCHA.

This file defines every game completely: idea, scene, randomisation, controls, step-by-step play, win/fail rules, feedback, edge cases and tests. It extends the earlier build spec (CHRONO_SHIFT_SPEC.md): the pixel expand/collapse transition, the era backgrounds and the train sprites are reused.

---

## PART 0 — SHARED FRAMEWORK (applies to every game)

### 0.1 The CAPTCHA box (host page)
- A plain page with a normal-looking CAPTCHA widget: a card with an empty checkbox, the label "I'm not a robot" and a tiny note "Station Security". Below it: the small line "This is a game. No real security." (visible at all times).
- **Click the checkbox** -> the pixel transition (pixelate -> pixels spread across the page -> pixels dissolve outward to reveal the game) opens the game view.
- **On pass:** the game plays "VERIFIED", the pixels cover the page, retreat to the widget (reverse transition), and the checkbox shows a green tick plus "Verified human in 12.4 s".
- **On fail:** the result overlay stays inside the game with **Try Again** (new random puzzle, same type) and **Next Game** buttons; a **Close** link collapses back to the unchecked box.
- **Reset:** a small "Reset CAPTCHA" link under the verified box returns to unchecked state without reloading the page.

### 0.2 Game view layout (full screen)
- **Background:** the current era PNG (1280x720, `image-rendering: pixelated`, `background-size: cover`, anchored bottom). Never draw a procedural or 3D platform. Only the PNG plus sprites, hotspots and HUD.
- **HUD (top bar, always visible):** left = game title + one-line goal; centre = countdown bar (30 s) with seconds number; right = lives (pixel hearts) and the **Game Selector**.
- **Warning line:** "This is a game. Not real security." small strip at the bottom of the game view.
- **Zones in the 1280x720 background (scale by percentage):** track y 515–560; platform floor y >= 560 (people stand with feet at y 600–690); station room x 25–315 (left); station name board x 88–248, y 270–298; clock centre (172,345); bench x 880–1010, y 585–655; lamp post x ~1200.

### 0.3 Game Selector (top right)
- Pixel dropdown labelled **GAME** with options: **Random (default)**, PIN Decoder, Impostor Carriage, Sort the Train, Spot the Robots, Lock-Pick Dial.
- Picking an option **immediately starts a fresh round** of that game (no reload, no collapse). The timer, lives and result overlay reset.
- Also support the URL params `?game=robots` (ids: `pin`, `impostor`, `sort`, `robots`, `lockpick`), `?era=past|present|future` and `?seed=12345` for testing.
- In Random mode, never pick the same game twice in a row.

### 0.4 Round lifecycle (state machine)
`IDLE -> INTRO (1.5 s, shows title + goal + "GO!") -> PLAYING (30 s) -> RESULT (PASS or FAIL) -> (Try Again -> INTRO) | (Next Game -> INTRO) | (Pass in Random mode -> collapse to verified box)`.
- Timer starts at the end of INTRO. Reaching 0 = FAIL ("Time's up").
- Pausing is not allowed. If the browser tab loses focus, the timer keeps running (simplest, and fair for all).
- Inputs are ignored outside PLAYING.

### 0.5 Randomisation
- Use a **seeded RNG** (mulberry32). Seed = Date.now() by default; shown as tiny text in the HUD corner so any bug can be reproduced.
- **Era is random every round** (past 1890 / present / future 2080). Era only changes visuals (background, train sprites, palettes, font accents) and the hint style of the PIN Decoder. It never changes rules or difficulty.
- Every puzzle is built by `generate(rng, era)` and must pass its own **solvability check** before being shown (regenerate if it fails, max 20 attempts, then use a hard-coded fallback puzzle).

### 0.6 Game module interface
```ts
type Era = 'past' | 'present' | 'future';
interface GameApi {
  pass(): void;                    // triggers VERIFIED
  fail(reason: string): void;      // triggers FAILED
  loseLife(): number;              // returns lives left; auto-fails at 0 when the game uses lives
  setStatus(text: string): void;   // small status text in the HUD
  now(): number;                   // ms since PLAYING started
  timeLeft(): number;
}
interface GameModule<P> {
  id: 'pin' | 'impostor' | 'sort' | 'robots' | 'lockpick';
  title: string;
  goal(p: P): string;              // one-line goal shown in HUD
  lives: number | null;
  generate(rng: () => number, era: Era): P;
  isSolvable(p: P): boolean;       // used in tests and as generation guard
  mount(root: HTMLElement, p: P, api: GameApi): () => void;  // returns cleanup
}
```
Each game lives in its own file (`/src/games/<id>.ts`) and is registered in `games/index.ts`. The framework owns the timer, lives display, result overlay and selector.

### 0.7 Feedback conventions
- **Correct action:** green flash + short "pop" (scale 1.15 -> 1 over 150 ms), optional chime.
- **Wrong action:** red flash on the element, 150 ms screen shake of 4 px, lose a heart (where the game has lives).
- **Pass:** pixel confetti burst + "VERIFIED ✓ HUMAN" banner (1.2 s).
- **Fail:** "FAILED ✗" with the reason ("Time's up", "Too many wrong taps"). Buttons: Try Again · Next Game · Close.
- Sounds are optional, off by default, with a visible mute toggle.

### 0.8 Input rules
- Everything works with **mouse, touch and keyboard** where relevant. Tap targets are at least 44x44 CSS px.
- Prevent double-triggering: after a tap is handled, ignore taps on the same element for 150 ms.

---

## GAME 1 — PIN DECODER (train, upgraded and fully random)

**Idea:** The station's door needs a PIN. Every carriage of the docked train carries one clue; decode them and type the PIN. The PIN and all clues are generated fresh each round.

**Why it proves humanity:** the clues mix arithmetic, counting objects in a picture and reading a colour legend, which needs a little visual reasoning.

**Train behaviour (it matters in this game):** times are on the 30 s round timer.
- During the INTRO (before the timer starts) the train rolls in from the right and docks.
- 0–24 s: **DOCKED**, every carriage clue is readable.
- 24–28 s: the train **departs**; clues become blurred/unreadable.
- 28–30 s: the platform is empty; the player can still type.
To keep it fair, tapping a clue **pins its decoded value** into a notepad strip in the HUD ("D1 = ?"). The player still has to decode it themselves; the notepad only stores the player's own notes: tapping a notepad slot lets them type a digit they worked out. This is optional.

**Setup:**
- PIN length: 4 digits (each 0–9; first digit may be 0).
- The train has **4 clue carriages + 2–3 decoy carriages** (decoys show harmless flavour text: "MIND THE GAP", "NO SMOKING", destination names) = 6–7 carriages total, in random order.
- Each clue carriage has a small tag **PIN ①/②/③/④** (a pixel circle number) so the player knows which digit it gives. Each carriage gives exactly **one digit**, so the PIN is always unique.

**Clue templates (one is chosen at random per digit, the answer must be 0–9):**
1. **ARITH:** `(a op b) op c` with a small expression, e.g. "(12 ÷ 2) + 3". Only generate if the result is an integer 0–9.
2. **COUNT:** a carriage drawn with exactly N windows (N = 2–6 only so they fit) and the text "COUNT MY WINDOWS". The digit is N. (The digit must not be 0–1 or 7–9 for this template.)
3. **LEGEND:** the platform board (the station name board) shows a colour legend, e.g. "RED=3, BLUE=7, GREEN=1, GOLD=5". The carriage is painted that colour. The digit is the colour's value. The legend is random each round; values are unique.
4. **POSITION:** "MY NUMBER × 2" and the carriage has a visible number plate (e.g. 3) -> 6. Only valid when result <= 9.
5. **ERA STYLE (hint style bonus, replaces ARITH):** past era shows **Roman numerals** ("VII"), present shows normal arithmetic, future shows **binary** ("0101" = 5).
- Within one round, use **at least 3 different templates**.

**Controls:** an on-screen keypad (0–9, Backspace, Enter) plus keyboard digits. The PIN display shows 4 boxes.

**Win:** the 4 digits entered and Enter pressed match the PIN. **Fail:** 3 wrong submissions (3 lives) or the timer ends.

**Feedback:** after Enter, each correct digit box turns green and each wrong one red (the digits stay); the player edits the wrong ones. This is the "live feedback" the hackathon asks for.

**Solvability test:** regenerate until every clue decodes to a single 0–9 digit and all templates are valid.

---

## GAME 2 — IMPOSTOR CARRIAGE (train)

**Idea:** The inspector says, "One of these carriages is a fake." All carriages match except one; the player taps the odd one out. It tests visual attention.

**Why humans pass and bots struggle:** the difference is small and changes every round (any trait), so a fixed script cannot target it.

**Train behaviour:**
- The train has **5–7 carriages** built from one carriage sprite (the era's own sprite) plus code overlays.
- Timeline: 0–2 s the train rolls in from the right; it then **stops in the middle of the screen** and stays still for **12 s** (the inspection window); then it rolls out to the left for 3 s and comes back on another pass (same train, **impostor in a new position** after reordering the carriages). This repeats for the whole round.
- The player can tap at any time; moving makes it harder, which is the intended difficulty.

**The impostor's trait (1 random trait per round; all other carriages share the base design):**
| Trait | Normal carriage | Impostor |
|---|---|---|
| Wheels | 4 wheels | 3 or 5 wheels |
| Windows | N windows (3–5) | N±1 windows |
| Window colour | one colour (from the era palette) | a different colour (>= 60° hue away) |
| Roof stripe | stripe colour C | a different stripe colour |
| Body tint | base sprite | hue-rotated by 40–70° (CSS filter) |
| Number plate | readable digits | horizontally mirrored digits |
| Lantern | none | a small lantern pixel on the roof |
- Base design traits are random per round (window count, colours) so the base itself varies between rounds.
- The difference must be at least **4 px** (in 1280-wide space) so it is visible on the sprites.
- Exactly **one** carriage differs, in exactly **one** trait.

**Controls:** tap or click a carriage. Hovering highlights a carriage with an outline.

**Rules:**
- **Win:** tap the impostor. It glows green, a "FAKE!" stamp appears, and the round passes.
- **Wrong tap:** the tapped carriage flashes red, -1 life. **3 lives**.
- **Fail:** 0 lives or 30 s runs out.
- **Hint at 15 s:** the HUD shows the trait category ("Look at the wheels").
- There is only this one hint.

**Solvability test:** count carriages that differ from the base: must equal exactly 1, and the diff must be visible per the size rule.

---

## GAME 3 — SORT THE TRAIN (train)

**Idea:** The carriages were shunted into the wrong order. The station board shows a rule; the player rearranges the carriages to match it before the train must depart (the 30 s timer is shown as the departure countdown).

**Why it proves humanity:** the rule changes every round, and it requires reading and reasoning.

**Train behaviour:** the train is **docked and stationary** the whole round (it is a manipulation puzzle). At 0 s on the timer it "departs" in the FAIL animation. An arrow labelled **FRONT ➜** shows which end is the first carriage, so "first" is never ambiguous.

**Setup:**
- **4–6 carriages** (random count each round) in a single row on the track.
- Each carriage shows a **plate** with all of: a number, a destination name, a weight in tonnes, and (drawn on the sprite) a window count and a colour band. All the values are **unique** across carriages (no ties).
- **Rule pool (1 chosen at random, shown on the station name board and in the HUD goal):**
  1. "FEWEST WINDOWS FIRST" (ascending window count)
  2. "NUMBER 1 TO N, FRONT TO BACK" (ascending plate numbers)
  3. "DESTINATIONS A TO Z"
  4. "LIGHTEST FIRST" (ascending weight)
  5. "COLOUR ORDER: RED, BLUE, GOLD, GREEN…" (the order is printed, using each carriage's colour band)
  6. "HEAVIEST FIRST" (descending weight)
- The start order is a random permutation that is **not already sorted** and needs **at least 2 swaps** (min swaps = n − number of cycles).

**Controls (swap method):**
1. Tap carriage A: it lifts up 8 px with an outline and the HUD says "Select another carriage to swap".
2. Tap carriage B: A and B swap positions with a 250 ms slide animation.
3. Tapping the selected carriage again cancels the selection.
- Optional drag-and-drop for desktop as an extra: dropping A on B swaps them.
- No swap limit.

**Live feedback:** after every swap, each carriage in its correct final slot gets a **green coupler light**, and the HUD shows "3/5 in place". Wrong ones show nothing (not red, to avoid giving away the solution position-by-position too aggressively; green only).

**Win:** all carriages in correct order (check after every swap). **Fail:** timer ends. No lives.

**Solvability test:** values are unique and a unique target order exists for the chosen rule; the start order is not the target.

---

## GAME 4 — SPOT THE ROBOTS (NO train)

**Idea:** Some "passengers" waiting on the platform are actually robots disguised as humans. Humans move unpredictably; robots move with perfect machine regularity. Find and tap all the robots. It plays directly with the question "what makes us human".

**Train behaviour: NO TRAIN.** The track is empty. The station name board shows **"NEXT TRAIN: DELAYED"** (overlaid text) so it makes sense that the passengers are waiting and wandering. The whole platform floor is the play area. Nothing arrives or leaves during the round.

**Scene:** the era background; a clear strip of platform where passengers walk: x 40–1240, y 600–690 (feet position), avoiding the lamp post and the bench (they walk in front of them; no collision).

**Passengers:**
- **10–12 passengers total**: **2–3 robots** (random), the rest humans.
- All passengers use the **same pixel sprite design** (about 12x22 px logical, scaled 3x) with random colour combos (hair, shirt, trousers) from the era's palette. Robots are **not** visually different, except one tiny detail: robots have a **1-pixel cyan "eye" that blinks exactly every 1.0 s** (this is a secondary hint; behaviour is the main clue).
- The era changes only the palette and outfit pieces (top hats in the past, caps in the present, visors in the future).

**Human behaviour (random, organic):**
- Speed 20–45 px/s, **changes every 1.5–4 s** (random).
- Direction: a random angle (any direction), changes every 1.5–4 s.
- Pauses: with 50% probability at each change, the person **stops for 0.6–1.5 s**. **Guarantee:** every human pauses at least once every 3 s.
- Small side-to-side wobble (±2 px, random phase) and uneven walking frames.
- Bounces softly off the play-area edges (turn toward the centre).

**Robot behaviour (perfectly regular):**
- Constant speed **40 px/s**, never changes.
- Moves **only along straight axis-aligned lines** (left/right/up/down), turns **exactly 90°** at fixed intervals (every 2.0 s) or at an edge.
- **Never pauses**, no wobble, walking frames advance on an exact 0.25 s beat.
- The cyan eye blinks on a fixed 1.0 s rhythm.
- Robots may start with different directions and phases so they do not move in sync.

**On-screen instructions (HUD goal):** "Find the robots. Robots never stop and never wobble." plus a counter **ROBOTS LEFT: 3**.

**Controls:** tap or click a passenger. The hit area is the sprite box plus 6 px. If several overlap, the nearest centre to the tap wins.

**Rules:**
- **Tap a robot:** it freezes, gets a "BOT" tag and sparkle burst; the counter drops by one.
- **Tap a human:** the human shows a "Hey!" speech bubble for 1 s and the player loses 1 of **3 lives**. A 0.5 s tap lockout prevents spam-clicking.
- **Win:** catch every robot.
- **Fail:** 3 wrong taps, or 30 s ends.
- **Hint at 15 s:** all robots' eyes glow brighter for 2 s once.

**Fairness rules:** passengers never leave the play area; humans pause often enough that the difference is visible within about 3 s of watching; no passenger starts overlapping another.

**Solvability test:** robots count is 2–3 and each robot has deterministic movement; humans each have at least one pause scheduled in the first 3 s.

---

## GAME 5 — LOCK-PICK DIAL (NO train)

**Idea:** A locker holds the "human pass". Pick its 3-pin lock by stopping a fast needle inside the green zone. It tests timing and reaction, something scripts can do too well, so we add random changes to keep it fun.

**Train behaviour: NO TRAIN.** The scene dims the era background; a big **lock dial** is in the middle (era skin: a brass vault dial in the past, a steel keypad lock in the present, a glowing holo-dial in the future). A small text says "STATION LOCKER 07".

**Dial mechanics:**
- A circular dial, 360°, drawn as a pixel ring with tick marks. A **needle** rotates around the centre.
- A **green target arc** is placed at a random angle.
- **3 pins** (3 sequential stages, shown as 3 small lights above the dial).
- Per stage settings:
  | Stage | Arc width | Needle speed | Extras |
  |---|---|---|---|
  | Pin 1 | 60° | 120°/s | none |
  | Pin 2 | 44° | 160°/s | the arc moves to a new random angle after pin 1 |
  | Pin 3 | 30° | 200°/s | direction may reverse at a random moment (once, between 1–2.5 s) |
- The needle's start angle and direction (clockwise / counter-clockwise) are random.
- The arc is never narrower than **24°** so a human always has a window of roughly 0.4 s or more.

**Controls:** press **Space/Enter** or tap/click the dial to "pick" at the needle's current angle. Hit test: the needle angle is within the arc (with +1° tolerance).

**Rules:**
- **Hit:** a lock "click" animation, the pin light turns green, the arc jumps to a new random angle, and the next stage begins (speed and width increase).
- **Miss:** the dial shakes, the pin light flashes red, **−1 life** (3 lives). The same stage continues, and the arc moves to a new random angle so spamming is not rewarded.
- **Spam guard:** after any press, input is locked for 300 ms.
- **Win:** all 3 pins picked. **Fail:** 3 misses or 30 s ends.
- **Hint:** Pin 1 shows the text "Press when the needle is in the green." and a faint pulse on the arc; the pulse disappears from pin 2 on.

**Solvability test:** stage speeds and arc widths satisfy `window_time = arc_width / speed >= 0.15 s` for every stage (with the table above: 0.5 s, 0.275 s, 0.15 s).

---

## PART 6 — ACCEPTANCE CHECKLIST (verify before the demo)

- [ ] Clicking the CAPTCHA checkbox opens the game with the pixel transition; passing collapses back with a green tick
- [ ] The game selector (top right) switches games instantly and Random avoids repeats
- [ ] 5 distinct games work; PIN Decoder and Impostor Carriage and Sort the Train use the train; Spot the Robots and Lock-Pick Dial do NOT show a train
- [ ] Every game finishes under 30 s with a clear PASS or FAIL screen
- [ ] Try Again / Next Game / Reset CAPTCHA work without reloading the page
- [ ] Puzzles are random each run (seeded) and never unsolvable
- [ ] The era (1890 / present / 2080) is random and only changes visuals
- [ ] Only the 2D PNG backgrounds are used (no generated 3D platform)
- [ ] The "This is a game. Not real security." line is visible
- [ ] `AI_LOG.md` updated, commits pushed to GitHub, 60-second pitch ready
