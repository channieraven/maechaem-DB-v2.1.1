import type { ReactNode } from 'react'
import { BarChart3, Search, Shield, SquareKanban } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'
import OfflineIndicator from './OfflineIndicator'
import TopNav from './TopNav'

type AppShellProps = {
  children?: ReactNode
  sidebar?: ReactNode
  topNav?: ReactNode
  bottomNav?: ReactNode
  isSyncing?: boolean
  queueSize?: number
}

function DefaultSidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-gray-200 bg-white md:flex md:flex-col">
      <div className="border-b border-gray-200 px-5 py-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">เมนูหลัก</p>
      </div>

      <nav className="flex-1 p-3" aria-label="เมนูหลัก">
        <NavLink
          to="/plots"
          end
          className={({ isActive }) =>
            [
              'mb-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition',
              isActive ? 'bg-green-50 text-green-800' : 'text-gray-700 hover:bg-gray-100',
            ].join(' ')
          }
        >
          <SquareKanban className="h-4 w-4" />
          หน้าหลัก
        </NavLink>

        <NavLink
          to="/survey"
          className={({ isActive }) =>
            [
              'mb-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition',
              isActive ? 'bg-green-50 text-green-800' : 'text-gray-700 hover:bg-gray-100',
            ].join(' ')
          }
        >
          <Search className="h-4 w-4" />
          สำรวจ
        </NavLink>

        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            [
              'mb-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition',
              isActive ? 'bg-green-50 text-green-800' : 'text-gray-700 hover:bg-gray-100',
            ].join(' ')
          }
        >
          <BarChart3 className="h-4 w-4" />
          แดชบอร์ด
        </NavLink>

        <NavLink
          to="/admin"
          className={({ isActive }) =>
            [
              'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition',
              isActive ? 'bg-green-50 text-green-800' : 'text-gray-700 hover:bg-gray-100',
            ].join(' ')
          }
        >
          <Shield className="h-4 w-4" />
          ผู้ดูแลระบบ
        </NavLink>
      </nav>
    </aside>
  )
}

export default function AppShell({
  children,
  sidebar,
  topNav,
  bottomNav,
  isSyncing = false,
  queueSize = 0,
}: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {sidebar ?? <DefaultSidebar />}

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        {topNav ?? <TopNav />}
        <OfflineIndicator isSyncing={isSyncing} queueSize={queueSize} />

        <main className="flex-1 px-4 py-4 pb-20 md:px-6 md:py-6 md:pb-6">{children ?? <Outlet />}</main>

        {bottomNav ?? <BottomNav />}
      </div>
    </div>
  )
}
