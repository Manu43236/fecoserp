import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import {
  LayoutDashboard, Truck, MapPin, CalendarDays, Package, Users,
  Activity, PackageCheck, Building2, Wrench, BarChart3,
  FlaskConical, ClipboardList, TestTube, CheckCircle2,
  Briefcase, LogOut, Drill, Settings2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import type { Role } from '@/types'
import fecosLogo from '@/assets/fecos_logo.png'

interface NavItem { label: string; path: string; icon: LucideIcon }

const navByRole: Record<string, NavItem[]> = {
  ADMIN: [
    { label: 'Dashboard',          path: '/dashboard',      icon: LayoutDashboard },
    { label: 'Clients',            path: '/clients',        icon: Building2       },
    { label: 'Leases',             path: '/leases',         icon: MapPin          },
    { label: 'Wells',              path: '/wells',          icon: Drill           },
    { label: 'Routes',             path: '/routes',         icon: Truck           },
    { label: 'Schedule',           path: '/schedule',       icon: CalendarDays    },
    { label: 'Field Activity',     path: '/field-activity', icon: Activity        },
    { label: 'Deliveries',         path: '/deliveries',     icon: PackageCheck    },
    { label: 'Inventory',          path: '/inventory',      icon: Package         },
    { label: 'Plans',              path: '/plans',          icon: ClipboardList   },
    { label: 'Portfolio',          path: '/rep/portfolio',  icon: Briefcase       },
    { label: 'Lab',                path: '/lab/queue',      icon: TestTube        },
    { label: 'Raw Material QC',    path: '/lab/raw-qc',     icon: FlaskConical    },
    { label: 'Finished Product QC',path: '/lab/prod-qc',    icon: CheckCircle2    },
    { label: 'Pump Shop',          path: '/pump-shop',      icon: Wrench          },
    { label: 'Reports',            path: '/reports',        icon: BarChart3       },
    { label: 'Users',              path: '/users',          icon: Users           },
    { label: 'Products',           path: '/products',       icon: FlaskConical    },
    { label: 'Masters',            path: '/masters',        icon: Settings2       },
  ],
  MANAGER: [
    { label: 'Dashboard',      path: '/dashboard',      icon: LayoutDashboard },
    { label: 'Field Activity', path: '/field-activity', icon: Activity        },
    { label: 'Deliveries',     path: '/deliveries',     icon: PackageCheck    },
    { label: 'Clients',        path: '/clients',        icon: Building2       },
    { label: 'Leases',         path: '/leases',         icon: MapPin          },
    { label: 'Wells',          path: '/wells',          icon: Drill           },
    { label: 'Inventory',      path: '/inventory',      icon: Package         },
    { label: 'Plans',          path: '/plans',          icon: ClipboardList   },
    { label: 'Lab',            path: '/lab/queue',      icon: TestTube        },
    { label: 'Pump Shop',      path: '/pump-shop',      icon: Wrench          },
    { label: 'Reports',        path: '/reports',        icon: BarChart3       },
  ],
  LAB_TECH: [
    { label: 'Lab',                 path: '/lab/queue',   icon: TestTube      },
    { label: 'Raw Material QC',     path: '/lab/raw-qc',  icon: FlaskConical  },
    { label: 'Finished Product QC', path: '/lab/prod-qc', icon: CheckCircle2  },
  ],
  ACCOUNT_REP: [
    { label: 'Portfolio',  path: '/rep/portfolio', icon: Briefcase   },
    { label: 'Plans',      path: '/plans',         icon: ClipboardList },
    { label: 'Lab',        path: '/lab/queue',     icon: TestTube    },
    { label: 'Reports',    path: '/reports',       icon: BarChart3   },
  ],
}

function userInitials(name?: string) {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
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
        className="flex flex-col w-[220px] shrink-0 h-full"
        style={{ backgroundColor: 'var(--color-dark)' }}
      >
        {/* Logo */}
        <div className="h-[60px] flex items-center px-5 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <img src={fecosLogo} alt="FECOS" className="h-7 object-contain" />
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-0.5">
          {nav.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                    isActive ? 'text-white shadow-sm' : 'hover:bg-white/8'
                  }`
                }
                style={({ isActive }) => ({
                  backgroundColor: isActive ? 'var(--color-primary)' : undefined,
                  color: isActive ? '#fff' : `color-mix(in srgb, var(--color-accent) 85%, transparent)`,
                })}
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={16}
                      strokeWidth={isActive ? 2 : 1.75}
                      className="shrink-0 transition-all"
                      style={{ opacity: isActive ? 1 : 0.7 }}
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
            {/* Avatar */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
              style={{ backgroundColor: 'rgba(255,255,255,0.12)', color: 'var(--color-accent)' }}
            >
              {userInitials(user?.fullName)}
            </div>

            {/* Name + role */}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold truncate leading-tight" style={{ color: 'var(--color-accent)' }}>
                {user?.fullName}
              </p>
              <p className="text-[10px] mt-0.5 truncate" style={{ color: 'rgba(203,213,225,0.45)' }}>
                {user?.role?.replace(/_/g, ' ')}
              </p>
            </div>

            {/* Sign out */}
            <button
              onClick={logout}
              title="Sign out"
              className="w-7 h-7 rounded-md flex items-center justify-center transition-colors shrink-0"
              style={{ color: 'rgba(203,213,225,0.45)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-accent)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(203,213,225,0.45)')}
            >
              <LogOut size={13} strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-col flex-1 overflow-hidden">
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
          className="flex-1 overflow-y-auto"
          style={{ backgroundColor: 'var(--color-content-bg, #F8FAFC)' }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}
