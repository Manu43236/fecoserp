import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Building2, X, ChevronRight, FlaskConical, CalendarDays,
  ClipboardList, AlertTriangle, CheckCircle, Clock, Search,
  Pause, Ban, PlayCircle, UserCircle, Phone, Mail,
} from 'lucide-react'
import { clientsApi, type ClientRecord } from '@/api/clients'
import { plansApi, type PlanRecord, type PlanStatus } from '@/api/plans'
import { labApi, type LabSampleRecord } from '@/api/lab'
import { serviceVisitsApi, type ServiceVisit } from '@/api/serviceVisits'
import { useAuthStore } from '@/store/authStore'
import { Skeleton } from '@/components/ui/Skeleton'

// ── Plan status config ────────────────────────────────────────────────────────
const PLAN_STATUS: Record<PlanStatus, { label: string; color: string; icon: React.ElementType }> = {
  ACTIVE:     { label: 'Active',     color: 'bg-green-100 text-green-700',   icon: PlayCircle  },
  DRAFT:      { label: 'Draft',      color: 'bg-gray-100 text-gray-600',     icon: ClipboardList },
  PAUSED:     { label: 'Paused',     color: 'bg-yellow-100 text-yellow-700', icon: Pause       },
  SUSPENDED:  { label: 'Suspended',  color: 'bg-orange-100 text-orange-700', icon: Ban         },
  COMPLETED:  { label: 'Completed',  color: 'bg-blue-100 text-blue-700',     icon: CheckCircle },
  INACTIVE:   { label: 'Inactive',   color: 'bg-gray-100 text-gray-500',     icon: Ban         },
  SUPERSEDED: { label: 'Superseded', color: 'bg-gray-100 text-gray-400',     icon: Ban         },
}

