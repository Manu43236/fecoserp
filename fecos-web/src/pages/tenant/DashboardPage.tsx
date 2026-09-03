import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle, FlaskConical, RefreshCw, Truck, Flag,
  CalendarDays, Sparkles, ClipboardList, ArrowUpRight,
  Users, Waves, Container, FileText, Package, Activity,
  ChevronRight,
} from 'lucide-react'
import { dashboardApi, type DashboardStats } from '@/api/dashboard'
import { tanksApi, type TankRecord } from '@/api/tanks'

function todayLabel() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}
function tankColor(pct: number) { return pct >= 60 ? '#10b981' : pct >= 30 ? '#f59e0b' : '#ef4444' }
function tankFill(pct: number)  { return pct >= 60 ? 'rgba(16,185,129,0.15)' : pct >= 30 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)' }

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
        <defs><clipPath id={`c-${tank.id}`}><rect x={cx-bW/2} y={topY} width={bW} height={bH}/></clipPath></defs>
        <rect x={cx-bW/2} y={topY} width={bW} height={bH} fill="#f9fafb" stroke="#e5e7eb" strokeWidth="1.5"/>
        {fH > 0 && <rect x={cx-bW/2} y={fY} width={bW} height={fH} fill={fill} clipPath={`url(#c-${tank.id})`}/>}
        <ellipse cx={cx} cy={botY} rx={bW/2} ry={ry} fill={fH > 0 ? fill : '#f9fafb'} stroke="#e5e7eb" strokeWidth="1.5"/>
        <ellipse cx={cx} cy={topY} rx={bW/2} ry={ry} fill="#efefef" stroke="#e5e7eb" strokeWidth="1.5"/>
        <text x={cx} y={topY+bH/2+4} textAnchor="middle" fontSize="8.5" fontWeight="800" fill={color}>{pct.toFixed(0)}%</text>
      </svg>
      <span className="text-[9px] font-semibold text-gray-500 truncate max-w-[64px] text-center leading-tight">
        {tank.serialNumber ?? `${tank.capacityGallons}g`}
      </span>
      {tank.wellName && <span className="text-[8px] text-gray-400 truncate max-w-[64px] text-center">{tank.wellName}</span>}
    </button>
  )
}

// ── dark metric card ──────────────────────────────────────────────────────────
function MetricCard({
  value, label, icon: Icon, gradient, onClick,
}: { value: number; label: string; icon: React.ElementType; gradient: string; onClick?: () => void }) {
  return (
    <button onClick={onClick}
      className="flex-1 rounded-2xl p-5 text-left group transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
      style={{ background: gradient }}>
      <div className="flex items-start justify-between mb-5">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
          <Icon size={16} className="text-white" />
        </div>
        <ArrowUpRight size={13} className="text-white/20 group-hover:text-white/50 transition-colors mt-0.5" />
      </div>
      <p className="text-5xl font-black text-white tabular-nums leading-none">{value}</p>
      <p className="text-[11px] font-bold text-white/55 mt-2.5 uppercase tracking-widest">{label}</p>
    </button>
  )
}

// ── ops card ──────────────────────────────────────────────────────────────────
function OpsCard({ label, active, completed, total, onClick }:
  { label: string; active: number; completed: number; total: number; onClick: () => void }) {
  const pct     = total > 0 ? Math.round((completed / total) * 100) : 0
  const pending = Math.max(total - active - completed, 0)
  return (
    <button onClick={onClick}
      className="flex-1 bg-white border border-gray-200 rounded-2xl p-5 text-left hover:border-gray-300 hover:shadow-sm transition-all">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-bold text-gray-900">{label}</p>
        {total > 0 && (
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full"
            style={{ backgroundColor: pct === 100 ? '#d1fae5' : '#dbeafe', color: pct === 100 ? '#065f46' : '#1e40af' }}>
            {pct}% done
          </span>
        )}
      </div>
      {total === 0 ? (
        <p className="text-sm text-gray-400 pb-1">No activity today</p>
      ) : (
        <>
          <div className="flex gap-2 mb-3">
            {[
              { n: active,    lbl: 'Active',  bg: '#eff6ff', col: '#1d4ed8' },
              { n: completed, lbl: 'Done',    bg: '#ecfdf5', col: '#059669' },
              { n: pending,   lbl: 'Pending', bg: '#f9fafb', col: '#6b7280' },
            ].map(({ n, lbl, bg, col }) => (
              <div key={lbl} className="flex-1 rounded-xl p-2.5 text-center" style={{ backgroundColor: bg }}>
                <p className="text-xl font-black tabular-nums" style={{ color: col }}>{n}</p>
                <p className="text-[10px] font-semibold mt-0.5" style={{ color: col, opacity: 0.7 }}>{lbl}</p>
              </div>
            ))}
          </div>
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, backgroundColor: pct === 100 ? '#10b981' : '#1E3A5F' }} />
          </div>
        </>
      )}
    </button>
  )
}

