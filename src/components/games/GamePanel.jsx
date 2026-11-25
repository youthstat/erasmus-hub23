import { useState } from 'react';
import { Link } from 'react-router-dom';
import * as games from '../../firebase/games.js';
import { isJoined } from '../../firebase/games.js';
import { useGame } from '../../hooks/useGame.js';
import { useApp } from '../../context/AppContext.jsx';
import { KILL_MOODS, KILL_STORY_MAX, SF_PROFILE_BONUS } from '../../config/settings.js';

// Secret friend: two doors — the profile of my person, and my own profile (a detailed one gives points once)
function SfProfileCard({ me }) {
  const got = !!me?.profileBonus;
  return (
    <div className={`border-[3px] border-ink rounded-xl shadow-b4 p-4 flex flex-wrap items-center justify-between gap-3 ${got ? 'bg-white' : 'bg-sun'}`}>
      <div className="min-w-0">
        <div className="font-mono text-xs font-bold uppercase">Your profile for your secret friend</div>
        <p className="font-bold">{got ? `✓ Profile saved — +${SF_PROFILE_BONUS} points received.` : `Fill in your profile — get +${SF_PROFILE_BONUS} points.`}</p>
        <p className="text-sm font-medium">What you like, hobbies, allergies, a photo — plus your secret chat with the person giving you gifts.</p>
      </div>
      <Link to="/secret-friend/my-profile" className="btn bg-ink text-white">{got ? 'Edit my profile' : 'Fill in my profile'} →</Link>
    </div>
  );
}

const COPY = {
  sf: {
    title: 'Secret friend',
    joinBtn: 'Join the Secret friend game',
    joined: 'You are in the game! Now find out whose secret friend you are.',
    getBtn: 'Show me who I am secret friend of',
    resultLabel: 'You are the secret friend of',
    hint: 'This is the person you secretly take care of. Do not tell anyone. You can always come back here and see this name again.',
  },
  kg: {
    title: 'Killer game',
    joinBtn: 'Join the Killer game',
    joined: 'You are in the game! Now find out who your victim is and which object you get.',
    getBtn: 'Show me my victim and object',
    resultLabel: 'Your victim (the person you must trick) is',
    hint: 'Do not show this to anyone. You can always come back here and see your current victim and object again.',
  },
};

