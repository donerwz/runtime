// Date helpers for the dashboard.
//
// Note: we deliberately build calendar dates from local getFullYear/getMonth/
// getDate rather than toISOString(). toISOString() converts to UTC, which shifts
// the calendar day for anyone west of Greenwich and silently queries the wrong
// range. Backend dates are plain YYYY-MM-DD calendar strings, so treat them as
// strings end to end and only construct a Date when a weekday is needed.

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Parse YYYY-MM-DD into a local Date (never use new Date(string)). */
export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function addDays(iso: string, days: number): string {
  const d = fromISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

/** Inclusive range of calendar dates, ascending. */
export function dateRange(fromISO: string, toISODateStr: string): string[] {
  const out: string[] = [];
  let cur = fromISO;
  // Guard against a reversed or runaway range.
  for (let i = 0; i < 400 && cur <= toISODateStr; i++) {
    out.push(cur);
    cur = addDays(cur, 1);
  }
  return out;
}

/** The last n calendar days ending today, ascending. */
export function lastNDays(n: number, endISO: string = todayISO()): string[] {
  return dateRange(addDays(endISO, -(n - 1)), endISO);
}

/** Monday of the week containing the given date. */
export function mondayOf(iso: string): string {
  const d = fromISODate(iso);
  const offset = (d.getDay() + 6) % 7; // Sunday=0 -> 6
  d.setDate(d.getDate() - offset);
  return toISODate(d);
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function weekdayShort(iso: string): string {
  const js = fromISODate(iso).getDay(); // Sunday=0
  return WEEKDAYS[(js + 6) % 7];
}

export function fmtShortDate(iso: string): string {
  return fromISODate(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

export function fmtLongDate(iso: string): string {
  return fromISODate(iso).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** 142 -> "2h 22m", 45 -> "45m", null -> "—" */
export function fmtMinutes(min: number | null | undefined): string {
  if (min === null || min === undefined) return '—';
  if (min <= 0) return '0m';
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}