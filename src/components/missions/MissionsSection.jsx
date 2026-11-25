import { useApp } from '../../context/AppContext.jsx';
import MissionCard from './MissionCard.jsx';

export default function MissionsSection() {
  const { missions, isAdmin, openEditor } = useApp();
  return (
    <section className="box shadow-b8 overflow-hidden">
      <div className="bg-sun border-b-[3px] border-ink px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-extrabold uppercase">⚡ Active missions // earn extra points</h2>
          <span className="tag bg-hot text-white shadow-b2">{missions.length} AVAILABLE</span>
        </div>
        {isAdmin && <button className="btn bg-ink text-sun text-xs" onClick={() => openEditor(null)}>+ New mission</button>}
      </div>
      <div className="p-4 sm:p-6 bg-paper">
        {missions.length > 0 ? (
          <>
            <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 overflow-x-auto sm:overflow-visible snap-x snap-mandatory pb-2 sm:pb-0 -mx-1 px-1 sm:mx-0 sm:px-0 no-scrollbar">
              {missions.map((m) => (
                <MissionCard
                  key={m.id}
                  mission={m}
                  className="shrink-0 w-[82%] snap-start sm:w-auto"
                />
              ))}
            </div>
            {missions.length > 1 && (
              <p className="sm:hidden font-mono text-[10px] font-bold uppercase text-mute text-center mt-1.5">
                ← Swipe sideways for more missions →
              </p>
            )}
          </>
        ) : (
          <p className="font-mono">No missions yet. {isAdmin ? 'Create the first one or load demo missions in the Admin panel.' : 'Check back soon.'}</p>
        )}
      </div>
    </section>
  );
}
