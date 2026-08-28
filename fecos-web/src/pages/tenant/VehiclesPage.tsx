import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Plus, Truck, ChevronRight, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { vehiclesApi } from '@/api/vehicles'
import type { Vehicle, VehiclePayload, VehicleType, VehicleStatus } from '@/api/vehicles'
import { SearchableDropdown } from '@/components/ui/SearchableDropdown'

const TYPE_OPTS = [
  { value: 'TRUCK',           label: 'Truck'           },
  { value: 'TRAILER',         label: 'Trailer'         },
  { value: 'SERVICE_VEHICLE', label: 'Service Vehicle' },
]

const STATUS_OPTS = [
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'ASSIGNED',  label: 'Assigned'  },
  { value: 'ON_TRIP',   label: 'On Trip'   },
]

const CURRENT_YEAR = new Date().getFullYear()

function typeBadge(type: VehicleType) {
  const map: Record<VehicleType, { label: string; color: string }> = {
    TRUCK:           { label: 'Truck',           color: 'bg-blue-100 text-blue-700'  },
    TRAILER:         { label: 'Trailer',         color: 'bg-purple-100 text-purple-700' },
    SERVICE_VEHICLE: { label: 'Service Vehicle', color: 'bg-orange-100 text-orange-700' },
  }
  const { label, color } = map[type]
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>{label}</span>
}

function statusDot(status: VehicleStatus) {
  const map: Record<VehicleStatus, { label: string; dot: string }> = {
    AVAILABLE: { label: 'Available', dot: 'bg-green-500' },
    ASSIGNED:  { label: 'Assigned',  dot: 'bg-blue-500'  },
    ON_TRIP:   { label: 'On Trip',   dot: 'bg-amber-500' },
  }
  const { label, dot } = map[status]
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
      <span className="text-sm text-gray-700">{label}</span>
    </span>
  )
}

// ── Form Panel ─────────────────────────────────────────────────────────────────

