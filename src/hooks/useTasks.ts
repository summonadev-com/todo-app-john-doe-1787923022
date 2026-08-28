import { useCallback, useEffect, useRef, useState } from 'react';
import { combineDueInputs } from '@/lib/date';
import { clearAllStoredData, loadTasks, saveTasks } from '@/lib/storage';
import type { Task, TaskDraft } from '@/types/task';

function newId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {
    /* fall through */
  }
  return `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export type TasksApi = {
  tasks: Task[];
  addTask: (draft: TaskDraft) => Task | null;
  updateTask: (id: string, patch: Partial<Omit<Task, 'id' | 'createdAt'>>) => void;
  applyDraft: (id: string, draft: TaskDraft) => void;
  toggleComplete: (id: string) => void;
  deleteTask: (id: string) => void;
  undoDelete: () => void;
  lastDeleted: Task | null;
  dismissUndo: () => void;
  clearCompleted: () => void;
  clearAll: () => void;
};

export function useTasks(): TasksApi {
  // Lazy initialiser: the very first paint already has stored data.
  const [tasks, setTasks] = useState<Task[]>(() => loadTasks());
  const [lastDeleted, setLastDeleted] = useState<Task | null>(null);
  const deletedIndex = useRef<number>(-1);

  useEffect(() => {
    saveTasks(tasks);
  }, [tasks]);

  const addTask = useCallback((draft: TaskDraft): Task | null => {
    const title = draft.title.trim();
    if (!title) return null;

    const { dueAt, hasTime } = combineDueInputs(draft.dueDate, draft.dueTime);
    const notes = draft.notes.trim();
    const task: Task = {
      id: newId(),
      title,
      notes: notes ? notes : undefined,
      dueAt,
      hasTime,
      completed: false,
      completedAt: null,
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [...prev, task]);
    return task;
  }, []);

  const updateTask = useCallback(
    (id: string, patch: Partial<Omit<Task, 'id' | 'createdAt'>>) => {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    },
    [],
  );

  const applyDraft = useCallback((id: string, draft: TaskDraft) => {
    const title = draft.title.trim();
    if (!title) return;
    const { dueAt, hasTime } = combineDueInputs(draft.dueDate, draft.dueTime);
    const notes = draft.notes.trim();
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, title, notes: notes ? notes : undefined, dueAt, hasTime } : t,
      ),
    );
  }, []);

  const toggleComplete = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              completed: !t.completed,
              completedAt: !t.completed ? new Date().toISOString() : null,
            }
          : t,
      ),
    );
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => {
      const index = prev.findIndex((t) => t.id === id);
      if (index === -1) return prev;
      deletedIndex.current = index;
      setLastDeleted(prev[index]);
      return prev.filter((t) => t.id !== id);
    });
  }, []);

  const undoDelete = useCallback(() => {
    setLastDeleted((restored) => {
      if (!restored) return null;
      setTasks((prev) => {
        if (prev.some((t) => t.id === restored.id)) return prev;
        const next = prev.slice();
        const at = deletedIndex.current;
        next.splice(at >= 0 && at <= next.length ? at : next.length, 0, restored);
        return next;
      });
      return null;
    });
  }, []);

  const dismissUndo = useCallback(() => setLastDeleted(null), []);

  const clearCompleted = useCallback(() => {
    setTasks((prev) => prev.filter((t) => !t.completed));
  }, []);

  const clearAll = useCallback(() => {
    setTasks([]);
    setLastDeleted(null);
    clearAllStoredData();
  }, []);

  return {
    tasks,
    addTask,
    updateTask,
    applyDraft,
    toggleComplete,
    deleteTask,
    undoDelete,
    lastDeleted,
    dismissUndo,
    clearCompleted,
    clearAll,
  };
}
