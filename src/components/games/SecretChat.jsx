import { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import {
  subscribeAsked, subscribeReceived, subscribeAskedToday,
  subscribeWardMessages, subscribeWardSentToday,
  askQuestion, answerQuestion, sendWardMessage, replyToWardMessage,
} from '../../firebase/chat.js';
import { SF_DAILY_QUESTIONS, SF_WARD_DAILY_MESSAGES, SF_QUESTION_MAX, SF_ANSWER_MAX } from '../../config/settings.js';
import { Card, List } from './RulesBits.jsx';

const Bubble = ({ side = 'left', who, children, cls = 'bg-white', dim }) => (
  <div className={`flex flex-col ${side === 'right' ? 'items-end' : 'items-start'}`}>
    <span className="font-mono text-[10px] font-bold uppercase text-mute mb-0.5 px-1">{who}</span>
    <div className={`max-w-[88%] border-[3px] border-ink rounded-2xl ${side === 'right' ? 'rounded-br-sm' : 'rounded-bl-sm'} px-3 py-2 text-sm font-medium break-words shadow-b2 ${cls} ${dim ? 'opacity-60 italic' : ''}`}>{children}</div>
  </div>
);

const ChatShell = ({ icon, title, sub, badge, cls, children }) => (
  <section className="box shadow-b8 overflow-hidden flex flex-col">
    <div className={`${cls} border-b-[3px] border-ink px-4 py-3 flex items-center gap-3`}>
      <span className="text-3xl" aria-hidden="true">{icon}</span>
      <div className="min-w-0 flex-1"><div className="font-extrabold uppercase leading-tight break-words">{title}</div><div className="font-mono text-[11px]">{sub}</div></div>
      {badge}
    </div>
    {children}
  </section>
);

function ReplyBox({ placeholder, btnLabel, btnCls, onSend }) {
  const { setError } = useApp();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const send = async (e) => {
    e.preventDefault(); setBusy(true);
    try { await onSend(text); } catch (err) { setError(err.message); }
    setBusy(false);
  };
  return (
    <form onSubmit={send} className="flex flex-col gap-2 items-end w-full">
      <textarea className="input !shadow-none w-full" rows={2} maxLength={SF_ANSWER_MAX} value={text} placeholder={placeholder} onChange={(e) => setText(e.target.value)} />
      <button className={`btn ${btnCls} !px-4 !py-2 text-sm disabled:opacity-50`} disabled={busy || !text.trim()}>{btnLabel}</button>
    </form>
  );
}

/* I am the secret friend: I ask questions to the person I give a gift to (3 a day), and I can also reply if they message me first */
export function ChatToWard({ me, wardName }) {
  const { profile, setError } = useApp();
  const [asked, setAsked] = useState([]);
  const [wardMsgs, setWardMsgs] = useState([]);
  const [today, setToday] = useState(0);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const onErr = (e) => setError(e.message);
    const off = [
      subscribeAsked(profile.id, setAsked, onErr),
      subscribeAskedToday(profile.id, setToday, onErr),
      subscribeWardMessages(me.targetId, setWardMsgs, onErr),
    ];
    return () => off.forEach((o) => o());
  }, [profile.id, me.targetId, setError]);

  const chat = [
    ...asked.filter((q) => q.wardId === me.targetId).map((q) => ({ ...q, _kind: 'asked' })),
    ...wardMsgs.map((m) => ({ ...m, _kind: 'ward' })),
  ].sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));

  const left = Math.max(0, SF_DAILY_QUESTIONS - today);
  const send = async (e) => {
    e.preventDefault(); setBusy(true); setMsg('');
    try { await askQuestion(profile.id, me.targetId, text); setText(''); } catch (err) { setMsg(err.message); }
    setBusy(false);
  };

  return (
    <ChatShell icon="🎁" cls="bg-neon" title={`Chat with ${wardName}`} sub="You give them a gift — they do not know it is you"
      badge={<span className="tag bg-white shrink-0">{left} of {SF_DAILY_QUESTIONS} left today</span>}>
      <div className="bg-paper p-4 flex flex-col gap-3 min-h-[14rem] max-h-[26rem] overflow-y-auto">
        {chat.length === 0 && <p className="m-auto text-center font-medium text-sm max-w-xs">No messages yet. Ask {wardName} something that helps you choose a good surprise — for example “What is your favourite snack?”</p>}
        {chat.map((item) => (
          item._kind === 'asked' ? (
            <div key={`a-${item.id}`} className="flex flex-col gap-2">
              <Bubble side="right" who="You (secret friend)" cls="bg-neon">{item.text}</Bubble>
              {item.answer
                ? <Bubble who={wardName} cls="bg-white">{item.answer}</Bubble>
                : <Bubble who={wardName} dim cls="bg-white">No answer yet — {wardName} does not have to answer.</Bubble>}
            </div>
          ) : (
            <div key={`w-${item.id}`} className="flex flex-col gap-2">
              <Bubble who={wardName} cls="bg-white">{item.text}</Bubble>
              {item.answer
                ? <Bubble side="right" who="You (secret friend)" cls="bg-neon">{item.answer}</Bubble>
                : <ReplyBox placeholder={`Reply anonymously to ${wardName}…`} btnLabel="Reply" btnCls="bg-neon"
                    onSend={(t) => replyToWardMessage(profile.id, me.targetId, item.id, t)} />}
            </div>
          )
        ))}
      </div>
      <form onSubmit={send} className="border-t-[3px] border-ink bg-white p-3 flex flex-col gap-2">
        <textarea className="input !shadow-none" rows={2} maxLength={SF_QUESTION_MAX} disabled={busy || !left} value={text}
          placeholder={left ? `Your question to ${wardName}…` : 'No questions left today — come back tomorrow'} onChange={(e) => { setText(e.target.value); setMsg(''); }} />
        {msg && <p className="font-mono text-xs font-bold text-hot">{msg}</p>}
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[11px] text-mute">{text.length} / {SF_QUESTION_MAX}</span>
          <button className="btn bg-neon !px-4 !py-2 text-sm disabled:opacity-50" disabled={busy || !left || text.trim().length < 3}>Send question</button>
        </div>
      </form>
    </ChatShell>
  );
}

