import { useNavigate } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { ChevronRight } from 'lucide-react'

export interface Alert {
  count: number
  label: string
  sub: string
  path: string
  icon: LucideIcon
  urgent?: boolean   // red vs amber
}

export function AlertStrip({ alerts }: { alerts: Alert[] }) {
  const navigate  = useNavigate()
  const visible   = alerts.filter(a => a.count > 0)
  if (visible.length === 0) return null

  return (
    <div className="space-y-2">
      {visible.map(a => (
        <button key={a.label} onClick={() => navigate(a.path)}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors
            ${a.urgent
              ? 'bg-red-50 border border-red-200 hover:bg-red-100'
              : 'bg-amber-50 border border-amber-100 hover:bg-amber-100'}`}>
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0
            ${a.urgent ? 'bg-red-500' : 'bg-amber-500'}`}>
            <a.icon size={16} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-bold ${a.urgent ? 'text-red-800' : 'text-amber-800'}`}>
              {a.count} {a.label}
            </p>
            <p className={`text-xs truncate ${a.urgent ? 'text-red-500' : 'text-amber-600'}`}>{a.sub}</p>
          </div>
          <ChevronRight size={15} className={a.urgent ? 'text-red-300' : 'text-amber-300'} />
        </button>
      ))}
    </div>
  )
}
