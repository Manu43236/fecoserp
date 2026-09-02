import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, ChevronRight } from 'lucide-react'
import { dashboardApi, type DashboardStats } from '@/api/dashboard'
import { tanksApi, type TankRecord } from '@/api/tanks'
import { useAuthStore } from '@/store/authStore'

// ── custom field-ops SVG icons ────────────────────────────────────────────────
function IconClients() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
      <rect x="3" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.8"/>
      <rect x="13" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.8"/>
      <rect x="3" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.8"/>
      <rect x="13" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.8"/>
    </svg>
  )
}

function IconWell() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
      <line x1="12" y1="2" x2="12" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M5 8 L12 4 L19 8 L19 10 L5 10 Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
      <rect x="10" y="10" width="4" height="10" rx="1" stroke="currentColor" strokeWidth="1.8"/>
      <line x1="7" y1="20" x2="17" y2="20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="7" y1="14" x2="10" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="14" y1="14" x2="17" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function IconTank() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
      <ellipse cx="12" cy="6" rx="7" ry="2.5" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M5 6 L5 18" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M19 6 L19 18" stroke="currentColor" strokeWidth="1.8"/>
      <ellipse cx="12" cy="18" rx="7" ry="2.5" stroke="currentColor" strokeWidth="1.8"/>
      <line x1="12" y1="3.5" x2="12" y2="2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="9" y1="11" x2="15" y2="11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="2 2"/>
    </svg>
  )
}

function IconLab() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
      <path d="M9 3 L9 13 L4 20 L20 20 L15 13 L15 3" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round"/>
      <line x1="7.5" y1="3" x2="16.5" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="10" cy="16" r="1.2" fill="currentColor"/>
      <circle cx="14" cy="17.5" r="0.8" fill="currentColor"/>
      <circle cx="12" cy="15" r="0.7" fill="currentColor"/>
    </svg>
  )
}

function IconServiceVisit() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l2.3-2.3a6 6 0 0 1-7.4 7.4L5 21.9a2.12 2.12 0 0 1-3-3L9.3 11.7a6 6 0 0 1 7.4-7.4z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function IconTruck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
      <path d="M1 3h13v13H1z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
      <path d="M14 8h4l3 3v5h-7V8z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
      <circle cx="5.5" cy="18.5" r="2.5" stroke="currentColor" strokeWidth="1.8"/>
      <circle cx="18.5" cy="18.5" r="2.5" stroke="currentColor" strokeWidth="1.8"/>
    </svg>
  )
}

// ── mini cylinder for critical tanks strip ────────────────────────────────────
function MiniTank({ tank, onClick }: { tank: TankRecord; onClick: () => void }) {
  const pct = tank.calculatedLevelPct
  const color = pct >= 60 ? '#10b981' : pct >= 30 ? '#f59e0b' : '#ef4444'
  const fillAlpha = pct >= 60 ? 'rgba(16,185,129,0.25)' : pct >= 30 ? 'rgba(245,158,11,0.25)' : 'rgba(239,68,68,0.25)'
  const clamped = Math.min(Math.max(pct, 0), 100)
  const bodyH = 56, bodyW = 36, cx = 24, ry = 5, bodyTopY = 8, bodyBotY = bodyTopY + bodyH
  const fillH = (bodyH * clamped) / 100
  const fillTopY = bodyBotY - fillH

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 p-3 rounded-xl border bg-white hover:shadow-md transition-shadow shrink-0"
      style={{ borderColor: `${color}44`, minWidth: 80 }}
    >
      <svg width="48" height="80" viewBox="0 0 48 80">
        <defs><clipPath id={`mc-${tank.id}`}><rect x={cx - bodyW/2} y={bodyTopY} width={bodyW} height={bodyH}/></clipPath></defs>
        <rect x={cx - bodyW/2} y={bodyTopY} width={bodyW} height={bodyH} fill="#f9fafb" stroke="#e5e7eb" strokeWidth="1.5"/>
        <rect x={cx - bodyW/2} y={fillTopY} width={bodyW} height={fillH} fill={fillAlpha} clipPath={`url(#mc-${tank.id})`}/>
        <ellipse cx={cx} cy={bodyBotY} rx={bodyW/2} ry={ry} fill={clamped > 0 ? fillAlpha : '#f9fafb'} stroke="#e5e7eb" strokeWidth="1.5"/>
        <ellipse cx={cx} cy={bodyTopY} rx={bodyW/2} ry={ry} fill="#f0f0f0" stroke="#e5e7eb" strokeWidth="1.5"/>
        <text x={cx} y={bodyTopY + bodyH/2 + 4} textAnchor="middle" fontSize="9" fontWeight="700" fill={color}>{clamped.toFixed(0)}%</text>
      </svg>
      <span className="text-[10px] font-semibold text-gray-500 text-center leading-tight max-w-[70px] truncate">
        {tank.serialNumber ?? `${tank.capacityGallons}gal`}
      </span>
      {tank.wellName && (
        <span className="text-[9px] text-gray-400 truncate max-w-[70px]">{tank.wellName}</span>
      )}
    </button>
  )
}

