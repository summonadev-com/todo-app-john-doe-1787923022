import type { Task } from '@/types/task';

/** Milliseconds in a day (local-time safe usage only via date construction). */
export const DUE_SOON_MS = 60 * 60 * 1000;

export function startOfDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

export function endOfDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(23, 59, 59, 999);
  return out;
}

export function startOfToday(now: Date): Date {
  return startOfDay(now);
}

export function endOfToday(now: Date): Date {
  return endOfDay(now);
}

export function addDays(d: Date, days: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + days);
  return out;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Parses a stored ISO string, returning null when absent or unparseable. */
export function parseDue(dueAt: string | null | undefined): Date | null {
  if (!dueAt) return null;
  const d = new Date(dueAt);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * The instant a task actually becomes late.
 * Timed tasks: the exact due moment. Date-only tasks: end of that day.
 */
export function dueDeadline(task: Task): Date | null {
  const due = parseDue(task.dueAt);
  if (!due) return null;
  return task.hasTime ? due : endOfDay(due);
}

export function isOverdue(task: Task, now: Date): boolean {
  if (task.completed) return false;
  const deadline = dueDeadline(task);
  return deadline !== null && deadline.getTime() < now.getTime();
}

/** Incomplete, timed, and due within the next hour (and not already late). */
export function isDueSoon(task: Task, now: Date): boolean {
  if (task.completed || !task.hasTime) return false;
  const due = parseDue(task.dueAt);
  if (!due) return false;
  const delta = due.getTime() - now.getTime();
  return delta >= 0 && delta <= DUE_SOON_MS;
}

export function isDueToday(task: Task, now: Date): boolean {
  const due = parseDue(task.dueAt);
  if (!due) return false;
  return isSameDay(due, now);
}

/** Dated strictly after today. Tasks with no due date are handled separately. */
export function isUpcoming(task: Task, now: Date): boolean {
  const due = parseDue(task.dueAt);
  if (!due) return false;
  return startOfDay(due).getTime() > startOfToday(now).getTime();
}

export function formatTime(d: Date): string {
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export function formatShortDate(d: Date): string {
  return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}

export function formatDayHeading(d: Date, now: Date): string {
  if (isSameDay(d, now)) return 'Today';
  if (isSameDay(d, addDays(now, 1))) return 'Tomorrow';
  if (isSameDay(d, addDays(now, -1))) return 'Yesterday';
  const withinWeek = startOfDay(d).getTime() - startOfToday(now).getTime() < 7 * 24 * 3600 * 1000;
  if (withinWeek && startOfDay(d) > startOfToday(now)) {
    return d.toLocaleDateString(undefined, { weekday: 'long' });
  }
  return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}

/**
 * Human label for a task's due date, e.g.
 * "Today 09:00", "Tomorrow", "Overdue · Mon 3 Mar", "No due date".
 */
export function formatDueLabel(task: Task, now: Date): string {
  const due = parseDue(task.dueAt);
  if (!due) return 'No due date';

  const timePart = task.hasTime ? ` ${formatTime(due)}` : '';
  const dayPart = formatDayHeading(due, now);

  if (isOverdue(task, now)) {
    return `Overdue · ${isSameDay(due, now) ? 'Today' : formatShortDate(due)}${timePart}`;
  }
  return `${dayPart}${timePart}`;
}

/**
 * Sort comparator: dated before undated, earlier due first, timed before
 * date-only on the same day, then oldest created first.
 */
export function compareByDue(a: Task, b: Task): number {
  const da = parseDue(a.dueAt);
  const db = parseDue(b.dueAt);

  if (da && db) {
    const sameDay = isSameDay(da, db);
    if (sameDay && a.hasTime !== b.hasTime) return a.hasTime ? -1 : 1;
    const diff = da.getTime() - db.getTime();
    if (diff !== 0) return diff;
  } else if (da && !db) {
    return -1;
  } else if (!da && db) {
    return 1;
  }

  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
}

/** "YYYY-MM-DD" in local time, for <input type="date">. */
export function toDateInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** "HH:mm" in local time, for <input type="time">. */
export function toTimeInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Builds { dueAt, hasTime } from form inputs. */
export function combineDueInputs(
  dueDate: string,
  dueTime: string,
): { dueAt: string | null; hasTime: boolean } {
  if (!dueDate) return { dueAt: null, hasTime: false };
  const [y, m, d] = dueDate.split('-').map(Number);
  if (!y || !m || !d) return { dueAt: null, hasTime: false };

  let hours = 0;
  let minutes = 0;
  let hasTime = false;
  if (dueTime) {
    const [hh, mm] = dueTime.split(':').map(Number);
    if (!Number.isNaN(hh) && !Number.isNaN(mm)) {
      hours = hh;
      minutes = mm;
      hasTime = true;
    }
  }

  const date = new Date(y, m - 1, d, hours, minutes, 0, 0);
  if (Number.isNaN(date.getTime())) return { dueAt: null, hasTime: false };
  return { dueAt: date.toISOString(), hasTime };
}
