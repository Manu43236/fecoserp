import { useNavigate } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { ArrowUpRight } from 'lucide-react'
import { useCountUp } from './useCountUp'

interface Props {
  label: string
  value: number
  icon: LucideIcon
  path?: string
  accent?: string   // color for number + icon, defaults to var(--color-primary)
  size?: 'sm' | 'md' | 'lg'
}

export function StatCard({ label, value, icon: Icon, path, accent, size = 'md' }: Props) {
  const navigate  = useNavigate()
  const displayed = useCountUp(value)
  const color     = accent ?? 'var(--color-primary)'

  const numberSize = size === 'lg' ? 'text-6xl' : size === 'sm' ? 'text-3xl' : 'text-5xl'

  return (
    <button
      onClick={() => path && navigate(path)}
      className={`group bg-white border border-gray-100 rounded-2xl p-5 text-left
        hover:shadow-md hover:border-gray-200 transition-all duration-200 w-full
        ${path ? 'cursor-pointer' : 'cursor-default'}`}
      style={{ borderLeft: `3px solid ${color}` }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `color-mix(in srgb, ${color} 12%, white)` }}>
          <Icon size={18} style={{ color }} />
        </div>
        {path && (
          <ArrowUpRight size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors mt-0.5" />
        )}
      </div>
      <p className={`font-black font-mono tabular-nums leading-none ${numberSize}`}
        style={{ color }}>
        {displayed}
      </p>
      <p className="text-[11px] font-bold text-gray-400 mt-2 uppercase tracking-widest">{label}</p>
    </button>
  )
}
