import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Plus, X, Wrench, ChevronRight, Pencil, Trash2, MapPin, ClipboardList } from 'lucide-react'
import { pumpsApi, type PumpRecord, type PumpStatus, type PumpOwner, type MaintenanceType } from '@/api/pumps'
import { tanksApi } from '@/api/tanks'
import { clientsApi } from '@/api/clients'
import { leasesApi } from '@/api/leases'
import { wellsApi } from '@/api/wells'
import { plansApi } from '@/api/plans'
import { SearchableDropdown, type DropdownOption } from '@/components/ui/SearchableDropdown'
import { useAuthStore } from '@/store/authStore'

const PAGE_SIZE = 20

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: PumpStatus }) {
  const map: Record<PumpStatus, { bg: string; text: string; ring: string; dot: string }> = {
    IN_SHOP:      { bg: 'bg-gray-50',    text: 'text-gray-600',   ring: 'ring-gray-200',   dot: 'bg-gray-400'   },
    DEPLOYED:     { bg: 'bg-emerald-50', text: 'text-emerald-700',ring: 'ring-emerald-200',dot: 'bg-emerald-500' },
    UNDER_REPAIR: { bg: 'bg-orange-50',  text: 'text-orange-700', ring: 'ring-orange-200', dot: 'bg-orange-400'  },
  }
  const labels: Record<PumpStatus, string> = {
    IN_SHOP: 'Available', DEPLOYED: 'Deployed', UNDER_REPAIR: 'Under Repair',
  }
  const s = map[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ${s.bg} ${s.text} ${s.ring}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {labels[status]}
    </span>
  )
}

// ── Schemas ───────────────────────────────────────────────────────────────────

const pumpSchema = z.object({
  serialNumber: z.string().min(1, 'Serial number is required'),
  make:         z.string().optional(),
  model:        z.string().optional(),
  pumpType:     z.string().optional(),
  owner:        z.enum(['OWN', 'THIRD_PARTY']),
  notes:        z.string().optional(),
})
const maintenanceSchema = z.object({
  maintenanceType: z.enum(['SERVICE', 'REPAIR', 'INSPECTION']),
  performedAt:     z.string().min(1, 'Date is required'),
  notes:           z.string().optional(),
})

type PumpForm        = z.infer<typeof pumpSchema>
type MaintenanceForm = z.infer<typeof maintenanceSchema>

const PUMP_TYPE_OPTIONS: DropdownOption[] = [
  { value: 'Chemical Injection Pump', label: 'Chemical Injection Pump' },
  { value: 'Metering Pump',           label: 'Metering Pump'           },
  { value: 'Diaphragm Pump',          label: 'Diaphragm Pump'          },
  { value: 'Plunger Pump',            label: 'Plunger Pump'            },
  { value: 'Peristaltic Pump',        label: 'Peristaltic Pump'        },
]
const OWNER_OPTIONS: DropdownOption[] = [
  { value: 'OWN',         label: 'Endura (OWN)' },
  { value: 'THIRD_PARTY', label: 'Third Party'   },
]
const MAINTENANCE_OPTIONS: DropdownOption[] = [
  { value: 'SERVICE',    label: 'Service'    },
  { value: 'REPAIR',     label: 'Repair'     },
  { value: 'INSPECTION', label: 'Inspection' },
]
const STATUS_FILTER_OPTIONS: DropdownOption[] = [
  { value: 'IN_SHOP',      label: 'Available'    },
  { value: 'DEPLOYED',     label: 'Deployed'     },
  { value: 'UNDER_REPAIR', label: 'Under Repair' },
]
const MAINTENANCE_LABELS: Record<MaintenanceType, string> = {
  SERVICE: 'Service', REPAIR: 'Repair', INSPECTION: 'Inspection',
}

// ── Form Panel ────────────────────────────────────────────────────────────────

