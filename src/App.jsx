import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage.jsx';
import LeaderboardPage from './pages/LeaderboardPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import PlaceholderPage from './pages/PlaceholderPage.jsx';
import SecretFriendPage from './pages/SecretFriendPage.jsx';
import KillerGamePage from './pages/KillerGamePage.jsx';
import ReflectionPage from './pages/ReflectionPage.jsx';
import OscarPage from './pages/OscarPage.jsx';
import OscarVotePage from './pages/OscarVotePage.jsx';
import HelpPage from './pages/HelpPage.jsx';
import GossipBoardPage from './pages/GossipBoardPage.jsx';
import PunishmentPage from './pages/PunishmentPage.jsx';
import MouseRunPage from './pages/MouseRunPage.jsx';
import SfBuddyPage from './pages/SfBuddyPage.jsx';
import SfProfilePage from './pages/SfProfilePage.jsx';
import Footer from './components/layout/Footer.jsx';
import CopyrightPage from './pages/CopyrightPage.jsx';
import Gate from './components/layout/Gate.jsx';
import Mascot from './components/mascot/Mascot.jsx';
import PointNoticePopup from './components/mascot/PointNoticePopup.jsx';
import ModalHost from './components/modals/ModalHost.jsx';
import { useApp } from './context/AppContext.jsx';
import { SPRITES } from './components/mascot/sprites.js';

export default function App() {
  const { firebaseConfigured, uid, error, setError } = useApp();

  if (!firebaseConfigured) {
    return (
      <div className="max-w-xl mx-auto p-6 mt-10 box">
        <h1 className="text-2xl font-extrabold uppercase">Firebase is not configured</h1>
        <p className="mt-2">Copy <code>.env.example</code> to <code>.env</code>, fill in your Firebase keys and restart <code>npm run dev</code>. See README.</p>
      </div>
    );
  }
  if (!uid) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full p-6 box shadow-b8 text-center flex flex-col items-center gap-3">
          <img src={SPRITES.watch1.src} alt="" draggable={false} className="w-20 h-20 object-contain mascot-breathe" />
          <h1 className="text-2xl font-extrabold uppercase">{error ? 'Cannot connect to database' : 'Connecting…'}</h1>
          {!error && <p className="font-mono text-xs text-mute">Waking up Rattie Patty &amp; loading Erasmus+ Hub…</p>}
          {error && (
            <>
              <p className="mt-1 font-mono text-sm text-hot break-words">{error}</p>
              <p className="mt-1 text-sm text-left">
                Check that: (1) <b>Authentication → Sign-in method → Anonymous</b> is enabled in the Firebase Console;
                (2) you are online; (3) the site domain is listed in <b>Authentication → Settings → Authorized domains</b>.
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col overflow-x-clip">
      {error && (
        <div className="bg-hot text-white font-mono text-sm p-3 flex justify-between gap-4">
          <span>Database error: {error}</span><button onClick={() => setError('')}>✕</button>
        </div>
      )}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/copyright" element={<CopyrightPage />} />
          <Route path="/schedule" element={<Gate id="schedule"><PlaceholderPage title="Schedule & timeline" /></Gate>} />
          <Route path="/secret-friend" element={<Gate id="secret-friend"><SecretFriendPage /></Gate>} />
          <Route path="/secret-friend/buddy" element={<Gate id="secret-friend"><SfBuddyPage /></Gate>} />
          <Route path="/secret-friend/my-profile" element={<Gate id="secret-friend"><SfProfilePage /></Gate>} />
          <Route path="/killer-game" element={<Gate id="killer-game"><KillerGamePage /></Gate>} />
          <Route path="/reflection" element={<Gate id="reflection"><ReflectionPage /></Gate>} />
          <Route path="/oscar" element={<Gate id="oscar"><OscarPage /></Gate>} />
          <Route path="/oscar/vote" element={<Gate id="oscar"><OscarVotePage /></Gate>} />
          <Route path="/ask" element={<Gate id="ask"><HelpPage /></Gate>} />
          <Route path="/punishment" element={<Gate id="punishment"><PunishmentPage /></Gate>} />
          <Route path="/mouse-run" element={<Gate id="mouse-run"><MouseRunPage /></Gate>} />
          <Route path="/gossips" element={<Gate id="gossips"><GossipBoardPage /></Gate>} />
        </Routes>
      </main>
      <Footer />
      <ModalHost />
      <PointNoticePopup />
      <Mascot />
    </div>
  );
}
