import { useNavigate } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { useCountUp } from './useCountUp'
import { useEffect, useState } from 'react'

interface Props {
  title: string
  icon: LucideIcon
  scheduled: number
  active: number
  completed: number
  path: string
}

function AnimatedBar({ pct }: { pct: number }) {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), 100)
    return () => clearTimeout(t)
  }, [pct])
  return (
    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-700 ease-out"
        style={{ width: `${width}%`, backgroundColor: 'var(--color-primary)' }} />
    </div>
  )
}

export function OpsProgressCard({ title, icon: Icon, scheduled, active, completed, path }: Props) {
  const navigate  = useNavigate()
  const total     = scheduled + active + completed
  const pct       = total > 0 ? Math.round((completed / total) * 100) : 0
  const pending   = Math.max(scheduled - active, 0)

  const cActive    = useCountUp(active)
  const cCompleted = useCountUp(completed)
  const cPending   = useCountUp(pending)

  return (
    <button onClick={() => navigate(path)}
      className="flex-1 bg-white border border-gray-100 rounded-2xl p-5 text-left
        hover:shadow-md hover:border-gray-200 transition-all duration-200 group"
      style={{ borderLeft: '3px solid var(--color-primary)' }}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 10%, white)' }}>
            <Icon size={16} style={{ color: 'var(--color-primary)' }} />
          </div>
          <p className="text-sm font-bold text-gray-900">{title}</p>
        </div>
        {total > 0 && (
          <span className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: pct === 100 ? '#dcfce7' : 'color-mix(in srgb, var(--color-primary) 10%, white)',
              color: pct === 100 ? '#166534' : 'var(--color-primary)',
            }}>
            {pct}%
          </span>
        )}
      </div>

      {total === 0 ? (
        <p className="text-sm text-gray-400 pb-2">No activity today</p>
      ) : (
        <>
          <div className="flex gap-2 mb-4">
            {[
              { n: cActive,    label: 'Active',  bg: 'color-mix(in srgb, var(--color-primary) 10%, white)', col: 'var(--color-primary)' },
              { n: cCompleted, label: 'Done',    bg: '#ecfdf5', col: '#059669' },
              { n: cPending,   label: 'Pending', bg: '#f9fafb', col: '#6b7280' },
            ].map(({ n, label, bg, col }) => (
              <div key={label} className="flex-1 rounded-xl p-2.5 text-center" style={{ backgroundColor: bg }}>
                <p className="text-2xl font-black font-mono tabular-nums leading-none" style={{ color: col }}>{n}</p>
                <p className="text-[10px] font-semibold mt-0.5" style={{ color: col, opacity: 0.7 }}>{label}</p>
              </div>
            ))}
          </div>
          <AnimatedBar pct={pct} />
        </>
      )}
    </button>
  )
}
