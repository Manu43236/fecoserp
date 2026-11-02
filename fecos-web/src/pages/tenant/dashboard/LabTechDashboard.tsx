import { FlaskConical, Clock, CheckCircle2, AlertOctagon, TestTube } from 'lucide-react'
import type { DashboardStats } from '@/api/dashboard'
import { CommandBar } from './shared/CommandBar'
import { StatCard } from './shared/StatCard'
import { LabQueueCard } from './shared/LabQueueCard'
import { AlertStrip } from './shared/AlertStrip'

interface Props { stats: DashboardStats; name: string }

export function LabTechDashboard({ stats, name }: Props) {
  const alerts = [
    { count: stats.samplesOverdue,     label: 'Overdue Samples',       sub: 'Past expected turnaround — act now',    path: '/lab/queue',     icon: Clock,        urgent: true  },
    { count: stats.criticalLabResults, label: 'Critical Results',       sub: 'Results flagged outside safe thresholds', path: '/lab/queue',  icon: AlertOctagon, urgent: true  },
    { count: stats.pendingApprovals,   label: 'Pending Approvals',      sub: 'Results awaiting sign-off',             path: '/rep/approvals', icon: CheckCircle2, urgent: false },
  ]

  return (
    <div className="space-y-5">
      <CommandBar
        name={name}
        role="LAB TECH"
        roleColor="var(--color-primary)"
        metrics={[
          { label: 'Received',   value: stats.samplesReceived,    color: '#93c5fd' },
          { label: 'In Progress', value: stats.samplesInProgress, pulse: stats.samplesInProgress > 0, color: '#fff' },
          { label: 'Done Today', value: stats.samplesCompletedToday, color: '#6ee7b7' },
          { label: 'Overdue',    value: stats.samplesOverdue,     pulse: stats.samplesOverdue > 0, color: stats.samplesOverdue > 0 ? '#fca5a5' : '#fff' },
        ]}
      />

      <AlertStrip alerts={alerts} />

      {/* Primary lab queue */}
      <LabQueueCard
        title="Today's Lab Queue"
        received={stats.samplesReceived}
        inProgress={stats.samplesInProgress}
        completedToday={stats.samplesCompletedToday}
        overdue={stats.samplesOverdue}
        pendingApprovals={stats.pendingApprovals}
      />

      {/* Cumulative stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Lab Backlog"      value={stats.labPending}       icon={TestTube}     path="/lab/queue" />
        <StatCard label="Completed Total"  value={stats.labCompleted}     icon={CheckCircle2} path="/lab/queue" accent="#10b981" />
        <StatCard label="Critical Results" value={stats.criticalLabResults} icon={AlertOctagon} path="/lab/queue" accent="#ef4444" />
        <StatCard label="Pending Approvals" value={stats.pendingApprovals} icon={FlaskConical}  path="/rep/approvals" accent="#f59e0b" />
      </div>
    </div>
  )
}
