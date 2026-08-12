import { Outlet, NavLink } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import fecosLogo from '@/assets/fecos_logo.png'

const nav = [
  { label: 'Dashboard',      path: '/sa/dashboard' },
  { label: 'Tenants',        path: '/sa/tenants' },
  { label: 'Subscriptions',  path: '/sa/subscriptions' },
  { label: 'Users',          path: '/sa/users' },
  { label: 'Settings',       path: '/sa/settings' },
]

export function SuperAdminLayout() {
  const { logout } = useAuthStore()

  return (
    <div className="flex h-screen overflow-hidden">
      {/* SA Sidebar — slate, visually distinct from tenant shell */}
      <aside className="flex flex-col w-[240px] shrink-0 h-full overflow-y-auto bg-slate-800">
        <div className="h-[60px] flex items-center px-5 border-b border-white/10 shrink-0">
          <div>
            <img src={fecosLogo} alt="FECOS" className="h-6 object-contain mb-0.5" />
            <p className="text-slate-400 text-xs">Super Admin</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {nav.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center w-full px-3 py-2.5 rounded-md text-sm transition-colors duration-150
                ${isActive ? 'bg-white/15 text-white font-medium' : 'text-slate-300 hover:bg-white/10'}
              `}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-white/10 shrink-0">
          <p className="text-xs text-slate-400">MandM Technologies</p>
          <button
            onClick={logout}
            className="mt-2 text-xs text-slate-400 hover:text-white transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="h-[60px] shrink-0 flex items-center px-6 border-b bg-white border-slate-200">
          <span className="text-sm text-slate-500">Super Admin Panel</span>
        </header>
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
