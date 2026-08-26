import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { Plus, X, Search, ChevronRight, Truck, MapPin, Trash2, Package, LayoutList, LayoutGrid, ChevronLeft } from 'lucide-react'
import { routesApi, type RouteRecord, type RoutePayload, type RouteStopPayload, type RouteStopItemPayload, type RouteStatus } from '@/api/routes'
import { leasesApi, type LeaseRecord } from '@/api/leases'
import { wellsApi, type WellRecord } from '@/api/wells'
import { productsApi } from '@/api/products'
import { productUnitsApi } from '@/api/productUnits'
import { vehiclesApi, type Vehicle } from '@/api/vehicles'
import { warehousesApi, type WarehouseRecord } from '@/api/warehouses'
import { SearchableDropdown, type DropdownOption } from '@/components/ui/SearchableDropdown'
import { useAuthStore } from '@/store/authStore'
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

// ── Route form schema ──────────────────────────────────────────────────────────
const routeSchema = z.object({
  driverId:    z.string().min(1, 'Driver is required'),
  vehicleId:   z.string().optional().or(z.literal('')),
  warehouseId: z.string().optional().or(z.literal('')),
  routeDate:   z.string().min(1, 'Date is required'),
  status:      z.enum(['PLANNED', 'DISPATCHED', 'IN_PROGRESS', 'COMPLETED']),
  notes:       z.string().optional().or(z.literal('')),
})
type RouteFormData = z.infer<typeof routeSchema>

