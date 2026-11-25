import {
  collection, doc, getDocs, onSnapshot, orderBy, query,
  runTransaction, serverTimestamp, writeBatch, increment, setDoc,
} from 'firebase/firestore';
import { db } from './config.js';

const list = (s) => s.docs.map((d) => ({ id: d.id, ...d.data() }));
const noop = () => {};

export const PRIZES_2048 = [500, 200, 100];

export const subscribe2048Scores = (cb, onErr = noop) =>
  onSnapshot(query(collection(db, 'game2048Scores'), orderBy('bestScore', 'desc')), (s) => cb(list(s)), onErr);

export const subscribe2048Config = (cb, onErr = noop) =>
  onSnapshot(doc(db, 'game2048Config', 'main'), (s) => cb(s.exists() ? s.data() : { awarded: false, winners: [] }), onErr);

export async function save2048Score(user, score, country = '') {
  const clean = Math.max(0, Math.floor(Number(score) || 0));
  if (!user?.id || clean <= 0) return { saved: false, bestScore: 0 };
  const ref = doc(db, 'game2048Scores', user.id);
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const prev = snap.exists() ? Number(snap.data().bestScore) || 0 : 0;
    if (clean <= prev) return { saved: false, bestScore: prev };
    tx.set(ref, {
      userId: user.id,
      userName: user.name,
      country: country || user.country || '',
      bestScore: clean,
      updatedAt: serverTimestamp(),
    });
    return { saved: true, bestScore: clean };
  });
}

export async function awardTop3Prizes() {
  const scoresSnap = await getDocs(query(collection(db, 'game2048Scores'), orderBy('bestScore', 'desc')));
  const top3 = list(scoresSnap).filter((s) => (s.bestScore || 0) > 0).slice(0, 3);
  if (!top3.length) throw new Error('No 2048 scores recorded yet.');

  return runTransaction(db, async (tx) => {
    const cfgRef = doc(db, 'game2048Config', 'main');
    const cfgSnap = await tx.get(cfgRef);
    if (cfgSnap.exists() && cfgSnap.data().awarded) {
      throw new Error('Top 3 prizes have already been awarded.');
    }
    const userSnaps = await Promise.all(top3.map((s) => tx.get(doc(db, 'users', s.userId))));
    const winners = [];
    top3.forEach((entry, idx) => {
      const prize = PRIZES_2048[idx];
      const uSnap = userSnaps[idx];
      if (!uSnap.exists()) return;
      const uRef = doc(db, 'users', entry.userId);
      tx.update(uRef, { score: increment(prize) });
      tx.set(doc(collection(db, 'pointsLog')), {
        userId: entry.userId,
        delta: prize,
        reason: `🏆 Rattie 2048: #${idx + 1} place`,
        createdAt: serverTimestamp(),
      });
      winners.push({
        place: idx + 1,
        userId: entry.userId,
        userName: uSnap.data().name || entry.userName,
        bestScore: entry.bestScore,
        prize,
      });
    });
    tx.set(cfgRef, { awarded: true, awardedAt: serverTimestamp(), winners });
    return winners;
  });
}

export async function reset2048Game() {
  const snap = await getDocs(collection(db, 'game2048Scores'));
  for (let i = 0; i < snap.docs.length; i += 400) {
    const batch = writeBatch(db);
    snap.docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
  await setDoc(doc(db, 'game2048Config', 'main'), { awarded: false, winners: [] });
}
