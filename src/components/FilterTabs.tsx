import { Link } from '@tanstack/react-router';
import { FILTER_LABELS, TASK_FILTERS, type TaskFilter } from '@/types/task';

type FilterTabsProps = {
  active: TaskFilter;
  counts: Record<TaskFilter, number>;
};

export function FilterTabs({ active, counts }: FilterTabsProps) {
  return (
    <nav aria-label="Task views">
      <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TASK_FILTERS.map((filter) => {
          const isActive = filter === active;
          const count = counts[filter];
          const overdueTone = filter === 'overdue' && count > 0 && !isActive;

          return (
            <li key={filter} className="shrink-0">
              <Link
                to="/"
                search={{ filter }}
                aria-current={isActive ? 'page' : undefined}
                className={[
                  'inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-colors',
                  isActive
                    ? 'border-accent bg-accent text-white shadow-sm'
                    : overdueTone
                      ? 'border-red-200 bg-overdue-soft text-overdue-text hover:bg-red-100'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                ].join(' ')}
              >
                <span>{FILTER_LABELS[filter]}</span>
                {count > 0 ? (
                  <span
                    className={[
                      'rounded-full px-1.5 py-0.5 text-xs font-semibold tabular-nums',
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500',
                      overdueTone ? 'bg-red-100 text-overdue-text' : '',
                    ].join(' ')}
                  >
                    {count}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
