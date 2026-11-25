import { Link } from 'react-router-dom';
import Marquee from '../components/layout/Marquee.jsx';
import Header from '../components/layout/Header.jsx';
import { Avatar, Win, FieldCard } from '../components/games/SfParts.jsx';
import { ChatToWard, ChatRules } from '../components/games/SecretChat.jsx';
import { useApp } from '../context/AppContext.jsx';
import { useGame } from '../hooks/useGame.js';
import { isJoined } from '../firebase/games.js';
import { SF_PROFILE_FIELDS } from '../config/settings.js';

// The dossier of the person I am secret friend of: what they wrote about themselves + the secret chat with them.
export default function SfBuddyPage() {
  const { profile, openAccount } = useApp();
  const { byId, nameOf, countryOfId } = useGame('sf');
  const me = profile ? byId.get(profile.id) : null;
  const ward = me?.targetId ? byId.get(me.targetId) : null;
  const wp = ward?.profile || {};
  const name = me?.targetId ? nameOf(me.targetId) : '';
  const legacy = ward && (ward.likes || ward.dislikes);

  return (
    <>
      <Marquee className="bg-neon text-ink" items={['SECRET FRIEND DOSSIER', 'FOR YOUR EYES ONLY', 'NEVER REVEAL WHO YOU ARE']} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
        <Header back />
        {!profile && (
          <div className="box p-6 flex flex-col gap-3 items-start"><p className="font-medium">Sign in to open the dossier of your secret friend.</p><button className="btn bg-neon" onClick={() => openAccount(null)}>Sign in / Register</button></div>
        )}
        {profile && !(isJoined(me) && me.targetId) && (
          <div className="box p-6 flex flex-col gap-3 items-start"><p className="font-medium">You do not have a secret friend yet. Join the game and press “Show me who I am secret friend of”.</p><Link to="/secret-friend" className="btn bg-neon">← Secret friend page</Link></div>
        )}
        {profile && isJoined(me) && me.targetId && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 flex flex-col gap-6">
              <Win title={`DOSSIER // ${name}.TXT`} right={<span className="tag bg-hot text-white">FOR YOUR EYES ONLY</span>}>
                <div className="p-4 sm:p-6 bg-paper flex flex-col gap-6">
                  <div className="border-[3px] border-ink rounded-xl shadow-b6 bg-sun p-4 sm:p-6 flex flex-wrap items-center gap-5">
                    <Avatar photo={wp.photo} name={name} />
                    <div className="min-w-0">
                      <span className="tag bg-ink text-white">YOU ARE THEIR SECRET FRIEND</span>
                      <h1 className="text-3xl sm:text-5xl font-extrabold uppercase leading-none break-words mt-2">{name}</h1>
                      {countryOfId(me.targetId) && <div className="font-mono text-sm font-bold mt-2">from {countryOfId(me.targetId)}</div>}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 font-mono text-xs font-bold uppercase">
                    <span>Profile of {name}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {SF_PROFILE_FIELDS.map((f) => <FieldCard key={f.id} f={f} value={wp[f.id]} empty={`${name} has not written this yet — ask in the chat.`} />)}
                    {legacy && (
                      <div className="border-[3px] border-ink rounded-xl shadow-b4 bg-white p-4 md:col-span-2 flex flex-col gap-1">
                        <div className="font-mono text-xs font-bold uppercase">Earlier wishes</div>
                        {ward.likes && <div className="text-sm font-medium"><b>Likes:</b> {ward.likes}</div>}
                        {ward.dislikes && <div className="text-sm font-medium"><b>Does not like:</b> {ward.dislikes}</div>}
                      </div>
                    )}
                  </div>
                </div>
              </Win>
              <div className="border-[3px] border-ink rounded-xl shadow-b4 bg-hot text-white p-4 flex gap-3 items-start">
                <span className="text-2xl" aria-hidden="true">🔒</span>
                <p className="font-bold">Iron rule: never reveal who you are before the final gala — not in person, not in messages. Check allergies before you give any food.</p>
              </div>
            </div>
            <div className="lg:col-span-5 flex flex-col gap-6">
              <ChatToWard me={me} wardName={name} />
              <ChatRules />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
