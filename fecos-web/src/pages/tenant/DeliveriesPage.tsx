import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  PackageCheck, ChevronRight, X, MapPin, Package,
  CheckCircle2, SkipForward, Truck, FileText,
} from 'lucide-react'
import { routesApi, type RouteRecord, type RouteStatus, type RouteStopStatus } from '@/api/routes'
import { SearchableDropdown, type DropdownOption } from '@/components/ui/SearchableDropdown'
import api from '@/lib/axios'
import type { ApiResponse } from '@/types'

interface UserRecord { id: string; fullName: string; role: string }

const STATUS_COLOR: Record<RouteStatus, { bg: string; text: string; dot: string; ring: string; label: string }> = {
  PLANNED:     { bg: 'bg-gray-50',    text: 'text-gray-600',    dot: 'bg-gray-400',    ring: 'ring-gray-200',    label: 'Planned'     },
  DISPATCHED:  { bg: 'bg-blue-50',    text: 'text-blue-700',    dot: 'bg-blue-500',    ring: 'ring-blue-200',    label: 'Dispatched'  },
  IN_PROGRESS: { bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-500',   ring: 'ring-amber-200',   label: 'In Progress' },
  COMPLETED:   { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', ring: 'ring-emerald-200', label: 'Completed'   },
  CANCELLED:   { bg: 'bg-red-50',     text: 'text-red-600',     dot: 'bg-red-400',     ring: 'ring-red-200',     label: 'Cancelled'   },
}

const STOP_COLOR: Record<RouteStopStatus, { bg: string; text: string; dot: string; ring: string; label: string }> = {
  PENDING:   { bg: 'bg-gray-50',    text: 'text-gray-600',    dot: 'bg-gray-400',    ring: 'ring-gray-200',    label: 'Pending'   },
  COMPLETED: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', ring: 'ring-emerald-200', label: 'Delivered' },
  SKIPPED:   { bg: 'bg-red-50',     text: 'text-red-600',     dot: 'bg-red-400',     ring: 'ring-red-200',     label: 'Skipped'   },
}

function StatusBadge({ status }: { status: RouteStatus }) {
  const s = STATUS_COLOR[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ${s.bg} ${s.text} ${s.ring}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  )
}

function StopBadge({ status }: { status: RouteStopStatus }) {
  const s = STOP_COLOR[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${s.bg} ${s.text} ${s.ring}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  )
}

const STATUS_FILTER_OPTIONS: DropdownOption[] = [
  { value: 'PLANNED',     label: 'Planned'     },
  { value: 'DISPATCHED',  label: 'Dispatched'  },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED',   label: 'Completed'   },
  { value: 'CANCELLED',   label: 'Cancelled'   },
]

function todayIso() {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

// ── Delivery drawer ───────────────────────────────────────────────────────────

function DeliveryDrawer({ route, onClose }: { route: RouteRecord; onClose: () => void }) {
  const qc = useQueryClient()

  const { data } = useQuery({
    queryKey: ['route', route.id],
    queryFn: () => routesApi.get(route.id).then(r => r.data.data!),
    initialData: route,
  })
  const full = data!

  const routeStatusMut = useMutation({
    mutationFn: (status: RouteStatus) => routesApi.updateStatus(route.id, status),
    onSuccess: () => {
      toast.success('Route status updated')
      qc.invalidateQueries({ queryKey: ['deliveries'] })
      qc.invalidateQueries({ queryKey: ['route', route.id] })
    },
    onError: () => toast.error('Failed to update status'),
  })

  const stopStatusMut = useMutation({
    mutationFn: ({ stopId, status }: { stopId: string; status: RouteStopStatus }) =>
      routesApi.updateStopStatus(route.id, stopId, status),
    onSuccess: () => {
      toast.success('Stop updated')
      qc.invalidateQueries({ queryKey: ['route', route.id] })
      qc.invalidateQueries({ queryKey: ['deliveries'] })
    },
    onError: () => toast.error('Failed to update stop'),
  })

  const nextStatus: Partial<Record<RouteStatus, RouteStatus>> = {
    PLANNED:    'DISPATCHED',
    DISPATCHED: 'IN_PROGRESS',
    IN_PROGRESS: 'COMPLETED',
  }
  const next = nextStatus[full.status]

  const STATUS_ACTION: Partial<Record<RouteStatus, string>> = {
    PLANNED:     'Dispatch',
    DISPATCHED:  'Mark In Progress',
    IN_PROGRESS: 'Mark Completed',
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="fixed inset-0 bg-black/20" />
      <div className="relative w-[440px] bg-white h-full shadow-2xl flex flex-col z-50">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary)' }}>
              <Truck size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{full.driverName ?? 'Unassigned'}</p>
              <p className="text-xs text-gray-500">{full.truckNumber ?? 'No truck'} · {full.routeDate}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={async () => {
                const res = await routesApi.getPdf(full.id)
                const url = URL.createObjectURL(new Blob([res.data as BlobPart], { type: 'application/pdf' }))
                window.open(url, '_blank')
              }}
              className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-gray-100 text-gray-400"
              title="Download PDF">
              <FileText size={16} />
            </button>
            <button onClick={onClose} className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-gray-100 text-gray-400">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Status + action */}
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between shrink-0">
          <StatusBadge status={full.status} />
          <div className="flex gap-2">
            {next && (
              <button
                onClick={() => routeStatusMut.mutate(next)}
                disabled={routeStatusMut.isPending}
                className="px-3 py-1.5 text-xs font-semibold text-white rounded-lg disabled:opacity-50"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                {STATUS_ACTION[full.status]}
              </button>
            )}
            {full.status !== 'CANCELLED' && full.status !== 'COMPLETED' && (
              <button
                onClick={() => routeStatusMut.mutate('CANCELLED')}
                disabled={routeStatusMut.isPending}
                className="px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg disabled:opacity-50"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Stops */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            {full.stops?.length ?? 0} Stop{full.stops?.length !== 1 ? 's' : ''}
          </p>
          {(full.stops ?? []).length === 0 && (
            <p className="text-sm text-gray-400 py-6 text-center">No stops on this route</p>
          )}
          {(full.stops ?? []).map((stop, idx) => (
            <div key={stop.id} className="border border-gray-100 rounded-xl overflow-hidden">
              {/* Stop header */}
              <div className="flex items-start justify-between px-4 py-3 bg-gray-50">
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white mt-0.5 shrink-0"
                       style={{ backgroundColor: 'var(--color-primary)' }}>
                    {idx + 1}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{stop.wellName ?? 'Unknown Well'}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <MapPin size={10} /> {stop.leaseName ?? '—'}
                    </p>
                  </div>
                </div>
                <StopBadge status={stop.status} />
              </div>

              {/* Items */}
              {stop.items.length > 0 && (
                <div className="px-4 py-2 space-y-1 border-t border-gray-100">
                  {stop.items.map(item => (
                    <div key={item.id} className="flex items-center gap-2 py-1">
                      <Package size={12} className="text-gray-400 shrink-0" />
                      <span className="text-xs text-gray-700 flex-1">{item.productName ?? 'Product'}</span>
                      <span className="text-xs font-semibold text-gray-800">{item.quantity} {item.unit}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Stop actions */}
              {stop.status === 'PENDING' && (
                <div className="flex gap-2 px-4 py-2 border-t border-gray-100 bg-white">
                  <button
                    onClick={() => stopStatusMut.mutate({ stopId: stop.id, status: 'COMPLETED' })}
                    disabled={stopStatusMut.isPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg disabled:opacity-50"
                  >
                    <CheckCircle2 size={12} /> Delivered
                  </button>
                  <button
                    onClick={() => stopStatusMut.mutate({ stopId: stop.id, status: 'SKIPPED' })}
                    disabled={stopStatusMut.isPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50"
                  >
                    <SkipForward size={12} /> Skip
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {full.notes && (
          <div className="px-5 py-3 border-t border-gray-100 shrink-0">
            <p className="text-xs text-gray-500">{full.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function DeliveriesPage() {
  const [dateFilter, setDateFilter] = useState(todayIso())
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [driverFilter, setDriverFilter] = useState<string | null>(null)
  const [selected, setSelected] = useState<RouteRecord | null>(null)
  const [page, setPage] = useState(0)

  const { data: usersData } = useQuery({
    queryKey: ['users-drivers'],
    queryFn: () => api.get<ApiResponse<{ content: UserRecord[] }>>('/api/v1/users', { params: { size: 200 } })
      .then(r => r.data.data?.content ?? []),
  })
  const drivers = (usersData ?? []).filter(u => u.role === 'TRUCK_DRIVER')
  const driverOptions: DropdownOption[] = drivers.map(d => ({ value: d.id, label: d.fullName }))

  const { data, isLoading } = useQuery({
    queryKey: ['deliveries', dateFilter, statusFilter, driverFilter, page],
    queryFn: () => routesApi.list({
      routeDate: dateFilter || undefined,
      status:    statusFilter || undefined,
      driverId:  driverFilter || undefined,
      page,
      size: 20,
    }).then(r => r.data.data!),
  })

  const routes = data?.content ?? []
  const total  = data?.totalElements ?? 0
  const totalPages = data?.totalPages ?? 1

  function handleRowClick(route: RouteRecord) {
    // re-fetch with stops
    routesApi.get(route.id).then(r => setSelected(r.data.data!))
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary)' }}>
            <PackageCheck size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Deliveries</h1>
            <p className="text-xs text-gray-500">{total} route{total !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input
          type="date"
          value={dateFilter}
          onChange={e => { setDateFilter(e.target.value); setPage(0) }}
          className="h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <div className="w-44">
          <SearchableDropdown
            options={STATUS_FILTER_OPTIONS}
            value={statusFilter}
            onChange={v => { setStatusFilter(v); setPage(0) }}
            placeholder="All statuses"
          />
        </div>
        <div className="w-52">
          <SearchableDropdown
            options={driverOptions}
            value={driverFilter}
            onChange={v => { setDriverFilter(v); setPage(0) }}
            placeholder="All drivers"
          />
        </div>
        {(statusFilter || driverFilter || dateFilter !== todayIso()) && (
          <button
            onClick={() => { setStatusFilter(''); setDriverFilter(''); setDateFilter(todayIso()); setPage(0) }}
            className="h-9 px-3 text-xs font-medium text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: 'var(--color-primary)' }}>
              {['Driver', 'Truck', 'Date', 'Stops', 'Status', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-white/90 uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading && [...Array(5)].map((_, i) => (
              <tr key={i}>
                {[...Array(6)].map((_, j) => (
                  <td key={j} className="px-4 py-3">
                    <div className="h-4 bg-gray-100 rounded animate-pulse w-24" />
                  </td>
                ))}
              </tr>
            ))}
            {!isLoading && routes.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-400 text-sm">
                  No deliveries found for the selected filters
                </td>
              </tr>
            )}
            {routes.map(route => (
              <tr
                key={route.id}
                onClick={() => handleRowClick(route)}
                className="cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <td className="px-4 py-3 font-medium text-gray-900">{route.driverName ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600">{route.truckNumber ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600">{route.routeDate}</td>
                <td className="px-4 py-3 text-gray-600">{route.stopCount}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={route.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  <ChevronRight size={16} className="text-gray-300 ml-auto" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Page {page + 1} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => p - 1)}
                disabled={page === 0}
                className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= totalPages - 1}
                className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {selected && <DeliveryDrawer route={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
