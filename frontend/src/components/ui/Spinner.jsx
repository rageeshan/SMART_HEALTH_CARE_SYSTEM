import { cn } from '../../utils/cn.js'

export function Spinner({ className }) {
  return (
    <span
      className={cn(
        'inline-block h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-sky-600',
        className,
      )}
      aria-label="Loading"
      role="status"
    />
  )
}

