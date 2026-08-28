import { createFileRoute, Link } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { EmptyState } from '@/components/EmptyState';
import { FilterTabs } from '@/components/FilterTabs';
import { QuickAdd } from '@/components/QuickAdd';
import { TaskEditor } from '@/components/TaskEditor';
import { TaskList } from '@/components/TaskList';
import { UndoToast } from '@/components/UndoToast';
import {
  isDueToday,
  isOverdue,
  isUpcoming,
  parseDue,
  toDateInputValue,
  toTimeInputValue,
} from '@/lib/date';
import { parseQuickAdd } from '@/lib/parseQuickAdd';
import { useNow } from '@/hooks/useNow';
import { useTasksContext } from '@/lib/tasksContext';
import { selectTasks } from '@/lib/taskViews';
import { isTaskFilter, type Task, type TaskDraft, type TaskFilter } from '@/types/task';

type EditorState =
  | { mode: 'create'; initial: Partial<TaskDraft> }
  | { mode: 'edit'; taskId: string; initial: Partial<TaskDraft> };

/** Builds editor form values from a stored task. */
function draftFromTask(task: Task): Partial<TaskDraft> {
  const due = parseDue(task.dueAt);
  return {
    title: task.title,
    notes: task.notes ?? '',
    dueDate: due ? toDateInputValue(due) : '',
    dueTime: due && task.hasTime ? toTimeInputValue(due) : '',
  };
}

type ListSearch = { filter: TaskFilter };

export const Route = createFileRoute('/')({
  validateSearch: (search: Record<string, unknown>): ListSearch => ({
    filter: isTaskFilter(search.filter) ? search.filter : 'today',
  }),
  component: TaskListPage,
});

function TaskListPage() {
  const { filter } = Route.useSearch();
  const {
    tasks,
    addTask,
    applyDraft,
    toggleComplete,
    deleteTask,
    undoDelete,
    lastDeleted,
    dismissUndo,
  } = useTasksContext();
  const now = useNow();
  const [editor, setEditor] = useState<EditorState | null>(null);

  const sections = useMemo(() => selectTasks(tasks, filter, now), [tasks, filter, now]);

  const counts = useMemo<Record<TaskFilter, number>>(() => {
    const open = tasks.filter((t) => !t.completed);
    const overdue = open.filter((t) => isOverdue(t, now)).length;
    return {
      today: open.filter((t) => isDueToday(t, now) || isOverdue(t, now)).length,
      overdue,
      upcoming: open.filter((t) => isUpcoming(t, now) || !t.dueAt).length,
      completed: tasks.filter((t) => t.completed).length,
      all: tasks.length,
    };
  }, [tasks, now]);

  return (
    <div className="space-y-4">
      <FilterTabs active={filter} counts={counts} />

      <QuickAdd
        now={now}
        onAdd={addTask}
        onMoreOptions={(text) => {
          const parsed = parseQuickAdd(text, now);
          setEditor({
            mode: 'create',
            initial: {
              title: parsed.title,
              notes: '',
              dueDate: parsed.dueDate,
              dueTime: parsed.dueTime,
            },
          });
        }}
      />

      {sections.length > 0 ? (
        <TaskList
          sections={sections}
          now={now}
          onToggle={toggleComplete}
          onEdit={(task) =>
            setEditor({ mode: 'edit', taskId: task.id, initial: draftFromTask(task) })
          }
          onDelete={deleteTask}
        />
      ) : (
        <FilterEmptyState filter={filter} hasAnyTask={tasks.length > 0} />
      )}

      {editor ? (
        <TaskEditor
          mode={editor.mode}
          initial={editor.initial}
          now={now}
          onCancel={() => setEditor(null)}
          onSave={(draft) => {
            if (editor.mode === 'create') addTask(draft);
            else applyDraft(editor.taskId, draft);
            setEditor(null);
          }}
        />
      ) : null}

      {lastDeleted ? (
        <UndoToast
          message={`Deleted “${lastDeleted.title}”`}
          onUndo={undoDelete}
          onDismiss={dismissUndo}
        />
      ) : null}
    </div>
  );
}

function FilterEmptyState({ filter, hasAnyTask }: { filter: TaskFilter; hasAnyTask: boolean }) {
  if (!hasAnyTask) {
    return (
      <EmptyState
        icon="✎"
        headline="Nothing here yet"
        subline="Add your first task above — try “Email Sam tomorrow 09:00”."
      />
    );
  }

  const seeAll = (
    <Link
      to="/"
      search={{ filter: 'all' as const }}
      className="inline-flex min-h-11 items-center rounded-lg bg-white px-4 text-sm font-medium text-slate-700 ring-1 ring-slate-200 transition-colors hover:bg-slate-100"
    >
      See all tasks
    </Link>
  );

  switch (filter) {
    case 'today':
      return (
        <EmptyState
          icon="☀"
          headline="You’re clear for today"
          subline="Nothing due today and nothing overdue."
          action={seeAll}
        />
      );
    case 'overdue':
      return (
        <EmptyState icon="✓" headline="Nothing overdue — nice" subline="You’re all caught up." action={seeAll} />
      );
    case 'upcoming':
      return (
        <EmptyState
          icon="→"
          headline="Nothing coming up"
          subline="No tasks scheduled beyond today."
          action={seeAll}
        />
      );
    case 'completed':
      return (
        <EmptyState
          icon="✓"
          headline="No completed tasks yet"
          subline="Tick a task off and it will show up here."
          action={seeAll}
        />
      );
    case 'all':
    default:
      return (
        <EmptyState
          icon="✎"
          headline="No tasks match this view"
          subline="Add a task above to get started."
        />
      );
  }
}
