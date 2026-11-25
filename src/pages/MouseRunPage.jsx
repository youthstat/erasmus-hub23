import { useEffect, useState } from 'react';
import Marquee from '../components/layout/Marquee.jsx';
import Header from '../components/layout/Header.jsx';
import { Banner } from '../components/games/RulesBits.jsx';
import MouseRunGame from '../components/games/MouseRunGame.jsx';
import { useApp } from '../context/AppContext.jsx';
import { exchangeStars, subscribeMouseRunToday } from '../firebase/mouserun.js';
import { MOUSERUN_DAILY_CAP, MOUSERUN_POINTS_PER_STAR } from '../config/settings.js';

export default function MouseRunPage() {
  const { profile, openAccount, setError } = useApp();
  const [today, setToday] = useState(0);

  useEffect(() => (profile ? subscribeMouseRunToday(profile.id, setToday, (e) => setError(e.message)) : (setToday(0), undefined)), [profile?.id, setError]);   // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <Marquee className="bg-neon text-ink" items={['RATTIE RUN', 'RUN · JUMP · COLLECT', 'STARS → POINTS', 'NEW OBSTACLES EVERY LEVEL']} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-8">
        <Header back />
        <Banner title="Rattie Run" cls="bg-sun">
          Rattie Patty is running late! Jump over pits, grab the stars and reach the flag. Every level is faster and has a new obstacle.
        </Banner>

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="border-[3px] border-ink rounded-xl shadow-b4 bg-neon p-4"><div className="font-mono text-xs font-bold uppercase">Exchange rate</div><div className="text-3xl font-extrabold">1 ⭐ = {MOUSERUN_POINTS_PER_STAR} PT</div><div className="font-mono text-xs">after you clear a level</div></div>
          <div className="border-[3px] border-ink rounded-xl shadow-b4 bg-white p-4"><div className="font-mono text-xs font-bold uppercase">Today</div><div className="text-3xl font-extrabold">{Math.min(today, MOUSERUN_DAILY_CAP)} / {MOUSERUN_DAILY_CAP} PTS</div><div className="font-mono text-xs">daily limit from this game</div></div>
          <div className="border-[3px] border-ink rounded-xl shadow-b4 bg-hot text-white p-4"><div className="font-mono text-xs font-bold uppercase">Careful</div><div className="text-3xl font-extrabold">3 lives</div><div className="font-mono text-xs">lose them all = half price for stars</div></div>
        </section>

        {!profile && (
          <div className="box p-6 flex flex-col gap-3 items-start">
            <p className="font-medium">You can play without an account, but to exchange stars for points you need to sign in.</p>
            <button className="btn bg-neon" onClick={() => openAccount(null)}>Sign in / Register</button>
          </div>
        )}

        <MouseRunGame
          signedIn={!!profile}
          onSignIn={() => openAccount(null)}
          onExchange={(stars, points) => exchangeStars(profile, stars, points)}
        />
        <p className="font-mono text-xs text-center">← → speed · ↑ / SPACE jump · on a phone use the buttons under the game</p>
      </div>
    </>
  );
}
