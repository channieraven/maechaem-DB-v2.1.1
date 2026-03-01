import type { ReactNode } from 'react'
import { BarChart3, Ellipsis, House, Search } from 'lucide-react'
import { NavLink } from 'react-router-dom'

export type BottomNavItem = {
  id: string
  label: string
  to: string
  icon: ReactNode
}

type BottomNavProps = {
  items?: BottomNavItem[]
}

const defaultItems: BottomNavItem[] = [
  {
    id: 'home',
    label: 'หน้าหลัก',
    to: '/plots',
    icon: <House className="h-4 w-4" />,
  },
  {
    id: 'survey',
    label: 'สำรวจ',
    to: '/survey',
    icon: <Search className="h-4 w-4" />,
  },
  {
    id: 'dashboard',
    label: 'แดชบอร์ด',
    to: '/dashboard',
    icon: <BarChart3 className="h-4 w-4" />,
  },
  {
    id: 'more',
    label: 'เพิ่มเติม',
    to: '/admin',
    icon: <Ellipsis className="h-4 w-4" />,
  },
]

export default function BottomNav({ items = defaultItems }: BottomNavProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-green-800/20 bg-green-900 md:hidden" aria-label="เมนูด้านล่าง">
      <ul className="grid grid-cols-4">
        {items.map((item) => (
          <li key={item.id}>
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                [
                  'flex flex-col items-center justify-center gap-1 px-2 py-2 text-xs font-medium transition',
                  isActive ? 'text-white' : 'text-green-100/75 hover:text-white/90',
                ].join(' ')
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
