import { useCallback, useEffect, useRef, useState } from 'react';
import { SPRITES } from '../mascot/sprites.js';

const SIZE = 4;

const emptyGrid = () => Array.from({ length: SIZE }, () => Array(SIZE).fill(0));

function addRandomTile(grid) {
  const empty = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c] === 0) empty.push([r, c]);
    }
  }
  if (!empty.length) return grid;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  const next = grid.map((row) => [...row]);
  next[r][c] = Math.random() < 0.9 ? 2 : 4;
  return next;
}

function initGrid() {
  return addRandomTile(addRandomTile(emptyGrid()));
}

function slideLine(line) {
  const nums = line.filter((n) => n !== 0);
  const merged = [];
  let gained = 0;
  for (let i = 0; i < nums.length; i++) {
    if (i + 1 < nums.length && nums[i] === nums[i + 1]) {
      const val = nums[i] * 2;
      merged.push(val);
      gained += val;
      i++;
    } else {
      merged.push(nums[i]);
    }
  }
  while (merged.length < SIZE) merged.push(0);
  return { line: merged, gained };
}

function moveGrid(grid, dir) {
  const next = emptyGrid();
  let gained = 0;
  let moved = false;

  for (let i = 0; i < SIZE; i++) {
    const raw = [];
    for (let j = 0; j < SIZE; j++) {
      if (dir === 'left') raw.push(grid[i][j]);
      else if (dir === 'right') raw.push(grid[i][SIZE - 1 - j]);
      else if (dir === 'up') raw.push(grid[j][i]);
      else raw.push(grid[SIZE - 1 - j][i]);
    }
    const { line, gained: g } = slideLine(raw);
    gained += g;
    for (let j = 0; j < SIZE; j++) {
      if (line[j] !== raw[j]) moved = true;
      if (dir === 'left') next[i][j] = line[j];
      else if (dir === 'right') next[i][SIZE - 1 - j] = line[j];
      else if (dir === 'up') next[j][i] = line[j];
      else next[SIZE - 1 - j][i] = line[j];
    }
  }

  return { next, gained, moved };
}

function canMove(grid) {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const v = grid[r][c];
      if (v === 0) return true;
      if (r + 1 < SIZE && grid[r + 1][c] === v) return true;
      if (c + 1 < SIZE && grid[r][c + 1] === v) return true;
    }
  }
  return false;
}

function has2048(grid) {
  return grid.some((row) => row.some((v) => v >= 2048));
}

const TILE_STYLE = {
  0: 'bg-paper text-transparent',
  2: 'bg-white text-ink',
  4: 'bg-[#FFF3B0] text-ink',
  8: 'bg-sun text-ink',
  16: 'bg-[#FFB3C6] text-ink',
  32: 'bg-hot text-white',
  64: 'bg-[#FF6B35] text-white',
  128: 'bg-neon text-ink',
  256: 'bg-cobalt text-white',
  512: 'bg-[#C9B8FF] text-ink',
  1024: 'bg-ink text-sun',
  2048: 'bg-ink text-neon ring-2 ring-sun',
};

