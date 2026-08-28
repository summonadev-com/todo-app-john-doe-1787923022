import { useEffect, useState } from 'react';

/**
 * A Date that refreshes on an interval and whenever the tab regains focus,
 * so a task silently crossing into "Overdue" re-renders on its own.
 */
export function useNow(intervalMs = 30_000): Date {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const tick = () => setNow(new Date());
    const timer = window.setInterval(tick, intervalMs);

    const onVisible = () => {
      if (document.visibilityState === 'visible') tick();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', tick);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', tick);
    };
  }, [intervalMs]);

  return now;
}
