import { Bell, Search, UserCircle2 } from 'lucide-react'

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
  logoText = 'Mae Chaem DB',
  userName = 'ผู้ใช้งาน',
  searchValue = '',
  notificationCount = 0,
  onSearchChange,
  onNotificationClick,
  onUserMenuClick,
}: TopNavProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full items-center gap-3 px-4 md:px-6">
        <div className="min-w-0 flex-1 md:flex-none">
          <p className="truncate text-base font-semibold text-green-800">{logoText}</p>
        </div>

        <label className="relative hidden w-full max-w-md flex-1 md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={searchValue}
            onChange={(event) => onSearchChange?.(event.target.value)}
            placeholder="ค้นหาแปลง, ต้นไม้, รหัส..."
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-800 outline-none ring-0 placeholder:text-gray-400 focus:border-green-300"
          />
        </label>

        <button
          type="button"
          onClick={onNotificationClick}
          className="relative rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 hover:text-gray-800"
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
          className="inline-flex items-center gap-2 rounded-lg p-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
          aria-label="เมนูผู้ใช้"
        >
          <UserCircle2 className="h-5 w-5" />
          <span className="hidden md:inline">{userName}</span>
        </button>
      </div>
    </header>
  )
}
