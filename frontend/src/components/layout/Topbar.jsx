import { Button } from '../ui/Button.jsx'
import { UserMenu } from './UserMenu.jsx'

export function Topbar({ onOpenSidebar }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-slate-50/70 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="lg:hidden"
            onClick={onOpenSidebar}
          >
            Menu
          </Button>
          <div className="hidden sm:block">
            <div className="text-sm font-semibold text-slate-900">
              Smart Health Care System
            </div>
            <div className="text-xs text-slate-500">
              Role-based dashboard & patient management
            </div>
          </div>
        </div>
        <UserMenu />
      </div>
    </header>
  )
}

