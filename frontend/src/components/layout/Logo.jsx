export function Logo({ compact = false }) {
  return (
    <div className="flex items-center gap-2">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-sky-600 text-white shadow-sm">
        <span className="text-sm font-bold">SH</span>
      </div>
      {compact ? null : (
        <div className="leading-tight">
          <div className="text-sm font-semibold text-slate-900">
            Smart Health Care
          </div>
          <div className="text-xs text-slate-500">System Portal</div>
        </div>
      )}
    </div>
  )
}

