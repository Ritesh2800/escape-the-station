# Escape the Station: Chrono-Shift

> A password field that transforms into a pixel-art train station puzzle game.

## 🚂 One-Line Pitch

Click a normal password field → it explodes into pixels that fall into a train → a full pixel-art game rises from below where you crack passwords by reading clues from a time-shifting train station.

## 🎮 How to Run

```bash
npm install && npm run dev
```

Open http://localhost:5173 in your browser.

## 🕹️ How to Play

1. **Click the password field** — watch the pixel train transition
2. **Level 1 (Platform Dispatch):** Find 3 clues on the station platform to enter a 6-digit code on the keypad. Wait for the train to dock to read the rear carriage!
3. **Level 2 (Chrono-Vault):** Toggle between 3 eras (1890 / Present / 2080), find 6 clues, and type a 6-character password that satisfies 5 rules simultaneously.
4. **Win** — the game collapses back into a verified password field.

## 🔮 Eras

| Era | Accent | Theme |
|-----|--------|-------|
| 1890 | Gold | Victorian steam station |
| Present | Blue | Modern station |
| 2080 | Cyan | Cyberpunk neon station |

## 📜 Level 2 Rules

1. **CHAR_TYPES** — exactly 6 characters with letter + digit + symbol
2. **ANCHORS** — starts with Power Symbol, ends with Split Value
3. **DIGIT_SUM** — digits sum to Target Digit Sum
4. **SYMBOL_LOGIC** — @ forbids #; ! must precede Engine Vowel
5. **STATION_ID** — contains Station Sector Code

## ⚠️ Security Note

**This is a game. DO NOT enter any real password.** Nothing is sent, stored, or logged. All checking happens locally in your browser.

## 🛠️ Tech Stack

- Vite + React + TypeScript + Tailwind CSS
- Press Start 2P pixel font
- Web Animations API for pixel train transition
- No backend, no external APIs

## 📁 Project Structure

```
/src
  /components   PasswordField, GameOverlay, Scene, Train, HUD,
                RuleList, Keypad, ClueHotspot, EraToggle, WinScreen
  /game         config.ts, levels.ts, validators.ts, trainLoop.ts, state.ts
  /assets       Pixel art backgrounds (past, present, future)
AI_LOG.md       AI tool usage log
README.md       This file
```
