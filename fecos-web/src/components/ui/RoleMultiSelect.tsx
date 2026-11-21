import { Monitor, Smartphone, Check } from 'lucide-react'
import { ROLES } from './RoleFilterDropdown'

/**
 * Apply one toggle to the current role set and return a clean, valid set.
 * Mirrors the server rules in UserService.validateRoles — conflicts are
 * auto-resolved (not rejected) so the picker can never produce an invalid combo:
 *   • Account Rep is exclusive (can't combine with anything).
 *   • Admin and Manager are mutually exclusive.
 */
export function resolveRoles(current: string[], toggled: string): string[] {
  if (current.includes(toggled)) return current.filter(r => r !== toggled)

  let next = [...current, toggled]
  if (toggled === 'ACCOUNT_REP') return ['ACCOUNT_REP']        // becomes exclusive
  next = next.filter(r => r !== 'ACCOUNT_REP')                 // any other role clears AR
  if (toggled === 'ADMIN')   next = next.filter(r => r !== 'MANAGER')
  if (toggled === 'MANAGER') next = next.filter(r => r !== 'ADMIN')
  return next
}

interface Props {
  value: string[]
  onChange: (roles: string[]) => void
}

export function RoleMultiSelect({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {ROLES.map(r => {
        const isSelected = value.includes(r.value)
        return (
          <button
            key={r.value}
            type="button"
            onClick={() => onChange(resolveRoles(value, r.value))}
            className={`relative flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-left transition-all ${
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
            {isSelected && <Check size={13} className="absolute top-2 right-2 opacity-70" />}
          </button>
        )
      })}
    </div>
  )
}