/* I am the one who receives gifts: questions from my anonymous secret friend + I can also message them first (5/day) */
export function ChatFromFriend() {
  const { profile, setError } = useApp();
  const [received, setReceived] = useState([]);
  const [sentFirst, setSentFirst] = useState([]);
  const [sentToday, setSentToday] = useState(0);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const onErr = (e) => setError(e.message);
    const offs = [
      subscribeReceived(profile.id, setReceived, onErr),
      subscribeWardMessages(profile.id, setSentFirst, onErr),
      subscribeWardSentToday(profile.id, setSentToday, onErr),
    ];
    return () => offs.forEach((o) => o());
  }, [profile.id, setError]);

  const chat = [
    ...received.map((q) => ({ ...q, _kind: 'fromFriend' })),
    ...sentFirst.map((m) => ({ ...m, _kind: 'toFriend' })),
  ].sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));

  const left = Math.max(0, SF_WARD_DAILY_MESSAGES - sentToday);
  const open = received.filter((q) => !q.answer).length;

  const sendFirst = async (e) => {
    e.preventDefault(); setBusy(true); setMsg('');
    try { await sendWardMessage(profile.id, text); setText(''); } catch (err) { setMsg(err.message); }
    setBusy(false);
  };

  return (
    <ChatShell icon="🕵️" cls="bg-sun" title="Chat with your secret friend" sub="Message the person taking care of you — anonymous"
      badge={
        <div className="flex flex-wrap gap-1 justify-end shrink-0">
          {open > 0 && <span className="tag bg-hot text-white">{open} new</span>}
          <span className="tag bg-white">{left} of {SF_WARD_DAILY_MESSAGES} left today</span>
        </div>
      }>
      <div className="bg-paper p-4 flex flex-col gap-3 min-h-[14rem] max-h-[26rem] overflow-y-auto">
        {chat.length === 0 && <p className="m-auto text-center font-medium text-sm max-w-xs">No messages yet. Write a message to your secret friend first, or wait for their question!</p>}
        {chat.map((item) => (
          item._kind === 'fromFriend' ? (
            <div key={`f-${item.id}`} className="flex flex-col gap-2">
              <Bubble who="Your secret friend" cls="bg-white">{item.text}</Bubble>
              {item.answer
                ? <Bubble side="right" who="You" cls="bg-sun">{item.answer}</Bubble>
                : <ReplyBox placeholder="Your answer (you do not have to answer)…" btnLabel="Answer" btnCls="bg-sun"
                    onSend={(t) => answerQuestion(profile.id, item.id, t)} />}
            </div>
          ) : (
            <div key={`t-${item.id}`} className="flex flex-col gap-2">
              <Bubble side="right" who="You" cls="bg-sun">{item.text}</Bubble>
              {item.answer
                ? <Bubble who="Your secret friend" cls="bg-white">{item.answer}</Bubble>
                : <Bubble who="Your secret friend" dim cls="bg-white">Sent! Your secret friend has not replied yet.</Bubble>}
            </div>
          )
        ))}
      </div>
      <form onSubmit={sendFirst} className="border-t-[3px] border-ink bg-white p-3 flex flex-col gap-2">
        <textarea className="input !shadow-none" rows={2} maxLength={SF_QUESTION_MAX} disabled={busy || !left} value={text}
          placeholder={left ? 'Write a message to your secret friend first…' : `Daily limit reached (${SF_WARD_DAILY_MESSAGES} messages/day) — come back tomorrow`}
          onChange={(e) => { setText(e.target.value); setMsg(''); }} />
        {msg && <p className="font-mono text-xs font-bold text-hot">{msg}</p>}
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[11px] text-mute">{text.length} / {SF_QUESTION_MAX} · max {SF_WARD_DAILY_MESSAGES}/day</span>
          <button className="btn bg-sun !px-4 !py-2 text-sm disabled:opacity-50" disabled={busy || !left || text.trim().length < 3}>Send message</button>
        </div>
      </form>
    </ChatShell>
  );
}

export function ChatRules() {
  return (
    <div className="grid grid-cols-1 gap-4">
      <Card title="💬 Chat rules" cls="bg-white">
        <List mark="•" items={[
          `Your secret friend can send you ${SF_DAILY_QUESTIONS} questions a day, and you can message your secret friend first up to ${SF_WARD_DAILY_MESSAGES} times a day.`,
          'The chat is anonymous: you see “Your secret friend”, never their name.',
          'Nobody is forced to reply — you can answer whenever you want.',
        ]} />
      </Card>
      <Card title="✓ Good questions · ✕ never" cls="bg-neon/40">
        <List mark="✓" items={['Ask about tastes, snacks, hobbies, music, allergies.', 'Be kind and a little playful.']} />
        <List mark="✕" items={['Do not ask “who are you?” and do not give hints about yourself.', 'No rude, personal or hurtful questions.']} />
      </Card>
    </div>
  );
}
