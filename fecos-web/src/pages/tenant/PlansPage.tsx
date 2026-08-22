import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import {
  Plus, X, Search, ChevronRight, FlaskConical, Trash2, Cylinder, AlertTriangle, Pencil,
} from 'lucide-react'
import { plansApi, type PlanRecord, type PlanLineRecord, type PlanPayload, type PlanLinePayload, type PlanMethod, type PlanSchedule, type PlanStatus } from '@/api/plans'
import { pumpsApi } from '@/api/pumps'
import { wellsApi, type WellRecord } from '@/api/wells'
import { leasesApi, type LeaseRecord } from '@/api/leases'
import { productsApi } from '@/api/products'
import { tanksApi, type TankRecord, type TankStatus, type TankEventPayload } from '@/api/tanks'
import { SearchableDropdown, type DropdownOption } from '@/components/ui/SearchableDropdown'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/axios'
import type { ApiResponse } from '@/types'

const PAGE_SIZE = 20

interface UserRecord { id: string; fullName: string; role: string }

// ── Status helpers ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: PlanStatus }) {
  const map: Record<PlanStatus, { bg: string; text: string; ring: string; dot: string; label: string }> = {
    DRAFT:      { bg: 'bg-gray-50',    text: 'text-gray-500',    ring: 'ring-gray-200',    dot: 'bg-gray-400',    label: 'Draft' },
    ACTIVE:     { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200', dot: 'bg-emerald-500', label: 'Active' },
    PAUSED:     { bg: 'bg-amber-50',   text: 'text-amber-700',   ring: 'ring-amber-200',   dot: 'bg-amber-400',   label: 'Paused' },
    SUSPENDED:  { bg: 'bg-orange-50',  text: 'text-orange-700',  ring: 'ring-orange-200',  dot: 'bg-orange-400',  label: 'Suspended' },
    COMPLETED:  { bg: 'bg-blue-50',    text: 'text-blue-700',    ring: 'ring-blue-200',    dot: 'bg-blue-400',    label: 'Completed' },
    INACTIVE:   { bg: 'bg-gray-50',    text: 'text-gray-400',    ring: 'ring-gray-200',    dot: 'bg-gray-300',    label: 'Inactive' },
    SUPERSEDED: { bg: 'bg-purple-50',  text: 'text-purple-600',  ring: 'ring-purple-200',  dot: 'bg-purple-400',  label: 'Superseded' },
  }
  const s = map[status] ?? map.INACTIVE
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ${s.bg} ${s.text} ${s.ring}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  )
}

const METHOD_LABELS: Record<PlanMethod, string> = {
  CONTINUOUS: 'Continuous', BATCH: 'Batch',
}

const SCHEDULE_LABELS: Record<PlanSchedule, string> = {
  DAILY: 'Daily', WEEKLY: 'Weekly', BIWEEKLY: 'Bi-weekly', MONTHLY: 'Monthly',
}

const STATUS_OPTIONS: DropdownOption[] = [
  { value: 'ACTIVE',    label: 'Active' },
  { value: 'DRAFT',     label: 'Draft' },
  { value: 'PAUSED',    label: 'Paused' },
  { value: 'SUSPENDED', label: 'Suspended' },
  { value: 'COMPLETED', label: 'Completed' },
]

const METHOD_OPTIONS: DropdownOption[] = [
  { value: 'CONTINUOUS', label: 'Continuous' },
  { value: 'BATCH', label: 'Batch' },
]

const SCHEDULE_OPTIONS: DropdownOption[] = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'BIWEEKLY', label: 'Bi-weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
]

// ── Plan form schema ───────────────────────────────────────────────────────────
const planSchema = z.object({
  wellId:       z.string().min(1, 'Well is required'),
  accountRepId: z.string().optional().or(z.literal('')),
  status:       z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'SUSPENDED', 'COMPLETED', 'INACTIVE', 'SUPERSEDED']).optional(),
  notes:        z.string().optional().or(z.literal('')),
  startDate:    z.string().optional().or(z.literal('')),
  endDate:      z.string().optional().or(z.literal('')),
})
type PlanFormData = z.infer<typeof planSchema>

// ── Line form schema ───────────────────────────────────────────────────────────
const lineSchema = z.object({
  productId:          z.string().min(1, 'Product is required'),
  recRate:            z.string().refine(v => !isNaN(Number(v)) && Number(v) > 0, 'Must be a positive number'),
  method:             z.enum(['CONTINUOUS', 'BATCH']),
  schedule:           z.enum(['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY']).optional(),
  notes:              z.string().optional().or(z.literal('')),
  tankOwner:                z.enum(['OWN', 'THIRD_PARTY']).optional(),
  tankId:                   z.string().optional().or(z.literal('')),
  tankLevelPct:             z.string().optional().or(z.literal('')),
  tankLevelCheckedAt:       z.string().optional().or(z.literal('')),
  thirdPartyName:           z.string().optional().or(z.literal('')),
  thirdPartyCapacityGallons: z.string().optional().or(z.literal('')),
  thirdPartySerial:         z.string().optional().or(z.literal('')),
})
type LineFormData = z.infer<typeof lineSchema>


function LevelBar({ pct }: { pct: number }) {
  const color = pct <= 10 ? '#ef4444' : pct <= 20 ? '#f97316' : pct <= 40 ? '#eab308' : '#10b981'
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-semibold tabular-nums" style={{ color, minWidth: 40 }}>{pct.toFixed(2)}%</span>
    </div>
  )
}

function TankStatusBadge({ status }: { status: TankStatus }) {
  const map: Record<TankStatus, { bg: string; text: string; label: string }> = {
    AVAILABLE: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Available' },
    ASSIGNED:  { bg: 'bg-blue-50',    text: 'text-blue-700',    label: 'Assigned' },
    INSTALLED: { bg: 'bg-amber-50',   text: 'text-amber-700',   label: 'Installed' },
    CLEANING:  { bg: 'bg-gray-100',   text: 'text-gray-500',    label: 'Cleaning' },
  }
  const s = map[status] ?? map.CLEANING
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  )
}

