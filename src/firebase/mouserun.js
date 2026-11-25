import { collection, doc, increment, onSnapshot, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from './config.js';
import { MOUSERUN_DAILY_CAP, MOUSERUN_POINTS_PER_STAR } from '../config/settings.js';

/*
  Rattie Run — Firestore
  mouseRunDaily/{userId_day} { points }  — how many points a person has already got from the game today.
  Exchanging stars: +points to the player (same transaction), never more than MOUSERUN_DAILY_CAP a day.
*/
const fail = (code, message) => Object.assign(new Error(message), { code });
const dayKey = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

export const subscribeMouseRunToday = (userId, cb, onErr) =>
  onSnapshot(doc(db, 'mouseRunDaily', `${userId}_${dayKey()}`), (s) => cb(s.exists() ? s.data().points || 0 : 0), onErr);

export async function exchangeStars(user, stars, points) {
  const safe = Math.max(0, Math.min(Math.floor(points), Math.ceil(stars * MOUSERUN_POINTS_PER_STAR)));
  if (!safe) throw fail('empty', 'No stars to exchange.');
  return runTransaction(db, async (tx) => {
    const uRef = doc(db, 'users', user.id);
    const dRef = doc(db, 'mouseRunDaily', `${user.id}_${dayKey()}`);
    const [u, d] = await Promise.all([tx.get(uRef), tx.get(dRef)]);
    if (!u.exists()) throw fail('nouser', 'Account not found.');
    const used = d.exists() ? d.data().points || 0 : 0;
    const granted = Math.min(safe, MOUSERUN_DAILY_CAP - used);
    if (granted <= 0) throw fail('limit', `Daily limit reached (${MOUSERUN_DAILY_CAP} points). Come back tomorrow!`);
    tx.set(dRef, { userId: user.id, day: dayKey(), points: used + granted });
    tx.update(uRef, { score: increment(granted) });
    tx.set(doc(collection(db, 'pointsLog')), { userId: user.id, delta: granted, reason: 'Rattie Run: stars exchanged', createdAt: serverTimestamp() });
    return granted;
  });
}
