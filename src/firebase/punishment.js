import { collection, doc, getDocs, onSnapshot, query, runTransaction, where, increment, serverTimestamp, writeBatch, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from './config.js';
import { PUNISHMENT_COST, PUNISHMENT_REWARD, PUNISHMENT_MIN_LENGTH, PUNISHMENT_MAX_LENGTH, PUNISHMENT_DAILY_LIMIT } from '../config/settings.js';

/*
  Punishment box — Firestore
  punishments/{id}  { text, userId, userName, drawn, drawnBy, drawnByName, drawnAt, createdAt }
    id = hash(author + text): the same person cannot put the same paper in twice.
  Writing a paper: +PUNISHMENT_REWARD point to the author (same transaction), at most PUNISHMENT_DAILY_LIMIT per person per day.
  Drawing a paper: -PUNISHMENT_COST points to the person who draws; one random paper that is still in the box
  (papers of other people first); a paper is taken only once (transaction).
  Participants never see who wrote what; only the admin panel shows authors.
*/
const fail = (code, message) => Object.assign(new Error(message), { code });
const list = (s) => s.docs.map((d) => ({ id: d.id, ...d.data() }));
export const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
// punishmentDaily/{userId_day} { count } — how many a person has written today (kept even if a paper is deleted)
export const subscribeWrittenToday = (userId, cb, onErr) =>
  onSnapshot(doc(db, 'punishmentDaily', `${userId}_${todayKey()}`), (s) => cb(s.exists() ? s.data().count || 0 : 0), onErr);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const subscribePunishments = (cb, onErr) => onSnapshot(collection(db, 'punishments'), (s) => cb(list(s)), onErr);

async function paperId(userId, text) {
  const norm = text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`punishment|${userId}|${norm}`));
  return [...new Uint8Array(buf)].slice(0, 12).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function writePunishment(user, rawText) {
  const text = String(rawText || '').trim().replace(/\s+/g, ' ').slice(0, PUNISHMENT_MAX_LENGTH);
  if (text.length < PUNISHMENT_MIN_LENGTH) throw fail('short', `Write at least ${PUNISHMENT_MIN_LENGTH} characters.`);
  const pRef = doc(db, 'punishments', await paperId(user.id, text));
  await runTransaction(db, async (tx) => {
    const uRef = doc(db, 'users', user.id);
    const dRef = doc(db, 'punishmentDaily', `${user.id}_${todayKey()}`);
    const [p, u, d] = await Promise.all([tx.get(pRef), tx.get(uRef), tx.get(dRef)]);
    if (!u.exists()) throw fail('nouser', 'Account not found.');
    const count = d.exists() ? d.data().count || 0 : 0;
    if (count >= PUNISHMENT_DAILY_LIMIT) throw fail('limit', `You can write only ${PUNISHMENT_DAILY_LIMIT} punishments a day. Come back tomorrow!`);
    if (p.exists()) throw fail('duplicate', 'You have already put this punishment into the box. Think of a new one!');
    tx.set(pRef, { text, userId: user.id, userName: user.name, drawn: false, createdAt: serverTimestamp() });
    tx.set(dRef, { userId: user.id, day: todayKey(), count: count + 1 });
    tx.update(uRef, { score: increment(PUNISHMENT_REWARD) });
    tx.set(doc(collection(db, 'pointsLog')), { userId: user.id, delta: PUNISHMENT_REWARD, reason: 'Punishment box: wrote a punishment', createdAt: serverTimestamp() });
  });
  return PUNISHMENT_REWARD;
}

export async function drawPunishment(user) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const inBox = list(await getDocs(query(collection(db, 'punishments'), where('drawn', '==', false))));
    if (!inBox.length) throw fail('empty', 'The box is empty. Write the first punishment!');
    const others = inBox.filter((p) => p.userId !== user.id);          // your own paper only if nothing else is left
    const chosen = pick(others.length ? others : inBox);
    try {
      return await runTransaction(db, async (tx) => {
        const pRef = doc(db, 'punishments', chosen.id);
        const uRef = doc(db, 'users', user.id);
        const [p, u] = await Promise.all([tx.get(pRef), tx.get(uRef)]);
        if (!u.exists()) throw fail('nouser', 'Account not found.');
        if (!p.exists() || p.data().drawn) throw fail('retry', 'retry');   // somebody took it a moment ago
        tx.update(pRef, { drawn: true, drawnBy: user.id, drawnByName: user.name, drawnAt: serverTimestamp() });
        tx.update(uRef, { score: increment(-PUNISHMENT_COST) });
        tx.set(doc(collection(db, 'pointsLog')), { userId: user.id, delta: -PUNISHMENT_COST, reason: 'Punishment box: took a punishment', createdAt: serverTimestamp() });
        return { id: chosen.id, text: p.data().text };
      });
    } catch (e) { if (e.code !== 'retry') throw e; }
  }
  throw fail('busy', 'Too many people at once. Try again.');
}

/* admin */
export const deletePunishment = (id) => deleteDoc(doc(db, 'punishments', id));
export const putBackPunishment = (id) => updateDoc(doc(db, 'punishments', id), { drawn: false, drawnBy: null, drawnByName: null, drawnAt: null });
export async function clearPunishments() {
  const daily = await getDocs(collection(db, 'punishmentDaily'));          // the daily limits start from zero again
  for (let i = 0; i < daily.docs.length; i += 400) {
    const b = writeBatch(db);
    daily.docs.slice(i, i + 400).forEach((d) => b.delete(d.ref));
    await b.commit();
  }
  const snap = await getDocs(collection(db, 'punishments'));
  for (let i = 0; i < snap.docs.length; i += 400) {
    const batch = writeBatch(db);
    snap.docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
  return snap.docs.length;
}