// ── Plan form panel (440px right slide) ───────────────────────────────────────
function PlanFormPanel({
  open, onClose, plan, wellsData, leasesData, repOptions, canEdit,
  prefillWellId, prefillLeaseId, fromLabSampleNumber,
}: {
  open: boolean
  onClose: () => void
  plan?: PlanRecord
  wellsData: WellRecord[]
  leasesData: LeaseRecord[]
  repOptions: DropdownOption[]
  canEdit: boolean
  prefillWellId?: string
  prefillLeaseId?: string
  fromLabSampleNumber?: string
}) {
  const qc = useQueryClient()
  const isEdit = !!plan

  const initialLeaseId = plan
    ? (wellsData.find(w => w.id === plan.wellId)?.leaseId ?? null)
    : (prefillLeaseId ?? null)
  const [selectedLeaseId, setSelectedLeaseId] = useState<string | null>(initialLeaseId)

  const leaseOptions: DropdownOption[] = leasesData.map(l => ({ value: l.id, label: l.leaseName }))
  const filteredWellOptions: DropdownOption[] = selectedLeaseId
    ? wellsData.filter(w => w.leaseId === selectedLeaseId).map(w => ({ value: w.id, label: w.wellName }))
    : []

  const { handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<PlanFormData>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      wellId:       plan?.wellId       ?? prefillWellId ?? '',
      accountRepId: plan?.accountRepId ?? '',
      status:       plan?.status       ?? 'DRAFT',
      notes:        plan?.notes        ?? '',
      startDate:    plan?.startDate    ?? '',
      endDate:      plan?.endDate      ?? '',
    },
  })

  const mutation = useMutation({
    mutationFn: (data: PlanPayload) =>
      isEdit ? plansApi.update(plan!.id, data) : plansApi.create(data),
    onSuccess: () => {
      toast.success(isEdit ? 'Plan updated' : 'Plan created')
      qc.invalidateQueries({ queryKey: ['plans'] })
      onClose(); reset()
    },
    onError: (e: unknown) =>
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed'),
  })

  function onSubmit(data: PlanFormData) {
    mutation.mutate({
      wellId:       data.wellId,
      accountRepId: data.accountRepId || null,
      status:       isEdit ? (plan!.status as PlanStatus) : 'DRAFT',
      notes:        data.notes || undefined,
      startDate:    data.startDate || null,
      endDate:      null,
    })
  }

  if (!open) return null

  const selectedStatus = watch('status')

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative bg-white w-[440px] h-full shadow-2xl flex flex-col">

        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary)' }}>
              <FlaskConical size={14} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">{isEdit ? 'Edit Program' : 'New Program'}</h2>
              {fromLabSampleNumber && (
                <p className="text-xs text-amber-600 mt-0.5">Following lab result {fromLabSampleNumber}</p>
              )}
            </div>
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
                value={selectedLeaseId}
                onChange={v => {
                  setSelectedLeaseId(v)
                  setValue('wellId', '', { shouldValidate: false })
                  const lease = leasesData.find(l => l.id === v)
                  if (lease?.accountRepId) setValue('accountRepId', lease.accountRepId)
                }}
                options={leaseOptions}
                placeholder="Select lease first"
                searchPlaceholder="Search leases…"
                showClear={false}
              />
            </div>

            {/* Well */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Well <span className="text-red-500">*</span>
              </label>
              <SearchableDropdown
                value={watch('wellId') || null}
                onChange={v => setValue('wellId', v ?? '', { shouldValidate: true })}
                options={filteredWellOptions}
                placeholder={selectedLeaseId ? 'Select well' : 'Select a lease first'}
                searchPlaceholder="Search wells…"
                showClear={false}
              />
              {errors.wellId && <p className="text-red-500 text-xs">{errors.wellId.message}</p>}
            </div>

            {/* Account Rep */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Account Rep</label>
              <SearchableDropdown
                value={watch('accountRepId') || null}
                onChange={v => setValue('accountRepId', v ?? '')}
                options={repOptions}
                placeholder="Select account rep"
                searchPlaceholder="Search reps…"
              />
            </div>

            {/* Status — read-only, driven by actions */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</label>
              <div className="flex items-center h-9 px-3 rounded-lg border border-gray-100 bg-gray-50">
                <StatusBadge status={watch('status') ?? 'DRAFT'} />
                <span className="ml-2 text-xs text-gray-400">Use action buttons in the plan view to change status</span>
              </div>
            </div>

            {/* Date fields */}
            {(() => {
              const today = new Date().toISOString().split('T')[0]
              return (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {selectedStatus === 'DRAFT' ? 'Expected Start Date' : 'Start Date'}
                    </label>
                    <input
                      type="date"
                      value={watch('startDate') ?? ''}
                      onChange={e => setValue('startDate', e.target.value)}
                      disabled={!canEdit}
                      min={selectedStatus === 'DRAFT' ? today : undefined}
                      max={selectedStatus === 'ACTIVE' || selectedStatus === 'INACTIVE' ? today : undefined}
                      className="w-full h-9 px-3 text-sm rounded-lg border border-gray-200 outline-none transition focus:ring-2 disabled:bg-gray-50"
                    />
                    {selectedStatus === 'DRAFT' && (
                      <p className="text-xs text-gray-400">Future dates only — planned start</p>
                    )}
                    {selectedStatus === 'ACTIVE' && (
                      <p className="text-xs text-gray-400">Past or today — when treatment began</p>
                    )}
                  </div>

                  {selectedStatus === 'INACTIVE' && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">End Date</label>
                      <input
                        type="date"
                        value={watch('endDate') ?? ''}
                        onChange={e => setValue('endDate', e.target.value)}
                        disabled={!canEdit}
                        min={watch('startDate') || undefined}
                        max={today}
                        className="w-full h-9 px-3 text-sm rounded-lg border border-gray-200 outline-none transition focus:ring-2 disabled:bg-gray-50"
                      />
                      <p className="text-xs text-gray-400">Must be after start date, up to today</p>
                    </div>
                  )}
                </div>
              )
            })()}

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Notes</label>
              <textarea
                value={watch('notes') ?? ''}
                onChange={e => setValue('notes', e.target.value)}
                rows={3}
                disabled={!canEdit}
                placeholder="Treatment notes, special instructions…"
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 outline-none transition focus:ring-2 resize-none disabled:bg-gray-50"
              />
            </div>
          </div>

          {canEdit && (
            <div className="px-5 py-4 flex gap-3 shrink-0" style={{ borderTop: '1px solid rgba(0,0,0,0.07)' }}>
              <button type="button" onClick={onClose}
                className="flex-1 h-10 text-sm font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={mutation.isPending}
                className="flex-1 h-10 text-sm font-semibold text-white rounded-lg transition disabled:opacity-60"
                style={{ backgroundColor: 'var(--color-primary)' }}>
                {mutation.isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Plan'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

// ── Detail drawer ─────────────────────────────────────────────────────────────
function PlanDrawer({
  plan, onClose, onEdit, canEdit, canDelete,
}: {
  plan: PlanRecord
  onClose: () => void
  onEdit: () => void
  canEdit: boolean
  canDelete: boolean
}) {
  const qc = useQueryClient()
  const [showLineForm, setShowLineForm] = useState(false)
  const [editingLine, setEditingLine] = useState<PlanLineRecord | null>(null)
  const [deployPumpLine, setDeployPumpLine] = useState<PlanLineRecord | null>(null)
  const [selectedPumpId, setSelectedPumpId] = useState('')
  const [refillLineId, setRefillLineId] = useState<string | null>(null)
  const [refillAmount, setRefillAmount] = useState('')
  const [refillAt, setRefillAt] = useState(() => {
    const now = new Date()
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
  })
  const [historyLineId, setHistoryLineId] = useState<string | null>(null)

  const { data: fullData, isLoading } = useQuery({
    queryKey: ['plan', plan.id],
    queryFn: () => plansApi.get(plan.id).then(r => r.data.data!),
  })

  const { data: productsData } = useQuery({
    queryKey: ['products-active'],
    queryFn: () => productsApi.list({ isActive: true, size: 5000 }).then(r => r.data.data?.content ?? []),
  })

  const { data: tanksData } = useQuery({
    queryKey: ['tanks-all'],
    queryFn: () => tanksApi.list({ size: 5000 }).then(r => r.data.data?.content ?? []),
  })
  const tanks = (tanksData ?? []) as TankRecord[]
  const tankMap = new Map(tanks.map(t => [t.id, t]))

  const [historyTankId, setHistoryTankId] = useState<string | null>(null)
  const { data: historyTankData, isLoading: historyLoading } = useQuery({
    queryKey: ['tank-detail', historyTankId],
    queryFn: () => tanksApi.get(historyTankId!).then(r => r.data.data!),
    enabled: !!historyTankId,
  })
  const tankOptions: DropdownOption[] = tanks
    .filter(t => t.status === 'AVAILABLE' || t.id === editingLine?.tankId)
    .map(t => ({ value: t.id, label: t.serialNumber ?? `Tank (${t.capacityGallons} gal)` }))

  const { data: inShopPumps = [] } = useQuery({
    queryKey: ['pumps-in-shop'],
    queryFn: () => pumpsApi.list({ status: 'IN_SHOP', size: 200 }).then(r => r.data.data?.content ?? []),
    enabled: !!deployPumpLine,
  })

  const deployPumpMutation = useMutation({
    mutationFn: ({ pumpId, tankId }: { pumpId: string; tankId: string }) =>
      pumpsApi.deploy(pumpId, { tankId }),
    onSuccess: () => {
      toast.success('Pump deployed')
      qc.invalidateQueries({ queryKey: ['plan', plan.id] })
      qc.invalidateQueries({ queryKey: ['pumps-in-shop'] })
      qc.invalidateQueries({ queryKey: ['pumps'] })
      setDeployPumpLine(null)
      setSelectedPumpId('')
    },
    onError: () => toast.error('Failed to deploy pump'),
  })

  const products = productsData ?? []

  const { handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<LineFormData>({
    resolver: zodResolver(lineSchema),
    defaultValues: { productId: '', recRate: '', method: 'CONTINUOUS', schedule: undefined, notes: '', tankOwner: undefined, tankId: '', tankLevelPct: '', tankLevelCheckedAt: '', thirdPartyName: '', thirdPartyCapacityGallons: '', thirdPartySerial: '' },
  })

  const tankEventMutation = useMutation({
    mutationFn: ({ tankId, data }: { tankId: string; data: TankEventPayload }) =>
      tanksApi.logEvent(tankId, data),
    onSuccess: () => {
      toast.success('Tank updated')
      qc.invalidateQueries({ queryKey: ['tanks-all'] })
      qc.invalidateQueries({ queryKey: ['tanks'] })
      qc.invalidateQueries({ queryKey: ['plan', plan.id] })
      qc.invalidateQueries({ queryKey: ['tank-detail'] })
      setRefillLineId(null)
      setRefillAmount('')
      setRefillAt(new Date().toISOString().slice(0, 16))
    },
    onError: () => toast.error('Failed to update tank'),
  })

  function handleMarkInstalled(tankId: string) {
    tankEventMutation.mutate({ tankId, data: { eventType: 'INSTALLED', eventAt: new Date().toISOString() } })
  }

  function handleMarkRemoved(tankId: string) {
    if (!confirm('Mark this tank as removed from the well?')) return
    tankEventMutation.mutate({ tankId, data: { eventType: 'REMOVED', eventAt: new Date().toISOString() } })
  }

  function handleLogRefill(tankId: string) {
    if (!refillAmount) return toast.error('Enter gallons added')
    const t = tankMap.get(tankId)
    if (t) {
      const remaining = Math.ceil(t.capacityGallons - (t.calculatedLevelGallons ?? 0))
      if (parseFloat(refillAmount) > t.capacityGallons)
        return toast.error(`Cannot exceed tank capacity (${t.capacityGallons.toLocaleString()} gal)`)
      if (parseFloat(refillAmount) > remaining)
        return toast.error(`Max refill is ${remaining.toLocaleString()} gal (tank has ${Math.round(t.calculatedLevelGallons ?? 0).toLocaleString()} gal)`)
    }
    tankEventMutation.mutate({
      tankId,
      data: { eventType: 'REFILLED', amountGallons: parseFloat(refillAmount), eventAt: new Date(refillAt).toISOString() },
    })
  }

  const addLineMutation = useMutation({
    mutationFn: (data: PlanLinePayload) => plansApi.addLine(plan.id, data),
    onSuccess: () => {
      toast.success('Product added')
      qc.invalidateQueries({ queryKey: ['plan', plan.id] })
      qc.invalidateQueries({ queryKey: ['plans'] })
      reset(); setShowLineForm(false)
    },
    onError: () => toast.error('Failed to add product'),
  })

  const updateLineMutation = useMutation({
    mutationFn: ({ lineId, data }: { lineId: string; data: PlanLinePayload }) =>
      plansApi.updateLine(plan.id, lineId, data),
    onSuccess: () => {
      toast.success('Product updated')
      qc.invalidateQueries({ queryKey: ['plan', plan.id] })
      qc.invalidateQueries({ queryKey: ['plans'] })
      qc.invalidateQueries({ queryKey: ['tank-detail'] })
      reset(); setShowLineForm(false); setEditingLine(null)
    },
    onError: () => toast.error('Failed to update product'),
  })

  const removeLineMutation = useMutation({
    mutationFn: ({ lineId }: { lineId: string }) => plansApi.removeLine(plan.id, lineId),
    onSuccess: () => {
      toast.success('Product removed')
      qc.invalidateQueries({ queryKey: ['plan', plan.id] })
      qc.invalidateQueries({ queryKey: ['plans'] })
    },
    onError: () => toast.error('Failed to remove product'),
  })

  const deletePlanMutation = useMutation({
    mutationFn: () => plansApi.delete(plan.id),
    onSuccess: () => {
      toast.success('Plan deleted')
      qc.invalidateQueries({ queryKey: ['plans'] })
      onClose()
    },
    onError: () => toast.error('Failed to delete plan'),
  })

  const transitionMutation = useMutation({
    mutationFn: (action: string) => plansApi[action as keyof typeof plansApi](plan.id) as Promise<unknown>,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plan', plan.id] })
      qc.invalidateQueries({ queryKey: ['plans'] })
    },
    onError: () => toast.error('Failed to update treatment status'),
  })

  function buildLinePayload(data: LineFormData): PlanLinePayload {
    const isThirdParty = data.tankOwner === 'THIRD_PARTY'
    return {
      productId:                data.productId,
      recRate:                  parseFloat(data.recRate),
      method:                   data.method,
      schedule:                 data.method === 'BATCH' ? data.schedule : null,
      notes:                    data.notes || undefined,
      tankOwner:                data.tankOwner || null,
      tankId:                   data.tankOwner === 'OWN' && data.tankId ? data.tankId : null,
      tankLevelPct:             isThirdParty && data.tankLevelPct ? parseFloat(data.tankLevelPct) : null,
      tankLevelCheckedAt:       isThirdParty && data.tankLevelCheckedAt ? new Date(data.tankLevelCheckedAt).toISOString() : null,
      thirdPartyName:           isThirdParty ? (data.thirdPartyName || null) : null,
      thirdPartyCapacityGallons: isThirdParty && data.thirdPartyCapacityGallons ? parseFloat(data.thirdPartyCapacityGallons) : null,
      thirdPartySerial:         isThirdParty ? (data.thirdPartySerial || null) : null,
    }
  }

  function onAddLine(data: LineFormData) {
    addLineMutation.mutate(buildLinePayload(data))
  }

  function onUpdateLine(data: LineFormData) {
    if (!editingLine) return
    updateLineMutation.mutate({ lineId: editingLine.id, data: buildLinePayload(data) })
  }

  function openEditLine(line: PlanLineRecord) {
    setEditingLine(line)
    setShowLineForm(true)
    reset({
      productId:                 line.productId,
      recRate:                   line.recRate.toString(),
      method:                    line.method,
      schedule:                  line.schedule ?? undefined,
      notes:                     line.notes ?? '',
      tankOwner:                 line.tankOwner ?? undefined,
      tankId:                    line.tankId ?? '',
      tankLevelPct:              line.tankLevelPct?.toString() ?? '',
      tankLevelCheckedAt:        line.tankLevelCheckedAt ? new Date(line.tankLevelCheckedAt).toISOString().slice(0, 16) : '',
      thirdPartyName:            line.thirdPartyName ?? '',
      thirdPartyCapacityGallons: line.thirdPartyCapacityGallons?.toString() ?? '',
      thirdPartySerial:          line.thirdPartySerial ?? '',
    })
  }

  const p = fullData ?? plan
  const isReadOnly = p.status === 'COMPLETED' || p.status === 'SUSPENDED'
  const lines = fullData?.lines ?? []
  const productOptions: DropdownOption[] = products.map(pr => ({ value: pr.id, label: pr.name }))
  const usedProductIds = new Set(lines.map(l => l.productId))
  const availableProductOptions = productOptions.filter(opt => !usedProductIds.has(opt.value) || opt.value === editingLine?.productId)

  return (
    <>
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative bg-white w-[580px] h-full shadow-2xl flex flex-col">

        {/* Header */}
        <div className="px-5 pt-4 pb-3 border-b border-gray-100 shrink-0 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 break-words">{p.wellName ?? 'Program'}</p>
              <p className="text-xs text-gray-400">{p.leaseName ?? '—'} · {p.clientName ?? '—'}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {canEdit && !isReadOnly && (
                <button onClick={onEdit}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
                  <Pencil size={13} />
                </button>
              )}
              {canDelete && !isReadOnly && (
                <button
                  onClick={() => { if (confirm('Delete this program?')) deletePlanMutation.mutate() }}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors">
                  <Trash2 size={13} />
                </button>
              )}
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors">
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Status + transition actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={p.status} />
            {canEdit && p.status === 'DRAFT' && (() => {
              const tankReady   = lines.length > 0 && lines.every(l => !!l.tankId)
              const pumpReady   = lines.length > 0 && lines.every(l => l.pumpDeployed)
              const isReady     = tankReady && pumpReady
              return (
                <button
                  onClick={() => transitionMutation.mutate('start')}
                  disabled={!isReady || transitionMutation.isPending}
                  title={!isReady ? (!tankReady ? 'Assign tanks to all products first' : 'Deploy pumps to all tanks first') : undefined}
                  className="h-7 px-3 text-xs font-semibold rounded-lg text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ backgroundColor: 'var(--color-primary)' }}>
                  Start Treatment
                </button>
              )
            })()}
            {canEdit && p.status === 'ACTIVE' && (<>
              <button onClick={() => transitionMutation.mutate('pause')} disabled={transitionMutation.isPending}
                className="h-7 px-3 text-xs font-semibold rounded-lg border border-amber-200 text-amber-700 hover:bg-amber-50 transition disabled:opacity-60">
                Pause Treatment
              </button>
              <button onClick={() => { if (confirm('Remove tanks and suspend this treatment?')) transitionMutation.mutate('suspend') }} disabled={transitionMutation.isPending}
                className="h-7 px-3 text-xs font-semibold rounded-lg border border-orange-200 text-orange-700 hover:bg-orange-50 transition disabled:opacity-60">
                Remove Tanks
              </button>
              <button onClick={() => { if (confirm('Mark this treatment as completed?')) transitionMutation.mutate('complete') }} disabled={transitionMutation.isPending}
                className="h-7 px-3 text-xs font-semibold rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50 transition disabled:opacity-60">
                Complete
              </button>
            </>)}
            {canEdit && (p.status === 'PAUSED' || p.status === 'SUSPENDED') && (<>
              <button onClick={() => transitionMutation.mutate('resume')} disabled={transitionMutation.isPending}
                className="h-7 px-3 text-xs font-semibold rounded-lg text-white transition disabled:opacity-60"
                style={{ backgroundColor: 'var(--color-primary)' }}>
                Resume Treatment
              </button>
              <button onClick={() => { if (confirm('Mark this treatment as completed?')) transitionMutation.mutate('complete') }} disabled={transitionMutation.isPending}
                className="h-7 px-3 text-xs font-semibold rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50 transition disabled:opacity-60">
                Complete
              </button>
            </>)}
          </div>

          {/* Readiness checklist — DRAFT only */}
          {p.status === 'DRAFT' && lines.length > 0 && (() => {
            const tankReady = lines.every(l => !!l.tankId)
            const pumpReady = lines.every(l => l.pumpDeployed)
            if (tankReady && pumpReady) return null
            return (
              <div className="mt-2 space-y-1.5">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Required before start</p>
                <div className="flex items-center gap-1.5 text-xs">
                  <span className={tankReady ? 'text-emerald-500' : 'text-red-400'}>{tankReady ? '✓' : '✗'}</span>
                  <span className={tankReady ? 'text-gray-500' : 'text-red-500'}>Tank assigned to all products</span>
                </div>
                {lines.map(l => {
                  if (l.pumpDeployed) return null
                  if (!l.tankId) return null
                  return (
                    <div key={l.id} className="flex items-center gap-1.5 text-xs">
                      <span className="text-red-400">✗</span>
                      <span className="text-red-500 flex-1">{l.productName}: no pump deployed</span>
                      <button
                        onClick={() => { setDeployPumpLine(l); setSelectedPumpId('') }}
                        className="px-2 py-0.5 text-[10px] font-semibold rounded text-white"
                        style={{ backgroundColor: 'var(--color-primary)' }}>
                        Deploy Pump
                      </button>
                    </div>
                  )
                })}
              </div>
            )
          })()}
        </div>

        {/* Meta */}
        <div className="px-5 py-4 border-b border-gray-100 shrink-0 grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Account Rep</p>
            <p className="text-sm text-gray-800 mt-0.5">{p.accountRepName ?? '—'}</p>
          </div>
          {p.startDate && (
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">
                {p.status === 'DRAFT' ? 'Expected Start' : 'Start Date'}
              </p>
              <p className="text-sm text-gray-800 mt-0.5">
                {new Date(p.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          )}
          {p.status === 'INACTIVE' && p.endDate && (
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">End Date</p>
              <p className="text-sm text-gray-800 mt-0.5">
                {new Date(p.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          )}
          {p.startedAt && (
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Started At</p>
              <p className="text-sm text-gray-800 mt-0.5">
                {new Date(p.startedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                {' '}{new Date(p.startedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
              </p>
            </div>
          )}
          {p.pausedAt && (
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Paused At</p>
              <p className="text-sm text-gray-800 mt-0.5">
                {new Date(p.pausedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                {' '}{new Date(p.pausedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
              </p>
            </div>
          )}
          {p.resumedAt && (
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Resumed At</p>
              <p className="text-sm text-gray-800 mt-0.5">
                {new Date(p.resumedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                {' '}{new Date(p.resumedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
              </p>
            </div>
          )}
          {p.notes && (
            <div className="col-span-2">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Notes</p>
              <p className="text-sm text-gray-700 mt-0.5">{p.notes}</p>
            </div>
          )}
        </div>

        {/* Lines */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Chemical Line Items</p>
            <span className="text-xs text-gray-400">{lines.length} product{lines.length !== 1 ? 's' : ''}</span>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : lines.length === 0 && !showLineForm ? (
            <div className="text-center py-10">
              <FlaskConical size={28} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">No products yet</p>
              <p className="text-xs text-gray-400 mt-1">Add chemical products below</p>
            </div>
          ) : (
            <div className="space-y-3">
              {lines.map(line => {
                const tank = line.tankId ? tankMap.get(line.tankId) : undefined

                return (
                  <div key={line.id} className="rounded-xl border border-gray-200 bg-white overflow-hidden">

                    {/* ── Section 1: Chemical Product ──────────────────────── */}
                    <div className="px-4 pt-3 pb-3 flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                          style={{ backgroundColor: 'rgba(var(--color-primary-rgb, 30,58,95), 0.08)' }}>
                          <FlaskConical size={14} style={{ color: 'var(--color-primary)' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900">{line.productName}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-xs font-semibold text-gray-700">
                              {line.recRate} <span className="font-normal text-gray-500">{line.method === 'CONTINUOUS' ? 'gal / day' : 'gal / treatment'}</span>
                            </span>
                            <span className="text-gray-300">·</span>
                            <span className="text-xs text-gray-500">{METHOD_LABELS[line.method]}{line.schedule ? ` — ${SCHEDULE_LABELS[line.schedule]}` : ''}</span>
                          </div>
                          {line.notes && <p className="text-xs text-gray-400 mt-1 italic">{line.notes}</p>}
                          {line.recRatePrevious != null && (
                            <p className="text-xs text-amber-700 mt-1 flex items-center gap-1">
                              <AlertTriangle size={10} />
                              Rate changed from {line.recRatePrevious} by {line.recRateUpdatedByName ?? 'tech'}
                              {line.recRateUpdatedAt ? ` on ${new Date(line.recRateUpdatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}
                            </p>
                          )}
                        </div>
                      </div>
                      {canEdit && !isReadOnly && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => openEditLine(line)}
                            className="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                            <Pencil size={12} />
                          </button>
                          <button onClick={() => removeLineMutation.mutate({ lineId: line.id })} disabled={removeLineMutation.isPending}
                            className="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-60">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* ── Section 2: Tank ──────────────────────────────────── */}
                    <div className="border-t border-gray-100 px-4 py-3">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Tank</p>
                      {line.tankOwner === 'OWN' && tank ? (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                            <div>
                              <p className="text-[10px] text-gray-400 font-medium">Serial #</p>
                              <p className="text-sm font-semibold text-gray-800">{tank.serialNumber ?? '—'}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-400 font-medium">Type</p>
                              <p className="text-sm font-semibold text-gray-800">Own</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-400 font-medium">Capacity</p>
                              <p className="text-sm font-semibold text-gray-800">{tank.capacityGallons.toLocaleString()} gal</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-400 font-medium">Status</p>
                              <TankStatusBadge status={tank.status} />
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-400 font-medium">Last Refilled</p>
                              <p className="text-sm font-semibold text-gray-800">
                                {tank.lastRefilledAt ? (() => {
                                  const d = new Date(tank.lastRefilledAt)
                                  return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`
                                })() : 'Not yet refilled'}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-400 font-medium">Chemical in Tank</p>
                              <p className="text-sm font-semibold text-gray-800">
                                {tank.status === 'INSTALLED'
                                  ? `${tank.calculatedLevelGallons.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} gal`
                                  : '—'}
                              </p>
                            </div>
                          </div>
                          {tank.status === 'INSTALLED' && (
                            <div className="pt-1">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-[10px] text-gray-400 font-medium">Current Level</p>
                                <p className="text-sm font-bold tabular-nums"
                                  style={{ color: tank.calculatedLevelPct <= 10 ? '#ef4444' : tank.calculatedLevelPct <= 20 ? '#f97316' : tank.calculatedLevelPct <= 40 ? '#eab308' : '#10b981' }}>
                                  {tank.calculatedLevelPct.toFixed(2)}%
                                </p>
                              </div>
                              <LevelBar pct={tank.calculatedLevelPct} />
                              {tank.calculatedLevelPct <= 20 && (
                                <p className="text-xs font-semibold text-orange-600 flex items-center gap-1.5 mt-1.5">
                                  <AlertTriangle size={11} />
                                  {tank.calculatedLevelPct <= 10 ? 'Critical — refill urgently' : 'Refill needed soon'}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      ) : line.tankOwner === 'THIRD_PARTY' ? (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                            <div>
                              <p className="text-[10px] text-gray-400 font-medium">Type</p>
                              <p className="text-sm font-semibold text-gray-800">3rd Party</p>
                            </div>
                            {line.thirdPartyName && (
                              <div>
                                <p className="text-[10px] text-gray-400 font-medium">Owner</p>
                                <p className="text-sm font-semibold text-gray-800">{line.thirdPartyName}</p>
                              </div>
                            )}
                            {line.thirdPartyCapacityGallons != null && (
                              <div>
                                <p className="text-[10px] text-gray-400 font-medium">Capacity</p>
                                <p className="text-sm font-semibold text-gray-800">{line.thirdPartyCapacityGallons.toLocaleString()} gal</p>
                              </div>
                            )}
                            {line.thirdPartySerial && (
                              <div>
                                <p className="text-[10px] text-gray-400 font-medium">Serial #</p>
                                <p className="text-sm font-semibold text-gray-800">{line.thirdPartySerial}</p>
                              </div>
                            )}
                          </div>
                          {line.calculatedLevelPct != null && (
                            <div className="pt-1">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-[10px] text-gray-400 font-medium">Est. Level</p>
                                <p className="text-sm font-bold tabular-nums"
                                  style={{ color: line.calculatedLevelPct <= 10 ? '#ef4444' : line.calculatedLevelPct <= 20 ? '#f97316' : line.calculatedLevelPct <= 40 ? '#eab308' : '#10b981' }}>
                                  {line.calculatedLevelPct.toFixed(2)}%
                                </p>
                              </div>
                              <LevelBar pct={line.calculatedLevelPct} />
                              {line.calculatedLevelPct <= 20 && (
                                <p className="text-xs font-semibold text-orange-600 flex items-center gap-1.5 mt-1.5">
                                  <AlertTriangle size={11} />
                                  {line.calculatedLevelPct <= 10 ? 'Critical — refill urgently' : 'Refill needed soon'}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400">No tank assigned</p>
                      )}
                    </div>

                    {/* ── Section 3: Pump ──────────────────────────────────── */}
                    {line.tankOwner === 'OWN' && (
                      <div className="border-t border-gray-100 px-4 py-3">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Pump</p>
                        {line.pumpDeployed ? (
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                            <div>
                              <p className="text-[10px] text-gray-400 font-medium">Serial #</p>
                              <p className="text-sm font-semibold text-gray-800">{line.pumpSerial ?? '—'}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-400 font-medium">Status</p>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Deployed
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-amber-600 flex items-center gap-2">
                              <AlertTriangle size={14} />
                              No pump deployed to this tank
                            </p>
                            {canEdit && line.tankId && (
                              <button
                                onClick={() => { setDeployPumpLine(line); setSelectedPumpId('') }}
                                className="shrink-0 h-7 px-3 text-[11px] font-semibold rounded-lg text-white"
                                style={{ backgroundColor: 'var(--color-primary)' }}>
                                Deploy Pump
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── Section 4: Actions ───────────────────────────────── */}
                    {(canEdit && !isReadOnly && line.tankOwner === 'OWN' && tank) || (line.tankOwner === 'OWN' && tank) ? (
                      <div className="border-t border-gray-100 px-4 py-2.5 flex items-center gap-2 flex-wrap bg-gray-50">
                        {canEdit && !isReadOnly && tank.status === 'ASSIGNED' && (
                          <button onClick={() => handleMarkInstalled(tank.id)} disabled={tankEventMutation.isPending}
                            className="flex items-center gap-1.5 h-7 px-3 text-xs font-semibold rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors disabled:opacity-60">
                            Mark Installed
                          </button>
                        )}
                        {canEdit && !isReadOnly && tank.status === 'INSTALLED' && (<>
                          <button
                            onClick={() => {
                              if (refillLineId === line.id) setRefillLineId(null)
                              else { setRefillLineId(line.id); setRefillAmount(''); const _n = new Date(); setRefillAt(new Date(_n.getTime() - _n.getTimezoneOffset() * 60000).toISOString().slice(0, 16)) }
                            }}
                            className="flex items-center gap-1.5 h-7 px-3 text-xs font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-white transition-colors">
                            <Cylinder size={11} /> Log Refill
                          </button>
                          <button
                            onClick={() => {
                              if (!confirm('Mark this tank as empty? This will set the chemical level to 0%.')) return
                              tankEventMutation.mutate({ tankId: tank.id, data: { eventType: 'EMPTIED', eventAt: new Date().toISOString() } })
                            }}
                            disabled={tankEventMutation.isPending}
                            className="flex items-center gap-1.5 h-7 px-3 text-xs font-semibold rounded-lg border border-orange-100 text-orange-600 hover:bg-orange-50 transition-colors disabled:opacity-60">
                            Empty Tank
                          </button>
                          <button onClick={() => handleMarkRemoved(tank.id)} disabled={tankEventMutation.isPending}
                            className="flex items-center gap-1.5 h-7 px-3 text-xs font-semibold rounded-lg border border-red-100 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60">
                            Remove Tank
                          </button>
                        </>)}
                        <button
                          onClick={() => {
                            if (historyLineId === line.id) { setHistoryLineId(null); setHistoryTankId(null) }
                            else { setHistoryLineId(line.id); setHistoryTankId(tank.id) }
                          }}
                          className={`flex items-center gap-1.5 h-7 px-3 text-xs font-semibold rounded-lg border transition-colors ${historyLineId === line.id ? 'border-gray-300 bg-white text-gray-700' : 'border-gray-200 text-gray-500 hover:bg-white'}`}>
                          History
                        </button>
                      </div>
                    ) : null}

                    {historyLineId === line.id && line.tankId && (
                      <div className="px-3 pb-3 border-t border-gray-100 bg-gray-50 pt-2.5 space-y-1.5">
                        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Event History</p>
                        {historyLoading ? (
                          <p className="text-xs text-gray-400">Loading…</p>
                        ) : (() => {
                          const planStart = new Date(plan.createdAt).getTime()
                          const evts = (historyTankData?.events ?? []).filter(e => new Date(e.eventAt).getTime() >= planStart && e.eventType !== 'PAUSED' && e.eventType !== 'RESUMED' && e.eventType !== 'RATE_CHANGED')
                          return evts.length === 0 ? (
                          <p className="text-xs text-gray-400">No events yet</p>
                        ) : (
                          evts.map(e => (
                            <div key={e.id} className="flex items-start gap-2 py-1.5 border-b border-gray-100 last:border-0">
                              <div className="w-1 h-1 rounded-full bg-gray-300 mt-1.5 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <span className="text-xs font-medium text-gray-700">
                                  {e.eventType === 'INSTALLED' ? 'Installed at well'
                                    : e.eventType === 'REFILLED' ? 'Refilled'
                                    : e.eventType === 'FILLED' ? 'Initial fill'
                                    : e.eventType === 'REMOVED' ? 'Removed from well'
                                    : e.eventType === 'EMPTIED' ? 'Tank emptied'
                                    : e.eventType === 'PAUSED' ? 'Treatment paused'
                                    : e.eventType === 'RESUMED' ? 'Treatment resumed'
                                    : 'Rate changed'}
                                </span>
                                {e.amountGallons != null && e.eventType !== 'PAUSED' && <span className="text-xs text-gray-500"> · {e.amountGallons.toLocaleString()} gal</span>}
                                {e.levelPct != null && <span className="text-xs text-gray-500"> · {e.levelPct}%</span>}
                              </div>
                              <p className="text-[10px] text-gray-400 shrink-0">
                                {new Date(e.eventAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                {' '}{new Date(e.eventAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                              </p>
                            </div>
                          ))
                        )})()}
                      </div>
                    )}

                    {refillLineId === line.id && line.tankId && (
                      <div className="px-3 pb-3 space-y-2 border-t border-gray-100 bg-gray-50 pt-2.5">
                        <div className="flex items-center justify-between">
                          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Log Refill</p>
                          {tank && (tank.calculatedLevelPct ?? 100) < 100 && (
                            <p className="text-[10px] text-gray-400">
                              {Math.floor(tank.capacityGallons * (1 - (tank.calculatedLevelPct ?? 0) / 100)).toLocaleString()} gal can be filled
                            </p>
                          )}
                        </div>
                        <input type="number" min="0" step="0.01"
                          max={tank ? Math.floor(tank.capacityGallons * (1 - (tank.calculatedLevelPct ?? 0) / 100)) : undefined}
                          value={refillAmount}
                          onChange={e => setRefillAmount(e.target.value)}
                          placeholder="Gallons added"
                          className="w-full h-8 px-3 text-xs rounded-lg border border-gray-200 outline-none bg-white" />
                        <input type="datetime-local" value={refillAt}
                          onChange={e => setRefillAt(e.target.value)}
                          className="w-full h-8 px-3 text-xs rounded-lg border border-gray-200 outline-none bg-white" />
                        <div className="flex gap-2">
                          <button onClick={() => setRefillLineId(null)}
                            className="flex-1 h-7 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-white transition-colors">
                            Cancel
                          </button>
                          <button onClick={() => handleLogRefill(line.tankId!)} disabled={tankEventMutation.isPending}
                            className="flex-1 h-7 text-xs font-semibold text-white rounded-lg transition disabled:opacity-60"
                            style={{ backgroundColor: 'var(--color-primary)' }}>
                            {tankEventMutation.isPending ? 'Saving…' : 'Save Refill'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Add product form */}
          {canEdit && !isReadOnly && (
            <div className="mt-4">
              {!showLineForm ? (
                <button onClick={() => { setEditingLine(null); setShowLineForm(true) }}
                  className="w-full h-9 flex items-center justify-center gap-2 text-xs font-medium rounded-lg border border-dashed border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors">
                  <Plus size={13} /> Add Product
                </button>
              ) : (
                <div className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{editingLine ? 'Edit Product' : 'Add Product'}</p>

                  <div className="space-y-1">
                    <SearchableDropdown
                      value={watch('productId') || null}
                      onChange={v => setValue('productId', v ?? '', { shouldValidate: true })}
                      options={availableProductOptions}
                      placeholder="Select product…"
                      searchPlaceholder="Search products…"
                      showClear={false}
                    />
                    {errors.productId && <p className="text-red-500 text-xs">{errors.productId.message}</p>}
                  </div>

                  <SearchableDropdown
                    value={watch('method')}
                    onChange={v => {
                      setValue('method', (v ?? 'CONTINUOUS') as PlanMethod, { shouldValidate: true })
                      setValue('schedule', undefined)
                    }}
                    options={METHOD_OPTIONS}
                    placeholder="Method"
                    showClear={false}
                  />

                  <div className="space-y-1">
                    <input
                      type="number"
                      step="0.0001"
                      min="0"
                      value={watch('recRate') ?? ''}
                      onChange={e => setValue('recRate', e.target.value, { shouldValidate: true })}
                      placeholder={watch('method') === 'BATCH' ? 'Volume per treatment (gal)' : 'Rate (gal/day)'}
                      className="w-full h-9 px-3 text-sm rounded-lg border border-gray-200 outline-none transition focus:ring-2 bg-white"
                    />
                    {errors.recRate && <p className="text-red-500 text-xs">{errors.recRate.message}</p>}
                  </div>

                  {watch('method') === 'BATCH' && (
                    <SearchableDropdown
                      value={watch('schedule') ?? null}
                      onChange={v => setValue('schedule', (v ?? undefined) as PlanSchedule | undefined)}
                      options={SCHEDULE_OPTIONS}
                      placeholder="Schedule (e.g. Weekly)"
                      showClear={false}
                    />
                  )}

                  <input
                    value={watch('notes') ?? ''}
                    onChange={e => setValue('notes', e.target.value)}
                    placeholder="Notes (optional)"
                    className="w-full h-9 px-3 text-sm rounded-lg border border-gray-200 outline-none transition focus:ring-2 bg-white"
                  />

                  {/* Tank section — toggle for new lines; 3rd party fields also shown when editing a 3rd party line */}
                  {(!editingLine || editingLine.tankOwner === 'THIRD_PARTY') && (
                    <div className="space-y-2 pt-1" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        {editingLine ? 'Update Level Check' : 'Tank'}
                      </p>

                      {/* Toggle + OWN picker: new lines only */}
                      {!editingLine && (
                        <>
                          <div className="flex gap-2">
                            {(['OWN', 'THIRD_PARTY'] as const).map(owner => (
                              <button
                                key={owner}
                                type="button"
                                onClick={() => setValue('tankOwner', watch('tankOwner') === owner ? undefined : owner)}
                                className={`flex-1 h-8 text-xs font-semibold rounded-lg border transition-colors ${
                                  watch('tankOwner') === owner
                                    ? 'text-white border-transparent'
                                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                }`}
                                style={watch('tankOwner') === owner ? { backgroundColor: 'var(--color-primary)' } : {}}>
                                {owner === 'OWN' ? 'Our Tank' : '3rd Party Tank'}
                              </button>
                            ))}
                          </div>
                          {watch('tankOwner') === 'OWN' && (
                            <SearchableDropdown
                              value={watch('tankId') || null}
                              onChange={v => setValue('tankId', v ?? '')}
                              options={tankOptions}
                              placeholder="Select tank from registry…"
                              searchPlaceholder="Search tanks…"
                            />
                          )}
                        </>
                      )}

                      {/* 3rd party fields: new lines AND editing a 3rd party line */}
                      {watch('tankOwner') === 'THIRD_PARTY' && (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={watch('thirdPartyName') ?? ''}
                            onChange={e => setValue('thirdPartyName', e.target.value)}
                            placeholder="Tank owner / company name"
                            className="w-full h-9 px-3 text-sm rounded-lg border border-gray-200 outline-none transition focus:ring-2 bg-white"
                          />
                          <div className="flex gap-2">
                            <input
                              type="number"
                              min="0" step="1"
                              value={watch('thirdPartyCapacityGallons') ?? ''}
                              onChange={e => setValue('thirdPartyCapacityGallons', e.target.value)}
                              placeholder="Capacity (gal)"
                              className="flex-1 h-9 px-3 text-sm rounded-lg border border-gray-200 outline-none transition focus:ring-2 bg-white"
                            />
                            <input
                              type="text"
                              value={watch('thirdPartySerial') ?? ''}
                              onChange={e => setValue('thirdPartySerial', e.target.value)}
                              placeholder="Serial # (optional)"
                              className="flex-1 h-9 px-3 text-sm rounded-lg border border-gray-200 outline-none transition focus:ring-2 bg-white"
                            />
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="number"
                              min="0" max="100" step="0.01"
                              value={watch('tankLevelPct') ?? ''}
                              onChange={e => setValue('tankLevelPct', e.target.value)}
                              placeholder="Current level %"
                              className="flex-1 h-9 px-3 text-sm rounded-lg border border-gray-200 outline-none transition focus:ring-2 bg-white"
                            />
                            <input
                              type="datetime-local"
                              value={watch('tankLevelCheckedAt') ?? ''}
                              onChange={e => setValue('tankLevelCheckedAt', e.target.value)}
                              title="When was this level checked?"
                              className="flex-1 h-9 px-3 text-sm rounded-lg border border-gray-200 outline-none transition focus:ring-2 bg-white"
                            />
                          </div>
                          <p className="text-[10px] text-gray-400">Level % + check time → auto-depletes at rec rate</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button type="button" onClick={() => { reset(); setShowLineForm(false); setEditingLine(null) }}
                      className="flex-1 h-8 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors">
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={editingLine ? handleSubmit(onUpdateLine) : handleSubmit(onAddLine)}
                      disabled={addLineMutation.isPending || updateLineMutation.isPending}
                      className="flex-1 h-8 text-xs font-semibold text-white rounded-lg transition disabled:opacity-60"
                      style={{ backgroundColor: 'var(--color-primary)' }}>
                      {(addLineMutation.isPending || updateLineMutation.isPending) ? 'Saving…' : editingLine ? 'Save Changes' : 'Add'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Deploy Pump mini panel */}
    {deployPumpLine && (
      <div className="fixed inset-0 z-60 flex justify-end">
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative bg-white w-[440px] h-full shadow-2xl flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary)' }}>
                <Cylinder size={14} className="text-white" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Deploy Pump</h2>
                <p className="text-xs text-gray-400">{deployPumpLine.productName}</p>
              </div>
            </div>
            <button onClick={() => setDeployPumpLine(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors">
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2.5">
              Select an available pump from the shop to deploy to this tank.
            </p>
            {inShopPumps.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-sm text-gray-400 font-medium">No pumps available in shop</p>
                <p className="text-xs text-gray-400 mt-1">Register a pump in Pump Shop first</p>
              </div>
            ) : inShopPumps.map(pump => (
              <button
                key={pump.id}
                onClick={() => setSelectedPumpId(pump.id)}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                  selectedPumpId === pump.id
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}>
                <p className="text-sm font-semibold text-gray-800">{pump.serialNumber}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {pump.make ?? ''}{pump.model ? ` · ${pump.model}` : ''}{pump.pumpType ? ` · ${pump.pumpType}` : ''}
                </p>
              </button>
            ))}
          </div>

          <div className="px-5 py-4 flex gap-3 shrink-0" style={{ borderTop: '1px solid rgba(0,0,0,0.07)' }}>
            <button onClick={() => setDeployPumpLine(null)}
              className="flex-1 h-10 text-sm font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button
              onClick={() => deployPumpMutation.mutate({ pumpId: selectedPumpId, tankId: deployPumpLine.tankId! })}
              disabled={!selectedPumpId || deployPumpMutation.isPending}
              className="flex-1 h-10 text-sm font-semibold text-white rounded-lg transition disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-primary)' }}>
              {deployPumpMutation.isPending ? 'Deploying…' : 'Deploy'}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function PlansPage() {
  const { user } = useAuthStore()
  const location = useLocation()
  const role = user?.role
  const canEdit   = role === 'ADMIN' || role === 'MANAGER' || role === 'ACCOUNT_REP'
  const canDelete = role === 'ADMIN' || role === 'MANAGER'

  const triggerState = location.state as { wellId?: string; triggeredByLabSampleId?: string; sampleNumber?: string } | null

  const [search, setSearch]             = useState('')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [page, setPage]                 = useState(0)
  const [formOpen, setFormOpen]         = useState(false)
  const [editing, setEditing]           = useState<PlanRecord | undefined>()
  const [selected, setSelected]         = useState<PlanRecord | undefined>()

  const params = { status: statusFilter || undefined, page, size: PAGE_SIZE }

  const { data, isLoading } = useQuery({
    queryKey: ['plans', params],
    queryFn:  () => plansApi.list(params),
  })

  const { data: wellsData } = useQuery({
    queryKey: ['wells-active'],
    queryFn:  () => wellsApi.list({ isActive: true, size: 5000 }).then(r => r.data.data?.content ?? []),
  })

  const { data: leasesData } = useQuery({
    queryKey: ['leases-active'],
    queryFn:  () => leasesApi.list({ isActive: true, size: 5000 }).then(r => r.data.data?.content ?? []),
  })

  const { data: repsData } = useQuery({
    queryKey: ['users-account-reps'],
    queryFn:  () => api.get<ApiResponse<UserRecord[]>>('/api/v1/users', { params: { role: 'ACCOUNT_REP' } })
                      .then(r => r.data.data ?? []),
  })

  const repOptions: DropdownOption[] = (repsData ?? []).map(u => ({ value: u.id, label: u.fullName }))

  const triggerWell = triggerState?.wellId
    ? (wellsData ?? []).find(w => w.id === triggerState.wellId)
    : undefined

  useEffect(() => {
    if (triggerWell && !formOpen) {
      setFormOpen(true)
      // clear state so back-navigation doesn't re-open the form
      window.history.replaceState({}, '')
    }
  }, [triggerWell?.id])

  const plans       = data?.data?.data?.content       ?? []
  const total       = data?.data?.data?.totalElements ?? 0
  const totalPages  = data?.data?.data?.totalPages    ?? 0

  const filtered = search
    ? plans.filter(p =>
        p.wellName?.toLowerCase().includes(search.toLowerCase()) ||
        p.leaseName?.toLowerCase().includes(search.toLowerCase()) ||
        p.clientName?.toLowerCase().includes(search.toLowerCase()) ||
        p.accountRepName?.toLowerCase().includes(search.toLowerCase())
      )
    : plans

  function openCreate() { setEditing(undefined); setSelected(undefined); setFormOpen(true) }
  function openEdit(p: PlanRecord) { setEditing(p); setSelected(undefined); setFormOpen(true) }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Programs</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} plan{total !== 1 ? 's' : ''} total</p>
        </div>
        {canEdit && (
          <button onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg transition"
            style={{ backgroundColor: 'var(--color-primary)' }}>
            <Plus size={15} /> New Plan
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search well / lease / client…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0) }}
            className="h-9 pl-8 pr-3 text-sm rounded-lg border border-gray-200 outline-none transition focus:ring-2 w-60"
          />
        </div>
        <SearchableDropdown
          value={statusFilter}
          onChange={v => { setStatusFilter(v); setPage(0) }}
          options={STATUS_OPTIONS}
          placeholder="All Statuses"
          className="w-44"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: 'var(--color-primary)' }}>
              {['Well', 'Lease', 'Client', 'Account Rep', 'Status', '# Products', ''].map(h => (
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
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-14 text-center">
                  <FlaskConical size={32} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-sm text-gray-500 font-medium">No programs found</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {search || statusFilter ? 'Try adjusting your filters' : 'Create the first program to get started'}
                  </p>
                </td>
              </tr>
            ) : filtered.map(p => (
              <tr key={p.id}
                onClick={() => { setSelected(p); setFormOpen(false) }}
                className="hover:bg-gray-50 cursor-pointer transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900">{p.wellName ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600">{p.leaseName ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600">{p.clientName ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600">{p.accountRepName ?? '—'}</td>
                <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                <td className="px-4 py-3 text-gray-600">{p.lineCount}</td>
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
        <PlanFormPanel
          open={formOpen}
          onClose={() => { setFormOpen(false); setEditing(undefined) }}
          plan={editing}
          wellsData={wellsData ?? []}
          leasesData={leasesData ?? []}
          repOptions={repOptions}
          canEdit={canEdit}
          prefillWellId={!editing ? triggerWell?.id : undefined}
          prefillLeaseId={!editing ? triggerWell?.leaseId : undefined}
          fromLabSampleNumber={!editing ? triggerState?.sampleNumber : undefined}
        />
      )}

      {selected && !formOpen && (
        <PlanDrawer
          plan={selected}
          onClose={() => setSelected(undefined)}
          onEdit={() => openEdit(selected)}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      )}
    </div>
  )
}
