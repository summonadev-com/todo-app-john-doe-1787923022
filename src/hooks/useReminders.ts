import { useEffect, useRef } from 'react';
import { dueDeadline } from '@/lib/date';
import { loadNotifiedIds, saveNotifiedIds } from '@/lib/storage';
import type { Task } from '@/types/task';

export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export type NotificationPermissionState = 'unsupported' | NotificationPermission;

export function getNotificationPermission(): NotificationPermissionState {
  if (!notificationsSupported()) return 'unsupported';
  try {
    return Notification.permission;
  } catch {
    return 'unsupported';
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (!notificationsSupported()) return 'unsupported';
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
}

/**
 * Fires at most one browser notification per task as its due moment passes.
 * Purely additive: if permission is missing, denied, or the API is absent,
 * this does nothing and the visual reminders in the UI carry the feature.
 */
export function useReminders(tasks: Task[], now: Date): void {
  const notified = useRef<Set<string> | null>(null);
  if (notified.current === null) {
    notified.current = new Set(loadNotifiedIds());
  }

  useEffect(() => {
    if (getNotificationPermission() !== 'granted') return;

    const seen = notified.current;
    if (!seen) return;

    let changed = false;
    for (const task of tasks) {
      if (task.completed || seen.has(task.id)) continue;
      const deadline = dueDeadline(task);
      if (!deadline || deadline.getTime() > now.getTime()) continue;

      seen.add(task.id);
      changed = true;
      try {
        new Notification('Task due', {
          body: task.title,
          tag: task.id,
        });
      } catch {
        /* notification construction can throw on some platforms — ignore */
      }
    }

    // Drop IDs for tasks that no longer exist so the set doesn't grow forever.
    if (changed) {
      const alive = new Set(tasks.map((t) => t.id));
      for (const id of [...seen]) if (!alive.has(id)) seen.delete(id);
      saveNotifiedIds([...seen]);
    }
  }, [tasks, now]);
}
