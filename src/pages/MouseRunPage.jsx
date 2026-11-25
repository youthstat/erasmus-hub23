import { useEffect, useState } from 'react';
import Marquee from '../components/layout/Marquee.jsx';
import Header from '../components/layout/Header.jsx';
import { Banner } from '../components/games/RulesBits.jsx';
import Game2048 from '../components/games/Game2048.jsx';
import { useApp } from '../context/AppContext.jsx';
import { PRIZES_2048, save2048Score, subscribe2048Config, subscribe2048Scores } from '../firebase/game2048.js';
import { countryOf } from '../hooks/useGame.js';

const MEDALS = ['🥇', '🥈', '🥉'];
const CARD_CLS = ['bg-sun', 'bg-white', 'bg-[#FFB3C6]'];

export default function MouseRunPage() {
  const { profile, openAccount, setError } = useApp();
  const [scores, setScores] = useState([]);
  const [config, setConfig] = useState({ awarded: false, winners: [] });

  useEffect(() => {
    const onErr = (e) => setError(e.message);
    const offs = [subscribe2048Scores(setScores, onErr), subscribe2048Config(setConfig, onErr)];
    return () => offs.forEach((o) => o());
  }, [setError]);

  const top3 = scores.slice(0, 3);
  const myEntry = profile ? scores.find((s) => s.userId === profile.id) : null;

  return (
    <>
      <Marquee className="bg-neon text-ink" items={['RATTIE 2048', 'MERGE TILES · BEAT THE RECORD', 'TOP 3 WIN +500 / +200 / +100 PTS']} />
      <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col gap-4 sm:gap-6">
        <Header back />

        {/* Top 3 Leaderboard: single row at the top (place + score above, name below) */}
        <section className="max-w-md w-full mx-auto">
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2].map((idx) => {
              const entry = top3[idx];
              const isMe = entry && profile && entry.userId === profile.id;
              return (
                <div
                  key={idx}
                  className={`border-[3px] border-ink rounded-xl px-2 sm:px-2.5 py-2 shadow-b4 flex flex-col justify-between min-w-0 ${CARD_CLS[idx]} ${isMe ? 'ring-2 ring-cobalt' : ''}`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-mono text-xs sm:text-sm font-extrabold whitespace-nowrap">
                      {MEDALS[idx]} #{idx + 1}
                    </span>
                    <span className="font-mono text-xs sm:text-sm font-extrabold truncate">
                      {entry ? entry.bestScore.toLocaleString('en-US') : '—'}
                    </span>
                  </div>
                  <div className="mt-1 pt-1 border-t-2 border-ink/15 font-extrabold text-[11px] sm:text-xs uppercase truncate">
                    {entry ? entry.userName : 'Open'}
                  </div>
                </div>
              );
            })}
          </div>
          {config.awarded && (
            <div className="mt-2 text-center">
              <span className="tag bg-neon text-ink text-[10px]">PRIZES AWARDED ✓</span>
            </div>
          )}
        </section>

        {!profile && (
          <div className="box px-4 py-3 max-w-md w-full mx-auto flex items-center justify-between gap-3">
            <p className="font-medium text-xs sm:text-sm">Sign in to save your best score for Top 3!</p>
            <button className="btn bg-neon text-xs shrink-0 px-3 py-1.5" onClick={() => openAccount(null)}>Sign in</button>
          </div>
        )}

        <Game2048
          signedIn={!!profile}
          serverBest={myEntry?.bestScore || 0}
          onSignIn={() => openAccount(null)}
          onSaveScore={(score) => save2048Score(profile, score, countryOf(profile))}
        />

        <Banner title="Rattie 2048" cls="bg-sun max-w-md w-full mx-auto">
          Swipe to merge matching tiles! Top 3 win +{PRIZES_2048.join(' / +')} PTS.
        </Banner>
      </div>
    </>
  );
}
