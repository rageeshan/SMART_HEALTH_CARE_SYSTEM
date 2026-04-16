import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from '../components/layout/Sidebar.jsx'
import { Topbar } from '../components/layout/Topbar.jsx'

export function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="hidden lg:fixed lg:inset-y-0 lg:block lg:w-72">
        <Sidebar />
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40" />
          <div className="relative h-full w-72">
            <Sidebar onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="lg:pl-72">
        <Topbar onOpenSidebar={() => setMobileOpen(true)} />
        <main className="container-page py-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

