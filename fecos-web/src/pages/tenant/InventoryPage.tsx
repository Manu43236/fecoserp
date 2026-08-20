import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import {
  Plus, X, Warehouse, BarChart2, ArrowLeftRight, ChevronRight, Search,
} from 'lucide-react'
import type React from 'react'
import { warehousesApi, type WarehouseRecord, type WarehousePayload } from '@/api/warehouses'
import { inventoryApi, type StockRecord, type TransactionRecord, type TransactionPayload, type TransactionType } from '@/api/inventory'
import { productsApi, type ProductRecord } from '@/api/products'
import { productUnitsApi, type ProductUnitRecord } from '@/api/productUnits'
import { SearchableDropdown, type DropdownOption } from '@/components/ui/SearchableDropdown'
import { useAuthStore } from '@/store/authStore'

const PAGE_SIZE = 20

// ── Section nav ───────────────────────────────────────────────────────────────
type SectionId = 'warehouses' | 'stock' | 'transactions'

const SECTIONS: { id: SectionId; label: string; description: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { id: 'warehouses',   label: 'Warehouses',   description: 'Manage physical storage locations', icon: Warehouse      },
  { id: 'stock',        label: 'Stock',         description: 'Current inventory by location',     icon: BarChart2      },
  { id: 'transactions', label: 'Transactions',  description: 'Movement ledger — receipts, issues, adjustments', icon: ArrowLeftRight },
]

// ── Shared ─────────────────────────────────────────────────────────────────────
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

