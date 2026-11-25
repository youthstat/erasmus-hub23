import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import ModalShell from '../modals/ModalShell.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { MEDIA_UPLOAD_URL } from '../../config/settings.js';

const UploadArrow = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 16V4" />
    <path d="m7 9 5-5 5 5" />
    <path d="M4 20h16" />
  </svg>
);

const PAGE_TITLES = [
  ['/secret-friend/my-profile', 'My profile'],
  ['/secret-friend/buddy', 'My buddy'],
  ['/secret-friend', 'Secret friend'],
  ['/killer-game', 'Killer game'],
  ['/oscar/vote', 'Oscar Vote'],
  ['/oscar', 'Oscar Night'],
  ['/punishment', 'Punishment box'],
  ['/mouse-run', 'Rattie 2048'],
  ['/gossips', 'Gossip board'],
  ['/leaderboard', 'Leaderboard'],
  ['/schedule', 'Schedule'],
  ['/reflection', 'Reflection'],
  ['/ask', 'Help'],
  ['/admin', 'Admin panel'],
  ['/copyright', 'Copyright'],
];

const titleForPath = (pathname) => PAGE_TITLES.find(([p]) => pathname.startsWith(p))?.[1] || '';

export default function Header({ back, title }) {
  const { isAdmin, profile, openAccount, homeHidden } = useApp();
  const { pathname } = useLocation();
  const [mediaNotice, setMediaNotice] = useState(false);
  const showAsk = isAdmin || !homeHidden?.ask;
  const pageTitle = title || titleForPath(pathname);

  const chipCls = 'btn !px-2 sm:!px-3 !py-1.5 text-[11px] sm:text-xs shrink-0 whitespace-nowrap';

  return (
    <>
      <header className="flex flex-nowrap items-center justify-between gap-1.5 sm:gap-3 mb-5 sm:mb-7 min-w-0">
        {back ? (
          <>
            {/* Subpages: Back + Page title on left; Help, Photo & Video, Profile on right */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 flex-1">
              <Link to="/" aria-label="Back to Home" className={`${chipCls} bg-white`}>
                <span>←</span>
                <span className="hidden sm:inline">Home</span>
              </Link>
              {pageTitle && (
                <span className="font-mono font-extrabold uppercase text-xs sm:text-sm truncate min-w-0">
                  {pageTitle}
                </span>
              )}
            </div>
            <div className="flex flex-nowrap items-center gap-1.5 sm:gap-2 shrink-0">
              {showAsk && (
                <Link to="/ask" className={`${chipCls} bg-hot text-white`}>
                  Help
                </Link>
              )}
              {MEDIA_UPLOAD_URL ? (
                <a
                  href={MEDIA_UPLOAD_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Photo & Video"
                  title="Photo & Video"
                  className={`${chipCls} bg-neon text-ink`}
                >
                  <UploadArrow />
                  <span className="hidden sm:inline">Photo &amp; Video</span>
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => setMediaNotice(true)}
                  aria-label="Photo & Video"
                  title="Photo & Video"
                  className={`${chipCls} bg-neon text-ink`}
                >
                  <UploadArrow />
                  <span className="hidden sm:inline">Photo &amp; Video</span>
                </button>
              )}
              {profile ? (
                <button
                  onClick={() => openAccount(null)}
                  title={`${profile.name} · ${(profile.score ?? 0).toLocaleString('en-US')} PTS`}
                  className="border-[3px] border-ink bg-white rounded-xl px-2 sm:px-3 py-1.5 shadow-b4 font-mono text-[11px] sm:text-xs font-bold hover:shadow-b6 flex items-center gap-1 max-w-[104px] sm:max-w-[200px] min-w-0"
                >
                  <span className="shrink-0">👤</span>
                  <span className="truncate">{profile.name}</span>
                  <span className="hidden sm:inline shrink-0 text-mute">· {(profile.score ?? 0).toLocaleString('en-US')}</span>
                </button>
              ) : (
                <button className={`${chipCls} bg-sun text-ink`} onClick={() => openAccount(null)}>
                  <span>Sign in</span>
                  <span className="hidden sm:inline">/ Register</span>
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Home page: Home label on wider screens + Help + Photo & Video on left; Profile / Sign in on right */}
            <div className="flex flex-nowrap items-center gap-1.5 sm:gap-2.5 shrink-0">
              <span className="hidden sm:inline-flex items-center border-[3px] border-ink bg-cobalt text-white rounded-xl px-3 py-1.5 shadow-b4 font-mono font-extrabold uppercase text-xs shrink-0">
                Home
              </span>
              {showAsk && (
                <Link to="/ask" className={`${chipCls} bg-hot text-white`}>
                  Help
                </Link>
              )}
              {MEDIA_UPLOAD_URL ? (
                <a
                  href={MEDIA_UPLOAD_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Photo & Video"
                  title="Photo & Video"
                  className={`${chipCls} bg-neon text-ink`}
                >
                  <UploadArrow />
                  <span className="hidden sm:inline">Photo &amp; Video</span>
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => setMediaNotice(true)}
                  aria-label="Photo & Video"
                  title="Photo & Video"
                  className={`${chipCls} bg-neon text-ink`}
                >
                  <UploadArrow />
                  <span className="hidden sm:inline">Photo &amp; Video</span>
                </button>
              )}
            </div>
            <div className="flex flex-nowrap items-center gap-1.5 sm:gap-2 min-w-0">
              {profile ? (
                <button
                  onClick={() => openAccount(null)}
                  title={`${profile.name} · ${(profile.score ?? 0).toLocaleString('en-US')} PTS`}
                  className="border-[3px] border-ink bg-white rounded-xl px-2.5 sm:px-3 py-1.5 shadow-b4 font-mono text-[11px] sm:text-xs font-bold hover:shadow-b6 flex items-center gap-1 max-w-[165px] sm:max-w-[240px] min-w-0"
                >
                  <span className="shrink-0">👤</span>
                  <span className="truncate">{profile.name}</span>
                  <span className="shrink-0 text-mute">· {(profile.score ?? 0).toLocaleString('en-US')}</span>
                </button>
              ) : (
                <button className={`${chipCls} bg-sun text-ink`} onClick={() => openAccount(null)}>
                  <span>Sign in</span>
                  <span className="hidden sm:inline">/ Register</span>
                </button>
              )}
            </div>
          </>
        )}
      </header>

      {mediaNotice && (
        <ModalShell title="Photo & Video Upload" maxW="max-w-md" onClose={() => setMediaNotice(false)}>
          <div className="flex flex-col gap-3 text-center items-center">
            <div className="w-12 h-12 rounded-xl border-[3px] border-ink bg-neon flex items-center justify-center shadow-b4">
              <UploadArrow />
            </div>
            <h3 className="text-xl font-extrabold uppercase">Shared folder coming soon!</h3>
            <p className="text-sm font-medium">
              The organizers will add the shared folder link here soon so everyone can upload their photos and videos from the exchange.
            </p>
            <button type="button" className="btn bg-sun text-xs" onClick={() => setMediaNotice(false)}>Got it</button>
          </div>
        </ModalShell>
      )}
    </>
  );
}
