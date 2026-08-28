import {
  compareByDue,
  formatDayHeading,
  isDueToday,
  isOverdue,
  isUpcoming,
  parseDue,
  startOfDay,
  toDateInputValue,
} from '@/lib/date';
import type { Task, TaskFilter, TaskSection } from '@/types/task';

function byCompletedDesc(a: Task, b: Task): number {
  const ta = a.completedAt ? new Date(a.completedAt).getTime() : 0;
  const tb = b.completedAt ? new Date(b.completedAt).getTime() : 0;
  if (tb !== ta) return tb - ta;
  return compareByDue(a, b);
}

function section(
  key: string,
  title: string,
  tasks: Task[],
  tone: TaskSection['tone'] = 'neutral',
): TaskSection | null {
  if (tasks.length === 0) return null;
  return { key, title, tone, tasks: tasks.slice().sort(compareByDue) };
}

/** Groups dated upcoming tasks into one section per calendar day. */
function upcomingDaySections(tasks: Task[], now: Date): TaskSection[] {
  const groups = new Map<string, Task[]>();
  for (const task of tasks) {
    const due = parseDue(task.dueAt);
    if (!due) continue;
    const key = toDateInputValue(startOfDay(due));
    const bucket = groups.get(key);
    if (bucket) bucket.push(task);
    else groups.set(key, [task]);
  }

  return [...groups.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, list]) => {
      const [y, m, d] = key.split('-').map(Number);
      const heading = formatDayHeading(new Date(y, m - 1, d), now);
      return {
        key: `day-${key}`,
        title: heading,
        tone: 'neutral' as const,
        tasks: list.slice().sort(compareByDue),
      };
    });
}

/**
 * The single source of view logic: pure, deterministic given `now`.
 * Returns ordered, non-empty sections for the requested filter.
 */
export function selectTasks(tasks: Task[], filter: TaskFilter, now: Date): TaskSection[] {
  const open = tasks.filter((t) => !t.completed);
  const done = tasks.filter((t) => t.completed);

  const overdue = open.filter((t) => isOverdue(t, now));
  const dueToday = open.filter((t) => isDueToday(t, now) && !isOverdue(t, now));
  const upcoming = open.filter((t) => isUpcoming(t, now));
  const undated = open.filter((t) => !t.dueAt);

  switch (filter) {
    case 'today':
      return [
        section('overdue', 'Overdue', overdue, 'overdue'),
        section('today', 'Today', dueToday),
      ].filter((s): s is TaskSection => s !== null);

    case 'overdue': {
      const single = section('overdue', 'Overdue', overdue, 'overdue');
      return single ? [single] : [];
    }

    case 'upcoming':
      return [
        ...upcomingDaySections(upcoming, now),
        section('undated', 'No due date', undated),
      ].filter((s): s is TaskSection => s !== null);

    case 'completed': {
      if (done.length === 0) return [];
      return [
        {
          key: 'completed',
          title: 'Completed',
          tone: 'neutral',
          tasks: done.slice().sort(byCompletedDesc),
        },
      ];
    }

    case 'all':
    default: {
      const sections: (TaskSection | null)[] = [
        section('overdue', 'Overdue', overdue, 'overdue'),
        section('today', 'Today', dueToday),
        ...upcomingDaySections(upcoming, now).map((s) => s as TaskSection | null),
        section('undated', 'No due date', undated),
      ];
      if (done.length > 0) {
        sections.push({
          key: 'completed',
          title: 'Completed',
          tone: 'neutral',
          tasks: done.slice().sort(byCompletedDesc),
        });
      }
      return sections.filter((s): s is TaskSection => s !== null);
    }
  }
}

export function countOverdue(tasks: Task[], now: Date): number {
  return tasks.filter((t) => isOverdue(t, now)).length;
}

export function countDueToday(tasks: Task[], now: Date): number {
  return tasks.filter((t) => !t.completed && isDueToday(t, now)).length;
}
