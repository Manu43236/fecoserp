import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  ChevronRight, AlertTriangle, FlaskConical, RefreshCw,
  Users, Waves, Container, ArrowRight, Truck, Flag,
  CalendarDays, Activity, Package, FileText, Sparkles, ClipboardList,
} from 'lucide-react'
import { dashboardApi, type DashboardStats } from '@/api/dashboard'
import { tanksApi, type TankRecord } from '@/api/tanks'

function todayLabel() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}
function tankColor(pct: number) {
  return pct >= 60 ? '#10b981' : pct >= 30 ? '#f59e0b' : '#ef4444'
}
function tankFill(pct: number) {
  return pct >= 60 ? 'rgba(16,185,129,0.15)' : pct >= 30 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)'
}

// ── mini cylinder ─────────────────────────────────────────────────────────────
function MiniCylinder({ tank, onClick }: { tank: TankRecord; onClick: () => void }) {
  const pct   = Math.min(Math.max(tank.calculatedLevelPct, 0), 100)
  const color = tankColor(pct)
  const fill  = tankFill(pct)
  const bW = 32, bH = 52, cx = 20, ry = 5, topY = 6, botY = topY + bH
  const fH = (bH * pct) / 100
  const fY = botY - fH
  return (
    <button onClick={onClick}
      className="flex flex-col items-center gap-1 p-2.5 rounded-xl bg-white border hover:border-gray-300 transition-colors shrink-0"
      style={{ borderColor: `${color}55`, minWidth: 72 }}>
      <svg width="40" height="68" viewBox="0 0 40 68">
        <defs><clipPath id={`c-${tank.id}`}><rect x={cx - bW/2} y={topY} width={bW} height={bH}/></clipPath></defs>
        <rect x={cx-bW/2} y={topY} width={bW} height={bH} fill="#f9fafb" stroke="#e5e7eb" strokeWidth="1.5"/>
        {fH > 0 && <rect x={cx-bW/2} y={fY} width={bW} height={fH} fill={fill} clipPath={`url(#c-${tank.id})`}/>}
        <ellipse cx={cx} cy={botY} rx={bW/2} ry={ry} fill={fH > 0 ? fill : '#f9fafb'} stroke="#e5e7eb" strokeWidth="1.5"/>
        <ellipse cx={cx} cy={topY} rx={bW/2} ry={ry} fill="#efefef" stroke="#e5e7eb" strokeWidth="1.5"/>
        <text x={cx} y={topY + bH/2 + 4} textAnchor="middle" fontSize="8.5" fontWeight="800" fill={color}>{pct.toFixed(0)}%</text>
      </svg>
      <span className="text-[9px] font-semibold text-gray-500 truncate max-w-[64px] text-center leading-tight">
        {tank.serialNumber ?? `${tank.capacityGallons}g`}
      </span>
      {tank.wellName && (
        <span className="text-[8px] text-gray-400 truncate max-w-[64px] text-center">{tank.wellName}</span>
      )}
    </button>
  )
}

// ── stat chip with icon ───────────────────────────────────────────────────────
function StatChip({
  value, label, urgent, icon: Icon, onClick,
}: { value: number; label: string; urgent?: boolean; icon: React.ElementType; onClick?: () => void }) {
  const isAlert = urgent && value > 0
  return (
    <button onClick={onClick} disabled={!onClick}
      className={`flex-1 flex flex-col items-center justify-center gap-2 py-5 rounded-2xl border transition-all
        ${onClick ? 'cursor-pointer' : 'cursor-default'}
        ${isAlert ? 'bg-red-50 border-red-200 hover:bg-red-100' : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm'}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center
        ${isAlert ? 'bg-red-100' : 'bg-gray-50'}`}>
        <Icon size={18} style={{ color: isAlert ? '#ef4444' : 'var(--color-primary)' }} />
      </div>
      <span className="text-3xl font-black tabular-nums leading-none"
        style={{ color: isAlert ? '#ef4444' : 'var(--color-primary)' }}>
        {value}
      </span>
      <span className={`text-[10px] font-semibold uppercase tracking-wide ${isAlert ? 'text-red-500' : 'text-gray-400'}`}>
        {label}
      </span>
    </button>
  )
}

