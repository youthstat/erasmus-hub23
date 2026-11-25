import { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { subscribeAsked, subscribeReceived, subscribeAskedToday, askQuestion, answerQuestion } from '../../firebase/chat.js';
import { SF_DAILY_QUESTIONS, SF_QUESTION_MAX, SF_ANSWER_MAX } from '../../config/settings.js';
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

/* I am the secret friend: I ask questions to the person I give a gift to (3 a day), they may answer */
export function ChatToWard({ me, wardName }) {
  const { profile, setError } = useApp();
  const [list, setList] = useState([]);
  const [today, setToday] = useState(0);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  useEffect(() => {
    const off = [subscribeAsked(profile.id, setList, (e) => setError(e.message)), subscribeAskedToday(profile.id, setToday, (e) => setError(e.message))];
    return () => off.forEach((o) => o());
  }, [profile.id, setError]);
  const chat = list.filter((q) => q.wardId === me.targetId);
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
        {chat.map((q) => (
          <div key={q.id} className="flex flex-col gap-2">
            <Bubble side="right" who="You (secret friend)" cls="bg-neon">{q.text}</Bubble>
            {q.answer
              ? <Bubble who={wardName} cls="bg-white">{q.answer}</Bubble>
              : <Bubble who={wardName} dim cls="bg-white">No answer yet — {wardName} does not have to answer.</Bubble>}
          </div>
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

function AnswerBox({ q, wardId }) {
  const { setError } = useApp();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const send = async (e) => {
    e.preventDefault(); setBusy(true);
    try { await answerQuestion(wardId, q.id, text); } catch (err) { setError(err.message); }
    setBusy(false);
  };
  return (
    <form onSubmit={send} className="flex flex-col gap-2 items-end w-full">
      <textarea className="input !shadow-none w-full" rows={2} maxLength={SF_ANSWER_MAX} value={text} placeholder="Your answer (you do not have to answer)…" onChange={(e) => setText(e.target.value)} />
      <button className="btn bg-sun !px-4 !py-2 text-sm disabled:opacity-50" disabled={busy || !text.trim()}>Answer</button>
    </form>
  );
}

/* I am the one who receives gifts: questions from my anonymous secret friend */
export function ChatFromFriend({ me }) {
  const { profile, setError } = useApp();
  const [list, setList] = useState([]);
  useEffect(() => subscribeReceived(profile.id, setList, (e) => setError(e.message)), [profile.id, setError]);
  const open = list.filter((q) => !q.answer).length;
  return (
    <ChatShell icon="🕵️" cls="bg-sun" title="Chat from your secret friend" sub="Somebody takes care of you — you do not know who"
      badge={open > 0 ? <span className="tag bg-hot text-white shrink-0">{open} new</span> : null}>
      <div className="bg-paper p-4 flex flex-col gap-3 min-h-[14rem] max-h-[26rem] overflow-y-auto">
        {list.length === 0 && <p className="m-auto text-center font-medium text-sm max-w-xs">No messages yet. Your secret friend may write to you at any moment. You never have to answer.</p>}
        {list.map((q) => (
          <div key={q.id} className="flex flex-col gap-2">
            <Bubble who="Your secret friend" cls="bg-white">{q.text}</Bubble>
            {q.answer ? <Bubble side="right" who="You" cls="bg-sun">{q.answer}</Bubble> : <AnswerBox q={q} wardId={profile.id} />}
          </div>
        ))}
      </div>
      <div className="border-t-[3px] border-ink bg-white px-4 py-2 font-mono text-[11px] text-mute">Your answers are sent to your secret friend without your name being asked. One answer per question.</div>
    </ChatShell>
  );
}

export function ChatRules() {
  return (
    <div className="grid grid-cols-1 gap-4">
      <Card title="💬 Chat rules" cls="bg-white">
        <List mark="•" items={[
          `You can send ${SF_DAILY_QUESTIONS} questions a day to the person you give a gift to.`,
          'The chat is anonymous: they see “Your secret friend”, never your name.',
          'The person who gets questions may answer — or not. Nobody is forced to reply.',
          'Every answer appears under the question: question — answer — question — answer.',
        ]} />
      </Card>
      <Card title="✓ Good questions · ✕ never" cls="bg-neon/40">
        <List mark="✓" items={['Ask about tastes, snacks, hobbies, music, allergies.', 'Be kind and a little playful.']} />
        <List mark="✕" items={['Do not ask “who are you?” and do not give hints about yourself.', 'No rude, personal or hurtful questions.']} />
      </Card>
    </div>
  );
}
