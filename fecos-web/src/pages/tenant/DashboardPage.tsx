import { useQuery } from '@tanstack/react-query'
import { RefreshCw } from 'lucide-react'
import { dashboardApi, type DashboardStats } from '@/api/dashboard'
import { useAuthStore } from '@/store/authStore'
import { AdminDashboard } from './dashboard/AdminDashboard'
import { ManagerDashboard } from './dashboard/ManagerDashboard'
import { LabTechDashboard } from './dashboard/LabTechDashboard'
import { AccountRepDashboard } from './dashboard/AccountRepDashboard'

const ZERO_STATS: DashboardStats = {
  totalClients: 0, activeClients: 0, totalWells: 0, totalTanks: 0,
  scheduledVisitsToday: 0, activeVisitsToday: 0, completedVisitsToday: 0,
  activeRoutesToday: 0, completedRoutesToday: 0,
  labPending: 0, labCompleted: 0, pendingApprovals: 0, criticalLabResults: 0,
  tankCritical: 0, tankWarning: 0, tankHealthy: 0, soarFlagsUnacknowledged: 0,
  samplesReceived: 0, samplesInProgress: 0, samplesCompletedToday: 0, samplesOverdue: 0,
  myClients: 0, myActiveClients: 0, myWells: 0,
  myTankCritical: 0, myTankWarning: 0, myTankHealthy: 0,
  myLabPending: 0, mySoarFlags: 0,
}

function Sk({ className }: { className?: string }) {
  return <div className={`bg-gray-200/60 rounded-2xl animate-pulse ${className ?? ''}`} />
}

function LoadingSkeleton() {
  return (
    <div className="space-y-5">
      <Sk className="h-28" />
      <div className="grid grid-cols-4 gap-3"><Sk className="h-28" /><Sk className="h-28" /><Sk className="h-28" /><Sk className="h-28" /></div>
      <div className="flex gap-3"><Sk className="flex-1 h-40" /><Sk className="flex-1 h-40" /></div>
      <div className="grid grid-cols-2 gap-3"><Sk className="h-40" /><Sk className="h-40" /></div>
    </div>
  )
}

export default function DashboardPage() {
  const user = useAuthStore(s => s.user)

  const { data, isLoading, isFetching, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['dashboard'],
    queryFn:  () => dashboardApi.get().then(r => r.data.data!),
    refetchInterval: 60_000,
  })

  // merge so missing fields from older backend versions fall back to 0
  const stats = { ...ZERO_STATS, ...(data ?? {}) }
  const name  = user?.fullName ?? 'User'

  const updatedTime = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : null

  function renderDashboard() {
    if (isLoading) return <LoadingSkeleton />
    switch (user?.role) {
      case 'MANAGER':     return <ManagerDashboard     stats={stats} name={name} />
      case 'LAB_TECH':    return <LabTechDashboard      stats={stats} name={name} />
      case 'ACCOUNT_REP': return <AccountRepDashboard   stats={stats} name={name} />
      default:            return <AdminDashboard        stats={stats} name={name} />
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f1f5f9' }}>
      <div className="max-w-5xl mx-auto px-6 py-6">

        {/* refresh chip — top-right only, no heading (CommandBar is the header) */}
        <div className="flex justify-end mb-4">
          <button onClick={() => refetch()}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors">
            <RefreshCw size={11} className={isFetching ? 'animate-spin' : ''} />
            {updatedTime ? `Updated ${updatedTime}` : 'Refreshing…'}
          </button>
        </div>

        {renderDashboard()}
      </div>
    </div>
  )
}
