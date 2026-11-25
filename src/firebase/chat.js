import { collection, doc, onSnapshot, query, where, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from './config.js';
import { SF_DAILY_QUESTIONS, SF_WARD_DAILY_MESSAGES, SF_QUESTION_MAX, SF_ANSWER_MAX } from '../config/settings.js';
import { todayKey } from './punishment.js';

/*
  Secret friend chat (two-way, anonymous for the ward)
  1. Giver -> Ward:
     sfQuestions/{id}  { giverId, wardId, text, answer, createdAt, answeredAt, day }
     sfDaily/{giverId_day} { count }   at most SF_DAILY_QUESTIONS per day.
  2. Ward -> Secret Friend (initiated by the person receiving gifts):
     sfWardMessages/{id} { wardId, text, answer, createdAt, answeredAt, day }
     sfWardDaily/{wardId_day} { count }  at most SF_WARD_DAILY_MESSAGES (5) per day.
*/
const fail = (code, message) => Object.assign(new Error(message), { code });
const rows = (s) => s.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));

export const subscribeAsked = (giverId, cb, onErr) =>
  onSnapshot(query(collection(db, 'sfQuestions'), where('giverId', '==', giverId)), (s) => cb(rows(s)), onErr);
export const subscribeReceived = (wardId, cb, onErr) =>
  onSnapshot(query(collection(db, 'sfQuestions'), where('wardId', '==', wardId)), (s) => cb(rows(s)), onErr);
export const subscribeAskedToday = (giverId, cb, onErr) =>
  onSnapshot(doc(db, 'sfDaily', `${giverId}_${todayKey()}`), (s) => cb(s.exists() ? s.data().count || 0 : 0), onErr);

export const subscribeWardMessages = (wardId, cb, onErr) =>
  onSnapshot(query(collection(db, 'sfWardMessages'), where('wardId', '==', wardId)), (s) => cb(rows(s)), onErr);
export const subscribeWardSentToday = (wardId, cb, onErr) =>
  onSnapshot(doc(db, 'sfWardDaily', `${wardId}_${todayKey()}`), (s) => cb(s.exists() ? s.data().count || 0 : 0), onErr);

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

export async function sendWardMessage(wardId, raw) {
  const text = String(raw || '').trim().replace(/\s+/g, ' ').slice(0, SF_QUESTION_MAX);
  if (text.length < 3) throw fail('short', 'Write a message (at least 3 characters).');
  const dRef = doc(db, 'sfWardDaily', `${wardId}_${todayKey()}`);
  await runTransaction(db, async (tx) => {
    const d = await tx.get(dRef);
    const count = d.exists() ? d.data().count || 0 : 0;
    if (count >= SF_WARD_DAILY_MESSAGES) throw fail('limit', `You can send only ${SF_WARD_DAILY_MESSAGES} messages a day. Come back tomorrow!`);
    tx.set(doc(collection(db, 'sfWardMessages')), { wardId, text, answer: null, day: todayKey(), createdAt: serverTimestamp() });
    tx.set(dRef, { wardId, day: todayKey(), count: count + 1 });
  });
}

export async function replyToWardMessage(giverId, wardId, messageId, raw) {
  const answer = String(raw || '').trim().replace(/\s+/g, ' ').slice(0, SF_ANSWER_MAX);
  if (!answer) throw fail('short', 'Write a reply.');
  const ref = doc(db, 'sfWardMessages', messageId);
  await runTransaction(db, async (tx) => {
    const m = await tx.get(ref);
    if (!m.exists() || m.data().wardId !== wardId) throw fail('missing', 'This message is not from your secret friend.');
    if (m.data().answer) throw fail('done', 'You have already replied to this message.');
    tx.update(ref, { answer, answeredBy: giverId, answeredAt: serverTimestamp() });
  });
}
