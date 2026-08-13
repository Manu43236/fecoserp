import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, ChevronLeft, ChevronRight, Monitor, Smartphone, Phone, Mail, X, Building2, Plus, Pencil, Lock, Eye, EyeOff } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { saUsersApi, type SAUserRecord, type SACreateUserPayload } from '@/api/users'
import type { UpdateUserPayload } from '@/api/users'
import { RoleFilterDropdown, ROLES, roleMap } from '@/components/ui/RoleFilterDropdown'
import { SearchableDropdown } from '@/components/ui/SearchableDropdown'

const PAGE_SIZE = 10

const formatPhone = (n: string) =>
  n.length === 10 ? `(${n.slice(0, 3)}) ${n.slice(3, 6)}-${n.slice(6)}` : n

function formatPhoneInput(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 10)
  if (d.length <= 3) return d
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
}

function RoleBadge({ role }: { role: string }) {
  const r = roleMap[role]
  if (!r) return <span className="text-xs text-gray-400">{role}</span>
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ${r.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${r.dot}`} />
      {r.label}
    </span>
  )
}

function Avatar({ name, role, lg }: { name: string; role: string; lg?: boolean }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const colors: Record<string, string> = {
    ADMIN: 'bg-violet-100 text-violet-700', MANAGER: 'bg-blue-100 text-blue-700',
    LAB_TECH: 'bg-emerald-100 text-emerald-700', ACCOUNT_REP: 'bg-amber-100 text-amber-700',
    TRUCK_DRIVER: 'bg-orange-100 text-orange-700', SERVICE_TECH: 'bg-cyan-100 text-cyan-700',
  }
  return (
    <div className={`flex items-center justify-center font-bold shrink-0 ${
      lg ? 'w-16 h-16 rounded-2xl text-lg' : 'w-9 h-9 rounded-full text-xs'
    } ${colors[role] ?? 'bg-gray-100 text-gray-600'}`}>
      {initials}
    </div>
  )
}

// ── Shared role picker ────────────────────────────────────────────────────────
function RolePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {ROLES.map(r => {
        const isSelected = value === r.value
        return (
          <button
            key={r.value}
            type="button"
            onClick={() => onChange(r.value)}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-left transition-all ${
              isSelected ? `${r.color} ring-1 border-transparent` : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <span className={`w-2 h-2 rounded-full shrink-0 ${isSelected ? r.dot : 'bg-gray-300'}`} />
            <div className="min-w-0">
              <p className={`text-xs font-semibold truncate ${isSelected ? '' : 'text-gray-700'}`}>{r.label}</p>
              <div className="flex items-center gap-1 mt-0.5">
                {r.access.includes('Web')    && <Monitor size={9} className="text-gray-400" />}
                {r.access.includes('Mobile') && <Smartphone size={9} className="text-gray-400" />}
                <span className="text-[10px] text-gray-400">{r.access}</span>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

// ── Create Dialog ─────────────────────────────────────────────────────────────
const createSchema = z.object({
  tenantId:     z.string().min(1, 'Select a tenant'),
  fullName:     z.string().min(1, 'Required'),
  mobileNumber: z.string().regex(/^[2-9]\d{9}$/, 'Enter a valid US 10-digit number'),
  pin:          z.string().regex(/^\d{4}$/, 'PIN must be exactly 4 digits'),
  email:        z.string().email('Invalid email').optional().or(z.literal('')),
  role:         z.string().min(1, 'Select a role'),
})
type CreateForm = z.infer<typeof createSchema>

function CreateDialog({
  open, onClose, tenants,
}: { open: boolean; onClose: () => void; tenants: { id: string; name: string }[] }) {
  const qc = useQueryClient()
  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { tenantId: '', fullName: '', mobileNumber: '', pin: '', email: '', role: '' },
  })

  useEffect(() => {
    if (open) reset({ tenantId: '', fullName: '', mobileNumber: '', pin: '', email: '', role: '' })
  }, [open])

  const mutation = useMutation({
    mutationFn: (data: CreateForm) => saUsersApi.create(data as SACreateUserPayload),
    onSuccess: () => { toast.success('User created'); qc.invalidateQueries({ queryKey: ['sa-users'] }); onClose() },
    onError: (e: unknown) =>
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed'),
  })

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 mb-4 sm:mb-0 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Add User</h2>
            <p className="text-xs text-gray-400 mt-0.5">Create a user account for any tenant</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors">
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="px-6 py-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Tenant */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Tenant *</label>
            <select
              {...register('tenantId')}
              className="w-full h-10 px-3.5 text-sm border border-gray-200 rounded-lg outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-50 bg-white text-gray-700"
            >
              <option value="">Select a tenant…</option>
              {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            {errors.tenantId && <p className="text-red-500 text-xs mt-1">{errors.tenantId.message}</p>}
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Full Name *</label>
            <input {...register('fullName')} placeholder="John Smith"
              className="w-full h-10 px-3.5 text-sm border border-gray-200 rounded-lg outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-50" />
            {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Mobile */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Mobile Number *</label>
              <div className="flex">
                <span className="flex items-center px-3 h-10 rounded-l-lg border border-r-0 border-gray-200 bg-gray-50 text-sm text-gray-500 font-medium">+1</span>
                <input
                  type="tel" inputMode="numeric" placeholder="(555) 000-0000" maxLength={14}
                  value={formatPhoneInput(watch('mobileNumber') ?? '')}
                  onChange={e => setValue('mobileNumber', e.target.value.replace(/\D/g, '').slice(0, 10), { shouldValidate: true })}
                  className="flex-1 h-10 px-3 text-sm border border-gray-200 rounded-r-lg outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-50 tracking-wide"
                />
              </div>
              {errors.mobileNumber && <p className="text-red-500 text-xs mt-1">{errors.mobileNumber.message}</p>}
            </div>

            {/* PIN */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">PIN *</label>
              <input {...register('pin')} type="text" inputMode="numeric" maxLength={4} placeholder="4 digits"
                className="w-full h-10 px-3.5 text-sm border border-gray-200 rounded-lg outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-50 tracking-widest" />
              {errors.pin && <p className="text-red-500 text-xs mt-1">{errors.pin.message}</p>}
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email <span className="text-gray-400 font-normal">(optional)</span></label>
            <input {...register('email')} type="email" placeholder="john@company.com"
              className="w-full h-10 px-3.5 text-sm border border-gray-200 rounded-lg outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-50" />
          </div>

          {/* Role */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">Role *</label>
            <RolePicker value={watch('role')} onChange={v => setValue('role', v, { shouldValidate: true })} />
            {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role.message}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={mutation.isPending}
              className="px-5 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-60 transition-opacity"
              style={{ backgroundColor: 'var(--color-primary)' }}>
              {mutation.isPending ? 'Creating…' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Edit Dialog ───────────────────────────────────────────────────────────────
const editSchema = z.object({
  fullName: z.string().min(1, 'Required'),
  email:    z.string().email('Invalid email').optional().or(z.literal('')),
  role:     z.string().min(1, 'Select a role'),
})
type EditForm = z.infer<typeof editSchema>

function EditDialog({ open, onClose, user }: { open: boolean; onClose: () => void; user?: SAUserRecord }) {
  const qc = useQueryClient()
  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<EditForm>({
    resolver: zodResolver(editSchema),
  })

  useEffect(() => {
    if (open && user) reset({ fullName: user.fullName, email: user.email ?? '', role: user.role })
  }, [open, user?.id])

  const mutation = useMutation({
    mutationFn: (data: EditForm) => saUsersApi.update(user!.id, data as UpdateUserPayload),
    onSuccess: () => { toast.success('User updated'); qc.invalidateQueries({ queryKey: ['sa-users'] }); onClose() },
    onError: (e: unknown) =>
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed'),
  })

  if (!open || !user) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 mb-4 sm:mb-0 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Edit User</h2>
            <p className="text-xs text-gray-400 mt-0.5">{user.tenantName}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors">
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Full Name *</label>
            <input {...register('fullName')} placeholder="John Smith"
              className="w-full h-10 px-3.5 text-sm border border-gray-200 rounded-lg outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-50" />
            {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email <span className="text-gray-400 font-normal">(optional)</span></label>
            <input {...register('email')} type="email" placeholder="john@company.com"
              className="w-full h-10 px-3.5 text-sm border border-gray-200 rounded-lg outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-50" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">Role *</label>
            <RolePicker value={watch('role')} onChange={v => setValue('role', v, { shouldValidate: true })} />
            {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role.message}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={mutation.isPending}
              className="px-5 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-60 transition-opacity"
              style={{ backgroundColor: 'var(--color-primary)' }}>
              {mutation.isPending ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Detail Drawer ─────────────────────────────────────────────────────────────
function UserDrawer({
  user, onClose, onEdit,
}: { user: SAUserRecord | undefined; onClose: () => void; onEdit: (u: SAUserRecord) => void }) {
  const open = !!user
  const r = user ? roleMap[user.role] : null
  const [pinVisible, setPinVisible] = useState(false)

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      <div
        className={`fixed top-0 right-0 z-50 h-full w-96 bg-white shadow-2xl border-l border-gray-100 flex flex-col transition-transform duration-300 ease-out ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {user && (
          <>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <span className="text-sm font-semibold text-gray-700">User Detail</span>
              <button onClick={onClose} className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                <X size={14} className="text-gray-500" />
              </button>
            </div>

            <div className="px-5 py-6 border-b border-gray-100 flex flex-col items-center text-center gap-3">
              <Avatar name={user.fullName} role={user.role} lg />
              <div>
                <p className="text-base font-bold text-gray-900">{user.fullName}</p>
                <div className="flex items-center justify-center gap-2 mt-1.5 flex-wrap">
                  <RoleBadge role={user.role} />
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${
                    user.isActive ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-red-50 text-red-600 ring-red-200'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-red-400'}`} />
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              {r && (
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  {r.access.includes('Web')    && <Monitor size={11} />}
                  {r.access.includes('Mobile') && <Smartphone size={11} />}
                  <span>{r.access}</span>
                </div>
              )}
            </div>

            <div className="px-5 py-4 border-b border-gray-100 space-y-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Tenant</p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                  <Building2 size={13} className="text-gray-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-400">Company</p>
                  <p className="text-sm font-medium text-gray-800 truncate">{user.tenantName}</p>
                </div>
              </div>
            </div>

            <div className="px-5 py-4 space-y-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Contact</p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                  <Phone size={13} className="text-gray-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Mobile</p>
                  <p className="text-sm font-medium text-gray-800">+1 {formatPhone(user.mobileNumber)}</p>
                </div>
              </div>
              {user.email && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                    <Mail size={13} className="text-gray-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400">Email</p>
                    <p className="text-sm font-medium text-gray-800 truncate">{user.email}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                  <Lock size={13} className="text-gray-400" />
                </div>
                <div className="flex items-center gap-2">
                  <div>
                    <p className="text-xs text-gray-400">PIN</p>
                    <p className="text-sm font-medium text-gray-800 tracking-widest font-mono">
                      {pinVisible ? (user.pin ?? '––') : '••••'}
                    </p>
                  </div>
                  <button onClick={() => setPinVisible(v => !v)} className="ml-1 text-gray-400 hover:text-gray-600 transition-colors">
                    {pinVisible ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="px-5 py-4 mt-auto border-t border-gray-100">
              <button
                onClick={() => onEdit(user)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors text-left"
              >
                <Pencil size={14} className="text-gray-500 shrink-0" />
                <span className="text-sm font-medium text-gray-700">Edit Details</span>
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────
export function SAUsersPage() {
  const [search, setSearch] = useState('')
  const [tenantFilter, setTenantFilter] = useState('')
  const [roleFilter, setRoleFilter] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState<SAUserRecord | undefined>()
  const [createOpen, setCreateOpen] = useState(false)
  const [editUser, setEditUser] = useState<SAUserRecord | undefined>()

  const { data, isLoading } = useQuery({
    queryKey: ['sa-users'],
    queryFn: () => saUsersApi.list().then(r => r.data.data),
  })

  const users = data ?? []

  const tenants = Array.from(
    new Map(users.filter(u => u.tenantId).map(u => [u.tenantId!, u.tenantName])).entries()
  ).sort((a, b) => a[1].localeCompare(b[1])).map(([id, name]) => ({ id, name }))

  const filtered = users.filter(u => {
    const matchesTenant = !tenantFilter || u.tenantId === tenantFilter
    const matchesRole   = !roleFilter   || u.role === roleFilter
    const q = search.toLowerCase()
    const matchesSearch = !q
      || u.fullName.toLowerCase().includes(q)
      || u.mobileNumber.includes(q)
      || (u.email ?? '').toLowerCase().includes(q)
      || u.tenantName.toLowerCase().includes(q)
    return matchesTenant && matchesRole && matchesSearch
  })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated  = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  useEffect(() => { setPage(0) }, [search, tenantFilter, roleFilter])

  function openEdit(u: SAUserRecord) {
    setEditUser(u)
    setSelected(undefined)
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">All Users</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage users across all tenants</p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-xl shadow-sm hover:opacity-90 transition-opacity"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          <Plus size={15} strokeWidth={2.5} /> Add User
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Users',  value: users.length,           sub: 'across all tenants' },
          { label: 'Active',       value: users.filter(u => u.isActive).length, sub: 'can sign in', color: 'text-emerald-600' },
          { label: 'Tenants',      value: tenants.length,         sub: 'with users',         color: 'text-blue-600'   },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 px-4 py-3.5">
            <p className="text-xs text-gray-400">{label}</p>
            <p className={`text-2xl font-bold mt-0.5 ${color ?? 'text-gray-900'}`}>{value}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, mobile, email or tenant…"
            className="w-full h-9 pl-9 pr-3 text-sm border border-gray-200 rounded-lg outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-50 bg-white"
          />
        </div>
        <SearchableDropdown
          value={tenantFilter || null}
          onChange={v => setTenantFilter(v ?? '')}
          options={tenants.map(t => ({ value: t.id, label: t.name }))}
          placeholder="All Tenants"
          searchPlaceholder="Search tenants…"
        />
        <RoleFilterDropdown
          value={roleFilter}
          onChange={setRoleFilter}
          counts={Object.fromEntries(ROLES.map(r => [r.value, users.filter(u => u.role === r.value && (!tenantFilter || u.tenantId === tenantFilter)).length]))}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div
          className="grid grid-cols-[2fr_1.2fr_1fr_1fr_auto] gap-4 px-4 py-3"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          <span className="text-xs font-semibold text-white uppercase tracking-wider">Member</span>
          <span className="text-xs font-semibold text-white uppercase tracking-wider">Tenant</span>
          <span className="text-xs font-semibold text-white uppercase tracking-wider">Role</span>
          <span className="text-xs font-semibold text-white uppercase tracking-wider">Status</span>
          <span className="sr-only">Open</span>
        </div>

        <div className="divide-y divide-gray-50">
          {isLoading ? (
            <div className="py-16 text-center text-sm text-gray-400">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-sm text-gray-400">
              {search || tenantFilter ? 'No matching users' : 'No users found'}
            </div>
          ) : paginated.map(u => (
            <div
              key={u.id}
              className="grid grid-cols-[2fr_1.2fr_1fr_1fr_auto] gap-4 px-4 py-3 items-center hover:bg-gray-50/60 cursor-pointer transition-colors"
              onClick={() => setSelected(u)}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Avatar name={u.fullName} role={u.role} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{u.fullName}</p>
                  <p className="text-xs text-gray-500 mt-0.5">+1 {formatPhone(u.mobileNumber)}</p>
                  {u.email && <p className="text-xs text-gray-400 truncate">{u.email}</p>}
                </div>
              </div>
              <div className="min-w-0">
                <p className="text-sm text-gray-700 font-medium truncate">{u.tenantName}</p>
              </div>
              <div><RoleBadge role={u.role} /></div>
              <div>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ${
                  u.isActive ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-red-50 text-red-600 ring-red-200'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-emerald-500' : 'bg-red-400'}`} />
                  {u.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <ChevronRight size={15} className="text-gray-300" />
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => p - 1)} disabled={page === 0}
                className="w-7 h-7 flex items-center justify-center rounded-md border border-gray-200 text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft size={13} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i} onClick={() => setPage(i)}
                  className={`w-7 h-7 flex items-center justify-center rounded-md text-xs font-medium transition-colors ${
                    i === page ? 'text-white' : 'text-gray-500 border border-gray-200 hover:border-gray-300'
                  }`}
                  style={i === page ? { backgroundColor: 'var(--color-primary)' } : undefined}>
                  {i + 1}
                </button>
              ))}
              <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}
                className="w-7 h-7 flex items-center justify-center rounded-md border border-gray-200 text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>

      <UserDrawer user={selected} onClose={() => setSelected(undefined)} onEdit={openEdit} />
      <CreateDialog open={createOpen} onClose={() => setCreateOpen(false)} tenants={tenants} />
      <EditDialog open={!!editUser} onClose={() => setEditUser(undefined)} user={editUser} />
    </div>
  )
}
