import { cn } from '../../utils/cn.js'

export function Input({
  label,
  hint,
  error,
  className,
  id,
  ...props
}) {
  const inputId = id ?? props.name
  return (
    <div className={cn('w-full', className)}>
      {label ? (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        className={cn(
          'h-11 w-full rounded-lg border bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10',
          error ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/10' : 'border-slate-200',
        )}
        {...props}
      />
      {error ? (
        <p className="mt-1 text-sm text-rose-600">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-sm text-slate-500">{hint}</p>
      ) : null}
    </div>
  )
}

