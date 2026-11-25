import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Marquee from '../components/layout/Marquee.jsx';
import Header from '../components/layout/Header.jsx';
import MissionsSection from '../components/missions/MissionsSection.jsx';
import { useApp } from '../context/AppContext.jsx';
import { countryOf } from '../hooks/useGame.js';
import PointsDelta from '../components/ui/PointsDelta.jsx';
import RattieBadge from '../components/ui/RattieBadge.jsx';
import { SPRITES } from '../components/mascot/sprites.js';
import { PADLET_URL, HOME_MARQUEE_TOP, HOME_MARQUEE_BOTTOM } from '../config/settings.js';

const NAV = [
  { id: 'schedule', frames: ['watch1', 'watch2', 'watch3', 'watch4'], anim: 'mascot-breathe', speed: 950, to: '/schedule', title: 'Schedule & timeline', text: 'Daily mission timeline, pop-up session alerts, and assigned checkpoints.', cta: 'View schedule', ctaDesktop: 'View full schedule', cls: 'bg-sun', btn: 'bg-ink text-sun' },
  { id: 'secret-friend', frames: ['gift1', 'gift3', 'gift2', 'gift4'], anim: 'mascot-breathe', speed: 950, to: '/secret-friend', title: 'Secret friend', text: 'Receive your match, deliver gifts, and uncover who has your wishlist.', cta: 'Open game', ctaDesktop: 'Go to secret friend', cls: 'bg-neon', btn: 'bg-ink text-neon' },
  { id: 'killer-game', frames: ['mafia1', 'mafia2', 'mafia3', 'mafia4'], anim: 'mascot-breathe', speed: 1000, to: '/killer-game', title: 'Killer game', text: 'Your secret target is assigned. Tag rivals with verbal traps before you get tagged.', cta: 'Open game', ctaDesktop: 'Go to killer game', cls: 'bg-hot text-white', btn: 'bg-white text-hot' },
  { id: 'oscar', frames: ['oscar1', 'oscar2', 'oscar3', 'oscar4'], anim: 'mascot-breathe', speed: 950, to: '/oscar', title: 'Oscar Night', text: 'Create your film crew, send your nominees to the voting and cast your Oscar ballot.', cta: 'Open Oscar', ctaDesktop: 'Go to Oscar Night', cls: 'bg-ink text-white', btn: 'bg-sun text-ink' },
  { id: 'punishment', frames: ['guilty1', 'guilty2', 'guilty3'], anim: 'mascot-breathe', speed: 1000, to: '/punishment', title: 'Punishment box', text: 'Write a punishment (+1 point) or dare to pull one out of the box (−3 points).', cta: 'Open box', ctaDesktop: 'Open the box', cls: 'bg-[#FFB3C6]', btn: 'bg-ink text-white' },
  { id: 'mouse-run', frames: ['play2048_1', 'play2048_2', 'play2048_3', 'play2048_4'], anim: 'mascot-breathe', speed: 950, to: '/mouse-run', title: 'Rattie 2048', text: 'Slide & merge tiles to reach 2048! Your best score is saved — Top 3 win +500, +200 & +100 PTS.', cta: 'Play 2048', ctaDesktop: 'Play 2048', cls: 'bg-[#C9B8FF]', btn: 'bg-ink text-white' },
  { id: 'gossips', frames: ['gossip1', 'gossip2', 'gossip3', 'gossip4'], anim: 'mascot-breathe', speed: 1000, to: '/gossips', title: 'Gossip board', text: 'Write a gossip anonymously (+1 point each). Reading the board opens only with the password from the organizers.', cta: 'Open board', ctaDesktop: 'Open gossip board', cls: 'bg-neon', btn: 'bg-ink text-neon' },
  { id: 'reflection', frames: ['reflect1', 'reflect2', 'reflect3', 'reflect4'], anim: 'mascot-breathe', speed: 1100, to: '/reflection', href: PADLET_URL, title: 'Daily reflection', text: "Record daily impressions and shape the festival's emotional pulse.", cta: 'Open Padlet', ctaDesktop: 'Go to reflection', cls: 'bg-cobalt text-white', btn: 'bg-white text-cobalt' },
];

function CardMouse({ frames, anim, speed = 1000 }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (frames.length <= 1) return undefined;
    const t = setInterval(() => setIdx((i) => (i + 1) % frames.length), speed);
    return () => clearInterval(t);
  }, [frames.length, speed]);

  const sp = SPRITES[frames[idx % frames.length]] || SPRITES.idle;
  return (
    <div className="w-12 h-12 sm:w-20 sm:h-20 shrink-0 flex items-end justify-center transition-transform duration-200 ease-out group-hover:scale-110 group-hover:-rotate-3">
      <img
        src={sp.src}
        alt=""
        draggable={false}
        decoding="async"
        className={`w-full h-full object-contain object-bottom select-none drop-shadow-[0_2px_0_rgba(17,17,17,0.18)] ${anim}`}
      />
    </div>
  );
}

