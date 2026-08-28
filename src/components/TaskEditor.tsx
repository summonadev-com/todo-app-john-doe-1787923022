import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { addDays, toDateInputValue } from '@/lib/date';
import { emptyDraft, type TaskDraft } from '@/types/task';

type TaskEditorProps = {
  /** Heading + submit wording. */
  mode: 'create' | 'edit';
  initial?: Partial<TaskDraft>;
  now: Date;
  onSave: (draft: TaskDraft) => void;
  onCancel: () => void;
};

export function TaskEditor({ mode, initial, now, onSave, onCancel }: TaskEditorProps) {
  const [draft, setDraft] = useState<TaskDraft>({ ...emptyDraft, ...initial });
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
    titleRef.current?.select();
  }, []);

  useEffect(() => {
    function onKey(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') onCancel();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);

  function set<K extends keyof TaskDraft>(key: K, value: TaskDraft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!draft.title.trim()) {
      titleRef.current?.focus();
      return;
    }
    // A time without a date is meaningless — anchor it to today.
    const dueDate =
      !draft.dueDate && draft.dueTime ? toDateInputValue(now) : draft.dueDate;
    onSave({ ...draft, dueDate });
  }

  function stopBubble(event: KeyboardEvent) {
    if (event.key === 'Escape') event.stopPropagation();
  }

  const quickDates: { label: string; value: string }[] = [
    { label: 'Today', value: toDateInputValue(now) },
    { label: 'Tomorrow', value: toDateInputValue(addDays(now, 1)) },
    { label: 'Next week', value: toDateInputValue(addDays(now, 7)) },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close editor"
        onClick={onCancel}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-editor-title"
        onKeyDown={stopBubble}
        className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl ring-1 ring-black/10 sm:rounded-2xl"
      >
        <h2 id="task-editor-title" className="mb-4 text-base font-semibold tracking-tight">
          {mode === 'create' ? 'New task' : 'Edit task'}
        </h2>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="editor-title" className="mb-1 block text-sm font-medium text-slate-700">
              Title
            </label>
            <input
              id="editor-title"
              ref={titleRef}
              required
              value={draft.title}
              onChange={(e) => set('title', e.target.value)}
              className="min-h-11 w-full rounded-lg border border-slate-300 px-3 text-[15px] text-slate-900 placeholder:text-slate-400 focus:border-accent focus:outline-none"
              placeholder="What needs doing?"
            />
          </div>

          <div>
            <label htmlFor="editor-notes" className="mb-1 block text-sm font-medium text-slate-700">
              Notes <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              id="editor-notes"
              rows={3}
              value={draft.notes}
              onChange={(e) => set('notes', e.target.value)}
              className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-accent focus:outline-none"
              placeholder="Any extra detail"
            />
          </div>

          <fieldset className="space-y-2">
            <legend className="mb-1 text-sm font-medium text-slate-700">Due</legend>
            <div className="flex flex-wrap gap-2">
              {quickDates.map((q) => (
                <button
                  key={q.label}
                  type="button"
                  onClick={() => set('dueDate', q.value)}
                  aria-pressed={draft.dueDate === q.value}
                  className={[
                    'inline-flex min-h-9 items-center rounded-full px-3 text-xs font-medium transition-colors',
                    draft.dueDate === q.value
                      ? 'bg-accent text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                  ].join(' ')}
                >
                  {q.label}
                </button>
              ))}
              {draft.dueDate || draft.dueTime ? (
                <button
                  type="button"
                  onClick={() => setDraft((p) => ({ ...p, dueDate: '', dueTime: '' }))}
                  className="inline-flex min-h-9 items-center rounded-full px-3 text-xs font-medium text-slate-500 underline underline-offset-4 transition-colors hover:text-overdue-text"
                >
                  Clear due date
                </button>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="min-w-40 flex-1">
                <label htmlFor="editor-date" className="mb-1 block text-xs text-slate-500">
                  Date
                </label>
                <input
                  id="editor-date"
                  type="date"
                  value={draft.dueDate}
                  onChange={(e) => set('dueDate', e.target.value)}
                  className="min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 focus:border-accent focus:outline-none"
                />
              </div>
              <div className="min-w-32 flex-1">
                <label htmlFor="editor-time" className="mb-1 block text-xs text-slate-500">
                  Time <span className="text-slate-400">(optional)</span>
                </label>
                <input
                  id="editor-time"
                  type="time"
                  value={draft.dueTime}
                  onChange={(e) => set('dueTime', e.target.value)}
                  className="min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 focus:border-accent focus:outline-none"
                />
              </div>
            </div>
          </fieldset>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex min-h-11 items-center rounded-lg px-4 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!draft.title.trim()}
              className="inline-flex min-h-11 items-center rounded-lg bg-accent px-5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
            >
              {mode === 'create' ? 'Add task' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
