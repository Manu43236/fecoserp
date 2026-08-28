import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { LayoutDashboard, Building2, CreditCard, Users, Settings, LogOut, ShieldCheck, Menu } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import fecosLogo from '@/assets/fecos_logo.png'

interface NavItem { label: string; path: string; icon: LucideIcon }

const nav: NavItem[] = [
  { label: 'Dashboard',     path: '/sa/dashboard',     icon: LayoutDashboard },
  { label: 'Tenants',       path: '/sa/tenants',       icon: Building2       },
  { label: 'Subscriptions', path: '/sa/subscriptions', icon: CreditCard      },
  { label: 'Users',         path: '/sa/users',         icon: Users           },
  { label: 'Settings',      path: '/sa/settings',      icon: Settings        },
]

function userInitials(name?: string) {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

export function SuperAdminLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex h-dvh overflow-hidden">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SA Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col w-[220px] h-full bg-slate-900 transition-transform duration-200 md:relative md:translate-x-0 md:z-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Logo */}
        <div className="h-[60px] flex items-center gap-3 px-4 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <img src={fecosLogo} alt="FECOS" className="h-6 object-contain" />
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/10">
            <ShieldCheck size={10} className="text-slate-300" />
            <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider">SA</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-0.5">
          {nav.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-white/15 text-white'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/8'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={16}
                      strokeWidth={isActive ? 2 : 1.75}
                      style={{ opacity: isActive ? 1 : 0.7 }}
                      className="shrink-0 transition-all"
                    />
                    <span className={isActive ? 'font-semibold tracking-tight' : 'font-medium'}>{item.label}</span>
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* User footer */}
        <div className="px-2.5 py-3 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-white/12 flex items-center justify-center shrink-0 text-xs font-bold text-slate-300">
              {userInitials(user?.fullName)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-300 truncate leading-tight">
                {user?.fullName ?? 'Super Admin'}
              </p>
              <p className="text-[10px] mt-0.5 text-slate-500">M&amp;M Technologies</p>
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              className="w-7 h-7 rounded-md flex items-center justify-center text-slate-500 hover:text-slate-300 transition-colors shrink-0"
            >
              <LogOut size={13} strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        {/* Mobile top bar */}
        <div className="h-[60px] flex items-center px-4 gap-3 shrink-0 bg-slate-900 md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-slate-400 hover:text-white transition-colors"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <img src={fecosLogo} alt="FECOS" className="h-6 object-contain" />
        </div>

        <main className="flex-1 overflow-y-auto bg-slate-50">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
