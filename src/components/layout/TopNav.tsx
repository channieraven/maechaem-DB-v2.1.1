import { Bell, LogOut, Search, Trees, UserCircle2 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

type TopNavProps = {
  logoText?: string
  userName?: string
  searchValue?: string
  notificationCount?: number
  onSearchChange?: (value: string) => void
  onNotificationClick?: () => void
  onUserMenuClick?: () => void
}

export default function TopNav({
  logoText = 'ระบบบันทึกข้อมูลรายแปลง',
  userName,
  searchValue = '',
  notificationCount = 0,
  onSearchChange,
  onNotificationClick,
  onUserMenuClick,
}: TopNavProps) {
  const { profile, logout } = useAuth()

  const resolvedUserName = userName ?? profile?.fullname ?? 'ผู้ใช้งาน'

  return (
    <header className="sticky top-0 z-20 border-b border-green-950 bg-green-900 text-white shadow-md">
      <div className="mx-auto flex h-16 w-full items-center gap-3 px-4 md:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-2 md:flex-none">
          <span className="rounded-lg bg-white/15 p-1.5" aria-hidden="true">
            <Trees className="h-4 w-4 text-green-200" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold md:text-base">{logoText}</p>
            <p className="hidden text-[10px] text-green-100/90 md:block">สำนักวิจัยและพัฒนาการป่าไม้</p>
          </div>
        </div>

        <label className="relative hidden w-full max-w-md flex-1 md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="search"
            value={searchValue}
            onChange={(event) => onSearchChange?.(event.target.value)}
            placeholder="ค้นหาแปลง, ต้นไม้, รหัส..."
            className="w-full rounded-lg border border-white/30 bg-white py-2 pl-9 pr-3 text-sm text-gray-800 outline-none ring-0 placeholder:text-gray-400 focus:border-green-300"
          />
        </label>

        <button
          type="button"
          onClick={onNotificationClick}
          className="relative rounded-lg p-2 text-white/85 transition hover:bg-white/10 hover:text-white"
          aria-label="แจ้งเตือน"
        >
          <Bell className="h-5 w-5" />
          {notificationCount > 0 && (
            <span className="absolute right-1 top-1 inline-flex h-2.5 w-2.5 rounded-full bg-red-500" aria-hidden="true" />
          )}
        </button>

        <button
          type="button"
          onClick={onUserMenuClick}
          className="inline-flex items-center gap-2 rounded-lg p-2 text-sm font-medium text-white/90 transition hover:bg-white/10"
          aria-label="เมนูผู้ใช้"
        >
          <UserCircle2 className="h-5 w-5" />
          <span className="hidden md:inline">{resolvedUserName}</span>
        </button>

        <button
          type="button"
          onClick={() => void logout()}
          className="inline-flex items-center gap-2 rounded-lg p-2 text-white/80 transition hover:bg-red-500/20 hover:text-red-200"
          aria-label="ออกจากระบบ"
          title="ออกจากระบบ"
        >
          <LogOut className="h-5 w-5" />
          <span className="hidden md:inline">ออกจากระบบ</span>
        </button>
      </div>
    </header>
  )
}
