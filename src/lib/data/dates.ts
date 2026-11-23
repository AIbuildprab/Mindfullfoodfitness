// Local-date helpers. Days are stored as plain `date` values (YYYY-MM-DD) in the user's own timezone.

export const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const today = () => iso(new Date());

const parse = (s: string) => new Date(`${s}T12:00:00`);

export function addDays(s: string, n: number) {
  const d = parse(s);
  d.setDate(d.getDate() + n);
  return iso(d);
}

/** Monday of the week containing `s`. */
export function weekStart(s: string) {
  const d = parse(s);
  const back = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - back);
  return iso(d);
}

export function weekDays(s: string) {
  const start = weekStart(s);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export const dayShort = (s: string) => parse(s).toLocaleDateString("en-GB", { weekday: "short" });
export const dayNum = (s: string) => parse(s).getDate();
export const dayLong = (s: string) => parse(s).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
export const timeOf = (ts: string) => new Date(ts).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
export const dateOf = (ts: string) => new Date(ts).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
export const sameDay = (ts: string, s: string) => iso(new Date(ts)) === s;

export function ago(ts: string) {
  const mins = Math.round((Date.now() - new Date(ts).getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} h ago`;
  const days = Math.round(hrs / 24);
  return days === 1 ? "Yesterday" : `${days} days ago`;
}

export function weeksSince(s: string) {
  return Math.max(1, Math.floor((Date.now() - parse(s).getTime()) / (7 * 86400000)) + 1);
}
