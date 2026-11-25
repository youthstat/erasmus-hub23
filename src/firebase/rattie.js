import {
  collection, doc, addDoc, setDoc, getDoc, updateDoc, deleteDoc, onSnapshot, query, where, orderBy,
  runTransaction, serverTimestamp, increment, limit,
} from 'firebase/firestore';
import { db } from './config.js';

const list = (s) => s.docs.map((d) => ({ id: d.id, ...d.data() }));
const noop = () => {};
const fail = (code, message) => Object.assign(new Error(message), { code });

export const SEED_HEIST_TASKS = [
  {
    title: 'Group Activity & Photo',
    details: 'Lead an activity for the whole group, take a group photo together, and upload it here as proof!',
    active: true,
  },
  {
    title: 'Invisible Sunglasses Selfie',
    details: 'Take a selfie wearing someone else’s sunglasses or hat without them noticing (or right before they catch you).',
    active: true,
  },
  {
    title: 'International Synchronized Jump',
    details: 'Gather 3 participants from different countries and snap a photo where everyone is mid-air at the same time.',
    active: true,
  },
  {
    title: 'Dramatic Movie Poster Pose',
    details: 'Convince 2 other people to strike the most dramatic Oscar-worthy movie poster pose with you and snap a photo.',
    active: true,
  },
  {
    title: 'Secret High-Five Spy Shot',
    details: 'Take a photo giving a sneaky high-five or handshake to an organizer or facilitator while looking straight at the camera.',
    active: true,
  },
];

/* ---------- subscriptions ---------- */
export const subscribeHeistTasks = (cb, onErr = noop) =>
  onSnapshot(query(collection(db, 'heistTasks'), orderBy('createdAt', 'asc')), (s) => cb(list(s)), onErr);

export const subscribeStealRequests = (cb, onErr = noop) =>
  onSnapshot(query(collection(db, 'stealRequests'), orderBy('createdAt', 'desc'), limit(300)), (s) => cb(list(s)), onErr);

export const subscribeMyNotices = (userId, cb, onErr = noop) =>
  onSnapshot(query(collection(db, 'pointNotices'), where('userId', '==', userId), where('seen', '==', false)), (s) => cb(list(s)), onErr);

/* ---------- heist tasks (admin) ---------- */
export const saveHeistTask = (data, id) =>
  id
    ? updateDoc(doc(db, 'heistTasks', id), data)
    : addDoc(collection(db, 'heistTasks'), { ...data, createdAt: serverTimestamp() });

export const removeHeistTask = (id) => deleteDoc(doc(db, 'heistTasks', id));

export const seedHeistTasks = () => Promise.all(SEED_HEIST_TASKS.map((t) => saveHeistTask(t)));

export async function ensureDefaultHeistTasks() {
  const flagRef = doc(db, 'settings', 'heistDefaults');
  const flagSnap = await getDoc(flagRef);
  if (flagSnap.exists() && flagSnap.data()?.groupActivitySeeded) return;
  await setDoc(doc(db, 'heistTasks', 'group_activity_photo'), {
    title: 'Group Activity & Photo',
    details: 'Lead an activity for the whole group, take a group photo together, and upload it here as proof!',
    active: true,
    createdAt: serverTimestamp(),
  }, { merge: true });
  await setDoc(flagRef, { groupActivitySeeded: true }, { merge: true });
}

/* ---------- gift points (instant, anonymous to recipient) ---------- */
export async function giftPoints(senderId, recipientId, rawAmount) {
  const amount = Math.floor(Number(rawAmount));
  if (!senderId || !recipientId) throw fail('invalid', 'Choose a participant first.');
  if (senderId === recipientId) throw fail('self', 'You cannot gift points to yourself!');
  if (!Number.isFinite(amount) || amount <= 0) throw fail('amount', 'Enter a positive number of points.');

  await runTransaction(db, async (tx) => {
    const sRef = doc(db, 'users', senderId);
    const rRef = doc(db, 'users', recipientId);
    const [sSnap, rSnap] = await Promise.all([tx.get(sRef), tx.get(rRef)]);
    if (!sSnap.exists()) throw fail('nouser', 'Your account was not found.');
    if (!rSnap.exists()) throw fail('notarget', 'Recipient account was not found.');
    const senderScore = Number(sSnap.data().score) || 0;
    if (senderScore < amount) throw fail('funds', `You only have ${senderScore} PTS to give.`);

    tx.update(sRef, { score: increment(-amount) });
    tx.update(rRef, {
      score: increment(amount),
      lastRattieEvent: { kind: 'gift', amount, at: serverTimestamp() },
    });
    tx.set(doc(collection(db, 'pointsLog')), {
      userId: senderId,
      delta: -amount,
      reason: '🎁 Sent a secret gift via Rattie Patty',
      createdAt: serverTimestamp(),
    });
    // Generic reason & notice: NEVER reveals who sent the gift
    tx.set(doc(collection(db, 'pointsLog')), {
      userId: recipientId,
      delta: amount,
      reason: '🎁 Secret gift received!',
      createdAt: serverTimestamp(),
    });
    tx.set(doc(collection(db, 'pointNotices')), {
      userId: recipientId,
      kind: 'gift',
      amount,
      seen: false,
      createdAt: serverTimestamp(),
    });
  });
  return amount;
}

