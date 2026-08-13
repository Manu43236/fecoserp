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
