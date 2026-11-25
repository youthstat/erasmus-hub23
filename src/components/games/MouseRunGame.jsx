import { useEffect, useRef, useState } from 'react';
import { SPRITES } from '../mascot/sprites.js';
import { MOUSERUN_POINTS_PER_STAR, MOUSERUN_GAMEOVER_RATE } from '../../config/settings.js';

/*
  Rattie Run — a tiny endless-runner / platformer. Rattie runs by herself, you steer and jump.
  Collect stars, dodge obstacles, reach the flag. Every level is longer and faster and brings something new.
  After a level the stars can be exchanged for points (onExchange does the saving).
*/
const W = 800, H = 400, GY = 330, INK = '#111111';
const SPR_SCALE = 0.42;
const THEMES = [   // [background, accent, ground]
  ['#F0EDEC', '#FFE600', '#00FF66'], ['#E8F0FF', '#2E5BFF', '#FFE600'], ['#FFF0F3', '#FF4365', '#FFFFFF'],
  ['#EDFFF4', '#00FF66', '#FFE600'], ['#FFF9D6', '#FFE600', '#FF4365'], ['#1c1c24', '#2E5BFF', '#00FF66'],
];
const NEWS = {
  1: 'Watch out: crates!', 2: 'New: spikes!', 3: 'New: angry birds!',
  4: 'New: the cat patrols!', 5: 'New: night bats!',
};
const rng = (seed) => { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; };

function buildLevel(lv) {
  const r = rng(lv * 977 + 13);
  const len = 2400 + lv * 500;
  const types = ['box', 'spike', 'bird', 'cat', 'bat'].slice(0, Math.min(5, lv));
  const plats = [{ x: -300, y: GY, w: 1000, ground: true }];
  const stars = [], obs = [];
  const arc = (cx, base, n, h) => {
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0.5 : i / (n - 1);
      stars.push({ x: cx - 50 + t * 100, y: base - Math.sin(t * Math.PI) * h, got: false });
    }
  };
  let x = 700;
  while (x < len) {
    const w = 240 + r() * 160;
    plats.push({ x, y: GY, w, ground: true });
    const mid = x + w / 2, f = r();
    if (f < 0.3) {
      for (let i = 0; i < 5; i++) stars.push({ x: x + 60 + i * 40, y: GY - 30, got: false });
    } else if (f < 0.7) {
      const t = types[Math.floor(r() * types.length)];
      if (t === 'box') obs.push({ t, x: mid, y: GY - 30, w: 30, h: 30 });
      if (t === 'spike') obs.push({ t, x: mid, y: GY - 24, w: 32, h: 24 });
      if (t === 'bird') obs.push({ t, x: mid, y: GY - 62, w: 34, h: 24 });
      if (t === 'cat') obs.push({ t, x: mid, y: GY - 34, w: 40, h: 34, ox: mid, dir: 1 });
      if (t === 'bat') obs.push({ t, x: mid, y: GY - 80, w: 34, h: 22, by: GY - 80 });
      arc(mid, GY - 50, 5, 55);
    } else {
      plats.push({ x: mid - 60, y: GY - 95, w: 120, ground: false });
      for (let i = 0; i < 3; i++) stars.push({ x: mid - 40 + i * 40, y: GY - 125, got: false });
    }
    x += w;
    if (r() < 0.4) {
      const gap = Math.min(150, 95 + lv * 5);
      arc(x + gap / 2, GY - 60, 4, 50);
      x += gap;
    }
  }
  plats.push({ x, y: GY, w: 900, ground: true });
  return { plats, stars, obs, len, flagX: len + 60 };
}

const starPath = (ctx, cx, cy, R, rot = 0) => {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = rot + (i * Math.PI) / 5 - Math.PI / 2, rr = i % 2 ? R * 0.45 : R;
    ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
  }
  ctx.closePath();
};
const block = (ctx, x, y, w, h, fill, sh = 4) => {
  ctx.fillStyle = INK; ctx.fillRect(x + sh, y + sh, w, h);
  ctx.fillStyle = fill; ctx.fillRect(x, y, w, h);
  ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.strokeRect(x, y, w, h);
};

