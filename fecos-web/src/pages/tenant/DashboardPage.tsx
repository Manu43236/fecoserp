import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Building2, Drill, Cylinder, CalendarDays,
  PackageCheck, TestTube, AlertTriangle, CheckCircle2,
  TrendingUp, Activity,
} from 'lucide-react'
import { dashboardApi, type DashboardStats } from '@/api/dashboard'

function StatCard({
  label, value, sub, icon: Icon, color, onClick,
}: {
  label: string
  value: number | string
  sub?: string
  icon: React.ElementType
  color: string
  onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={18} className="text-white" />
        </div>
        {sub && (
          <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
            {sub}
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  )
}

function SoarAlert({ count, onClick }: { count: number; onClick: () => void }) {
  if (count === 0) return null
  return (
    <div
      onClick={onClick}
      className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:bg-red-100 transition-colors"
    >
      <div className="w-9 h-9 bg-red-500 rounded-xl flex items-center justify-center shrink-0">
        <AlertTriangle size={16} className="text-white" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-red-800">
          {count} SOAR flag{count !== 1 ? 's' : ''} need acknowledgment
        </p>
        <p className="text-xs text-red-600">Open Field Activity to review</p>
      </div>
    </div>
  )
}

function ProgressPair({
  label, active, completed, icon: Icon, color, onClick,
}: {
  label: string
  active: number
  completed: number
  icon: React.ElementType
  color: string
  onClick?: () => void
}) {
  const total = active + completed
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-gray-100 shadow-sm p-5 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
            <Icon size={15} className="text-white" />
          </div>
          <span className="text-sm font-semibold text-gray-700">{label}</span>
        </div>
        <span className="text-xs text-gray-400">{pct}% done</span>
      </div>
      <div className="flex gap-4 text-sm mb-3">
        <div>
          <p className="text-lg font-bold text-gray-900">{active}</p>
          <p className="text-xs text-gray-500">Active</p>
        </div>
        <div className="w-px bg-gray-100" />
        <div>
          <p className="text-lg font-bold text-gray-900">{completed}</p>
          <p className="text-xs text-gray-500">Completed today</p>
        </div>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-1.5">
        <div
          className="h-1.5 rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: pct === 100 ? '#16a34a' : 'var(--color-primary)' }}
        />
      </div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 animate-pulse">
      <div className="w-10 h-10 bg-gray-100 rounded-xl mb-3" />
      <div className="h-7 w-16 bg-gray-100 rounded mb-1" />
      <div className="h-3 w-24 bg-gray-100 rounded" />
    </div>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardApi.get().then(r => r.data.data!),
    refetchInterval: 60_000,
  })

  const stats: DashboardStats = data ?? {
    totalClients: 0, activeVisitsToday: 0, completedVisitsToday: 0,
    activeRoutesToday: 0, completedRoutesToday: 0,
    labPending: 0, labCompleted: 0, soarFlagsUnacknowledged: 0,
    totalWells: 0, totalTanks: 0,
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary)' }}>
          <TrendingUp size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-xs text-gray-500">Live overview · auto-refreshes every minute</p>
        </div>
      </div>

      {/* SOAR alert */}
      {!isLoading && stats.soarFlagsUnacknowledged > 0 && (
        <div className="mb-5">
          <SoarAlert count={stats.soarFlagsUnacknowledged} onClick={() => navigate('/field-activity')} />
        </div>
      )}

      {/* Asset counts */}
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Assets</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {isLoading ? (
          [...Array(4)].map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard label="Clients" value={stats.totalClients}
              icon={Building2} color="bg-blue-500"
              onClick={() => navigate('/clients')} />
            <StatCard label="Wells" value={stats.totalWells}
              icon={Drill} color="bg-indigo-500"
              onClick={() => navigate('/wells')} />
            <StatCard label="Tanks" value={stats.totalTanks}
              icon={Cylinder} color="bg-purple-500"
              onClick={() => navigate('/tanks')} />
            <StatCard label="Lab Pending" value={stats.labPending}
              sub={`${stats.labCompleted} done`}
              icon={TestTube} color={stats.labPending > 0 ? 'bg-amber-500' : 'bg-emerald-500'}
              onClick={() => navigate('/lab/queue')} />
          </>
        )}
      </div>

      {/* Today's activity */}
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Today's Field Activity</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {isLoading ? (
          [...Array(2)].map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <ProgressPair
              label="Service Visits"
              active={stats.activeVisitsToday}
              completed={stats.completedVisitsToday}
              icon={Activity}
              color="bg-emerald-500"
              onClick={() => navigate('/field-activity')}
            />
            <ProgressPair
              label="Deliveries"
              active={stats.activeRoutesToday}
              completed={stats.completedRoutesToday}
              icon={PackageCheck}
              color="bg-blue-500"
              onClick={() => navigate('/deliveries')}
            />
          </>
        )}
      </div>

      {/* Quick links */}
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Quick Access</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Schedule',  icon: CalendarDays,  path: '/schedule',      color: 'var(--color-primary)' },
          { label: 'Lab Queue', icon: TestTube,       path: '/lab/queue',     color: 'var(--color-primary)' },
          { label: 'Programs',  icon: CheckCircle2,  path: '/plans',         color: 'var(--color-primary)' },
          { label: 'Inventory', icon: Building2,     path: '/inventory',     color: 'var(--color-primary)' },
        ].map(({ label, icon: Icon, path, color }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 hover:shadow-md transition-shadow text-left"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: color }}>
              <Icon size={15} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-700">{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
