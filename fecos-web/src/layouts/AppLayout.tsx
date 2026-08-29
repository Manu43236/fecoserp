import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState, useMemo } from 'react'
import {
  LayoutDashboard, Truck, MapPin, CalendarDays, Package, Users,
  Building2, Wrench, BarChart3,
  FlaskConical, ClipboardList, TestTube, CheckCircle2,
  Briefcase, LogOut, Drill, Settings2, Cylinder, Car, Menu,
  ChevronDown,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import type { Role } from '@/types'
import fecosLogo from '@/assets/fecos_logo.png'

interface NavItem { label: string; path: string; icon: LucideIcon }
type NavEntry =
  | { kind: 'item';  label: string; path: string; icon: LucideIcon }
  | { kind: 'group'; label: string; icon: LucideIcon; children: NavItem[] }

// ── Flat nav (roles with few items) ───────────────────────────────────────────
const flatNavByRole: Partial<Record<string, NavItem[]>> = {
  LAB_TECH: [
    { label: 'Lab', path: '/lab/queue', icon: TestTube     },
    { label: 'QC',  path: '/qc',        icon: CheckCircle2 },
  ],
  ACCOUNT_REP: [
    { label: 'Approvals', path: '/rep/approvals', icon: CheckCircle2  },
    { label: 'Clients',   path: '/clients',       icon: Building2     },
    { label: 'Lab',       path: '/lab/queue',     icon: TestTube      },
    { label: 'Portfolio', path: '/rep/portfolio', icon: Briefcase     },
    { label: 'Programs',  path: '/plans',         icon: ClipboardList },
    { label: 'Reports',   path: '/reports',       icon: BarChart3     },
    { label: 'Schedule',  path: '/schedule',      icon: CalendarDays  },
    { label: 'Tanks',     path: '/tanks',         icon: Cylinder      },
    { label: 'Wells',     path: '/wells',         icon: Drill         },
  ],
}

// ── Grouped nav (Admin + Manager) ─────────────────────────────────────────────
const groupedNavByRole: Partial<Record<string, NavEntry[]>> = {
  ADMIN: [
    { kind: 'item',  label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { kind: 'group', label: 'Operations', icon: Truck, children: [
      { label: 'Routes',    path: '/routes',    icon: Truck        },
      { label: 'Schedule',  path: '/schedule',  icon: CalendarDays },
      { label: 'Programs',  path: '/plans',     icon: ClipboardList },
      { label: 'Pumps',     path: '/pump-shop', icon: Wrench       },
    ]},
    { kind: 'group', label: 'Sites', icon: MapPin, children: [
      { label: 'Leases', path: '/leases', icon: MapPin   },
      { label: 'Wells',  path: '/wells',  icon: Drill    },
      { label: 'Tanks',  path: '/tanks',  icon: Cylinder },
    ]},
    { kind: 'group', label: 'Chemistry', icon: FlaskConical, children: [
      { label: 'Lab', path: '/lab/queue', icon: TestTube     },
      { label: 'QC',  path: '/qc',        icon: CheckCircle2 },
    ]},
    { kind: 'item',  label: 'Inventory', path: '/inventory', icon: Package },
    { kind: 'group', label: 'Clients', icon: Building2, children: [
      { label: 'Clients',   path: '/clients',       icon: Building2 },
      { label: 'Portfolio', path: '/rep/portfolio', icon: Briefcase },
    ]},
    { kind: 'group', label: 'Admin', icon: Settings2, children: [
      { label: 'Users',    path: '/users',    icon: Users     },
      { label: 'Vehicles', path: '/vehicles', icon: Car       },
      { label: 'Masters',  path: '/masters',  icon: Settings2 },
    ]},
    { kind: 'item',  label: 'Reports', path: '/reports', icon: BarChart3 },
  ],
  MANAGER: [
    { kind: 'item',  label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { kind: 'group', label: 'Operations', icon: Truck, children: [
      { label: 'Routes',   path: '/routes',    icon: Truck        },
      { label: 'Schedule', path: '/schedule',  icon: CalendarDays },
      { label: 'Programs', path: '/plans',     icon: ClipboardList },
      { label: 'Pumps',    path: '/pump-shop', icon: Wrench       },
    ]},
    { kind: 'group', label: 'Sites', icon: MapPin, children: [
      { label: 'Leases', path: '/leases', icon: MapPin   },
      { label: 'Wells',  path: '/wells',  icon: Drill    },
      { label: 'Tanks',  path: '/tanks',  icon: Cylinder },
    ]},
    { kind: 'group', label: 'Chemistry', icon: FlaskConical, children: [
      { label: 'Lab', path: '/lab/queue', icon: TestTube     },
      { label: 'QC',  path: '/qc',        icon: CheckCircle2 },
    ]},
    { kind: 'item',  label: 'Inventory', path: '/inventory', icon: Package },
    { kind: 'group', label: 'Clients', icon: Building2, children: [
      { label: 'Clients', path: '/clients', icon: Building2 },
    ]},
    { kind: 'item',  label: 'Reports', path: '/reports', icon: BarChart3 },
  ],
}

function userInitials(name?: string) {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

// ── Grouped sidebar nav ────────────────────────────────────────────────────────
function GroupedSidebarNav({ entries, onNavigate }: { entries: NavEntry[]; onNavigate: () => void }) {
  const location = useLocation()

  const activeGroupLabel = useMemo(() => {
    return entries
      .filter((e): e is Extract<NavEntry, { kind: 'group' }> => e.kind === 'group')
      .find(g => g.children.some(c => location.pathname.startsWith(c.path)))
      ?.label ?? null
  }, [location.pathname, entries])

  const [expanded, setExpanded] = useState<string | null>(activeGroupLabel)

  useEffect(() => {
    if (activeGroupLabel) setExpanded(activeGroupLabel)
  }, [activeGroupLabel])

  const accentMuted = `color-mix(in srgb, var(--color-accent) 85%, transparent)`

  return (
    <>
      {entries.map(entry => {
        if (entry.kind === 'item') {
          const Icon = entry.icon
          return (
            <NavLink
              key={entry.path}
              to={entry.path}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive ? 'text-white shadow-sm' : 'hover:bg-white/8'
                }`
              }
              style={({ isActive }) => ({
                backgroundColor: isActive ? 'var(--color-primary)' : undefined,
                color: isActive ? '#fff' : accentMuted,
              })}
            >
              {({ isActive }) => (
                <>
                  <Icon size={16} strokeWidth={isActive ? 2 : 1.75} style={{ opacity: isActive ? 1 : 0.7 }} />
                  <span className={isActive ? 'font-semibold tracking-tight' : 'font-medium'}>{entry.label}</span>
                </>
              )}
            </NavLink>
          )
        }

        const isOpen    = expanded === entry.label
        const isActive  = entry.label === activeGroupLabel
        const GroupIcon = entry.icon

        return (
          <div key={entry.label}>
            <button
              onClick={() => setExpanded(isOpen ? null : entry.label)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 hover:bg-white/8"
              style={{ color: isActive ? 'var(--color-accent)' : accentMuted }}
            >
              <GroupIcon size={16} strokeWidth={1.75} style={{ opacity: isActive ? 1 : 0.65, flexShrink: 0 }} />
              <span className={`flex-1 text-left ${isActive ? 'font-semibold' : 'font-medium'}`}>
                {entry.label}
              </span>
              <ChevronDown
                size={13}
                strokeWidth={2}
                style={{
                  opacity: 0.5,
                  flexShrink: 0,
                  transition: 'transform 200ms',
                  transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                }}
              />
            </button>

            {isOpen && (
              <div className="mt-0.5 mb-1 space-y-0.5">
                {entry.children.map(item => {
                  const Icon = item.icon
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        `flex items-center gap-3 pl-8 pr-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                          isActive ? 'text-white shadow-sm' : 'hover:bg-white/8'
                        }`
                      }
                      style={({ isActive }) => ({
                        backgroundColor: isActive ? 'var(--color-primary)' : undefined,
                        color: isActive ? '#fff' : accentMuted,
                      })}
                    >
                      {({ isActive }) => (
                        <>
                          <Icon size={14} strokeWidth={isActive ? 2 : 1.75} style={{ opacity: isActive ? 1 : 0.65 }} />
                          <span className={isActive ? 'font-semibold tracking-tight text-xs' : 'font-medium text-xs'}>
                            {item.label}
                          </span>
                        </>
                      )}
                    </NavLink>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </>
  )
}

// ── Flat sidebar nav (existing behavior) ──────────────────────────────────────
function FlatSidebarNav({ items, onNavigate }: { items: NavItem[]; onNavigate: () => void }) {
  const accentMuted = `color-mix(in srgb, var(--color-accent) 85%, transparent)`
  return (
    <>
      {items.map(item => {
        const Icon = item.icon
        return (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive ? 'text-white shadow-sm' : 'hover:bg-white/8'
              }`
            }
            style={({ isActive }) => ({
              backgroundColor: isActive ? 'var(--color-primary)' : undefined,
              color: isActive ? '#fff' : accentMuted,
            })}
          >
            {({ isActive }) => (
              <>
                <Icon size={16} strokeWidth={isActive ? 2 : 1.75} style={{ opacity: isActive ? 1 : 0.7 }} />
                <span className={isActive ? 'font-semibold tracking-tight' : 'font-medium'}>{item.label}</span>
              </>
            )}
          </NavLink>
        )
      })}
    </>
  )
}

export function AppLayout() {
  const { user, logout, saSession, exitImpersonation, isImpersonated } = useAuthStore()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const role       = user?.role as Role | undefined
  const grouped    = role ? groupedNavByRole[role] : undefined
  const flatItems  = role ? flatNavByRole[role] : undefined

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
    <div className="flex h-dvh overflow-hidden">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col w-[220px] h-full transition-transform duration-200 md:relative md:translate-x-0 md:z-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ backgroundColor: 'var(--color-dark)' }}
      >
        {/* Logo */}
        <div className="h-[60px] flex items-center px-5 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <img src={fecosLogo} alt="FECOS" className="h-7 object-contain" />
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-0.5">
          {grouped ? (
            <GroupedSidebarNav entries={grouped} onNavigate={() => setSidebarOpen(false)} />
          ) : flatItems ? (
            <FlatSidebarNav items={flatItems} onNavigate={() => setSidebarOpen(false)} />
          ) : null}
        </nav>

        {/* User footer */}
        <div className="px-2.5 py-3 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
              style={{ backgroundColor: 'rgba(255,255,255,0.12)', color: 'var(--color-accent)' }}
            >
              {userInitials(user?.fullName)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold truncate leading-tight" style={{ color: 'var(--color-accent)' }}>
                {user?.fullName}
              </p>
              <p className="text-[10px] mt-0.5 truncate" style={{ color: 'rgba(203,213,225,0.45)' }}>
                {user?.role?.replace(/_/g, ' ')}
              </p>
            </div>
            <button
              onClick={() => { logout(); if (isImpersonated) window.location.href = 'https://console.fecoserp.com' }}
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
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        {/* Mobile top bar */}
        <div
          className="h-[60px] flex items-center px-4 gap-3 shrink-0 md:hidden"
          style={{ backgroundColor: 'var(--color-dark)' }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-white/70 hover:text-white transition-colors"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <img src={fecosLogo} alt="FECOS" className="h-6 object-contain" />
        </div>

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