// ── action alert ──────────────────────────────────────────────────────────────
function ActionAlert({ count, label, sub, path, icon: Icon, urgent }:
  { count: number; label: string; sub: string; path: string; icon: React.ElementType; urgent?: boolean }) {
  const navigate = useNavigate()
  if (count === 0) return null
  return (
    <button onClick={() => navigate(path)}
      className={`w-full flex items-center gap-3 p-3.5 rounded-xl text-left transition-colors
        ${urgent ? 'bg-red-50 border border-red-200 hover:bg-red-100' : 'bg-amber-50 border border-amber-100 hover:bg-amber-100'}`}>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${urgent ? 'bg-red-500' : 'bg-amber-500'}`}>
        <Icon size={16} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold ${urgent ? 'text-red-800' : 'text-amber-800'}`}>{count} {label}</p>
        <p className={`text-xs ${urgent ? 'text-red-500' : 'text-amber-600'}`}>{sub}</p>
      </div>
      <ChevronRight size={15} className={urgent ? 'text-red-300' : 'text-amber-300'} />
    </button>
  )
}

// ── tank health bar ───────────────────────────────────────────────────────────
function TankHealthBar({ critical, warning, healthy }: { critical: number; warning: number; healthy: number }) {
  const total = critical + warning + healthy
  if (total === 0) return null
  return (
    <div className="flex rounded-full overflow-hidden h-2 w-full bg-gray-100">
      {critical > 0 && <div style={{ flex: critical, backgroundColor: '#ef4444' }} />}
      {warning  > 0 && <div style={{ flex: warning,  backgroundColor: '#f59e0b' }} />}
      {healthy  > 0 && <div style={{ flex: healthy,  backgroundColor: '#10b981' }} />}
    </div>
  )
}

// ── skeleton ──────────────────────────────────────────────────────────────────
function Sk({ className }: { className?: string }) {
  return <div className={`bg-gray-200/70 rounded-2xl animate-pulse ${className ?? ''}`} />
}

