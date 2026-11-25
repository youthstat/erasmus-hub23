import { useCallback, useEffect, useRef, useState } from 'react';
import { SPRITES } from '../mascot/sprites.js';

const SIZE = 4;
const MUTE_KEY = 'rattie2048_muted';

const TILE_STYLE = {
  2: 'bg-[#FFF3B0] text-ink',
  4: 'bg-[#FFE600] text-ink',
  8: 'bg-[#FF9F1C] text-ink',
  16: 'bg-[#FF4365] text-white',
  32: 'bg-[#FF007F] text-white',
  64: 'bg-[#00FF66] text-ink',
  128: 'bg-[#00E5FF] text-ink',
  256: 'bg-[#2E5BFF] text-white',
  512: 'bg-[#9D4EDD] text-white',
  1024: 'bg-[#FF5400] text-white ring-2 ring-sun',
  2048: 'bg-ink text-[#00FF66] ring-4 ring-[#FFE600]',
};

const tileCls = (v) => TILE_STYLE[v] || 'bg-[#FF0055] text-[#FFE600] ring-4 ring-white';
const tileFont = (v) => (v >= 1024 ? 'text-xl sm:text-2xl' : v >= 128 ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-4xl');

function createAudioEngine() {
  let ctx = null;
  const getCtx = () => {
    if (typeof window === 'undefined') return null;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!ctx) ctx = new AudioCtx();
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  };

  const playTone = (freq, endFreq, duration, type = 'sine', gainVal = 0.08, delay = 0) => {
    const c = getCtx();
    if (!c) return;
    const t0 = c.currentTime + delay;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (endFreq !== freq) osc.frequency.exponentialRampToValueAtTime(Math.max(40, endFreq), t0 + duration);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(gainVal, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.015);
  };

  return {
    unlock: () => { getCtx(); },
    slide: () => playTone(210, 145, 0.07, 'triangle', 0.065),
    merge: (maxVal) => {
      const step = Math.min(10, Math.max(1, Math.log2(maxVal || 4)));
      const base = 290 + step * 48;
      playTone(base, base * 1.28, 0.11, 'sine', 0.09);
      playTone(base * 1.5, base * 1.65, 0.09, 'triangle', 0.05, 0.03);
    },
    win: () => {
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => playTone(f, f, 0.18, 'triangle', 0.08, i * 0.07));
    },
    over: () => {
      playTone(260, 130, 0.25, 'sawtooth', 0.05);
    },
  };
}

function makeGridFromTiles(tiles) {
  const g = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
  for (const t of tiles) {
    if (!t.dying) g[t.row][t.col] = t;
  }
  return g;
}

function spawnTile(tiles, nextIdRef) {
  const occupied = new Set(tiles.filter((t) => !t.dying).map((t) => `${t.row},${t.col}`));
  const empty = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (!occupied.has(`${r},${c}`)) empty.push([r, c]);
    }
  }
  if (!empty.length) return tiles;
  const [row, col] = empty[Math.floor(Math.random() * empty.length)];
  const value = Math.random() < 0.9 ? 2 : 4;
  return [...tiles, { id: nextIdRef.current++, value, row, col, isNew: true }];
}

function createInitialTiles(nextIdRef) {
  let t = spawnTile([], nextIdRef);
  t = spawnTile(t, nextIdRef);
  return t;
}

function moveTiles(currentTiles, dir, nextIdRef) {
  const active = currentTiles.filter((t) => !t.dying);
  const grid = makeGridFromTiles(active);
  const nextTiles = [];
  let moved = false;
  let gained = 0;
  let maxMerged = 0;

  const coordFor = (lineIdx, pos) => {
    if (dir === 'left') return [lineIdx, pos];
    if (dir === 'right') return [lineIdx, SIZE - 1 - pos];
    if (dir === 'up') return [pos, lineIdx];
    return [SIZE - 1 - pos, lineIdx];
  };

  for (let i = 0; i < SIZE; i++) {
    const line = [];
    for (let j = 0; j < SIZE; j++) {
      const [r, c] = coordFor(i, j);
      if (grid[r][c]) line.push(grid[r][c]);
    }

    let targetPos = 0;
    for (let k = 0; k < line.length; k++) {
      const a = line[k];
      const b = line[k + 1];
      const [row, col] = coordFor(i, targetPos);

      if (b && a.value === b.value) {
        if (a.row !== row || a.col !== col || b.row !== row || b.col !== col) moved = true;
        else moved = true;
        const val = a.value * 2;
        gained += val;
        if (val > maxMerged) maxMerged = val;

        nextTiles.push({ ...a, row, col, dying: true, isNew: false, isMerged: false });
        nextTiles.push({ ...b, row, col, dying: true, isNew: false, isMerged: false });
        nextTiles.push({ id: nextIdRef.current++, value: val, row, col, isMerged: true, isNew: false });
        k++;
        targetPos++;
      } else {
        if (a.row !== row || a.col !== col) moved = true;
        nextTiles.push({ ...a, row, col, isNew: false, isMerged: false });
        targetPos++;
      }
    }
  }

  return { nextTiles, moved, gained, maxMerged };
}

