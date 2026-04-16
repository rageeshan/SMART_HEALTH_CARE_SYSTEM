import { cn } from '../../utils/cn.js'

export function Table({ className, children }) {
  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      <table className="w-full border-separate border-spacing-0">{children}</table>
    </div>
  )
}

export function THead({ children }) {
  return (
    <thead className="sticky top-0 bg-white">
      <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
        {children}
      </tr>
    </thead>
  )
}

export function TH({ children, className }) {
  return (
    <th className={cn('border-b border-slate-200 px-4 py-3', className)}>
      {children}
    </th>
  )
}

export function TBody({ children }) {
  return <tbody className="text-sm text-slate-800">{children}</tbody>
}

export function TR({ children, className }) {
  return (
    <tr className={cn('hover:bg-slate-50/80', className)}>{children}</tr>
  )
}

export function TD({ children, className }) {
  return (
    <td className={cn('border-b border-slate-100 px-4 py-3 align-middle', className)}>
      {children}
    </td>
  )
}

