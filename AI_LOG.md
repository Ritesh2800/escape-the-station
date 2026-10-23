# AI Log — Escape the Station: Chrono-Shift

> This file logs every AI tool and prompt used, what it produced, and what was manually changed.

---

## Stage 1 — Shell (expand/collapse animation)

**Date:** 2026-10-23

**AI Tool:** Google Antigravity (Claude Opus 4.6 Thinking)

**What was done:**
1. Scaffolded Vite + React + TypeScript project with `create-vite@latest --template react-ts`
2. Installed Tailwind CSS v4 via `@tailwindcss/vite` plugin
3. Created the collapsed password card component (`PasswordField.tsx`) — normal-looking input with eye icon, helper text, and verified state
4. Created the FLIP expand/collapse overlay (`GameOverlay.tsx`) implementing the signature animation:
   - Measures input rect with `getBoundingClientRect()` on click
   - Renders fixed-position overlay that animates from input rect to full viewport
   - Cross-fades plain style → pixel style (Press Start 2P, 4px borders, dark navy) in the first 40%
   - Fades in the present-era background image in the last 40%
   - Reverse animation on collapse
   - Uses `requestAnimationFrame` with exponential ease-out (close to `cubic-bezier(0.22, 1, 0.36, 1)`)
5. Created game state reducer (`game/state.ts`) with typed actions for the UI lifecycle
6. Created game config (`game/config.ts`) with constants from spec sections 4, 5, 9.2, 9.6
7. Added Press Start 2P and Inter fonts via Google Fonts
8. Generated a placeholder present-era background image (the original images were lost during project scaffolding)
9. Temporary "Solve" button triggers collapse with verified state after 2s delay
10. "Don't use a real password" warning visible in both collapsed and expanded states
11. `prefers-reduced-motion` support replaces animation with instant transition

**What was manually changed:** Nothing — all code was AI-generated and tested in the browser.

**Result:** All three states (collapsed → expanded → verified) work with smooth animation and zero console errors.
