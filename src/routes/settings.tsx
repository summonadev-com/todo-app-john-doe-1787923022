import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import {
  getNotificationPermission,
  requestNotificationPermission,
  type NotificationPermissionState,
} from '@/hooks/useReminders';
import { useTasksContext } from '@/lib/tasksContext';

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
});

const PERMISSION_COPY: Record<NotificationPermissionState, string> = {
  granted: 'Browser notifications are on. You’ll get an alert as each task becomes due, while this app is open in a tab.',
  denied:
    'Your browser has blocked notifications for this site. Reminders still work visually — overdue tasks are flagged in red and due-soon tasks in amber. To change it, update notification permissions in your browser’s site settings.',
  default:
    'Turn on browser notifications to get an alert as each task becomes due, while this app is open in a tab.',
  unsupported:
    'This browser doesn’t support notifications. Reminders still work visually — overdue tasks are flagged in red and due-soon tasks in amber.',
};

function SettingsPage() {
  const { tasks, clearCompleted, clearAll } = useTasksContext();
  const [permission, setPermission] = useState<NotificationPermissionState>(() =>
    getNotificationPermission(),
  );
  const [confirmingClearAll, setConfirmingClearAll] = useState(false);

  const completedCount = tasks.filter((t) => t.completed).length;

  async function enableNotifications() {
    const result = await requestNotificationPermission();
    setPermission(result);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="flex-1 text-lg font-semibold tracking-tight">Settings</h1>
        <Link
          to="/"
          search={{ filter: 'today' as const }}
          className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-accent transition-colors hover:bg-accent-soft"
        >
          ← Back to tasks
        </Link>
      </div>

      <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <h2 className="text-sm font-semibold text-slate-900">Reminders</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
          {PERMISSION_COPY[permission]}
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Notifications can only fire while this app is open — there’s no server sending them.
        </p>

        {permission === 'default' ? (
          <button
            type="button"
            onClick={enableNotifications}
            className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-accent px-4 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
          >
            Enable browser notifications
          </button>
        ) : (
          <p
            className={[
              'mt-4 inline-flex min-h-9 items-center rounded-full px-3 text-xs font-medium',
              permission === 'granted'
                ? 'bg-accent-soft text-accent'
                : 'bg-slate-100 text-slate-600',
            ].join(' ')}
          >
            {permission === 'granted'
              ? 'Notifications enabled'
              : permission === 'denied'
                ? 'Notifications blocked'
                : 'Notifications unavailable'}
          </p>
        )}
      </section>

      <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <h2 className="text-sm font-semibold text-slate-900">Your data</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
          {tasks.length} task{tasks.length === 1 ? '' : 's'} stored in this browser only. Nothing
          leaves this device.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={clearCompleted}
            disabled={completedCount === 0}
            className="inline-flex min-h-11 items-center rounded-lg px-4 text-sm font-medium text-slate-700 ring-1 ring-slate-200 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-400 disabled:ring-slate-100"
          >
            Clear completed{completedCount > 0 ? ` (${completedCount})` : ''}
          </button>

          {confirmingClearAll ? (
            <span className="inline-flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  clearAll();
                  setConfirmingClearAll(false);
                }}
                className="inline-flex min-h-11 items-center rounded-lg bg-overdue px-4 text-sm font-semibold text-white transition-colors hover:bg-red-600"
              >
                Yes, delete everything
              </button>
              <button
                type="button"
                onClick={() => setConfirmingClearAll(false)}
                className="inline-flex min-h-11 items-center rounded-lg px-4 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
              >
                Cancel
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingClearAll(true)}
              disabled={tasks.length === 0}
              className="inline-flex min-h-11 items-center rounded-lg px-4 text-sm font-medium text-overdue-text ring-1 ring-red-200 transition-colors hover:bg-overdue-soft disabled:cursor-not-allowed disabled:text-slate-400 disabled:ring-slate-100"
            >
              Clear all data
            </button>
          )}
        </div>

        {confirmingClearAll ? (
          <p role="alert" className="mt-3 text-sm font-medium text-overdue-text">
            This permanently deletes all {tasks.length} task
            {tasks.length === 1 ? '' : 's'}. This cannot be undone.
          </p>
        ) : null}
      </section>
    </div>
  );
}
