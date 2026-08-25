import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Activity, PackageCheck, AlertTriangle, CheckCircle2, MapPin, X, ChevronRight, Truck } from 'lucide-react'
import { serviceVisitsApi, type ServiceVisit, type VisitStatus } from '@/api/serviceVisits'
import { routesApi, type RouteRecord, type RouteStatus } from '@/api/routes'
import type { ApiResponse, PageResponse } from '@/types'
import api from '@/lib/axios'

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

// ── Status badges ─────────────────────────────────────────────────────────────

const VISIT_STATUS: Record<VisitStatus, { bg: string; text: string; dot: string; ring: string; label: string }> = {
  SCHEDULED:   { bg: 'bg-gray-50',    text: 'text-gray-600',    dot: 'bg-gray-400',    ring: 'ring-gray-200',    label: 'Scheduled'   },
  IN_PROGRESS: { bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-500',   ring: 'ring-amber-200',   label: 'In Progress' },
  COMPLETED:   { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', ring: 'ring-emerald-200', label: 'Completed'   },
  CANCELLED:   { bg: 'bg-red-50',     text: 'text-red-600',     dot: 'bg-red-400',     ring: 'ring-red-200',     label: 'Cancelled'   },
}

const ROUTE_STATUS: Record<RouteStatus, { bg: string; text: string; dot: string; ring: string; label: string }> = {
  PLANNED:     { bg: 'bg-gray-50',    text: 'text-gray-600',    dot: 'bg-gray-400',    ring: 'ring-gray-200',    label: 'Planned'     },
  DISPATCHED:  { bg: 'bg-blue-50',    text: 'text-blue-700',    dot: 'bg-blue-500',    ring: 'ring-blue-200',    label: 'Dispatched'  },
  IN_PROGRESS: { bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-500',   ring: 'ring-amber-200',   label: 'In Progress' },
  COMPLETED:   { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', ring: 'ring-emerald-200', label: 'Completed'   },
  CANCELLED:   { bg: 'bg-red-50',     text: 'text-red-600',     dot: 'bg-red-400',     ring: 'ring-red-200',     label: 'Cancelled'   },
}

function VSBadge({ status }: { status: VisitStatus }) {
  const s = VISIT_STATUS[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ${s.bg} ${s.text} ${s.ring}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  )
}

function RSBadge({ status }: { status: RouteStatus }) {
  const s = ROUTE_STATUS[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ${s.bg} ${s.text} ${s.ring}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  )
}

// ── Visit detail drawer ───────────────────────────────────────────────────────

function VisitDrawer({ visit, onClose }: { visit: ServiceVisit; onClose: () => void }) {
  const { data } = useQuery({
    queryKey: ['visit-detail', visit.id],
    queryFn: () => serviceVisitsApi.get(visit.id).then((r: any) => r.data.data as ServiceVisit),
    initialData: visit,
  })
  const v = data!
  const soarCount = v.stops.filter(s => s.hasSoar && !s.soarAcknowledged).length

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="fixed inset-0 bg-black/20" />
      <div className="relative w-[440px] bg-white h-full shadow-2xl flex flex-col z-50">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary)' }}>
              <Activity size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{v.techName}</p>
              <p className="text-xs text-gray-500">{v.visitDate} · {v.stops.length} well{v.stops.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-gray-100 text-gray-400">
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3 shrink-0">
          <VSBadge status={v.status} />
          {soarCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 bg-red-50 text-red-700 ring-red-200">
              <AlertTriangle size={10} /> {soarCount} SOAR unacked
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {v.stops.map((stop, idx) => (
            <div key={stop.id} className="border border-gray-100 rounded-xl overflow-hidden">
              <div className="flex items-start justify-between px-4 py-3 bg-gray-50">
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white mt-0.5 shrink-0"
                       style={{ backgroundColor: 'var(--color-primary)' }}>
                    {idx + 1}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{stop.wellName}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <MapPin size={10} /> {stop.leaseName} · {stop.clientName}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    stop.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' :
                    stop.status === 'SKIPPED'   ? 'bg-red-50 text-red-600' :
                                                  'bg-gray-50 text-gray-500'
                  }`}>
                    {stop.status === 'COMPLETED' ? 'Done' : stop.status === 'SKIPPED' ? 'Skipped' : 'Pending'}
                  </span>
                  {stop.hasSoar && (
                    <span className={`text-xs font-medium flex items-center gap-1 ${stop.soarAcknowledged ? 'text-gray-400' : 'text-red-600'}`}>
                      <AlertTriangle size={10} />
                      {stop.soarAcknowledged ? 'SOAR acked' : 'SOAR!'}
                    </span>
                  )}
                </div>
              </div>
              {stop.hasReport && (
                <div className="px-4 py-2 border-t border-gray-100">
                  <span className="text-xs text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 size={11} /> Treatment report submitted
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Route detail drawer ───────────────────────────────────────────────────────

function RouteDrawer({ route, onClose }: { route: RouteRecord; onClose: () => void }) {
  const { data } = useQuery({
    queryKey: ['route-fa', route.id],
    queryFn: () => routesApi.get(route.id).then(r => r.data.data!),
    initialData: route,
  })
  const r = data!

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="fixed inset-0 bg-black/20" />
      <div className="relative w-[440px] bg-white h-full shadow-2xl flex flex-col z-50">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary)' }}>
              <Truck size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{r.driverName ?? 'Unassigned'}</p>
              <p className="text-xs text-gray-500">{r.truckNumber ?? '—'} · {r.stopCount} stop{r.stopCount !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-gray-100 text-gray-400">
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-3 border-b border-gray-100 shrink-0">
          <RSBadge status={r.status} />
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {(r.stops ?? []).map((stop, idx) => (
            <div key={stop.id} className="border border-gray-100 rounded-xl overflow-hidden">
              <div className="flex items-start justify-between px-4 py-3 bg-gray-50">
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white mt-0.5 shrink-0"
                       style={{ backgroundColor: 'var(--color-primary)' }}>
                    {idx + 1}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{stop.wellName ?? '—'}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <MapPin size={10} /> {stop.leaseName ?? '—'}
                    </p>
                  </div>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  stop.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' :
                  stop.status === 'SKIPPED'   ? 'bg-red-50 text-red-600' :
                                                'bg-gray-50 text-gray-500'
                }`}>
                  {stop.status === 'COMPLETED' ? 'Delivered' : stop.status === 'SKIPPED' ? 'Skipped' : 'Pending'}
                </span>
              </div>
              {stop.items.length > 0 && (
                <div className="px-4 py-2 border-t border-gray-100">
                  {stop.items.map(item => (
                    <div key={item.id} className="flex justify-between text-xs text-gray-600 py-0.5">
                      <span>{item.productName ?? 'Product'}</span>
                      <span className="font-medium">{item.quantity} {item.unit}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

type DrawerState =
  | { type: 'visit'; data: ServiceVisit }
  | { type: 'route'; data: RouteRecord }
  | null

export default function FieldActivityPage() {
  const today = todayIso()
  const [drawer, setDrawer] = useState<DrawerState>(null)

  const { data: visitsData, isLoading: visitsLoading } = useQuery({
    queryKey: ['field-visits', today],
    queryFn: () => serviceVisitsApi.list({ dateFrom: today, dateTo: today, size: 100 })
      .then((r: any) => (r.data.data as PageResponse<ServiceVisit>).content ?? []),
    refetchInterval: 60_000,
  })

  const { data: routesData, isLoading: routesLoading } = useQuery({
    queryKey: ['field-routes', today],
    queryFn: () => routesApi.list({ routeDate: today, size: 100 })
      .then(r => r.data.data?.content ?? []),
    refetchInterval: 60_000,
  })

  const visits = visitsData ?? []
  const routes = routesData ?? []

  const soarCount = visits.flatMap(v => v.stops ?? []).filter(s => s.hasSoar && !s.soarAcknowledged).length

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary)' }}>
          <Activity size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Field Activity</h1>
          <p className="text-xs text-gray-500">Live view for {today}</p>
        </div>
        {soarCount > 0 && (
          <span className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 ring-1 ring-red-200">
            <AlertTriangle size={12} /> {soarCount} SOAR unacknowledged
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Service Visits */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Activity size={15} style={{ color: 'var(--color-primary)' }} />
            <h2 className="text-sm font-semibold text-gray-700">Service Visits</h2>
            <span className="text-xs text-gray-400">{visits.length} today</span>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {visitsLoading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="px-4 py-3 border-b border-gray-50 animate-pulse">
                  <div className="h-4 bg-gray-100 rounded w-32 mb-1" />
                  <div className="h-3 bg-gray-100 rounded w-48" />
                </div>
              ))
            ) : visits.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-gray-400">No visits scheduled today</div>
            ) : (
              visits.map(visit => {
                const soar = (visit.stops ?? []).some(s => s.hasSoar && !s.soarAcknowledged)
                return (
                  <div
                    key={visit.id}
                    onClick={() => setDrawer({ type: 'visit', data: visit })}
                    className="flex items-center px-4 py-3 border-b border-gray-50 last:border-b-0 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900 truncate">{visit.techName}</p>
                        {soar && <AlertTriangle size={13} className="text-red-500 shrink-0" />}
                      </div>
                      <p className="text-xs text-gray-500">{(visit.stops ?? []).length} wells</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <VSBadge status={visit.status} />
                      <ChevronRight size={15} className="text-gray-300" />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Deliveries */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <PackageCheck size={15} style={{ color: 'var(--color-primary)' }} />
            <h2 className="text-sm font-semibold text-gray-700">Deliveries</h2>
            <span className="text-xs text-gray-400">{routes.length} today</span>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {routesLoading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="px-4 py-3 border-b border-gray-50 animate-pulse">
                  <div className="h-4 bg-gray-100 rounded w-32 mb-1" />
                  <div className="h-3 bg-gray-100 rounded w-48" />
                </div>
              ))
            ) : routes.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-gray-400">No deliveries scheduled today</div>
            ) : (
              routes.map(route => (
                <div
                  key={route.id}
                  onClick={() => setDrawer({ type: 'route', data: route })}
                  className="flex items-center px-4 py-3 border-b border-gray-50 last:border-b-0 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{route.driverName ?? 'Unassigned'}</p>
                    <p className="text-xs text-gray-500">{route.truckNumber ?? '—'} · {route.stopCount} stops</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <RSBadge status={route.status} />
                    <ChevronRight size={15} className="text-gray-300" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {drawer?.type === 'visit' && (
        <VisitDrawer visit={drawer.data} onClose={() => setDrawer(null)} />
      )}
      {drawer?.type === 'route' && (
        <RouteDrawer route={drawer.data} onClose={() => setDrawer(null)} />
      )}
    </div>
  )
}
