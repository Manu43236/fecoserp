import { Building2, Drill, Cylinder, CalendarDays, Truck, Droplets, FlaskConical, CheckCircle2 } from 'lucide-react'
import type { DashboardStats } from '@/api/dashboard'
import { CommandBar } from './shared/CommandBar'
import { StatCard } from './shared/StatCard'
import { OpsProgressCard } from './shared/OpsProgressCard'
import { TankHealthCard } from './shared/TankHealthCard'
import { LabQueueCard } from './shared/LabQueueCard'
import { AlertStrip } from './shared/AlertStrip'

interface Props { stats: DashboardStats; name: string }

export function ManagerDashboard({ stats, name }: Props) {
  const alerts = [
    { count: stats.soarFlagsUnacknowledged, label: 'Unacknowledged SOAR Flags',  sub: 'Chemical injection anomalies need review', path: '/qc',            icon: Droplets,     urgent: true  },
    { count: stats.criticalLabResults,       label: 'Critical Lab Results',        sub: 'Results outside acceptable thresholds',    path: '/lab/queue',     icon: FlaskConical, urgent: true  },
    { count: stats.tankCritical,             label: 'Tanks Below 30%',             sub: 'Critical tank levels — schedule service',  path: '/tanks',         icon: Cylinder,     urgent: true  },
    { count: stats.pendingApprovals,         label: 'Approvals Waiting',           sub: 'Lab results pending sign-off',             path: '/rep/approvals', icon: CheckCircle2, urgent: false },
  ]

  return (
    <div className="space-y-5">
      <CommandBar
        name={name}
        role="MANAGER"
        roleColor="var(--color-primary)"
        metrics={[
          { label: 'Active Visits',  value: stats.activeVisitsToday,  pulse: stats.activeVisitsToday > 0,  color: '#fff' },
          { label: 'Active Routes',  value: stats.activeRoutesToday,  pulse: stats.activeRoutesToday > 0,  color: '#fff' },
          { label: 'Tank Critical',  value: stats.tankCritical,       pulse: stats.tankCritical > 0,       color: stats.tankCritical > 0 ? '#fca5a5' : '#fff' },
          { label: 'Lab Pending',    value: stats.labPending,         color: '#fff' },
        ]}
      />

      <AlertStrip alerts={alerts} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Clients"  value={stats.totalClients}  icon={Building2} path="/clients" />
        <StatCard label="Active"   value={stats.activeClients} icon={Building2} path="/clients" accent="#10b981" />
        <StatCard label="Wells"    value={stats.totalWells}    icon={Drill}     path="/wells" />
        <StatCard label="Tanks"    value={stats.totalTanks}    icon={Cylinder}  path="/tanks" />
      </div>

      <div className="flex gap-3 flex-col sm:flex-row">
        <OpsProgressCard
          title="Service Visits Today"
          icon={CalendarDays}
          scheduled={stats.scheduledVisitsToday}
          active={stats.activeVisitsToday}
          completed={stats.completedVisitsToday}
          path="/schedule"
        />
        <OpsProgressCard
          title="Routes Today"
          icon={Truck}
          scheduled={stats.activeRoutesToday + stats.completedRoutesToday}
          active={stats.activeRoutesToday}
          completed={stats.completedRoutesToday}
          path="/routes"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <TankHealthCard
          critical={stats.tankCritical}
          warning={stats.tankWarning}
          healthy={stats.tankHealthy}
        />
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
