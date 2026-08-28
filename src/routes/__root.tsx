import { createRootRoute, Link, Outlet } from '@tanstack/react-router';
import { useNow } from '@/hooks/useNow';
import { useReminders } from '@/hooks/useReminders';
import { TasksProvider, useTasksContext } from '@/lib/tasksContext';
import { countDueToday, countOverdue } from '@/lib/taskViews';

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFound,
});

function RootLayout() {
  return (
    <TasksProvider>
      <AppShell />
    </TasksProvider>
  );
}

function AppShell() {
  const { tasks } = useTasksContext();
  const now = useNow();

  // Mounted exactly once, at the root.
  useReminders(tasks, now);

  const overdue = countOverdue(tasks, now);
  const today = countDueToday(tasks, now);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-4">
          <Link
            to="/"
            search={{ filter: 'today' as const }}
            className="flex items-center gap-2 rounded-lg font-semibold tracking-tight"
          >
            <span
              aria-hidden="true"
              className="grid size-8 place-items-center rounded-lg bg-accent text-sm font-bold text-white"
            >
              ✓
            </span>
            <span className="text-base">Tasks</span>
          </Link>

          <p className="ml-1 min-w-0 flex-1 truncate text-sm text-slate-500" aria-live="polite">
            {overdue > 0 ? (
              <>
                <span className="font-medium text-overdue-text">{overdue} overdue</span>
                <span className="mx-1.5 text-slate-300">·</span>
              </>
            ) : null}
            <span>
              {today} due today
            </span>
          </p>

          <Link
            to="/settings"
            className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            activeProps={{ className: 'bg-slate-100 text-slate-900' }}
          >
            Settings
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pt-5 pb-24">
        <Outlet />
      </main>
    </div>
  );
}

function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <p className="text-lg text-slate-700">This page does not exist.</p>
      <Link
        to="/"
        search={{ filter: 'today' as const }}
        className="text-sm font-medium text-accent underline underline-offset-4"
      >
        Go to your tasks
      </Link>
    </div>
  );
}
