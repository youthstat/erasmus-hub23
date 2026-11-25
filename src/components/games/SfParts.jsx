import { SF_PROFILE_FIELDS } from '../../config/settings.js';

// photo (or the first letter) in a framed square with a piece of tape, like on the dossier
export function Avatar({ photo, name, size = 'w-24 h-24' }) {
  return (
    <div className="relative shrink-0">
      <div className="absolute -top-2 left-3 w-10 h-3 bg-cobalt/70 -rotate-6 z-10" />
      <div className={`${size} border-[3px] border-ink bg-white shadow-b4 overflow-hidden flex items-center justify-center text-4xl font-extrabold uppercase`}>
        {photo ? <img src={photo} alt={name} className="w-full h-full object-cover" /> : (name || '?').trim().charAt(0)}
      </div>
    </div>
  );
}

// a window with a dark title bar (like the dossier terminal)
export function Win({ title, children, right }) {
  return (
    <div className="box shadow-b8 overflow-hidden bg-white">
      <div className="bg-ink text-white px-4 py-2 flex items-center justify-between gap-3 font-mono text-xs font-bold uppercase">
        <span className="truncate">{title}</span>{right}
      </div>
      {children}
    </div>
  );
}

export const FieldCard = ({ f, value, empty }) => (
  <div className={`border-[3px] border-ink rounded-xl shadow-b4 p-4 flex flex-col gap-2 ${f.danger ? 'bg-hot/15' : 'bg-white'}`}>
    <div className="font-mono text-xs font-bold uppercase flex items-center gap-2"><span aria-hidden="true">{f.icon}</span>{f.title}</div>
    {value ? <p className="font-medium whitespace-pre-line break-words">{value}</p> : <p className="font-medium text-mute italic">{empty}</p>}
  </div>
);

export { SF_PROFILE_FIELDS };
