/**
 * Pixel Expand & Retreat Transition Engine
 * Follows reference/Login_Pixel_Expand_Demo.html exactly:
 * - 8px block grid covering the input (pixelate & glitch)
 * - Chunky canvas blocks spread across the full screen from input (spreadIn)
 * - Canvas blocks dissolve outward to reveal the game layer (eraseOut)
 * - On win/collapse: canvas blocks cover the screen (coverRandom), retreat toward input (eraseToward)
 * - Input blocks glitch and dissolve back into plain input
 * No CSS clip-path expansion or falling-train animation.
 */

const S = 8; // Pixel block size for input grid (px)

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Colour of a block when it looks like the plain input or captcha box
function inputColor(r: number, c: number, rows: number, cols: number): string {
  const edge = r === 0 || c === 0 || r === rows - 1 || c === cols - 1;
  if (edge) return pick(['#d1d5db', '#cbd5e1', '#9ca3af']);
  // Near right edge where captcha brand logo sits
  if (c >= cols - 8 && r <= 4 && Math.random() < 0.35) {
    return pick(['#1a73e8', '#4285f4']);
  }
  // Near left edge where checkbox sits
  if (c <= 4 && r >= 2 && r <= rows - 3 && (c === 1 || c === 4 || r === 2 || r === rows - 3) && Math.random() < 0.4) {
    return '#94a3b8';
  }
  return pick(['#ffffff', '#ffffff', '#f8fafc', '#f1f5f9']);
}

// Colour of a block when it looks like the game panel
function gameColor(r: number, c: number, rows: number, cols: number): string {
  const edge = r === 0 || c === 0 || r === rows - 1 || c === cols - 1;
  return edge ? pick(['#16204a', '#2563eb', '#0b1026']) : pick(['#0b1026', '#0b1026', '#101838']);
}

const GLITCH = ['#2563eb', '#93c5fd', '#ffffff', '#0b1026', '#22d3ee'];
const HOT = ['#22d3ee', '#60a5fa', '#ffffff', '#2563eb']; // bright "frontier" pixels
const DARK = ['#0b1026', '#0b1026', '#101838', '#0e1430']; // settled dark pixels

export interface GridCell {
  el: HTMLElement;
  r: number;
  c: number;
}

export interface GridState {
  el: HTMLElement;
  cells: GridCell[];
  rows: number;
  cols: number;
}

export interface CoverItem {
  x: number;
  y: number;
  d: number;
  t: number;
  n: number;
}

export interface CoverState {
  cv: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  items: CoverItem[];
  B: number;
}

// Overlay of small blocks covering the input rect exactly
export function buildGrid(
  rect: DOMRect,
  colorFn: (r: number, c: number, rows: number, cols: number) => string
): GridState {
  const cols = Math.max(4, Math.round(rect.width / S));
  const rows = Math.max(3, Math.round(rect.height / S));
  const el = document.createElement('div');
  el.id = 'grid';
  el.style.cssText = `position:fixed;left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px;z-index:40;pointer-events:none;--w:${rect.width / cols + 0.5}px;--h:${rect.height / rows + 0.5}px;`;

  const cells: GridCell[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const b = document.createElement('i');
      b.style.cssText = `position:absolute;left:${(c * rect.width) / cols}px;top:${(r * rect.height) / rows}px;width:${rect.width / cols + 0.5}px;height:${rect.height / rows + 0.5}px;background:${colorFn(r, c, rows, cols)};`;
      el.appendChild(b);
      cells.push({ el: b, r, c });
    }
  }
  document.body.appendChild(el);
  return { el, cells, rows, cols };
}

export async function glitch(g: GridState, frames = 3) {
  for (let k = 0; k < frames; k++) {
    g.cells.forEach((o) => {
      if (Math.random() < 0.5) o.el.style.background = pick(GLITCH);
    });
    await wait(50);
  }
}

// Blocks dissolve from one look to the other with random stagger
export async function morph(
  g: GridState,
  colorFn: (r: number, c: number, rows: number, cols: number) => string
) {
  g.cells.forEach((o) => {
    o.el.style.transition = `background ${rnd(80, 180)}ms ease ${rnd(0, 120)}ms`;
    o.el.style.background = colorFn(o.r, o.c, g.rows, g.cols);
  });
  await wait(240);
}

// ---------- Full-screen pixel cover (canvas) ----------

// One item per block, with its distance (0..1) from the input rectangle
export function makeCover(rect: DOMRect): CoverState {
  const W = window.innerWidth,
    H = window.innerHeight;
  // Chunky pixel blocks (~2200 max for high performance and authentic chunky 8-bit feel)
  const B = Math.max(16, Math.ceil(Math.sqrt((W * H) / 2200)));
  const cv = document.createElement('canvas');
  cv.id = 'cover';
  cv.width = W;
  cv.height = H;
  cv.style.cssText = `position:fixed;left:0;top:0;width:${W}px;height:${H}px;z-index:60;pointer-events:none;image-rendering:pixelated;`;
  document.body.appendChild(cv);
  const ctx = cv.getContext('2d')!;
  const items: CoverItem[] = [];
  let maxD = 1;
  for (let y = 0; y < H; y += B) {
    for (let x = 0; x < W; x += B) {
      const cx = x + B / 2,
        cy = y + B / 2;
      const dx = Math.max(rect.left - cx, 0, cx - rect.right);
      const dy = Math.max(rect.top - cy, 0, cy - rect.bottom);
      const d = Math.hypot(dx, dy);
      if (d > maxD) maxD = d;
      items.push({ x, y, d, t: 0, n: 0 });
    }
  }
  items.forEach((o) => {
    o.n = o.d / maxD;
  });
  return { cv, ctx, items, B };
}

