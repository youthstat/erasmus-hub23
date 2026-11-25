import { useApp } from '../../context/AppContext.jsx';
import { SPRITES } from './sprites.js';

export default function PointNoticePopup() {
  const { myNotices, dismissNotice } = useApp();
  if (!myNotices || myNotices.length === 0) return null;
  const notice = myNotices[0];
  const gift = notice.kind === 'gift';
  const sp = SPRITES[gift ? 'gift3' : 'thief2'];

  return (
    <div role="alertdialog" aria-modal="true" className="fixed inset-0 z-[70] bg-ink/75 flex items-center justify-center p-4">
      <div className={`mascot-pop max-w-md w-full border-4 border-ink rounded-2xl shadow-b8 p-6 text-center flex flex-col items-center gap-3 ${gift ? 'bg-neon text-ink' : 'bg-hot text-white'}`}>
        <img src={sp.src} alt="" draggable={false} className="w-24 h-24 object-contain drop-shadow" />
        <div className="tag bg-white text-ink">{gift ? 'Secret gift' : 'Heist alert'}</div>
        <h2 className="text-3xl font-extrabold uppercase leading-tight">
          {gift ? '🎁 You received a gift!' : '🕵️ You were robbed!'}
        </h2>
        <div className={`text-4xl font-extrabold font-mono px-4 py-1.5 border-[3px] border-ink rounded-xl shadow-b4 ${gift ? 'bg-sun text-ink' : 'bg-ink text-white'}`}>
          {gift ? `+${notice.amount} PTS` : `−${notice.amount} PTS`}
        </div>
        <p className="text-sm font-bold leading-snug">
          {gift
            ? 'Someone secretly sent you points from their own stash via Rattie Patty! Who was it? My lips are sealed like a cheese vault! 🧀'
            : 'Someone hired Rattie Patty to snatch points from your balance! Who did it? Rattie Patty never snitches! 🐭💨'}
        </p>
        <button className="btn bg-white text-ink mt-2" onClick={() => dismissNotice(notice.id)}>
          {gift ? 'Awesome, thanks!' : 'Got it!'} ✕
        </button>
        {myNotices.length > 1 && (
          <span className="font-mono text-xs opacity-80">1 of {myNotices.length} alerts</span>
        )}
      </div>
    </div>
  );
}
