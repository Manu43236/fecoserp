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
import { plansApi, type PlanRecord, type PlanPayload, type PlanLinePayload, type PlanMethod, type PlanSchedule, type PlanStatus } from '@/api/plans'
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
  tankOwner:          z.enum(['ENDURA', 'THIRD_PARTY']).optional(),
  tankId:             z.string().optional().or(z.literal('')),
  tankLevelPct:       z.string().optional().or(z.literal('')),
  tankLevelCheckedAt: z.string().optional().or(z.literal('')),
})
type LineFormData = z.infer<typeof lineSchema>


function LevelBar({ pct }: { pct: number }) {
  const color = pct <= 10 ? '#ef4444' : pct <= 20 ? '#f97316' : pct <= 40 ? '#eab308' : '#10b981'
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-semibold tabular-nums" style={{ color, minWidth: 36 }}>{pct.toFixed(1)}%</span>
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
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white w-[440px] h-full shadow-2xl flex flex-col">

        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary)' }}>
              <FlaskConical size={14} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">{isEdit ? 'Edit Treatment Plan' : 'New Treatment Plan'}</h2>
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
  const [refillLineId, setRefillLineId] = useState<string | null>(null)
  const [refillAmount, setRefillAmount] = useState('')
  const [refillAt, setRefillAt] = useState(new Date().toISOString().slice(0, 16))
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
    .filter(t => t.status === 'AVAILABLE')
    .map(t => ({ value: t.id, label: t.serialNumber ?? `Tank (${t.capacityGallons} gal)` }))

  const products = productsData ?? []

  const { handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<LineFormData>({
    resolver: zodResolver(lineSchema),
    defaultValues: { productId: '', recRate: '', method: 'CONTINUOUS', schedule: undefined, notes: '', tankOwner: undefined, tankId: '', tankLevelPct: '', tankLevelCheckedAt: '' },
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
      const remaining = Math.floor(t.capacityGallons * (1 - (t.calculatedLevelPct ?? 0) / 100))
      if (parseFloat(refillAmount) > remaining)
        return toast.error(`Max refill is ${remaining.toLocaleString()} gal (tank is ${Math.round(t.calculatedLevelPct ?? 0)}% full)`)
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

  function onAddLine(data: LineFormData) {
    addLineMutation.mutate({
      productId:          data.productId,
      recRate:            parseFloat(data.recRate),
      method:             data.method,
      schedule:           data.method === 'BATCH' ? data.schedule : null,
      notes:              data.notes || undefined,
      tankOwner:          data.tankOwner || null,
      tankId:             data.tankOwner === 'ENDURA' && data.tankId ? data.tankId : null,
      tankLevelPct:       data.tankOwner === 'THIRD_PARTY' && data.tankLevelPct ? parseFloat(data.tankLevelPct) : null,
      tankLevelCheckedAt: data.tankOwner === 'THIRD_PARTY' && data.tankLevelCheckedAt ? new Date(data.tankLevelCheckedAt).toISOString() : null,
    })
  }

  const p = fullData ?? plan
  const isReadOnly = p.status === 'COMPLETED' || p.status === 'SUSPENDED'
  const lines = fullData?.lines ?? []
  const productOptions: DropdownOption[] = products.map(pr => ({ value: pr.id, label: pr.name }))
  const usedProductIds = new Set(lines.map(l => l.productId))
  const availableProductOptions = productOptions.filter(opt => !usedProductIds.has(opt.value))

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white w-[580px] h-full shadow-2xl flex flex-col">

        {/* Header */}
        <div className="px-5 pt-4 pb-3 border-b border-gray-100 shrink-0 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 break-words">{p.wellName ?? 'Treatment Plan'}</p>
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
                  onClick={() => { if (confirm('Delete this treatment plan?')) deletePlanMutation.mutate() }}
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
            {canEdit && p.status === 'DRAFT' && (
              <button onClick={() => transitionMutation.mutate('start')} disabled={transitionMutation.isPending}
                className="h-7 px-3 text-xs font-semibold rounded-lg text-white transition disabled:opacity-60"
                style={{ backgroundColor: 'var(--color-primary)' }}>
                Start Treatment
              </button>
            )}
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
            <div className="space-y-2">
              {lines.map(line => {
                const tank = line.tankId ? tankMap.get(line.tankId) : undefined
                const levelPct = tank?.calculatedLevelPct ?? line.tankLevelPct ?? null

                return (
                  <div key={line.id} className="rounded-lg border border-gray-100 bg-white overflow-hidden">
                    <div className="flex items-center gap-3 px-3 py-2.5 group">
                      <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                        style={{ backgroundColor: 'rgba(var(--color-primary-rgb, 30,58,95), 0.08)' }}>
                        <FlaskConical size={12} style={{ color: 'var(--color-primary)' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{line.productName}</p>
                        <p className="text-xs text-gray-500">
                          {line.recRate} {line.method === 'CONTINUOUS' ? 'gal/day' : 'gal/treatment'} · {METHOD_LABELS[line.method]}{line.schedule ? ` — ${SCHEDULE_LABELS[line.schedule]}` : ''}
                          {line.notes ? ` · ${line.notes}` : ''}
                        </p>
                        {line.tankOwner === 'ENDURA' && tank && (
                          <div className="mt-1">
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs text-gray-400">{tank.serialNumber ?? 'Endura tank'} · {tank.capacityGallons.toLocaleString()} gal</p>
                              <TankStatusBadge status={tank.status} />
                            </div>
                            {tank.status === 'INSTALLED' && (
                              <>
                                <LevelBar pct={tank.calculatedLevelPct} />
                                {tank.calculatedLevelPct <= 20 && (
                                  <p className="text-xs text-orange-600 flex items-center gap-1 mt-0.5">
                                    <AlertTriangle size={10} />
                                    {tank.calculatedLevelPct <= 10 ? 'Critical — refill urgently' : 'Refill needed soon'}
                                  </p>
                                )}
                              </>
                            )}
                          </div>
                        )}
                        {line.tankOwner === 'THIRD_PARTY' && levelPct != null && (
                          <p className="text-xs text-amber-600 mt-0.5">3rd party tank · {levelPct}% level</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {canEdit && !isReadOnly && line.tankOwner === 'ENDURA' && tank && (
                          <>
                            {tank.status === 'ASSIGNED' && (
                              <button
                                onClick={() => handleMarkInstalled(tank.id)}
                                disabled={tankEventMutation.isPending}
                                className="flex items-center gap-1 h-6 px-2 text-[11px] font-medium rounded-md border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-60">
                                Mark Installed
                              </button>
                            )}
                            {tank.status === 'INSTALLED' && (
                              <>
                                <button
                                  onClick={() => {
                                    if (refillLineId === line.id) setRefillLineId(null)
                                    else { setRefillLineId(line.id); setRefillAmount(''); setRefillAt(new Date().toISOString().slice(0, 16)) }
                                  }}
                                  className="flex items-center gap-1 h-6 px-2 text-[11px] font-medium rounded-md border border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors">
                                  <Cylinder size={10} /> Refill
                                </button>
                                <button
                                  onClick={() => handleMarkRemoved(tank.id)}
                                  disabled={tankEventMutation.isPending}
                                  className="flex items-center gap-1 h-6 px-2 text-[11px] font-medium rounded-md border border-red-100 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-60">
                                  Remove
                                </button>
                              </>
                            )}
                          </>
                        )}
                        {line.tankOwner === 'ENDURA' && tank && (
                          <button
                            onClick={() => {
                              if (historyLineId === line.id) {
                                setHistoryLineId(null); setHistoryTankId(null)
                              } else {
                                setHistoryLineId(line.id); setHistoryTankId(tank.id)
                              }
                            }}
                            className={`flex items-center gap-1 h-6 px-2 text-[11px] font-medium rounded-md border transition-colors ${historyLineId === line.id ? 'border-gray-300 bg-gray-100 text-gray-700' : 'border-gray-200 text-gray-400 hover:text-gray-600'}`}>
                            History
                          </button>
                        )}
                        {canEdit && (
                          <button
                            onClick={() => removeLineMutation.mutate({ lineId: line.id })}
                            disabled={removeLineMutation.isPending}
                            className="w-6 h-6 rounded-md flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100">
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>

                    {historyLineId === line.id && line.tankId && (
                      <div className="px-3 pb-3 border-t border-gray-100 bg-gray-50 pt-2.5 space-y-1.5">
                        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Event History</p>
                        {historyLoading ? (
                          <p className="text-xs text-gray-400">Loading…</p>
                        ) : (() => {
                          const evts = historyTankData?.events ?? []
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
                                    : 'Rate changed'}
                                </span>
                                {e.amountGallons != null && <span className="text-xs text-gray-500"> · {e.amountGallons.toLocaleString()} gal</span>}
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
                <button onClick={() => setShowLineForm(true)}
                  className="w-full h-9 flex items-center justify-center gap-2 text-xs font-medium rounded-lg border border-dashed border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors">
                  <Plus size={13} /> Add Product
                </button>
              ) : (
                <div className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Add Product</p>

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

                  {/* Tank Owner */}
                  <div className="space-y-2 pt-1" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tank</p>
                    <div className="flex gap-2">
                      {(['ENDURA', 'THIRD_PARTY'] as const).map(owner => (
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
                          {owner === 'ENDURA' ? 'Endura Tank' : '3rd Party Tank'}
                        </button>
                      ))}
                    </div>
                    {watch('tankOwner') === 'ENDURA' && (
                      <SearchableDropdown
                        value={watch('tankId') || null}
                        onChange={v => setValue('tankId', v ?? '')}
                        options={tankOptions}
                        placeholder="Select tank from registry…"
                        searchPlaceholder="Search tanks…"
                      />
                    )}
                    {watch('tankOwner') === 'THIRD_PARTY' && (
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min="0" max="100" step="0.01"
                          value={watch('tankLevelPct') ?? ''}
                          onChange={e => setValue('tankLevelPct', e.target.value)}
                          placeholder="Level %"
                          className="flex-1 h-9 px-3 text-sm rounded-lg border border-gray-200 outline-none transition focus:ring-2 bg-white"
                        />
                        <input
                          type="datetime-local"
                          value={watch('tankLevelCheckedAt') ?? ''}
                          onChange={e => setValue('tankLevelCheckedAt', e.target.value)}
                          className="flex-1 h-9 px-3 text-sm rounded-lg border border-gray-200 outline-none transition focus:ring-2 bg-white"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button type="button" onClick={() => { reset(); setShowLineForm(false) }}
                      className="flex-1 h-8 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors">
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmit(onAddLine)}
                      disabled={addLineMutation.isPending}
                      className="flex-1 h-8 text-xs font-semibold text-white rounded-lg transition disabled:opacity-60"
                      style={{ backgroundColor: 'var(--color-primary)' }}>
                      {addLineMutation.isPending ? 'Adding…' : 'Add'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
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
          <h1 className="text-xl font-bold text-gray-900">Treatment Plans</h1>
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
                  <p className="text-sm text-gray-500 font-medium">No treatment plans found</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {search || statusFilter ? 'Try adjusting your filters' : 'Create the first treatment plan to get started'}
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