function PlanBadge({ status }: { status: PlanStatus }) {
  const cfg = PLAN_STATUS[status] ?? PLAN_STATUS.INACTIVE
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.color}`}>
      <cfg.icon size={10} />
      {cfg.label}
    </span>
  )
}

function fmtDate(iso?: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ── Client summary card ───────────────────────────────────────────────────────
function ClientCard({
  client, plans, pendingCount, onClick,
}: {
  client: ClientRecord
  plans: PlanRecord[]
  pendingCount: number
  onClick: () => void
}) {
  const activeCount = plans.filter(p => p.status === 'ACTIVE').length
  const totalCount  = plans.length

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 hover:shadow-sm transition-all group"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-white text-xs font-bold"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {client.companyName.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{client.companyName}</p>
            {client.contactName && (
              <p className="text-xs text-gray-500 truncate">{client.contactName}</p>
            )}
          </div>
        </div>
        <ChevronRight size={16} className="text-gray-400 shrink-0 group-hover:text-gray-600 mt-1" />
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {/* Active programs */}
        <div className="flex items-center gap-1.5 text-xs text-gray-600">
          <ClipboardList size={13} className="text-gray-400" />
          <span><span className="font-semibold text-gray-900">{activeCount}</span> active / {totalCount} programs</span>
        </div>

        {/* Pending approvals badge */}
        {pendingCount > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 ring-1 ring-red-200">
            <AlertTriangle size={10} />
            {pendingCount} pending
          </span>
        )}
      </div>

      {client.accountRepName && (
        <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
          <UserCircle size={11} />
          {client.accountRepName}
        </p>
      )}
    </button>
  )
}

// ── Drawer tabs ───────────────────────────────────────────────────────────────
type Tab = 'programs' | 'lab' | 'schedule'

function ProgramsTab({ plans }: { plans: PlanRecord[] }) {
  if (!plans.length) return (
    <div className="flex flex-col items-center py-12 text-gray-400">
      <ClipboardList size={32} className="mb-2 text-gray-300" />
      <p className="text-sm">No programs for this client</p>
    </div>
  )
  return (
    <div className="divide-y divide-gray-100">
      {plans.map(p => (
        <div key={p.id} className="py-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{p.wellName ?? '—'}</p>
              <p className="text-xs text-gray-500 truncate">{p.leaseName ?? '—'}</p>
            </div>
            <PlanBadge status={p.status} />
          </div>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
            <span>{p.lineCount} product{p.lineCount !== 1 ? 's' : ''}</span>
            {p.startDate && <span>Started {fmtDate(p.startDate)}</span>}
          </div>
        </div>
      ))}
    </div>
  )
}

function LabTab({ wellIds }: { wellIds: string[] }) {
  const { data, isLoading } = useQuery({
    queryKey: ['portfolio-lab', ...wellIds],
    queryFn: async () => {
      if (!wellIds.length) return []
      // Load samples for all wells, take most recent per well
      const res = await labApi.list({ size: 50 })
      const samples: LabSampleRecord[] = res.data.data?.content ?? []
      return samples.filter(s => wellIds.includes(s.wellId))
    },
    enabled: wellIds.length > 0,
  })

  if (isLoading) return <div className="py-8 flex justify-center"><div className="w-5 h-5 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin" /></div>

  const samples = data ?? []

  if (!samples.length) return (
    <div className="flex flex-col items-center py-12 text-gray-400">
      <FlaskConical size={32} className="mb-2 text-gray-300" />
      <p className="text-sm">No lab samples found</p>
    </div>
  )

  return (
    <div className="divide-y divide-gray-100">
      {samples.map(s => {
        const isCritical = s.result?.hasCriticalValues
        const isApproved = s.result?.approvalStatus === 'APPROVED'
        return (
          <div key={s.id} className="py-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{s.wellName ?? '—'}</p>
                <p className="text-xs text-gray-500">{s.sampleType?.replace('_', ' ')} · {s.sampleNumber}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {isCritical && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-semibold bg-red-50 text-red-700">
                    <AlertTriangle size={10} /> Critical
                  </span>
                )}
                {isApproved
                  ? <span className="text-xs font-medium text-green-700 bg-green-50 px-1.5 py-0.5 rounded">Approved</span>
                  : <span className="text-xs font-medium text-yellow-700 bg-yellow-50 px-1.5 py-0.5 rounded">Pending</span>
                }
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-1">{fmtDate(s.receivedAt)}</p>
          </div>
        )
      })}
    </div>
  )
}

function ScheduleTab({ clientName }: { clientName: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['portfolio-visits', clientName],
    queryFn: () => serviceVisitsApi.list({ size: 30 }).then(r => {
      const visits: ServiceVisit[] = (r.data as any)?.data?.content ?? []
      return visits.filter(v => v.stops.some(s => s.clientName === clientName))
    }),
  })

  if (isLoading) return <div className="py-8 flex justify-center"><div className="w-5 h-5 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin" /></div>

  const visits = data ?? []

  if (!visits.length) return (
    <div className="flex flex-col items-center py-12 text-gray-400">
      <CalendarDays size={32} className="mb-2 text-gray-300" />
      <p className="text-sm">No service visits found</p>
    </div>
  )

  return (
    <div className="divide-y divide-gray-100">
      {visits.map(v => {
        const clientStops = v.stops.filter(s => s.clientName === clientName)
        const completed   = clientStops.filter(s => s.status === 'COMPLETED').length
        const hasSoar     = clientStops.some(s => s.hasSoar && !s.soarAcknowledged)
        return (
          <div key={v.id} className="py-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">{fmtDate(v.visitDate)}</p>
                <p className="text-xs text-gray-500 truncate">Tech: {v.techName}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {hasSoar && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-semibold bg-orange-50 text-orange-700">
                    <AlertTriangle size={10} /> SOAR
                  </span>
                )}
                <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                  v.status === 'COMPLETED' ? 'bg-green-50 text-green-700'
                    : v.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-700'
                    : v.status === 'CANCELLED' ? 'bg-red-50 text-red-700'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {v.status.replace('_', ' ')}
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {completed}/{clientStops.length} stops completed
            </p>
          </div>
        )
      })}
    </div>
  )
}

// ── Client detail drawer ──────────────────────────────────────────────────────
function ClientDrawer({
  client, allPlans, onClose,
}: {
  client: ClientRecord
  allPlans: PlanRecord[]
  onClose: () => void
}) {
  const [tab, setTab] = useState<Tab>('programs')

  const plans  = allPlans.filter(p => p.clientName === client.companyName)
  const wellIds = [...new Set(plans.map(p => p.wellId).filter(Boolean))] as string[]

  const tabs: { key: Tab; label: string }[] = [
    { key: 'programs', label: 'Programs' },
    { key: 'lab',      label: 'Lab'      },
    { key: 'schedule', label: 'Schedule' },
  ]

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1" />
      <div className="w-[440px] bg-white shadow-2xl flex flex-col h-full border-l border-gray-200">
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              {client.companyName.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-gray-900 truncate">{client.companyName}</h2>
              {client.contactName && (
                <p className="text-xs text-gray-500 truncate">{client.contactName}</p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 shrink-0 ml-2">
            <X size={16} />
          </button>
        </div>

        {/* Contact info strip */}
        {(client.contactPhone || client.contactEmail) && (
          <div className="flex items-center gap-4 px-5 py-2.5 bg-gray-50 border-b border-gray-100 shrink-0">
            {client.contactPhone && (
              <a href={`tel:${client.contactPhone}`} className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900">
                <Phone size={12} /> {client.contactPhone}
              </a>
            )}
            {client.contactEmail && (
              <a href={`mailto:${client.contactEmail}`} className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 truncate">
                <Mail size={12} /> {client.contactEmail}
              </a>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-100 shrink-0">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors border-b-2 ${
                tab === t.key ? 'border-current' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              style={tab === t.key ? { color: 'var(--color-primary)', borderColor: 'var(--color-primary)' } : {}}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {tab === 'programs' && <ProgramsTab plans={plans} />}
          {tab === 'lab'      && <LabTab wellIds={wellIds} />}
          {tab === 'schedule' && <ScheduleTab clientName={client.companyName} />}
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function PortfolioPage() {
  const { user } = useAuthStore()
  const isRep     = user?.role === 'ACCOUNT_REP'
  const [search,   setSearch]   = useState('')
  const [selected, setSelected] = useState<ClientRecord | null>(null)

  const { data: clientsData, isLoading } = useQuery({
    queryKey: ['portfolio-clients', isRep ? user?.id : 'all'],
    queryFn: () => clientsApi.list({
      accountRepId: isRep ? user?.id : undefined,
      isActive: true,
      size: 200,
    }).then(r => r.data.data?.content ?? []),
  })

  const { data: plansData } = useQuery({
    queryKey: ['portfolio-plans'],
    queryFn: () => plansApi.list({ size: 500 }).then(r => r.data.data?.content ?? []),
  })

  const { data: pendingData } = useQuery({
    queryKey: ['portfolio-pending'],
    queryFn: () => labApi.pendingApprovals({ size: 200 }).then(r => r.data.data?.content ?? []),
  })

  const clients  = clientsData  ?? []
  const allPlans = plansData    ?? []
  const pending  = pendingData  ?? []

  const filtered = clients.filter(c =>
    c.companyName.toLowerCase().includes(search.toLowerCase()) ||
    (c.contactName ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const totalPending = pending.length
  const activeClients = clients.filter(c =>
    allPlans.some(p => p.clientName === c.companyName && p.status === 'ACTIVE')
  ).length

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Portfolio</h1>
          <p className="text-sm text-gray-500 mt-0.5">Client accounts and treatment programs</p>
        </div>

        {/* Summary pills */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs">
            <Building2 size={13} className="text-gray-400" />
            <span className="font-semibold text-gray-900">{clients.length}</span>
            <span className="text-gray-500">clients</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs">
            <PlayCircle size={13} className="text-green-500" />
            <span className="font-semibold text-gray-900">{activeClients}</span>
            <span className="text-gray-500">active</span>
          </div>
          {totalPending > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg text-xs">
              <AlertTriangle size={13} className="text-red-500" />
              <span className="font-semibold text-red-700">{totalPending}</span>
              <span className="text-red-600">pending approvals</span>
            </div>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search clients…"
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:border-transparent"
          style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
        />
      </div>

      {/* Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2.5">
                <Skeleton className="w-9 h-9 rounded-lg" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-gray-400">
          <Building2 size={40} className="mb-3 text-gray-300" />
          <p className="text-sm font-medium text-gray-600">
            {search ? 'No clients match your search' : 'No clients assigned yet'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(client => {
            const clientPlans   = allPlans.filter(p => p.clientName === client.companyName)
            const clientPending = pending.filter(s => s.clientName === client.companyName).length
            return (
              <ClientCard
                key={client.id}
                client={client}
                plans={clientPlans}
                pendingCount={clientPending}
                onClick={() => setSelected(client)}
              />
            )
          })}
        </div>
      )}

      {/* Drawer */}
      {selected && (
        <ClientDrawer
          client={selected}
          allPlans={allPlans}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
