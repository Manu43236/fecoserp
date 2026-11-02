import { Building2, Drill, Cylinder, Droplets, TestTube } from 'lucide-react'
import type { DashboardStats } from '@/api/dashboard'
import { CommandBar } from './shared/CommandBar'
import { StatCard } from './shared/StatCard'
import { TankHealthCard } from './shared/TankHealthCard'
import { AlertStrip } from './shared/AlertStrip'
import { ClientHealthList } from './shared/ClientHealthList'

interface Props { stats: DashboardStats; name: string }

export function AccountRepDashboard({ stats, name }: Props) {
  const alerts = [
    { count: stats.mySoarFlags,  label: 'SOAR Flags in My Territory',  sub: 'Chemical anomalies needing attention',  path: '/qc',        icon: Droplets, urgent: true  },
    { count: stats.myLabPending, label: 'Lab Samples Pending',          sub: 'Awaiting analysis in your territory',  path: '/lab/queue', icon: TestTube, urgent: false },
  ]

  return (
    <div className="space-y-5">
      <CommandBar
        name={name}
        role="ACCOUNT REP"
        roleColor="var(--color-primary)"
        metrics={[
          { label: 'My Clients',   value: stats.myClients,       color: '#fff' },
          { label: 'Active',       value: stats.myActiveClients, color: '#6ee7b7' },
          { label: 'My Wells',     value: stats.myWells,         color: '#fff' },
          { label: 'Tank Critical', value: stats.myTankCritical, pulse: stats.myTankCritical > 0, color: stats.myTankCritical > 0 ? '#fca5a5' : '#fff' },
        ]}
      />

      <AlertStrip alerts={alerts} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="My Clients"   value={stats.myClients}       icon={Building2} path="/clients" />
        <StatCard label="Active"       value={stats.myActiveClients} icon={Building2} path="/clients" accent="#10b981" />
        <StatCard label="My Wells"     value={stats.myWells}         icon={Drill}     path="/wells" />
        <StatCard label="Lab Pending"  value={stats.myLabPending}    icon={TestTube}  path="/lab/queue" accent="#f59e0b" />
      </div>

      <TankHealthCard
        title="My Territory — Tank Health"
        critical={stats.myTankCritical}
        warning={stats.myTankWarning}
        healthy={stats.myTankHealthy}
      />

      {/* ponytail: no per-client breakdown API yet; shows empty state until wired */}
      <ClientHealthList items={[]} title="My Client Portfolio" />
    </div>
  )
}
