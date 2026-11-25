import { Link } from 'react-router-dom';
import Marquee from '../components/layout/Marquee.jsx';
import Header from '../components/layout/Header.jsx';
import MissionsSection from '../components/missions/MissionsSection.jsx';
import { useApp } from '../context/AppContext.jsx';
import { countryOf } from '../hooks/useGame.js';
import PointsDelta from '../components/ui/PointsDelta.jsx';
import RattieBadge from '../components/ui/RattieBadge.jsx';
import { PADLET_URL, HOME_MARQUEE_TOP, HOME_MARQUEE_BOTTOM } from '../config/settings.js';

const NAV = [
  { id: 'schedule', to: '/schedule', title: 'Schedule & timeline', cls: 'bg-sun text-ink' },
  { id: 'secret-friend', to: '/secret-friend', title: 'Secret friend', cls: 'bg-neon text-ink' },
  { id: 'killer-game', to: '/killer-game', title: 'Killer game', cls: 'bg-hot text-white' },
  { id: 'oscar', to: '/oscar', title: 'Oscar Night', cls: 'bg-ink text-white' },
  { id: 'punishment', to: '/punishment', title: 'Punishment box', cls: 'bg-[#FFB3C6] text-ink' },
  { id: 'mouse-run', to: '/mouse-run', title: 'Rattie Run', cls: 'bg-[#C9B8FF] text-ink' },
  { id: 'ask', to: '/ask', title: 'Ask the Team', cls: 'bg-hot text-white' },
  { id: 'gossips', to: '/gossips', title: 'Gossip board', cls: 'bg-neon text-ink' },
  { id: 'reflection', to: '/reflection', href: PADLET_URL, title: 'Daily reflection', cls: 'bg-cobalt text-white' },
];

export default function HomePage() {
  const { users, accountId, isAdmin, lastChange, homeHidden, homeReady } = useApp();
  const vis = (id) => isAdmin || (homeReady && !homeHidden[id]);      // hidden by the admin = not shown to participants
  const dim = (id) => (isAdmin && homeHidden[id] ? 'opacity-50' : '');
  const hiddenTag = (id) => isAdmin && homeHidden[id] && <span className="tag bg-sun text-ink text-[9px] mt-1">HIDDEN</span>;
  const cards = NAV.filter((n) => vis(n.id));

  return (
    <>
      <Marquee items={HOME_MARQUEE_TOP} />
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col gap-8 sm:gap-10">
        <div>
          <Header />
          <div className="box shadow-b8 p-5 sm:p-6 md:p-10">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold uppercase leading-tight tracking-tight">ERASMUS+</h1>
            <p className="text-base sm:text-lg mt-2 font-bold">
              All-hands &amp; festival hub {isAdmin && <span className="tag bg-sun text-sm">ADMIN MODE</span>}
            </p>
          </div>
        </div>

        {vis('missions') && <div className={dim('missions')}>{hiddenTag('missions')}<MissionsSection /></div>}

        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {vis('ranking') && <div className={`lg:col-span-5 box overflow-hidden flex flex-col ${dim('ranking')}`}>
            <div className="bg-sun border-b-[3px] border-ink px-4 py-2.5 font-mono font-bold uppercase">Ranking — all participants</div>
            <div className="divide-y-[3px] divide-ink flex-1 max-h-[34rem] overflow-y-auto">
              {users.map((p, i) => (
                <div key={p.id} className={`p-3 flex items-center justify-between gap-2 ${p.id === accountId ? 'bg-sun/25' : ''}`}>
                  <div><b>#{String(i + 1).padStart(2, '0')} {p.name}</b><RattieBadge event={p.lastRattieEvent} /><div className="font-mono text-[11px] text-mute">{countryOf(p)}</div></div>
                  <b className="font-mono">{(p.score ?? 0).toLocaleString('en-US')} PTS<PointsDelta change={lastChange[p.id]} /></b>
                </div>
              ))}
              {users.length === 0 && <p className="p-3 font-mono text-sm">No participants yet.</p>}
            </div>
            <div className="hidden sm:block bg-paper border-t-[3px] border-ink p-3">
              <Link to="/leaderboard" className="btn bg-sun w-full text-xs">View full leaderboard [{users.length}] →</Link>
            </div>
          </div>}

          <div className={`${vis('ranking') ? 'lg:col-span-7' : 'lg:col-span-12'} grid grid-cols-3 gap-2 sm:gap-4`}>
            {cards.map((n) => {
              const tileCls = `border-[2px] sm:border-[3px] border-ink rounded-xl p-2.5 sm:p-4 min-h-[76px] sm:min-h-[108px] shadow-b2 sm:shadow-b4 hover:shadow-b6 active:translate-x-0.5 active:translate-y-0.5 transition-all flex flex-col justify-between text-left ${n.cls} ${dim(n.id)}`;
              const inner = (
                <>
                  <div>
                    <h3 className="text-[11px] sm:text-sm md:text-base font-extrabold uppercase leading-tight break-words">{n.title}</h3>
                    {hiddenTag(n.id)}
                  </div>
                  <span className="font-mono text-xs sm:text-sm font-bold self-end mt-1" aria-hidden="true">→</span>
                </>
              );
              return n.href
                ? <a key={n.to} href={n.href} target="_blank" rel="noopener noreferrer" className={tileCls}>{inner}</a>
                : <Link key={n.to} to={n.to} className={tileCls}>{inner}</Link>;
            })}
          </div>
        </section>
      </div>
      <Marquee className="bg-neon text-ink" items={HOME_MARQUEE_BOTTOM} />
    </>
  );
}
