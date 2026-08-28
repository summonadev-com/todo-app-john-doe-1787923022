export type Task = {
  id: string;
  /** Required, trimmed, non-empty. */
  title: string;
  notes?: string;
  /** ISO string, or null when the task has no due date. */
  dueAt: string | null;
  /** Distinguishes "due Friday" (false) from "due Friday 09:00" (true). */
  hasTime: boolean;
  completed: boolean;
  completedAt: string | null;
  createdAt: string;
};

export type TaskFilter = 'today' | 'upcoming' | 'overdue' | 'completed' | 'all';

export const TASK_FILTERS: TaskFilter[] = ['today', 'overdue', 'upcoming', 'completed', 'all'];

export const FILTER_LABELS: Record<TaskFilter, string> = {
  today: 'Today',
  overdue: 'Overdue',
  upcoming: 'Upcoming',
  completed: 'Completed',
  all: 'All',
};

export function isTaskFilter(value: unknown): value is TaskFilter {
  return typeof value === 'string' && (TASK_FILTERS as string[]).includes(value);
}

/** Form values used when creating or editing a task. */
export type TaskDraft = {
  title: string;
  notes: string;
  /** "YYYY-MM-DD" or "" for no due date. */
  dueDate: string;
  /** "HH:mm" or "" for a date-only task. */
  dueTime: string;
};

export const emptyDraft: TaskDraft = { title: '', notes: '', dueDate: '', dueTime: '' };

/** A named, ordered group of tasks as produced by selectTasks. */
export type TaskSection = {
  key: string;
  title: string;
  tone?: 'overdue' | 'duesoon' | 'neutral';
  tasks: Task[];
};
