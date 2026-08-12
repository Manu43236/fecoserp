import { Outlet, NavLink } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import type { Role } from '@/types'
import fecosLogo from '@/assets/fecos_logo.png'

interface NavItem { label: string; path: string }

const navByRole: Record<string, NavItem[]> = {
  ADMIN: [
    { label: 'Dashboard',  path: '/dashboard' },
    { label: 'Dispatch',   path: '/dispatch' },
    { label: 'Routes',     path: '/routes' },
    { label: 'Schedule',   path: '/schedule' },
    { label: 'Inventory',  path: '/inventory' },
    { label: 'Users',      path: '/users' },
  ],
  MANAGER: [
    { label: 'Dashboard',      path: '/dashboard' },
    { label: 'Field Activity', path: '/field-activity' },
    { label: 'Deliveries',     path: '/deliveries' },
    { label: 'Clients',        path: '/clients' },
    { label: 'Inventory',      path: '/inventory' },
    { label: 'Pump Shop',      path: '/pump-shop' },
    { label: 'Reports',        path: '/reports' },
  ],
  LAB_TECH: [
    { label: 'Sample Queue',        path: '/lab/queue' },
    { label: 'Enter Results',       path: '/lab/results' },
    { label: 'Raw Material QC',     path: '/lab/raw-qc' },
    { label: 'Finished Product QC', path: '/lab/prod-qc' },
  ],
  ACCOUNT_REP: [
    { label: 'Portfolio',  path: '/rep/portfolio' },
    { label: 'Approvals',  path: '/rep/approvals' },
    { label: 'Reports',    path: '/reports' },
  ],
}

export function AppLayout() {
  const { user, logout } = useAuthStore()
  const nav = user ? navByRole[user.role as Role] ?? [] : []

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside
        className="flex flex-col w-[240px] shrink-0 h-full overflow-y-auto"
        style={{ backgroundColor: 'var(--color-dark)' }}
      >
        {/* Logo */}
        <div className="h-[60px] flex items-center px-5 border-b border-white/10 shrink-0">
          <img src={fecosLogo} alt="FECOS" className="h-7 object-contain" />
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {nav.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center w-full px-3 py-2.5 rounded-md text-sm transition-colors duration-150
                ${isActive
                  ? 'font-medium text-white'
                  : 'hover:bg-white/10'
                }
              `}
              style={({ isActive }) => ({
                backgroundColor: isActive ? 'var(--color-primary)' : undefined,
                color: isActive ? '#fff' : 'var(--color-accent)',
              })}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="px-4 py-4 border-t border-white/10 shrink-0">
          <p className="text-xs font-medium truncate" style={{ color: 'var(--color-accent)' }}>
            {user?.fullName}
          </p>
          <p className="text-xs opacity-50 mt-0.5" style={{ color: 'var(--color-accent)' }}>
            {user?.role}
          </p>
          <button
            onClick={logout}
            className="mt-2 text-xs opacity-60 hover:opacity-100 transition-opacity"
            style={{ color: 'var(--color-accent)' }}
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header
          className="h-[60px] shrink-0 flex items-center justify-between px-6 border-b bg-white"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }} />
          <div className="flex items-center gap-3">
            {/* notification bell added in Auth slice */}
          </div>
        </header>

        {/* Page content */}
        <main
          className="flex-1 overflow-y-auto p-6"
          style={{ backgroundColor: 'var(--color-content-bg)' }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}
