import { Button } from './Button.jsx'

export function EmptyState({
  title = 'No data',
  description,
  actionLabel,
  onAction,
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
      <div className="text-base font-semibold text-slate-900">{title}</div>
      {description ? (
        <div className="mt-1 max-w-md text-sm text-slate-600">
          {description}
        </div>
      ) : null}
      {actionLabel && onAction ? (
        <div className="mt-4">
          <Button onClick={onAction}>{actionLabel}</Button>
        </div>
      ) : null}
    </div>
  )
}

