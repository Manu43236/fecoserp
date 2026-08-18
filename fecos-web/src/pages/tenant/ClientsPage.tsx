import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import {
  Plus, Search, Pencil, Trash2, X, Building2, Phone, Mail,
  MapPin, User, ChevronRight,
} from 'lucide-react'
import { clientsApi, type ClientRecord, type ClientPayload } from '@/api/clients'
import { usersApi, type UserRecord } from '@/api/users'
import { SearchableDropdown, type DropdownOption } from '@/components/ui/SearchableDropdown'
import { useAuthStore } from '@/store/authStore'

const PAGE_SIZE = 10

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatPhone(n: string | null) {
  if (!n) return '—'
  const d = n.replace(/\D/g, '')
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
  return n
}

function formatPhoneInput(raw: string) {
  const d = raw.replace(/\D/g, '').slice(0, 10)
  if (d.length < 4) return d
  if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
}

function ClientInitials({ name, size = 'sm' }: { name: string; size?: 'sm' | 'lg' }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const cls = size === 'lg'
    ? 'w-14 h-14 rounded-2xl text-base font-bold'
    : 'w-9 h-9 rounded-full text-xs font-bold'
  return (
    <div
      className={`${cls} flex items-center justify-center shrink-0 text-white`}
      style={{ backgroundColor: 'var(--color-primary)' }}
    >
      {initials}
    </div>
  )
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ${
      active
        ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
        : 'bg-gray-50 text-gray-500 ring-gray-200'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-gray-400'}`} />
      {active ? 'Active' : 'Inactive'}
    </span>
  )
}

// ── Create / Edit Panel (right slide-over) ────────────────────────────────────
const schema = z.object({
  companyName:    z.string().min(1, 'Required').max(100),
  contactName:    z.string().max(100).optional().or(z.literal('')),
  contactPhone:   z.string().max(20).optional().or(z.literal('')),
  contactEmail:   z.string().email('Invalid email').optional().or(z.literal('')),
  billingAddress: z.string().optional().or(z.literal('')),
  accountRepId:   z.string().optional().or(z.literal('')),
  isActive:       z.boolean(),
})
type FormData = z.infer<typeof schema>