// ── donut arc for field activity ───────────────────────────────────────────────
function DonutArc({ pct }: { pct: number }) {
  const r = 28, cx = 36, cy = 36
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <svg width="72" height="72" viewBox="0 0 72 72">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f6" strokeWidth="7"/>
      <circle cx={cx} cy={cy} r={r} fill="none"
        stroke={pct === 100 ? '#10b981' : 'var(--color-primary)'}
        strokeWidth="7"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: 'stroke-dasharray 1s ease' }}
      />
      <text x={cx} y={cy + 5} textAnchor="middle" fontSize="13" fontWeight="700"
        fill={pct === 100 ? '#10b981' : 'var(--color-primary)'}>
        {pct}%
      </text>
    </svg>
  )
}

function SkeletonBlock({ h = 'h-24' }: { h?: string }) {
  return <div className={`bg-gray-100 rounded-2xl ${h} animate-pulse`} />
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function todayLabel() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

// ── page ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const firstName = user?.fullName?.split(' ')[0] ?? 'there'

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardApi.get().then(r => r.data.data!),
    refetchInterval: 60_000,
  })

  const { data: tanksData } = useQuery({
    queryKey: ['tanks-dashboard'],
    queryFn: () => tanksApi.list({ size: 5000 }).then(r => r.data.data?.content ?? []),
    refetchInterval: 60_000,
  })

  const stats: DashboardStats = data ?? {
    totalClients: 0, activeVisitsToday: 0, completedVisitsToday: 0,
    activeRoutesToday: 0, completedRoutesToday: 0,
    labPending: 0, labCompleted: 0, soarFlagsUnacknowledged: 0,
    totalWells: 0, totalTanks: 0,
  }

  const allTanks = (tanksData ?? []) as TankRecord[]
  const criticalTanks = allTanks.filter(t => t.status === 'INSTALLED' && t.calculatedLevelPct < 60)
    .sort((a, b) => a.calculatedLevelPct - b.calculatedLevelPct)

  const visitTotal = stats.activeVisitsToday + stats.completedVisitsToday
  const visitPct   = visitTotal > 0 ? Math.round((stats.completedVisitsToday / visitTotal) * 100) : 0
  const routeTotal = stats.activeRoutesToday + stats.completedRoutesToday
  const routePct   = routeTotal > 0 ? Math.round((stats.completedRoutesToday / routeTotal) * 100) : 0

  const hasAlerts = stats.soarFlagsUnacknowledged > 0

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Header ── */}
      <div className="px-8 py-6" style={{ background: 'var(--color-primary)' }}>
        <div className="max-w-6xl mx-auto flex items-end justify-between">
          <div>
            <p className="text-sm font-medium mb-1" style={{ color: 'rgba(255,255,255,0.65)' }}>{todayLabel()}</p>
            <h1 className="text-2xl font-bold text-white">{greeting()}, {firstName}</h1>
          </div>
          <div className="text-right hidden md:block">
            <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.65)' }}>Field Pulse</p>
            <p className="text-sm font-semibold text-white">
              {stats.activeVisitsToday} visits · {stats.activeRoutesToday} deliveries
              {hasAlerts ? ` · ${stats.soarFlagsUnacknowledged} alert${stats.soarFlagsUnacknowledged !== 1 ? 's' : ''}` : ''}
            </p>
          </div>
        </div>
      </div>

      <div className="px-8 py-6 max-w-6xl mx-auto space-y-6">

        {/* ── Alert bar ── */}
        {!isLoading && hasAlerts && (
          <button
            onClick={() => navigate('/field-activity')}
            className="w-full flex items-center gap-4 bg-red-50 border border-red-200 rounded-2xl p-4 hover:bg-red-100 transition-colors text-left"
          >
            <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center shrink-0">
              <AlertTriangle size={18} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-red-800">
                {stats.soarFlagsUnacknowledged} SOAR flag{stats.soarFlagsUnacknowledged !== 1 ? 's' : ''} need acknowledgment
              </p>
              <p className="text-xs text-red-500 mt-0.5">Tap to open Field Activity and review</p>
            </div>
            <ChevronRight size={16} className="text-red-400 shrink-0" />
          </button>
        )}

        {/* ── Core metrics ── */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <SkeletonBlock key={i} h="h-32" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Clients',     value: stats.totalClients,  Icon: IconClients,  path: '/clients' },
              { label: 'Wells',       value: stats.totalWells,    Icon: IconWell,     path: '/wells' },
              { label: 'Tanks',       value: stats.totalTanks,    Icon: IconTank,     path: '/tanks' },
              { label: 'Lab Pending', value: stats.labPending,    Icon: IconLab,      path: '/lab/queue',
                sub: stats.labCompleted > 0 ? `${stats.labCompleted} done` : undefined,
                urgent: stats.labPending > 0 },
            ].map(({ label, value, Icon, path, sub, urgent }) => (
              <button
                key={label}
                onClick={() => navigate(path)}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-left hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-white"
                    style={{ backgroundColor: urgent ? '#f59e0b' : 'var(--color-primary)' }}
                  >
                    <Icon />
                  </div>
                  {sub && (
                    <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-gray-50 text-gray-400">{sub}</span>
                  )}
                </div>
                <p className="text-3xl font-black text-gray-900 tabular-nums">{value}</p>
                <p className="text-xs font-medium text-gray-400 mt-1">{label}</p>
              </button>
            ))}
          </div>
        )}

        {/* ── Field activity ── */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SkeletonBlock h="h-40" />
            <SkeletonBlock h="h-40" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                label: 'Service Visits', Icon: IconServiceVisit,
                active: stats.activeVisitsToday, completed: stats.completedVisitsToday,
                pct: visitPct, path: '/field-activity',
              },
              {
                label: 'Deliveries', Icon: IconTruck,
                active: stats.activeRoutesToday, completed: stats.completedRoutesToday,
                pct: routePct, path: '/deliveries',
              },
            ].map(({ label, Icon, active, completed, pct, path }) => (
              <button
                key={label}
                onClick={() => navigate(path)}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-left hover:shadow-md transition-all flex items-center gap-5"
              >
                <DonutArc pct={pct} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: 'var(--color-primary)' }}>
                      <Icon />
                    </div>
                    <span className="text-sm font-bold text-gray-800">{label}</span>
                  </div>
                  <div className="flex gap-6">
                    <div>
                      <p className="text-2xl font-black text-gray-900 tabular-nums">{active}</p>
                      <p className="text-[11px] font-medium text-gray-400">Active</p>
                    </div>
                    <div className="w-px bg-gray-100" />
                    <div>
                      <p className="text-2xl font-black tabular-nums" style={{ color: completed > 0 ? '#10b981' : '#9ca3af' }}>{completed}</p>
                      <p className="text-[11px] font-medium text-gray-400">Done today</p>
                    </div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-300 shrink-0" />
              </button>
            ))}
          </div>
        )}

        {/* ── Critical tanks strip ── */}
        {criticalTanks.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                {criticalTanks.filter(t => t.calculatedLevelPct < 30).length > 0
                  ? '⚠ Critical Tanks — Needs Attention'
                  : 'Tanks Below 60%'}
              </p>
              <button
                onClick={() => navigate('/tanks')}
                className="text-xs font-semibold flex items-center gap-1"
                style={{ color: 'var(--color-primary)' }}
              >
                View all <ChevronRight size={13} />
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {criticalTanks.map(t => (
                <MiniTank key={t.id} tank={t} onClick={() => navigate('/tanks')} />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
