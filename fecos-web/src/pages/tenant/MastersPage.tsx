import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus, Trash2, Power, Settings2, FlaskConical, Gauge, ChevronRight } from 'lucide-react'
import type React from 'react'
import { pumpTypesApi, type PumpTypeRecord } from '@/api/pumpTypes'
import { productCategoriesApi, type ProductCategoryRecord } from '@/api/productCategories'
import { productUnitsApi, type ProductUnitRecord } from '@/api/productUnits'

// ── Sidebar menu config ───────────────────────────────────────────────────────
type SectionId = 'pump-types' | 'product-categories' | 'product-units'

const SECTIONS: { id: SectionId; label: string; description: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { id: 'pump-types',         label: 'Pump Types',         description: 'Artificial lift methods for wells',    icon: Settings2   },
  { id: 'product-categories', label: 'Product Categories', description: 'Chemical product categories',          icon: FlaskConical },
  { id: 'product-units',      label: 'Units of Measure',   description: 'Units for quantity and pricing',      icon: Gauge        },
]

// ── Page shell ────────────────────────────────────────────────────────────────
export default function MastersPage() {
  const [active, setActive] = useState<SectionId>('pump-types')
  const section = SECTIONS.find(s => s.id === active)!

  return (
    <div className="flex flex-col h-full min-h-screen">
      {/* Mobile tab bar */}
      <div className="md:hidden bg-white border-b border-gray-100 flex overflow-x-auto">
        {SECTIONS.map(s => {
          const Icon = s.icon
          const isActive = s.id === active
          return (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              className="flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 whitespace-nowrap transition-all shrink-0"
              style={{
                borderBottomColor: isActive ? 'var(--color-primary)' : 'transparent',
                color: isActive ? 'var(--color-primary)' : '#6B7280',
              }}
            >
              <Icon size={14} />
              {s.label}
            </button>
          )
        })}
      </div>

      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex md:flex-col w-[240px] shrink-0 bg-white border-r border-gray-100 py-4">
          <p className="px-5 text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-2">
            Configure
          </p>
          <nav className="space-y-0.5 px-2">
            {SECTIONS.map(s => {
              const Icon = s.icon
              const isActive = s.id === active
              return (
                <button
                  key={s.id}
                  onClick={() => setActive(s.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all"
                  style={isActive ? { backgroundColor: 'var(--color-primary)', color: '#fff' } : {}}
                >
                  <Icon size={15} className={isActive ? 'text-white' : 'text-gray-400'} />
                  <span className={`text-sm font-medium flex-1 ${isActive ? 'text-white' : 'text-gray-700'}`}>
                    {s.label}
                  </span>
                  {isActive && <ChevronRight size={13} className="text-white/70 shrink-0" />}
                </button>
              )
            })}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 p-4 md:p-8">
        <div className="max-w-2xl">
          <div className="mb-6">
            <h1 className="text-lg font-bold text-gray-900">{section.label}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{section.description}</p>
          </div>

          {active === 'pump-types' && (
            <MasterSection<PumpTypeRecord>
              queryKey="pump-types"
              fetchFn={() => pumpTypesApi.list().then(r => r.data.data ?? [])}
              createFn={(name) => pumpTypesApi.create(name)}
              toggleFn={(id) => pumpTypesApi.toggle(id)}
              deleteFn={(id) => pumpTypesApi.delete(id)}
            />
          )}
          {active === 'product-categories' && (
            <MasterSection<ProductCategoryRecord>
              queryKey="product-categories"
              fetchFn={() => productCategoriesApi.list().then(r => r.data.data ?? [])}
              createFn={(name) => productCategoriesApi.create(name)}
              toggleFn={(id) => productCategoriesApi.toggle(id)}
              deleteFn={(id) => productCategoriesApi.delete(id)}
            />
          )}
          {active === 'product-units' && (
            <MasterSection<ProductUnitRecord>
              queryKey="product-units"
              fetchFn={() => productUnitsApi.list().then(r => r.data.data ?? [])}
              createFn={(name) => productUnitsApi.create(name)}
              toggleFn={(id) => productUnitsApi.toggle(id)}
              deleteFn={(id) => productUnitsApi.delete(id)}
            />
          )}
        </div>
      </main>
      </div>
    </div>
  )
}

// ── Generic master section ────────────────────────────────────────────────────
type MasterRecord = { id: string; name: string; isSystem: boolean; isActive: boolean }

function MasterSection<T extends MasterRecord>({
  queryKey, fetchFn, createFn, toggleFn, deleteFn,
}: {
  queryKey: string
  fetchFn: () => Promise<T[]>
  createFn: (name: string) => Promise<unknown>
  toggleFn: (id: string) => Promise<unknown>
  deleteFn: (id: string) => Promise<unknown>
}) {
  const qc = useQueryClient()
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)

  const { data: items = [], isLoading } = useQuery({ queryKey: [queryKey], queryFn: fetchFn })

  const createMutation = useMutation({
    mutationFn: createFn,
    onSuccess: () => { toast.success('Added'); qc.invalidateQueries({ queryKey: [queryKey] }); setNewName(''); setAdding(false) },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed'),
  })

  const toggleMutation = useMutation({
    mutationFn: toggleFn,
    onSuccess: () => qc.invalidateQueries({ queryKey: [queryKey] }),
    onError: () => toast.error('Failed to update'),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteFn,
    onSuccess: () => { toast.success('Removed'); qc.invalidateQueries({ queryKey: [queryKey] }) },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Cannot delete standard items'),
  })

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
        <p className="text-sm text-gray-500">{items.length} item{items.length !== 1 ? 's' : ''}</p>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white rounded-lg transition"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          <Plus size={13} /> Add Custom
        </button>
      </div>

      {/* Add row */}
      {adding && (
        <div className="flex items-center gap-2 px-5 py-3 bg-gray-50 border-b border-gray-100">
          <input
            autoFocus
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') createMutation.mutate(newName.trim())
              if (e.key === 'Escape') { setAdding(false); setNewName('') }
            }}
            placeholder="Enter name…"
            className="flex-1 h-9 px-3 text-sm rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-red-100 bg-white"
          />
          <button
            onClick={() => createMutation.mutate(newName.trim())}
            disabled={createMutation.isPending || !newName.trim()}
            className="h-9 px-4 text-xs font-semibold text-white rounded-lg disabled:opacity-50 transition"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {createMutation.isPending ? 'Adding…' : 'Save'}
          </button>
          <button
            onClick={() => { setAdding(false); setNewName('') }}
            className="h-9 px-3 text-xs font-medium text-gray-600 rounded-lg border border-gray-200 hover:bg-gray-100 transition"
          >
            Cancel
          </button>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="px-5 py-10 text-center text-sm text-gray-400">Loading…</div>
      ) : items.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-gray-400">No items yet. Add a custom entry above.</div>
      ) : (
        <ul>
          {items.map((item: T, idx: number) => (
            <li
              key={item.id}
              className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors"
              style={idx > 0 ? { borderTop: '1px solid rgba(0,0,0,0.05)' } : {}}
            >
              <span className={`flex-1 text-sm ${item.isActive ? 'text-gray-800' : 'text-gray-400 line-through'}`}>
                {item.name}
              </span>
              {item.isSystem && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-gray-400 uppercase tracking-wide">
                  Standard
                </span>
              )}
              {!item.isSystem ? (
                <>
                  <button
                    onClick={() => toggleMutation.mutate(item.id)}
                    disabled={toggleMutation.isPending}
                    title={item.isActive ? 'Deactivate' : 'Activate'}
                    className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${
                      item.isActive ? 'text-emerald-500 hover:bg-emerald-50' : 'text-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    <Power size={13} />
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(item.id)}
                    disabled={deleteMutation.isPending}
                    className="w-7 h-7 rounded-md flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </>
              ) : <div className="w-[60px]" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
