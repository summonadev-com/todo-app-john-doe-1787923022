import { TaskItem } from '@/components/TaskItem';
import type { Task, TaskSection } from '@/types/task';

type TaskListProps = {
  sections: TaskSection[];
  now: Date;
  onToggle: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
};

export function TaskList({ sections, now, onToggle, onEdit, onDelete }: TaskListProps) {
  return (
    <div className="space-y-5">
      {sections.map((section) => (
        <section key={section.key} aria-labelledby={`section-${section.key}`}>
          <div className="mb-2 flex items-center gap-2 px-1">
            <h2
              id={`section-${section.key}`}
              className={[
                'text-xs font-semibold uppercase tracking-wide',
                section.tone === 'overdue' ? 'text-overdue-text' : 'text-slate-500',
              ].join(' ')}
            >
              {section.title}
            </h2>
            <span className="text-xs tabular-nums text-slate-400">{section.tasks.length}</span>
            <span className="h-px flex-1 bg-slate-200" aria-hidden="true" />
          </div>

          <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5">
            {section.tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                now={now}
                onToggle={onToggle}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