// ── Route form panel ───────────────────────────────────────────────────────────
function RouteFormPanel({ open, onClose, route, driverOptions }: {
  open: boolean
  onClose: () => void
  route?: RouteRecord
  driverOptions: DropdownOption[]
}) {
  const qc = useQueryClient()
  const isEdit = !!route

  const { handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<RouteFormData>({
    resolver: zodResolver(routeSchema),
    defaultValues: {
      driverId:    route?.driverId    ?? '',
      vehicleId:   route?.vehicleId   ?? '',
      warehouseId: route?.warehouseId ?? '',
      routeDate:   route?.routeDate   ?? '',
      status:      route?.status      ?? 'PLANNED',
      notes:       route?.notes       ?? '',
    },
  })

  const { data: vehiclesData } = useQuery({
    queryKey: ['vehicles-available'],
    queryFn: () => vehiclesApi.list({ size: 200 }).then(r => (r.data as ApiResponse<PageResponse<Vehicle>>).data?.content ?? []),
  })
  const vehicleOptions: DropdownOption[] = (vehiclesData ?? []).map(v => ({
    value: v.id,
    label: `${v.licensePlate} — ${v.make} ${v.model} ${v.year}`,
  }))

  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses-active'],
    queryFn: () => warehousesApi.listActive().then(r => (r.data.data ?? []) as WarehouseRecord[]),
  })
  const warehouseOptions: DropdownOption[] = (warehousesData ?? []).map(w => ({
    value: w.id,
    label: w.name + (w.location ? ` (${w.location})` : ''),
  }))

  const mutation = useMutation({
    mutationFn: (data: RoutePayload) =>
      isEdit ? routesApi.update(route!.id, data) : routesApi.create(data),
    onSuccess: () => {
      toast.success(isEdit ? 'Route updated' : 'Route created')
      qc.invalidateQueries({ queryKey: ['routes'] })
      onClose(); reset()
    },
    onError: (e: unknown) =>
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed'),
  })

  function onSubmit(data: RouteFormData) {
    mutation.mutate({
      driverId:    data.driverId,
      vehicleId:   data.vehicleId   || undefined,
      warehouseId: data.warehouseId || undefined,
      routeDate:   data.routeDate,
      status:      data.status,
      notes:       data.notes || undefined,
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

            {/* Driver */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Driver <span className="text-red-500">*</span></label>
              <SearchableDropdown
                value={watch('driverId') || null}
                onChange={v => setValue('driverId', v ?? '', { shouldValidate: true })}
                options={driverOptions}
                placeholder="Select driver"
                searchPlaceholder="Search drivers…"
                showClear={false}
              />
              {errors.driverId && <p className="text-red-500 text-xs">{errors.driverId.message}</p>}
            </div>

            {/* Vehicle */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Vehicle / Truck</label>
              <SearchableDropdown
                value={watch('vehicleId') || null}
                onChange={v => setValue('vehicleId', v ?? '')}
                options={vehicleOptions}
                placeholder="Select vehicle"
                searchPlaceholder="Search by plate or make…"
                showClear={true}
              />
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

            {/* Status */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</label>
              <div className="grid grid-cols-2 gap-2">
                {(['PLANNED', 'DISPATCHED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as RouteStatus[]).map(s => (
                  <button key={s} type="button"
                    onClick={() => setValue('status', s)}
                    className={`h-9 text-xs font-semibold rounded-lg border transition-colors ${
                      selectedStatus === s ? 'text-white border-transparent' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                    style={selectedStatus === s ? { backgroundColor: 'var(--color-primary)' } : {}}>
                    {STATUS_COLOR[s].label}
                  </button>
                ))}
              </div>
            </div>

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

// ── Stop item row (inline add) ─────────────────────────────────────────────────
interface ItemRow { productId: string; quantity: string; unit: string }

// ── Route drawer ───────────────────────────────────────────────────────────────
function RouteDrawer({ route, onClose, onEdit, canEdit }: {
  route: RouteRecord
  onClose: () => void
  onEdit: () => void
  canEdit: boolean
}) {
  const qc = useQueryClient()
  const [showStopForm, setShowStopForm] = useState(false)
  const [selectedLeaseId, setSelectedLeaseId] = useState<string | null>(null)
  const [stopWellId, setStopWellId] = useState<string | null>(null)
  const [stopNotes, setStopNotes] = useState('')
  const [itemRows, setItemRows] = useState<ItemRow[]>([{ productId: '', quantity: '', unit: '' }])
  const [addItemStopId, setAddItemStopId] = useState<string | null>(null)
  const [addItemRow, setAddItemRow] = useState<ItemRow>({ productId: '', quantity: '', unit: '' })

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
      driverId:    r.driverId,
      vehicleId:   r.vehicleId   ?? undefined,
      warehouseId: r.warehouseId ?? undefined,
      routeDate:   r.routeDate,
      status:      'CANCELLED',
      notes:       r.notes ?? undefined,
    }),
    onSuccess: () => {
      toast.success('Route cancelled')
      qc.invalidateQueries({ queryKey: ['routes'] })
      qc.invalidateQueries({ queryKey: ['route', route.id] })
    },
    onError: () => toast.error('Failed to cancel route'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => routesApi.delete(route.id),
    onSuccess: () => {
      toast.success('Route deleted')
      qc.invalidateQueries({ queryKey: ['routes'] })
      qc.invalidateQueries({ queryKey: ['routes-board'] })
      onClose()
    },
    onError: () => toast.error('Failed to delete route'),
  })

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
              <p className="text-sm font-semibold text-gray-900">
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
            {canEdit && (r.status === 'PLANNED' || r.status === 'DISPATCHED' || r.status === 'IN_PROGRESS') && (
              <button
                onClick={() => { if (confirm('Cancel this route?')) cancelMutation.mutate() }}
                disabled={cancelMutation.isPending}
                className="h-8 px-3 text-xs font-medium rounded-lg border border-red-100 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60">
                Cancel Route
              </button>
            )}
            {canEdit && r.status === 'CANCELLED' && (
              <button
                onClick={() => { if (confirm('Permanently delete this route? This cannot be undone.')) deleteMutation.mutate() }}
                disabled={deleteMutation.isPending}
                className="h-8 px-3 text-xs font-medium rounded-lg border border-red-100 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60">
                {deleteMutation.isPending ? 'Deleting…' : 'Delete Route'}
              </button>
            )}
          </div>
        </div>

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
              {stops.map((stop, idx) => (
                <div key={stop.id} className="border border-gray-200 rounded-xl overflow-hidden">
                  {/* Stop header */}
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-50">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                      style={{ backgroundColor: 'var(--color-primary)' }}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{stop.leaseName ?? '—'}</p>
                      <p className="text-xs text-gray-500">{stop.wellName ?? '—'}</p>
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
                          <span className="text-xs text-gray-500">{item.quantity} {item.unit}</span>
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
                        <p className="text-[10px] text-gray-400 mt-1">
                          Delivered {new Date(stop.deliveredAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
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
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function toDateStr(d: Date) {
  return d.toISOString().split('T')[0]
}

function addDays(dateStr: string, n: number) {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return toDateStr(d)
}

const NEXT_STATUSES: Partial<Record<RouteStatus, RouteStatus>> = {
  PLANNED:     'DISPATCHED',
  DISPATCHED:  'IN_PROGRESS',
  IN_PROGRESS: 'COMPLETED',
}

const NEXT_LABEL: Partial<Record<RouteStatus, string>> = {
  PLANNED:     'Dispatch',
  DISPATCHED:  'Start',
  IN_PROGRESS: 'Complete',
}

// ── Board view ─────────────────────────────────────────────────────────────────
function BoardView({ boardDate, onDateChange, canEdit, onSelectRoute, driverOptions }: {
  boardDate: string
  onDateChange: (d: string) => void
  canEdit: boolean
  onSelectRoute: (r: RouteRecord) => void
  driverOptions: DropdownOption[]
}) {
  const qc = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['routes-board', boardDate],
    queryFn:  () => routesApi.list({ routeDate: boardDate, size: 100 }),
    refetchInterval: 30_000,
  })

  const routes = data?.data?.data?.content ?? []

  const counts = {
    PLANNED:     routes.filter(r => r.status === 'PLANNED').length,
    DISPATCHED:  routes.filter(r => r.status === 'DISPATCHED').length,
    IN_PROGRESS: routes.filter(r => r.status === 'IN_PROGRESS').length,
    COMPLETED:   routes.filter(r => r.status === 'COMPLETED').length,
    CANCELLED:   routes.filter(r => r.status === 'CANCELLED').length,
  }

  const advanceMutation = useMutation({
    mutationFn: ({ route, next }: { route: RouteRecord; next: RouteStatus }) =>
      routesApi.update(route.id, {
        driverId:    route.driverId,
        vehicleId:   route.vehicleId   ?? undefined,
        warehouseId: route.warehouseId ?? undefined,
        routeDate:   route.routeDate,
        status:      next,
        notes:       route.notes ?? undefined,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['routes-board', boardDate] }),
    onError:   () => toast.error('Failed to update status'),
  })

  const isToday  = boardDate === toDateStr(new Date())
  const dateLabel = isToday
    ? 'Today'
    : new Date(boardDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

  const STAT_ITEMS: { key: RouteStatus; label: string }[] = [
    { key: 'PLANNED',     label: 'Planned'     },
    { key: 'DISPATCHED',  label: 'Dispatched'  },
    { key: 'IN_PROGRESS', label: 'In Progress' },
    { key: 'COMPLETED',   label: 'Completed'   },
  ]

  return (
    <div className="space-y-5">
      {/* Date nav */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => onDateChange(addDays(boardDate, -1))}
            className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
            <ChevronLeft size={15} />
          </button>
          <div className="text-center px-2">
            <p className="text-sm font-semibold text-gray-900">{dateLabel}</p>
            {!isToday && <p className="text-xs text-gray-400">{boardDate}</p>}
          </div>
          <button onClick={() => onDateChange(addDays(boardDate, 1))}
            className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
            <ChevronRight size={15} />
          </button>
          {!isToday && (
            <button onClick={() => onDateChange(toDateStr(new Date()))}
              className="h-8 px-3 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors ml-1">
              Today
            </button>
          )}
        </div>
        {canEdit && (
          <button onClick={() => setFormOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg"
            style={{ backgroundColor: 'var(--color-primary)' }}>
            <Plus size={15} /> New Route
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {STAT_ITEMS.map(({ key, label }) => {
          const s = STATUS_COLOR[key]
          return (
            <div key={key} className={`rounded-xl p-4 ring-1 ${s.bg} ${s.ring}`}>
              <p className={`text-2xl font-bold ${s.text}`}>{counts[key]}</p>
              <p className={`text-xs font-medium mt-0.5 ${s.text} opacity-80`}>{label}</p>
            </div>
          )
        })}
      </div>

      {/* Route cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : routes.length === 0 ? (
        <div className="text-center py-16">
          <Truck size={36} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-500 font-medium">No routes for {dateLabel}</p>
          {canEdit && <p className="text-xs text-gray-400 mt-1">Create a route above to get started</p>}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {routes.map(route => {
            const s   = STATUS_COLOR[route.status]
            const next = NEXT_STATUSES[route.status]
            return (
              <div key={route.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-sm transition-shadow">
                {/* Card header */}
                <div className={`px-4 py-2 flex items-center justify-between ring-1 ${s.bg} ${s.ring} ring-inset`}>
                  <StatusBadge status={route.status} />
                  {route.truckNumber && (
                    <span className="text-xs font-mono text-gray-500">{route.truckNumber}</span>
                  )}
                </div>
                {/* Card body */}
                <div className="px-4 py-3 cursor-pointer" onClick={() => onSelectRoute(route)}>
                  <p className="text-sm font-semibold text-gray-900 truncate">{route.driverName ?? '—'}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {route.stopCount} stop{route.stopCount !== 1 ? 's' : ''}
                  </p>
                </div>
                {/* Actions */}
                {canEdit && route.status !== 'COMPLETED' && route.status !== 'CANCELLED' && (
                  <div className="px-4 pb-3 flex gap-2">
                    {next && (
                      <button
                        onClick={() => advanceMutation.mutate({ route, next })}
                        disabled={advanceMutation.isPending}
                        className="flex-1 h-8 text-xs font-semibold text-white rounded-lg disabled:opacity-60 transition"
                        style={{ backgroundColor: 'var(--color-primary)' }}>
                        {NEXT_LABEL[route.status]}
                      </button>
                    )}
                    <button
                      onClick={() => { if (confirm('Cancel this route?')) advanceMutation.mutate({ route, next: 'CANCELLED' }) }}
                      className="h-8 px-3 text-xs font-medium rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors">
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {formOpen && (
        <RouteFormPanel
          open={formOpen}
          onClose={() => setFormOpen(false)}
          driverOptions={driverOptions}
        />
      )}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function RoutesPage() {
  const { user } = useAuthStore()
  const role    = user?.role
  const canEdit = role === 'ADMIN' || role === 'MANAGER'

  const [view, setView]                 = useState<'list' | 'board'>('board')
  const [boardDate, setBoardDate]       = useState(toDateStr(new Date()))
  const [search, setSearch]             = useState('')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [page, setPage]                 = useState(0)
  const [formOpen, setFormOpen]         = useState(false)
  const [editing, setEditing]           = useState<RouteRecord | undefined>()
  const [selected, setSelected]         = useState<RouteRecord | undefined>()

  const listParams = { status: statusFilter || undefined, page, size: PAGE_SIZE }

  const { data, isLoading } = useQuery({
    queryKey: ['routes', listParams],
    queryFn:  () => routesApi.list(listParams),
    enabled:  view === 'list',
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

  function openCreate() { setEditing(undefined); setSelected(undefined); setFormOpen(true) }
  function openEdit(r: RouteRecord) { setEditing(r); setSelected(undefined); setFormOpen(true) }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Routes & Dispatch</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {view === 'board' ? 'Daily dispatch board' : `${total} route${total !== 1 ? 's' : ''} total`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setView('board')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                view === 'board' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>
              <LayoutGrid size={13} /> Board
            </button>
            <button
              onClick={() => setView('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                view === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>
              <LayoutList size={13} /> List
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

      {/* Board view */}
      {view === 'board' && (
        <BoardView
          boardDate={boardDate}
          onDateChange={setBoardDate}
          canEdit={canEdit}
          onSelectRoute={r => { setSelected(r); setFormOpen(false) }}
          driverOptions={driverOptions}
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
            <SearchableDropdown
              value={statusFilter}
              onChange={v => { setStatusFilter(v); setPage(0) }}
              options={STATUS_OPTIONS}
              placeholder="All Statuses"
              className="w-44"
            />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: 'var(--color-primary)' }}>
                  {['Date', 'Driver', 'Truck #', '# Stops', 'Status', ''].map(h => (
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
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-14 text-center">
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
        </>
      )}

      {formOpen && (
        <RouteFormPanel
          open={formOpen}
          onClose={() => { setFormOpen(false); setEditing(undefined) }}
          route={editing}
          driverOptions={driverOptions}
        />
      )}

      {selected && !formOpen && (
        <RouteDrawer
          route={selected}
          onClose={() => setSelected(undefined)}
          onEdit={() => openEdit(selected)}
          canEdit={canEdit}
        />
      )}
    </div>
  )
}
