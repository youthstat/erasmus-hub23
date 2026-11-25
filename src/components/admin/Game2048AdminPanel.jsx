import { useEffect, useState } from 'react';
import { awardTop3Prizes, PRIZES_2048, reset2048Game, subscribe2048Config, subscribe2048Scores } from '../../firebase/game2048.js';
import { useApp } from '../../context/AppContext.jsx';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function Game2048AdminPanel() {
  const { setError } = useApp();
  const [scores, setScores] = useState([]);
  const [config, setConfig] = useState({ awarded: false, winners: [] });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const onErr = (e) => setError(e.message);
    const offs = [subscribe2048Scores(setScores, onErr), subscribe2048Config(setConfig, onErr)];
    return () => offs.forEach((o) => o());
  }, [setError]);

  const top3 = scores.slice(0, 3);

  const award = async () => {
    if (!top3.length) return;
    if (!confirm('Award +500, +200, and +100 PTS to the current Top 3 players in 2048?')) return;
    setBusy(true); setMsg('');
    try {
      const winners = await awardTop3Prizes();
      setMsg(`Awarded prizes to ${winners.map((w) => `#${w.place} ${w.userName} (+${w.prize})`).join(', ')}`);
    } catch (e) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    if (!confirm('Reset all 2048 scores and prize status? (Points already given stay.)')) return;
    setBusy(true); setMsg('');
    try {
      await reset2048Game();
      setMsg('2048 leaderboard reset.');
    } catch (e) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="box overflow-hidden">
      <div className="bg-[#C9B8FF] border-b-[3px] border-ink px-4 py-3 font-mono font-bold uppercase flex flex-wrap items-center justify-between gap-2">
        <span>Rattie 2048 · {scores.length} players</span>
        <div className="flex flex-wrap gap-2">
          <button className="tag bg-neon text-ink disabled:opacity-40" disabled={busy || config.awarded || !top3.length} onClick={award}>
            {config.awarded ? '✓ Prizes awarded' : '🏆 Award Top 3 (+500 / +200 / +100)'}
          </button>
          <button className="tag bg-hot text-white disabled:opacity-40" disabled={busy || (!scores.length && !config.awarded)} onClick={reset}>
            🗑 Reset 2048
          </button>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-3">
        {msg && <div className="border-2 border-ink rounded-lg bg-sun px-3 py-2 font-mono text-xs font-bold">{msg}</div>}
        <div className="divide-y-2 divide-ink/15">
          {scores.map((s, idx) => (
            <div key={s.id} className="py-2 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono font-bold w-7">{idx < 3 ? MEDALS[idx] : `#${idx + 1}`}</span>
                <b className="uppercase truncate">{s.userName}</b>
                {idx < 3 && <span className="tag bg-sun text-[10px]">+{PRIZES_2048[idx]} PTS</span>}
              </div>
              <span className="font-mono font-bold">{(s.bestScore || 0).toLocaleString('en-US')}</span>
            </div>
          ))}
          {scores.length === 0 && <p className="font-mono text-sm text-mute">No 2048 scores yet.</p>}
        </div>
      </div>
    </section>
  );
}
