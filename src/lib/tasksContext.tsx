import { createContext, useContext, type ReactNode } from 'react';
import { useTasks, type TasksApi } from '@/hooks/useTasks';

const TasksContext = createContext<TasksApi | null>(null);

export function TasksProvider({ children }: { children: ReactNode }) {
  const api = useTasks();
  return <TasksContext.Provider value={api}>{children}</TasksContext.Provider>;
}

export function useTasksContext(): TasksApi {
  const ctx = useContext(TasksContext);
  if (!ctx) {
    throw new Error('useTasksContext must be used inside a <TasksProvider>');
  }
  return ctx;
}
