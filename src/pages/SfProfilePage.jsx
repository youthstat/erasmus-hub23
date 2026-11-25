import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Marquee from '../components/layout/Marquee.jsx';
import Header from '../components/layout/Header.jsx';
import { Avatar, Win } from '../components/games/SfParts.jsx';
import { ChatFromFriend } from '../components/games/SecretChat.jsx';
import { useApp } from '../context/AppContext.jsx';
import { useGame } from '../hooks/useGame.js';
import { isJoined, saveSfProfile } from '../firebase/games.js';
import { fileToCover } from '../utils/image.js';
import { SF_PROFILE_FIELDS, SF_PROFILE_BONUS, SF_PROFILE_MAX } from '../config/settings.js';

// My own page for my secret friend: saving a filled-in profile automatically gives +50 points once.
export default function SfProfilePage() {
  const { profile, openAccount } = useApp();
  const { byId, countryOfId } = useGame('sf');
  const me = profile ? byId.get(profile.id) : null;
  const [form, setForm] = useState({ drinks: '', hobbies: '', wishlist: '', allergies: '', photo: '' });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [ok, setOk] = useState('');
  const loaded = useRef(false);
  const fileRef = useRef(null);

  useEffect(() => {                                    // fill the form once with what is already saved
    if (me && !loaded.current) { loaded.current = true; setForm((f) => ({ ...f, ...(me.profile || {}) })); }
  }, [me]);

  const got = !!me?.profileBonus;
  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setOk(''); setMsg(''); };
  const pickPhoto = async (e) => {
    const file = e.target.files?.[0]; e.target.value = '';
    if (!file) return;
    try { set('photo', await fileToCover(file, 320)); } catch (err) { setMsg(err.message); }
  };
  const save = async () => {
    setBusy(true); setMsg(''); setOk('');
    try {
      const { bonus } = await saveSfProfile(profile.id, form);
      setOk(bonus ? `Saved! +${SF_PROFILE_BONUS} points added to your rating 🎉` : 'Saved. Your secret friend sees it now.');
    } catch (err) { setMsg(err.message); }
    setBusy(false);
  };

  return (
    <>
      <Marquee className="bg-sun text-ink" items={['MY SECRET FRIEND PROFILE', 'FILL IT IN · PRESS SAVE', `GET +${SF_PROFILE_BONUS} POINTS ONCE`]} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
        <Header back />
        {!profile && <div className="box p-6 flex flex-col gap-3 items-start"><p className="font-medium">Sign in to fill in your profile.</p><button className="btn bg-neon" onClick={() => openAccount(null)}>Sign in / Register</button></div>}
        {profile && !isJoined(me) && <div className="box p-6 flex flex-col gap-3 items-start"><p className="font-medium">Join the Secret friend game first — then you can fill in your profile.</p><Link to="/secret-friend" className="btn bg-neon">← Secret friend page</Link></div>}
        {profile && isJoined(me) && (
          <>
            <div className={`border-[3px] border-ink rounded-xl shadow-b6 p-4 sm:p-6 flex flex-wrap items-center justify-between gap-4 ${got ? 'bg-neon' : 'bg-sun'}`}>
              <div>
                <div className="font-mono text-xs font-bold uppercase">{got ? 'Profile saved' : 'Bonus'}</div>
                <h1 className="text-2xl sm:text-4xl font-extrabold uppercase leading-tight">{got ? `✓ You got +${SF_PROFILE_BONUS} points` : `Fill in your profile — get +${SF_PROFILE_BONUS} points`}</h1>
                <p className="font-bold mt-1 max-w-2xl">
                  {got
                    ? 'Thank you! Your secret friend can now surprise you the right way. You can still edit everything.'
                    : `Fill in your profile and press “Save profile” — you automatically get +${SF_PROFILE_BONUS} points once!`}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-7 flex flex-col gap-6">
                <Win title="DOSSIER-CREATOR // MY-WISHLIST.TXT" right={<span className="tag bg-neon text-ink">VISIBLE ONLY TO YOUR SECRET FRIEND</span>}>
                  <div className="p-4 sm:p-6 bg-paper flex flex-col gap-5">
                    <div className="border-[3px] border-ink rounded-xl shadow-b6 bg-sun p-4 flex flex-wrap items-center gap-5">
                      <Avatar photo={form.photo} name={profile.name} />
                      <div className="min-w-0 flex-1">
                        <h2 className="text-2xl sm:text-4xl font-extrabold uppercase leading-none break-words">{profile.name}</h2>
                        {countryOfId(profile.id) && <div className="font-mono text-sm font-bold mt-1">from {countryOfId(profile.id)}</div>}
                        <div className="mt-3 flex flex-wrap gap-2">
                          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickPhoto} />
                          <button type="button" className="btn bg-white !px-3 !py-1.5 text-xs" onClick={() => fileRef.current?.click()}>{form.photo ? 'Change photo' : '📷 Add a photo (optional)'}</button>
                          {form.photo && <button type="button" className="btn bg-white !px-3 !py-1.5 text-xs" onClick={() => set('photo', '')}>Remove</button>}
                        </div>
                      </div>
                    </div>

                    {SF_PROFILE_FIELDS.map((f, i) => (
                      <div key={f.id} className={`border-[3px] border-ink rounded-xl shadow-b4 p-4 flex flex-col gap-2 ${f.danger ? 'bg-hot/15' : 'bg-white'}`}>
                        <label className="font-mono text-xs font-bold uppercase flex flex-wrap items-center justify-between gap-2" htmlFor={`sf-${f.id}`}>
                          <span>{String(i + 1).padStart(2, '0')} // {f.icon} {f.title}</span>
                        </label>
                        <textarea id={`sf-${f.id}`} className="input !shadow-none" rows={3} maxLength={SF_PROFILE_MAX} placeholder={f.ph} value={form[f.id] || ''} onChange={(e) => set(f.id, e.target.value)} />
                        <div className="font-mono text-[11px] text-mute text-right">{(form[f.id] || '').length} / {SF_PROFILE_MAX}</div>
                      </div>
                    ))}

                    {msg && <p className="font-mono text-sm font-bold text-hot">{msg}</p>}
                    {ok && <p className="border-[3px] border-ink rounded-xl bg-neon px-4 py-3 font-bold shadow-b4">{ok}</p>}
                    <div className="flex flex-wrap items-center gap-3">
                      <button className="btn bg-sun disabled:opacity-50" disabled={busy} onClick={save}>{busy ? '…' : '💾 Save profile'}</button>
                      <Link to="/secret-friend" className="btn bg-white">← Back</Link>
                    </div>
                  </div>
                </Win>
              </div>

              <div className="lg:col-span-5 flex flex-col gap-6">
                <ChatFromFriend />
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
