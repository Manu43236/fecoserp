import { Check, MapPin } from 'lucide-react'

interface YardOption {
  id: string
  name: string
}

interface Props {
  value: string[]
  onChange: (yardIds: string[]) => void
  yards: YardOption[]
}

export function YardMultiSelect({ value, onChange, yards }: Props) {
  if (yards.length === 0) {
    return <p className="text-xs text-gray-400">No active yards — create one under Sites first.</p>
  }
  const toggle = (id: string) =>
    onChange(value.includes(id) ? value.filter(y => y !== id) : [...value, id])

  return (
    <div className="flex flex-col gap-1.5 max-h-44 overflow-y-auto">
      {yards.map(y => {
        const selected = value.includes(y.id)
        return (
          <button
            key={y.id}
            type="button"
            onClick={() => toggle(y.id)}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border text-left transition-all ${
              selected ? 'border-transparent ring-1' : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
            style={selected ? { backgroundColor: 'color-mix(in srgb, var(--color-primary) 10%, white)', boxShadow: '0 0 0 1px var(--color-primary)' } : undefined}
          >
            <MapPin size={13} className={selected ? '' : 'text-gray-400'} style={selected ? { color: 'var(--color-primary)' } : undefined} />
            <span className={`text-xs font-medium flex-1 truncate ${selected ? 'text-gray-900' : 'text-gray-700'}`}>{y.name}</span>
            {selected && <Check size={13} style={{ color: 'var(--color-primary)' }} />}
          </button>
        )
      })}
    </div>
  )
}