function VehiclePanel({ vehicle, onClose, onSaved }: {
  vehicle?: Vehicle; onClose: () => void; onSaved: () => void
}) {
  const isEdit = !!vehicle
  const [form, setForm] = useState<VehiclePayload>({
    vehicleType:    vehicle?.vehicleType    ?? 'TRUCK',
    make:           vehicle?.make           ?? '',
    model:          vehicle?.model          ?? '',
    year:           vehicle?.year           ?? CURRENT_YEAR,
    licensePlate:   vehicle?.licensePlate   ?? '',
    vinNumber:      vehicle?.vinNumber      ?? '',
    dotNumber:      vehicle?.dotNumber      ?? '',
    currentMileage: vehicle?.currentMileage ?? undefined,
    status:         vehicle?.status         ?? 'AVAILABLE',
    notes:          vehicle?.notes          ?? '',
  })

  const mutation = useMutation({
    mutationFn: (data: VehiclePayload) =>
      isEdit ? vehiclesApi.update(vehicle!.id, data) : vehiclesApi.create(data),
    onSuccess: () => { toast.success(isEdit ? 'Vehicle updated' : 'Vehicle added'); onSaved() },
    onError:   () => toast.error('Failed to save vehicle'),
  })

  const set = <K extends keyof VehiclePayload>(k: K, v: VehiclePayload[K]) =>
    setForm(f => ({ ...f, [k]: v }))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.make || !form.model || !form.year || !form.licensePlate)
      return toast.error('Fill all required fields')
    mutation.mutate(form)
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-black/20" />
      <div className="relative w-full md:w-[440px] h-full bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 shrink-0" style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary)' }}>
            <Truck size={14} className="text-white" />
          </div>
          <h2 className="text-sm font-semibold text-gray-900">{isEdit ? 'Edit Vehicle' : 'Add Vehicle'}</h2>
          <button onClick={onClose} className="ml-auto text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Vehicle Type *</label>
            <SearchableDropdown
              value={form.vehicleType}
              onChange={v => set('vehicleType', (v ?? 'TRUCK') as VehicleType)}
              showClear={false}
              options={TYPE_OPTS}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Make *</label>
              <input value={form.make} onChange={e => set('make', e.target.value)}
                className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]"
                placeholder="e.g. Ford" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Model *</label>
              <input value={form.model} onChange={e => set('model', e.target.value)}
                className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]"
                placeholder="e.g. F-350" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Year *</label>
              <input type="number" min="1990" max={CURRENT_YEAR + 1} value={form.year}
                onChange={e => set('year', parseInt(e.target.value) || CURRENT_YEAR)}
                className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">License Plate *</label>
              <input value={form.licensePlate} onChange={e => set('licensePlate', e.target.value.toUpperCase())}
                className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] font-mono"
                placeholder="e.g. TX-1234" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">VIN <span className="text-gray-400">(optional)</span></label>
            <input value={form.vinNumber || ''} onChange={e => set('vinNumber', e.target.value.toUpperCase())}
              maxLength={17}
              className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] font-mono"
              placeholder="17-character VIN" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">DOT # <span className="text-gray-400">(optional)</span></label>
              <input value={form.dotNumber || ''} onChange={e => set('dotNumber', e.target.value)}
                className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]"
                placeholder="e.g. 1234567" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Mileage <span className="text-gray-400">(optional)</span></label>
              <input type="number" min="0" value={form.currentMileage ?? ''}
                onChange={e => set('currentMileage', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]"
                placeholder="e.g. 45000" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
            <SearchableDropdown
              value={form.status ?? 'ACTIVE'}
              onChange={v => set('status', (v ?? 'AVAILABLE') as VehicleStatus)}
              showClear={false}
              options={STATUS_OPTS}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Notes <span className="text-gray-400">(optional)</span></label>
            <textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)} rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]"
              placeholder="Any notes about this vehicle…" />
          </div>
        </form>

        {/* Footer */}
        <div className="px-5 py-4 flex gap-3 shrink-0" style={{ borderTop: '1px solid rgba(0,0,0,0.07)' }}>
          <button type="button" onClick={onClose}
            className="flex-1 h-10 text-sm font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={submit} disabled={mutation.isPending}
            className="flex-1 h-10 text-sm font-semibold rounded-lg text-white disabled:opacity-60 transition-colors"
            style={{ backgroundColor: 'var(--color-primary)' }}>
            {mutation.isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Vehicle'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Detail Drawer ──────────────────────────────────────────────────────────────

function VehicleDrawer({ vehicle, onClose, onEdit, onDeleted }: {
  vehicle: Vehicle; onClose: () => void; onEdit: () => void; onDeleted: () => void
}) {
  const qc = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: () => vehiclesApi.delete(vehicle.id),
    onSuccess:  () => { toast.success('Vehicle removed'); onDeleted() },
    onError:    () => toast.error('Failed to remove vehicle'),
  })

  const field = (label: string, value: React.ReactNode) => (
    <div>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-gray-900">{value ?? '—'}</p>
    </div>
  )

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="fixed inset-0 bg-black/20" />
      <div className="relative w-[600px] h-full bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 shrink-0" style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary)' }}>
            <Truck size={14} className="text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">{vehicle.year} {vehicle.make} {vehicle.model}</h2>
            <p className="text-xs text-gray-500 font-mono">{vehicle.licensePlate}</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {typeBadge(vehicle.vehicleType)}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 ml-1"><X size={18} /></button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Vehicle Info</h3>
            <div className="grid grid-cols-2 gap-4">
              {field('Type',          typeBadge(vehicle.vehicleType))}
              {field('Status',        statusDot(vehicle.status))}
              {field('Make',          vehicle.make)}
              {field('Model',         vehicle.model)}
              {field('Year',          vehicle.year)}
              {field('License Plate', <span className="font-mono">{vehicle.licensePlate}</span>)}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Compliance & Tracking</h3>
            <div className="grid grid-cols-2 gap-4">
              {field('VIN',           vehicle.vinNumber   ? <span className="font-mono text-xs">{vehicle.vinNumber}</span>   : null)}
              {field('DOT #',         vehicle.dotNumber   ? <span className="font-mono">{vehicle.dotNumber}</span>           : null)}
              {field('Current Mileage', vehicle.currentMileage != null ? `${vehicle.currentMileage.toLocaleString()} mi` : null)}
            </div>
          </div>

          {vehicle.notes && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Notes</h3>
              <p className="text-sm text-gray-700 leading-relaxed">{vehicle.notes}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex gap-3 shrink-0" style={{ borderTop: '1px solid rgba(0,0,0,0.07)' }}>
          <button
            onClick={() => { if (confirm('Remove this vehicle?')) deleteMutation.mutate() }}
            disabled={deleteMutation.isPending}
            className="flex items-center gap-2 h-10 px-4 text-sm font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60">
            <Trash2 size={14} /> Remove
          </button>
          <button onClick={onEdit}
            className="flex-1 h-10 text-sm font-semibold rounded-lg text-white transition-colors"
            style={{ backgroundColor: 'var(--color-primary)' }}>
            Edit Vehicle
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function VehiclesPage() {
  const [search,       setSearch]       = useState('')
  const [typeFilter,   setTypeFilter]   = useState<VehicleType | 'ALL'>('ALL')
  const [statusFilter, setStatusFilter] = useState<VehicleStatus | 'ALL'>('ALL')
  const [page,         setPage]         = useState(0)
  const [showCreate,   setShowCreate]   = useState(false)
  const [selected,     setSelected]     = useState<Vehicle | null>(null)
  const [editing,      setEditing]      = useState<Vehicle | null>(null)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['vehicles', search, typeFilter, statusFilter, page],
    queryFn:  () => vehiclesApi.list({
      search:  search || undefined,
      type:    typeFilter   !== 'ALL' ? typeFilter   as VehicleType   : undefined,
      status:  statusFilter !== 'ALL' ? statusFilter as VehicleStatus : undefined,
      page,
      size: 20,
    }),
  })

  const vehicles = data?.data?.data?.content ?? []
  const total    = data?.data?.data?.totalElements ?? 0
  const pages    = data?.data?.data?.totalPages ?? 1
  const refresh  = () => qc.invalidateQueries({ queryKey: ['vehicles'] })

  return (
    <div className="p-6 space-y-5">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(0) }}
            placeholder="Search make, model, plate…"
            className="h-9 px-3 text-sm border border-gray-200 rounded-lg w-56 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]" />
          <div className="w-44">
            <SearchableDropdown
              value={typeFilter}
              onChange={v => { setTypeFilter((v ?? 'ALL') as VehicleType | 'ALL'); setPage(0) }}
              showClear={false}
              options={[{ value: 'ALL', label: 'All Types' }, ...TYPE_OPTS]}
            />
          </div>
          <div className="w-44">
            <SearchableDropdown
              value={statusFilter}
              onChange={v => { setStatusFilter((v ?? 'ALL') as VehicleStatus | 'ALL'); setPage(0) }}
              showClear={false}
              options={[{ value: 'ALL', label: 'All Statuses' }, ...STATUS_OPTS]}
            />
          </div>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 h-9 px-4 text-sm font-semibold rounded-lg text-white shrink-0"
          style={{ backgroundColor: 'var(--color-primary)' }}>
          <Plus size={15} /> Add Vehicle
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: 'var(--color-primary)' }}>
              {['Type', 'Make & Model', 'Year', 'License Plate', 'DOT #', 'Mileage', 'Status', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-white">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-sm text-gray-400">Loading…</td></tr>
            ) : vehicles.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-14 text-center">
                  <Truck size={32} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-sm text-gray-500 font-medium">No vehicles found</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {total === 0 ? 'Add the first vehicle to get started' : 'Try adjusting your filters'}
                  </p>
                </td>
              </tr>
            ) : vehicles.map((v: Vehicle) => (
              <tr key={v.id} onClick={() => setSelected(v)} className="cursor-pointer hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">{typeBadge(v.vehicleType)}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{v.make} {v.model}</td>
                <td className="px-4 py-3 text-gray-600">{v.year}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-700">{v.licensePlate}</td>
                <td className="px-4 py-3 text-gray-600">{v.dotNumber ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600">{v.currentMileage != null ? `${v.currentMileage.toLocaleString()} mi` : '—'}</td>
                <td className="px-4 py-3">{statusDot(v.status)}</td>
                <td className="px-4 py-3 text-gray-400"><ChevronRight size={16} /></td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{total} vehicle{total !== 1 ? 's' : ''} · Page {page + 1} of {pages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => p - 1)} disabled={page === 0}
              className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Prev</button>
            <button onClick={() => setPage(p => p + 1)} disabled={page >= pages - 1}
              className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Next</button>
          </div>
        </div>
      )}

      {/* Drawer */}
      {selected && !editing && (
        <VehicleDrawer
          vehicle={selected}
          onClose={() => setSelected(null)}
          onEdit={() => { setEditing(selected); setSelected(null) }}
          onDeleted={() => { setSelected(null); refresh() }}
        />
      )}

      {/* Create / Edit Panel */}
      {(showCreate || editing) && (
        <VehiclePanel
          vehicle={editing ?? undefined}
          onClose={() => { setShowCreate(false); setEditing(null) }}
          onSaved={() => { setShowCreate(false); setEditing(null); refresh() }}
        />
      )}
    </div>
  )
}