// ── ops panel ─────────────────────────────────────────────────────────────────
function OpsPanel({ label, active, completed, total, onClick }:
  { label: string; active: number; completed: number; total: number; onClick: () => void }) {
  const pct        = total > 0 ? Math.round((completed / total) * 100) : 0
  const notStarted = Math.max(total - active - completed, 0)
  return (
    <button onClick={onClick}
      className="flex-1 bg-white border border-gray-100 rounded-2xl p-5 text-left hover:border-gray-200 hover:shadow-sm transition-all">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{label}</p>
        {total > 0 && (
          <span className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={{
              backgroundColor: pct === 100 ? '#d1fae5' : 'rgba(var(--color-primary-rgb,120,40,31),0.08)',
              color: pct === 100 ? '#059669' : 'var(--color-primary)',
            }}>
            {pct}% done
          </span>
        )}
      </div>
      {total === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <p className="text-sm text-gray-400">Nothing scheduled today</p>
          <p className="text-xs text-gray-300 mt-1">Will appear here once created</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-3 rounded-xl bg-gray-50">
              <p className="text-2xl font-black text-gray-900 tabular-nums">{active}</p>
              <p className="text-[10px] font-semibold text-gray-400 mt-0.5">In Progress</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-emerald-50">
              <p className="text-2xl font-black tabular-nums" style={{ color: '#10b981' }}>{completed}</p>
              <p className="text-[10px] font-semibold text-emerald-500 mt-0.5">Completed</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-gray-50">
              <p className="text-2xl font-black text-gray-400 tabular-nums">{notStarted}</p>
              <p className="text-[10px] font-semibold text-gray-400 mt-0.5">Not Started</p>
            </div>
          </div>
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, backgroundColor: pct === 100 ? '#10b981' : 'var(--color-primary)' }} />
          </div>
        </>
      )}
    </button>
  )
}

// ── action row ────────────────────────────────────────────────────────────────
function ActionRow({ count, label, sub, path, icon: Icon, urgent }:
  { count: number; label: string; sub: string; path: string; icon: React.ElementType; urgent?: boolean }) {
  const navigate = useNavigate()
  if (count === 0) return null
  return (
    <button onClick={() => navigate(path)}
      className={`w-full flex items-center gap-3 p-3.5 rounded-xl text-left transition-colors
        ${urgent ? 'bg-red-50 border border-red-200 hover:bg-red-100' : 'bg-amber-50 border border-amber-200 hover:bg-amber-100'}`}>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${urgent ? 'bg-red-500' : 'bg-amber-500'}`}>
        <Icon size={16} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold ${urgent ? 'text-red-800' : 'text-amber-800'}`}>{count} {label}</p>
        <p className={`text-xs ${urgent ? 'text-red-500' : 'text-amber-600'}`}>{sub}</p>
      </div>
      <ChevronRight size={15} className={urgent ? 'text-red-400' : 'text-amber-400'} />
    </button>
  )
}

// ── tank health bar ───────────────────────────────────────────────────────────
function TankHealthBar({ critical, warning, healthy }: { critical: number; warning: number; healthy: number }) {
  const total = critical + warning + healthy
  if (total === 0) return null
  return (
    <div className="flex rounded-full overflow-hidden h-2 w-full">
      {critical > 0 && <div style={{ flex: critical, backgroundColor: '#ef4444' }} />}
      {warning  > 0 && <div style={{ flex: warning,  backgroundColor: '#f59e0b' }} />}
      {healthy  > 0 && <div style={{ flex: healthy,  backgroundColor: '#10b981' }} />}
    </div>
  )
}

