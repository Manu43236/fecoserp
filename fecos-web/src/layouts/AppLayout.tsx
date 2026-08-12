import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { Building2, LogOut } from 'lucide-react'
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
  const { user, logout, saSession, exitImpersonation } = useAuthStore()
  const navigate = useNavigate()
  const nav = user ? navByRole[user.role as Role] ?? [] : []
  const isImpersonating = !!saSession

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--color-primary', user?.primaryColor ?? '#1E3A5F')
    root.style.setProperty('--color-dark',    user?.darkColor    ?? '#0F2137')
    root.style.setProperty('--color-accent',  user?.accentColor  ?? '#CBD5E1')
  }, [user?.primaryColor, user?.darkColor, user?.accentColor])

  function handleExit() {
    exitImpersonation()
    navigate('/sa/tenants', { replace: true })
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside
        className="flex flex-col w-[240px] shrink-0 h-full overflow-y-auto"
        style={{ backgroundColor: 'var(--color-dark)' }}
      >
        <div className="h-[60px] flex items-center px-5 border-b border-white/10 shrink-0">
          <img src={fecosLogo} alt="FECOS" className="h-7 object-contain" />
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {nav.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center w-full px-3 py-2.5 rounded-md text-sm transition-colors duration-150
                ${isActive ? 'font-medium text-white' : 'hover:bg-white/10'}
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
        <header
          className="h-[60px] shrink-0 flex items-center justify-between px-6 border-b bg-white"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }} />
        </header>

        {/* Impersonation banner */}
        {isImpersonating && (
          <div className="bg-amber-500 text-white px-5 py-2 flex items-center justify-between text-sm shrink-0">
            <div className="flex items-center gap-2">
              <Building2 size={15} />
              <span>
                Acting as <strong>{user?.tenantName ?? user?.tenantId}</strong> — full admin access on behalf of this tenant
              </span>
            </div>
            <button
              onClick={handleExit}
              className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-md text-xs font-semibold transition-colors"
            >
              <LogOut size={12} />
              Exit
            </button>
          </div>
        )}

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
