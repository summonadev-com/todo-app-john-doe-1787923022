import type { ReactNode } from 'react';

type EmptyStateProps = {
  icon?: ReactNode;
  headline: string;
  subline?: string;
  action?: ReactNode;
};

export function EmptyState({ icon, headline, subline, action }: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white/60 px-6 py-12 text-center">
      <div
        aria-hidden="true"
        className="mx-auto mb-3 grid size-11 place-items-center rounded-full bg-slate-100 text-xl text-slate-400"
      >
        {icon ?? '✓'}
      </div>
      <p className="text-[15px] font-medium text-slate-800">{headline}</p>
      {subline ? <p className="mx-auto mt-1 max-w-xs text-sm text-slate-500">{subline}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
