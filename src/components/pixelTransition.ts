/**
 * Pixel Train Transition Engine
 * Recreates the exact technique from reference/Login_Pixel_Train_Demo.html
 * - 8px block grid covering normal password input
 * - Glitch flicker (4 frames of 70ms)
 * - Blocks fall to bottom of viewport with staggered delay + bounce, landing as a pixel train
 * - Train chugs right while game screen rises via clip-path inset(100% 0 0 0) -> inset(0)
 * - Reverse on collapse: game wipes down, blocks fly up, re-form verified input
 */

const S = 8; // Pixel block size (px)

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function inputColor(r: number, c: number, rows: number, cols: number): string {
  const edge = r === 0 || c === 0 || r === rows - 1 || c === cols - 1;
  const pal = edge ? ['#d1d5db', '#9ca3af', '#3aa0e0'] : ['#ffffff', '#ffffff', '#f3f4f6'];
  return pal[Math.floor(Math.random() * pal.length)];
}

function trainColor(r: number, c: number, rows: number, _cols: number): string {
  const car = Math.floor(c / 9);
  const cc = c % 9;
  const palette = ['#3aa0e0', '#ef4444', '#f59e0b', '#10b981', '#a855f7'];
  const body = palette[car % palette.length];

  if (cc === 8) return r >= rows - 2 ? 'transparent' : '#334155'; // coupling gap
  if (r === 0) return '#1e293b'; // roof
  if (r === 1 || r === 2) return cc % 3 === 1 ? '#bfdbfe' : body; // windows
  if (r === 3) return body;
  return cc === 1 || cc === 2 || cc === 5 || cc === 6 ? '#f8fafc' : 'transparent'; // wheels
}

export interface TransitionCell {
  el: HTMLElement;
  r: number;
  c: number;
}

export async function launchPixelTrainTransition(
  inputEl: HTMLElement,
  gameEl: HTMLElement,
  onComplete: () => void
): Promise<void> {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReduced) {
    gameEl.style.display = 'flex';
    gameEl.style.clipPath = 'inset(0 0 0 0)';
    gameEl.style.opacity = '1';
    onComplete();
    return;
  }

  const rect = inputEl.getBoundingClientRect();
  const cols = Math.round(rect.width / S);
  const rows = Math.max(5, Math.round(rect.height / S));
  const W = window.innerWidth;
  const H = window.innerHeight;

  // 1. Create pixel block container
  const trainEl = document.createElement('div');
  trainEl.id = 'train-transition';
  trainEl.style.cssText = `position:fixed;z-index:9999;pointer-events:none;left:${rect.left}px;top:${rect.top}px;width:${cols * S}px;height:${rows * S}px;`;

  const cells: TransitionCell[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const el = document.createElement('i');
      el.style.cssText = `position:absolute;width:${S}px;height:${S}px;left:${c * S}px;top:${r * S}px;background:${inputColor(r, c, rows, cols)};`;
      trainEl.appendChild(el);
      cells.push({ el, r, c });
    }
  }

  document.body.appendChild(trainEl);
  inputEl.style.visibility = 'hidden';
  inputEl.blur();

  // 2. Glitch flicker (4 frames of 70ms)
  const glitchColors = ['#3aa0e0', '#93c5fd', '#ffffff', '#14122e', '#ffd445'];
  for (let k = 0; k < 4; k++) {
    cells.forEach((o) => {
      if (Math.random() < 0.5) {
        o.el.style.background = glitchColors[Math.floor(rnd(0, glitchColors.length))];
      }
    });
    await wait(70);
  }

  // 3. Blocks fall to bottom of screen and land as a PIXEL TRAIN
  const dy = H - 28 - rows * S - rect.top;
  const fallAnims = cells.map((o) =>
    o.el.animate(
      [
        { transform: 'translate(0,0)' },
        { transform: `translate(${rnd(-12, 12)}px, ${dy}px)`, offset: 0.8 },
        { transform: `translate(0, ${dy - rnd(6, 18)}px)`, offset: 0.9 },
        { transform: `translate(0, ${dy}px)` },
      ],
      {
        duration: 650,
        delay: rnd(0, 300) + o.c * 3,
        easing: 'cubic-bezier(.5, 0, .9, .6)',
        fill: 'forwards',
      }
    ).finished
  );

  await Promise.all(fallAnims);

  // Turn blocks into train colors
  cells.forEach((o) => {
    o.el.style.background = trainColor(o.r, o.c, rows, cols);
  });
  await wait(150);

  // 4. Train chugs off right while game screen rises via clip-path wipe
  gameEl.style.display = 'flex';
  const gameWipe = gameEl.animate(
    [
      { clipPath: 'inset(100% 0 0 0)' },
      { clipPath: 'inset(0 0 0 0)' },
    ],
    {
      duration: 1100,
      delay: 150,
      easing: 'cubic-bezier(.22, 1, .36, 1)',
      fill: 'forwards',
    }
  );

  trainEl.animate(
    [
      { transform: 'translateX(0)' },
      { transform: 'translateX(-14px)', offset: 0.12 },
      { transform: `translateX(${W - rect.left + 50}px)` },
    ],
    {
      duration: 1500,
      easing: 'cubic-bezier(.6, 0, .9, .5)',
      fill: 'forwards',
    }
  );

  // Wheels bounce micro-animation
  cells.forEach((o) => {
    if (o.r === rows - 1 || o.r === rows - 2) {
      o.el.animate(
        [
          { transform: `translate(0, ${dy}px)` },
          { transform: `translate(0, ${dy - 2}px)` },
          { transform: `translate(0, ${dy}px)` },
        ],
        { duration: 160, iterations: 10 }
      );
    }
  });

  await gameWipe.finished;
  await wait(300);

  trainEl.remove();
  onComplete();
}