export default function GamePanel({ game }) {
  const c = COPY[game];
  const { profile, openAccount } = useApp();
  const { players, byId, playing, dead, nameOf, countryOfId } = useGame(game);
  const [item, setItem] = useState('');
  const [msg, setMsg] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [killOpen, setKillOpen] = useState(false);      // the short "how did it go" form before the next victim
  const [story, setStory] = useState('');
  const [mood, setMood] = useState('');

  const me = profile ? byId.get(profile.id) : null;
  const enrolled = !!profile && playing.some((u) => u.id === profile.id);
  const joined = isJoined(me);
  const aliveCount = playing.filter((u) => !dead.has(u.id)).length;
  const joinedCount = players.filter(isJoined).length;

  const run = async (fn) => { setMsg(''); setBusy(true); try { await fn(); } catch (err) { setMsg(err.message); } setBusy(false); };
  const join = (e) => { e.preventDefault(); run(() => games.joinGame(game, profile.id, item)); };
  const getName = () => run(async () => { await games.claimResult(game, profile.id, playing.map((u) => u.id), nameOf); setNotice(''); });
  // The hunter must either tell how it went or keep it secret before the next victim appears.
  const finishKill = (withStory) => run(async () => {
    const victim = nameOf(me.targetId);
    await games.killPlayer(me.targetId, profile.id, nameOf, withStory ? { text: story, difficulty: mood } : null);
    setKillOpen(false); setStory(''); setMood('');
    setNotice(`${victim} is eliminated. Their contract is now yours — your next victim is shown below.`);
  });
  const toBoard = () => document.getElementById('board')?.scrollIntoView({ behavior: 'smooth' });

  const Err = () => msg && <p className="font-mono text-sm font-bold text-hot">{msg}</p>;

  // who is this person? name + country, and where to look them up
  const WhoIs = () => (
    <div className="mt-1 font-mono text-sm font-bold">
      {countryOfId(me.targetId) && <span>from {countryOfId(me.targetId)}</span>}
      <div className="font-normal text-xs mt-1 opacity-90">
        Do not know them yet?{' '}
        {game === 'kg'
          ? <button type="button" className="underline font-bold" onClick={toBoard}>See all players below</button>
          : <Link to="/leaderboard" className="underline font-bold">See all participants</Link>}
      </div>
    </div>
  );

  return (
    <section className="box shadow-b8 overflow-hidden" id="play">
      <div className="bg-ink text-white px-4 py-3 font-mono font-bold uppercase flex flex-wrap justify-between gap-2">
        <span>{c.title} — {profile ? `playing as ${profile.name}` : 'sign in to play'}</span>
        <span className="text-sun">{joinedCount} / {playing.length} joined</span>
      </div>

      <div className="p-4 sm:p-6 bg-paper">
        {!profile && (
          <div className="max-w-xl mx-auto text-center items-center flex flex-col gap-4">
            <p className="font-medium">To play you need your account. Sign in (or register once) — your name will be used automatically, nothing else to type.</p>
            <button className="btn bg-neon self-center" onClick={() => openAccount(null)}>Sign in / Register</button>
          </div>
        )}

        {profile && !enrolled && (
          <p className="max-w-xl mx-auto text-center font-mono text-sm">You are not enabled for this game. Ask the organizers to add you.</p>
        )}

        {/* killed */}
        {enrolled && game === 'kg' && me?.dead && (
          <div className="max-w-xl mx-auto text-center border-[3px] border-ink rounded-xl shadow-b6 p-6 bg-ink text-white">
            <div className="text-2xl sm:text-3xl font-extrabold uppercase line-through decoration-hot decoration-[5px] break-words">{profile.name}</div>
            <div className="mt-3 text-xl font-extrabold uppercase text-hot">You have been killed</div>
            <p className="mt-2 text-sm">Smile, admit defeat and congratulate your killer. Your contract and object have passed to them.</p>
          </div>
        )}

        {/* 1. join */}
        {enrolled && !me?.dead && !joined && (
          <form onSubmit={join} className="max-w-xl mx-auto flex flex-col gap-4">
            <p className="font-medium text-center">You are signed in as <b>{profile.name}</b>.</p>
            {game === 'kg' && (
              <label className="flex flex-col gap-1 font-mono text-xs font-bold uppercase">Your object (safe everyday item)
                <input className="input" required maxLength={40} placeholder="pen, fork, apple, badge…" value={item} onChange={(e) => setItem(e.target.value)} />
                <span className="normal-case font-normal text-mute">This object will be given to ANOTHER player to “kill” their victim with — objects are mixed randomly, you will never get your own, and it has nothing to do with the victim’s name. No knives or dangerous things!</span>
              </label>
            )}
            {game === 'sf' && <p className="border-[3px] border-ink rounded-xl bg-white px-4 py-3 text-sm font-bold shadow-b2 text-center">After joining you can fill in your own profile for your secret friend (optional) — a detailed profile gives +{SF_PROFILE_BONUS} points.</p>}
            <Err />
            <button type="submit" disabled={busy} className="btn bg-neon self-center disabled:opacity-50">{busy ? '…' : c.joinBtn}</button>
          </form>
        )}

        {/* 2. joined, nothing drawn yet */}
        {enrolled && !me?.dead && joined && !me.targetId && !(game === 'kg' && aliveCount <= 1 && playing.length > 1) && (
          <div className="max-w-xl mx-auto text-center items-center flex flex-col gap-4">
            <span className="tag bg-neon shadow-b4 -rotate-1 self-center text-sm px-4 py-1.5">✓ {profile.name}</span>
            <h3 className="text-xl sm:text-2xl font-extrabold uppercase">{c.joined}</h3>
            {notice && <p className="font-bold">{notice}</p>}
            {game === 'sf' && <div className="w-full text-left"><SfProfileCard me={me} /></div>}
            <Err />
            <button className="btn bg-sun self-center disabled:opacity-50" disabled={busy} onClick={getName}>{busy ? '…' : c.getBtn} →</button>
          </div>
        )}

        {/* last survivor */}
        {enrolled && game === 'kg' && !me?.dead && joined && !me.targetId && aliveCount <= 1 && playing.length > 1 && (
          <div className="max-w-xl mx-auto text-center border-[3px] border-ink rounded-xl shadow-b6 p-6 bg-sun">
            <div className="text-2xl font-extrabold uppercase">🏆 You are the last survivor</div>
            <p className="mt-2 font-bold">You are the Master Killer! Tell the organizers.</p>
          </div>
        )}

        {/* 3. result */}
        {enrolled && !me?.dead && joined && me.targetId && (
          <div className="max-w-xl mx-auto flex flex-col gap-4">
            {notice && <p className="border-[3px] border-ink rounded-xl bg-neon px-4 py-3 font-bold shadow-b4 text-center">{notice}</p>}
            <div className={`border-[3px] border-ink rounded-xl shadow-b6 p-6 text-center ${game === 'sf' ? 'bg-neon' : 'bg-hot text-white'}`}>
              <div className="font-mono text-xs font-bold uppercase">{c.resultLabel}</div>
              <div className="text-3xl sm:text-4xl font-extrabold uppercase break-words mt-1">★ {nameOf(me.targetId)} ★</div>
              <WhoIs />
              {game === 'sf' && (
                <div className="mt-4 pt-4 border-t-[3px] border-current flex flex-col items-center gap-2">
                  <div className="text-sm font-bold">Open the dossier of {nameOf(me.targetId)}: what they like, allergies, a photo — and your secret chat with them.</div>
                  <Link to="/secret-friend/buddy" className="btn bg-ink text-white self-center">Learn more about your secret friend →</Link>
                </div>
              )}
              {game === 'kg' && (
                <div className="mt-4 pt-4 border-t-[3px] border-current">
                  <div className="font-mono text-xs font-bold uppercase">Object to use on your victim</div>
                  <div className="text-2xl sm:text-3xl font-extrabold uppercase break-words">{me.itemText}</div>
                </div>
              )}
            </div>
            {game === 'kg' && !killOpen && (
              <div className="border-[3px] border-ink rounded-xl bg-white p-4 shadow-b4 flex flex-col gap-3">
                <p className="text-sm font-bold">⚠ Press this button ONLY after you have really killed your victim — they must have touched the object themselves and admitted it. Before your next victim appears you will tell us in a few words how it went (or keep it secret).</p>
                <button className="btn bg-hot text-white self-start" onClick={() => { setMsg(''); setKillOpen(true); }}>I killed my victim</button>
              </div>
            )}
            {game === 'kg' && killOpen && (
              <div className="border-[3px] border-ink rounded-xl bg-white shadow-b6 overflow-hidden">
                <div className="bg-hot text-white px-4 py-3 font-mono text-xs font-bold uppercase">Victim: {nameOf(me.targetId)} · one last step</div>
                <div className="p-4 flex flex-col gap-3">
                  <h3 className="text-xl font-extrabold uppercase leading-tight">How did it go?</h3>
                  <p className="text-sm font-medium">How did you do it, was it hard? Tell the hardest moment — or the funniest one. A couple of sentences is enough. Then confirm and you get your next victim.</p>
                  <div className="flex flex-wrap gap-2">
                    {KILL_MOODS.map((m) => (
                      <button key={m.id} type="button" onClick={() => setMood(mood === m.id ? '' : m.id)} className={`tag text-sm px-3 py-1.5 ${mood === m.id ? 'bg-neon ring-2 ring-ink' : 'bg-white'}`}>{m.label}</button>
                    ))}
                  </div>
                  <textarea className="input !shadow-none" rows={3} maxLength={KILL_STORY_MAX} placeholder="The hardest or the funniest moment…" value={story} onChange={(e) => setStory(e.target.value)} />
                  <div className="font-mono text-[11px] text-mute text-right">{story.length} / {KILL_STORY_MAX}</div>
                  <Err />
                  <div className="flex flex-wrap items-center gap-3">
                    <button className="btn bg-neon disabled:opacity-50" disabled={busy || story.trim().length < 3} onClick={() => finishKill(true)}>{busy ? '…' : 'Confirm the kill'}</button>
                    <button className="btn bg-white disabled:opacity-50" disabled={busy} onClick={() => finishKill(false)}>🤫 Keep it secret</button>
                    <button className="font-mono text-xs underline disabled:opacity-50" disabled={busy} onClick={() => setKillOpen(false)}>Cancel — I have not killed yet</button>
                  </div>
                  <p className="font-mono text-[11px] text-mute">Your story is shown on the board without your name. “Keep it secret” records the kill and shows nothing.</p>
                </div>
              </div>
            )}
            <p className="text-sm font-medium">{c.hint}</p>
            {game === 'sf' && <SfProfileCard me={me} />}
          </div>
        )}
      </div>
    </section>
  );
}
