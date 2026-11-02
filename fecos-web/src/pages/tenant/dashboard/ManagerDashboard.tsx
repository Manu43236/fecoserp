import { Building2, Drill, Cylinder, Droplets, FlaskConical, CheckCircle2 } from 'lucide-react'
import type { DashboardStats } from '@/api/dashboard'
import { CommandBar } from './shared/CommandBar'
import { StatCard } from './shared/StatCard'
import { LiveOpsHero } from './shared/LiveOpsHero'
import { TankHealthCard } from './shared/TankHealthCard'
import { LabQueueCard } from './shared/LabQueueCard'
import { AlertStrip } from './shared/AlertStrip'

interface Props { stats: DashboardStats; name: string }

export function ManagerDashboard({ stats, name }: Props) {
  const alerts = [
    { count: stats.soarFlagsUnacknowledged, label: 'Unacknowledged SOAR Flags',  sub: 'Chemical injection anomalies — review immediately', path: '/qc',            icon: Droplets,     urgent: true  },
    { count: stats.criticalLabResults,       label: 'Critical Lab Results',        sub: 'Results outside safe thresholds',                   path: '/lab/queue',     icon: FlaskConical, urgent: true  },
    { count: stats.tankCritical,             label: 'Tanks Below 30%',             sub: 'Schedule service before they run dry',              path: '/tanks',         icon: Cylinder,     urgent: true  },
    { count: stats.pendingApprovals,         label: 'Approvals Waiting',           sub: 'Lab results need your sign-off',                    path: '/rep/approvals', icon: CheckCircle2, urgent: false },
  ]

  return (
    <div className="space-y-4">
      <CommandBar
        name={name}
        role="MANAGER"
        roleColor="var(--color-primary)"
        metrics={[
          { label: 'Active Visits',  value: stats.activeVisitsToday, pulse: stats.activeVisitsToday > 0, color: '#fff' },
          { label: 'Active Routes',  value: stats.activeRoutesToday, pulse: stats.activeRoutesToday > 0, color: '#fff' },
          { label: 'Tank Critical',  value: stats.tankCritical,      pulse: stats.tankCritical > 0,      color: stats.tankCritical > 0 ? '#fca5a5' : '#fff' },
          { label: 'Lab Pending',    value: stats.labPending,        color: '#fff' },
        ]}
      />

      {(stats.activeVisitsToday + stats.completedVisitsToday + stats.activeRoutesToday + stats.completedRoutesToday) > 0 && (
        <LiveOpsHero
          activeVisits={stats.activeVisitsToday}
          completedVisits={stats.completedVisitsToday}
          scheduledVisits={stats.scheduledVisitsToday}
          activeRoutes={stats.activeRoutesToday}
          completedRoutes={stats.completedRoutesToday}
        />
      )}

      <AlertStrip alerts={alerts} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Clients"        value={stats.totalClients}  icon={Building2} path="/clients" />
        <StatCard label="Active Clients" value={stats.activeClients} icon={Building2} path="/clients" accent="#10b981" />
        <StatCard label="Wells"          value={stats.totalWells}    icon={Drill}     path="/wells" />
        <StatCard label="Tanks"          value={stats.totalTanks}    icon={Cylinder}  path="/tanks" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TankHealthCard critical={stats.tankCritical} warning={stats.tankWarning} healthy={stats.tankHealthy} />
        <LabQueueCard
          received={stats.samplesReceived}
          inProgress={stats.samplesInProgress}
          completedToday={stats.samplesCompletedToday}
          overdue={stats.samplesOverdue}
          pendingApprovals={stats.pendingApprovals}
        />
      </div>
    </div>
  )
}
