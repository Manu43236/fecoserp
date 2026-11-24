import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { Plus, X, Search, ChevronRight, ChevronDown, Truck, MapPin, Trash2, Package, LayoutList, Calendar, ChevronLeft, Check } from 'lucide-react'
import { routesApi, type RouteRecord, type RoutePayload, type RouteStopPayload, type RouteStopItemPayload, type RouteStatus } from '@/api/routes'
import { leasesApi, type LeaseRecord } from '@/api/leases'
import { wellsApi, type WellRecord } from '@/api/wells'
import { productsApi } from '@/api/products'
import { productUnitsApi } from '@/api/productUnits'
import { vehiclesApi, type Vehicle } from '@/api/vehicles'
import { warehousesApi, type WarehouseRecord } from '@/api/warehouses'
import { inventoryApi } from '@/api/inventory'
import { SearchableDropdown, type DropdownOption } from '@/components/ui/SearchableDropdown'
import { useDialogs } from '@/components/ui/DialogProvider'
import { RouteLoadDialog, RouteDeliveryDialog } from '@/components/routes/RouteStartComplete'
import { SkippedStopsView } from '@/components/routes/SkippedStopsView'
import { useAuthStore, hasAnyRole } from '@/store/authStore'
import api from '@/lib/axios'
import type { ApiResponse, PageResponse } from '@/types'

const PAGE_SIZE = 20

interface UserRecord { id: string; fullName: string; role: string }

