import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Plus, Package, ChevronRight, CheckCircle2, XCircle, Warehouse } from 'lucide-react'
import toast from 'react-hot-toast'
import { finishedQcApi } from '@/api/finishedQc'
import type { FinishedProductBatch, FinishedProductBatchPayload, FinishedProductResultPayload, FinishedProductStatus } from '@/api/finishedQc'
import { productsApi } from '@/api/products'
import { warehousesApi } from '@/api/warehouses'
import { SearchableDropdown } from '@/components/ui/SearchableDropdown'

const STATUS_TABS: { label: string; value: FinishedProductStatus | 'ALL' }[] = [
  { label: 'All',         value: 'ALL' },
  { label: 'Pending',     value: 'PENDING' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Passed',      value: 'PASSED' },
  { label: 'Failed',      value: 'FAILED' },
]

const APPEARANCE_OPTIONS = ['Clear', 'Hazy', 'Cloudy', 'Turbid', 'Precipitate', 'Other']
const ODOR_OPTIONS       = ['Normal', 'Off', 'Strong', 'None']
const UNIT_OPTIONS       = ['Gallon', 'Drum (55 gal)', 'Tote (275 gal)', 'Barrel (42 gal)', 'Liter', 'Pound', 'Kilogram']

function statusBadge(status: FinishedProductStatus) {
  const map: Record<FinishedProductStatus, { label: string; color: string }> = {
    PENDING:     { label: 'Pending',     color: 'bg-gray-100 text-gray-600' },
    IN_PROGRESS: { label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
    PASSED:      { label: 'Passed',      color: 'bg-green-100 text-green-700' },
    FAILED:      { label: 'Failed',      color: 'bg-red-100 text-red-700' },
  }
  const { label, color } = map[status]
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>{label}</span>
}

// ── Move to Warehouse Panel ───────────────────────────────────────────────────

function MoveToWarehousePanel({ batch, onClose, onMoved }: {
  batch: FinishedProductBatch; onClose: () => void; onMoved: () => void
}) {
  const [warehouseId, setWarehouseId] = useState('')

  const { data: warehouseData } = useQuery({
    queryKey: ['warehouses-active'],
    queryFn:  () => warehousesApi.listActive(),
  })
  const warehouses = warehouseData?.data?.data ?? []

  const mutation = useMutation({
    mutationFn: () => finishedQcApi.moveToWarehouse(batch.id, warehouseId),
    onSuccess:  () => { toast.success(`${batch.quantity} ${batch.unit} of ${batch.productName} added to warehouse`); onMoved() },
    onError:    () => toast.error('Failed to move to warehouse'),
  })

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-[400px] p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary)' }}>
            <Warehouse size={16} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Move to Warehouse</h3>
            <p className="text-xs text-gray-500">{batch.batchNumber} — {batch.quantity} {batch.unit} of {batch.productName}</p>
          </div>
          <button onClick={onClose} className="ml-auto text-gray-400 hover:text-gray-600"><X size={16} /></button>
        </div>

        <div className="mb-5">
          <label className="block text-xs font-medium text-gray-700 mb-1">Select Warehouse *</label>
          <SearchableDropdown
            value={warehouseId || null}
            onChange={v => setWarehouseId(v ?? '')}
            placeholder="Select warehouse…"
            showClear={false}
            options={warehouses.map(w => ({ value: w.id, label: w.location ? `${w.name} — ${w.location}` : w.name }))}
          />
        </div>

        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 h-10 text-sm font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={() => mutation.mutate()} disabled={!warehouseId || mutation.isPending}
            className="flex-1 h-10 text-sm font-semibold rounded-lg text-white disabled:opacity-60 transition-colors"
            style={{ backgroundColor: 'var(--color-primary)' }}>
            {mutation.isPending ? 'Moving…' : 'Move to Warehouse'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Create Panel ──────────────────────────────────────────────────────────────

function CreatePanel({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<FinishedProductBatchPayload>({
    productId: '', quantity: 0, unit: 'Gallon',
    blendDate: new Date().toISOString().split('T')[0],
  })

  const { data: productData } = useQuery({
    queryKey: ['products-all'],
    queryFn:  () => productsApi.list({ size: 200, isActive: true }),
  })
  const products = productData?.data?.data?.content ?? []

  const mutation = useMutation({
    mutationFn: (data: FinishedProductBatchPayload) => finishedQcApi.create(data),
    onSuccess:  () => { toast.success('Batch logged'); onSaved() },
    onError:    () => toast.error('Failed to create batch'),
  })

  const set = (k: keyof FinishedProductBatchPayload, v: string | number) =>
    setForm(f => ({ ...f, [k]: v }))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.productId || !form.quantity || !form.unit || !form.blendDate)
      return toast.error('Fill all required fields')
    mutation.mutate(form)
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-black/20" />
      <div className="relative w-[440px] h-full bg-white shadow-xl flex flex-col">
        <div className="flex items-center gap-3 px-5 py-4 shrink-0" style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary)' }}>
            <Package size={14} className="text-white" />
          </div>
          <h2 className="text-sm font-semibold text-gray-900">Log Finished Product Batch</h2>
          <button onClick={onClose} className="ml-auto text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        <form onSubmit={submit} className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Product *</label>
            <SearchableDropdown
              value={form.productId || null}
              onChange={v => set('productId', v ?? '')}
              placeholder="Select product…"
              showClear={false}
              options={products.map(p => ({ value: p.id, label: p.productCode ? `${p.name} (${p.productCode})` : p.name }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Quantity *</label>
              <input type="number" min="0" step="0.01" value={form.quantity || ''}
                onChange={e => set('quantity', parseFloat(e.target.value) || 0)}
                className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Unit *</label>
              <SearchableDropdown
                value={form.unit}
                onChange={v => set('unit', v ?? 'Gallon')}
                showClear={false}
                options={UNIT_OPTIONS.map(u => ({ value: u, label: u }))}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Blend Date *</label>
            <input type="date" value={form.blendDate} onChange={e => set('blendDate', e.target.value)}
              className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]" />
          </div>
        </form>

        <div className="px-5 py-4 flex gap-3 shrink-0" style={{ borderTop: '1px solid rgba(0,0,0,0.07)' }}>
          <button type="button" onClick={onClose}
            className="flex-1 h-10 text-sm font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={submit} disabled={mutation.isPending}
            className="flex-1 h-10 text-sm font-semibold rounded-lg text-white disabled:opacity-60 transition-colors"
            style={{ backgroundColor: 'var(--color-primary)' }}>
            {mutation.isPending ? 'Saving…' : 'Log Batch'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Results Panel ─────────────────────────────────────────────────────────────

function ResultsPanel({ batch, onClose, onSaved }: {
  batch: FinishedProductBatch; onClose: () => void; onSaved: () => void
}) {
  const [form, setForm] = useState<FinishedProductResultPayload>({
    appearance: '', colorOk: undefined, odor: '', ph: undefined,
    specificGravity: undefined, notes: '', result: 'PASSED',
  })

  const mutation = useMutation({
    mutationFn: (data: FinishedProductResultPayload) => finishedQcApi.enterResults(batch.id, data),
    onSuccess:  () => { toast.success('Results saved'); onSaved() },
    onError:    () => toast.error('Failed to save results'),
  })

  const set = (k: keyof FinishedProductResultPayload, v: string | number | boolean | undefined) =>
    setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <div className="fixed inset-0 bg-black/20" />
      <div className="relative w-[440px] h-full bg-white shadow-xl flex flex-col">
        <div className="flex items-center gap-3 px-5 py-4 shrink-0" style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary)' }}>
            <Package size={14} className="text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Enter QC Results</h2>
            <p className="text-xs text-gray-500">{batch.batchNumber} — {batch.productName}</p>
          </div>
          <button onClick={onClose} className="ml-auto text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Appearance</label>
            <SearchableDropdown
              value={form.appearance || null}
              onChange={v => set('appearance', v ?? '')}
              placeholder="Select…"
              showClear={false}
              options={APPEARANCE_OPTIONS.map(o => ({ value: o, label: o }))}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Color Matches Spec?</label>
            <div className="flex gap-3">
              {[{ label: 'Yes', val: true }, { label: 'No', val: false }].map(opt => (
                <button key={opt.label} type="button" onClick={() => set('colorOk', opt.val)}
                  className={`flex-1 h-9 text-sm rounded-lg border font-medium transition-colors ${
                    form.colorOk === opt.val ? 'text-white border-transparent' : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                  style={form.colorOk === opt.val ? { backgroundColor: 'var(--color-primary)' } : {}}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Odor</label>
            <SearchableDropdown
              value={form.odor || null}
              onChange={v => set('odor', v ?? '')}
              placeholder="Select…"
              showClear={false}
              options={ODOR_OPTIONS.map(o => ({ value: o, label: o }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">pH</label>
              <input type="number" step="0.01" min="0" max="14"
                value={form.ph ?? ''} onChange={e => set('ph', e.target.value ? parseFloat(e.target.value) : undefined)}
                className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]"
                placeholder="0–14" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Specific Gravity</label>
              <input type="number" step="0.0001" min="0"
                value={form.specificGravity ?? ''} onChange={e => set('specificGravity', e.target.value ? parseFloat(e.target.value) : undefined)}
                className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]"
                placeholder="e.g. 1.0250" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
            <textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)} rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]"
              placeholder="Any observations…" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">QC Result *</label>
            <div className="flex gap-3">
              <button type="button" onClick={() => set('result', 'PASSED')}
                className={`flex-1 h-10 text-sm rounded-lg border font-semibold flex items-center justify-center gap-2 transition-colors ${
                  form.result === 'PASSED' ? 'bg-green-600 border-green-600 text-white' : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}>
                <CheckCircle2 size={15} /> Pass
              </button>
              <button type="button" onClick={() => set('result', 'FAILED')}
                className={`flex-1 h-10 text-sm rounded-lg border font-semibold flex items-center justify-center gap-2 transition-colors ${
                  form.result === 'FAILED' ? 'bg-red-600 border-red-600 text-white' : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}>
                <XCircle size={15} /> Fail
              </button>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 flex gap-3 shrink-0" style={{ borderTop: '1px solid rgba(0,0,0,0.07)' }}>
          <button type="button" onClick={onClose}
            className="flex-1 h-10 text-sm font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={() => mutation.mutate(form)} disabled={mutation.isPending}
            className="flex-1 h-10 text-sm font-semibold rounded-lg text-white disabled:opacity-60 transition-colors"
            style={{ backgroundColor: 'var(--color-primary)' }}>
            {mutation.isPending ? 'Saving…' : 'Save Results'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Batch Drawer ──────────────────────────────────────────────────────────────

function BatchDrawer({ id, onClose }: { id: string; onClose: () => void }) {
  const qc = useQueryClient()
  const [showResults, setShowResults]     = useState(false)
  const [showWarehouse, setShowWarehouse] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['finished-qc', id],
    queryFn:  () => finishedQcApi.get(id),
  })

  const startMutation = useMutation({
    mutationFn: () => finishedQcApi.startTesting(id),
    onSuccess:  () => { toast.success('Testing started'); qc.invalidateQueries({ queryKey: ['finished-qc'] }) },
    onError:    () => toast.error('Failed to start testing'),
  })

  const batch = data?.data?.data
  if (isLoading || !batch) return null

  const field = (label: string, value: React.ReactNode) => (
    <div>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-gray-900">{value ?? '—'}</p>
    </div>
  )

  return (
    <>
      <div className="fixed inset-0 z-40 flex justify-end">
        <div className="fixed inset-0 bg-black/20" />
        <div className="relative w-[600px] h-full bg-white shadow-xl flex flex-col">
          {/* Header */}
          <div className="flex items-center gap-3 px-6 py-4 shrink-0" style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary)' }}>
              <Package size={14} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">{batch.batchNumber}</h2>
              <p className="text-xs text-gray-500">{batch.productName}</p>
            </div>
            <div className="ml-auto flex items-center gap-3">
              {statusBadge(batch.status)}
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Batch Info</h3>
              <div className="grid grid-cols-2 gap-4">
                {field('Product', batch.productName)}
                {field('Quantity', `${batch.quantity} ${batch.unit}`)}
                {field('Blend Date', batch.blendDate)}
              </div>
            </div>

            {(batch.status === 'PASSED' || batch.status === 'FAILED') && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">QC Test Results</h3>
                <div className="grid grid-cols-2 gap-4">
                  {field('Appearance', batch.appearance)}
                  {field('Color OK', batch.colorOk === true ? 'Yes' : batch.colorOk === false ? 'No' : null)}
                  {field('Odor', batch.odor)}
                  {field('pH', batch.ph)}
                  {field('Specific Gravity', batch.specificGravity)}
                  {batch.notes && <div className="col-span-2">{field('Notes', batch.notes)}</div>}
                  {field('Tested By', batch.testedByName)}
                  {field('Tested At', batch.testedAt ? new Date(batch.testedAt).toLocaleString() : null)}
                </div>
              </div>
            )}

            {batch.status === 'IN_PROGRESS' && (
              <p className="text-sm text-gray-500">Testing in progress — results not entered yet.</p>
            )}

            {/* Banners */}
            {batch.status === 'PASSED' && !batch.movedToWarehouse && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-green-50 border border-green-100">
                <CheckCircle2 size={18} className="text-green-600 shrink-0" />
                <p className="text-sm font-medium text-green-800">Batch passed QC — ready to move to warehouse.</p>
              </div>
            )}
            {batch.status === 'PASSED' && batch.movedToWarehouse && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50 border border-blue-100">
                <Warehouse size={18} className="text-blue-600 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Moved to {batch.warehouseName ?? 'warehouse'}</p>
                  {batch.movedAt && <p className="text-xs text-blue-600 mt-0.5">{new Date(batch.movedAt).toLocaleString()}</p>}
                </div>
              </div>
            )}
            {batch.status === 'FAILED' && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-100">
                <XCircle size={18} className="text-red-600 shrink-0" />
                <p className="text-sm font-medium text-red-800">Batch failed QC. Do not use — discard this batch.</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 flex gap-3 shrink-0" style={{ borderTop: '1px solid rgba(0,0,0,0.07)' }}>
            {batch.status === 'PENDING' && (
              <button onClick={() => startMutation.mutate()} disabled={startMutation.isPending}
                className="flex-1 h-10 text-sm font-semibold rounded-lg text-white disabled:opacity-60"
                style={{ backgroundColor: 'var(--color-primary)' }}>
                {startMutation.isPending ? 'Starting…' : 'Start Testing'}
              </button>
            )}
            {batch.status === 'IN_PROGRESS' && (
              <button onClick={() => setShowResults(true)}
                className="flex-1 h-10 text-sm font-semibold rounded-lg text-white"
                style={{ backgroundColor: 'var(--color-primary)' }}>
                Enter Results
              </button>
            )}
            {batch.status === 'PASSED' && !batch.movedToWarehouse && (
              <button onClick={() => setShowWarehouse(true)}
                className="flex-1 h-10 text-sm font-semibold rounded-lg text-white flex items-center justify-center gap-2"
                style={{ backgroundColor: 'var(--color-primary)' }}>
                <Warehouse size={15} /> Move to Warehouse
              </button>
            )}
          </div>
        </div>
      </div>

      {showResults && (
        <ResultsPanel batch={batch} onClose={() => setShowResults(false)}
          onSaved={() => { setShowResults(false); qc.invalidateQueries({ queryKey: ['finished-qc'] }) }} />
      )}
      {showWarehouse && (
        <MoveToWarehousePanel batch={batch} onClose={() => setShowWarehouse(false)}
          onMoved={() => { setShowWarehouse(false); qc.invalidateQueries({ queryKey: ['finished-qc'] }) }} />
      )}
    </>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function FinishedProductQcPage() {
  const [activeTab, setActiveTab] = useState<FinishedProductStatus | 'ALL'>('ALL')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [page, setPage] = useState(0)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['finished-qc', activeTab, page],
    queryFn:  () => finishedQcApi.list({ status: activeTab === 'ALL' ? undefined : activeTab, page, size: 20 }),
  })

  const batches = data?.data?.data?.content ?? []
  const total   = data?.data?.data?.totalElements ?? 0
  const pages   = data?.data?.data?.totalPages ?? 1

  const refresh = () => qc.invalidateQueries({ queryKey: ['finished-qc'] })

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="bg-white px-6 py-4 flex items-center justify-between shrink-0" style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Finished Product QC</h1>
          <p className="text-xs text-gray-500 mt-0.5">{total} batch{total !== 1 ? 'es' : ''}</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 h-9 px-4 text-sm font-semibold rounded-lg text-white"
          style={{ backgroundColor: 'var(--color-primary)' }}>
          <Plus size={15} /> Log Batch
        </button>
      </div>

      <div className="bg-white px-6 shrink-0" style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
        <div className="flex gap-1">
          {STATUS_TABS.map(tab => (
            <button key={tab.value} onClick={() => { setActiveTab(tab.value); setPage(0) }}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.value
                  ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 py-4">
        <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: 'var(--color-primary)' }}>
                {['Batch #', 'Product', 'Quantity', 'Blend Date', 'Status', 'Warehouse', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-white">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-400">Loading…</td></tr>
              ) : batches.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-14 text-center">
                    <Package size={32} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-sm text-gray-500 font-medium">No batches found</p>
                    <p className="text-xs text-gray-400 mt-1">Log the first finished product batch to get started</p>
                  </td>
                </tr>
              ) : batches.map((b, i) => (
                <tr key={b.id} onClick={() => setSelectedId(b.id)}
                  className="cursor-pointer hover:bg-gray-50 transition-colors"
                  style={{ borderTop: i > 0 ? '1px solid rgba(0,0,0,0.05)' : undefined }}>
                  <td className="px-4 py-3 font-mono text-xs text-gray-700">{b.batchNumber}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{b.productName}</td>
                  <td className="px-4 py-3 text-gray-600">{b.quantity} {b.unit}</td>
                  <td className="px-4 py-3 text-gray-600">{b.blendDate}</td>
                  <td className="px-4 py-3">{statusBadge(b.status)}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {b.movedToWarehouse
                      ? <span className="flex items-center gap-1 text-blue-600 text-xs font-medium"><Warehouse size={12} />{b.warehouseName ?? 'Moved'}</span>
                      : <span className="text-gray-400 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-400"><ChevronRight size={16} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
            <span>Page {page + 1} of {pages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => p - 1)} disabled={page === 0}
                className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Prev</button>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= pages - 1}
                className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Next</button>
            </div>
          </div>
        )}
      </div>

      {selectedId && (
        <BatchDrawer id={selectedId} onClose={() => { setSelectedId(null); refresh() }} />
      )}
      {showCreate && (
        <CreatePanel onClose={() => setShowCreate(false)} onSaved={() => { setShowCreate(false); refresh() }} />
      )}
    </div>
  )
}