// ── skeleton ──────────────────────────────────────────────────────────────────
function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-gray-100 rounded-2xl animate-pulse ${className ?? ''}`} />
}

// ── welcome / empty state ─────────────────────────────────────────────────────
function WelcomeDashboard() {
  const navigate = useNavigate()

  const steps = [
    { num: 1, icon: Users,     title: 'Add Clients',    desc: 'Operators and companies you service',       path: '/clients' },
    { num: 2, icon: Waves,     title: 'Add Wells',      desc: 'Link each well to a client and lease',      path: '/wells'   },
    { num: 3, icon: Container, title: 'Install Tanks',  desc: 'Track fluid levels in real time',           path: '/tanks'   },
  ]

  const features = [
    { icon: FlaskConical,  label: 'Lab Management'   },
    { icon: Activity,      label: 'Treatment Plans'  },
    { icon: Truck,         label: 'Dispatch & Routes'},
    { icon: ClipboardList, label: 'SOAR Reports'     },
    { icon: Package,       label: 'Inventory'        },
    { icon: FileText,      label: '10+ Reports'      },
  ]

  return (
    <div className="px-8 py-6 max-w-5xl mx-auto space-y-6">

      {/* Hero banner */}
      <div className="rounded-2xl p-8 text-white relative overflow-hidden" style={{ backgroundColor: 'var(--color-primary)' }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, white 0%, transparent 60%)' }} />
        <div className="relative flex items-start justify-between gap-8">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} className="opacity-70" />
              <span className="text-xs font-semibold opacity-70 uppercase tracking-widest">Welcome to FECOS</span>
            </div>
            <h2 className="text-2xl font-black mb-2 leading-tight">
              Your field operations<br />platform is ready.
            </h2>
            <p className="text-sm opacity-70 max-w-sm leading-relaxed">
              Complete field ops — lab management, treatment plans, tank monitoring, SOAR reporting, dispatch, inventory, and more. Online and offline.
            </p>
          </div>
          <div className="hidden md:flex flex-wrap gap-2 max-w-[240px] self-center">
            {features.map(({ icon: Icon, label }) => (
              <div key={label}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold"
                style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
                <Icon size={11} />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Setup steps */}
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Get started — 3 steps</p>
        <div className="grid grid-cols-3 gap-4">
          {steps.map(({ num, icon: Icon, title, desc, path }) => (
            <button key={num} onClick={() => navigate(path)}
              className="bg-white border border-gray-100 rounded-2xl p-6 text-left hover:border-gray-300 hover:shadow-md transition-all group">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black text-white shrink-0"
                  style={{ backgroundColor: 'var(--color-primary)' }}>
                  {num}
                </div>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-gray-50">
                  <Icon size={15} className="text-gray-500" />
                </div>
              </div>
              <p className="text-sm font-bold text-gray-900 mb-1">{title}</p>
              <p className="text-xs text-gray-400 leading-relaxed mb-4">{desc}</p>
              <div className="flex items-center gap-1 text-xs font-bold" style={{ color: 'var(--color-primary)' }}>
                Go to {title}
                <ArrowRight size={11} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Quick links */}
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Explore the platform</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: ClipboardList, label: 'Schedule & Service Visits', path: '/schedule', desc: 'Plan and track field service' },
            { icon: Truck,         label: 'Routes & Dispatch',         path: '/routes',   desc: 'Driver routes with offline delivery' },
            { icon: FlaskConical,  label: 'Lab & Chemistry',           path: '/lab/queue',desc: 'QC samples and results' },
          ].map(({ icon: Icon, label, path, desc }) => (
            <button key={label} onClick={() => navigate(path)}
              className="bg-white border border-gray-100 rounded-xl p-4 text-left hover:border-gray-200 hover:shadow-sm transition-all group flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: 'rgba(var(--color-primary-rgb,120,40,31),0.08)' }}>
                <Icon size={16} style={{ color: 'var(--color-primary)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 leading-tight">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
              </div>
              <ChevronRight size={13} className="text-gray-300 group-hover:text-gray-400 shrink-0 transition-colors" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── page ──────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const navigate = useNavigate()

  const { data, isLoading, dataUpdatedAt, refetch, isFetching } = useQuery({
    queryKey: ['dashboard'],
    queryFn:  () => dashboardApi.get().then(r => r.data.data!),
    refetchInterval: 60_000,
  })

  const { data: tanksData, isLoading: tanksLoading } = useQuery({
    queryKey: ['tanks-dashboard'],
    queryFn:  () => tanksApi.list({ size: 5000 }).then(r => r.data.data?.content ?? []),
    refetchInterval: 60_000,
  })

  const stats: DashboardStats = data ?? {
    totalClients: 0, activeVisitsToday: 0, completedVisitsToday: 0,
    activeRoutesToday: 0, completedRoutesToday: 0,
    labPending: 0, labCompleted: 0, soarFlagsUnacknowledged: 0,
    totalWells: 0, totalTanks: 0,
  }

  const tanks     = (tanksData ?? []) as TankRecord[]
  const installed = tanks.filter(t => t.status === 'INSTALLED')
  const critical  = installed.filter(t => t.calculatedLevelPct < 30)
  const warning   = installed.filter(t => t.calculatedLevelPct >= 30 && t.calculatedLevelPct < 60)
  const healthy   = installed.filter(t => t.calculatedLevelPct >= 60)
  const atRisk    = [...critical, ...warning].sort((a, b) => a.calculatedLevelPct - b.calculatedLevelPct)

  const visitTotal  = stats.activeVisitsToday + stats.completedVisitsToday
  const routeTotal  = stats.activeRoutesToday + stats.completedRoutesToday
  const hasActions  = stats.soarFlagsUnacknowledged > 0 || stats.labPending > 0
  const isEmpty     = !isLoading && stats.totalClients === 0 && stats.totalWells === 0 && stats.totalTanks === 0

  const updatedTime = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-8 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-black text-gray-900 tracking-tight">Field Operations Center</h1>
            <p className="text-xs text-gray-400 mt-0.5">{todayLabel()}</p>
          </div>
          <button onClick={() => refetch()}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors">
            <RefreshCw size={11} className={isFetching ? 'animate-spin' : ''} />
            {updatedTime ? `Updated ${updatedTime}` : 'Refreshing…'}
          </button>
        </div>
      </div>

      {/* Empty / onboarding state */}
      {isEmpty && <WelcomeDashboard />}

      {/* Operational dashboard */}
      {!isEmpty && (
        <div className="px-8 py-6 max-w-5xl mx-auto space-y-6">

          {/* Stat chips */}
          {isLoading ? (
            <div className="grid grid-cols-4 gap-3">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
            </div>
          ) : (
            <div className="flex gap-3">
              <StatChip value={stats.activeVisitsToday}        label="Visits Active"    icon={CalendarDays} onClick={() => navigate('/schedule')} />
              <StatChip value={stats.activeRoutesToday}         label="Deliveries Active" icon={Truck}       onClick={() => navigate('/routes')}   />
              <StatChip value={critical.length}                label="Critical Tanks"  icon={AlertTriangle} urgent onClick={() => navigate('/tanks')}    />
              <StatChip value={stats.soarFlagsUnacknowledged}  label="SOAR Flags"      icon={Flag}          urgent onClick={() => navigate('/schedule')} />
            </div>
          )}

          {/* Needs action */}
          {!isLoading && hasActions && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Needs Action</p>
              <ActionRow count={stats.soarFlagsUnacknowledged} label={`SOAR flag${stats.soarFlagsUnacknowledged !== 1 ? 's' : ''} unacknowledged`}
                sub="Open service visits to review and acknowledge" path="/schedule" icon={AlertTriangle} urgent />
              <ActionRow count={stats.labPending} label={`lab sample${stats.labPending !== 1 ? 's' : ''} pending`}
                sub="Results need to be entered or reviewed" path="/lab/queue" icon={FlaskConical} />
            </div>
          )}

          {/* Today's operations */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Today's Operations</p>
            {isLoading ? (
              <div className="flex gap-4"><Skeleton className="flex-1 h-44" /><Skeleton className="flex-1 h-44" /></div>
            ) : (
              <div className="flex gap-4">
                <OpsPanel label="Service Visits" active={stats.activeVisitsToday}  completed={stats.completedVisitsToday} total={visitTotal} onClick={() => navigate('/schedule')} />
                <OpsPanel label="Deliveries"     active={stats.activeRoutesToday}  completed={stats.completedRoutesToday} total={routeTotal} onClick={() => navigate('/routes')}   />
              </div>
            )}
          </div>

          {/* Tank health */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tank Health</p>
              <button onClick={() => navigate('/tanks')}
                className="text-[10px] font-semibold flex items-center gap-1" style={{ color: 'var(--color-primary)' }}>
                All tanks <ChevronRight size={11} />
              </button>
            </div>
            {tanksLoading ? <Skeleton className="h-28" /> : (
              <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4">
                <div className="flex gap-4">
                  {[
                    { count: critical.length, label: 'Critical <30%',  color: '#ef4444' },
                    { count: warning.length,  label: 'Warning 30–60%', color: '#f59e0b' },
                    { count: healthy.length,  label: 'Healthy >60%',   color: '#10b981' },
                  ].map(({ count, label, color }, i) => (
                    <>
                      {i > 0 && <div key={`d${i}`} className="w-px bg-gray-100" />}
                      <div key={label} className="flex-1 text-center">
                        <p className="text-2xl font-black tabular-nums" style={{ color }}>{count}</p>
                        <p className="text-[10px] font-semibold text-gray-400 mt-0.5">{label}</p>
                      </div>
                    </>
                  ))}
                </div>
                <TankHealthBar critical={critical.length} warning={warning.length} healthy={healthy.length} />
                {atRisk.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pt-1 pb-0.5">
                    {atRisk.map(t => <MiniCylinder key={t.id} tank={t} onClick={() => navigate('/tanks')} />)}
                  </div>
                )}
                {installed.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-2">No tanks currently installed</p>
                )}
              </div>
            )}
          </div>

          {/* Assets */}
          {!isLoading && (
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Assets</p>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Clients',        value: stats.totalClients,  path: '/clients'      },
                  { label: 'Wells',          value: stats.totalWells,    path: '/wells'        },
                  { label: 'Tanks',          value: stats.totalTanks,    path: '/tanks'        },
                  { label: 'Lab Done Today', value: stats.labCompleted,  path: '/lab/results'  },
                ].map(({ label, value, path }) => (
                  <button key={label} onClick={() => navigate(path)}
                    className="bg-white border border-gray-100 rounded-xl p-4 text-left hover:border-gray-200 hover:shadow-sm transition-all">
                    <p className="text-2xl font-black text-gray-900 tabular-nums">{value}</p>
                    <p className="text-[10px] font-semibold text-gray-400 mt-1">{label}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  )
}
