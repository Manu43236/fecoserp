import { useEffect, useState } from 'react'
import { useCountUp } from './useCountUp'

export interface CommandMetric {
  label: string
  value: number
  color?: string
  pulse?: boolean
}

interface Props {
  name: string
  role: string
  roleColor: string
  metrics: CommandMetric[]
}

function pad(n: number) { return String(n).padStart(2, '0') }

function LiveClock() {
  const [time, setTime] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  const h  = time.getHours() % 12 || 12
  const m  = pad(time.getMinutes())
  const s  = pad(time.getSeconds())
  const ap = time.getHours() >= 12 ? 'PM' : 'AM'
  return (
    <span className="font-mono text-white/50 text-xs tracking-wider">
      {h}:{m}:{s} {ap}
    </span>
  )
}

function MetricPill({ metric }: { metric: CommandMetric }) {
  const displayed = useCountUp(metric.value)
  return (
    <div className="flex flex-col items-center px-5 py-3 rounded-xl"
      style={{ backgroundColor: 'rgba(255,255,255,0.09)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="flex items-center gap-1.5">
        {metric.pulse && (
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ backgroundColor: metric.color ?? '#fff' }} />
            <span className="relative inline-flex rounded-full h-2 w-2"
              style={{ backgroundColor: metric.color ?? '#fff' }} />
          </span>
        )}
        <span className="text-3xl font-black font-mono tabular-nums leading-none"
          style={{ color: metric.color ?? '#fff' }}>
          {displayed}
        </span>
      </div>
      <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1.5 whitespace-nowrap">
        {metric.label}
      </span>
    </div>
  )
}

export function CommandBar({ name, role, roleColor, metrics }: Props) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })
  const hour     = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  // only show metrics that have non-zero values so we don't show a row of zeros
  const activeMetrics = metrics.filter(m => m.value > 0)

  return (
    <div className="rounded-2xl px-6 py-5 flex flex-col gap-5"
      style={{ background: `linear-gradient(135deg, var(--color-dark) 0%, color-mix(in srgb, var(--color-dark) 80%, black) 100%)` }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-white/50 text-xs font-medium">{greeting},</p>
            <p className="text-white text-2xl font-black leading-tight">{name}</p>
          </div>
          <span className="px-3 py-1.5 rounded-full text-xs font-black text-white tracking-wide"
            style={{ backgroundColor: roleColor }}>
            {role}
          </span>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <LiveClock />
          <span className="text-white/30 text-[11px]">{today}</span>
        </div>
      </div>

      {activeMetrics.length > 0 ? (
        <div className="flex gap-2 flex-wrap">
          {activeMetrics.map(m => <MetricPill key={m.label} metric={m} />)}
        </div>
      ) : (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
          style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
          <span className="text-xs font-semibold text-white/40">All quiet — no active operations right now</span>
        </div>
      )}
    </div>
  )
}