function canMoveTiles(tiles) {
  const active = tiles.filter((t) => !t.dying);
  if (active.length < SIZE * SIZE) return true;
  const g = makeGridFromTiles(active);
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const v = g[r][c]?.value;
      if (!v) return true;
      if (r + 1 < SIZE && g[r + 1][c]?.value === v) return true;
      if (c + 1 < SIZE && g[r][c + 1]?.value === v) return true;
    }
  }
  return false;
}

function has2048Tile(tiles) {
  return tiles.some((t) => !t.dying && t.value >= 2048);
}

export default function Game2048({ signedIn, serverBest, onSignIn, onSaveScore }) {
  const nextIdRef = useRef(1);
  const [tiles, setTiles] = useState(() => createInitialTiles(nextIdRef));
  const [score, setScore] = useState(0);
  const [localBest, setLocalBest] = useState(0);
  const [wonAck, setWonAck] = useState(false);
  const [over, setOver] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const [muted, setMuted] = useState(() => {
    try { return localStorage.getItem(MUTE_KEY) === '1'; } catch { return false; }
  });

  const touchStart = useRef(null);
  const pointerStart = useRef(null);
  const boardRef = useRef(null);
  const lastSavedRef = useRef(0);
  const audioRef = useRef(null);
  const cleanupTimerRef = useRef(null);
  const mutedRef = useRef(muted);
  const wonSoundPlayedRef = useRef(false);

  if (!audioRef.current) audioRef.current = createAudioEngine();

  useEffect(() => {
    mutedRef.current = muted;
    try { localStorage.setItem(MUTE_KEY, muted ? '1' : '0'); } catch { /* ignore */ }
  }, [muted]);

  useEffect(() => () => {
    if (cleanupTimerRef.current) clearTimeout(cleanupTimerRef.current);
  }, []);

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

  useEffect(() => {
    if (!signedIn || score <= lastSavedRef.current) return;
    const t = setTimeout(() => persistScore(score), over ? 100 : 1800);
    return () => clearTimeout(t);
  }, [score, over, signedIn, persistScore]);

  const step = useCallback((dir) => {
    if (over) return;
    audioRef.current.unlock();

    setTiles((prev) => {
      const { nextTiles, moved, gained, maxMerged } = moveTiles(prev, dir, nextIdRef);
      if (!moved) return prev;

      const withSpawn = spawnTile(nextTiles, nextIdRef);
      const isNowOver = !canMoveTiles(withSpawn);
      const reached2048 = !wonSoundPlayedRef.current && has2048Tile(withSpawn);

      if (!mutedRef.current) {
        if (reached2048) {
          wonSoundPlayedRef.current = true;
          audioRef.current.win();
        } else if (maxMerged > 0) {
          audioRef.current.merge(maxMerged);
        } else {
          audioRef.current.slide();
        }
        if (isNowOver) setTimeout(() => !mutedRef.current && audioRef.current.over(), 120);
      }

      if (gained > 0) {
        setScore((s) => {
          const ns = s + gained;
          setLocalBest((b) => Math.max(b, ns));
          return ns;
        });
      }
      if (isNowOver) setOver(true);

      if (cleanupTimerRef.current) clearTimeout(cleanupTimerRef.current);
      cleanupTimerRef.current = setTimeout(() => {
        setTiles((cur) => cur.filter((t) => !t.dying));
      }, 145);

      return withSpawn;
    });
  }, [over]);

  const restart = () => {
    if (cleanupTimerRef.current) clearTimeout(cleanupTimerRef.current);
    if (signedIn && score > lastSavedRef.current) persistScore(score);
    wonSoundPlayedRef.current = false;
    setTiles(createInitialTiles(nextIdRef));
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

  // Reliable non-passive touch swipe on the board
  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;

    const triggerSwipe = (dx, dy) => {
      if (Math.abs(dx) > Math.abs(dy)) step(dx > 0 ? 'right' : 'left');
      else step(dy > 0 ? 'down' : 'up');
    };

    const onTouchStart = (e) => {
      if (e.touches.length !== 1) return;
      audioRef.current.unlock();
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
      if (Math.max(Math.abs(dx), Math.abs(dy)) >= 20) {
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
        if (Math.max(Math.abs(dx), Math.abs(dy)) >= 16) {
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

  // Mouse / stylus drag fallback
  const onPointerDown = (e) => {
    if (e.pointerType === 'touch') return;
    audioRef.current.unlock();
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

  const won = !wonAck && has2048Tile(tiles);
  const mascot = over ? SPRITES.play2048_2 : won ? SPRITES.play2048_3 : score > 200 ? SPRITES.play2048_3 : SPRITES.play2048_1;

  return (
    <div className="box shadow-b8 p-4 sm:p-6 max-w-md w-full mx-auto flex flex-col gap-3.5 select-none">
      {/* Score & controls */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <img src={mascot.src} alt="" draggable={false} className="w-10 h-10 sm:w-11 sm:h-11 object-contain shrink-0" />
          <div>
            <div className="text-2xl font-extrabold uppercase leading-none">2048</div>
            <div className="font-mono text-[11px] text-mute">Rattie Edition</div>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <div className="border-[3px] border-ink rounded-xl bg-sun px-3 py-1.5 text-center min-w-[70px]">
            <div className="font-mono text-[10px] font-bold uppercase">Score</div>
            <div className="font-mono text-base font-extrabold leading-tight">{score}</div>
          </div>
          <div className="border-[3px] border-ink rounded-xl bg-neon px-3 py-1.5 text-center min-w-[70px]">
            <div className="font-mono text-[10px] font-bold uppercase">Best</div>
            <div className="font-mono text-base font-extrabold leading-tight">{best}</div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-xs text-mute">
          {signedIn ? (saving ? 'Saving…' : savedMsg || 'Best score saves automatically') : 'Sign in to save your score'}
        </span>
        <div className="flex items-center gap-2">
          {!signedIn && (
            <button type="button" onClick={onSignIn} className="tag bg-neon text-ink">Sign in</button>
          )}
          <button
            type="button"
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? 'Unmute sound' : 'Mute sound'}
            title={muted ? 'Sound off — click to unmute' : 'Sound on — click to mute'}
            className={`btn text-xs px-2.5 py-1.5 ${muted ? 'bg-paper text-mute' : 'bg-sun text-ink'}`}
          >
            {muted ? '🔇' : '🔊'}
          </button>
          <button type="button" onClick={restart} className="btn bg-white text-xs px-3 py-1.5">↻ New game</button>
        </div>
      </div>

      {/* 4x4 Sliding Board */}
      <div
        ref={boardRef}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        style={{ touchAction: 'none' }}
        className="relative bg-ink border-[3px] border-ink rounded-2xl p-2.5 sm:p-3 aspect-square [--g:8px] sm:[--g:10px] touch-none overscroll-none select-none"
      >
        {/* Background static cells */}
        <div className="grid grid-cols-4 gap-2 sm:gap-2.5 w-full h-full">
          {Array.from({ length: SIZE * SIZE }).map((_, idx) => (
            <div key={idx} className="rounded-xl bg-[#D9D4D0] border-2 border-ink" />
          ))}
        </div>

        {/* Animated sliding cubes layer */}
        <div className="absolute inset-2.5 sm:inset-3 pointer-events-none">
          {tiles.map((tile) => (
            <div
              key={tile.id}
              style={{
                width: 'calc((100% - 3 * var(--g)) / 4)',
                height: 'calc((100% - 3 * var(--g)) / 4)',
                transform: `translate3d(calc(${tile.col} * (100% + var(--g))), calc(${tile.row} * (100% + var(--g))), 0)`,
                transition: 'transform 130ms cubic-bezier(0.22, 1, 0.36, 1)',
                zIndex: tile.dying ? 10 : tile.isMerged ? 30 : 20,
              }}
              className="absolute left-0 top-0"
            >
              <div
                className={`w-full h-full rounded-xl border-2 border-ink flex items-center justify-center font-extrabold shadow-b2 ${tileCls(tile.value)} ${tileFont(tile.value)} ${tile.isNew ? 'tile-pop' : tile.isMerged ? 'tile-merge' : ''}`}
              >
                {tile.value}
              </div>
            </div>
          ))}
        </div>

        {(over || won) && (
          <div className="absolute inset-0 z-40 bg-ink/80 rounded-xl flex items-center justify-center p-4">
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

      <p className="font-mono text-[11px] text-mute text-center">Swipe on the board or use arrow keys / WASD</p>
    </div>
  );
}
