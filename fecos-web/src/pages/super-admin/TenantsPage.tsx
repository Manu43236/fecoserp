import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { Building2, Plus, LogIn, Pencil, Trash2, CheckCircle, XCircle, ChevronRight, ChevronDown } from 'lucide-react'
import { saApi, type CreateTenantPayload } from '@/api/superadmin'
import { useAuthStore } from '@/store/authStore'
import type { Tenant, Role } from '@/types'

// ── Schema ────────────────────────────────────────────────────────────────────
const schema = z.object({
  companyName:       z.string().min(1, 'Required'),
  subdomain:         z.string().min(3, 'Minimum 3 characters').regex(/^[a-z0-9-]+$/, 'Lowercase, numbers and hyphens only'),
  ownerName:         z.string().optional(),
  contactPhone:      z.string().optional(),
  contactEmail:      z.string().email('Invalid email').optional().or(z.literal('')),
  primaryColor:      z.string().optional(),
  darkColor:         z.string().optional(),
  accentColor:       z.string().optional(),
  plan:              z.string().optional(),
  adminFullName:     z.string().optional(),
  adminMobileNumber: z.string().optional(),
  adminPin:          z.string().optional(),
})
type FormData = z.infer<typeof schema>

const EMPTY: FormData = {
  companyName: '', subdomain: '', ownerName: '', contactPhone: '', contactEmail: '',
  primaryColor: '#751903', darkColor: '#3F0C00', accentColor: '#E5D4CF',
  plan: 'PILOT', adminFullName: '', adminMobileNumber: '', adminPin: '',
}

function fromTenant(t: Tenant): FormData {
  return {
    companyName: t.companyName, subdomain: t.subdomain,
    ownerName: t.ownerName ?? '', contactPhone: t.contactPhone ?? '',
    contactEmail: t.contactEmail ?? '', primaryColor: t.primaryColor ?? '#751903',
    darkColor: t.darkColor ?? '#3F0C00', accentColor: t.accentColor ?? '#E5D4CF',
    plan: t.plan, adminFullName: '', adminMobileNumber: '', adminPin: '',
  }
}