function drawObs(ctx, o, t) {
  ctx.lineWidth = 3; ctx.strokeStyle = INK;
  if (o.t === 'box') {
    block(ctx, o.x - 15, o.y, 30, 30, '#FF4365', 3);
    ctx.beginPath(); ctx.moveTo(o.x - 15, o.y); ctx.lineTo(o.x + 15, o.y + 30); ctx.moveTo(o.x + 15, o.y); ctx.lineTo(o.x - 15, o.y + 30); ctx.stroke();
  } else if (o.t === 'spike') {
    ctx.fillStyle = INK;
    for (let i = 0; i < 2; i++) {
      const bx = o.x - 16 + i * 16;
      ctx.beginPath(); ctx.moveTo(bx, o.y + 24); ctx.lineTo(bx + 8, o.y); ctx.lineTo(bx + 16, o.y + 24); ctx.closePath(); ctx.fill();
    }
  } else if (o.t === 'bird') {
    const wy = Math.sin(t * 0.3) * 9;
    block(ctx, o.x - 15, o.y + 4, 30, 18, '#2E5BFF', 3);
    ctx.fillStyle = '#FFE600'; ctx.beginPath(); ctx.moveTo(o.x - 15, o.y + 9); ctx.lineTo(o.x - 26, o.y + 13); ctx.lineTo(o.x - 15, o.y + 17); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = INK; ctx.fillRect(o.x - 9, o.y + 8, 4, 4);
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(o.x, o.y + 6); ctx.lineTo(o.x + 10, o.y + wy); ctx.lineTo(o.x + 14, o.y + 8); ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (o.t === 'cat') {
    block(ctx, o.x - 20, o.y + 10, 40, 24, '#FFE600', 3);
    block(ctx, o.x + (o.dir > 0 ? 4 : -24), o.y, 20, 18, '#FFE600', 3);
    ctx.fillStyle = INK; ctx.fillRect(o.x + (o.dir > 0 ? 14 : -18), o.y + 6, 4, 4);
    ctx.beginPath(); ctx.moveTo(o.x + (o.dir > 0 ? 4 : -24), o.y); ctx.lineTo(o.x + (o.dir > 0 ? 8 : -20), o.y - 8); ctx.lineTo(o.x + (o.dir > 0 ? 12 : -12), o.y); ctx.fill();
  } else if (o.t === 'bat') {
    const f = Math.sin(t * 0.3) * 8;
    ctx.fillStyle = INK;
    ctx.beginPath(); ctx.moveTo(o.x, o.y + 11); ctx.lineTo(o.x - 22, o.y + f); ctx.lineTo(o.x - 8, o.y + 16); ctx.fill();
    ctx.beginPath(); ctx.moveTo(o.x, o.y + 11); ctx.lineTo(o.x + 22, o.y + f); ctx.lineTo(o.x + 8, o.y + 16); ctx.fill();
    ctx.fillRect(o.x - 8, o.y + 3, 16, 18);
    ctx.fillStyle = '#00FF66'; ctx.fillRect(o.x - 5, o.y + 8, 3, 3); ctx.fillRect(o.x + 2, o.y + 8, 3, 3);
  }
}

export default function MouseRunGame({ signedIn, onSignIn, onExchange }) {
  const canvasRef = useRef(null);
  const keys = useRef({ left: false, right: false, up: false });
  const g = useRef({});
  const imgs = useRef({});
  const [screen, setScreen] = useState('menu');       // menu | play | win | over
  const [level, setLevel] = useState(1);
  const [sum, setSum] = useState({ stars: 0, lives: 3, points: 0 });
  const [state, setState] = useState({ busy: false, done: false, msg: '', ok: false });

  const startLevel = (lv) => {
    g.current = { ...buildLevel(lv), lv, mode: 'play', lives: 3, stars: 0, t: 0, inv: 0, banner: 160,
      p: { x: 100, y: GY, vy: 0, ground: true }, safe: { x: 100, y: GY } };
    setLevel(lv); setState({ busy: false, done: false, msg: '', ok: false }); setScreen('play');
  };

  const exchange = async () => {
    if (!signedIn) return onSignIn();
    setState((s) => ({ ...s, busy: true, msg: '' }));
    try {
      const got = await onExchange(sum.stars, sum.points);
      setState({ busy: false, done: true, ok: true, msg: `+${got} ${got === 1 ? 'point' : 'points'} added to your rating!` });
    } catch (e) {
      setState({ busy: false, done: false, ok: false, msg: e.message });
    }
  };

  // sprites
  useEffect(() => {
    ['idle', 'run1', 'run2', 'jump'].forEach((k) => { const i = new Image(); i.src = SPRITES[k].src; imgs.current[k] = i; });
  }, []);

  // keyboard
  useEffect(() => {
    const map = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ' ': 'up', a: 'left', d: 'right', w: 'up' };
    const typing = (e) => /INPUT|TEXTAREA|SELECT/.test(e.target.tagName);
    const down = (e) => { const k = map[e.key]; if (k && !typing(e)) { keys.current[k] = true; if (g.current.mode === 'play') e.preventDefault(); } };
    const up = (e) => { const k = map[e.key]; if (k) keys.current[k] = false; };
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  // game loop
  useEffect(() => {
    const ctx = canvasRef.current.getContext('2d');
    let raf, last = performance.now();

    const lose = (G) => {
      G.lives -= 1; G.inv = 110;
      if (G.lives <= 0) {
        G.mode = 'end';
        setSum({ stars: G.stars, lives: 0, points: Math.floor(G.stars * MOUSERUN_POINTS_PER_STAR * MOUSERUN_GAMEOVER_RATE) });
        setState({ busy: false, done: false, msg: '', ok: false }); setScreen('over');
      }
    };

    const update = (G, dt) => {
      const k = keys.current, p = G.p;
      G.t += dt;
      const base = Math.min(6, 2.6 + G.lv * 0.35);
      p.x += Math.max(1, base + (k.right ? 1.5 : 0) - (k.left ? 1.5 : 0)) * dt;
      if (k.up && p.ground) { p.vy = -12.5; p.ground = false; }
      p.vy += 0.6 * dt;
      const prev = p.y; p.y += p.vy * dt; p.ground = false;
      for (const pl of G.plats) {
        if (p.x + 10 > pl.x && p.x - 10 < pl.x + pl.w && p.vy >= 0 && prev <= pl.y + 1 && p.y >= pl.y) {
          p.y = pl.y; p.vy = 0; p.ground = true;
          if (pl.ground) G.safe = { x: Math.max(pl.x + 25, p.x - 80), y: pl.y };
        }
      }
      if (p.y > H + 60) { lose(G); if (G.mode === 'play') { p.x = G.safe.x; p.y = G.safe.y; p.vy = 0; } }
      for (const s of G.stars) if (!s.got && Math.hypot(s.x - p.x, s.y - (p.y - 15)) < 26) { s.got = true; G.stars++; }
      if (G.inv > 0) G.inv -= dt;
      for (const o of G.obs) {
        if (o.t === 'cat') { o.x += o.dir * 0.9 * dt; if (Math.abs(o.x - o.ox) > 60) o.dir *= -1; }
        if (o.t === 'bird') o.x -= 1.2 * dt;
        if (o.t === 'bat') { o.y = o.by + Math.sin(G.t * 0.07 + o.x) * 40; o.x -= 0.6 * dt; }
        if (G.inv <= 0 && p.x + 11 > o.x - o.w / 2 + 4 && p.x - 11 < o.x + o.w / 2 - 4 && p.y > o.y + 4 && p.y - 32 < o.y + o.h - 2) {
          lose(G); p.vy = -8; if (G.mode !== 'play') return;
        }
      }
      if (p.x >= G.flagX) {
        G.mode = 'end';
        setSum({ stars: G.stars, lives: G.lives, points: Math.floor(G.stars * MOUSERUN_POINTS_PER_STAR) });
        setState({ busy: false, done: false, msg: '', ok: false }); setScreen('win');
      }
    };

    const draw = (G) => {
      const th = THEMES[(G.lv - 1) % THEMES.length], dark = (G.lv - 1) % THEMES.length === 5;
      const cam = G.p.x - 160;
      ctx.fillStyle = th[0]; ctx.fillRect(0, 0, W, H);
      // grid + big flat shapes (parallax)
      ctx.strokeStyle = dark ? 'rgba(255,255,255,.07)' : 'rgba(17,17,17,.07)'; ctx.lineWidth = 1;
      const go = -(cam * 0.5) % 40;
      for (let x = go; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      for (let i = 0; i < 6; i++) {
        const sx = ((i * 330 - cam * 0.25) % 2000 + 2000) % 2000 - 200, sy = 40 + (i % 3) * 55;
        ctx.fillStyle = th[1]; ctx.globalAlpha = 0.35;
        if (i % 2) ctx.fillRect(sx, sy, 60, 40); else { ctx.beginPath(); ctx.arc(sx + 30, sy + 20, 28, 0, 7); ctx.fill(); }
        ctx.globalAlpha = 1; ctx.strokeStyle = dark ? '#fff' : INK; ctx.lineWidth = 3;
        if (i % 2) ctx.strokeRect(sx, sy, 60, 40); else { ctx.beginPath(); ctx.arc(sx + 30, sy + 20, 28, 0, 7); ctx.stroke(); }
      }
      ctx.save(); ctx.translate(-cam, 0);
      for (const pl of G.plats) {
        if (pl.x + pl.w < cam - 20 || pl.x > cam + W + 20) continue;
        if (pl.ground) {
          ctx.fillStyle = INK; ctx.fillRect(pl.x + 6, pl.y + 6, pl.w, H);
          ctx.fillStyle = th[2]; ctx.fillRect(pl.x, pl.y, pl.w, H - pl.y);
          ctx.fillStyle = INK; for (let x = pl.x + 20; x < pl.x + pl.w - 10; x += 40) ctx.fillRect(x, pl.y + 22, 14, 4);
          ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.strokeRect(pl.x, pl.y, pl.w, H - pl.y + 4);
        } else block(ctx, pl.x, pl.y, pl.w, 16, th[1], 5);
      }
      for (const s of G.stars) {
        if (s.got) continue;
        starPath(ctx, s.x, s.y + Math.sin(G.t * 0.08 + s.x) * 3, 11, G.t * 0.02);
        ctx.fillStyle = '#FFE600'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.stroke();
      }
      for (const o of G.obs) drawObs(ctx, o, G.t);
      // flag
      ctx.fillStyle = INK; ctx.fillRect(G.flagX - 2, GY - 100, 5, 100);
      block(ctx, G.flagX + 3, GY - 100, 52, 30, '#FF4365', 3);
      ctx.fillStyle = '#fff'; ctx.font = "bold 14px 'Space Mono', monospace"; ctx.textAlign = 'left'; ctx.fillText('END', G.flagX + 11, GY - 80);
      // Rattie (site sprites)
      const key = !G.p.ground ? 'jump' : Math.floor(G.t / 7) % 2 ? 'run2' : 'run1', sp = SPRITES[key], im = imgs.current[key];
      if (im?.complete) {
        const w = sp.w * SPR_SCALE, h = sp.h * SPR_SCALE;
        if (G.inv > 0 && Math.floor(G.t / 5) % 2 === 0) ctx.globalAlpha = 0.35;
        ctx.fillStyle = 'rgba(17,17,17,.25)'; ctx.beginPath(); ctx.ellipse(G.p.x, G.plats.some((pl) => G.p.x > pl.x && G.p.x < pl.x + pl.w && pl.y >= G.p.y) ? GY + 3 : G.p.y + 3, 18, 4, 0, 0, 7); ctx.fill();
        ctx.drawImage(im, G.p.x - w / 2, G.p.y - h, w, h);
        ctx.globalAlpha = 1;
      }
      ctx.restore();
      // HUD
      ctx.font = "bold 16px 'Space Mono', monospace"; ctx.textAlign = 'left';
      block(ctx, 12, 12, 92, 30, '#fff', 3); starPath(ctx, 30, 27, 9); ctx.fillStyle = '#FFE600'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = INK; ctx.stroke();
      ctx.fillStyle = INK; ctx.fillText('× ' + G.stars, 46, 33);
      block(ctx, 116, 12, 84, 30, '#fff', 3); ctx.fillStyle = '#FF4365'; ctx.fillText('♥'.repeat(Math.max(0, G.lives)).split('').join(' '), 126, 33);
      block(ctx, W - 116, 12, 104, 30, '#FFE600', 3); ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.fillText('LEVEL ' + G.lv, W - 64, 33);
      const prog = Math.min(1, G.p.x / G.flagX);
      ctx.fillStyle = '#fff'; ctx.fillRect(W / 2 - 100, 20, 200, 14); ctx.fillStyle = '#00FF66'; ctx.fillRect(W / 2 - 100, 20, 200 * prog, 14);
      ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.strokeRect(W / 2 - 100, 20, 200, 14);
      if (G.banner > 0) {
        ctx.globalAlpha = Math.min(1, G.banner / 40);
        block(ctx, W / 2 - 190, 110, 380, 78, '#FFE600', 6);
        ctx.fillStyle = INK; ctx.font = "bold 28px 'Space Grotesk', sans-serif"; ctx.fillText('LEVEL ' + G.lv, W / 2, 144);
        ctx.font = "bold 15px 'Space Mono', monospace"; ctx.fillText((NEWS[G.lv] || 'Faster & harder!').toUpperCase(), W / 2, 172);
        ctx.globalAlpha = 1;
      }
    };

    const frame = (now) => {
      const dt = Math.min(2, (now - last) / 16.67); last = now;
      const G = g.current;
      if (G.p) { if (G.mode === 'play') { update(G, dt); if (G.banner > 0) G.banner -= dt; } draw(G); }
      else { ctx.fillStyle = '#F0EDEC'; ctx.fillRect(0, 0, W, H); }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  const hold = (k) => ({
    onPointerDown: (e) => { e.preventDefault(); keys.current[k] = true; },
    onPointerUp: () => (keys.current[k] = false),
    onPointerLeave: () => (keys.current[k] = false),
    onPointerCancel: () => (keys.current[k] = false),
    onContextMenu: (e) => e.preventDefault(),
  });
  const padBtn = 'w-20 h-20 border-[3px] border-ink rounded-xl shadow-b4 font-bold text-3xl select-none touch-none active:translate-x-0.5 active:translate-y-0.5 active:shadow-b2';

  return (
    <div className="flex flex-col gap-4 select-none">
      <div className="relative border-[3px] border-ink rounded-xl shadow-b8 overflow-hidden bg-paper">
        <canvas ref={canvasRef} width={W} height={H} className="block w-full h-auto" />
        {screen !== 'play' && (
          <div className="absolute inset-0 bg-ink/70 flex items-center justify-center p-3 overflow-y-auto">
            <div className="w-full max-w-md bg-white border-4 border-ink rounded-2xl shadow-[8px_8px_0_#111] overflow-hidden">
              <div className={`${screen === 'win' ? 'bg-neon' : screen === 'over' ? 'bg-hot text-white' : 'bg-sun'} px-4 py-2 border-b-[3px] border-ink font-mono font-bold uppercase`}>
                ■ {screen === 'menu' ? 'Rattie Run' : screen === 'win' ? `Level ${level} clear!` : 'Game over'}
              </div>
              <div className="p-5 flex flex-col gap-3">
                {screen === 'menu' && (<>
                  <p className="font-bold">Help Rattie Patty run to the flag. Jump over pits, grab ⭐ and dodge everything that wants to bite.</p>
                  <p className="font-mono text-xs">← → speed · ↑ / SPACE jump · or use the on-screen buttons</p>
                  <button className="btn bg-neon" onClick={() => startLevel(1)}>▶ Play</button>
                </>)}
                {screen !== 'menu' && (<>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="border-[3px] border-ink rounded-xl bg-sun p-2 text-center"><div className="font-mono text-[11px] font-bold uppercase">Stars</div><div className="text-3xl font-extrabold">{sum.stars}</div></div>
                    <div className="border-[3px] border-ink rounded-xl bg-neon p-2 text-center"><div className="font-mono text-[11px] font-bold uppercase">Worth</div><div className="text-3xl font-extrabold">{sum.points} PT</div></div>
                  </div>
                  <p className="font-mono text-xs">{screen === 'win' ? `${sum.lives} ${sum.lives === 1 ? 'life' : 'lives'} left. Full rate: 1 star = ${MOUSERUN_POINTS_PER_STAR} pt.` : `No lives left — stars are worth ${MOUSERUN_GAMEOVER_RATE * 100}% this time.`}</p>
                  {state.msg && <p className={`border-[3px] border-ink rounded-xl px-3 py-2 font-bold shadow-b4 ${state.ok ? 'bg-neon' : 'bg-hot text-white'}`}>{state.ok ? '✓ ' : ''}{state.msg}</p>}
                  {!signedIn && <p className="font-mono text-xs font-bold text-hot">Sign in to exchange stars for points.</p>}
                  <div className="flex flex-wrap gap-3">
                    <button className="btn bg-neon" disabled={state.busy || state.done || sum.points === 0} onClick={exchange} style={state.done || sum.points === 0 ? { opacity: 0.5 } : {}}>⭐ Exchange for points</button>
                    <button className="btn bg-sun" onClick={() => startLevel(screen === 'win' ? level + 1 : level)}>{screen === 'win' ? 'Next level →' : 'Try again'}</button>
                  </div>
                </>)}
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="flex justify-between items-center">
        <div className="flex gap-3">
          <button aria-label="Slow down" className={`${padBtn} bg-white`} {...hold('left')}>◀</button>
          <button aria-label="Speed up" className={`${padBtn} bg-white`} {...hold('right')}>▶</button>
        </div>
        <button aria-label="Jump" className={`${padBtn} bg-sun`} {...hold('up')}>▲</button>
      </div>
    </div>
  );
}
