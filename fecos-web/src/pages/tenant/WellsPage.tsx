import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { Plus, Search, X, Drill, ChevronRight, MapPin } from 'lucide-react'
import { wellsApi, type WellRecord, type WellPayload } from '@/api/wells'
import { leasesApi, type LeaseRecord } from '@/api/leases'
import { pumpTypesApi, type PumpTypeRecord } from '@/api/pumpTypes'
import { SearchableDropdown, type DropdownOption } from '@/components/ui/SearchableDropdown'
import { useAuthStore } from '@/store/authStore'

const PAGE_SIZE = 10

const schema = z.object({
  leaseId:    z.string().min(1, 'Lease is required'),
  wellName:   z.string().min(1, 'Required').max(100),
  wellNumber: z.string().max(50).optional().or(z.literal('')),
  apiNumber:  z.string().max(20).optional().or(z.literal('')),
  pumpType:   z.string().min(1, 'Pump type is required'),
  isActive:   z.boolean(),
})
type FormData = z.infer<typeof schema>

// ── Shared components ─────────────────────────────────────────────────────────
function WellInitials({ name }: { name: string }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white" style={{ backgroundColor: 'var(--color-primary)' }}>
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
function WellFormPanel({
  open, onClose, well, leases,
}: {
  open: boolean; onClose: () => void; well?: WellRecord; leases: LeaseRecord[]
}) {
  const qc = useQueryClient()
  const isEdit = !!well

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      leaseId:          well?.leaseId          ?? '',
      wellName:         well?.wellName          ?? '',
      wellNumber:       well?.wellNumber        ?? '',
      apiNumber:        well?.apiNumber         ?? '',
      pumpType:         well?.pumpType          ?? '',

      isActive:         well?.isActive          ?? true,
    },
  })

  const mutation = useMutation({
    mutationFn: (data: WellPayload) =>
      isEdit ? wellsApi.update(well!.id, data) : wellsApi.create(data),
    onSuccess: () => {
      toast.success(isEdit ? 'Well updated' : 'Well created')
      qc.invalidateQueries({ queryKey: ['wells'] })
      onClose(); reset()
    },
    onError: (e: unknown) =>
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed'),
  })

  function onSubmit(data: FormData) {
    mutation.mutate({
      leaseId:          data.leaseId,
      wellName:         data.wellName,
      wellNumber:       data.wellNumber  || undefined,
      apiNumber:        data.apiNumber   || undefined,
      pumpType:         data.pumpType,
      isActive:         data.isActive,
    })
  }

  const leaseOptions: DropdownOption[] = leases.map(l => ({
    value: l.id,
    label: l.leaseName,
    meta:  l.clientName ?? undefined,
  }))

  const { data: pumpTypesData } = useQuery({
    queryKey: ['pump-types'],
    queryFn: () => pumpTypesApi.list().then(r => r.data.data ?? []),
  })
  const pumpTypeOptions: DropdownOption[] = (pumpTypesData ?? [])
    .filter((pt: PumpTypeRecord) => pt.isActive)
    .map((pt: PumpTypeRecord) => ({ value: pt.name, label: pt.name }))

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white w-[440px] h-full shadow-2xl flex flex-col">

        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary)' }}>
              <Drill size={14} className="text-white" />
            </div>
            <h2 className="text-sm font-semibold text-gray-900">{isEdit ? 'Edit Well' : 'New Well'}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

            {/* Lease */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Lease <span className="text-red-500">*</span>
              </label>
              <SearchableDropdown
                value={watch('leaseId') || null}
                onChange={v => setValue('leaseId', v ?? '', { shouldValidate: true })}
                options={leaseOptions}
                placeholder="Select lease"
                searchPlaceholder="Search leases…"
                showClear={false}
              />
              {errors.leaseId && <p className="text-red-500 text-xs">{errors.leaseId.message}</p>}
            </div>

            <div className="border-t border-gray-100" />

            {/* Well Name + Number */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Well Name <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('wellName')}
                  placeholder="e.g. Well 1A"
                  className={`w-full h-10 px-3 text-sm rounded-lg border outline-none transition focus:ring-2 focus:ring-red-100 ${errors.wellName ? 'border-red-400' : 'border-gray-200'}`}
                />
                {errors.wellName && <p className="text-red-500 text-xs">{errors.wellName.message}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Well #</label>
                <input
                  {...register('wellNumber')}
                  placeholder="e.g. 01-A"
                  className="w-full h-10 px-3 text-sm rounded-lg border border-gray-200 outline-none transition focus:ring-2 focus:ring-red-100"
                />
              </div>
            </div>

            {/* API Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">API Number</label>
              <input
                {...register('apiNumber')}
                placeholder="42-xxx-xxxxx"
                className="w-full h-10 px-3 text-sm rounded-lg border border-gray-200 outline-none transition focus:ring-2 focus:ring-red-100"
              />
            </div>

            <div className="border-t border-gray-100" />

            {/* Pump Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pump Type *</label>
              <SearchableDropdown
                options={pumpTypeOptions}
                value={watch('pumpType')}
                onChange={v => setValue('pumpType', v ?? '')}
                placeholder="Select pump type"
                showClear={false}
              />
              {errors.pumpType && <p className="text-xs text-red-500">{errors.pumpType.message}</p>}
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

          <div className="px-5 py-4 flex gap-3 shrink-0" style={{ borderTop: '1px solid rgba(0,0,0,0.07)' }}>
            <button type="button" onClick={onClose}
              className="flex-1 h-10 text-sm font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={mutation.isPending}
              className="flex-1 h-10 text-sm font-semibold text-white rounded-lg transition disabled:opacity-60"
              style={{ backgroundColor: 'var(--color-primary)' }}>
              {mutation.isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Well'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Detail Drawer ─────────────────────────────────────────────────────────────
function WellDrawer({
  well, onClose, onEdit, onDelete, canEdit,
}: {
  well: WellRecord; onClose: () => void; onEdit: () => void; onDelete: () => void; canEdit: boolean
}) {
  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white w-96 h-full shadow-2xl flex flex-col">

        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <h3 className="text-sm font-semibold text-gray-900">Well Details</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 text-white text-base font-bold" style={{ backgroundColor: 'var(--color-primary)' }}>
              {well.wellName.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 pt-1">
              <p className="font-semibold text-gray-900 text-base">{well.wellName}</p>
              {well.wellNumber && <p className="text-xs text-gray-500 mt-0.5">#{well.wellNumber}</p>}
              <div className="mt-2"><StatusBadge active={well.isActive} /></div>
            </div>
          </div>

          <div className="border-t border-gray-100" />

          <div className="space-y-3">
            {[
              { label: 'Lease',       value: well.leaseName  },
              { label: 'Client',      value: well.clientName },
              { label: 'API Number',  value: well.apiNumber  },
              { label: 'Pump Type',   value: well.pumpType },

            ].filter(r => r.value).map(({ label, value }) => (
              <div key={label}>
                <p className="text-[11px] text-gray-400 uppercase tracking-wide font-semibold">{label}</p>
                <p className="text-sm text-gray-800 mt-0.5">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {canEdit && (
          <div className="px-5 py-4 border-t border-gray-100 flex gap-2 shrink-0">
            <button onClick={onEdit}
              className="flex-1 flex items-center justify-center h-9 text-sm font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
              Edit
            </button>
            <button onClick={onDelete}
              className="flex items-center justify-center h-9 px-4 text-sm font-medium rounded-lg border border-red-100 text-red-600 hover:bg-red-50 transition-colors">
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export function WellsPage() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const canEdit = user?.role === 'ADMIN'

  const [search, setSearch]           = useState('')
  const [leaseFilter, setLeaseFilter] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [page, setPage]               = useState(0)
  const [formOpen, setFormOpen]       = useState(false)
  const [editing, setEditing]         = useState<WellRecord | undefined>()
  const [selected, setSelected]       = useState<WellRecord | undefined>()

  const params = {
    search:   search || undefined,
    leaseId:  leaseFilter || undefined,
    isActive: statusFilter === null ? undefined : statusFilter === 'active',
    page,
    size: PAGE_SIZE,
  }

  const { data, isLoading } = useQuery({
    queryKey: ['wells', params],
    queryFn:  () => wellsApi.list(params),
  })

  const { data: leasesData } = useQuery({
    queryKey: ['leases-all'],
    queryFn:  () => leasesApi.list({ size: 200 }).then(r => r.data.data?.content ?? []),
  })
  const leases: LeaseRecord[] = leasesData ?? []

  const deleteMutation = useMutation({
    mutationFn: (id: string) => wellsApi.delete(id),
    onSuccess: () => {
      toast.success('Well deleted')
      qc.invalidateQueries({ queryKey: ['wells'] })
      setSelected(undefined)
    },
    onError: () => toast.error('Failed to delete well'),
  })

  const wells      = data?.data?.data?.content      ?? []
  const total      = data?.data?.data?.totalElements ?? 0
  const totalPages = data?.data?.data?.totalPages    ?? 0

  const leaseOptions: DropdownOption[]  = leases.map(l => ({ value: l.id, label: l.leaseName, meta: l.clientName ?? undefined }))
  const statusOptions: DropdownOption[] = [
    { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' },
  ]

  function openCreate() { setEditing(undefined); setSelected(undefined); setFormOpen(true) }
  function openEdit(w: WellRecord) { setEditing(w); setSelected(undefined); setFormOpen(true) }
  function handleDelete(w: WellRecord) {
    if (!confirm(`Delete "${w.wellName}"?`)) return
    deleteMutation.mutate(w.id)
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Wells</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} well{total !== 1 ? 's' : ''} total</p>
        </div>
        {canEdit && (
          <button onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg transition"
            style={{ backgroundColor: 'var(--color-primary)' }}>
            <Plus size={15} /> New Well
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search wells…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0) }}
            className="h-9 pl-8 pr-3 text-sm rounded-lg border border-gray-200 outline-none transition focus:ring-2 focus:ring-red-100 w-48"
          />
        </div>
        <SearchableDropdown
          value={leaseFilter}
          onChange={v => { setLeaseFilter(v); setPage(0) }}
          options={leaseOptions}
          placeholder="All Leases"
          searchPlaceholder="Search leases…"
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

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: 'var(--color-primary)' }}>
              {['Well', 'Lease', 'API #', 'Pump Type', 'Status', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-white/90 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 6 }).map((_, j) => (
                  <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" /></td>
                ))}</tr>
              ))
            ) : wells.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-14 text-center">
                  <Drill size={32} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-sm text-gray-500 font-medium">No wells found</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {search || leaseFilter || statusFilter ? 'Try adjusting your filters' : 'Create your first well to get started'}
                  </p>
                </td>
              </tr>
            ) : wells.map(well => (
              <tr key={well.id} onClick={() => { setSelected(well); setFormOpen(false) }}
                className="hover:bg-gray-50 cursor-pointer transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <WellInitials name={well.wellName} />
                    <div>
                      <p className="font-medium text-gray-900">{well.wellName}</p>
                      {well.wellNumber && <p className="text-xs text-gray-400">#{well.wellNumber}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="text-gray-700">{well.leaseName ?? '—'}</p>
                  {well.clientName && <p className="text-xs text-gray-400">{well.clientName}</p>}
                </td>
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">{well.apiNumber ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600">{well.pumpType}</td>
                <td className="px-4 py-3"><StatusBadge active={well.isActive} /></td>
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
        <WellFormPanel open={formOpen} onClose={() => { setFormOpen(false); setEditing(undefined) }}
          well={editing} leases={leases} />
      )}
      {selected && !formOpen && (
        <WellDrawer well={selected} onClose={() => setSelected(undefined)}
          onEdit={() => openEdit(selected)} onDelete={() => handleDelete(selected)} canEdit={canEdit} />
      )}
    </div>
  )
}