export async function collapsePixelTrainTransition(
  inputEl: HTMLElement,
  gameEl: HTMLElement,
  onComplete: () => void
): Promise<void> {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReduced) {
    gameEl.style.display = 'none';
    inputEl.style.visibility = '';
    onComplete();
    return;
  }

  // 1. Game screen wipes back down with clip-path
  const gameClose = gameEl.animate(
    [
      { clipPath: 'inset(0 0 0 0)' },
      { clipPath: 'inset(100% 0 0 0)' },
    ],
    {
      duration: 900,
      easing: 'cubic-bezier(.22, 1, .36, 1)',
      fill: 'forwards',
    }
  );

  await gameClose.finished;
  gameEl.style.display = 'none';

  // 2. Blocks fly back up from bottom and re-form original password input
  const rect = inputEl.getBoundingClientRect();
  const cols = Math.round(rect.width / S);
  const rows = Math.max(5, Math.round(rect.height / S));
  const H = window.innerHeight;
  const dy = H - 28 - rows * S - rect.top;

  const reverseTrainEl = document.createElement('div');
  reverseTrainEl.id = 'train-transition-reverse';
  reverseTrainEl.style.cssText = `position:fixed;z-index:9999;pointer-events:none;left:${rect.left}px;top:${rect.top}px;width:${cols * S}px;height:${rows * S}px;`;

  const cells: TransitionCell[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const el = document.createElement('i');
      el.style.cssText = `position:absolute;width:${S}px;height:${S}px;left:${c * S}px;top:${r * S}px;background:${trainColor(r, c, rows, cols)};transform:translate(0, ${dy}px);`;
      reverseTrainEl.appendChild(el);
      cells.push({ el, r, c });
    }
  }

  document.body.appendChild(reverseTrainEl);

  const riseAnims = cells.map((o) =>
    o.el.animate(
      [
        { transform: `translate(0, ${dy}px)` },
        { transform: `translate(${rnd(-8, 8)}px, ${dy * 0.3}px)`, offset: 0.6 },
        { transform: 'translate(0, -6px)', offset: 0.88 },
        { transform: 'translate(0, 0)' },
      ],
      {
        duration: 650,
        delay: rnd(0, 200) + (cols - o.c) * 3,
        easing: 'cubic-bezier(.22, 1, .36, 1)',
        fill: 'forwards',
      }
    ).finished
  );

  await Promise.all(riseAnims);

  // 3. Verified pulse: turn green/white
  cells.forEach((o) => {
    const isEdge = o.r === 0 || o.c === 0 || o.r === rows - 1 || o.c === cols - 1;
    o.el.style.background = isEdge ? '#4ade80' : '#ffffff';
  });

  await wait(200);

  reverseTrainEl.remove();
  inputEl.style.visibility = '';
  onComplete();
}
