import { cn } from '../../utils/cn.js'
import { Button } from './Button.jsx'

export function Modal({
  open,
  title,
  children,
  onClose,
  footer,
  className,
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        aria-label="Close modal"
        className="absolute inset-0 bg-slate-900/40"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl',
          className,
        )}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="text-base font-semibold text-slate-900">{title}</div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer ? (
          <div className="border-t border-slate-200 px-5 py-4">{footer}</div>
        ) : null}
      </div>
    </div>
  )
}

