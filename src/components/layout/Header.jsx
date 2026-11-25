import { useState } from 'react';
import { Link } from 'react-router-dom';
import RoleSwitcher from './RoleSwitcher.jsx';
import ModalShell from '../modals/ModalShell.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { MEDIA_UPLOAD_URL } from '../../config/settings.js';

const UploadArrow = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 16V4" />
    <path d="m7 9 5-5 5 5" />
    <path d="M4 20h16" />
  </svg>
);

export default function Header({ back }) {
  const { isAdmin, profile, openAccount, pendingCount, homeHidden } = useApp();
  const [mediaNotice, setMediaNotice] = useState(false);
  const showAsk = isAdmin || !homeHidden?.ask;
  const smBtn = 'btn text-xs sm:text-sm px-2.5 py-1.5 sm:px-4 sm:py-2';
  const topChip = 'btn text-[11px] sm:text-xs px-2.5 py-1 sm:px-3 sm:py-1.5';

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 mb-6 sm:mb-8">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {back && <Link to="/" className={`${smBtn} bg-white`}>← Home</Link>}
          <Link to="/leaderboard" className={`${smBtn} bg-cobalt text-white`}>Leaderboard</Link>
          {showAsk && (
            <Link to="/ask" className={`${topChip} bg-hot text-white`}>
              Ask the Team
            </Link>
          )}
          {MEDIA_UPLOAD_URL ? (
            <a
              href={MEDIA_UPLOAD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`${topChip} bg-neon text-ink`}
            >
              <UploadArrow />
              <span>Photo &amp; Video</span>
            </a>
          ) : (
            <button
              type="button"
              onClick={() => setMediaNotice(true)}
              className={`${topChip} bg-neon text-ink`}
            >
              <UploadArrow />
              <span>Photo &amp; Video</span>
            </button>
          )}
          {isAdmin && (
            <Link to="/admin" className={`${smBtn} bg-sun`}>
              Admin panel{pendingCount > 0 && <span className="tag bg-hot text-white">{pendingCount}</span>}
            </Link>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {profile ? (
            <button onClick={() => openAccount(null)} title="My account"
              className="border-[3px] border-ink bg-white rounded-xl px-2.5 py-1 sm:px-3 sm:py-1.5 shadow-b4 font-mono text-xs sm:text-sm font-bold hover:shadow-b6">
              👤 {profile.name} · {(profile.score ?? 0).toLocaleString('en-US')} PTS
            </button>
          ) : (
            <button className={`${smBtn} bg-neon`} onClick={() => openAccount(null)}>Sign in / Register</button>
          )}
          <RoleSwitcher />
        </div>
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
