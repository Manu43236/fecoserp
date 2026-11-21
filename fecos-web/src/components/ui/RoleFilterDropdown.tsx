import { SearchableDropdown } from './SearchableDropdown'

export const ROLES = [
  { value: 'ADMIN',        label: 'Admin',        access: 'Web',          color: 'bg-violet-50 text-violet-700 ring-violet-200',   dot: 'bg-violet-500'  },
  { value: 'MANAGER',      label: 'Manager',      access: 'Web + Mobile', color: 'bg-blue-50 text-blue-700 ring-blue-200',         dot: 'bg-blue-500'    },
  { value: 'LAB_TECH',     label: 'Lab Tech',     access: 'Web',          color: 'bg-emerald-50 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-500' },
  { value: 'ACCOUNT_REP',  label: 'Account Rep',  access: 'Web + Mobile', color: 'bg-amber-50 text-amber-700 ring-amber-200',      dot: 'bg-amber-500'   },
  { value: 'TRUCK_DRIVER', label: 'Truck Driver', access: 'Mobile',       color: 'bg-orange-50 text-orange-700 ring-orange-200',   dot: 'bg-orange-500'  },
  { value: 'SERVICE_TECH', label: 'Service Tech', access: 'Mobile',       color: 'bg-cyan-50 text-cyan-700 ring-cyan-200',         dot: 'bg-cyan-500'    },
]

export const roleMap = Object.fromEntries(ROLES.map(r => [r.value, r]))

/** Roles that require the user to belong to at least one yard (mirrors UserService.YARD_REQUIRED). */
export const FIELD_ROLES = ['SERVICE_TECH', 'TRUCK_DRIVER', 'ACCOUNT_REP'] as const
export const isFieldRole  = (role: string) => (FIELD_ROLES as readonly string[]).includes(role)
export const isMobileRole = (role: string) => !!roleMap[role]?.access.includes('Mobile')

/** Sort a set of role values into the canonical ROLES display order. */
export const sortRoles = (roles: string[]) =>
  [...roles].sort((a, b) => ROLES.findIndex(r => r.value === a) - ROLES.findIndex(r => r.value === b))

export function RoleBadge({ role }: { role: string }) {
  const r = roleMap[role]
  if (!r) return <span className="text-xs text-gray-400">{role}</span>
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ${r.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${r.dot}`} />
      {r.label}
    </span>
  )
}

/** Renders every held role. In `compact` mode (table rows) shows the first badge + "+N". */
export function RoleBadges({ roles, compact = false }: { roles: string[]; compact?: boolean }) {
  const sorted = sortRoles(roles ?? [])
  if (sorted.length === 0) return <span className="text-xs text-gray-400">—</span>
  if (compact) {
    return (
      <div className="flex items-center gap-1.5 min-w-0">
        <RoleBadge role={sorted[0]} />
        {sorted.length > 1 && (
          <span className="text-[11px] font-medium text-gray-400 shrink-0">+{sorted.length - 1}</span>
        )}
      </div>
    )
  }
  return (
    <div className="flex items-center gap-1.5 flex-wrap justify-center">
      {sorted.map(role => <RoleBadge key={role} role={role} />)}
    </div>
  )
}

interface Props {
  value: string | null
  onChange: (v: string | null) => void
  counts?: Record<string, number>
}

export function RoleFilterDropdown({ value, onChange, counts }: Props) {
  return (
    <SearchableDropdown
      value={value}
      onChange={onChange}
      placeholder="All Roles"
      searchPlaceholder="Search roles…"
      options={ROLES.map(r => ({
        value: r.value,
        label: r.label,
        dot: r.dot,
        meta: counts?.[r.value] != null ? String(counts[r.value]) : undefined,
      }))}
    />
  )
}
