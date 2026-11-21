import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { Plus, X, Warehouse, ChevronRight, Pencil, Trash2 } from 'lucide-react'
import { yardsApi, type YardRecord, type YardPayload } from '@/api/yards'
import { SearchableDropdown, type DropdownOption } from '@/components/ui/SearchableDropdown'
import { useAuthStore, hasAnyRole } from '@/store/authStore'

const PAGE_SIZE = 20

const ACTIVE_FILTER_OPTIONS: DropdownOption[] = [
  { value: 'true',  label: 'Active'   },
  { value: 'false', label: 'Inactive' },
]

function StatusBadge({ active }: { active: boolean }) {
  const s = active
    ? { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200', dot: 'bg-emerald-500' }
    : { bg: 'bg-gray-50',    text: 'text-gray-500',    ring: 'ring-gray-200',    dot: 'bg-gray-400'    }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ${s.bg} ${s.text} ${s.ring}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {active ? 'Active' : 'Inactive'}
    </span>
  )
}

// ── Form panel ──────────────────────────────────────────────────────────────
const yardSchema = z.object({
  name:     z.string().min(1, 'Name is required'),
  location: z.string().optional().or(z.literal('')),
  isActive: z.boolean(),
})
type YardFormData = z.infer<typeof yardSchema>

function YardFormPanel({ open, onClose, yard }: {
  open: boolean; onClose: () => void; yard?: YardRecord
}) {
  const qc = useQueryClient()
  const isEdit = !!yard

  const { watch, setValue, handleSubmit, reset, formState: { errors } } = useForm<YardFormData>({
    resolver: zodResolver(yardSchema),
    defaultValues: {
      name:     yard?.name     ?? '',
      location: yard?.location ?? '',
      isActive: yard?.isActive ?? true,
    },
  })

  const mutation = useMutation({
    mutationFn: (data: YardPayload) =>
      isEdit ? yardsApi.update(yard!.id, data) : yardsApi.create(data),
    onSuccess: () => {
      toast.success(isEdit ? 'Yard updated' : 'Yard created')
      qc.invalidateQueries({ queryKey: ['yards'] })
      onClose(); reset()
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to save yard'),
  })

  function onSubmit(data: YardFormData) {
    mutation.mutate({
      name:     data.name,
      location: data.location || undefined,
      isActive: data.isActive,
    })
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative bg-white w-full md:w-[440px] h-full shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary)' }}>
              <Warehouse size={14} className="text-white" />
            </div>
            <h2 className="text-sm font-semibold text-gray-900">{isEdit ? 'Edit Yard' : 'Create Yard'}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                value={watch('name') ?? ''}
                onChange={e => setValue('name', e.target.value, { shouldValidate: true })}
                placeholder="e.g. Midland Yard"
                className="w-full h-9 px-3 text-sm rounded-lg border border-gray-200 outline-none transition focus:ring-2"
              />
              {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Location</label>
              <input
                value={watch('location') ?? ''}
                onChange={e => setValue('location', e.target.value)}
                placeholder="Optional — address or area"
                className="w-full h-9 px-3 text-sm rounded-lg border border-gray-200 outline-none transition focus:ring-2"
              />
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={watch('isActive')}
                onChange={e => setValue('isActive', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
                style={{ accentColor: 'var(--color-primary)' }}
              />
              <span className="text-sm text-gray-700">Active</span>
            </label>

            <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2.5">
              Warehouses belong to a yard; service techs and drivers are assigned to yards.
            </p>
          </div>

          <div className="px-5 py-4 flex gap-3 shrink-0" style={{ borderTop: '1px solid rgba(0,0,0,0.07)' }}>
            <button type="button" onClick={onClose}
              className="flex-1 h-10 text-sm font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={mutation.isPending}
              className="flex-1 h-10 text-sm font-semibold text-white rounded-lg transition disabled:opacity-60"
              style={{ backgroundColor: 'var(--color-primary)' }}>
              {mutation.isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Yard'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Detail drawer ─────────────────────────────────────────────────────────────
function YardDrawer({ yard, onClose, onEdit, canDelete }: {
  yard: YardRecord; onClose: () => void; onEdit: () => void; canDelete: boolean
}) {
  const qc = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: () => yardsApi.delete(yard.id),
    onSuccess: () => {
      toast.success('Yard deleted')
      qc.invalidateQueries({ queryKey: ['yards'] })
      onClose()
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to delete yard'),
  })

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative bg-white w-full md:w-[440px] h-full shadow-2xl flex flex-col">
        <div className="px-5 pt-4 pb-3 border-b border-gray-100 shrink-0 flex items-start justify-between gap-3">
          <p className="text-sm font-semibold text-gray-900 min-w-0 break-words">{yard.name}</p>
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={onEdit}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
              <Pencil size={13} />
            </button>
            {canDelete && (
              <button
                onClick={() => { if (confirm('Delete this yard?')) deleteMutation.mutate() }}
                disabled={deleteMutation.isPending}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-60">
                <Trash2 size={13} />
              </button>
            )}
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="px-5 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Location</p>
              <p className="text-sm text-gray-800 mt-0.5">{yard.location ?? '—'}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Status</p>
              <div className="mt-0.5"><StatusBadge active={yard.isActive} /></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function YardsPage() {
  const { user } = useAuthStore()
  const canEdit   = hasAnyRole(user, 'ADMIN', 'MANAGER')
  const canDelete = hasAnyRole(user, 'ADMIN', 'MANAGER')

  const [page, setPage]             = useState(0)
  const [search, setSearch]         = useState('')
  const [activeFilter, setActiveFilter] = useState<string>('')
  const [formOpen, setFormOpen]     = useState(false)
  const [editing, setEditing]       = useState<YardRecord | undefined>()
  const [selected, setSelected]     = useState<YardRecord | undefined>()

  const { data, isLoading } = useQuery({
    queryKey: ['yards', page, search],
    queryFn: () => yardsApi.list({ page, size: PAGE_SIZE, ...(search ? { search } : {}) }),
  })

  const allYards   = data?.data?.data?.content       ?? []
  const total      = data?.data?.data?.totalElements ?? 0
  const totalPages = data?.data?.data?.totalPages    ?? 0
  const yards = activeFilter ? allYards.filter(y => String(y.isActive) === activeFilter) : allYards

  function openCreate() { setEditing(undefined); setSelected(undefined); setFormOpen(true) }
  function openEdit(y: YardRecord) { setEditing(y); setSelected(undefined); setFormOpen(true) }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Yards</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} yard{total !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0) }}
            placeholder="Search yards…"
            className="w-48 h-9 px-3 text-sm rounded-lg border border-gray-200 outline-none transition focus:ring-2"
          />
          <div className="w-36">
            <SearchableDropdown
              options={ACTIVE_FILTER_OPTIONS}
              value={activeFilter}
              onChange={v => setActiveFilter(v)}
              placeholder="All"
              showClear
            />
          </div>
          {canEdit && (
            <button onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg transition"
              style={{ backgroundColor: 'var(--color-primary)' }}>
              <Plus size={15} /> Create Yard
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: 'var(--color-primary)' }}>
              {['Name', 'Location', 'Status', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-white/90 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 4 }).map((_, j) => (
                  <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" /></td>
                ))}</tr>
              ))
            ) : yards.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-14 text-center">
                  <Warehouse size={32} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-sm text-gray-500 font-medium">No yards yet</p>
                  <p className="text-xs text-gray-400 mt-1">Create a yard to group warehouses, techs, and drivers</p>
                </td>
              </tr>
            ) : yards.map(y => (
              <tr key={y.id}
                onClick={() => { setSelected(y); setFormOpen(false) }}
                className="hover:bg-gray-50 cursor-pointer transition-colors">
                <td className="px-4 py-3 font-semibold text-gray-800">{y.name}</td>
                <td className="px-4 py-3 text-gray-600 text-xs">{y.location ?? '—'}</td>
                <td className="px-4 py-3"><StatusBadge active={y.isActive} /></td>
                <td className="px-4 py-3 text-right"><ChevronRight size={14} className="text-gray-400 ml-auto" /></td>
              </tr>
            ))}
          </tbody>
        </table></div>

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
        <YardFormPanel
          open={formOpen}
          onClose={() => { setFormOpen(false); setEditing(undefined) }}
          yard={editing}
        />
      )}

      {selected && !formOpen && (
        <YardDrawer
          yard={selected}
          onClose={() => setSelected(undefined)}
          onEdit={() => openEdit(selected)}
          canDelete={canDelete}
        />
      )}
    </div>
  )
}