function PumpFormPanel({ open, pump, onClose }: { open: boolean; pump?: PumpRecord; onClose: () => void }) {
  const qc     = useQueryClient()
  const isEdit = !!pump

  const { watch, setValue, handleSubmit, reset, formState: { errors } } = useForm<PumpForm>({
    resolver: zodResolver(pumpSchema),
    defaultValues: { owner: 'OWN' },
  })

  useEffect(() => {
    if (open) {
      reset({
        serialNumber: pump?.serialNumber ?? '',
        make:         pump?.make         ?? '',
        model:        pump?.model        ?? '',
        pumpType:     pump?.pumpType     ?? '',
        owner:        pump?.owner        ?? 'OWN',
        notes:        pump?.notes        ?? '',
      })
    }
  }, [open, pump])

  const mutation = useMutation({
    mutationFn: (data: PumpForm) =>
      isEdit ? pumpsApi.update(pump!.id, data) : pumpsApi.create(data),
    onSuccess: () => {
      toast.success(isEdit ? 'Pump updated' : 'Pump registered')
      qc.invalidateQueries({ queryKey: ['pumps'] })
      onClose()
    },
    onError: () => toast.error('Failed to save pump'),
  })

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative bg-white w-full md:w-[440px] h-full shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary)' }}>
              <Wrench size={14} className="text-white" />
            </div>
            <h2 className="text-sm font-semibold text-gray-900">{isEdit ? 'Edit Pump' : 'Register Pump'}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Serial Number <span className="text-red-500">*</span>
              </label>
              <input
                value={watch('serialNumber') ?? ''}
                onChange={e => setValue('serialNumber', e.target.value, { shouldValidate: true })}
                placeholder="e.g. ENC-2024-001"
                className="w-full h-9 px-3 text-sm rounded-lg border border-gray-200 outline-none transition focus:ring-2"
              />
              {errors.serialNumber && <p className="text-red-500 text-xs">{errors.serialNumber.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Make</label>
                <input
                  value={watch('make') ?? ''}
                  onChange={e => setValue('make', e.target.value)}
                  placeholder="e.g. Stenner"
                  className="w-full h-9 px-3 text-sm rounded-lg border border-gray-200 outline-none transition focus:ring-2"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Model</label>
                <input
                  value={watch('model') ?? ''}
                  onChange={e => setValue('model', e.target.value)}
                  placeholder="e.g. 45MHP5"
                  className="w-full h-9 px-3 text-sm rounded-lg border border-gray-200 outline-none transition focus:ring-2"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pump Type</label>
              <SearchableDropdown
                options={PUMP_TYPE_OPTIONS}
                value={watch('pumpType') ?? ''}
                onChange={v => setValue('pumpType', v ?? '')}
                placeholder="Select pump type"
                showClear={false}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Owner</label>
              <SearchableDropdown
                options={OWNER_OPTIONS}
                value={watch('owner')}
                onChange={v => setValue('owner', (v ?? 'OWN') as PumpOwner)}
                placeholder="Select owner"
                showClear={false}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Notes</label>
              <textarea
                value={watch('notes') ?? ''}
                onChange={e => setValue('notes', e.target.value)}
                rows={3}
                placeholder="Any additional notes..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 outline-none transition focus:ring-2 resize-none"
              />
            </div>
          </div>

          <div className="px-5 py-4 flex gap-3 shrink-0" style={{ borderTop: '1px solid rgba(0,0,0,0.07)' }}>
            <button type="button" onClick={onClose}
              className="flex-1 h-10 text-sm font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={mutation.isPending}
              className="flex-1 h-10 text-sm font-semibold text-white rounded-lg transition disabled:opacity-60"
              style={{ backgroundColor: 'var(--color-primary)' }}>
              {mutation.isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Register Pump'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Deploy Panel ──────────────────────────────────────────────────────────────

function DeployPanel({ open, pump, onClose }: { open: boolean; pump: PumpRecord; onClose: () => void }) {
  const qc = useQueryClient()
  const [clientId,  setClientId]  = useState('')
  const [leaseId,   setLeaseId]   = useState('')
  const [wellId,    setWellId]    = useState('')
  const [programId, setProgramId] = useState('')

  useEffect(() => {
    if (open) { setClientId(''); setLeaseId(''); setWellId(''); setProgramId('') }
  }, [open])

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-all'],
    queryFn:  () => clientsApi.list({ size: 200 }).then(r => r.data.data?.content ?? []),
    enabled:  open,
  })

  const { data: leases = [] } = useQuery({
    queryKey: ['leases-by-client', clientId],
    queryFn:  () => leasesApi.list({ clientId, size: 200 }).then(r => r.data.data?.content ?? []),
    enabled:  !!clientId,
  })

  const { data: wells = [] } = useQuery({
    queryKey: ['wells-by-lease', leaseId],
    queryFn:  () => wellsApi.list({ leaseId, size: 200 }).then(r => r.data.data?.content ?? []),
    enabled:  !!leaseId,
  })

  const { data: programs = [] } = useQuery({
    queryKey: ['programs-by-well', wellId],
    queryFn:  () => plansApi.list({ wellId, status: 'ACTIVE', size: 100 }).then(r => r.data.data?.content ?? []),
    enabled:  !!wellId,
  })

  const selectedProgram = programs.find(p => p.id === programId)
  const resolvedTankId  = selectedProgram?.lines.find(l => l.tankId)?.tankId ?? null

  const { data: resolvedTank } = useQuery({
    queryKey: ['tank', resolvedTankId],
    queryFn:  () => tanksApi.get(resolvedTankId!).then(r => r.data.data),
    enabled:  !!resolvedTankId,
  })

  const mutation = useMutation({
    mutationFn: () => pumpsApi.deploy(pump.id, { tankId: resolvedTankId! }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pumps'] })
      qc.invalidateQueries({ queryKey: ['pump', pump.id] })
      toast.success('Pump deployed')
      onClose()
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? 'Failed to deploy pump')
    },
  })

  if (!open) return null

  const clientOptions  = clients.map(c => ({ value: c.id, label: c.companyName }))
  const leaseOptions   = leases.map(l => ({ value: l.id, label: l.leaseName }))
  const wellOptions    = wells.map(w => ({ value: w.id, label: w.wellName }))
  const programOptions = programs.map(p => ({
    value: p.id,
    label: p.lines.length > 0 ? p.lines.map(l => l.productName).join(', ') : `Program ${p.id.slice(0, 8)}`,
  }))

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative bg-white w-full md:w-[440px] h-full shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary)' }}>
              <MapPin size={14} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Deploy Pump</h2>
              <p className="text-xs text-gray-400">{pump.serialNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              1. Client <span className="text-red-500">*</span>
            </label>
            <SearchableDropdown
              options={clientOptions}
              value={clientId}
              onChange={v => { setClientId(v ?? ''); setLeaseId(''); setWellId(''); setProgramId('') }}
              placeholder="Select client..."
              showClear={false}
            />
          </div>

          <div className={`space-y-1.5 transition-opacity ${!clientId ? 'opacity-40 pointer-events-none' : ''}`}>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              2. Lease <span className="text-red-500">*</span>
            </label>
            <SearchableDropdown
              options={leaseOptions}
              value={leaseId}
              onChange={v => { setLeaseId(v ?? ''); setWellId(''); setProgramId('') }}
              placeholder={clientId ? 'Select lease...' : 'Select client first'}
              showClear={false}
            />
          </div>

          <div className={`space-y-1.5 transition-opacity ${!leaseId ? 'opacity-40 pointer-events-none' : ''}`}>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              3. Well <span className="text-red-500">*</span>
            </label>
            <SearchableDropdown
              options={wellOptions}
              value={wellId}
              onChange={v => { setWellId(v ?? ''); setProgramId('') }}
              placeholder={leaseId ? 'Select well...' : 'Select lease first'}
              showClear={false}
            />
          </div>

          <div className={`space-y-1.5 transition-opacity ${!wellId ? 'opacity-40 pointer-events-none' : ''}`}>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              4. Treatment Program <span className="text-red-500">*</span>
            </label>
            <SearchableDropdown
              options={programOptions}
              value={programId}
              onChange={v => setProgramId(v ?? '')}
              placeholder={wellId ? (programs.length === 0 ? 'No active programs' : 'Select program...') : 'Select well first'}
              showClear={false}
            />
            {wellId && programs.length === 0 && (
              <p className="text-xs text-amber-600">No active programs on this well.</p>
            )}
          </div>

          {programId && (
            <div className={`rounded-lg px-4 py-3 border ${resolvedTankId ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
              {resolvedTankId ? (
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-emerald-700">Tank Resolved</p>
                    <p className="text-xs text-emerald-600 mt-0.5">
                      {resolvedTank
                        ? `${resolvedTank.serialNumber ?? 'Tank'} · ${resolvedTank.capacityGallons} gal`
                        : 'Loading…'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-amber-700">No Tank Assigned</p>
                    <p className="text-xs text-amber-600 mt-0.5">Assign a tank to this program in Programs first.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-5 py-4 flex gap-3 shrink-0" style={{ borderTop: '1px solid rgba(0,0,0,0.07)' }}>
          <button type="button" onClick={onClose}
            className="flex-1 h-10 text-sm font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!resolvedTankId || mutation.isPending}
            className="flex-1 h-10 text-sm font-semibold text-white rounded-lg transition disabled:opacity-50"
            style={{ backgroundColor: 'var(--color-primary)' }}>
            {mutation.isPending ? 'Deploying…' : 'Deploy'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Maintenance Panel ─────────────────────────────────────────────────────────

function MaintenancePanel({ open, pump, onClose }: { open: boolean; pump: PumpRecord; onClose: () => void }) {
  const qc = useQueryClient()
  const { watch, setValue, handleSubmit, reset, formState: { errors } } = useForm<MaintenanceForm>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: { maintenanceType: 'SERVICE' },
  })

  useEffect(() => {
    if (open) reset({ maintenanceType: 'SERVICE', performedAt: '', notes: '' })
  }, [open])

  const mutation = useMutation({
    mutationFn: (data: MaintenanceForm) => pumpsApi.logMaintenance(pump.id, {
      ...data,
      performedAt: new Date(data.performedAt).toISOString(),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pumps'] })
      qc.invalidateQueries({ queryKey: ['pump', pump.id] })
      toast.success('Maintenance logged')
      onClose()
    },
    onError: () => toast.error('Failed to log maintenance'),
  })

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative bg-white w-full md:w-[440px] h-full shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary)' }}>
              <ClipboardList size={14} className="text-white" />
            </div>
            <h2 className="text-sm font-semibold text-gray-900">Log Maintenance</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Type <span className="text-red-500">*</span></label>
            <SearchableDropdown
              options={MAINTENANCE_OPTIONS}
              value={watch('maintenanceType')}
              onChange={v => setValue('maintenanceType', (v ?? 'SERVICE') as MaintenanceType)}
              placeholder="Select type"
              showClear={false}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Date <span className="text-red-500">*</span></label>
            <input
              type="date"
              value={watch('performedAt') ?? ''}
              onChange={e => setValue('performedAt', e.target.value, { shouldValidate: true })}
              className="w-full h-9 px-3 text-sm rounded-lg border border-gray-200 outline-none transition focus:ring-2"
            />
            {errors.performedAt && <p className="text-red-500 text-xs">{errors.performedAt.message}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Notes</label>
            <textarea
              value={watch('notes') ?? ''}
              onChange={e => setValue('notes', e.target.value)}
              rows={3}
              placeholder="Describe the work done..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 outline-none transition focus:ring-2 resize-none"
            />
          </div>
        </div>

        <div className="px-5 py-4 flex gap-3 shrink-0" style={{ borderTop: '1px solid rgba(0,0,0,0.07)' }}>
          <button type="button" onClick={onClose}
            className="flex-1 h-10 text-sm font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit(d => mutation.mutate(d))} disabled={mutation.isPending}
            className="flex-1 h-10 text-sm font-semibold text-white rounded-lg transition disabled:opacity-60"
            style={{ backgroundColor: 'var(--color-primary)' }}>
            {mutation.isPending ? 'Saving…' : 'Log Maintenance'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Pump Drawer ───────────────────────────────────────────────────────────────

function PumpDrawer({ pump, onClose, onEdit, canEdit }: {
  pump: PumpRecord; onClose: () => void; onEdit: () => void; canEdit: boolean
}) {
  const qc = useQueryClient()
  const [deployOpen, setDeployOpen] = useState(false)
  const [maintOpen,  setMaintOpen]  = useState(false)

  const { data } = useQuery({
    queryKey: ['pump', pump.id],
    queryFn:  () => pumpsApi.get(pump.id).then(r => r.data.data!),
  })
  const p = data ?? pump

  const pullMutation = useMutation({
    mutationFn: () => pumpsApi.pull(p.id),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['pumps'] }); qc.invalidateQueries({ queryKey: ['pump', p.id] }); toast.success('Pump pulled to shop') },
    onError:    () => toast.error('Failed to pull pump'),
  })

  const repairMutation = useMutation({
    mutationFn: () => pumpsApi.sendToRepair(p.id),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['pumps'] }); qc.invalidateQueries({ queryKey: ['pump', p.id] }); toast.success('Pump sent to repair') },
    onError:    () => toast.error('Failed to update status'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => pumpsApi.delete(p.id),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['pumps'] }); toast.success('Pump deleted'); onClose() },
    onError:    (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? 'Failed to delete pump')
    },
  })

  return (
    <>
      <div className="fixed inset-0 z-40 flex justify-end">
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative bg-white w-full md:w-[440px] h-full shadow-2xl flex flex-col">

          <div className="px-5 pt-4 pb-3 border-b border-gray-100 shrink-0 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">{p.serialNumber}</p>
                <p className="text-xs text-gray-400 mt-0.5">{[p.make, p.model].filter(Boolean).join(' ') || 'No make/model'}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {canEdit && (
                  <button onClick={onEdit}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
                    <Pencil size={13} />
                  </button>
                )}
                {canEdit && (
                  <button
                    onClick={() => { if (confirm('Delete this pump?')) deleteMutation.mutate() }}
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

            {canEdit && p.status === 'IN_SHOP' && (
              <button onClick={() => setDeployOpen(true)}
                className="h-8 px-3 text-xs font-semibold rounded-lg text-white transition"
                style={{ backgroundColor: 'var(--color-primary)' }}>
                Deploy to Tank
              </button>
            )}
            {canEdit && p.status === 'DEPLOYED' && (
              p.onActiveTreatment ? (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 max-w-xs">
                  Pump is at <strong>{p.wellName ?? 'a well'}</strong> on an active treatment — pause or complete the treatment to pull back.
                </p>
              ) : (
                <button onClick={() => pullMutation.mutate()} disabled={pullMutation.isPending}
                  className="h-8 px-3 text-xs font-semibold rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60">
                  Pull from Site
                </button>
              )
            )}
            {canEdit && p.status !== 'UNDER_REPAIR' && (
              p.onActiveTreatment ? null : (
                <button onClick={() => repairMutation.mutate()} disabled={repairMutation.isPending}
                  className="h-8 px-3 text-xs font-semibold rounded-lg border border-orange-200 text-orange-700 hover:bg-orange-50 transition-colors disabled:opacity-60 ml-2">
                  Send to Repair
                </button>
              )
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Status</p>
                <div className="mt-0.5"><StatusBadge status={p.status} /></div>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Owner</p>
                <p className="text-sm text-gray-800 mt-0.5">{p.owner === 'OWN' ? 'Endura' : 'Third Party'}</p>
              </div>
              {p.pumpType && (
                <div className="col-span-2">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Type</p>
                  <p className="text-sm text-gray-800 mt-0.5">{p.pumpType}</p>
                </div>
              )}
              {p.status === 'DEPLOYED' && p.tankSerial && (
                <>
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Tank</p>
                    <p className="text-sm text-gray-800 mt-0.5">{p.tankSerial}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Well</p>
                    <p className="text-sm text-gray-800 mt-0.5">{p.wellName ?? '—'}</p>
                  </div>
                  {p.leaseName && (
                    <div>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Lease</p>
                      <p className="text-sm text-gray-800 mt-0.5">{p.leaseName}</p>
                    </div>
                  )}
                  {p.clientName && (
                    <div>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Client</p>
                      <p className="text-sm text-gray-800 mt-0.5">{p.clientName}</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {p.notes && (
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Notes</p>
                <p className="text-sm text-gray-600 mt-0.5">{p.notes}</p>
              </div>
            )}

            {/* Maintenance history */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Maintenance History</p>
                {canEdit && (
                  <button onClick={() => setMaintOpen(true)}
                    className="text-xs font-medium hover:underline"
                    style={{ color: 'var(--color-primary)' }}>
                    + Log
                  </button>
                )}
              </div>
              {p.maintenanceLogs.length === 0 ? (
                <p className="text-xs text-gray-400">No maintenance records yet.</p>
              ) : (
                <div className="space-y-2">
                  {p.maintenanceLogs.map(log => (
                    <div key={log.id} className="border border-gray-100 rounded-lg px-3 py-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-700">{MAINTENANCE_LABELS[log.maintenanceType]}</span>
                        <span className="text-[10px] text-gray-400">{new Date(log.performedAt).toLocaleDateString()}</span>
                      </div>
                      {log.performedByName && <p className="text-[10px] text-gray-400 mt-0.5">By {log.performedByName}</p>}
                      {log.notes && <p className="text-xs text-gray-600 mt-1">{log.notes}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {deployOpen && <DeployPanel      open={deployOpen} pump={p} onClose={() => setDeployOpen(false)} />}
      {maintOpen  && <MaintenancePanel open={maintOpen}  pump={p} onClose={() => setMaintOpen(false)}  />}
    </>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function PumpShopPage() {
  const { user } = useAuthStore()
  const canEdit = user?.role === 'ADMIN' || user?.role === 'MANAGER'

  const [page,         setPage]         = useState(0)
  const [statusFilter, setStatusFilter] = useState('')
  const [formOpen,     setFormOpen]     = useState(false)
  const [editing,      setEditing]      = useState<PumpRecord | undefined>()
  const [selected,     setSelected]     = useState<PumpRecord | undefined>()

  const { data, isLoading } = useQuery({
    queryKey: ['pumps', page, statusFilter],
    queryFn:  () => pumpsApi.list({ page, size: PAGE_SIZE, ...(statusFilter ? { status: statusFilter } : {}) })
      .then(r => r.data.data!),
  })

  const pumps      = data?.content       ?? []
  const total      = data?.totalElements ?? 0
  const totalPages = data?.totalPages    ?? 0

  function openCreate() { setEditing(undefined); setSelected(undefined); setFormOpen(true) }
  function openEdit(p: PumpRecord) { setEditing(p); setSelected(undefined); setFormOpen(true) }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Pump Shop</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} pump{total !== 1 ? 's' : ''} in registry</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-44">
            <SearchableDropdown
              options={STATUS_FILTER_OPTIONS}
              value={statusFilter}
              onChange={v => { setStatusFilter(v); setPage(0) }}
              placeholder="All Statuses"
              showClear
            />
          </div>
          {canEdit && (
            <button onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg transition"
              style={{ backgroundColor: 'var(--color-primary)' }}>
              <Plus size={15} /> Register Pump
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: 'var(--color-primary)' }}>
              {['Serial No', 'Make / Model', 'Type', 'Owner', 'Status', 'Location', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-white/90 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 7 }).map((_, j) => (
                  <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" /></td>
                ))}</tr>
              ))
            ) : pumps.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-14 text-center">
                  <Wrench size={32} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-sm text-gray-500 font-medium">No pumps registered</p>
                  <p className="text-xs text-gray-400 mt-1">Register Endura pumps to track deployment and maintenance</p>
                </td>
              </tr>
            ) : pumps.map(p => (
              <tr key={p.id}
                onClick={() => { setSelected(p); setFormOpen(false) }}
                className="hover:bg-gray-50 cursor-pointer transition-colors">
                <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-700">{p.serialNumber}</td>
                <td className="px-4 py-3 text-gray-600 text-xs">{[p.make, p.model].filter(Boolean).join(' ') || '—'}</td>
                <td className="px-4 py-3 text-gray-600 text-xs">{p.pumpType ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600 text-xs">{p.owner === 'OWN' ? 'Endura' : 'Third Party'}</td>
                <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {p.status === 'DEPLOYED' ? p.wellName ?? p.tankSerial ?? '—' : 'Midland, TX'}
                </td>
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
        <PumpFormPanel
          open={formOpen}
          pump={editing}
          onClose={() => { setFormOpen(false); setEditing(undefined) }}
        />
      )}

      {selected && !formOpen && (
        <PumpDrawer
          pump={selected}
          onClose={() => setSelected(undefined)}
          onEdit={() => openEdit(selected)}
          canEdit={canEdit}
        />
      )}
    </div>
  )
}