// ── Tenant Dialog ─────────────────────────────────────────────────────────────
function TenantDialog({ open, onClose, tenant }: { open: boolean; onClose: () => void; tenant?: Tenant }) {
  const qc = useQueryClient()
  const isEdit = !!tenant

  const { register, handleSubmit, formState: { errors }, reset, control } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY,
  })

  useEffect(() => {
    if (open) reset(tenant ? fromTenant(tenant) : EMPTY)
  }, [open, tenant?.id])

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const payload: CreateTenantPayload = data
      return isEdit ? saApi.updateTenant(tenant!.id, payload) : saApi.createTenant(payload)
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Tenant updated' : 'Tenant created')
      qc.invalidateQueries({ queryKey: ['sa-tenants'] })
      onClose()
    },
    onError: (e: unknown) =>
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed'),
  })

  if (!open) return null

  function SubdomainField({ disabled }: { disabled: boolean }) {
    const value = useWatch({ control, name: 'subdomain' })
    const [status, setStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
    const timer = useRef<ReturnType<typeof setTimeout>>()

    useEffect(() => {
      if (disabled || !value || value.length < 3 || !/^[a-z0-9-]+$/.test(value)) { setStatus('idle'); return }
      setStatus('checking')
      clearTimeout(timer.current)
      timer.current = setTimeout(async () => {
        try {
          const res = await saApi.checkSubdomain(value)
          setStatus(res.data.data?.available ? 'available' : 'taken')
        } catch { setStatus('idle') }
      }, 500)
      return () => clearTimeout(timer.current)
    }, [value, disabled])

    return (
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Subdomain<span className="text-red-500 ml-0.5">*</span>
        </label>
        <div className="relative">
          <input
            {...register('subdomain')}
            disabled={disabled}
            placeholder="e.g. endura"
            className={`w-full h-9 px-3 pr-24 text-sm rounded-md border outline-none transition focus:ring-2 focus:ring-red-100
              ${errors.subdomain ? 'border-red-400' : 'border-gray-200'} ${disabled ? 'bg-gray-50 text-gray-400' : ''}`}
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium pointer-events-none text-gray-400">
            .fecoserp.com
          </span>
        </div>
        {errors.subdomain && <p className="text-red-500 text-xs mt-1">{errors.subdomain.message}</p>}
        {!errors.subdomain && !disabled && status === 'checking' && (
          <p className="text-gray-400 text-xs mt-1">Checking…</p>
        )}
        {!errors.subdomain && !disabled && status === 'available' && (
          <p className="text-green-600 text-xs mt-1">✓ Available</p>
        )}
        {!errors.subdomain && !disabled && status === 'taken' && (
          <p className="text-red-500 text-xs mt-1">✗ Already taken — please choose a different subdomain name</p>
        )}
      </div>
    )
  }

  function Field({ label, name, required, type = 'text' }: {
    label: string; name: keyof FormData; required?: boolean; type?: string
  }) {
    return (
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <input
          {...register(name)}
          type={type}
          className={`w-full h-9 px-3 text-sm rounded-md border outline-none transition focus:ring-2 focus:ring-red-100
            ${errors[name] ? 'border-red-400' : 'border-gray-200'}`}
        />
        {errors[name] && <p className="text-red-500 text-xs mt-1">{errors[name]?.message}</p>}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">{isEdit ? 'Edit Tenant' : 'Create Tenant'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
        </div>
        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="px-6 py-5 space-y-6">
          <section>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Company</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Company Name" name="companyName" required />
              <SubdomainField disabled={isEdit} />
              <Field label="Owner Name" name="ownerName" />
              <Field label="Contact Phone" name="contactPhone" />
              <div className="col-span-2"><Field label="Contact Email" name="contactEmail" type="email" /></div>
            </div>
          </section>

          <section>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Branding</p>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Primary Color" name="primaryColor" type="color" />
              <Field label="Dark Color" name="darkColor" type="color" />
              <Field label="Accent Color" name="accentColor" type="color" />
            </div>
          </section>

          {!isEdit && (
            <section>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Initial Admin User</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Admin Full Name" name="adminFullName" required />
                <Field label="Admin Mobile (US, 10 digits)" name="adminMobileNumber" required />
                <Field label="PIN (4 digits)" name="adminPin" required />
              </div>
            </section>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={mutation.isPending}
              className="px-4 py-2 text-sm rounded-md text-white font-medium disabled:opacity-60"
              style={{ backgroundColor: '#751903' }}>
              {mutation.isPending ? 'Saving…' : isEdit ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Tenant Row ────────────────────────────────────────────────────────────────
function TenantRow({ tenant, onEdit, onDelete, onImpersonate }: {
  tenant: Tenant
  onEdit: (t: Tenant) => void
  onDelete: (t: Tenant) => void
  onImpersonate: (t: Tenant) => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <>
      <tr className="hover:bg-gray-50 border-b border-gray-100">
        <td className="px-4 py-3 w-8">
          <button onClick={() => setExpanded(e => !e)} className="text-gray-400 hover:text-gray-600">
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        </td>
        <td className="px-4 py-3">
          <p className="text-sm font-medium text-gray-800">{tenant.companyName}</p>
          <p className="text-xs text-gray-400">{tenant.subdomain}.fecoserp.com</p>
        </td>
        <td className="px-4 py-3 text-sm text-gray-600">{tenant.ownerName ?? '—'}</td>
        <td className="px-4 py-3 text-sm text-gray-600">{tenant.contactPhone ?? '—'}</td>
        <td className="px-4 py-3">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-gray-50 text-gray-700 border-gray-200">
            {tenant.plan}
          </span>
        </td>
        <td className="px-4 py-3">
          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full
            ${tenant.active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {tenant.active ? <CheckCircle size={10} /> : <XCircle size={10} />}
            {tenant.active ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td className="px-4 py-3 text-xs text-gray-400">
          {tenant.createdAt ? new Date(tenant.createdAt).toLocaleDateString() : '—'}
        </td>
        <td className="px-4 py-3">
          <div className="flex gap-1 justify-end">
            <button title="Open as Admin" onClick={() => onImpersonate(tenant)}
              className="p-1.5 rounded text-green-600 hover:bg-green-50 transition-colors">
              <LogIn size={13} />
            </button>
            <button title="Edit" onClick={() => onEdit(tenant)}
              className="p-1.5 rounded text-gray-500 hover:bg-gray-100 transition-colors">
              <Pencil size={13} />
            </button>
            <button title="Delete" onClick={() => onDelete(tenant)}
              className="p-1.5 rounded text-red-500 hover:bg-red-50 transition-colors">
              <Trash2 size={13} />
            </button>
          </div>
        </td>
      </tr>

      {expanded && (
        <tr className="bg-gray-50 border-b border-gray-100">
          <td colSpan={8} className="px-10 py-4">
            <div className="grid grid-cols-3 gap-6 text-sm">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Contact</p>
                <div className="space-y-1 text-gray-600">
                  {tenant.ownerName && <p>{tenant.ownerName}</p>}
                  {tenant.contactPhone && <p>{tenant.contactPhone}</p>}
                  {tenant.contactEmail && <p>{tenant.contactEmail}</p>}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Branding</p>
                <div className="flex gap-2 mt-1">
                  {[tenant.primaryColor, tenant.darkColor, tenant.accentColor].map((c, i) =>
                    c ? <div key={i} className="w-6 h-6 rounded border border-gray-200" style={{ backgroundColor: c }} title={c} /> : null
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Subdomain</p>
                <p className="text-gray-600 font-mono text-xs">{tenant.subdomain}.fecoserp.com</p>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export function TenantsPage() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const impersonate = useAuthStore(s => s.impersonate)

  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Tenant | undefined>()
  const [deleteTarget, setDeleteTarget] = useState<Tenant | undefined>()
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['sa-tenants'],
    queryFn: () => saApi.listTenants().then(r => r.data.data),
  })

  const tenants = data ?? []

  const deleteMutation = useMutation({
    mutationFn: (id: string) => saApi.deleteTenant(id),
    onSuccess: () => { toast.success('Tenant removed'); qc.invalidateQueries({ queryKey: ['sa-tenants'] }) },
    onError: (e: unknown) =>
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed'),
  })

  const impersonateMutation = useMutation({
    mutationFn: (id: string) => saApi.impersonate(id).then(r => r.data.data),
    onSuccess: (res) => {
      impersonate(
        {
          id: res.id,
          fullName: res.fullName,
          mobileNumber: '',
          email: res.email,
          role: res.role as Role,
          tenantId: res.tenantId,
          tenantName: res.tenantName,
          primaryColor: res.primaryColor,
          darkColor: res.darkColor,
          accentColor: res.accentColor,
        },
        res.token,
      )
      navigate('/dashboard', { replace: true })
    },
    onError: (e: unknown) =>
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed'),
  })

  const filtered = tenants.filter(t =>
    !search ||
    t.companyName.toLowerCase().includes(search.toLowerCase()) ||
    t.subdomain.includes(search) ||
    (t.contactPhone ?? '').includes(search)
  )

  const active = tenants.filter(t => t.active).length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Tenant Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage all FECOS tenants</p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-md text-white font-medium"
          style={{ backgroundColor: '#751903' }}
        >
          <Plus size={15} />
          New Tenant
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total',    value: tenants.length, color: 'text-blue-600',  bg: 'bg-blue-50' },
          { label: 'Active',   value: active,          color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Inactive', value: tenants.length - active, color: 'text-gray-500', bg: 'bg-gray-100' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3 shadow-sm">
            <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
              <Building2 size={16} className={color} />
            </div>
            <div>
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-xl font-bold text-gray-800">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search by name, subdomain, or phone…"
        className="w-64 h-9 px-3 text-sm rounded-md border border-gray-200 outline-none focus:ring-2 focus:ring-red-100"
      />

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-12 text-center text-sm text-gray-400">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <Building2 size={36} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-gray-400">{search ? 'No matching tenants' : 'No tenants yet — create one to get started'}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="w-8 px-4 py-3" />
                {['Company', 'Owner', 'Phone', 'Plan', 'Status', 'Created', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <TenantRow
                  key={t.id}
                  tenant={t}
                  onEdit={setEditTarget}
                  onDelete={setDeleteTarget}
                  onImpersonate={tr => impersonateMutation.mutate(tr.id)}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create dialog */}
      <TenantDialog open={createOpen} onClose={() => setCreateOpen(false)} />

      {/* Edit dialog */}
      {editTarget && (
        <TenantDialog open={!!editTarget} onClose={() => setEditTarget(undefined)} tenant={editTarget} />
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-80">
            <h3 className="font-semibold text-gray-900 mb-2">Remove Tenant</h3>
            <p className="text-sm text-gray-500 mb-5">
              Remove <strong>{deleteTarget.companyName}</strong>? This will disable the tenant and all their users.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteTarget(undefined)}
                className="px-4 py-2 text-sm rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={() => { deleteMutation.mutate(deleteTarget.id); setDeleteTarget(undefined) }}
                className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700">
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
