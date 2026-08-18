import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { Plus, X, Cylinder, ChevronRight, Pencil, Trash2 } from 'lucide-react'
import { tanksApi, type TankRecord, type TankPayload, type TankStatus } from '@/api/tanks'
import { useAuthStore } from '@/store/authStore'

const PAGE_SIZE = 20

const STATUS_LABEL: Record<TankStatus, string> = {
  AVAILABLE: 'Available',
  ASSIGNED:  'Assigned',
  INSTALLED: 'Installed',
  CLEANING:  'Cleaning',
}


function StatusBadge({ status }: { status: TankStatus }) {
  const map: Record<TankStatus, { bg: string; text: string; ring: string; dot: string }> = {
    AVAILABLE: { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200', dot: 'bg-emerald-500' },
    ASSIGNED:  { bg: 'bg-blue-50',    text: 'text-blue-700',    ring: 'ring-blue-200',    dot: 'bg-blue-500'    },
    INSTALLED: { bg: 'bg-amber-50',   text: 'text-amber-700',   ring: 'ring-amber-200',   dot: 'bg-amber-400'   },
    CLEANING:  { bg: 'bg-gray-50',    text: 'text-gray-500',    ring: 'ring-gray-200',    dot: 'bg-gray-400'    },
  }
  const s = map[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ${s.bg} ${s.text} ${s.ring}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {STATUS_LABEL[status]}
    </span>
  )
}

// ── Tank form panel ───────────────────────────────────────────────────────────
const tankSchema = z.object({
  serialNumber:    z.string().optional().or(z.literal('')),
  capacityGallons: z.string().refine(v => !isNaN(Number(v)) && Number(v) > 0, 'Must be a positive number'),
})
type TankFormData = z.infer<typeof tankSchema>

function TankFormPanel({ open, onClose, tank }: {
  open: boolean; onClose: () => void; tank?: TankRecord
}) {
  const qc = useQueryClient()
  const isEdit = !!tank

  const { watch, setValue, handleSubmit, reset, formState: { errors } } = useForm<TankFormData>({
    resolver: zodResolver(tankSchema),
    defaultValues: {
      serialNumber:    tank?.serialNumber ?? '',
      capacityGallons: tank?.capacityGallons?.toString() ?? '',
    },
  })

  const mutation = useMutation({
    mutationFn: (data: TankPayload) =>
      isEdit ? tanksApi.update(tank!.id, data) : tanksApi.create(data),
    onSuccess: () => {
      toast.success(isEdit ? 'Tank updated' : 'Tank registered')
      qc.invalidateQueries({ queryKey: ['tanks'] })
      onClose(); reset()
    },
    onError: () => toast.error('Failed to save tank'),
  })

  function onSubmit(data: TankFormData) {
    mutation.mutate({
      serialNumber:    data.serialNumber || undefined,
      capacityGallons: parseFloat(data.capacityGallons),
    })
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white w-[440px] h-full shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary)' }}>
              <Cylinder size={14} className="text-white" />
            </div>
            <h2 className="text-sm font-semibold text-gray-900">{isEdit ? 'Edit Tank' : 'Register Tank'}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Serial Number</label>
              <input
                value={watch('serialNumber') ?? ''}
                onChange={e => setValue('serialNumber', e.target.value)}
                placeholder="Optional — e.g. TK-2024-001"
                className="w-full h-9 px-3 text-sm rounded-lg border border-gray-200 outline-none transition focus:ring-2"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Capacity (gallons) <span className="text-red-500">*</span>
              </label>
              <input
                type="number" min="1" step="0.01"
                value={watch('capacityGallons') ?? ''}
                onChange={e => setValue('capacityGallons', e.target.value, { shouldValidate: true })}
                placeholder="e.g. 500"
                className="w-full h-9 px-3 text-sm rounded-lg border border-gray-200 outline-none transition focus:ring-2"
              />
              {errors.capacityGallons && <p className="text-red-500 text-xs">{errors.capacityGallons.message}</p>}
            </div>

            <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2.5">
              Tank assignment and level tracking happen at the treatment plan level, per line item.
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
              {mutation.isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Register Tank'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Tank detail drawer ─────────────────────────────────────────────────────────
function TankDrawer({ tank, onClose, onEdit, canDelete }: {
  tank: TankRecord; onClose: () => void; onEdit: () => void; canDelete: boolean
}) {
  const qc = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: () => tanksApi.delete(tank.id),
    onSuccess: () => {
      toast.success('Tank deleted')
      qc.invalidateQueries({ queryKey: ['tanks'] })
      onClose()
    },
    onError: () => toast.error('Failed to delete tank'),
  })

  const markAvailableMutation = useMutation({
    mutationFn: () => tanksApi.markAvailable(tank.id),
    onSuccess: () => {
      toast.success('Tank marked as available')
      qc.invalidateQueries({ queryKey: ['tanks'] })
      onClose()
    },
    onError: () => toast.error('Failed to update tank'),
  })

  const t = tank

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white w-[440px] h-full shadow-2xl flex flex-col">

        <div className="px-5 pt-4 pb-3 border-b border-gray-100 shrink-0 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-semibold text-gray-900 min-w-0 break-words">
              {t.serialNumber ?? 'Unnamed Tank'}
              <span className="ml-2 text-xs font-normal text-gray-400">{t.capacityGallons.toLocaleString()} gal</span>
            </p>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={onEdit}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
                <Pencil size={13} />
              </button>
              {canDelete && (
                <button
                  onClick={() => { if (confirm('Delete this tank?')) deleteMutation.mutate() }}
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
          {canDelete && t.status !== 'AVAILABLE' && (
            <button
              onClick={() => markAvailableMutation.mutate()}
              disabled={markAvailableMutation.isPending}
              className="h-8 px-3 text-xs font-semibold rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition-colors disabled:opacity-60">
              Mark Available
            </button>
          )}
        </div>

        <div className="px-5 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Capacity</p>
              <p className="text-sm text-gray-800 mt-0.5">{t.capacityGallons.toLocaleString()} gal</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Status</p>
              <div className="mt-0.5"><StatusBadge status={t.status} /></div>
            </div>
            {t.installedAt && (
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Installed</p>
                <p className="text-sm text-gray-800 mt-0.5">{new Date(t.installedAt).toLocaleDateString()}</p>
              </div>
            )}
            {t.removedAt && (
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Last Removed</p>
                <p className="text-sm text-gray-800 mt-0.5">{new Date(t.removedAt).toLocaleDateString()}</p>
              </div>
            )}
          </div>
          <div className="rounded-lg bg-gray-50 px-4 py-3">
            <p className="text-xs text-gray-500">Tank assignment and event history are managed from the <span className="font-semibold text-gray-700">Treatment Plan</span> line items.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function TanksPage() {
  const { user } = useAuthStore()
  const role = user?.role
  const canEdit   = role === 'ADMIN' || role === 'MANAGER' || role === 'ACCOUNT_REP'
  const canDelete = role === 'ADMIN' || role === 'MANAGER'

  const [page, setPage]         = useState(0)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing]   = useState<TankRecord | undefined>()
  const [selected, setSelected] = useState<TankRecord | undefined>()

  const { data, isLoading } = useQuery({
    queryKey: ['tanks', page],
    queryFn: () => tanksApi.list({ page, size: PAGE_SIZE }),
  })

  const tanks      = data?.data?.data?.content       ?? []
  const total      = data?.data?.data?.totalElements ?? 0
  const totalPages = data?.data?.data?.totalPages    ?? 0

  function openCreate() { setEditing(undefined); setSelected(undefined); setFormOpen(true) }
  function openEdit(t: TankRecord) { setEditing(t); setSelected(undefined); setFormOpen(true) }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Tanks</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} tank{total !== 1 ? 's' : ''} in registry</p>
        </div>
        {canEdit && (
          <button onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg transition"
            style={{ backgroundColor: 'var(--color-primary)' }}>
            <Plus size={15} /> Register Tank
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: 'var(--color-primary)' }}>
              {['Serial No', 'Capacity', 'Status', ''].map(h => (
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
            ) : tanks.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-14 text-center">
                  <Cylinder size={32} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-sm text-gray-500 font-medium">No tanks registered</p>
                  <p className="text-xs text-gray-400 mt-1">Register Endura-owned tanks to assign them to treatment plans</p>
                </td>
              </tr>
            ) : tanks.map(t => (
              <tr key={t.id}
                onClick={() => { setSelected(t); setFormOpen(false) }}
                className="hover:bg-gray-50 cursor-pointer transition-colors">
                <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-700">{t.serialNumber ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600">{t.capacityGallons.toLocaleString()} gal</td>
                <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
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
        <TankFormPanel
          open={formOpen}
          onClose={() => { setFormOpen(false); setEditing(undefined) }}
          tank={editing}
        />
      )}

      {selected && !formOpen && (
        <TankDrawer
          tank={selected}
          onClose={() => setSelected(undefined)}
          onEdit={() => openEdit(selected)}
          canDelete={canDelete}
        />
      )}
    </div>
  )
}
