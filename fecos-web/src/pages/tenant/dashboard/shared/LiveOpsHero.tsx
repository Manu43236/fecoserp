import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useCountUp } from './useCountUp'

interface Props {
  activeVisits: number
  completedVisits: number
  scheduledVisits: number
  activeRoutes: number
  completedRoutes: number
}

function PulseDot({ active }: { active: boolean }) {
  if (!active) return <span className="w-2 h-2 rounded-full bg-white/20 inline-block" />
  return (
    <span className="relative inline-flex w-2.5 h-2.5">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
    </span>
  )
}

function AnimatedBar({ pct, color }: { pct: number; color: string }) {
  const [width, setWidth] = useState(0)
  useEffect(() => { const t = setTimeout(() => setWidth(pct), 200); return () => clearTimeout(t) }, [pct])
  return (
    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${width}%`, backgroundColor: color }} />
    </div>
  )
}

export function LiveOpsHero({ activeVisits, completedVisits, scheduledVisits, activeRoutes, completedRoutes }: Props) {
  const navigate = useNavigate()

  const totalVisits  = scheduledVisits + completedVisits
  const visitPct     = totalVisits > 0  ? Math.round((completedVisits  / totalVisits)  * 100) : 0
  const totalRoutes  = activeRoutes + completedRoutes
  const routePct     = totalRoutes > 0  ? Math.round((completedRoutes  / totalRoutes)  * 100) : 0

  const cVisits  = useCountUp(activeVisits)
  const cRoutes  = useCountUp(activeRoutes)
  const cVPct    = useCountUp(visitPct)
  const cRPct    = useCountUp(routePct)

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--color-dark)' }}>
      {/* top label */}
      <div className="flex items-center gap-2 px-6 pt-5 pb-0">
        <PulseDot active={activeVisits > 0 || activeRoutes > 0} />
        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Operations — Right Now</span>
      </div>

      {/* main grid */}
      <div className="grid grid-cols-2 divide-x divide-white/10 px-2 py-3">
        <button onClick={() => navigate('/schedule')}
          className="flex flex-col gap-3 px-4 py-4 hover:bg-white/5 rounded-xl transition-colors text-left">
          <div className="flex items-end gap-3">
            <span className="text-7xl font-black text-white font-mono tabular-nums leading-none">{cVisits}</span>
            <div className="mb-2">
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">active</p>
              <p className="text-sm font-bold text-white/70">visits</p>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-bold">
              <span className="text-white/40">{completedVisits} done · {Math.max(totalVisits - activeVisits - completedVisits, 0)} pending</span>
              <span className="text-emerald-400">{cVPct}%</span>
            </div>
            <AnimatedBar pct={visitPct} color="#34d399" />
          </div>
        </button>

        <button onClick={() => navigate('/routes')}
          className="flex flex-col gap-3 px-4 py-4 hover:bg-white/5 rounded-xl transition-colors text-left">
          <div className="flex items-end gap-3">
            <span className="text-7xl font-black text-white font-mono tabular-nums leading-none">{cRoutes}</span>
            <div className="mb-2">
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">active</p>
              <p className="text-sm font-bold text-white/70">routes</p>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-bold">
              <span className="text-white/40">{completedRoutes} done</span>
              <span style={{ color: 'var(--color-primary)' }}>{cRPct}%</span>
            </div>
            <AnimatedBar pct={routePct} color="var(--color-primary)" />
          </div>
        </button>
      </div>
    </div>
  )
}
