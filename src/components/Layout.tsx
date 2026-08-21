import { NavLink, Outlet } from 'react-router-dom'

const navItems = [
  { to: '/', label: '車両', icon: '🏍️', end: true },
  { to: '/reminders', label: 'リマインダー', icon: '🔔', end: false },
  { to: '/settings', label: '設定', icon: '⚙️', end: false },
]

export default function Layout() {
  return (
    <div className="min-h-dvh flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <main className="flex-1 pb-20 max-w-md mx-auto w-full">
        <Outlet />
      </main>
      <nav className="fixed bottom-0 left-0 right-0 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur">
        <div className="max-w-md mx-auto flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs ${
                  isActive
                    ? 'text-sky-600 dark:text-sky-400 font-medium'
                    : 'text-slate-500 dark:text-slate-400'
                }`
              }
            >
              <span className="text-lg leading-none">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
