import { cn } from '../../utils/cn.js'

export function Select({ label, error, hint, className, id, children, ...props }) {
  const selectId = id ?? props.name
  return (
    <div className={cn('w-full', className)}>
      {label ? (
        <label
          htmlFor={selectId}
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          {label}
        </label>
      ) : null}
      <select
        id={selectId}
        className={cn(
          'h-11 w-full rounded-lg border bg-white px-3 text-sm text-slate-900 shadow-sm transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10',
          error ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/10' : 'border-slate-200',
        )}
        {...props}
      >
        {children}
      </select>
      {error ? (
        <p className="mt-1 text-sm text-rose-600">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-sm text-slate-500">{hint}</p>
      ) : null}
    </div>
  )
}

