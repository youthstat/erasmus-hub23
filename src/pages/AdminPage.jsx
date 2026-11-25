import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import Header from '../components/layout/Header.jsx';
import MissionsSection from '../components/missions/MissionsSection.jsx';
import SubmissionsPanel from '../components/admin/SubmissionsPanel.jsx';
import GossipsPanel from '../components/admin/GossipsPanel.jsx';
import HelpAdminPanel from '../components/admin/HelpAdminPanel.jsx';
import OscarAdminPanel from '../components/admin/OscarAdminPanel.jsx';
import ManualPoints from '../components/admin/ManualPoints.jsx';
import GamesAdminPanel from '../components/admin/GamesAdminPanel.jsx';
import PunishmentAdminPanel from '../components/admin/PunishmentAdminPanel.jsx';
import HomeControlPanel from '../components/admin/HomeControlPanel.jsx';
import HeistAdminPanel from '../components/admin/HeistAdminPanel.jsx';
import Game2048AdminPanel from '../components/admin/Game2048AdminPanel.jsx';
import AdminBlock from '../components/admin/AdminBlock.jsx';
import LeaderboardTable from '../components/leaderboard/LeaderboardTable.jsx';
import { useApp } from '../context/AppContext.jsx';

const KEY = 'adminHidden';
const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };

export default function AdminPage() {
  const { isAdmin, logoutAdmin, allMissions, seedMissions, users, stealRequests } = useApp();
  const [hidden, setHidden] = useState(load);       // { blockId: true }  remembered in this browser
  const [full, setFull] = useState(null);           // id of the block shown in the full window
  const pendingSteals = stealRequests.filter((r) => r.status === 'pending');

  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(hidden)); } catch { /* ignore */ } }, [hidden]);
  useEffect(() => {
    if (!full) return undefined;
    const esc = (e) => e.key === 'Escape' && setFull(null);
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [full]);

  if (!isAdmin) return <Navigate to="/" replace />;

  const BLOCKS = [
    { id: 'heists', title: `Rattie Patty: heists & steal requests${pendingSteals.length ? ` (${pendingSteals.length})` : ''}`, node: <HeistAdminPanel /> },
    { id: 'home', title: 'Home screen: what participants see', node: <HomeControlPanel /> },
    { id: 'submissions', title: 'Mission submissions', node: <SubmissionsPanel /> },
    { id: 'help', title: 'Ask the Team', node: <HelpAdminPanel /> },
    { id: 'oscar', title: 'Oscar Night', node: <OscarAdminPanel /> },
    { id: 'gossips', title: 'Gossips & Gossip board', node: <GossipsPanel /> },
    { id: 'punishment', title: 'Punishment box', node: <PunishmentAdminPanel /> },
    { id: 'points', title: 'Manual points', node: <ManualPoints /> },
    { id: 'missions', title: 'Missions', node: <>
        <MissionsSection />
        {allMissions.length === 0 && <button className="btn bg-white self-start" onClick={seedMissions}>Load demo missions</button>}
      </> },
    { id: 'games', title: 'Games: who plays, links, contracts', node: <GamesAdminPanel /> },
    { id: 'game2048', title: 'Rattie 2048: Top 3 & prizes', node: <Game2048AdminPanel /> },
    { id: 'leaderboard', title: 'Participants & leaderboard', node: <LeaderboardTable /> },
  ];
  const toggle = (id) => setHidden((h) => ({ ...h, [id]: !h[id] }));
  const allHidden = BLOCKS.every((b) => hidden[b.id]);
  const setAll = (v) => setHidden(Object.fromEntries(BLOCKS.map((b) => [b.id, v])));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
      <Header back />
      <div className="box shadow-b8 p-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl sm:text-3xl font-extrabold uppercase">Admin panel</h1>
        <div className="flex flex-wrap gap-2 font-mono text-sm font-bold">
          <span className="tag bg-sun">{users.length} participants</span>
          <span className="tag bg-neon">{allMissions.length} missions</span>
          {pendingSteals.length > 0 && <span className="tag bg-hot text-white">🕵️ {pendingSteals.length} steal requests</span>}
          <button className="tag bg-white" onClick={() => setAll(!allHidden)}>{allHidden ? 'SHOW ALL' : 'HIDE ALL'}</button>
          <button className="tag bg-hot text-white" onClick={logoutAdmin}>Exit admin</button>
        </div>
      </div>

      {pendingSteals.length > 0 && (
        <div className="border-[3px] border-ink rounded-xl bg-hot text-white shadow-b6 p-4 flex flex-col gap-2">
          <div className="font-mono text-xs font-bold uppercase">🕵️ Active steal requests ({pendingSteals.length}) — review below</div>
          <div className="flex flex-wrap gap-2">
            {pendingSteals.map((r) => (
              <span key={r.id} className="border-2 border-ink bg-white text-ink rounded-lg px-3 py-1 font-mono text-xs font-bold">
                <b>{r.thiefName}</b> → steals <span className="text-hot">{r.amount} PTS</span> from <b>{r.victimName}</b>
              </span>
            ))}
          </div>
        </div>
      )}

      {BLOCKS.map((b) => (
        <AdminBlock key={b.id} title={b.title} hidden={!!hidden[b.id]} full={full === b.id}
          onHide={() => toggle(b.id)} onFull={() => { setFull(full === b.id ? null : b.id); if (full !== b.id) setHidden((h) => ({ ...h, [b.id]: false })); }}>
          {b.node}
        </AdminBlock>
      ))}
    </div>
  );
}
