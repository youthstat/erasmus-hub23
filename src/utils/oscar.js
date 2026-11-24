import { OSCAR_QUESTIONS } from '../config/settings.js';

export const TARGETS = [
  { id: 'person', label: 'A person (nominated crew members)' },
  { id: 'film', label: 'A film (crew)' },
  { id: 'text', label: 'Free text' },
];

export const withDefaults = (cfg) => ({
  status: cfg?.status || 'draft',
  intake: cfg?.intake === 'closed' ? 'closed' : 'open',
  expectedTeams: Number(cfg?.expectedTeams) || 0,
  questions: cfg?.questions?.length ? cfg.questions : OSCAR_QUESTIONS,
});

/* Nominations of a crew for one question can be stored in two shapes: a list of people, or true (the whole film/crew).
   The admin can change the type of a question after crews have already sent their nominations, so both shapes
   must be understood in both kinds of question:
   - person question: a list is used as it is; true = the whole cast
   - film question:   true, or any non-empty list = the crew is a candidate */
export const nominatedPeople = (t, q) => {
  const v = t.nominations?.[q.id];
  if (Array.isArray(v)) return v.filter((u) => t.memberIds?.includes(u));
  return v === true ? [...(t.memberIds || [])] : [];
};
export const nominatedFilm = (t, q) => {
  const v = t.nominations?.[q.id];
  return v === true || (Array.isArray(v) && nominatedPeople(t, q).length > 0);
};

// candidates of one question: only crews that have sent their nominations to the voting
export function optionsFor(q, teams, nameOf) {
  const sent = teams.filter((t) => t.nominated);
  if (q.target === 'person') {
    return sent.flatMap((t) => nominatedPeople(t, q)
      .map((u) => ({ id: `${t.id}|${u}`, label: nameOf(u), sub: t.title, film: t.title, cover: t.cover || '' })));
  }
  if (q.target === 'film') {
    return sent.filter((t) => nominatedFilm(t, q))
      .map((t) => ({ id: t.id, label: t.title, sub: `Director: ${nameOf(t.directorId)}`, film: t.title, cover: t.cover || '' }));
  }
  return [];
}

export const ballotQuestions = (questions, teams, nameOf) =>
  questions.map((q) => ({ q, options: optionsFor(q, teams, nameOf) })).filter(({ q, options }) => q.target === 'text' || options.length > 0);

// results: percentages per question
export function tally(questions, teams, votes, nameOf) {
  return questions.map((q) => {
    if (q.target === 'text') {
      const texts = votes.map((v) => String(v.answers?.[q.id] || '').trim()).filter(Boolean);
      return { q, total: texts.length, rows: [], texts };
    }
    const options = optionsFor(q, teams, nameOf);
    const counts = new Map();
    votes.forEach((v) => { const a = v.answers?.[q.id]; if (a) counts.set(a, (counts.get(a) || 0) + 1); });
    const total = [...counts.values()].reduce((a, b) => a + b, 0);
    const known = new Map(options.map((o) => [o.id, o]));
    for (const id of counts.keys()) if (!known.has(id)) {            // a crew was removed after the vote
      const [tid, uid] = id.split('|'); const t = teams.find((x) => x.id === tid);
      known.set(id, { id, label: uid ? nameOf(uid) : (t?.title || 'Removed film'), sub: t?.title || '' });
    }
    const rows = [...known.values()].map((o) => ({ ...o, count: counts.get(o.id) || 0, pct: total ? Math.round(((counts.get(o.id) || 0) / total) * 1000) / 10 : 0 }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
    return { q, total, rows, texts: [] };
  });
}
