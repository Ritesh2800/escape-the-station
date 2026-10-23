# 🚂 Escape the Station: Chrono-Shift

> A password puzzle game disguised as a normal password field. Click it, and it expands into a pixel-art train station across three eras. Solve clues, crack the code, and watch it collapse back.

⚠️ **This is a game. DO NOT enter any real password.** All validation happens locally in the browser — nothing is sent, stored, or logged.

---

## How to Run

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## How to Play

1. **Click the password field** — it smoothly expands into the game
2. **Explore the station** — find clues on signs, boards, and train carriages
3. **Level 1:** Enter the 6-digit dispatch code using clues from the platform
4. **Level 2:** Shift between three eras (1890 / Present / 2080) to discover rules and build a password that satisfies all 5 validators
5. **Win** — watch the game collapse back into a verified password field

## Eras

| Era | Look | Accent |
|---|---|---|
| 1890 — Steam | Warm sunset, brick station | Amber |
| NOW — Present | Bright daytime, red station | Sky blue |
| 2080 — Cyber | Neon night, holograms | Cyan + Magenta |

## Rules (Level 2)

1. **CHAR_TYPES** — Exactly 6 characters with letters, digits, and symbols
2. **ANCHORS** — Starts with `@`, ends with `8`
3. **DIGIT_SUM** — All digits sum to 10
4. **SYMBOL_LOGIC** — No `#` if `@` present; `!` immediately followed by `E`
5. **STATION_ID** — Contains the station code `S2`

## Tech Stack

Vite + React + TypeScript + Tailwind CSS

## Hackathon

**PS2 — Puzzle Passwords** | 8+ rules/clues across 2 levels | Live pass/fail feedback | Unique expand/collapse mechanic
