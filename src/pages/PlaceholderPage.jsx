import { Link } from 'react-router-dom';
import Header from '../components/layout/Header.jsx';
import { SPRITES } from '../components/mascot/sprites.js';

export default function PlaceholderPage({ title }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <Header back />
      <div className="box shadow-b8 p-6 sm:p-10 flex flex-col sm:flex-row items-center gap-6">
        <img
          src={SPRITES.watch1.src}
          alt=""
          draggable={false}
          className="w-28 h-28 sm:w-32 sm:h-32 object-contain shrink-0 mascot-breathe drop-shadow-[0_3px_0_rgba(17,17,17,0.16)]"
        />
        <div className="text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-extrabold uppercase">{title}</h1>
          <p className="mt-2 text-mute font-medium">The organizers are finalizing the daily schedule — Rattie is keeping an eye on the clock and will notify everyone once it’s live!</p>
          <Link to="/" className="btn bg-sun text-xs mt-4">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