// ── welcome (zero state) ──────────────────────────────────────────────────────
function WelcomeDashboard() {
  const navigate = useNavigate()
  const steps = [
    { n: 1, icon: Users,     title: 'Add Clients',   desc: 'Operators and companies you service', path: '/clients' },
    { n: 2, icon: Waves,     title: 'Add Wells',     desc: 'Link each well to a client lease',    path: '/wells'   },
    { n: 3, icon: Container, title: 'Install Tanks', desc: 'Monitor fluid levels in real time',   path: '/tanks'   },
  ]
  const chips = [
    { icon: FlaskConical,  l: 'Lab Management'    },
    { icon: Activity,      l: 'Treatment Plans'   },
    { icon: Truck,         l: 'Dispatch & Routes' },
    { icon: ClipboardList, l: 'SOAR Reports'      },
    { icon: Package,       l: 'Inventory'         },
    { icon: FileText,      l: '10+ Reports'       },
  ]
  return (
    <div className="px-8 py-6 max-w-5xl mx-auto space-y-6">
      <div className="rounded-2xl p-8 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1E3A5F 0%, #0f2341 100%)' }}>
        <div className="absolute right-0 top-0 bottom-0 w-64 opacity-10"
          style={{ background: 'radial-gradient(ellipse at right, white, transparent)' }} />
        <div className="relative flex items-start justify-between gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={13} className="opacity-60" />
              <span className="text-[11px] font-bold opacity-60 uppercase tracking-widest">Welcome to FECOS</span>
            </div>
            <h2 className="text-3xl font-black mb-3 leading-tight">Your platform is ready.</h2>
            <p className="text-sm opacity-65 max-w-sm leading-relaxed">
              Complete field ops — lab, treatment plans, tank monitoring, SOAR, dispatch, inventory. Online and offline.
            </p>
          </div>
          <div className="hidden md:flex flex-wrap gap-2 max-w-[220px]">
            {chips.map(({ icon: Icon, l }) => (
              <div key={l} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold"
                style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}>
                <Icon size={10} />{l}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Get started — 3 steps</p>
        <div className="grid grid-cols-3 gap-4">
          {steps.map(({ n, icon: Icon, title, desc, path }) => (
            <button key={n} onClick={() => navigate(path)}
              className="bg-white border border-gray-200 rounded-2xl p-6 text-left hover:border-gray-300 hover:shadow-md transition-all group">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black text-white shrink-0"
                  style={{ backgroundColor: '#1E3A5F' }}>{n}</div>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-slate-50">
                  <Icon size={15} className="text-slate-500" />
                </div>
              </div>
              <p className="text-sm font-bold text-gray-900 mb-1">{title}</p>
              <p className="text-xs text-gray-400 leading-relaxed mb-4">{desc}</p>
              <div className="flex items-center gap-1 text-xs font-bold" style={{ color: '#1E3A5F' }}>
                Go to {title} <ArrowUpRight size={11} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
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

  const visitTotal = stats.activeVisitsToday + stats.completedVisitsToday
  const routeTotal = stats.activeRoutesToday + stats.completedRoutesToday
  const hasActions = stats.soarFlagsUnacknowledged > 0 || stats.labPending > 0
  const isEmpty    = !isLoading && stats.totalClients === 0 && stats.totalWells === 0 && stats.totalTanks === 0

  const updatedTime = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : null

  // asset tile accent colors
  const assetTiles = [
    { label: 'Clients',        value: stats.totalClients, path: '/clients',     accent: '#1E3A5F' },
    { label: 'Wells',          value: stats.totalWells,   path: '/wells',       accent: '#0d9488' },
    { label: 'Tanks',          value: stats.totalTanks,   path: '/tanks',       accent: '#7c3aed' },
    { label: 'Lab Done Today', value: stats.labCompleted, path: '/lab/results', accent: '#0369a1' },
  ]

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f1f5f9' }}>

      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-black text-gray-900 tracking-tight">Field Operations Center</h1>
            <p className="text-xs text-gray-400 mt-0.5">{todayLabel()}</p>
          </div>
          <button onClick={() => refetch()}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors">
            <RefreshCw size={11} className={isFetching ? 'animate-spin' : ''} />
            {updatedTime ? `Updated ${updatedTime}` : 'Refreshing…'}
          </button>
        </div>
      </div>

      {/* ── Zero state ── */}
      {isEmpty && <WelcomeDashboard />}

      {/* ── Operational dashboard ── */}
      {!isEmpty && (
        <div className="px-8 py-6 max-w-5xl mx-auto space-y-5">

          {/* 4 dark metric cards */}
          {isLoading ? (
            <div className="flex gap-3">{[...Array(4)].map((_, i) => <Sk key={i} className="flex-1 h-36" />)}</div>
          ) : (
            <div className="flex gap-3">
              <MetricCard
                value={stats.activeVisitsToday}
                label="Visits Active"
                icon={CalendarDays}
                gradient="linear-gradient(135deg, #1E3A5F 0%, #0f2341 100%)"
                onClick={() => navigate('/schedule')}
              />
              <MetricCard
                value={stats.activeRoutesToday}
                label="Deliveries Active"
                icon={Truck}
                gradient="linear-gradient(135deg, #134e4a 0%, #0d3531 100%)"
                onClick={() => navigate('/routes')}
              />
              <MetricCard
                value={critical.length}
                label="Critical Tanks"
                icon={AlertTriangle}
                gradient={critical.length > 0
                  ? 'linear-gradient(135deg, #dc2626 0%, #7f1d1d 100%)'
                  : 'linear-gradient(135deg, #374151 0%, #1f2937 100%)'}
                onClick={() => navigate('/tanks')}
              />
              <MetricCard
                value={stats.soarFlagsUnacknowledged}
                label="SOAR Flags"
                icon={Flag}
                gradient={stats.soarFlagsUnacknowledged > 0
                  ? 'linear-gradient(135deg, #d97706 0%, #78350f 100%)'
                  : 'linear-gradient(135deg, #374151 0%, #1f2937 100%)'}
                onClick={() => navigate('/schedule')}
              />
            </div>
          )}

          {/* Needs action */}
          {!isLoading && hasActions && (
            <div className="space-y-2">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Needs Action</p>
              <ActionAlert count={stats.soarFlagsUnacknowledged}
                label={`SOAR flag${stats.soarFlagsUnacknowledged !== 1 ? 's' : ''} unacknowledged`}
                sub="Open service visits to review and acknowledge" path="/schedule" icon={AlertTriangle} urgent />
              <ActionAlert count={stats.labPending}
                label={`lab sample${stats.labPending !== 1 ? 's' : ''} pending`}
                sub="Results need to be entered or reviewed" path="/lab/queue" icon={FlaskConical} />
            </div>
          )}

          {/* Today's operations */}
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Today's Operations</p>
            {isLoading ? (
              <div className="flex gap-4"><Sk className="flex-1 h-40" /><Sk className="flex-1 h-40" /></div>
            ) : (
              <div className="flex gap-4">
                <OpsCard label="Service Visits" active={stats.activeVisitsToday}  completed={stats.completedVisitsToday} total={visitTotal} onClick={() => navigate('/schedule')} />
                <OpsCard label="Deliveries"     active={stats.activeRoutesToday}  completed={stats.completedRoutesToday} total={routeTotal} onClick={() => navigate('/routes')}   />
              </div>
            )}
          </div>

          {/* Tank health */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tank Health</p>
              <button onClick={() => navigate('/tanks')}
                className="text-[10px] font-bold flex items-center gap-1 text-slate-500 hover:text-slate-700 transition-colors">
                All tanks <ChevronRight size={11} />
              </button>
            </div>
            {tanksLoading ? <Sk className="h-28" /> : (
              <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
                <div className="flex">
                  {[
                    { count: critical.length, label: 'Critical <30%',  color: '#ef4444' },
                    { count: warning.length,  label: 'Warning 30–60%', color: '#f59e0b' },
                    { count: healthy.length,  label: 'Healthy >60%',   color: '#10b981' },
                  ].map(({ count, label, color }, i) => (
                    <div key={label} className={`flex-1 text-center ${i > 0 ? 'border-l border-gray-100' : ''}`}>
                      <p className="text-3xl font-black tabular-nums" style={{ color }}>{count}</p>
                      <p className="text-[10px] font-semibold text-gray-400 mt-1">{label}</p>
                    </div>
                  ))}
                </div>
                <TankHealthBar critical={critical.length} warning={warning.length} healthy={healthy.length} />
                {atRisk.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pt-1 pb-0.5">
                    {atRisk.map(t => <MiniCylinder key={t.id} tank={t} onClick={() => navigate('/tanks')} />)}
                  </div>
                )}
                {installed.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-1">No tanks installed — add tanks to monitor levels</p>
                )}
              </div>
            )}
          </div>

          {/* Asset counts */}
          {!isLoading && (
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Assets</p>
              <div className="grid grid-cols-4 gap-3">
                {assetTiles.map(({ label, value, path, accent }) => (
                  <button key={label} onClick={() => navigate(path)}
                    className="bg-white border border-gray-200 rounded-xl p-4 text-left hover:shadow-sm hover:border-gray-300 transition-all overflow-hidden relative group">
                    <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl transition-all group-hover:w-1.5"
                      style={{ backgroundColor: accent }} />
                    <p className="text-3xl font-black text-gray-900 tabular-nums pl-2">{value}</p>
                    <p className="text-[10px] font-bold text-gray-400 mt-1.5 pl-2 uppercase tracking-wide">{label}</p>
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
