import { formatDueLabel, isDueSoon, isOverdue } from '@/lib/date';
import type { Task } from '@/types/task';

type TaskItemProps = {
  task: Task;
  now: Date;
  onToggle: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
};

export function TaskItem({ task, now, onToggle, onEdit, onDelete }: TaskItemProps) {
  const overdue = isOverdue(task, now);
  const dueSoon = !overdue && isDueSoon(task, now);
  const dueLabel = formatDueLabel(task, now);

  const accent = overdue
    ? 'border-l-overdue bg-overdue-soft/40'
    : dueSoon
      ? 'border-l-duesoon bg-duesoon-soft/40'
      : 'border-l-transparent bg-white';

  return (
    <li
      className={[
        'group flex items-start gap-3 border-l-2 px-3 py-3 transition-colors motion-reduce:transition-none',
        accent,
        task.completed ? 'opacity-60' : '',
      ].join(' ')}
    >
      <input
        type="checkbox"
        id={`task-${task.id}`}
        checked={task.completed}
        onChange={() => onToggle(task.id)}
        aria-label={task.completed ? `Mark “${task.title}” as not done` : `Mark “${task.title}” as done`}
        className="mt-0.5 size-5 shrink-0 cursor-pointer rounded border-slate-300 text-accent accent-indigo-600"
      />

      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={() => onEdit(task)}
          className="block w-full text-left"
          aria-label={`Edit “${task.title}”`}
        >
          <span
            className={[
              'text-[15px] leading-snug transition-colors motion-reduce:transition-none',
              task.completed
                ? 'text-slate-500 line-through decoration-slate-400'
                : 'text-slate-900 group-hover:text-accent',
            ].join(' ')}
          >
            {task.title}
          </span>
        </button>

        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <span
            className={
              overdue
                ? 'font-semibold text-overdue-text'
                : dueSoon
                  ? 'font-semibold text-duesoon-text'
                  : 'text-slate-500'
            }
          >
            {task.completed && task.completedAt
              ? `Completed ${new Date(task.completedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`
              : dueLabel}
          </span>

          {dueSoon ? (
            <span className="rounded-full bg-duesoon-soft px-1.5 py-0.5 font-medium text-duesoon-text ring-1 ring-amber-200">
              Due soon
            </span>
          ) : null}

          {task.notes ? (
            <span className="inline-flex items-center gap-1 text-slate-400" title={task.notes}>
              <span aria-hidden="true">≡</span>
              <span className="sr-only">Has notes: </span>
              <span className="max-w-[14rem] truncate">{task.notes}</span>
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <button
          type="button"
          onClick={() => onEdit(task)}
          className="inline-flex size-11 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 sm:size-9"
        >
          <span aria-hidden="true" className="text-sm">
            ✎
          </span>
          <span className="sr-only">Edit “{task.title}”</span>
        </button>
        <button
          type="button"
          onClick={() => onDelete(task.id)}
          className="inline-flex size-11 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-overdue-soft hover:text-overdue-text sm:size-9"
        >
          <span aria-hidden="true" className="text-sm">
            ✕
          </span>
          <span className="sr-only">Delete “{task.title}”</span>
        </button>
      </div>
    </li>
  );
}
