import { addDays, startOfDay, toDateInputValue } from '@/lib/date';

export type QuickAddParse = {
  /** Title with the recognised date phrase stripped. */
  title: string;
  /** "YYYY-MM-DD" or "" when nothing was recognised. */
  dueDate: string;
  /** "HH:mm" or "". */
  dueTime: string;
  /** The exact text that was consumed, for the live hint. */
  matched: string;
};

const WEEKDAYS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const;

/** Next occurrence of the given weekday strictly after today. */
function nextWeekday(now: Date, targetDow: number): Date {
  const today = startOfDay(now);
  let delta = (targetDow - today.getDay() + 7) % 7;
  if (delta === 0) delta = 7;
  return addDays(today, delta);
}

function parseTimeToken(token: string): string | null {
  // 24-hour "9:30" / "09:30" / "17:00"
  const hm = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(token);
  if (hm) {
    const h = Number(hm[1]);
    return `${String(h).padStart(2, '0')}:${hm[2]}`;
  }
  // 12-hour "9am", "5pm", "9:30pm"
  const ampm = /^(1[0-2]|0?\d)(?::([0-5]\d))?(am|pm)$/i.exec(token);
  if (ampm) {
    let h = Number(ampm[1]) % 12;
    if (ampm[3].toLowerCase() === 'pm') h += 12;
    return `${String(h).padStart(2, '0')}:${ampm[2] ?? '00'}`;
  }
  return null;
}

/**
 * Recognises ONLY a trailing `today | tomorrow | <weekday>` and/or `HH:mm`
 * suffix. Anything unrecognised is left in the title untouched.
 */
export function parseQuickAdd(input: string, now: Date): QuickAddParse {
  const words = input.split(/\s+/).filter(Boolean);
  let dueTime = '';
  let dueDate = '';
  const consumed: string[] = [];

  // Walk backwards from the end, consuming at most one time and one day token.
  let cursor = words.length;
  while (cursor > 0) {
    const raw = words[cursor - 1];
    const token = raw.toLowerCase().replace(/[.,!?]$/, '');
    const at = token === 'at' || token === 'on' || token === '@';

    if (!dueTime) {
      const time = parseTimeToken(token);
      if (time) {
        dueTime = time;
        consumed.unshift(raw);
        cursor -= 1;
        continue;
      }
    }

    if (!dueDate) {
      if (token === 'today') {
        dueDate = toDateInputValue(startOfDay(now));
        consumed.unshift(raw);
        cursor -= 1;
        continue;
      }
      if (token === 'tomorrow' || token === 'tmr') {
        dueDate = toDateInputValue(addDays(startOfDay(now), 1));
        consumed.unshift(raw);
        cursor -= 1;
        continue;
      }
      const dow = WEEKDAYS.findIndex((d) => d === token || d.slice(0, 3) === token);
      if (dow >= 0) {
        dueDate = toDateInputValue(nextWeekday(now, dow));
        consumed.unshift(raw);
        cursor -= 1;
        continue;
      }
    }

    // Allow a single connector word between title and date phrase.
    if (at && consumed.length > 0) {
      consumed.unshift(raw);
      cursor -= 1;
      continue;
    }

    break;
  }

  const title = words.slice(0, cursor).join(' ').trim();

  // A time with no date means "today" (or tomorrow if that time already passed).
  if (dueTime && !dueDate) {
    const [hh, mm] = dueTime.split(':').map(Number);
    const candidate = new Date(now);
    candidate.setHours(hh, mm, 0, 0);
    dueDate = toDateInputValue(candidate < now ? addDays(candidate, 1) : candidate);
  }

  // Refuse to eat the whole input — a bare "tomorrow" is a title, not a date.
  if (!title) {
    return { title: input.trim(), dueDate: '', dueTime: '', matched: '' };
  }

  return { title, dueDate, dueTime, matched: consumed.join(' ') };
}
