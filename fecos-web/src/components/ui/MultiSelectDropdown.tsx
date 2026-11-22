import { useState, useEffect, useRef } from 'react'
import { Search, ChevronDown, Check } from 'lucide-react'

export interface MultiOption {
  value: string
  label: string
  group?: string        // group key (e.g. clientId)
  groupLabel?: string   // header shown for the group (e.g. client name)
}

interface Props {
  value: string[]
  onChange: (values: string[]) => void
  options: MultiOption[]
  placeholder?: string
  searchPlaceholder?: string
  disabled?: boolean
  emptyText?: string
}

/** Searchable multi-select with checkbox rows, optional group headers, and per-group "select all". */
export function MultiSelectDropdown({
  value, onChange, options,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  disabled = false,
  emptyText = 'Nothing to select',
}: Props) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  const selected = new Set(value)
  const filtered = options.filter(o => o.label.toLowerCase().includes(q.toLowerCase()))

  // Preserve group order as options arrive.
  const groupOrder: string[] = []
  const groups = new Map<string, { label: string; items: MultiOption[] }>()
  for (const o of filtered) {
    const key = o.group ?? '__ungrouped'
    if (!groups.has(key)) { groups.set(key, { label: o.groupLabel ?? '', items: [] }); groupOrder.push(key) }
    groups.get(key)!.items.push(o)
  }

  const toggle = (v: string) =>
    onChange(selected.has(v) ? value.filter(x => x !== v) : [...value, v])

  const toggleGroup = (items: MultiOption[]) => {
    const ids = items.map(i => i.value)
    const allOn = ids.every(id => selected.has(id))
    onChange(allOn ? value.filter(v => !ids.includes(v)) : Array.from(new Set([...value, ...ids])))
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => { setOpen(o => !o); setQ('') }}
        className={`w-full flex items-center justify-between gap-2 h-10 px-3 text-sm border rounded-lg outline-none transition bg-white ${
          disabled ? 'border-gray-100 text-gray-300 cursor-not-allowed'
                   : value.length ? 'border-gray-300 text-gray-800 font-medium' : 'border-gray-200 text-gray-500 hover:border-gray-300'
        }`}
      >
        <span className="truncate">{value.length ? `${value.length} selected` : placeholder}</span>
        <ChevronDown size={14} className={`text-gray-400 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && !disabled && (
        <div className="absolute top-full left-0 mt-1 z-50 w-full bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder={searchPlaceholder}
                className="w-full h-8 pl-7 pr-2.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition" />
            </div>
          </div>
          <div className="py-1 max-h-60 overflow-y-auto">
            {filtered.length === 0 && <p className="px-3 py-3 text-xs text-gray-400 text-center">{q ? 'No results' : emptyText}</p>}
            {groupOrder.map(key => {
              const g = groups.get(key)!
              const ids = g.items.map(i => i.value)
              const allOn = ids.every(id => selected.has(id))
              return (
                <div key={key}>
                  {g.label && (
                    <button type="button" onClick={() => toggleGroup(g.items)}
                      className="w-full flex items-center justify-between px-3 py-1.5 bg-gray-50/80 sticky top-0">
                      <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide truncate">{g.label}</span>
                      <span className="text-[10px] font-medium" style={{ color: allOn ? 'var(--color-primary)' : '#9ca3af' }}>
                        {allOn ? 'Clear all' : 'Select all'}
                      </span>
                    </button>
                  )}
                  {g.items.map(o => {
                    const on = selected.has(o.value)
                    return (
                      <button key={o.value} type="button" onClick={() => toggle(o.value)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-gray-50 transition-colors ${on ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                        <span className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${on ? 'border-transparent' : 'border-gray-300'}`}
                          style={on ? { backgroundColor: 'var(--color-primary)' } : undefined}>
                          {on && <Check size={11} className="text-white" />}
                        </span>
                        <span className="truncate">{o.label}</span>
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
