import { Spinner } from './Spinner.jsx'

export function LoadingScreen({ title = 'Loading Smart Health Care…' }) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <Spinner />
        <div className="text-sm font-medium text-slate-700">{title}</div>
      </div>
    </div>
  )
}