const tileCls = (v) => TILE_STYLE[v] || 'bg-ink text-neon';
const tileFont = (v) => (v >= 1024 ? 'text-xl sm:text-2xl' : v >= 128 ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-4xl');

export default function Game2048({ signedIn, serverBest, onSignIn, onSaveScore }) {
  const [grid, setGrid] = useState(initGrid);
  const [score, setScore] = useState(0);
  const [localBest, setLocalBest] = useState(0);
  const [wonAck, setWonAck] = useState(false);
  const [over, setOver] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const touchStart = useRef(null);
  const boardRef = useRef(null);
  const pointerStart = useRef(null);
  const lastSavedRef = useRef(0);

  const best = Math.max(localBest, serverBest || 0);

  useEffect(() => {
    if (serverBest > localBest) setLocalBest(serverBest);
    if (serverBest > lastSavedRef.current) lastSavedRef.current = serverBest;
  }, [serverBest, localBest]);

  const persistScore = useCallback(async (val, forceMsg = false) => {
    if (!signedIn || val <= 0 || val <= lastSavedRef.current) return;
    setSaving(true);
    try {
      const res = await onSaveScore(val);
      if (res?.saved) {
        lastSavedRef.current = res.bestScore;
        setSavedMsg(`Saved record: ${res.bestScore.toLocaleString('en-US')}`);
      } else if (forceMsg) {
        setSavedMsg('Score synced!');
      }
    } catch {
      /* ignore silent sync errors */
    } finally {
      setSaving(false);
    }
  }, [signedIn, onSaveScore]);

  // Auto-save whenever player beats their saved best (debounced so every move doesn't spam writes)
  useEffect(() => {
    if (!signedIn || score <= lastSavedRef.current) return;
    const t = setTimeout(() => persistScore(score), over ? 100 : 1800);
    return () => clearTimeout(t);
  }, [score, over, signedIn, persistScore]);

  const step = useCallback((dir) => {
    setGrid((prev) => {
      if (over) return prev;
      const { next, gained, moved } = moveGrid(prev, dir);
      if (!moved) return prev;
      const spawned = addRandomTile(next);
      setScore((s) => {
        const ns = s + gained;
        setLocalBest((b) => Math.max(b, ns));
        return ns;
      });
      if (!canMove(spawned)) setOver(true);
      return spawned;
    });
  }, [over]);

  const restart = () => {
    if (signedIn && score > lastSavedRef.current) persistScore(score);
    setGrid(initGrid());
    setScore(0);
    setOver(false);
    setWonAck(false);
    setSavedMsg('');
  };

  // Keyboard controls
  useEffect(() => {
    const map = {
      ArrowLeft: 'left', a: 'left', A: 'left',
      ArrowRight: 'right', d: 'right', D: 'right',
      ArrowUp: 'up', w: 'up', W: 'up',
      ArrowDown: 'down', s: 'down', S: 'down',
    };
    const onKey = (e) => {
      if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      const dir = map[e.key];
      if (!dir) return;
      e.preventDefault();
      step(dir);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step]);

  // Reliable non-passive touch swipe on the board (prevents page scroll / pull-to-refresh on mobile)
  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;

    const triggerSwipe = (dx, dy) => {
      if (Math.abs(dx) > Math.abs(dy)) step(dx > 0 ? 'right' : 'left');
      else step(dy > 0 ? 'down' : 'up');
    };

    const onTouchStart = (e) => {
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      touchStart.current = { x: t.clientX, y: t.clientY, handled: false };
    };

    const onTouchMove = (e) => {
      if (!touchStart.current || e.touches.length !== 1) return;
      if (e.cancelable) e.preventDefault();
      if (touchStart.current.handled) return;
      const t = e.touches[0];
      const dx = t.clientX - touchStart.current.x;
      const dy = t.clientY - touchStart.current.y;
      if (Math.max(Math.abs(dx), Math.abs(dy)) >= 22) {
        touchStart.current.handled = true;
        triggerSwipe(dx, dy);
      }
    };

    const onTouchEnd = (e) => {
      if (!touchStart.current) return;
      const t = e.changedTouches[0];
      if (!touchStart.current.handled && t) {
        const dx = t.clientX - touchStart.current.x;
        const dy = t.clientY - touchStart.current.y;
        if (Math.max(Math.abs(dx), Math.abs(dy)) >= 18) {
          triggerSwipe(dx, dy);
        }
      }
      touchStart.current = null;
    };

    const onTouchCancel = () => {
      touchStart.current = null;
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('touchcancel', onTouchCancel, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchCancel);
    };
  }, [step]);

  // Mouse / stylus drag swipe fallback (touch handled above via non-passive listeners)
  const onPointerDown = (e) => {
    if (e.pointerType === 'touch') return;
    pointerStart.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e) => {
    if (e.pointerType === 'touch' || !pointerStart.current) return;
    const dx = e.clientX - pointerStart.current.x;
    const dy = e.clientY - pointerStart.current.y;
    pointerStart.current = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    if (Math.abs(dx) > Math.abs(dy)) step(dx > 0 ? 'right' : 'left');
    else step(dy > 0 ? 'down' : 'up');
  };

  const won = !wonAck && has2048(grid);
  const mascot = over ? SPRITES.think : won ? SPRITES.thanks : score > 500 ? SPRITES.jump : SPRITES.hello;

  return (
    <div className="box shadow-b8 p-4 sm:p-6 max-w-md w-full mx-auto flex flex-col gap-4 select-none">
      {/* Score & controls */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <img src={mascot.src} alt="" draggable={false} className="w-11 h-11 object-contain" />
          <div>
            <div className="text-2xl font-extrabold uppercase leading-none">2048</div>
            <div className="font-mono text-[11px] text-mute">Rattie Edition</div>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="border-[3px] border-ink rounded-xl bg-sun px-3 py-1.5 text-center min-w-[74px]">
            <div className="font-mono text-[10px] font-bold uppercase">Score</div>
            <div className="font-mono text-base font-extrabold leading-tight">{score}</div>
          </div>
          <div className="border-[3px] border-ink rounded-xl bg-neon px-3 py-1.5 text-center min-w-[74px]">
            <div className="font-mono text-[10px] font-bold uppercase">Best</div>
            <div className="font-mono text-base font-extrabold leading-tight">{best}</div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-xs text-mute">
          {signedIn ? (saving ? 'Saving…' : savedMsg || 'Best score saves automatically') : 'Sign in to save your score'}
        </span>
        <div className="flex gap-2">
          {!signedIn && (
            <button type="button" onClick={onSignIn} className="tag bg-neon text-ink">Sign in</button>
          )}
          <button type="button" onClick={restart} className="btn bg-white text-xs px-3 py-1.5">↻ New game</button>
        </div>
      </div>

      {/* 4x4 Grid */}
      <div
        ref={boardRef}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        style={{ touchAction: 'none' }}
        className="relative bg-ink border-[3px] border-ink rounded-2xl p-2.5 sm:p-3 grid grid-cols-4 gap-2 sm:gap-2.5 touch-none overscroll-none select-none"
      >
        {grid.flat().map((v, idx) => (
          <div
            key={idx}
            className={`aspect-square rounded-xl border-2 border-ink flex items-center justify-center font-extrabold transition-colors ${tileCls(v)} ${tileFont(v)}`}
          >
            {v > 0 ? v : ''}
          </div>
        ))}

        {(over || won) && (
          <div className="absolute inset-0 bg-ink/80 rounded-xl flex items-center justify-center p-4">
            <div className="bg-white border-4 border-ink rounded-2xl shadow-b6 p-5 text-center max-w-xs w-full flex flex-col gap-3">
              <div className="text-3xl">{won ? '🏆' : '🐭'}</div>
              <h3 className="text-2xl font-extrabold uppercase">{won ? 'You reached 2048!' : 'Game over!'}</h3>
              <p className="font-mono text-sm font-bold">Final score: {score}</p>
              <div className="flex flex-wrap justify-center gap-2">
                {won && (
                  <button type="button" onClick={() => setWonAck(true)} className="btn bg-neon text-xs">
                    Keep playing
                  </button>
                )}
                <button type="button" onClick={restart} className="btn bg-sun text-xs">
                  Play again
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile D-pad + desktop hint */}
      <div className="flex flex-col items-center gap-2 pt-1">
        <button type="button" aria-label="Up" onClick={() => step('up')} className="btn bg-white w-14 h-11 text-lg p-0">▲</button>
        <div className="flex gap-2">
          <button type="button" aria-label="Left" onClick={() => step('left')} className="btn bg-white w-14 h-11 text-lg p-0">◀</button>
          <button type="button" aria-label="Down" onClick={() => step('down')} className="btn bg-white w-14 h-11 text-lg p-0">▼</button>
          <button type="button" aria-label="Right" onClick={() => step('right')} className="btn bg-white w-14 h-11 text-lg p-0">▶</button>
        </div>
        <p className="font-mono text-[11px] text-mute text-center">Swipe, use arrow keys / WASD, or tap the arrows</p>
      </div>
    </div>
  );
}
