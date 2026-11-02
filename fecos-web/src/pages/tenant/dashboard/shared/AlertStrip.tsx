import { useNavigate } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { ChevronRight } from 'lucide-react'
import { useCountUp } from './useCountUp'

export interface Alert {
  count: number
  label: string
  sub: string
  path: string
  icon: LucideIcon
  urgent?: boolean
}

function AlertBanner({ a }: { a: Alert }) {
  const navigate = useNavigate()
  const count    = useCountUp(a.count)
  const red      = a.urgent

  return (
    <button onClick={() => navigate(a.path)}
      className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-left transition-all duration-200 hover:scale-[1.005] active:scale-[0.998]"
      style={{
        backgroundColor: red ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.07)',
        border: `1.5px solid ${red ? 'rgba(239,68,68,0.25)' : 'rgba(245,158,11,0.22)'}`,
      }}>
      <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: red ? '#ef4444' : '#f59e0b' }}>
        <a.icon size={20} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold truncate" style={{ color: red ? '#b91c1c' : '#92400e' }}>
          {a.label}
        </p>
        <p className="text-xs mt-0.5 truncate" style={{ color: red ? '#ef4444' : '#d97706', opacity: 0.8 }}>
          {a.sub}
        </p>
      </div>
      <span className="text-4xl font-black font-mono tabular-nums shrink-0"
        style={{ color: red ? '#ef4444' : '#f59e0b' }}>
        {count}
      </span>
      <ChevronRight size={16} className="shrink-0" style={{ color: red ? '#ef4444' : '#f59e0b', opacity: 0.5 }} />
    </button>
  )
}

export function AlertStrip({ alerts }: { alerts: Alert[] }) {
  const visible = alerts.filter(a => a.count > 0)
  if (visible.length === 0) return null

  return (
    <div className="space-y-2.5">
      {visible.map(a => <AlertBanner key={a.label} a={a} />)}
    </div>
  )
}
