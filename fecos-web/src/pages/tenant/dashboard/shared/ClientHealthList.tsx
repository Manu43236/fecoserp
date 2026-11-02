import { useNavigate } from 'react-router-dom'
import { ChevronRight, Building2 } from 'lucide-react'

export interface ClientHealthItem {
  id: string
  name: string
  isActive: boolean
  tankCritical: number
  tankWarning: number
  tankHealthy: number
  labPending: number
}

function TankDots({ critical, warning, healthy }: { critical: number; warning: number; healthy: number }) {
  const total = critical + warning + healthy
  if (total === 0) return <span className="text-[10px] text-gray-300">No tanks</span>
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {Array.from({ length: Math.min(critical, 6) }).map((_, i) => (
        <span key={`c${i}`} className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
      ))}
      {Array.from({ length: Math.min(warning, 6) }).map((_, i) => (
        <span key={`w${i}`} className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
      ))}
      {Array.from({ length: Math.min(healthy, 6) }).map((_, i) => (
        <span key={`h${i}`} className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
      ))}
      {total > 18 && (
        <span className="text-[9px] text-gray-400 ml-0.5">+{total - 18}</span>
      )}
    </div>
  )
}

interface Props {
  items: ClientHealthItem[]
  title?: string
}

export function ClientHealthList({ items, title = 'My Clients' }: Props) {
  const navigate = useNavigate()

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col gap-4"
      style={{ borderLeft: '3px solid var(--color-primary)' }}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-gray-900">{title}</p>
        <button onClick={() => navigate('/clients')}
          className="text-[10px] font-bold uppercase tracking-wider hover:opacity-70 transition-opacity"
          style={{ color: 'var(--color-primary)' }}>
          All Clients →
        </button>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Building2 size={28} className="text-gray-200" />
          <p className="text-sm text-gray-400">No client data</p>
        </div>
      ) : (
        <div className="space-y-1">
          {items.map(c => {
            const atRisk = c.tankCritical + c.tankWarning
            return (
              <button key={c.id} onClick={() => navigate('/clients')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-left group">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-black text-xs text-white"
                  style={{ backgroundColor: 'var(--color-primary)' }}>
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-gray-900 truncate">{c.name}</p>
                    {!c.isActive && (
                      <span className="text-[9px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full shrink-0">
                        Inactive
                      </span>
                    )}
                    {c.labPending > 0 && (
                      <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full shrink-0">
                        {c.labPending} lab
                      </span>
                    )}
                  </div>
                  <TankDots critical={c.tankCritical} warning={c.tankWarning} healthy={c.tankHealthy} />
                </div>
                {atRisk > 0 && (
                  <span className="text-[10px] font-black text-red-500 shrink-0">{atRisk} at risk</span>
                )}
                <ChevronRight size={13} className="text-gray-300 group-hover:text-gray-400 shrink-0" />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