export default function HomePage() {
  const { users, accountId, isAdmin, openAuth, logoutAdmin, pendingCount, lastChange, homeHidden, homeReady } = useApp();
  const vis = (id) => isAdmin || (homeReady && !homeHidden[id]);      // hidden by the admin = not shown to participants
  const dim = (id) => (isAdmin && homeHidden[id] ? 'opacity-50' : '');
  const hiddenTag = (id) => isAdmin && homeHidden[id] && <span className="tag bg-sun text-[10px] sm:text-xs">HIDDEN</span>;
  const cards = NAV.filter((n) => vis(n.id));
  return (
    <>
      <Marquee items={HOME_MARQUEE_TOP} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col gap-8 sm:gap-10">
        <div>
          <Header />
          <div className="box shadow-b8 px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h1 className="text-2xl sm:text-4xl font-extrabold uppercase leading-none tracking-tight">ERASMUS+</h1>
              {isAdmin && <span className="tag bg-sun text-xs">ADMIN MODE</span>}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => isAdmin && logoutAdmin()}
                className={`border-2 rounded-lg px-2 py-0.5 font-mono text-[10px] sm:text-[11px] font-bold uppercase transition ${
                  !isAdmin
                    ? 'bg-neon/15 border-[#00a844]/40 text-ink/75'
                    : 'bg-transparent border-ink/15 text-ink/45 hover:border-ink/50 hover:text-ink'
                }`}
              >
                User
              </button>
              {isAdmin ? (
                <Link
                  to="/admin"
                  className="bg-sun/25 border-2 border-ink/40 text-ink/80 hover:border-ink hover:text-ink rounded-lg px-2 py-0.5 font-mono text-[10px] sm:text-[11px] font-bold uppercase transition flex items-center gap-1"
                >
                  <span>Admin</span>
                  {pendingCount > 0 && <span className="tag bg-hot text-white !text-[9px] !px-1 !py-0">{pendingCount}</span>}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={openAuth}
                  className="bg-transparent border-2 border-ink/15 text-ink/45 hover:border-ink/50 hover:text-ink rounded-lg px-2 py-0.5 font-mono text-[10px] sm:text-[11px] font-bold uppercase transition"
                >
                  Admin
                </button>
              )}
            </div>
          </div>
        </div>

        {vis('missions') && <div className={dim('missions')}>{hiddenTag('missions')}<MissionsSection /></div>}

        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {vis('ranking') && (
            <div className={`lg:col-span-5 lg:relative lg:min-h-[18rem] ${dim('ranking')}`}>
              <div className="box overflow-hidden flex flex-col lg:absolute lg:inset-0">
                <div className="bg-sun border-b-[3px] border-ink px-4 py-2.5 font-mono font-bold uppercase flex items-center justify-between gap-2 shrink-0">
                  <span>Ranking</span>
                  <span className="font-mono text-[11px] lg:hidden">Top 5</span>
                </div>
                <div className="divide-y-[3px] divide-ink flex-1 overflow-y-auto">
                  {users.map((p, i) => (
                    <div
                      key={p.id}
                      className={`p-3 items-center justify-between gap-2 ${i >= 5 ? 'hidden lg:flex' : 'flex'} ${p.id === accountId ? 'bg-sun/35' : 'hover:bg-paper/60 transition-colors'}`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <b className="truncate">#{String(i + 1).padStart(2, '0')} {p.name}</b>
                          {p.id === accountId && <span className="font-mono text-[10px] font-bold uppercase text-cobalt shrink-0">· You</span>}
                          <RattieBadge event={p.lastRattieEvent} />
                        </div>
                        <div className="font-mono text-[11px] text-mute">{countryOf(p)}</div>
                      </div>
                      <b className="font-mono tabular-nums whitespace-nowrap shrink-0">{(p.score ?? 0).toLocaleString('en-US')} PTS<PointsDelta change={lastChange[p.id]} /></b>
                    </div>
                  ))}
                  {users.length === 0 && <p className="p-3 font-mono text-sm">No participants yet.</p>}
                </div>
                <div className="bg-paper border-t-[3px] border-ink p-3 shrink-0">
                  <Link to="/leaderboard" className="btn bg-sun w-full text-xs">View full leaderboard [{users.length}] →</Link>
                </div>
              </div>
            </div>
          )}

          <div className={`${vis('ranking') ? 'lg:col-span-7' : 'lg:col-span-12 lg:grid-cols-3'} grid grid-cols-2 gap-3 sm:gap-4`}>
            {cards.map((n) => (
              <div key={n.to} className={`group border-[3px] border-ink p-3.5 sm:p-5 rounded-2xl shadow-b6 hover:-translate-y-0.5 hover:shadow-b8 transition-all flex flex-col justify-between gap-3 sm:gap-4 min-w-0 ${n.cls} ${dim(n.id)}`}>
                <div className="flex items-start justify-between gap-1.5 sm:gap-3 min-w-0">
                  <div className="min-w-0 flex-1">
                    {hiddenTag(n.id)}
                    <h3 className="text-base sm:text-2xl font-extrabold uppercase leading-tight tracking-tight break-words">{n.title}</h3>
                    <p className="hidden sm:block text-sm mt-2 font-medium leading-snug opacity-90">{n.text}</p>
                  </div>
                  <CardMouse frames={n.frames} anim={n.anim} speed={n.speed} />
                </div>
                {n.href ? (
                  <a href={n.href} target="_blank" rel="noopener noreferrer" className={`btn !px-3 !py-2 sm:!px-4 sm:!py-2 text-[11px] sm:text-xs font-bold leading-tight justify-between sm:justify-center w-full sm:w-auto sm:self-start ${n.btn}`}>
                    <span className="sm:hidden">{n.cta}</span>
                    <span className="hidden sm:inline">{n.ctaDesktop}</span>
                    <span aria-hidden="true">→</span>
                  </a>
                ) : (
                  <Link to={n.to} className={`btn !px-3 !py-2 sm:!px-4 sm:!py-2 text-[11px] sm:text-xs font-bold leading-tight justify-between sm:justify-center w-full sm:w-auto sm:self-start ${n.btn}`}>
                    <span className="sm:hidden">{n.cta}</span>
                    <span className="hidden sm:inline">{n.ctaDesktop}</span>
                    <span aria-hidden="true">→</span>
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
      <Marquee className="bg-neon text-ink" items={HOME_MARQUEE_BOTTOM} />
    </>
  );
}