function TypeBadge({ type }: { type: TransactionType }) {
  const map: Record<TransactionType, { label: string; cls: string }> = {
    RECEIPT:    { label: 'Receipt',    cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
    ISSUE:      { label: 'Issue',      cls: 'bg-red-50 text-red-700 ring-red-200'             },
    ADJUSTMENT: { label: 'Adjustment', cls: 'bg-amber-50 text-amber-700 ring-amber-200'       },
  }
  const { label, cls } = map[type]
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ${cls}`}>
      {label}
    </span>
  )
}

// ── Warehouse form panel ───────────────────────────────────────────────────────
const warehouseSchema = z.object({
  name:     z.string().min(1, 'Required').max(150),
  location: z.string().max(255).optional().or(z.literal('')),
  isActive: z.boolean(),
})
type WarehouseFormData = z.infer<typeof warehouseSchema>

function WarehouseFormPanel({ open, onClose, warehouse }: {
  open: boolean; onClose: () => void; warehouse?: WarehouseRecord
}) {
  const qc = useQueryClient()
  const isEdit = !!warehouse

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<WarehouseFormData>({
    resolver: zodResolver(warehouseSchema),
    defaultValues: {
      name:     warehouse?.name     ?? '',
      location: warehouse?.location ?? '',
      isActive: warehouse?.isActive ?? true,
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        name:     warehouse?.name     ?? '',
        location: warehouse?.location ?? '',
        isActive: warehouse?.isActive ?? true,
      })
    }
  }, [open, warehouse])

  const mutation = useMutation({
    mutationFn: (data: WarehousePayload) =>
      isEdit ? warehousesApi.update(warehouse!.id, data) : warehousesApi.create(data),
    onSuccess: () => {
      toast.success(isEdit ? 'Warehouse updated' : 'Warehouse created')
      qc.invalidateQueries({ queryKey: ['warehouses'] })
      qc.invalidateQueries({ queryKey: ['warehouses-active'] })
      onClose(); reset()
    },
    onError: (e: unknown) =>
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed'),
  })

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative bg-white w-[440px] h-full shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary)' }}>
              <Warehouse size={14} className="text-white" />
            </div>
            <h2 className="text-sm font-semibold text-gray-900">{isEdit ? 'Edit Warehouse' : 'New Warehouse'}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit(d => mutation.mutate({ name: d.name, location: d.location || undefined, isActive: d.isActive }))} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Warehouse Name *</label>
              <input
                {...register('name')}
                placeholder="e.g. Main Yard – Midland"
                className="w-full h-10 px-3 text-sm rounded-lg border border-gray-200 outline-none transition focus:ring-2 focus:ring-red-100"
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Location <span className="text-gray-400 font-normal normal-case">(optional)</span>
              </label>
              <input
                {...register('location')}
                placeholder="e.g. 1234 Industrial Blvd, Midland TX"
                className="w-full h-10 px-3 text-sm rounded-lg border border-gray-200 outline-none transition focus:ring-2 focus:ring-red-100"
              />
            </div>

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
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${watch('isActive') ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </div>
                    <span className="text-sm text-gray-700">{watch('isActive') ? 'Active' : 'Inactive'}</span>
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
              {mutation.isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Warehouse'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Warehouse detail drawer ───────────────────────────────────────────────────
function WarehouseDrawer({ warehouse, onClose, onEdit }: {
  warehouse: WarehouseRecord; onClose: () => void; onEdit: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative bg-white w-[400px] h-full shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
          <p className="text-sm font-semibold text-gray-900">Warehouse Details</p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 text-white"
              style={{ backgroundColor: 'var(--color-primary)' }}>
              <Warehouse size={22} />
            </div>
            <div className="min-w-0 pt-1">
              <p className="font-semibold text-gray-900 text-base">{warehouse.name}</p>
              <div className="mt-1.5"><StatusBadge active={warehouse.isActive} /></div>
            </div>
          </div>
          {warehouse.location && (
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wide font-semibold mb-1">Location</p>
              <p className="text-sm text-gray-700">{warehouse.location}</p>
            </div>
          )}
        </div>
        <div className="px-5 py-4 shrink-0" style={{ borderTop: '1px solid rgba(0,0,0,0.07)' }}>
          <button onClick={onEdit}
            className="w-full h-10 text-sm font-semibold text-white rounded-lg transition"
            style={{ backgroundColor: 'var(--color-primary)' }}>
            Edit Warehouse
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Warehouses section ────────────────────────────────────────────────────────
function WarehousesSection({ canEdit }: { canEdit: boolean }) {
  const [search, setSearch] = useState('')
  const [page, setPage]     = useState(0)
  const [panelOpen, setPanelOpen] = useState(false)
  const [editing, setEditing]     = useState<WarehouseRecord | undefined>()
  const [viewing, setViewing]     = useState<WarehouseRecord | undefined>()

  const { data } = useQuery({
    queryKey: ['warehouses', search, page],
    queryFn: () => warehousesApi.list({ search: search || undefined, page, size: PAGE_SIZE }).then(r => r.data.data),
  })

  const warehouses  = data?.content      ?? []
  const total       = data?.totalElements ?? 0
  const totalPages  = data?.totalPages    ?? 0

  function openEdit(w: WarehouseRecord) { setEditing(w); setViewing(undefined); setPanelOpen(true) }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative w-56">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(0) }}
              placeholder="Search warehouses…"
              className="w-full h-9 pl-9 pr-3 text-sm rounded-lg border border-gray-200 bg-white outline-none focus:ring-2 transition" />
          </div>
        </div>
        {canEdit && (
          <button onClick={() => { setEditing(undefined); setPanelOpen(true) }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg transition"
            style={{ backgroundColor: 'var(--color-primary)' }}>
            <Plus size={15} /> New Warehouse
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: 'var(--color-primary)' }}>
              {['Warehouse', 'Location', 'Status', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-white/90 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {warehouses.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-14 text-center text-gray-400 text-sm">
                No warehouses found. {canEdit && 'Add your first warehouse to get started.'}
              </td></tr>
            ) : warehouses.map((w: WarehouseRecord) => (
              <tr key={w.id} onClick={() => setViewing(w)} className="cursor-pointer hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--color-primary)' }}>
                      <Warehouse size={13} className="text-white" />
                    </div>
                    <span className="font-medium text-gray-900">{w.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500">{w.location ?? <span className="text-gray-300">—</span>}</td>
                <td className="px-4 py-3"><StatusBadge active={w.isActive} /></td>
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

      <WarehouseFormPanel open={panelOpen} onClose={() => { setPanelOpen(false); setEditing(undefined) }} warehouse={editing} />
      {viewing && !panelOpen && (
        <WarehouseDrawer warehouse={viewing} onClose={() => setViewing(undefined)} onEdit={() => openEdit(viewing)} />
      )}
    </div>
  )
}

// ── Stock section ─────────────────────────────────────────────────────────────
function StockSection() {
  const [warehouseFilter, setWarehouseFilter] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses-active'],
    queryFn: () => warehousesApi.listActive().then(r => r.data.data ?? []),
  })

  const { data: stock = [] } = useQuery({
    queryKey: ['stock', warehouseFilter],
    queryFn: () => inventoryApi.stock(warehouseFilter ? { warehouseId: warehouseFilter } : undefined)
      .then(r => r.data.data ?? []),
  })

  const warehouseOptions: DropdownOption[] = (warehouses as WarehouseRecord[])
    .map(w => ({ value: w.id, label: w.name }))

  const filtered = (stock as StockRecord[]).filter(s =>
    !search || s.productName.toLowerCase().includes(search.toLowerCase()) ||
    s.warehouseName.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative w-56">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search product or warehouse…"
            className="w-full h-9 pl-9 pr-3 text-sm rounded-lg border border-gray-200 bg-white outline-none focus:ring-2 transition" />
        </div>
        <div className="w-48">
          <SearchableDropdown options={warehouseOptions} value={warehouseFilter} onChange={v => setWarehouseFilter(v)} placeholder="All Warehouses" showClear />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: 'var(--color-primary)' }}>
              {['Product', 'Warehouse', 'Unit', 'Qty on Hand'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-white/90 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-14 text-center text-gray-400 text-sm">
                {stock.length === 0 ? 'No stock on hand. Record a receipt transaction to get started.' : 'No results match your search.'}
              </td></tr>
            ) : filtered.map(s => (
              <tr key={`${s.warehouseId}-${s.productId}`} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900">{s.productName}</td>
                <td className="px-4 py-3 text-gray-600">{s.warehouseName}</td>
                <td className="px-4 py-3 text-gray-500">{s.unit}</td>
                <td className="px-4 py-3">
                  <span className="font-mono text-sm font-semibold"
                    style={{ color: s.currentQty < 0 ? '#C62828' : s.currentQty === 0 ? '#9CA3AF' : '#111827' }}>
                    {s.currentQty.toFixed(2)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Record transaction panel ──────────────────────────────────────────────────
const txSchema = z.object({
  warehouseId:     z.string().min(1, 'Required'),
  productId:       z.string().min(1, 'Required'),
  type:            z.enum(['RECEIPT', 'ISSUE', 'ADJUSTMENT']),
  quantity:        z.string().min(1, 'Required'),
  unit:            z.string().min(1, 'Required'),
  notes:           z.string().optional().or(z.literal('')),
  supplierName:    z.string().max(150).optional().or(z.literal('')),
  transactionDate: z.string().min(1, 'Required'),
})
type TxFormData = z.infer<typeof txSchema>

function TransactionFormPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient()

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<TxFormData>({
    resolver: zodResolver(txSchema),
    defaultValues: {
      type: 'RECEIPT',
      transactionDate: new Date().toISOString().slice(0, 10),
    },
  })

  const selectedWarehouse = watch('warehouseId')
  const selectedType      = watch('type')

  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses-active'],
    queryFn: () => warehousesApi.listActive().then(r => r.data.data ?? []),
  })

  const { data: products = [] } = useQuery({
    queryKey: ['products', '', null, null, 0],
    queryFn: () => productsApi.list({ size: 5000 }).then(r => r.data.data?.content ?? []),
  })

  const { data: warehouseStock = [] } = useQuery({
    queryKey: ['stock', selectedWarehouse],
    queryFn: () => inventoryApi.stock({ warehouseId: selectedWarehouse }).then(r => r.data.data ?? []),
    enabled: selectedType === 'ISSUE' && !!selectedWarehouse,
  })

  const { data: units = [] } = useQuery({
    queryKey: ['product-units'],
    queryFn: () => productUnitsApi.list().then(r => r.data.data ?? []),
  })

  const mutation = useMutation({
    mutationFn: (data: TransactionPayload) => inventoryApi.record(data),
    onSuccess: () => {
      toast.success('Transaction recorded')
      qc.invalidateQueries({ queryKey: ['transactions'] })
      qc.invalidateQueries({ queryKey: ['stock'] })
      onClose(); reset()
    },
    onError: (e: unknown) =>
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed'),
  })

  if (!open) return null

  const warehouseOptions: DropdownOption[] = (warehouses as WarehouseRecord[]).map(w => ({ value: w.id, label: w.name }))

  const productOptions: DropdownOption[] = selectedType === 'ISSUE'
    ? (warehouseStock as StockRecord[])
        .filter(s => s.currentQty > 0)
        .map(s => ({ value: s.productId, label: `${s.productName} (${s.currentQty.toFixed(2)} ${s.unit})` }))
    : (products as ProductRecord[]).map(p => ({ value: p.id, label: p.name }))
  const unitOptions: DropdownOption[]      = (units as ProductUnitRecord[]).filter(u => u.isActive).map(u => ({ value: u.name, label: u.name }))
  const typeOptions: DropdownOption[]      = [
    { value: 'RECEIPT',    label: 'Receipt — stock in'           },
    { value: 'ISSUE',      label: 'Issue — stock out'            },
    { value: 'ADJUSTMENT', label: 'Adjustment — correction'      },
  ]

  function onSubmit(data: TxFormData) {
    mutation.mutate({
      warehouseId:     data.warehouseId,
      productId:       data.productId,
      type:            data.type as TransactionType,
      quantity:        parseFloat(data.quantity),
      unit:            data.unit,
      notes:           data.notes        || undefined,
      supplierName:    data.supplierName || undefined,
      transactionDate: data.transactionDate,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative bg-white w-[440px] h-full shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary)' }}>
              <ArrowLeftRight size={14} className="text-white" />
            </div>
            <h2 className="text-sm font-semibold text-gray-900">Record Transaction</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Type *</label>
              <SearchableDropdown options={typeOptions} value={watch('type')} onChange={v => { setValue('type', (v ?? 'RECEIPT') as TxFormData['type']); setValue('productId', '') }} placeholder="Select type" showClear={false} />
              {errors.type && <p className="text-xs text-red-500">{errors.type.message}</p>}
            </div>

            <div className="border-t border-gray-100" />

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Warehouse *</label>
              <SearchableDropdown options={warehouseOptions} value={watch('warehouseId')} onChange={v => setValue('warehouseId', v ?? '')} placeholder="Select warehouse" showClear={false} />
              {errors.warehouseId && <p className="text-xs text-red-500">{errors.warehouseId.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Product *</label>
              <SearchableDropdown
                options={productOptions}
                value={watch('productId')}
                onChange={v => setValue('productId', v ?? '')}
                placeholder={selectedType === 'ISSUE' && !selectedWarehouse ? 'Select warehouse first' : 'Select product'}
                showClear={false}
              />
              {selectedType === 'ISSUE' && selectedWarehouse && productOptions.length === 0 && (
                <p className="text-xs text-amber-600">No products in stock at this warehouse.</p>
              )}
              {errors.productId && <p className="text-xs text-red-500">{errors.productId.message}</p>}
            </div>

            <div className="border-t border-gray-100" />

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Quantity *</label>
                <input
                  {...register('quantity')}
                  type="number"
                  step="0.0001"
                  min="0.0001"
                  placeholder="0.00"
                  className="w-full h-10 px-3 text-sm rounded-lg border border-gray-200 outline-none transition focus:ring-2 focus:ring-red-100 font-mono"
                />
                {errors.quantity && <p className="text-xs text-red-500">{errors.quantity.message}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Unit *</label>
                <SearchableDropdown options={unitOptions} value={watch('unit')} onChange={v => setValue('unit', v ?? '')} placeholder="Select unit" showClear={false} />
                {errors.unit && <p className="text-xs text-red-500">{errors.unit.message}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Date *</label>
              <input
                {...register('transactionDate')}
                type="date"
                className="w-full h-10 px-3 text-sm rounded-lg border border-gray-200 outline-none transition focus:ring-2 focus:ring-red-100"
              />
              {errors.transactionDate && <p className="text-xs text-red-500">{errors.transactionDate.message}</p>}
            </div>

            {watch('type') === 'RECEIPT' && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Supplier <span className="text-gray-400 font-normal normal-case">(optional)</span>
                </label>
                <input
                  {...register('supplierName')}
                  placeholder="e.g. ChemTreat Inc."
                  className="w-full h-10 px-3 text-sm rounded-lg border border-gray-200 outline-none transition focus:ring-2 focus:ring-red-100"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Notes <span className="text-gray-400 font-normal normal-case">(optional)</span>
              </label>
              <textarea
                {...register('notes')}
                rows={3}
                placeholder="PO reference, reason for adjustment…"
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 outline-none transition focus:ring-2 focus:ring-red-100 resize-none"
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
              {mutation.isPending ? 'Saving…' : 'Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Transactions section ──────────────────────────────────────────────────────
function fmtDateTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function TransactionsSection({ canEdit }: { canEdit: boolean }) {
  const [warehouseFilter, setWarehouseFilter] = useState<string | null>(null)
  const [typeFilter, setTypeFilter]           = useState<string | null>(null)
  const [search, setSearch]                   = useState('')
  const [page, setPage]                       = useState(0)
  const [panelOpen, setPanelOpen]             = useState(false)

  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses-active'],
    queryFn: () => warehousesApi.listActive().then(r => r.data.data ?? []),
  })

  const { data } = useQuery({
    queryKey: ['transactions', warehouseFilter, typeFilter, page],
    queryFn: () => inventoryApi.transactions({
      warehouseId: warehouseFilter || undefined,
      type:        typeFilter      || undefined,
      page, size: PAGE_SIZE,
    }).then(r => r.data.data),
  })

  const allTx    = data?.content      ?? []
  const total    = data?.totalElements ?? 0
  const totalPages = data?.totalPages  ?? 0

  const transactions = (allTx as TransactionRecord[]).filter(t =>
    !search ||
    t.productName.toLowerCase().includes(search.toLowerCase()) ||
    t.warehouseName.toLowerCase().includes(search.toLowerCase()) ||
    (t.createdByName ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (t.supplierName  ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const warehouseOptions: DropdownOption[] = (warehouses as WarehouseRecord[]).map(w => ({ value: w.id, label: w.name }))
  const typeOptions: DropdownOption[] = [
    { value: 'RECEIPT',    label: 'Receipt'    },
    { value: 'ISSUE',      label: 'Issue'      },
    { value: 'ADJUSTMENT', label: 'Adjustment' },
  ]

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search…"
              className="w-full h-9 pl-9 pr-3 text-sm rounded-lg border border-gray-200 bg-white outline-none focus:ring-2 transition" />
          </div>
          <div className="w-44">
            <SearchableDropdown options={warehouseOptions} value={warehouseFilter} onChange={v => { setWarehouseFilter(v); setPage(0) }} placeholder="All Warehouses" showClear />
          </div>
          <div className="w-36">
            <SearchableDropdown options={typeOptions} value={typeFilter} onChange={v => { setTypeFilter(v); setPage(0) }} placeholder="All Types" showClear />
          </div>
        </div>
        {canEdit && (
          <button onClick={() => setPanelOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg transition shrink-0"
            style={{ backgroundColor: 'var(--color-primary)' }}>
            <Plus size={15} /> Record Transaction
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: 'var(--color-primary)' }}>
              {['Date', 'Type', 'Product', 'Warehouse', 'Qty', 'Unit', 'Supplier', 'Recorded By', 'Notes'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-white/90 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {transactions.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-14 text-center text-gray-400 text-sm">
                No transactions yet. {canEdit && 'Record your first receipt to get started.'}
              </td></tr>
            ) : transactions.map(t => (
              <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap">
                  <p className="text-gray-800 text-xs font-medium">{t.transactionDate}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{fmtDateTime(t.createdAt)}</p>
                </td>
                <td className="px-4 py-3"><TypeBadge type={t.type} /></td>
                <td className="px-4 py-3 font-medium text-gray-900">{t.productName}</td>
                <td className="px-4 py-3 text-gray-600">{t.warehouseName}</td>
                <td className="px-4 py-3">
                  <span className="font-mono text-sm font-semibold" style={{ color: t.quantity < 0 ? '#C62828' : '#111827' }}>
                    {t.quantity > 0 ? '+' : ''}{Number(t.quantity).toFixed(2)}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{t.unit}</td>
                <td className="px-4 py-3 text-gray-600">{t.supplierName ?? <span className="text-gray-300">—</span>}</td>
                <td className="px-4 py-3">
                  {t.createdByName
                    ? <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full">{t.createdByName}</span>
                    : <span className="text-gray-300">—</span>}
                </td>
                <td className="px-4 py-3 text-gray-400 max-w-[160px] truncate">{t.notes ?? '—'}</td>
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

      <TransactionFormPanel open={panelOpen} onClose={() => setPanelOpen(false)} />
    </div>
  )
}

// ── Page shell ────────────────────────────────────────────────────────────────
export default function InventoryPage() {
  const { user } = useAuthStore()
  const canEdit  = user?.role === 'ADMIN'
  const [active, setActive] = useState<SectionId>('warehouses')

  return (
    <div className="flex flex-col h-full min-h-screen">
      <div className="bg-white border-b border-gray-200 px-6 flex items-center gap-1">
        {SECTIONS.map(s => {
          const Icon = s.icon
          const isActive = s.id === active
          return (
            <button key={s.id} onClick={() => setActive(s.id)}
              className="flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-all -mb-px"
              style={{
                borderBottomColor: isActive ? 'var(--color-primary)' : 'transparent',
                color: isActive ? 'var(--color-primary)' : '#6B7280',
              }}>
              <Icon size={14} />
              {s.label}
            </button>
          )
        })}
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {active === 'warehouses'   && <WarehousesSection  canEdit={canEdit} />}
        {active === 'stock'        && <StockSection />}
        {active === 'transactions' && <TransactionsSection canEdit={canEdit} />}
      </div>
    </div>
  )
}
