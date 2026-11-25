import { collection, doc, onSnapshot, query, where, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from './config.js';
import { SF_DAILY_QUESTIONS, SF_QUESTION_MAX, SF_ANSWER_MAX } from '../config/settings.js';
import { todayKey } from './punishment.js';

/*
  Secret friend chat
  sfQuestions/{id}  { giverId, wardId, text, answer, createdAt, answeredAt, day }
     giverId = the secret friend (the one who gives the gift), wardId = the person they give to.
     The question is anonymous for the ward (the screen never shows giverId). The ward may leave it unanswered.
  sfDaily/{giverId_day} { count }   at most SF_DAILY_QUESTIONS questions per day from one secret friend.
*/
const fail = (code, message) => Object.assign(new Error(message), { code });
const rows = (s) => s.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));

export const subscribeAsked = (giverId, cb, onErr) =>
  onSnapshot(query(collection(db, 'sfQuestions'), where('giverId', '==', giverId)), (s) => cb(rows(s)), onErr);
export const subscribeReceived = (wardId, cb, onErr) =>
  onSnapshot(query(collection(db, 'sfQuestions'), where('wardId', '==', wardId)), (s) => cb(rows(s)), onErr);
export const subscribeAskedToday = (giverId, cb, onErr) =>
  onSnapshot(doc(db, 'sfDaily', `${giverId}_${todayKey()}`), (s) => cb(s.exists() ? s.data().count || 0 : 0), onErr);

export async function askQuestion(giverId, wardId, raw) {
  const text = String(raw || '').trim().replace(/\s+/g, ' ').slice(0, SF_QUESTION_MAX);
  if (text.length < 3) throw fail('short', 'Write a question.');
  const dRef = doc(db, 'sfDaily', `${giverId}_${todayKey()}`);
  await runTransaction(db, async (tx) => {
    const d = await tx.get(dRef);
    const count = d.exists() ? d.data().count || 0 : 0;
    if (count >= SF_DAILY_QUESTIONS) throw fail('limit', `You can send only ${SF_DAILY_QUESTIONS} questions a day. Come back tomorrow!`);
    tx.set(doc(collection(db, 'sfQuestions')), { giverId, wardId, text, answer: null, day: todayKey(), createdAt: serverTimestamp() });
    tx.set(dRef, { giverId, day: todayKey(), count: count + 1 });
  });
}

export async function answerQuestion(wardId, questionId, raw) {
  const answer = String(raw || '').trim().replace(/\s+/g, ' ').slice(0, SF_ANSWER_MAX);
  if (!answer) throw fail('short', 'Write an answer.');
  const ref = doc(db, 'sfQuestions', questionId);
  await runTransaction(db, async (tx) => {
    const q = await tx.get(ref);
    if (!q.exists() || q.data().wardId !== wardId) throw fail('missing', 'This question is not for you.');
    if (q.data().answer) throw fail('done', 'You have already answered this question.');
    tx.update(ref, { answer, answeredAt: serverTimestamp() });
  });
}
