import { useNavigate } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { ArrowUpRight } from 'lucide-react'
import { useCountUp } from './useCountUp'

interface Props {
  label: string
  value: number
  icon: LucideIcon
  path?: string
  accent?: string
  size?: 'sm' | 'md' | 'lg'
  sub?: string   // secondary line below the label e.g. "2 active"
}

export function StatCard({ label, value, icon: Icon, path, accent, size = 'md', sub }: Props) {
  const navigate  = useNavigate()
  const displayed = useCountUp(value)
  const color     = accent ?? 'var(--color-primary)'

  const numberSize = size === 'lg' ? 'text-7xl' : size === 'sm' ? 'text-4xl' : 'text-6xl'

  return (
    <button
      onClick={() => path && navigate(path)}
      className={`group rounded-2xl p-5 text-left
        hover:shadow-lg transition-all duration-200 w-full
        ${path ? 'cursor-pointer' : 'cursor-default'}`}
      style={{
        backgroundColor: `color-mix(in srgb, ${color} 5%, white)`,
        border: `1.5px solid color-mix(in srgb, ${color} 15%, white)`,
      }}
    >
      <div className="flex items-start justify-between mb-5">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `color-mix(in srgb, ${color} 15%, white)` }}>
          <Icon size={18} style={{ color }} />
        </div>
        {path && (
          <ArrowUpRight size={14} className="opacity-20 group-hover:opacity-60 transition-opacity mt-0.5"
            style={{ color }} />
        )}
      </div>
      <p className={`font-black font-mono tabular-nums leading-none ${numberSize}`}
        style={{ color }}>
        {displayed}
      </p>
      <p className="text-[11px] font-bold mt-2.5 uppercase tracking-widest"
        style={{ color: `color-mix(in srgb, ${color} 60%, #6b7280)` }}>
        {label}
      </p>
      {sub && (
        <p className="text-[10px] font-semibold mt-0.5" style={{ color: `color-mix(in srgb, ${color} 45%, #9ca3af)` }}>
          {sub}
        </p>
      )}
    </button>
  )
}
