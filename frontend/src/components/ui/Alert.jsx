import { cn } from '../../utils/cn.js'

export function Alert({ variant = 'info', title, children, className }) {
  const styles = {
    info: 'border-sky-200 bg-sky-50 text-sky-900',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    warning: 'border-amber-200 bg-amber-50 text-amber-900',
    danger: 'border-rose-200 bg-rose-50 text-rose-900',
  }

  return (
    <div className={cn('rounded-xl border px-4 py-3 text-sm', styles[variant], className)}>
      {title ? <div className="mb-1 font-semibold">{title}</div> : null}
      {children}
    </div>
  )
}

