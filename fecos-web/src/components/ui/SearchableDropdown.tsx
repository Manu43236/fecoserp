import { useState, useEffect, useRef } from 'react'
import { Search, ChevronDown, Check } from 'lucide-react'

export interface DropdownOption {
  value: string
  label: string
  dot?: string   // optional Tailwind bg-* class for a colored indicator
  meta?: string  // optional secondary text (count, subtitle, etc.)
}

interface Props {
  value: string | null
  onChange: (v: string | null) => void
  options: DropdownOption[]
  placeholder?: string
  searchPlaceholder?: string
  className?: string
}

export function SearchableDropdown({
  value,
  onChange,
  options,
  placeholder = 'All',
  searchPlaceholder = 'Search…',
  className = '',
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

  const selected = options.find(o => o.value === value) ?? null
  const filtered  = options.filter(o => o.label.toLowerCase().includes(q.toLowerCase()))

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => { setOpen(o => !o); setQ('') }}
        className={`flex items-center gap-2 h-9 px-3 text-sm border rounded-lg outline-none transition whitespace-nowrap bg-white ${
          selected ? 'border-gray-300 font-medium text-gray-800' : 'border-gray-200 text-gray-500 hover:border-gray-300'
        }`}
      >
        {selected ? (
          <>
            {selected.dot && <span className={`w-2 h-2 rounded-full shrink-0 ${selected.dot}`} />}
            <span>{selected.label}</span>
          </>
        ) : (
          <span>{placeholder}</span>
        )}
        <ChevronDown size={13} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 w-56 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                autoFocus
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full h-8 pl-7 pr-2.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition"
              />
            </div>
          </div>
          <div className="py-1 max-h-60 overflow-y-auto">
            <button
              onClick={() => { onChange(null); setOpen(false) }}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-gray-50 transition-colors ${!value ? 'font-semibold text-gray-900' : 'text-gray-600'}`}
            >
              <span>{placeholder}</span>
              {!value && <Check size={12} className="text-gray-700" />}
            </button>
            {filtered.map(o => (
              <button
                key={o.value}
                onClick={() => { onChange(o.value); setOpen(false) }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-gray-50 transition-colors ${value === o.value ? 'font-semibold text-gray-900' : 'text-gray-600'}`}
              >
                <span className="flex items-center gap-2 min-w-0">
                  {o.dot && <span className={`w-2 h-2 rounded-full shrink-0 ${o.dot}`} />}
                  <span className="truncate">{o.label}</span>
                  {o.meta && <span className="text-gray-400 text-[10px] shrink-0">{o.meta}</span>}
                </span>
                {value === o.value && (
                  <Check size={12} className={o.dot ? o.dot.replace('bg-', 'text-') : 'text-gray-700'} />
                )}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-3 py-3 text-xs text-gray-400 text-center">No results</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
