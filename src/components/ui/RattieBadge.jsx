// Shown next to a participant's name when they received a secret gift or were robbed via Rattie Patty.
// Never reveals who sent the gift or committed the heist.
export default function RattieBadge({ event }) {
  if (!event || !event.amount) return null;
  const sec = event.at?.seconds;
  if (sec && Date.now() / 1000 - sec > 86400) return null;
  const gift = event.kind === 'gift';
  return (
    <span
      title={gift ? 'Received an anonymous gift!' : 'Robbed by someone via Rattie Patty!'}
      className={`tag ml-1.5 align-middle text-[10px] ${gift ? 'bg-neon text-ink' : 'bg-hot text-white'}`}
    >
      {gift ? `🎁 +${event.amount} GIFTED` : `🕵️ −${event.amount} ROBBED`}
    </span>
  );
}
