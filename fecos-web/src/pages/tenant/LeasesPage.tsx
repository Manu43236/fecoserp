import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import {
  Plus, Search, X, MapPin, ChevronRight, Building2, Navigation,
} from 'lucide-react'
import { leasesApi, type LeaseRecord, type LeasePayload } from '@/api/leases'
import { clientsApi, type ClientRecord } from '@/api/clients'
import { SearchableDropdown, type DropdownOption } from '@/components/ui/SearchableDropdown'
import { useAuthStore } from '@/store/authStore'

const PAGE_SIZE = 10

const schema = z.object({
  clientId:    z.string().min(1, 'Client is required'),
  leaseName:   z.string().min(1, 'Required').max(100),
  county:      z.string().max(100).optional().or(z.literal('')),
  state:       z.string().max(50).optional().or(z.literal('')),
  gpsLat:      z.string().optional().or(z.literal('')),
  gpsLng:      z.string().optional().or(z.literal('')),
  directions:  z.string().optional().or(z.literal('')),
  isActive:    z.boolean(),
})
type FormData = z.infer<typeof schema>

// ── Shared components ─────────────────────────────────────────────────────────
function LeaseInitials({ name, size = 'sm' }: { name: string; size?: 'sm' | 'lg' }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const cls = size === 'lg'
    ? 'w-14 h-14 rounded-2xl text-base font-bold'
    : 'w-9 h-9 rounded-full text-xs font-bold'
  return (
    <div className={`${cls} flex items-center justify-center shrink-0 text-white`} style={{ backgroundColor: 'var(--color-primary)' }}>
      {initials}
    </div>
  )
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ${
      active ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-gray-50 text-gray-500 ring-gray-200'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-gray-400'}`} />
      {active ? 'Active' : 'Inactive'}
    </span>
  )
}

// ── Form Panel ────────────────────────────────────────────────────────────────
function LeaseFormPanel({
  open, onClose, lease, clients,
}: {
  open: boolean; onClose: () => void; lease?: LeaseRecord; clients: ClientRecord[]
}) {
  const qc = useQueryClient()
  const isEdit = !!lease

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      clientId:   lease?.clientId   ?? '',
      leaseName:  lease?.leaseName  ?? '',
      county:     lease?.county     ?? '',
      state:      lease?.state      ?? '',
      gpsLat:     lease?.gpsLat     != null ? String(lease.gpsLat)  : '',
      gpsLng:     lease?.gpsLng     != null ? String(lease.gpsLng)  : '',
      directions: lease?.directions  ?? '',
      isActive:   lease?.isActive   ?? true,
    },
  })

  const mutation = useMutation({
    mutationFn: (data: LeasePayload) =>
      isEdit ? leasesApi.update(lease!.id, data) : leasesApi.create(data),
    onSuccess: () => {
      toast.success(isEdit ? 'Lease updated' : 'Lease created')
      qc.invalidateQueries({ queryKey: ['leases'] })
      onClose(); reset()
    },
    onError: (e: unknown) =>
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed'),
  })

  function onSubmit(data: FormData) {
    mutation.mutate({
      clientId:   data.clientId,
      leaseName:  data.leaseName,
      county:     data.county     || undefined,
      state:      data.state      || undefined,
      gpsLat:     data.gpsLat     ? parseFloat(data.gpsLat)  : null,
      gpsLng:     data.gpsLng     ? parseFloat(data.gpsLng)  : null,
      directions: data.directions || undefined,
      isActive:   data.isActive,
    })
  }

  const clientOptions: DropdownOption[] = clients.map(c => ({ value: c.id, label: c.companyName }))

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative bg-white w-[440px] h-full shadow-2xl flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary)' }}>
              <MapPin size={14} className="text-white" />
            </div>
            <h2 className="text-sm font-semibold text-gray-900">{isEdit ? 'Edit Lease' : 'New Lease'}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

            {/* Client */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Client <span className="text-red-500">*</span>
              </label>
              <SearchableDropdown
                value={watch('clientId') || null}
                onChange={v => setValue('clientId', v ?? '', { shouldValidate: true })}
                options={clientOptions}
                placeholder="Select client"
                searchPlaceholder="Search clients…"
                showClear={false}
              />
              {errors.clientId && <p className="text-red-500 text-xs">{errors.clientId.message}</p>}
            </div>

            <div className="border-t border-gray-100" />

            {/* Lease Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Lease Name <span className="text-red-500">*</span>
              </label>
              <input
                {...register('leaseName')}
                placeholder="e.g. Fasken Block 12"
                className={`w-full h-10 px-3 text-sm rounded-lg border outline-none transition focus:ring-2 focus:ring-red-100 ${errors.leaseName ? 'border-red-400' : 'border-gray-200'}`}
              />
              {errors.leaseName && <p className="text-red-500 text-xs">{errors.leaseName.message}</p>}
            </div>

            {/* County + State */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">County</label>
                <input
                  {...register('county')}
                  placeholder="Andrews"
                  className="w-full h-10 px-3 text-sm rounded-lg border border-gray-200 outline-none transition focus:ring-2 focus:ring-red-100"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">State</label>
                <input
                  {...register('state')}
                  placeholder="TX"
                  className="w-full h-10 px-3 text-sm rounded-lg border border-gray-200 outline-none transition focus:ring-2 focus:ring-red-100"
                />
              </div>
            </div>

            <div className="border-t border-gray-100" />

            {/* GPS */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                <Navigation size={11} className="text-gray-400" /> GPS Coordinates
              </label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  {...register('gpsLat')}
                  placeholder="Latitude (31.xxx)"
                  className="w-full h-10 px-3 text-sm rounded-lg border border-gray-200 outline-none transition focus:ring-2 focus:ring-red-100"
                />
                <input
                  {...register('gpsLng')}
                  placeholder="Longitude (-102.xxx)"
                  className="w-full h-10 px-3 text-sm rounded-lg border border-gray-200 outline-none transition focus:ring-2 focus:ring-red-100"
                />
              </div>
            </div>

            {/* Directions */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Directions to Lease</label>
              <textarea
                {...register('directions')}
                rows={3}
                placeholder="Turn right off Highway 385, gate on the left…"
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 outline-none transition focus:ring-2 focus:ring-red-100 resize-none"
              />
            </div>

            {/* Status — edit only */}
            {isEdit && (
              <>
                <div className="border-t border-gray-100" />
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</label>
                  <button
                    type="button"
                    onClick={() => setValue('isActive', !watch('isActive'))}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <div className={`relative w-9 h-5 rounded-full transition-colors duration-200 shrink-0 ${watch('isActive') ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${watch('isActive') ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </div>
                    <span className="text-sm font-medium text-gray-700">{watch('isActive') ? 'Active' : 'Inactive'}</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-4 flex gap-3 shrink-0" style={{ borderTop: '1px solid rgba(0,0,0,0.07)' }}>
            <button type="button" onClick={onClose}
              className="flex-1 h-10 text-sm font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={mutation.isPending}
              className="flex-1 h-10 text-sm font-semibold text-white rounded-lg transition disabled:opacity-60"
              style={{ backgroundColor: 'var(--color-primary)' }}>
              {mutation.isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Lease'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Detail Drawer ─────────────────────────────────────────────────────────────
function LeaseDrawer({
  lease, onClose, onEdit, onDelete, canEdit,
}: {
  lease: LeaseRecord; onClose: () => void; onEdit: () => void; onDelete: () => void; canEdit: boolean
}) {
  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative bg-white w-96 h-full shadow-2xl flex flex-col">

        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <h3 className="text-sm font-semibold text-gray-900">Lease Details</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          <div className="flex items-start gap-4">
            <LeaseInitials name={lease.leaseName} size="lg" />
            <div className="min-w-0 pt-1">
              <p className="font-semibold text-gray-900 text-base leading-tight">{lease.leaseName}</p>
              <p className="text-xs text-gray-500 mt-1">{lease.clientName ?? '—'}</p>
              <div className="mt-2"><StatusBadge active={lease.isActive} /></div>
            </div>
          </div>

          <div className="border-t border-gray-100" />

          <div className="space-y-4">
            {(lease.county || lease.state) && (
              <div className="flex items-start gap-3">
                <MapPin size={14} className="text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11px] text-gray-400 uppercase tracking-wide font-semibold">Location</p>
                  <p className="text-sm text-gray-800 mt-0.5">
                    {[lease.county, lease.state].filter(Boolean).join(', ')}
                  </p>
                </div>
              </div>
            )}
            {(lease.gpsLat != null && lease.gpsLng != null) && (
              <div className="flex items-start gap-3">
                <Navigation size={14} className="text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11px] text-gray-400 uppercase tracking-wide font-semibold">GPS</p>
                  <p className="text-sm text-gray-800 mt-0.5 font-mono text-xs">
                    {lease.gpsLat}, {lease.gpsLng}
                  </p>
                </div>
              </div>
            )}
            {lease.directions && (
              <div className="flex items-start gap-3">
                <Navigation size={14} className="text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11px] text-gray-400 uppercase tracking-wide font-semibold">Directions</p>
                  <p className="text-sm text-gray-800 mt-0.5 whitespace-pre-wrap">{lease.directions}</p>
                </div>
              </div>
            )}
            {lease.clientName && (
              <div className="flex items-start gap-3">
                <Building2 size={14} className="text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11px] text-gray-400 uppercase tracking-wide font-semibold">Client</p>
                  <p className="text-sm text-gray-800 mt-0.5">{lease.clientName}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {canEdit && (
          <div className="px-5 py-4 border-t border-gray-100 flex gap-2 shrink-0">
            <button onClick={onEdit}
              className="flex-1 flex items-center justify-center gap-2 h-9 text-sm font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
              Edit
            </button>
            <button onClick={onDelete}
              className="flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium rounded-lg border border-red-100 text-red-600 hover:bg-red-50 transition-colors">
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export function LeasesPage() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const canEdit = user?.role === 'ADMIN'

  const [search, setSearch]           = useState('')
  const [clientFilter, setClientFilter] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [page, setPage]               = useState(0)
  const [formOpen, setFormOpen]       = useState(false)
  const [editing, setEditing]         = useState<LeaseRecord | undefined>()
  const [selected, setSelected]       = useState<LeaseRecord | undefined>()

  const params = {
    search:   search || undefined,
    clientId: clientFilter || undefined,
    isActive: statusFilter === null ? undefined : statusFilter === 'active',
    page,
    size: PAGE_SIZE,
  }

  const { data, isLoading } = useQuery({
    queryKey: ['leases', params],
    queryFn:  () => leasesApi.list(params),
  })

  const { data: clientsData } = useQuery({
    queryKey: ['clients-all'],
    queryFn:  () => clientsApi.list({ size: 200 }).then(r => r.data.data?.content ?? []),
  })
  const clients: ClientRecord[] = clientsData ?? []

  const deleteMutation = useMutation({
    mutationFn: (id: string) => leasesApi.delete(id),
    onSuccess: () => {
      toast.success('Lease deleted')
      qc.invalidateQueries({ queryKey: ['leases'] })
      setSelected(undefined)
    },
    onError: () => toast.error('Failed to delete lease'),
  })

  const leases     = data?.data?.data?.content      ?? []
  const total      = data?.data?.data?.totalElements ?? 0
  const totalPages = data?.data?.data?.totalPages    ?? 0

  const clientOptions: DropdownOption[] = clients.map(c => ({ value: c.id, label: c.companyName }))
  const statusOptions: DropdownOption[] = [
    { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' },
  ]

  function openCreate() { setEditing(undefined); setSelected(undefined); setFormOpen(true) }
  function openEdit(l: LeaseRecord) { setEditing(l); setSelected(undefined); setFormOpen(true) }
  function handleDelete(l: LeaseRecord) {
    if (!confirm(`Delete "${l.leaseName}"? This cannot be undone.`)) return
    deleteMutation.mutate(l.id)
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Leases</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} lease{total !== 1 ? 's' : ''} total</p>
        </div>
        {canEdit && (
          <button onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg transition"
            style={{ backgroundColor: 'var(--color-primary)' }}>
            <Plus size={15} /> New Lease
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search leases…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0) }}
            className="h-9 pl-8 pr-3 text-sm rounded-lg border border-gray-200 outline-none transition focus:ring-2 focus:ring-red-100 w-52"
          />
        </div>
        <SearchableDropdown
          value={clientFilter}
          onChange={v => { setClientFilter(v); setPage(0) }}
          options={clientOptions}
          placeholder="All Clients"
          searchPlaceholder="Search clients…"
          className="w-52"
        />
        <SearchableDropdown
          value={statusFilter}
          onChange={v => { setStatusFilter(v); setPage(0) }}
          options={statusOptions}
          placeholder="All Statuses"
          className="w-40"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: 'var(--color-primary)' }}>
              {['Lease Name', 'Client', 'Location', 'Status', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-white/90 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 5 }).map((_, j) => (
                  <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" /></td>
                ))}</tr>
              ))
            ) : leases.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-14 text-center">
                  <MapPin size={32} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-sm text-gray-500 font-medium">No leases found</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {search || clientFilter || statusFilter ? 'Try adjusting your filters' : 'Create your first lease to get started'}
                  </p>
                </td>
              </tr>
            ) : leases.map(lease => (
              <tr key={lease.id} onClick={() => { setSelected(lease); setFormOpen(false) }}
                className="hover:bg-gray-50 cursor-pointer transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <LeaseInitials name={lease.leaseName} />
                    <span className="font-medium text-gray-900">{lease.leaseName}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600">{lease.clientName ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600">
                  {[lease.county, lease.state].filter(Boolean).join(', ') || '—'}
                </td>
                <td className="px-4 py-3"><StatusBadge active={lease.isActive} /></td>
                <td className="px-4 py-3 text-right"><ChevronRight size={14} className="text-gray-400 ml-auto" /></td>
              </tr>
            ))}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">Page {page + 1} of {totalPages} · {total} total</p>
            <div className="flex gap-2">
              <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 text-xs font-medium rounded-md border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors">Previous</button>
              <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 text-xs font-medium rounded-md border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors">Next</button>
            </div>
          </div>
        )}
      </div>

      {formOpen && (
        <LeaseFormPanel open={formOpen} onClose={() => { setFormOpen(false); setEditing(undefined) }}
          lease={editing} clients={clients} />
      )}
      {selected && !formOpen && (
        <LeaseDrawer lease={selected} onClose={() => setSelected(undefined)}
          onEdit={() => openEdit(selected)} onDelete={() => handleDelete(selected)} canEdit={canEdit} />
      )}
    </div>
  )
}
