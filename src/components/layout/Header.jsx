import { Link } from 'react-router-dom';
import RoleSwitcher from './RoleSwitcher.jsx';
import { useApp } from '../../context/AppContext.jsx';

export default function Header({ back }) {
  const { isAdmin, profile, openAccount, pendingCount, homeHidden } = useApp();
  const showAsk = isAdmin || !homeHidden?.ask;
  const smBtn = 'btn text-xs sm:text-sm px-2.5 py-1.5 sm:px-4 sm:py-2';

  return (
    <header className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 mb-6 sm:mb-8">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {back && <Link to="/" className={`${smBtn} bg-white`}>← Home</Link>}
        <Link to="/leaderboard" className={`${smBtn} bg-cobalt text-white`}>Leaderboard</Link>
        {showAsk && (
          <Link to="/ask" className="btn bg-hot text-white text-[11px] sm:text-xs px-2.5 py-1 sm:px-3 sm:py-1.5">
            Ask the Team
          </Link>
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
  );
}