const STATUS_COLOR: Record<RouteStatus, { bg: string; text: string; dot: string; ring: string; label: string }> = {
  PLANNED:     { bg: 'bg-gray-50',    text: 'text-gray-600',    dot: 'bg-gray-400',    ring: 'ring-gray-200',    label: 'Planned'     },
  DISPATCHED:  { bg: 'bg-blue-50',    text: 'text-blue-700',    dot: 'bg-blue-500',    ring: 'ring-blue-200',    label: 'Dispatched'  },
  IN_PROGRESS: { bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-500',   ring: 'ring-amber-200',   label: 'In Progress' },
  COMPLETED:   { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', ring: 'ring-emerald-200', label: 'Completed'   },
  CANCELLED:   { bg: 'bg-red-50',     text: 'text-red-600',     dot: 'bg-red-400',     ring: 'ring-red-200',     label: 'Cancelled'   },
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

const STATUS_OPTIONS: DropdownOption[] = Object.entries(STATUS_COLOR).map(([v, s]) => ({ value: v, label: s.label }))

// Allowed moves per state (forward step + cancel). No skipping — a Planned route
// can only be Dispatched or Cancelled, etc. Terminal states have no moves.
const STATUS_ACTIONS: Record<RouteStatus, RouteStatus[]> = {
  PLANNED:     ['DISPATCHED', 'CANCELLED'],
  DISPATCHED:  ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  COMPLETED:   [],
  CANCELLED:   [],
}
// Verb shown for the action that moves a route INTO each status.
const ACTION_LABEL: Record<RouteStatus, string> = {
  PLANNED: 'Planned', DISPATCHED: 'Dispatch', IN_PROGRESS: 'Start',
  COMPLETED: 'Complete', CANCELLED: 'Cancel',
}

function StatusDropdown({ status, canDispatch, onSelect }: {
  status: RouteStatus
  canDispatch: boolean
  onSelect: (target: RouteStatus) => void
}) {
  const [open, setOpen] = useState(false)
  const actions = STATUS_ACTIONS[status]
  if (actions.length === 0) return <StatusBadge status={status} />   // terminal

  return (
    <div className="relative">
      <button type="button"
        onClick={() => setOpen(o => !o)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="w-full h-9 px-3 flex items-center justify-between rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-sm font-medium text-gray-800">
        {STATUS_COLOR[status].label}
        <ChevronDown size={14} className="text-gray-400" />
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          {actions.map(target => {
            const blocked = target === 'DISPATCHED' && !canDispatch
            const isCancel = target === 'CANCELLED'
            return (
              <button key={target} type="button"
                disabled={blocked}
                onMouseDown={e => e.preventDefault()}
                onClick={() => { onSelect(target); setOpen(false) }}
                className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  isCancel ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-50'
                }`}>
                <span className="font-medium">{ACTION_LABEL[target]}</span>
                {blocked && <span className="text-[10px] text-gray-400">assign driver first</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Truck combobox — dropdown of fleet trucks, but free text allowed (3rd-party) ──
const TRUCK_MIN_CHARS = 3

function TruckCombobox({ value, onChange, vehicles }: {
  value: string
  onChange: (v: string) => void
  vehicles: Vehicle[]
}) {
  const [focused, setFocused] = useState(false)
  const [picked, setPicked] = useState(false)   // suppress list right after choosing
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), 250)
    return () => clearTimeout(t)
  }, [value])

  const query = debounced.trim().toLowerCase()
  // Only suggest once ≥3 chars are typed and they actually match a fleet truck.
  const matches = query.length >= TRUCK_MIN_CHARS
    ? vehicles.filter(v => `${v.licensePlate} ${v.make} ${v.model}`.toLowerCase().includes(query))
    : []
  const showList = focused && !picked && matches.length > 0

  return (
    <div className="relative">
      <input
        value={value}
        onChange={e => { onChange(e.target.value); setPicked(false) }}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        placeholder="Enter or select a truck number"
        className="w-full h-9 px-3 text-sm rounded-lg border border-gray-200 outline-none transition focus:ring-2"
      />
      {showList && (
        <div className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
          {matches.map(v => (
            <button key={v.id} type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={() => { onChange(v.licensePlate); setPicked(true); setDebounced(v.licensePlate) }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between gap-2">
              <span className="font-medium text-gray-900">{v.licensePlate}</span>
              <span className="text-xs text-gray-400 truncate">{v.make} {v.model} {v.year}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Route form schema ──────────────────────────────────────────────────────────
const routeSchema = z.object({
  driverId:    z.string().optional().or(z.literal('')),
  truckNumber: z.string().optional().or(z.literal('')),
  warehouseId: z.string().optional().or(z.literal('')),
  routeDate:   z.string().min(1, 'Date is required'),
  status:      z.enum(['PLANNED', 'DISPATCHED', 'IN_PROGRESS', 'COMPLETED']),
  notes:       z.string().optional().or(z.literal('')),
})
type RouteFormData = z.infer<typeof routeSchema>

// ── Stop item row (inline add) ─────────────────────────────────────────────────
interface ItemRow { productId: string; quantity: string; unit: string }

// A stop being built inside the create form (before the route exists).
interface StopDraft { leaseId: string; wellId: string; notes: string; items: ItemRow[] }

const emptyItem = (): ItemRow => ({ productId: '', quantity: '', unit: '' })
const emptyStop = (): StopDraft => ({ leaseId: '', wellId: '', notes: '', items: [emptyItem()] })

// ── Route form panel ───────────────────────────────────────────────────────────
function RouteFormPanel({ open, onClose, route, initialDate, driverOptions }: {
  open: boolean
  onClose: () => void
  route?: RouteRecord
  initialDate?: string
  driverOptions: DropdownOption[]
}) {
  const qc = useQueryClient()
  const isEdit = !!route

  const { handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<RouteFormData>({
    resolver: zodResolver(routeSchema),
    defaultValues: {
      driverId:    route?.driverId    ?? '',
      truckNumber: route?.truckNumber ?? '',
      warehouseId: route?.warehouseId ?? '',
      routeDate:   route?.routeDate   ?? initialDate ?? '',
      status:      route?.status      ?? 'PLANNED',
      notes:       route?.notes       ?? '',
    },
  })

  // Stops are built inline only when creating a brand-new route. Editing keeps
  // header-only; stops on an existing route are managed from the route drawer.
  const [stops, setStops] = useState<StopDraft[]>([])

  const { data: vehiclesData } = useQuery({
    queryKey: ['vehicles-available'],
    queryFn: () => vehiclesApi.list({ size: 200 }).then(r => (r.data as ApiResponse<PageResponse<Vehicle>>).data?.content ?? []),
  })
  const vehicles: Vehicle[] = vehiclesData ?? []

  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses-active'],
    queryFn: () => warehousesApi.listActive().then(r => (r.data.data ?? []) as WarehouseRecord[]),
  })
  const warehouseOptions: DropdownOption[] = (warehousesData ?? []).map(w => ({
    value: w.id,
    label: w.name + (w.location ? ` (${w.location})` : ''),
  }))

  // Reference data for the inline stops builder (cached/deduped by react-query).
  const { data: leasesData } = useQuery({
    queryKey: ['leases-active'],
    queryFn: () => leasesApi.list({ isActive: true, size: 5000 }).then(r => r.data.data?.content ?? []),
    enabled: !isEdit,
  })
  const { data: wellsData } = useQuery({
    queryKey: ['wells-active'],
    queryFn: () => wellsApi.list({ isActive: true, size: 5000 }).then(r => r.data.data?.content ?? []),
    enabled: !isEdit,
  })
  const { data: productsData } = useQuery({
    queryKey: ['products-active'],
    queryFn: () => productsApi.list({ isActive: true, size: 5000 }).then(r => r.data.data?.content ?? []),
    enabled: !isEdit,
  })
  const { data: unitsData } = useQuery({
    queryKey: ['product-units'],
    queryFn: () => productUnitsApi.list().then(r => r.data.data ?? []),
    enabled: !isEdit,
  })

  const leases: LeaseRecord[] = leasesData ?? []
  const wells: WellRecord[]   = wellsData  ?? []
  const leaseOptions: DropdownOption[]   = leases.map(l => ({ value: l.id, label: l.leaseName }))
  const productOptions: DropdownOption[] = (productsData ?? []).map(p => ({ value: p.id, label: p.name }))
  const unitOptions: DropdownOption[]    = (unitsData ?? []).map(u => ({ value: u.name, label: u.name }))
  const wellOptionsFor = (leaseId: string): DropdownOption[] =>
    leaseId ? wells.filter(w => w.leaseId === leaseId).map(w => ({ value: w.id, label: w.wellName })) : []

  // Stock at the chosen warehouse, to warn the manager up front about shortfalls (create only).
  const warehouseId = watch('warehouseId')
  const { data: whStock } = useQuery({
    queryKey: ['stock', warehouseId],
    queryFn: () => inventoryApi.stock({ warehouseId }).then(r => r.data.data ?? []),
    enabled: !isEdit && !!warehouseId,
  })
  const availableByProduct = new Map((whStock ?? []).map(s => [s.productId, s.currentQty]))
  const hasProductsEntered = stops.some(s => s.items.some(i => i.productId && (parseFloat(i.quantity) || 0) > 0))
  // Only meaningful once a warehouse is chosen — otherwise we don't know the stock.
  const stockShortages = warehouseId ? (() => {
    const needed = new Map<string, { qty: number; unit: string }>()
    stops.forEach(st => st.items.forEach(it => {
      const q = parseFloat(it.quantity) || 0
      if (!it.productId || q <= 0) return
      const cur = needed.get(it.productId)
      needed.set(it.productId, { qty: (cur?.qty ?? 0) + q, unit: it.unit || cur?.unit || '' })
    }))
    const out: { name: string; need: number; have: number; unit: string }[] = []
    needed.forEach((v, pid) => {
      const have = availableByProduct.get(pid) ?? 0
      if (v.qty > have) out.push({ name: productOptions.find(p => p.value === pid)?.label ?? 'Product', need: v.qty, have, unit: v.unit })
    })
    return out
  })() : []

  // ── Stop draft mutators (immutable) ──
  const updateStop = (i: number, patch: Partial<StopDraft>) =>
    setStops(s => s.map((st, j) => j === i ? { ...st, ...patch } : st))
  const updateItem = (si: number, ii: number, patch: Partial<ItemRow>) =>
    setStops(s => s.map((st, j) => j === si
      ? { ...st, items: st.items.map((it, k) => k === ii ? { ...it, ...patch } : it) } : st))
  const addItemRow = (si: number) =>
    setStops(s => s.map((st, j) => j === si ? { ...st, items: [...st.items, emptyItem()] } : st))
  const removeItemRow = (si: number, ii: number) =>
    setStops(s => s.map((st, j) => j === si ? { ...st, items: st.items.filter((_, k) => k !== ii) } : st))

  const mutation = useMutation({
    mutationFn: (data: RoutePayload) =>
      isEdit ? routesApi.update(route!.id, data) : routesApi.create(data),
    onSuccess: () => {
      toast.success(isEdit ? 'Route updated' : 'Route created')
      qc.invalidateQueries({ queryKey: ['routes'] })
      qc.invalidateQueries({ queryKey: ['routes-calendar'] })
      onClose(); reset(); setStops([])
    },
    onError: (e: unknown) =>
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed'),
  })

  function onSubmit(data: RouteFormData) {
    let stopPayload: RouteStopPayload[] | undefined
    if (!isEdit && stops.length > 0) {
      const built = stops.filter(s => s.leaseId && s.wellId)
      if (built.length !== stops.length) { toast.error('Each stop needs a lease and a well'); return }
      stopPayload = built.map(s => {
        const items = s.items
          .filter(it => it.productId && it.quantity && it.unit)
          .map(it => ({ productId: it.productId, quantity: parseFloat(it.quantity), unit: it.unit }))
        return { leaseId: s.leaseId, wellId: s.wellId, notes: s.notes || undefined, items: items.length ? items : undefined }
      })
    }
    const truck = data.truckNumber?.trim() || ''
    const matchedVehicle = vehicles.find(v => v.licensePlate.toLowerCase() === truck.toLowerCase())
    mutation.mutate({
      driverId:    data.driverId    || undefined,
      truckNumber: truck || undefined,
      vehicleId:   matchedVehicle?.id,
      warehouseId: data.warehouseId || undefined,
      routeDate:   data.routeDate,
      status:      data.status,
      notes:       data.notes || undefined,
      stops:       stopPayload,
    })
  }

  if (!open) return null
  const selectedStatus = watch('status')

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative bg-white w-full md:w-[520px] h-full shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary)' }}>
              <Truck size={14} className="text-white" />
            </div>
            <h2 className="text-sm font-semibold text-gray-900">{isEdit ? 'Edit Route' : 'New Route'}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

            {/* Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Route Date <span className="text-red-500">*</span></label>
              <input
                type="date"
                value={watch('routeDate') ?? ''}
                onChange={e => setValue('routeDate', e.target.value, { shouldValidate: true })}
                className="w-full h-9 px-3 text-sm rounded-lg border border-gray-200 outline-none transition focus:ring-2"
              />
              {errors.routeDate && <p className="text-red-500 text-xs">{errors.routeDate.message}</p>}
            </div>

            {/* Truck — dropdown of fleet trucks, free text allowed (3rd-party) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Vehicle / Truck</label>
              <TruckCombobox
                value={watch('truckNumber') ?? ''}
                onChange={v => setValue('truckNumber', v)}
                vehicles={vehicles}
              />
              <p className="text-[11px] text-gray-400">Pick a fleet truck or type any number — 3rd-party trucks allowed.</p>
            </div>

            {/* Status — read-only here; change it from the route view (open the route) */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</label>
              <div><StatusBadge status={selectedStatus} /></div>
              <p className="text-[11px] text-gray-400">
                {isEdit ? 'Change status from the route view (open the route).'
                        : 'New routes start as Planned — dispatch from the route view once a driver is assigned.'}
              </p>
            </div>

            {/* Warehouse */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Dispatch Warehouse
                <span className="ml-1 text-gray-400 font-normal normal-case">(for inventory deduction)</span>
              </label>
              <SearchableDropdown
                value={watch('warehouseId') || null}
                onChange={v => setValue('warehouseId', v ?? '')}
                options={warehouseOptions}
                placeholder="Select warehouse"
                searchPlaceholder="Search warehouses…"
                showClear={true}
              />
            </div>

            {/* Stops (create only) — build the whole route in one go */}
            {!isEdit && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Stops</label>
                  <span className="text-xs text-gray-400">{stops.length} stop{stops.length !== 1 ? 's' : ''}</span>
                </div>

                {stops.map((stop, si) => (
                  <div key={si} className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold text-white"
                        style={{ backgroundColor: 'var(--color-primary)' }}>{si + 1}</span>
                      <button type="button" onClick={() => setStops(s => s.filter((_, j) => j !== si))}
                        className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>

                    {/* Lease → Well */}
                    <SearchableDropdown
                      value={stop.leaseId || null}
                      onChange={v => updateStop(si, { leaseId: v ?? '', wellId: '' })}
                      options={leaseOptions}
                      placeholder="Select lease"
                      searchPlaceholder="Search leases…"
                      showClear={false}
                    />
                    <SearchableDropdown
                      value={stop.wellId || null}
                      onChange={v => updateStop(si, { wellId: v ?? '' })}
                      options={wellOptionsFor(stop.leaseId)}
                      placeholder={stop.leaseId ? 'Select well' : 'Select a lease first'}
                      searchPlaceholder="Search wells…"
                      showClear={false}
                    />

                    {/* Products */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Products (optional)</p>
                      {stop.items.map((item, ii) => (
                        <div key={ii} className="flex gap-2 items-center">
                          <div className="flex-1">
                            <SearchableDropdown
                              value={item.productId || null}
                              onChange={v => updateItem(si, ii, { productId: v ?? '' })}
                              options={productOptions}
                              placeholder="Product"
                              showClear={false}
                            />
                          </div>
                          <input
                            type="number" step="0.01" min="0"
                            value={item.quantity}
                            onChange={e => updateItem(si, ii, { quantity: e.target.value })}
                            placeholder="Qty"
                            className="w-20 h-9 px-2 text-sm rounded-lg border border-gray-200 outline-none focus:ring-2 bg-white"
                          />
                          <div className="w-28">
                            <SearchableDropdown
                              value={item.unit || null}
                              onChange={v => updateItem(si, ii, { unit: v ?? '' })}
                              options={unitOptions}
                              placeholder="Unit"
                              showClear={false}
                            />
                          </div>
                          {stop.items.length > 1 && (
                            <button type="button" onClick={() => removeItemRow(si, ii)}
                              className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500 shrink-0">
                              <X size={12} />
                            </button>
                          )}
                        </div>
                      ))}
                      <button type="button" onClick={() => addItemRow(si)}
                        className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
                        <Plus size={11} /> Add another product
                      </button>
                    </div>

                    {/* Stop notes */}
                    <input
                      value={stop.notes}
                      onChange={e => updateStop(si, { notes: e.target.value })}
                      placeholder="Stop notes (optional)"
                      className="w-full h-9 px-3 text-sm rounded-lg border border-gray-200 outline-none focus:ring-2 bg-white"
                    />
                  </div>
                ))}

                <button type="button" onClick={() => setStops(s => [...s, emptyStop()])}
                  className="w-full h-9 flex items-center justify-center gap-2 text-xs font-medium rounded-lg border border-dashed border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors">
                  <Plus size={13} /> Add Stop
                </button>
              </div>
            )}

            {/* No warehouse — can't check stock, and the route won't be startable */}
            {!isEdit && !warehouseId && hasProductsEntered && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-1">
                <p className="text-xs font-semibold text-amber-800">⚠ No pickup warehouse selected</p>
                <p className="text-[11px] text-amber-700">Stock can't be checked, and drivers can't start this route until a warehouse is set. You can still save it.</p>
              </div>
            )}

            {/* Low-stock warning (create only) — informational, not a block */}
            {!isEdit && stockShortages.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-1">
                <p className="text-xs font-semibold text-amber-800">⚠ Low stock at this warehouse</p>
                {stockShortages.map(s => (
                  <p key={s.name} className="text-[11px] text-amber-700">
                    {s.name}: route needs {s.need}, only {s.have} {s.unit} in stock
                  </p>
                ))}
                <p className="text-[11px] text-amber-600/80">You can still save — drivers will load the available amount and the shortfall is recorded.</p>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Notes</label>
              <textarea
                value={watch('notes') ?? ''}
                onChange={e => setValue('notes', e.target.value)}
                rows={3}
                placeholder="Special instructions, route notes…"
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 outline-none transition focus:ring-2 resize-none"
              />
            </div>

            {/* Driver — last: optional at creation, required to dispatch */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Driver
                <span className="ml-1 text-gray-400 font-normal normal-case">(optional — required to dispatch)</span>
              </label>
              <SearchableDropdown
                value={watch('driverId') || null}
                onChange={v => setValue('driverId', v ?? '', { shouldValidate: true })}
                options={driverOptions}
                placeholder="Select driver"
                searchPlaceholder="Search drivers…"
                showClear={true}
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
              {mutation.isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Route'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Route drawer ───────────────────────────────────────────────────────────────
function RouteDrawer({ route, onClose, onEdit, canEdit, driverOptions }: {
  route: RouteRecord
  onClose: () => void
  onEdit: () => void
  canEdit: boolean
  driverOptions: DropdownOption[]
}) {
  const qc = useQueryClient()
  const dialogs = useDialogs()
  const [showStopForm, setShowStopForm] = useState(false)
  const [selectedLeaseId, setSelectedLeaseId] = useState<string | null>(null)
  const [stopWellId, setStopWellId] = useState<string | null>(null)
  const [stopNotes, setStopNotes] = useState('')
  const [itemRows, setItemRows] = useState<ItemRow[]>([{ productId: '', quantity: '', unit: '' }])
  const [addItemStopId, setAddItemStopId] = useState<string | null>(null)
  const [addItemRow, setAddItemRow] = useState<ItemRow>({ productId: '', quantity: '', unit: '' })
  const [loadOpen, setLoadOpen] = useState(false)       // Start → confirm load
  const [deliverOpen, setDeliverOpen] = useState(false) // Complete → record delivery

  const { data: fullData, isLoading } = useQuery({
    queryKey: ['route', route.id],
    queryFn: () => routesApi.get(route.id).then(r => r.data.data!),
  })

  const { data: leasesData } = useQuery({
    queryKey: ['leases-active'],
    queryFn: () => leasesApi.list({ isActive: true, size: 5000 }).then(r => r.data.data?.content ?? []),
  })

  const { data: wellsData } = useQuery({
    queryKey: ['wells-active'],
    queryFn: () => wellsApi.list({ isActive: true, size: 5000 }).then(r => r.data.data?.content ?? []),
  })

  const { data: productsData } = useQuery({
    queryKey: ['products-active'],
    queryFn: () => productsApi.list({ isActive: true, size: 5000 }).then(r => r.data.data?.content ?? []),
  })

  const { data: unitsData } = useQuery({
    queryKey: ['product-units'],
    queryFn: () => productUnitsApi.list().then(r => r.data.data ?? []),
  })

  const leases: LeaseRecord[] = leasesData ?? []
  const wells: WellRecord[]   = wellsData  ?? []

  const leaseOptions: DropdownOption[]  = leases.map(l => ({ value: l.id, label: l.leaseName }))
  const filteredWellOptions: DropdownOption[] = selectedLeaseId
    ? wells.filter(w => w.leaseId === selectedLeaseId).map(w => ({ value: w.id, label: w.wellName }))
    : []
  const productOptions: DropdownOption[] = (productsData ?? []).map(p => ({ value: p.id, label: p.name }))
  const unitOptions: DropdownOption[]    = (unitsData   ?? []).map(u => ({ value: u.name, label: u.name }))

  const addStopMutation = useMutation({
    mutationFn: (data: RouteStopPayload) => routesApi.addStop(route.id, data),
    onSuccess: () => {
      toast.success('Stop added')
      qc.invalidateQueries({ queryKey: ['route', route.id] })
      qc.invalidateQueries({ queryKey: ['routes'] })
      qc.invalidateQueries({ queryKey: ['routes-calendar'] })
      resetStopForm()
    },
    onError: () => toast.error('Failed to add stop'),
  })

  const removeStopMutation = useMutation({
    mutationFn: (stopId: string) => routesApi.removeStop(route.id, stopId),
    onSuccess: () => {
      toast.success('Stop removed')
      qc.invalidateQueries({ queryKey: ['route', route.id] })
      qc.invalidateQueries({ queryKey: ['routes'] })
      qc.invalidateQueries({ queryKey: ['routes-calendar'] })
    },
    onError: () => toast.error('Failed to remove stop'),
  })

  const removeItemMutation = useMutation({
    mutationFn: ({ stopId, itemId }: { stopId: string; itemId: string }) =>
      routesApi.removeItem(route.id, stopId, itemId),
    onSuccess: () => {
      toast.success('Item removed')
      qc.invalidateQueries({ queryKey: ['route', route.id] })
    },
    onError: () => toast.error('Failed to remove item'),
  })

  const addItemMutation = useMutation({
    mutationFn: ({ stopId, item }: { stopId: string; item: RouteStopItemPayload }) =>
      routesApi.addItem(route.id, stopId, item),
    onSuccess: () => {
      toast.success('Product added')
      qc.invalidateQueries({ queryKey: ['route', route.id] })
      setAddItemStopId(null)
      setAddItemRow({ productId: '', quantity: '', unit: '' })
    },
    onError: () => toast.error('Failed to add product'),
  })

  const cancelMutation = useMutation({
    mutationFn: () => routesApi.update(route.id, {
      driverId:    r.driverId ?? undefined,
      vehicleId:   r.vehicleId   ?? undefined,
      truckNumber: r.truckNumber ?? undefined,
      warehouseId: r.warehouseId ?? undefined,
      routeDate:   r.routeDate,
      status:      'CANCELLED',
      notes:       r.notes ?? undefined,
    }),
    onSuccess: () => {
      toast.success('Route cancelled')
      qc.invalidateQueries({ queryKey: ['routes'] })
      qc.invalidateQueries({ queryKey: ['routes-calendar'] })
      qc.invalidateQueries({ queryKey: ['route', route.id] })
    },
    onError: () => toast.error('Failed to cancel route'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => routesApi.delete(route.id),
    onSuccess: () => {
      toast.success('Route deleted')
      qc.invalidateQueries({ queryKey: ['routes'] })
      qc.invalidateQueries({ queryKey: ['routes-calendar'] })
      onClose()
    },
    onError: () => toast.error('Failed to delete route'),
  })

  const advanceMutation = useMutation({
    mutationFn: (next: RouteStatus) => routesApi.updateStatus(route.id, next),
    onSuccess: () => {
      toast.success('Status updated')
      qc.invalidateQueries({ queryKey: ['route', route.id] })
      qc.invalidateQueries({ queryKey: ['routes'] })
      qc.invalidateQueries({ queryKey: ['routes-calendar'] })
    },
    onError: (e: unknown) =>
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to update status'),
  })

  const assignDriverMutation = useMutation({
    mutationFn: (driverId: string) => routesApi.update(route.id, {
      driverId:    driverId || undefined,
      vehicleId:   r.vehicleId   ?? undefined,
      truckNumber: r.truckNumber ?? undefined,
      warehouseId: r.warehouseId ?? undefined,
      routeDate:   r.routeDate,
      status:      r.status,
      notes:       r.notes ?? undefined,
    }),
    onSuccess: () => {
      toast.success('Driver assigned')
      qc.invalidateQueries({ queryKey: ['route', route.id] })
      qc.invalidateQueries({ queryKey: ['routes'] })
      qc.invalidateQueries({ queryKey: ['routes-calendar'] })
    },
    onError: () => toast.error('Failed to assign driver'),
  })

  async function handleStatusSelect(target: RouteStatus) {
    if (target === 'CANCELLED') {
      const ok = await dialogs.confirm({
        title: 'Cancel route?',
        message: 'This route will be cancelled. Any dispatched inventory is returned to the warehouse.',
        danger: true, confirmLabel: 'Cancel route', cancelLabel: 'Keep route',
      })
      if (ok) cancelMutation.mutate()
    } else if (target === 'IN_PROGRESS') {
      setLoadOpen(true)       // Start: confirm the load first
    } else if (target === 'COMPLETED') {
      setDeliverOpen(true)    // Complete: record what was delivered
    } else {
      advanceMutation.mutate(target)  // Dispatch
    }
  }

  const invalidateRoute = () => {
    qc.invalidateQueries({ queryKey: ['route', route.id] })
    qc.invalidateQueries({ queryKey: ['routes'] })
    qc.invalidateQueries({ queryKey: ['routes-calendar'] })
  }

  function resetStopForm() {
    setShowStopForm(false)
    setSelectedLeaseId(null)
    setStopWellId(null)
    setStopNotes('')
    setItemRows([{ productId: '', quantity: '', unit: '' }])
  }

  function handleAddStop() {
    if (!stopWellId || !selectedLeaseId) { toast.error('Select a lease and well'); return }
    const validItems = itemRows
      .filter(r => r.productId && r.quantity && r.unit)
      .map(r => ({ productId: r.productId, quantity: parseFloat(r.quantity), unit: r.unit }))
    addStopMutation.mutate({
      leaseId: selectedLeaseId,
      wellId:  stopWellId,
      notes:   stopNotes || undefined,
      items:   validItems.length > 0 ? validItems : undefined,
    })
  }

  const r = fullData ?? route
  const stops = fullData?.stops ?? []

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative bg-white w-[600px] h-full shadow-2xl flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors">
              <X size={16} />
            </button>
            <div>
              <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                {r.routeNumber != null && (
                  <span className="px-1.5 py-0.5 rounded-md text-xs font-bold text-white" style={{ backgroundColor: 'var(--color-primary)' }}>
                    #{r.routeNumber}
                  </span>
                )}
                {new Date(r.routeDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
              <p className="text-xs text-gray-400">{r.driverName ?? '—'}{r.truckNumber ? ` · ${r.truckNumber}` : ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={r.status} />
            {canEdit && r.status === 'PLANNED' && (
              <button onClick={onEdit} className="h-8 px-3 text-xs font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
                Edit
              </button>
            )}
            {canEdit && r.status === 'CANCELLED' && (
              <button
                onClick={async () => {
                  const ok = await dialogs.confirm({
                    title: 'Delete route?', message: 'This route will be permanently deleted. This cannot be undone.',
                    danger: true, confirmLabel: 'Delete', cancelLabel: 'Keep',
                  })
                  if (ok) deleteMutation.mutate()
                }}
                disabled={deleteMutation.isPending}
                className="h-8 px-3 text-xs font-medium rounded-lg border border-red-100 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60">
                {deleteMutation.isPending ? 'Deleting…' : 'Delete Route'}
              </button>
            )}
          </div>
        </div>

        {/* Status — only when the route has moves left (hidden for Completed/Cancelled) */}
        {canEdit && STATUS_ACTIONS[r.status].length > 0 && (
          <div className="px-5 py-3 border-b border-gray-100 shrink-0 space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Status</label>
              <StatusDropdown status={r.status} canDispatch={!!r.driverId} onSelect={handleStatusSelect} />
            </div>

            {/* Assign/change the driver inline (while Planned) — required to dispatch */}
            {r.status === 'PLANNED' && (
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                  Driver {!r.driverId && <span className="text-red-500 normal-case font-medium">— assign to dispatch</span>}
                </label>
                <SearchableDropdown
                  value={r.driverId || null}
                  onChange={v => assignDriverMutation.mutate(v ?? '')}
                  options={driverOptions}
                  placeholder="Assign driver"
                  searchPlaceholder="Search drivers…"
                  showClear={true}
                />
              </div>
            )}
          </div>
        )}

        {/* Meta */}
        {r.notes && (
          <div className="px-5 py-3 border-b border-gray-100 shrink-0">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-0.5">Notes</p>
            <p className="text-sm text-gray-700">{r.notes}</p>
          </div>
        )}

        {/* Stops */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Stops</p>
            <span className="text-xs text-gray-400">{stops.length} stop{stops.length !== 1 ? 's' : ''}</span>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />)}
            </div>
          ) : stops.length === 0 && !showStopForm ? (
            <div className="text-center py-10">
              <MapPin size={28} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">No stops yet</p>
              <p className="text-xs text-gray-400 mt-1">Add stops (lease + well) below</p>
            </div>
          ) : (
            <div className="space-y-2">
              {stops.map((stop, idx) => {
                const isSkipped   = stop.status === 'SKIPPED'
                const isDelivered = stop.status === 'COMPLETED'
                const stopBg    = isSkipped ? 'bg-red-50' : isDelivered ? 'bg-emerald-50' : 'bg-gray-50'
                const circleBg  = isSkipped ? '#ef4444' : isDelivered ? '#10b981' : undefined
                return (
                <div key={stop.id} className="border border-gray-200 rounded-xl overflow-hidden">
                  {/* Stop header */}
                  <div className={`flex items-center gap-3 px-4 py-3 ${stopBg}`}>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                      style={{ backgroundColor: circleBg ?? 'var(--color-primary)' }}>
                      {isDelivered ? <Check size={12} strokeWidth={3} /> : isSkipped ? <X size={12} strokeWidth={3} /> : idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900">{stop.clientName ?? stop.leaseName ?? '—'}</p>
                        {isDelivered && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-700">Delivered</span>
                        )}
                        {isSkipped && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-red-600">Skipped</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{stop.leaseName ?? '—'} · {stop.wellName ?? '—'}</p>
                      {isSkipped && stop.skipReason && (
                        <p className="text-xs text-red-500 mt-0.5">Reason: {stop.skipReason}</p>
                      )}
                      {isDelivered && stop.deliveredAt && (
                        <p className="text-xs text-emerald-600 mt-0.5">
                          Delivered {new Date(stop.deliveredAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                    {canEdit && r.status === 'PLANNED' && (
                      <button
                        onClick={() => removeStopMutation.mutate(stop.id)}
                        disabled={removeStopMutation.isPending}
                        className="w-7 h-7 rounded-md flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>

                  {/* Items */}
                  {stop.items.length > 0 && (
                    <div className="px-4 py-2 space-y-1.5">
                      {stop.items.map(item => (
                        <div key={item.id} className="flex items-center gap-2 group">
                          <Package size={11} className="text-gray-400 shrink-0" />
                          <span className="text-xs text-gray-700 flex-1">{item.productName ?? '—'}</span>
                          {item.actualQtyDelivered != null ? (
                            <span className="text-xs text-right">
                              <span className={`font-semibold ${item.actualQtyDelivered < item.quantity ? 'text-amber-600' : 'text-emerald-600'}`}>
                                {item.actualQtyDelivered} {item.unit} delivered
                              </span>
                              {item.actualQtyDelivered < item.quantity && (
                                <span className="text-gray-400"> of {item.quantity} planned</span>
                              )}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-500">{item.quantity} {item.unit}</span>
                          )}
                          {canEdit && r.status === 'PLANNED' && (
                            <button
                              onClick={() => removeItemMutation.mutate({ stopId: stop.id, itemId: item.id })}
                              className="w-5 h-5 rounded flex items-center justify-center text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                              <X size={10} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add item to existing stop */}
                  {canEdit && r.status === 'PLANNED' && (
                    <div className="px-4 pb-3">
                      {addItemStopId === stop.id ? (
                        <div className="flex gap-2 items-center mt-2">
                          <div className="flex-1">
                            <SearchableDropdown
                              value={addItemRow.productId || null}
                              onChange={v => setAddItemRow(r => ({ ...r, productId: v ?? '' }))}
                              options={productOptions}
                              placeholder="Product"
                              showClear={false}
                            />
                          </div>
                          <input
                            type="number" step="0.01" min="0"
                            value={addItemRow.quantity}
                            onChange={e => setAddItemRow(r => ({ ...r, quantity: e.target.value }))}
                            placeholder="Qty"
                            className="w-20 h-9 px-2 text-sm rounded-lg border border-gray-200 outline-none focus:ring-2"
                          />
                          <div className="w-24">
                            <SearchableDropdown
                              value={addItemRow.unit || null}
                              onChange={v => setAddItemRow(r => ({ ...r, unit: v ?? '' }))}
                              options={unitOptions}
                              placeholder="Unit"
                              showClear={false}
                            />
                          </div>
                          <button
                            onClick={() => {
                              if (!addItemRow.productId || !addItemRow.quantity || !addItemRow.unit) {
                                toast.error('Fill in all fields'); return
                              }
                              addItemMutation.mutate({ stopId: stop.id, item: { productId: addItemRow.productId, quantity: parseFloat(addItemRow.quantity), unit: addItemRow.unit } })
                            }}
                            disabled={addItemMutation.isPending}
                            className="h-9 px-3 text-xs font-semibold text-white rounded-lg disabled:opacity-60 shrink-0"
                            style={{ backgroundColor: 'var(--color-primary)' }}>
                            {addItemMutation.isPending ? '…' : 'Add'}
                          </button>
                          <button onClick={() => setAddItemStopId(null)}
                            className="w-8 h-9 flex items-center justify-center text-gray-400 hover:text-gray-600 shrink-0">
                            <X size={13} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setAddItemStopId(stop.id); setAddItemRow({ productId: '', quantity: '', unit: '' }) }}
                          className="mt-2 flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors">
                          <Plus size={11} /> Add product
                        </button>
                      )}
                    </div>
                  )}

                  {stop.notes && (
                    <p className="px-4 pb-2 text-xs text-gray-400 italic">{stop.notes}</p>
                  )}
                  {stop.deliveryPhotoUrl && (
                    <div className="px-4 pb-3">
                      <img
                        src={stop.deliveryPhotoUrl}
                        alt="Delivery proof"
                        className="w-full rounded-lg object-cover max-h-48 border border-gray-200"
                      />
                      {stop.deliveredAt && (
                        <div className="mt-2 space-y-1">
                          {stop.syncedLate && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-100 text-orange-600">
                              ⚠ Synced Late
                            </span>
                          )}
                          <p className="text-[10px] text-gray-400">
                            {stop.syncedLate ? 'Recorded' : 'Delivered'}{' '}
                            {new Date(stop.deliveredAt).toLocaleString()}
                          </p>
                          {stop.syncedLate && stop.receivedAt && (
                            <p className="text-[10px] text-gray-400">
                              Synced {new Date(stop.receivedAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )})}
            </div>
          )}

          {/* Add stop form */}
          {canEdit && r.status === 'PLANNED' && (
            <div className="mt-4">
              {!showStopForm ? (
                <button onClick={() => setShowStopForm(true)}
                  className="w-full h-9 flex items-center justify-center gap-2 text-xs font-medium rounded-lg border border-dashed border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors">
                  <Plus size={13} /> Add Stop
                </button>
              ) : (
                <div className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Add Stop</p>

                  {/* Lease */}
                  <SearchableDropdown
                    value={selectedLeaseId}
                    onChange={v => { setSelectedLeaseId(v); setStopWellId(null) }}
                    options={leaseOptions}
                    placeholder="Select lease"
                    searchPlaceholder="Search leases…"
                    showClear={false}
                  />

                  {/* Well */}
                  <SearchableDropdown
                    value={stopWellId}
                    onChange={v => setStopWellId(v)}
                    options={filteredWellOptions}
                    placeholder={selectedLeaseId ? 'Select well' : 'Select a lease first'}
                    searchPlaceholder="Search wells…"
                    showClear={false}
                  />

                  {/* Delivery items */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Delivery Items (optional)</p>
                    {itemRows.map((row, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <div className="flex-1">
                          <SearchableDropdown
                            value={row.productId || null}
                            onChange={v => setItemRows(rows => rows.map((r, j) => j === i ? { ...r, productId: v ?? '' } : r))}
                            options={productOptions}
                            placeholder="Product"
                            showClear={false}
                          />
                        </div>
                        <input
                          type="number" step="0.01" min="0"
                          value={row.quantity}
                          onChange={e => setItemRows(rows => rows.map((r, j) => j === i ? { ...r, quantity: e.target.value } : r))}
                          placeholder="Qty"
                          className="w-20 h-9 px-2 text-sm rounded-lg border border-gray-200 outline-none focus:ring-2 bg-white"
                        />
                        <div className="w-28">
                          <SearchableDropdown
                            value={row.unit || null}
                            onChange={v => setItemRows(rows => rows.map((r, j) => j === i ? { ...r, unit: v ?? '' } : r))}
                            options={unitOptions}
                            placeholder="Unit"
                            showClear={false}
                          />
                        </div>
                        {itemRows.length > 1 && (
                          <button type="button" onClick={() => setItemRows(rows => rows.filter((_, j) => j !== i))}
                            className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500 shrink-0">
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button type="button"
                      onClick={() => setItemRows(rows => [...rows, { productId: '', quantity: '', unit: '' }])}
                      className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
                      <Plus size={11} /> Add another product
                    </button>
                  </div>

                  {/* Stop notes */}
                  <input
                    value={stopNotes}
                    onChange={e => setStopNotes(e.target.value)}
                    placeholder="Stop notes (optional)"
                    className="w-full h-9 px-3 text-sm rounded-lg border border-gray-200 outline-none focus:ring-2 bg-white"
                  />

                  <div className="flex gap-2">
                    <button type="button" onClick={resetStopForm}
                      className="flex-1 h-8 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors">
                      Cancel
                    </button>
                    <button type="button" onClick={handleAddStop} disabled={addStopMutation.isPending}
                      className="flex-1 h-8 text-xs font-semibold text-white rounded-lg transition disabled:opacity-60"
                      style={{ backgroundColor: 'var(--color-primary)' }}>
                      {addStopMutation.isPending ? 'Adding…' : 'Add Stop'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {loadOpen && (
        <RouteLoadDialog route={r} onClose={() => setLoadOpen(false)} onDone={invalidateRoute} />
      )}
      {deliverOpen && (
        <RouteDeliveryDialog route={r} onClose={() => setDeliverOpen(false)} onDone={invalidateRoute} />
      )}
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function toDateStr(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}


// ── Calendar view ───────────────────────────────────────────────────────────────
const MAX_CHIPS = 3
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// Chip colour by status: planned/dispatched → grey, in-progress → amber,
// completed → green, cancelled → red.
const CAL_CHIP: Record<RouteStatus, string> = {
  PLANNED:     'bg-gray-200 text-gray-700',
  DISPATCHED:  'bg-gray-200 text-gray-700',
  IN_PROGRESS: 'bg-amber-200 text-amber-900',
  COMPLETED:   'bg-emerald-200 text-emerald-900',
  CANCELLED:   'bg-red-200 text-red-700',
}

// 6×7 grid of date strings for the month containing (year, month0), padded to full weeks.
function monthGrid(year: number, month: number): string[] {
  const first = new Date(year, month, 1)
  const start = new Date(first)
  start.setDate(first.getDate() - first.getDay())   // back up to the Sunday
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return toDateStr(d)
  })
}

function CalendarView({ canEdit, onOpenDay, onCreateForDate }: {
  canEdit: boolean
  onOpenDay: (date: string) => void
  onCreateForDate: (date: string) => void
}) {
  const today = toDateStr(new Date())
  const [cursor, setCursor] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() } })

  const cells = monthGrid(cursor.y, cursor.m)
  const from = cells[0]
  const to = cells[cells.length - 1]

  const { data } = useQuery({
    queryKey: ['routes-calendar', from, to],
    queryFn:  () => routesApi.list({ from, to, size: 300 }),
    refetchInterval: 30_000,
  })
  const routes = data?.data?.data?.content ?? []

  const byDate = new Map<string, RouteRecord[]>()
  for (const r of routes) {
    const arr = byDate.get(r.routeDate) ?? []
    arr.push(r)
    byDate.set(r.routeDate, arr)
  }

  const shiftMonth = (n: number) =>
    setCursor(c => { const d = new Date(c.y, c.m + n, 1); return { y: d.getFullYear(), m: d.getMonth() } })
  const goToday = () => { const d = new Date(); setCursor({ y: d.getFullYear(), m: d.getMonth() }) }

  const monthName = new Date(cursor.y, cursor.m, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div className="space-y-4">
      {/* Month nav */}
      <div className="flex items-center gap-2">
        <button onClick={() => shiftMonth(-1)}
          className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
          <ChevronLeft size={15} />
        </button>
        <p className="text-sm font-semibold text-gray-900 w-40 text-center">{monthName}</p>
        <button onClick={() => shiftMonth(1)}
          className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
          <ChevronRight size={15} />
        </button>
        <button onClick={goToday}
          className="h-8 px-3 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors ml-1">
          Today
        </button>
      </div>

      {/* Grid */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-gray-100">
          {WEEKDAYS.map(d => (
            <div key={d} className="px-2 py-2 text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((date, i) => {
            const dt = new Date(date + 'T00:00:00')
            const inMonth = dt.getMonth() === cursor.m
            const dayNum = dt.getDate()
            const dayRoutes = byDate.get(date) ?? []
            const isToday = date === today
            const isEmpty = dayRoutes.length === 0
            const extra = dayRoutes.length - MAX_CHIPS
            return (
              <div key={date}
                onClick={() => { if (!isEmpty) onOpenDay(date) }}
                className={`group min-h-[100px] border-b border-r border-gray-100 p-1.5 flex flex-col gap-1 transition-colors ${(i + 1) % 7 === 0 ? 'border-r-0' : ''} ${inMonth ? 'bg-white' : 'bg-gray-50/60'} ${!isEmpty ? 'cursor-pointer hover:bg-gray-50' : ''}`}>
                <div className="flex">
                  <span className={`text-xs font-semibold w-5 h-5 flex items-center justify-center rounded-full ${isToday ? 'text-white' : inMonth ? 'text-gray-700' : 'text-gray-300'}`}
                    style={isToday ? { backgroundColor: 'var(--color-primary)' } : undefined}>
                    {dayNum}
                  </span>
                </div>

                {isEmpty ? (
                  canEdit && (
                    <button onClick={e => { e.stopPropagation(); onCreateForDate(date) }}
                      title="Add route"
                      className="flex-1 flex items-center justify-center">
                      <span className="w-7 h-7 rounded-full border border-dashed border-gray-300 flex items-center justify-center text-gray-300 opacity-0 group-hover:opacity-100 hover:border-transparent hover:text-white hover:bg-[var(--color-primary)] transition-all">
                        <Plus size={14} />
                      </span>
                    </button>
                  )
                ) : (
                  <>
                    {dayRoutes.slice(0, MAX_CHIPS).map(r => (
                      <div key={r.id}
                        className={`px-1.5 py-0.5 rounded text-[11px] font-semibold truncate ${CAL_CHIP[r.status]}`}>
                        #{r.routeNumber ?? '—'}
                      </div>
                    ))}
                    {extra > 0 && (
                      <span className="text-[10px] font-medium text-gray-400 px-1">+{extra} more</span>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function RoutesPage() {
  const { user } = useAuthStore()
  const canEdit = hasAnyRole(user, 'ADMIN', 'MANAGER')

  const [view, setView]                 = useState<'calendar' | 'list' | 'skipped'>('calendar')
  const [search, setSearch]             = useState('')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [dateFilter, setDateFilter]     = useState('')
  const [page, setPage]                 = useState(0)
  const [formOpen, setFormOpen]         = useState(false)
  const [editing, setEditing]           = useState<RouteRecord | undefined>()
  const [createDate, setCreateDate]     = useState<string | undefined>()
  const [selected, setSelected]         = useState<RouteRecord | undefined>()

  const listParams = { status: statusFilter || undefined, routeDate: dateFilter || undefined, page, size: PAGE_SIZE }

  const { data, isLoading } = useQuery({
    queryKey: ['routes', listParams],
    queryFn:  () => routesApi.list(listParams),
  })

  const { data: driversData } = useQuery({
    queryKey: ['users-drivers'],
    queryFn:  () => api.get<ApiResponse<UserRecord[]>>('/api/v1/users', { params: { role: 'TRUCK_DRIVER' } })
                      .then(r => r.data.data ?? []),
    enabled:  canEdit,
  })

  const driverOptions: DropdownOption[] = (driversData ?? []).map(u => ({ value: u.id, label: u.fullName }))

  const routes     = data?.data?.data?.content       ?? []
  const total      = data?.data?.data?.totalElements ?? 0
  const totalPages = data?.data?.data?.totalPages    ?? 0

  const filtered = search
    ? routes.filter(r =>
        r.driverName?.toLowerCase().includes(search.toLowerCase()) ||
        r.truckNumber?.toLowerCase().includes(search.toLowerCase())
      )
    : routes

  function openCreate() { setEditing(undefined); setCreateDate(undefined); setSelected(undefined); setFormOpen(true) }
  function openCreateForDate(date: string) { setEditing(undefined); setCreateDate(date); setSelected(undefined); setFormOpen(true) }
  function openEdit(r: RouteRecord) { setEditing(r); setCreateDate(undefined); setSelected(undefined); setFormOpen(true) }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Routes & Dispatch</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {view === 'calendar' ? 'Monthly schedule' : `${total} route${total !== 1 ? 's' : ''} total`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setView('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                view === 'calendar' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>
              <Calendar size={13} /> Calendar
            </button>
            <button
              onClick={() => setView('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                view === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>
              <LayoutList size={13} /> List
            </button>
            <button
              onClick={() => setView('skipped')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                view === 'skipped' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>
              <MapPin size={13} /> Skipped
            </button>
          </div>
          {/* New Route (list view only — board has its own) */}
          {canEdit && view === 'list' && (
            <button onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg transition"
              style={{ backgroundColor: 'var(--color-primary)' }}>
              <Plus size={15} /> New Route
            </button>
          )}
        </div>
      </div>

      {/* Skipped stops view */}
      {view === 'skipped' && <SkippedStopsView />}

      {/* Calendar view */}
      {view === 'calendar' && (
        <CalendarView
          canEdit={canEdit}
          onOpenDay={d => { setDateFilter(d); setPage(0); setView('list') }}
          onCreateForDate={openCreateForDate}
        />
      )}

      {/* List view */}
      {view === 'list' && (
        <>
          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search driver or truck…"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(0) }}
                className="h-9 pl-8 pr-3 text-sm rounded-lg border border-gray-200 outline-none transition focus:ring-2 w-56"
              />
            </div>
            <input
              type="date"
              value={dateFilter}
              onChange={e => { setDateFilter(e.target.value); setPage(0) }}
              className="h-9 px-3 text-sm rounded-lg border border-gray-200 outline-none transition focus:ring-2 text-gray-700"
            />
            {dateFilter && (
              <button onClick={() => { setDateFilter(''); setPage(0) }}
                className="h-9 px-3 text-xs font-medium rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors flex items-center gap-1">
                <X size={12} /> Clear date
              </button>
            )}
            <SearchableDropdown
              value={statusFilter}
              onChange={v => { setStatusFilter(v); setPage(0) }}
              options={STATUS_OPTIONS}
              placeholder="All Statuses"
              className="w-44"
            />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: 'var(--color-primary)' }}>
                  {['Route #', 'Date', 'Driver', 'Truck #', '# Stops', 'Status', ''].map(h => (
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
                      <Truck size={32} className="mx-auto text-gray-300 mb-3" />
                      <p className="text-sm text-gray-500 font-medium">No routes found</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {search || statusFilter ? 'Try adjusting your filters' : 'Create the first route to get started'}
                      </p>
                    </td>
                  </tr>
                ) : filtered.map(r => (
                  <tr key={r.id}
                    onClick={() => { setSelected(r); setFormOpen(false) }}
                    className="hover:bg-gray-50 cursor-pointer transition-colors">
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      {r.routeNumber != null ? `#${r.routeNumber}` : '—'}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {new Date(r.routeDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{r.driverName ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{r.truckNumber ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{r.stopCount}</td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
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
        </>
      )}

      {formOpen && (
        <RouteFormPanel
          open={formOpen}
          onClose={() => { setFormOpen(false); setEditing(undefined); setCreateDate(undefined) }}
          route={editing}
          initialDate={createDate}
          driverOptions={driverOptions}
        />
      )}

      {selected && !formOpen && (
        <RouteDrawer
          route={selected}
          onClose={() => setSelected(undefined)}
          onEdit={() => openEdit(selected)}
          canEdit={canEdit}
          driverOptions={driverOptions}
        />
      )}
    </div>
  )
}
