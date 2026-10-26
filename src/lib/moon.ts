// Moon lookups over the engine calendar (src/data/moon.json, UTC). Used at build time and in the browser.
export type Ingress = { utc: string; enters: string };
export type Phase = { kind: string; utc: string; sign: string; degree: number; perigee_pct?: number };
export type MoonData = { phases: Phase[]; eclipses: any[]; ingresses: Ingress[] };

export const SIGNS = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];
export const SIGN_GLYPH: Record<string, string> = { aries: '♈︎', taurus: '♉︎', gemini: '♊︎', cancer: '♋︎', leo: '♌︎', virgo: '♍︎', libra: '♎︎', scorpio: '♏︎', sagittarius: '♐︎', capricorn: '♑︎', aquarius: '♒︎', pisces: '♓︎' };
export const PHASE_IMG: Record<string, string> = {
  new_moon: 'moon-new', waxing_crescent: 'moon-waxing-crescent', first_quarter: 'moon-first-quarter', waxing_gibbous: 'moon-waxing-gibbous',
  full_moon: 'moon-full', waning_gibbous: 'moon-waning-gibbous', last_quarter: 'moon-last-quarter', waning_crescent: 'moon-waning-crescent',
};
const AFTER: Record<string, string> = { new_moon: 'waxing_crescent', first_quarter: 'waxing_gibbous', full_moon: 'waning_gibbous', last_quarter: 'waning_crescent' };
const t = (s: string) => Date.parse(s.replace('Z', ':00Z'));
const DAY = 864e5;

export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function signAt(d: MoonData, now = Date.now()) {
  let i = d.ingresses.findIndex((x) => t(x.utc) > now);
  if (i <= 0) i = d.ingresses.length;
  const cur = d.ingresses[i - 1];
  const next = d.ingresses[i];
  return { sign: cur.enters, since: t(cur.utc), until: next ? t(next.utc) : null };
}

// The four engine phases are moments; within a day of one we call the night by it, otherwise by the phase in between.
export function phaseAt(d: MoonData, now = Date.now()) {
  const i = d.phases.findIndex((p) => t(p.utc) > now);
  const prev = d.phases[Math.max(0, i - 1)];
  const next = d.phases[i] ?? prev;
  if (Math.abs(t(next.utc) - now) < DAY) return { kind: next.kind, event: next };
  if (Math.abs(now - t(prev.utc)) < DAY) return { kind: prev.kind, event: prev };
  return { kind: AFTER[prev.kind], event: next };
}

// Whole-sign house counted from the Sun sign (what the app shows before a birth time is added).
export const houseFrom = (moonSign: string, sunSign: string) => ((SIGNS.indexOf(moonSign) - SIGNS.indexOf(sunSign) + 12) % 12) + 1;

export function visitsOf(d: MoonData, sign: string, from = Date.now(), n = 4) {
  const out: { start: number; end: number }[] = [];
  d.ingresses.forEach((x, i) => {
    const end = d.ingresses[i + 1] ? t(d.ingresses[i + 1].utc) : t(x.utc) + 2.5 * DAY;
    if (x.enters === sign && end > from && out.length < n) out.push({ start: t(x.utc), end });
  });
  return out;
}

export const lunationsIn = (d: MoonData, sign: string, from = Date.now()) =>
  d.phases.filter((p) => p.sign === sign && (p.kind === 'new_moon' || p.kind === 'full_moon') && t(p.utc) > from).slice(0, 4);

export const fmtDate = (ms: number) => new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
export const utcOf = t;

// Share of the synodic month since the last new moon (0 new, .5 full), for the light renderer's data-phase.
export function cycleAt(d: MoonData, now = Date.now()) {
  const nm = d.phases.filter((p) => p.kind === 'new_moon').map((p) => t(p.utc));
  const i = nm.findIndex((x) => x > now);
  if (i <= 0) return 0;
  return (now - nm[i - 1]) / (nm[i] - nm[i - 1]);
}
