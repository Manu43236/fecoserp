import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { Plus, Search, X, FlaskConical, ChevronRight } from 'lucide-react'
import { productsApi, type ProductRecord, type ProductPayload } from '@/api/products'
import { productCategoriesApi, type ProductCategoryRecord } from '@/api/productCategories'
import { productUnitsApi, type ProductUnitRecord } from '@/api/productUnits'
import { SearchableDropdown, type DropdownOption } from '@/components/ui/SearchableDropdown'
import { useAuthStore } from '@/store/authStore'

const PAGE_SIZE = 10

const schema = z.object({
  name:         z.string().min(1, 'Required').max(150),
  productCode:  z.string().max(50).optional().or(z.literal('')),
  category:     z.string().min(1, 'Category is required'),
  unit:         z.string().min(1, 'Unit is required'),
  description:  z.string().optional().or(z.literal('')),
  pricePerUnit: z.string().optional().or(z.literal('')),
  isActive:     z.boolean(),
})
type FormData = z.infer<typeof schema>

// ── Shared components ─────────────────────────────────────────────────────────
function ProductInitials({ name }: { name: string }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white"
      style={{ backgroundColor: 'var(--color-primary)' }}>
      {initials}
    </div>
  )
}

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

// ── Form Panel ────────────────────────────────────────────────────────────────
function ProductFormPanel({
  open, onClose, product, categories, units,
}: {
  open: boolean; onClose: () => void; product?: ProductRecord
  categories: ProductCategoryRecord[]; units: ProductUnitRecord[]
}) {
  const qc = useQueryClient()
  const isEdit = !!product

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name:         product?.name         ?? '',
      productCode:  product?.productCode  ?? '',
      category:     product?.category     ?? '',
      unit:         product?.unit         ?? '',
      description:  product?.description  ?? '',
      pricePerUnit: product?.pricePerUnit != null ? String(product.pricePerUnit) : '',
      isActive:     product?.isActive     ?? true,
    },
  })

  const mutation = useMutation({
    mutationFn: (data: ProductPayload) =>
      isEdit ? productsApi.update(product!.id, data) : productsApi.create(data),
    onSuccess: () => {
      toast.success(isEdit ? 'Product updated' : 'Product created')
      qc.invalidateQueries({ queryKey: ['products'] })
      onClose(); reset()
    },
    onError: (e: unknown) =>
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed'),
  })

  function onSubmit(data: FormData) {
    mutation.mutate({
      name:         data.name,
      productCode:  data.productCode  || undefined,
      category:     data.category,
      unit:         data.unit,
      description:  data.description  || undefined,
      pricePerUnit: data.pricePerUnit ? parseFloat(data.pricePerUnit) : null,
      isActive:     data.isActive,
    })
  }

  const categoryOptions: DropdownOption[] = categories
    .filter(c => c.isActive)
    .map(c => ({ value: c.name, label: c.name }))

  const unitOptions: DropdownOption[] = units
    .filter(u => u.isActive)
    .map(u => ({ value: u.name, label: u.name }))

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative bg-white w-[440px] h-full shadow-2xl flex flex-col">

        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary)' }}>
              <FlaskConical size={14} className="text-white" />
            </div>
            <h2 className="text-sm font-semibold text-gray-900">{isEdit ? 'Edit Product' : 'New Product'}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">

            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Product Name *</label>
              <input
                {...register('name')}
                placeholder="e.g. Corrosion Inhibitor CI-1000"
                className="w-full h-10 px-3 text-sm rounded-lg border border-gray-200 outline-none transition focus:ring-2 focus:ring-red-100"
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            {/* Code */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Product Code <span className="text-gray-400 font-normal normal-case">(optional)</span>
              </label>
              <input
                {...register('productCode')}
                placeholder="e.g. CI-1000"
                className="w-full h-10 px-3 text-sm rounded-lg border border-gray-200 outline-none transition focus:ring-2 focus:ring-red-100"
              />
            </div>

            <div className="border-t border-gray-100" />

            {/* Category + Unit grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Category *</label>
                <SearchableDropdown
                  options={categoryOptions}
                  value={watch('category')}
                  onChange={v => setValue('category', v ?? '')}
                  placeholder="Select"
                  showClear={false}
                />
                {errors.category && <p className="text-xs text-red-500">{errors.category.message}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Unit *</label>
                <SearchableDropdown
                  options={unitOptions}
                  value={watch('unit')}
                  onChange={v => setValue('unit', v ?? '')}
                  placeholder="Select"
                  showClear={false}
                />
                {errors.unit && <p className="text-xs text-red-500">{errors.unit.message}</p>}
              </div>
            </div>

            {/* Price */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Price per Unit <span className="text-gray-400 font-normal normal-case">(optional, $)</span>
              </label>
              <input
                {...register('pricePerUnit')}
                type="number"
                step="0.0001"
                min="0"
                placeholder="0.00"
                className="w-full h-10 px-3 text-sm rounded-lg border border-gray-200 outline-none transition focus:ring-2 focus:ring-red-100"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Description <span className="text-gray-400 font-normal normal-case">(optional)</span>
              </label>
              <textarea
                {...register('description')}
                rows={3}
                placeholder="Product notes or specs…"
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 outline-none transition focus:ring-2 focus:ring-red-100 resize-none"
              />
            </div>

            {/* Status — edit only */}
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
              {mutation.isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Detail Drawer ─────────────────────────────────────────────────────────────
function ProductDrawer({ product, onClose, onEdit }: { product: ProductRecord; onClose: () => void; onEdit: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative bg-white w-[400px] h-full shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
          <p className="text-sm font-semibold text-gray-900">Product Details</p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 text-white text-base font-bold"
              style={{ backgroundColor: 'var(--color-primary)' }}>
              {product.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 pt-1">
              <p className="font-semibold text-gray-900 text-base">{product.name}</p>
              {product.productCode && <p className="text-xs text-gray-500 mt-0.5 font-mono">{product.productCode}</p>}
              <div className="mt-1.5"><StatusBadge active={product.isActive} /></div>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { label: 'Category',       value: product.category },
              { label: 'Unit',           value: product.unit },
              { label: 'Price per Unit', value: product.pricePerUnit != null ? `$${Number(product.pricePerUnit).toFixed(2)}` : null },
            ].filter(r => r.value).map(({ label, value }) => (
              <div key={label}>
                <p className="text-[11px] text-gray-400 uppercase tracking-wide font-semibold">{label}</p>
                <p className="text-sm text-gray-800 mt-0.5">{value}</p>
              </div>
            ))}
          </div>

          {product.description && (
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wide font-semibold mb-1">Description</p>
              <p className="text-sm text-gray-700 leading-relaxed">{product.description}</p>
            </div>
          )}
        </div>

        <div className="px-5 py-4 shrink-0" style={{ borderTop: '1px solid rgba(0,0,0,0.07)' }}>
          <button onClick={onEdit}
            className="w-full h-10 text-sm font-semibold text-white rounded-lg transition"
            style={{ backgroundColor: 'var(--color-primary)' }}>
            Edit Product
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ProductsPage() {
  const { user } = useAuthStore()
  const canEdit = user?.role === 'ADMIN'

  const [search, setSearch]             = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [page, setPage]                 = useState(0)
  const [panelOpen, setPanelOpen]       = useState(false)
  const [editing, setEditing]           = useState<ProductRecord | undefined>()
  const [viewing, setViewing]           = useState<ProductRecord | undefined>()

  const qc = useQueryClient()

  const { data } = useQuery({
    queryKey: ['products', search, categoryFilter, statusFilter, page],
    queryFn: () => productsApi.list({
      search:   search   || undefined,
      category: categoryFilter || undefined,
      isActive: statusFilter === null ? undefined : statusFilter === 'active',
      page, size: PAGE_SIZE,
    }).then(r => r.data.data),
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['product-categories'],
    queryFn: () => productCategoriesApi.list().then(r => r.data.data ?? []),
  })

  const { data: units = [] } = useQuery({
    queryKey: ['product-units'],
    queryFn: () => productUnitsApi.list().then(r => r.data.data ?? []),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsApi.delete(id),
    onSuccess: () => { toast.success('Product deleted'); qc.invalidateQueries({ queryKey: ['products'] }) },
    onError: () => toast.error('Failed to delete'),
  })

  const products   = data?.content      ?? []
  const total      = data?.totalElements ?? 0
  const totalPages = data?.totalPages    ?? 0

  const categoryOptions: DropdownOption[] = (categories as ProductCategoryRecord[])
    .filter(c => c.isActive)
    .map(c => ({ value: c.name, label: c.name }))

  const statusOptions: DropdownOption[] = [
    { value: 'active',   label: 'Active'   },
    { value: 'inactive', label: 'Inactive' },
  ]

  function openCreate() { setEditing(undefined); setPanelOpen(true) }
  function openEdit(p: ProductRecord) { setEditing(p); setViewing(undefined); setPanelOpen(true) }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-5 flex items-center justify-between shrink-0" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} product{total !== 1 ? 's' : ''} total</p>
        </div>
        {canEdit && (
          <button onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg transition"
            style={{ backgroundColor: 'var(--color-primary)' }}>
            <Plus size={15} /> New Product
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="px-6 py-3 flex items-center gap-3 shrink-0 bg-gray-50" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0) }}
            placeholder="Search products…"
            className="w-full h-9 pl-9 pr-3 text-sm rounded-lg border border-gray-200 bg-white outline-none focus:ring-2 focus:ring-red-100 transition"
          />
        </div>
        <div className="w-48">
          <SearchableDropdown
            options={categoryOptions}
            value={categoryFilter}
            onChange={v => { setCategoryFilter(v); setPage(0) }}
            placeholder="All Categories"
          />
        </div>
        <div className="w-36">
          <SearchableDropdown
            options={statusOptions}
            value={statusFilter}
            onChange={v => { setStatusFilter(v); setPage(0) }}
            placeholder="All Statuses"
          />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: 'var(--color-primary)' }}>
              {['Product', 'Category', 'Unit', 'Price / Unit', 'Status', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-white/80 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center text-gray-400 text-sm">
                  No products found. {canEdit && 'Create your first product to get started.'}
                </td>
              </tr>
            ) : products.map((p: ProductRecord, i: number) => (
              <tr
                key={p.id}
                onClick={() => setViewing(p)}
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                style={i > 0 ? { borderTop: '1px solid rgba(0,0,0,0.05)' } : {}}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <ProductInitials name={p.name} />
                    <div>
                      <p className="font-medium text-gray-900">{p.name}</p>
                      {p.productCode && <p className="text-xs text-gray-400 font-mono">{p.productCode}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600">{p.category}</td>
                <td className="px-4 py-3 text-gray-600">{p.unit}</td>
                <td className="px-4 py-3 text-gray-600">
                  {p.pricePerUnit != null ? `$${Number(p.pricePerUnit).toFixed(2)}` : <span className="text-gray-300">—</span>}
                </td>
                <td className="px-4 py-3"><StatusBadge active={p.isActive} /></td>
                <td className="px-4 py-3">
                  <button
                    onClick={e => { e.stopPropagation(); setViewing(p) }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-3 flex items-center justify-between shrink-0 bg-white" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          <p className="text-xs text-gray-500">Page {page + 1} of {totalPages}</p>
          <div className="flex gap-2">
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors">
              Previous
            </button>
            <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors">
              Next
            </button>
          </div>
        </div>
      )}

      {/* Panels */}
      <ProductFormPanel
        open={panelOpen}
        onClose={() => { setPanelOpen(false); setEditing(undefined) }}
        product={editing}
        categories={categories as ProductCategoryRecord[]}
        units={units as ProductUnitRecord[]}
      />
      {viewing && !panelOpen && (
        <ProductDrawer
          product={viewing}
          onClose={() => setViewing(undefined)}
          onEdit={() => openEdit(viewing)}
        />
      )}
    </div>
  )
}
