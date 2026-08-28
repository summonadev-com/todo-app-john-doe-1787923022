import type { Task } from '@/types/task';

const TASKS_KEY = 'todo.tasks.v1';
const NOTIFIED_KEY = 'todo.notified.v1';
const SCHEMA_VERSION = 1;

type StoredShape = {
  version: number;
  tasks: unknown;
};

function hasStorage(): boolean {
  try {
    return typeof window !== 'undefined' && !!window.localStorage;
  } catch {
    return false;
  }
}

function isIsoish(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(new Date(value).getTime());
}

/** Coerces an unknown record into a Task, or returns null if unusable. */
function normalizeTask(raw: unknown): Task | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;

  const id = typeof r.id === 'string' && r.id.trim() ? r.id : null;
  const title = typeof r.title === 'string' && r.title.trim() ? r.title.trim() : null;
  if (!id || !title) return null;

  const dueAt = isIsoish(r.dueAt) ? new Date(r.dueAt as string).toISOString() : null;

  return {
    id,
    title,
    notes: typeof r.notes === 'string' && r.notes.trim() ? r.notes : undefined,
    dueAt,
    hasTime: dueAt ? r.hasTime === true : false,
    completed: r.completed === true,
    completedAt: r.completed === true && isIsoish(r.completedAt) ? (r.completedAt as string) : null,
    createdAt: isIsoish(r.createdAt) ? (r.createdAt as string) : new Date().toISOString(),
  };
}

/** Never throws. Returns [] for missing, corrupt, or unexpected data. */
export function loadTasks(): Task[] {
  if (!hasStorage()) return [];
  let rawText: string | null = null;
  try {
    rawText = window.localStorage.getItem(TASKS_KEY);
  } catch {
    return [];
  }
  if (!rawText) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return [];
  }

  // Accept both the versioned envelope and a bare array (older/hand-written data).
  let list: unknown = parsed;
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    list = (parsed as StoredShape).tasks;
  }
  if (!Array.isArray(list)) return [];

  const out: Task[] = [];
  const seen = new Set<string>();
  for (const entry of list) {
    const task = normalizeTask(entry);
    if (task && !seen.has(task.id)) {
      seen.add(task.id);
      out.push(task);
    }
  }
  return out;
}

/** Swallows quota / private-mode errors. */
export function saveTasks(tasks: Task[]): void {
  if (!hasStorage()) return;
  try {
    const payload: StoredShape = { version: SCHEMA_VERSION, tasks };
    window.localStorage.setItem(TASKS_KEY, JSON.stringify(payload));
  } catch {
    /* storage unavailable or full — the app keeps working in memory */
  }
}

export function clearAllStoredData(): void {
  if (!hasStorage()) return;
  try {
    window.localStorage.removeItem(TASKS_KEY);
    window.localStorage.removeItem(NOTIFIED_KEY);
  } catch {
    /* ignore */
  }
}

/** IDs already notified about, so a refresh doesn't re-alert. */
export function loadNotifiedIds(): string[] {
  if (!hasStorage()) return [];
  try {
    const raw = window.localStorage.getItem(NOTIFIED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is string => typeof v === 'string');
  } catch {
    return [];
  }
}

export function saveNotifiedIds(ids: string[]): void {
  if (!hasStorage()) return;
  try {
    window.localStorage.setItem(NOTIFIED_KEY, JSON.stringify(ids.slice(-500)));
  } catch {
    /* ignore */
  }
}
