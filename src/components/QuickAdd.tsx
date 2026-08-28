import { useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { combineDueInputs, formatDueLabel } from '@/lib/date';
import { parseQuickAdd } from '@/lib/parseQuickAdd';
import type { Task, TaskDraft } from '@/types/task';

type QuickAddProps = {
  onAdd: (draft: TaskDraft) => void;
  onMoreOptions: (text: string) => void;
  now: Date;
};

export function QuickAdd({ onAdd, onMoreOptions, now }: QuickAddProps) {
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const parsed = useMemo(() => parseQuickAdd(text, now), [text, now]);

  const hint = useMemo(() => {
    if (!parsed.matched || !parsed.dueDate) return null;
    const { dueAt, hasTime } = combineDueInputs(parsed.dueDate, parsed.dueTime);
    if (!dueAt) return null;
    const preview: Task = {
      id: 'preview',
      title: parsed.title,
      dueAt,
      hasTime,
      completed: false,
      completedAt: null,
      createdAt: now.toISOString(),
    };
    return formatDueLabel(preview, now);
  }, [parsed, now]);

  function submit(event?: FormEvent) {
    event?.preventDefault();
    if (!text.trim()) return;
    onAdd({
      title: parsed.title,
      notes: '',
      dueDate: parsed.dueDate,
      dueTime: parsed.dueTime,
    });
    setText('');
    // Keep focus for rapid consecutive entry.
    inputRef.current?.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      setText('');
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-xl bg-white p-1.5 shadow-sm ring-1 ring-black/5 focus-within:ring-2 focus-within:ring-accent-ring"
    >
      <div className="flex items-center gap-1.5">
        <label htmlFor="quick-add" className="sr-only">
          Add a task
        </label>
        <span aria-hidden="true" className="pl-2.5 text-lg leading-none text-slate-400">
          +
        </span>
        <input
          id="quick-add"
          ref={inputRef}
          autoFocus
          autoComplete="off"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Add a task — try “Pay rent tomorrow 09:00”"
          aria-describedby="quick-add-hint"
          className="min-h-11 min-w-0 flex-1 bg-transparent px-1 text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => onMoreOptions(text)}
          className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
        >
          More
        </button>
        <button
          type="submit"
          disabled={!text.trim()}
          className="inline-flex min-h-11 items-center rounded-lg bg-accent px-4 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
        >
          Add
        </button>
      </div>

      <p
        id="quick-add-hint"
        aria-live="polite"
        className="min-h-5 px-3 pb-1 text-xs text-slate-500"
      >
        {hint ? (
          <>
            Will be due <span className="font-medium text-accent">{hint}</span>
          </>
        ) : text.trim() ? (
          <>Press Enter to add · Esc to clear</>
        ) : (
          ''
        )}
      </p>
    </form>
  );
}
