import { useEffect } from 'react';

type UndoToastProps = {
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
  /** Auto-dismiss delay in ms. */
  duration?: number;
};

export function UndoToast({ message, onUndo, onDismiss, duration = 6000 }: UndoToastProps) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, duration);
    return () => window.clearTimeout(timer);
  }, [onDismiss, duration, message]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 bottom-4 z-40 mx-auto flex w-[calc(100%-2rem)] max-w-sm items-center gap-3 rounded-xl bg-slate-900 px-4 py-3 text-sm text-white shadow-lg"
    >
      <span className="min-w-0 flex-1 truncate">{message}</span>
      <button
        type="button"
        onClick={onUndo}
        className="shrink-0 rounded-lg px-2 py-1 font-semibold text-indigo-300 transition-colors hover:bg-white/10 hover:text-white"
      >
        Undo
      </button>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 rounded-lg px-2 py-1 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
      >
        <span aria-hidden="true">✕</span>
        <span className="sr-only">Dismiss</span>
      </button>
    </div>
  );
}