/* ---------- steal points (task proof + admin approval) ---------- */
export async function submitStealRequest({ thiefId, thiefName, victimId, victimName, amount, taskId, taskTitle, description, photo }) {
  const cleanAmount = Math.floor(Number(amount));
  const cleanDesc = String(description || '').trim();
  if (!thiefId || !victimId) throw fail('invalid', 'Choose who you want to rob.');
  if (thiefId === victimId) throw fail('self', 'You cannot rob yourself!');
  if (!Number.isFinite(cleanAmount) || cleanAmount <= 0) throw fail('amount', 'Choose how many points to steal.');
  if (!photo || !String(photo).startsWith('data:image/')) throw fail('photo', 'Attach a photo proving you completed the task.');
  if (cleanDesc.length < 5) throw fail('desc', 'Describe what you did (at least 5 characters).');
  if (!taskTitle) throw fail('task', 'Select a heist task.');

  await addDoc(collection(db, 'stealRequests'), {
    thiefId,
    thiefName: thiefName || 'Participant',
    victimId,
    victimName: victimName || 'Participant',
    amount: cleanAmount,
    taskId: taskId || null,
    taskTitle,
    description: cleanDesc.slice(0, 600),
    photo,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
}

export async function approveStealRequest(req) {
  return runTransaction(db, async (tx) => {
    const reqRef = doc(db, 'stealRequests', req.id);
    const tRef = doc(db, 'users', req.thiefId);
    const vRef = doc(db, 'users', req.victimId);
    const [reqSnap, tSnap, vSnap] = await Promise.all([tx.get(reqRef), tx.get(tRef), tx.get(vRef)]);
    if (!reqSnap.exists() || reqSnap.data().status !== 'pending') throw fail('done', 'This heist request was already reviewed.');
    if (!tSnap.exists() || !vSnap.exists()) throw fail('missing', 'Participant account no longer exists.');

    const victimScore = Number(vSnap.data().score) || 0;
    const stolen = Math.min(Math.floor(Number(req.amount) || 0), victimScore);
    if (stolen <= 0) throw fail('empty', `${vSnap.data().name} currently has 0 PTS left to steal.`);

    // Update victim (NO thief name stored anywhere on victim record/notice/log)
    tx.update(vRef, {
      score: increment(-stolen),
      lastRattieEvent: { kind: 'robbed', amount: stolen, at: serverTimestamp() },
    });
    tx.update(tRef, { score: increment(stolen) });

    tx.set(doc(collection(db, 'pointsLog')), {
      userId: req.victimId,
      delta: -stolen,
      reason: '🕵️ You were robbed!',
      createdAt: serverTimestamp(),
    });
    tx.set(doc(collection(db, 'pointsLog')), {
      userId: req.thiefId,
      delta: stolen,
      reason: '🕵️ Successful heist with Rattie Patty',
      createdAt: serverTimestamp(),
    });
    tx.set(doc(collection(db, 'pointNotices')), {
      userId: req.victimId,
      kind: 'robbed',
      amount: stolen,
      seen: false,
      createdAt: serverTimestamp(),
    });
    tx.update(reqRef, { status: 'approved', grantedAmount: stolen, resolvedAt: serverTimestamp() });
    return stolen;
  });
}

export const rejectStealRequest = (id) =>
  updateDoc(doc(db, 'stealRequests', id), { status: 'rejected', resolvedAt: serverTimestamp() });

export const dismissNotice = (id) =>
  updateDoc(doc(db, 'pointNotices', id), { seen: true });
