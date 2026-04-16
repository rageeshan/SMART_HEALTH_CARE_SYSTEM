import { cn } from '../../utils/cn.js'

export function Skeleton({ className }) {
  return (
    <div
      className={cn('animate-pulse rounded-lg bg-slate-200/70', className)}
    />
  )
}

