import { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';

export default function HeistAdminPanel() {
  const {
    users,
    allHeistTasks,
    stealRequests,
    saveHeistTask,
    deleteHeistTask,
    seedHeistTasks,
    approveStealRequest,
    rejectStealRequest,
  } = useApp();

  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [zoomPhoto, setZoomPhoto] = useState(null);

  const pending = stealRequests.filter((r) => r.status === 'pending');
  const done = stealRequests.filter((r) => r.status !== 'pending').slice(0, 12);
  const scoreOf = (id) => users.find((u) => u.id === id)?.score ?? 0;

  const addTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    await saveHeistTask({ title: title.trim(), details: details.trim(), active: true });
    setTitle('');
    setDetails('');
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Pending steal approvals */}
      <section className="box overflow-hidden">
        <div className="bg-hot text-white border-b-[3px] border-ink px-4 py-3 font-mono font-bold uppercase flex flex-wrap justify-between gap-2">
          <span>🕵️ Rattie Patty heist requests · {pending.length} waiting</span>
        </div>
        <div className="divide-y-2 divide-ink">
          {pending.map((r) => {
            const victimScore = scoreOf(r.victimId);
            return (
              <div key={r.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col sm:flex-row gap-3 min-w-0 flex-1">
                  {r.photo && (
                    <button type="button" onClick={() => setZoomPhoto(r.photo)}
                      className="shrink-0 border-[3px] border-ink rounded-lg overflow-hidden w-28 h-28 bg-paper hover:shadow-b4">
                      <img src={r.photo} alt="Heist proof" className="w-full h-full object-cover" />
                    </button>
                  )}
                  <div className="min-w-0 flex-1 flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <b>{r.thiefName}</b>
                      <span className="font-mono text-xs text-mute">wants to steal</span>
                      <span className="tag bg-hot text-white">{r.amount} PTS</span>
                      <span className="font-mono text-xs text-mute">from</span>
                      <b>{r.victimName}</b>
                      <span className="font-mono text-xs text-mute">(has {victimScore} PTS)</span>
                    </div>
                    <div className="font-mono text-xs font-bold text-cobalt uppercase">Task: {r.taskTitle}</div>
                    <p className="text-sm bg-paper border-2 border-ink/20 rounded-lg px-3 py-2 whitespace-pre-line break-words">
                      {r.description}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button className="btn bg-hot text-white text-xs" onClick={() => rejectStealRequest(r.id)}>✕ Reject</button>
                  <button className="btn bg-neon text-xs" onClick={() => approveStealRequest(r)}>✓ Approve heist</button>
                </div>
              </div>
            );
          })}
          {pending.length === 0 && <p className="p-4 font-mono text-sm">No heist requests waiting for approval.</p>}
          {done.map((r) => (
            <div key={r.id} className="p-3 text-sm flex flex-wrap justify-between gap-3 text-mute">
              <span className="min-w-0">
                <b>{r.thiefName}</b> {r.status === 'approved' ? 'stole' : 'tried to steal'} <b>{r.grantedAmount ?? r.amount} PTS</b> from <b>{r.victimName}</b> · {r.taskTitle}
              </span>
              <span className={`font-mono font-bold shrink-0 ${r.status === 'approved' ? 'text-[#007a33]' : 'text-hot'}`}>
                {r.status === 'approved' ? '✓ APPROVED' : '✕ REJECTED'}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Heist tasks written by admin */}
      <section className="box overflow-hidden">
        <div className="bg-sun border-b-[3px] border-ink px-4 py-3 font-mono font-bold uppercase flex flex-wrap items-center justify-between gap-2">
          <span>Heist tasks (participants complete one to steal points) · {allHeistTasks.length}</span>
          {allHeistTasks.length === 0 && (
            <button className="tag bg-white text-ink" onClick={seedHeistTasks}>+ Load demo heist tasks</button>
          )}
        </div>
        <div className="p-4 flex flex-col gap-4">
          <form onSubmit={addTask} className="grid md:grid-cols-12 gap-3 items-end">
            <div className="md:col-span-4">
              <label className="font-mono text-xs font-bold uppercase block mb-1">Task title *</label>
              <input className="input shadow-none" required maxLength={80} placeholder="e.g. Secret Selfie Challenge"
                value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="md:col-span-6">
              <label className="font-mono text-xs font-bold uppercase block mb-1">Instructions for participant</label>
              <input className="input shadow-none" maxLength={240} placeholder="What exactly must they do and show in the photo?"
                value={details} onChange={(e) => setDetails(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <button type="submit" className="btn bg-neon w-full text-xs">+ Add task</button>
            </div>
          </form>

          <div className="divide-y-2 divide-ink/15 border-t-2 border-ink/15">
            {allHeistTasks.map((t) => (
              <div key={t.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                <div className={`min-w-0 flex-1 ${t.active === false ? 'opacity-50' : ''}`}>
                  <div className="font-bold uppercase">{t.title} {t.active === false && <span className="tag bg-paper ml-1">HIDDEN</span>}</div>
                  {t.details && <div className="text-sm text-mute">{t.details}</div>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button className="tag bg-white" onClick={() => saveHeistTask({ active: t.active === false }, t.id)}>
                    {t.active === false ? 'SHOW' : 'HIDE'}
                  </button>
                  <button className="tag bg-hot text-white" onClick={() => confirm(`Delete heist task "${t.title}"?`) && deleteHeistTask(t.id)}>✕</button>
                </div>
              </div>
            ))}
            {allHeistTasks.length === 0 && (
              <p className="py-3 font-mono text-sm text-mute">No heist tasks yet. Add one above or load demo tasks.</p>
            )}
          </div>
        </div>
      </section>

      {zoomPhoto && (
        <div className="fixed inset-0 z-[80] bg-ink/85 flex items-center justify-center p-4" onClick={() => setZoomPhoto(null)}>
          <div className="relative max-w-2xl w-full bg-white border-4 border-ink rounded-2xl p-3 shadow-b8" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setZoomPhoto(null)} className="absolute right-3 top-3 w-8 h-8 border-2 border-ink bg-white font-bold">✕</button>
            <img src={zoomPhoto} alt="Heist proof full size" className="w-full max-h-[80vh] object-contain rounded-lg" />
          </div>
        </div>
      )}
    </div>
  );
}