// Runs through items in order of their .t (ms); calls draw() for each; resolves when done
export function play(
  c: CoverState,
  ms: number,
  setT: (o: CoverItem) => number,
  draw: (o: CoverItem, first: boolean) => void,
  hotMs = 0
): Promise<void> {
  c.items.forEach((o) => {
    o.t = setT(o) * ms;
  });
  const list = c.items.slice().sort((a, b) => a.t - b.t);
  return new Promise((res) => {
    const t0 = performance.now();
    let i = 0;
    const hot: { o: CoverItem; at: number }[] = [];
    let hotHead = 0; // O(1) queue pointer instead of expensive array shifts

    function frame() {
      const now = performance.now() - t0;
      while (i < list.length && list[i].t <= now) {
        draw(list[i], true);
        hot.push({ o: list[i], at: now });
        i++;
      }
      while (hotHead < hot.length && now - hot[hotHead].at > hotMs) {
        draw(hot[hotHead].o, false);
        hotHead++;
      }
      if (i >= list.length && hotHead >= hot.length) {
        res();
      } else {
        requestAnimationFrame(frame);
      }
    }
    requestAnimationFrame(frame);
  });
}

export const paint = (c: CoverState, o: CoverItem, color: string) => {
  c.ctx.fillStyle = color;
  c.ctx.fillRect(o.x, o.y, c.B, c.B);
};

// Pixels spread across the page from the input, in bright colours that settle to dark
export const spreadIn = (c: CoverState, ms: number) =>
  play(
    c,
    ms,
    (o) => o.n * 0.85 + Math.random() * 0.15,
    (o, first) => paint(c, o, first ? pick(HOT) : pick(DARK)),
    160
  );

// Pixels vanish and uncover what is underneath (outward from the input = reveal the game)
export const eraseOut = (c: CoverState, ms: number) =>
  play(
    c,
    ms,
    (o) => o.n * 0.8 + Math.random() * 0.2,
    (o, first) => {
      if (first) c.ctx.clearRect(o.x, o.y, c.B, c.B);
    },
    0
  );

// Random dissolve that covers the page
export const coverRandom = (c: CoverState, ms: number) =>
  play(
    c,
    ms,
    () => Math.random(),
    (o, first) => paint(c, o, first ? pick(HOT) : pick(DARK)),
    120
  );

// Pixels retreat toward the input (far ones vanish first)
export const eraseToward = (c: CoverState, ms: number) =>
  play(
    c,
    ms,
    (o) => (1 - o.n) * 0.8 + Math.random() * 0.2,
    (o, first) => {
      if (first) c.ctx.clearRect(o.x, o.y, c.B, c.B);
    },
    0
  );

export async function launchPixelTransition(
  inputEl: HTMLElement,
  gameEl: HTMLElement,
  onComplete: () => void
): Promise<void> {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rect = inputEl.getBoundingClientRect();

  if (reduce) {
    inputEl.style.visibility = 'hidden';
    gameEl.classList.add('on');
    onComplete();
    return;
  }

  // 1) The input turns into pixel blocks, glitches, then turns dark
  const grid = buildGrid(rect, inputColor);
  inputEl.style.visibility = 'hidden';

  await glitch(grid, 3);
  await morph(grid, gameColor);

  // 2) Pixels SPREAD across the whole page, starting from the input
  const cover = makeCover(rect);
  await spreadIn(cover, 480);
  gameEl.classList.add('on'); // game is now ready, hidden behind the pixels
  grid.el.remove();

  // 3) The pixels dissolve outward and uncover the game
  await eraseOut(cover, 420);
  cover.cv.remove();

  onComplete();
}

export async function collapsePixelTransition(
  inputEl: HTMLElement,
  gameEl: HTMLElement,
  onComplete: () => void
): Promise<void> {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rect = inputEl.getBoundingClientRect();

  if (reduce) {
    gameEl.classList.remove('on');
    inputEl.style.visibility = '';
    onComplete();
    return;
  }

  // 1) Pixels dissolve over the whole game
  const cover = makeCover(rect);
  await coverRandom(cover, 360);
  gameEl.classList.remove('on');
  const grid = buildGrid(rect, gameColor); // dark blocks wait under the cover, exactly at the input

  // 2) Pixels retreat toward the input position
  await eraseToward(cover, 400);
  cover.cv.remove();

  // 3) The remaining blocks glitch and dissolve back into the plain input
  await glitch(grid, 3);
  await morph(grid, inputColor);
  grid.el.remove();

  inputEl.style.visibility = '';
  onComplete();
}