function ClientFormPanel({
  open,
  onClose,
  client,
  accountReps,
}: {
  open: boolean
  onClose: () => void
  client?: ClientRecord
  accountReps: UserRecord[]
}) {
  const qc = useQueryClient()
  const isEdit = !!client

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      companyName:    client?.companyName    ?? '',
      contactName:    client?.contactName    ?? '',
      contactPhone:   client?.contactPhone   ?? '',
      contactEmail:   client?.contactEmail   ?? '',
      billingAddress: client?.billingAddress ?? '',
      accountRepId:   client?.accountRepId   ?? '',
      isActive:       client?.isActive       ?? true,
    },
  })

  const mutation = useMutation({
    mutationFn: (data: ClientPayload) =>
      isEdit ? clientsApi.update(client!.id, data) : clientsApi.create(data),
    onSuccess: () => {
      toast.success(isEdit ? 'Client updated' : 'Client created')
      qc.invalidateQueries({ queryKey: ['clients'] })
      onClose()
      reset()
    },
    onError: (e: unknown) =>
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed'),
  })

  function onSubmit(data: FormData) {
    mutation.mutate({
      companyName:    data.companyName,
      contactName:    data.contactName    || undefined,
      contactPhone:   data.contactPhone   || undefined,
      contactEmail:   data.contactEmail   || undefined,
      billingAddress: data.billingAddress || undefined,
      accountRepId:   data.accountRepId   || null,
      isActive:       data.isActive,
    })
  }

  const repOptions: DropdownOption[] = accountReps.map(r => ({
    value: r.id,
    label: r.fullName,
  }))

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative bg-white w-[440px] h-full shadow-2xl flex flex-col">

        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              <Building2 size={14} className="text-white" />
            </div>
            <h2 className="text-sm font-semibold text-gray-900">
              {isEdit ? 'Edit Client' : 'New Client'}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>

        {/* Form — scrollable */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

            {/* Company Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                {...register('companyName')}
                placeholder="e.g. Fasken Oil and Ranch"
                className={`w-full h-10 px-3 text-sm rounded-lg border outline-none transition focus:ring-2 focus:ring-red-100 ${errors.companyName ? 'border-red-400' : 'border-gray-200'}`}
              />
              {errors.companyName && <p className="text-red-500 text-xs">{errors.companyName.message}</p>}
            </div>

            <div className="border-t border-gray-100" />

            {/* Contact Person + Phone */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Contact Person</label>
                <input
                  {...register('contactName')}
                  placeholder="Full name"
                  className="w-full h-10 px-3 text-sm rounded-lg border border-gray-200 outline-none transition focus:ring-2 focus:ring-red-100"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Phone</label>
                <input
                  {...register('contactPhone')}
                  placeholder="(432) 000-0000"
                  onChange={e => setValue('contactPhone', formatPhoneInput(e.target.value))}
                  className="w-full h-10 px-3 text-sm rounded-lg border border-gray-200 outline-none transition focus:ring-2 focus:ring-red-100"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</label>
              <input
                {...register('contactEmail')}
                placeholder="contact@company.com"
                className={`w-full h-10 px-3 text-sm rounded-lg border outline-none transition focus:ring-2 focus:ring-red-100 ${errors.contactEmail ? 'border-red-400' : 'border-gray-200'}`}
              />
              {errors.contactEmail && <p className="text-red-500 text-xs">{errors.contactEmail.message}</p>}
            </div>

            {/* Billing Address */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Billing Address</label>
              <textarea
                {...register('billingAddress')}
                rows={3}
                placeholder="Street, City, State, ZIP"
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 outline-none transition focus:ring-2 focus:ring-red-100 resize-none"
              />
            </div>

            <div className="border-t border-gray-100" />

            {/* Account Rep */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Account Representative</label>
              <SearchableDropdown
                value={watch('accountRepId') || null}
                onChange={v => setValue('accountRepId', v ?? '')}
                options={repOptions}
                placeholder="Select account rep"
                searchPlaceholder="Search reps…"
                showClear={false}
              />
            </div>

            {/* Status toggle — edit only */}
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
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${watch('isActive') ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {watch('isActive') ? 'Active' : 'Inactive'}
                    </span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div
            className="px-5 py-4 flex gap-3 shrink-0"
            style={{ borderTop: '1px solid rgba(0,0,0,0.07)' }}
          >
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 text-sm font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 h-10 text-sm font-semibold text-white rounded-lg transition disabled:opacity-60"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              {mutation.isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Detail Drawer ─────────────────────────────────────────────────────────────
function ClientDrawer({
  client,
  onClose,
  onEdit,
  onDelete,
  canEdit,
}: {
  client: ClientRecord
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  canEdit: boolean
}) {
  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative bg-white w-96 h-full shadow-2xl flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <h3 className="text-sm font-semibold text-gray-900">Client Details</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          <div className="flex items-start gap-4">
            <ClientInitials name={client.companyName} size="lg" />
            <div className="min-w-0 pt-1">
              <p className="font-semibold text-gray-900 text-base leading-tight">{client.companyName}</p>
              <div className="mt-2">
                <StatusBadge active={client.isActive} />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100" />

          <div className="space-y-4">
            {client.contactName && (
              <div className="flex items-start gap-3">
                <User size={14} className="text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11px] text-gray-400 uppercase tracking-wide font-semibold">Contact Person</p>
                  <p className="text-sm text-gray-800 mt-0.5">{client.contactName}</p>
                </div>
              </div>
            )}
            {client.contactPhone && (
              <div className="flex items-start gap-3">
                <Phone size={14} className="text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11px] text-gray-400 uppercase tracking-wide font-semibold">Phone</p>
                  <p className="text-sm text-gray-800 mt-0.5">{formatPhone(client.contactPhone)}</p>
                </div>
              </div>
            )}
            {client.contactEmail && (
              <div className="flex items-start gap-3">
                <Mail size={14} className="text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11px] text-gray-400 uppercase tracking-wide font-semibold">Email</p>
                  <p className="text-sm text-gray-800 mt-0.5 break-all">{client.contactEmail}</p>
                </div>
              </div>
            )}
            {client.billingAddress && (
              <div className="flex items-start gap-3">
                <MapPin size={14} className="text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11px] text-gray-400 uppercase tracking-wide font-semibold">Billing Address</p>
                  <p className="text-sm text-gray-800 mt-0.5 whitespace-pre-wrap">{client.billingAddress}</p>
                </div>
              </div>
            )}
            {client.accountRepName && (
              <div className="flex items-start gap-3">
                <User size={14} className="text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11px] text-gray-400 uppercase tracking-wide font-semibold">Account Rep</p>
                  <p className="text-sm text-gray-800 mt-0.5">{client.accountRepName}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        {canEdit && (
          <div className="px-5 py-4 border-t border-gray-100 flex gap-2 shrink-0">
            <button
              onClick={onEdit}
              className="flex-1 flex items-center justify-center gap-2 h-9 text-sm font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Pencil size={13} />
              Edit
            </button>
            <button
              onClick={onDelete}
              className="flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium rounded-lg border border-red-100 text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 size={13} />
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export function ClientsPage() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const canEdit = user?.role === 'ADMIN'

  const [search, setSearch]                     = useState('')
  const [accountRepFilter, setAccountRepFilter] = useState<string | null>(null)
  const [statusFilter, setStatusFilter]         = useState<string | null>(null)
  const [page, setPage]                         = useState(0)
  const [formOpen, setFormOpen]                 = useState(false)
  const [editing, setEditing]                   = useState<ClientRecord | undefined>()
  const [selected, setSelected]                 = useState<ClientRecord | undefined>()

  const params = {
    search:       search || undefined,
    accountRepId: accountRepFilter || undefined,
    isActive:     statusFilter === null ? undefined : statusFilter === 'active',
    page,
    size: PAGE_SIZE,
  }

  const { data, isLoading } = useQuery({
    queryKey: ['clients', params],
    queryFn:  () => clientsApi.list(params),
  })

  const { data: allUsers = [] } = useQuery({
    queryKey: ['users'],
    queryFn:  () => usersApi.list().then(r => r.data.data),
  })

  const accountReps = allUsers.filter(u => u.role === 'ACCOUNT_REP')

  const deleteMutation = useMutation({
    mutationFn: (id: string) => clientsApi.delete(id),
    onSuccess: () => {
      toast.success('Client deleted')
      qc.invalidateQueries({ queryKey: ['clients'] })
      setSelected(undefined)
    },
    onError: () => toast.error('Failed to delete client'),
  })

  const clients    = data?.data?.data?.content      ?? []
  const total      = data?.data?.data?.totalElements ?? 0
  const totalPages = data?.data?.data?.totalPages    ?? 0

  const repFilterOptions: DropdownOption[] = accountReps.map(r => ({ value: r.id, label: r.fullName }))
  const statusOptions: DropdownOption[]    = [
    { value: 'active',   label: 'Active'   },
    { value: 'inactive', label: 'Inactive' },
  ]

  function openCreate() {
    setEditing(undefined)
    setSelected(undefined)
    setFormOpen(true)
  }

  function openEdit(client: ClientRecord) {
    setEditing(client)
    setSelected(undefined)
    setFormOpen(true)
  }

  function handleDelete(client: ClientRecord) {
    if (!confirm(`Delete "${client.companyName}"? This cannot be undone.`)) return
    deleteMutation.mutate(client.id)
  }

  function handleFilterChange(setter: (v: string | null) => void) {
    return (v: string | null) => { setter(v); setPage(0) }
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Clients</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} client{total !== 1 ? 's' : ''} total</p>
        </div>
        {canEdit && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg transition"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            <Plus size={15} />
            New Client
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search companies…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0) }}
            className="h-9 pl-8 pr-3 text-sm rounded-lg border border-gray-200 outline-none transition focus:ring-2 focus:ring-red-100 w-56"
          />
        </div>
        <SearchableDropdown
          value={accountRepFilter}
          onChange={handleFilterChange(setAccountRepFilter)}
          options={repFilterOptions}
          placeholder="All Account Reps"
          searchPlaceholder="Search reps…"
          className="w-52"
        />
        <SearchableDropdown
          value={statusFilter}
          onChange={handleFilterChange(setStatusFilter)}
          options={statusOptions}
          placeholder="All Statuses"
          className="w-40"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: 'var(--color-primary)' }}>
              {['Company', 'Contact Person', 'Phone', 'Account Rep', 'Status', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-white/90 uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : clients.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-14 text-center">
                  <Building2 size={32} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-sm text-gray-500 font-medium">No clients found</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {search || accountRepFilter || statusFilter
                      ? 'Try adjusting your filters'
                      : 'Create your first client to get started'}
                  </p>
                </td>
              </tr>
            ) : (
              clients.map(client => (
                <tr
                  key={client.id}
                  onClick={() => { setSelected(client); setFormOpen(false) }}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <ClientInitials name={client.companyName} />
                      <span className="font-medium text-gray-900">{client.companyName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{client.contactName ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{formatPhone(client.contactPhone)}</td>
                  <td className="px-4 py-3 text-gray-600">{client.accountRepName ?? '—'}</td>
                  <td className="px-4 py-3"><StatusBadge active={client.isActive} /></td>
                  <td className="px-4 py-3 text-right">
                    <ChevronRight size={14} className="text-gray-400 ml-auto" />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Page {page + 1} of {totalPages} · {total} total
            </p>
            <div className="flex gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 text-xs font-medium rounded-md border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 text-xs font-medium rounded-md border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right panels — only one open at a time */}
      {formOpen && (
        <ClientFormPanel
          open={formOpen}
          onClose={() => { setFormOpen(false); setEditing(undefined) }}
          client={editing}
          accountReps={accountReps}
        />
      )}

      {selected && !formOpen && (
        <ClientDrawer
          client={selected}
          onClose={() => setSelected(undefined)}
          onEdit={() => openEdit(selected)}
          onDelete={() => handleDelete(selected)}
          canEdit={canEdit}
        />
      )}
    </div>
  )
}
