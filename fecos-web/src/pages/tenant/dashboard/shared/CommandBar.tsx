import { useEffect, useState } from 'react'
import { useCountUp } from './useCountUp'

export interface CommandMetric {
  label: string
  value: number
  color?: string   // override text color for the number
  pulse?: boolean  // pulsing dot indicator
}

interface Props {
  name: string
  role: string
  roleColor: string  // CSS value e.g. var(--color-primary)
  metrics: CommandMetric[]
}

function pad(n: number) { return String(n).padStart(2, '0') }

function LiveClock() {
  const [time, setTime] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  const h = time.getHours() % 12 || 12
  const m = pad(time.getMinutes())
  const s = pad(time.getSeconds())
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
    <div className="flex flex-col items-center px-5 py-2.5 rounded-xl"
      style={{ backgroundColor: 'rgba(255,255,255,0.07)' }}>
      <div className="flex items-center gap-1.5">
        {metric.pulse && (
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ backgroundColor: metric.color ?? '#fff' }} />
            <span className="relative inline-flex rounded-full h-2 w-2"
              style={{ backgroundColor: metric.color ?? '#fff' }} />
          </span>
        )}
        <span className="text-2xl font-black font-mono tabular-nums leading-none"
          style={{ color: metric.color ?? '#fff' }}>
          {displayed}
        </span>
      </div>
      <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">
        {metric.label}
      </span>
    </div>
  )
}

export function CommandBar({ name, role, roleColor, metrics }: Props) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="rounded-2xl px-6 py-5 flex flex-col gap-4"
      style={{ backgroundColor: 'var(--color-dark)' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-white/50 text-xs font-medium">{greeting},</p>
            <p className="text-white text-xl font-black leading-tight">{name}</p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold text-white"
            style={{ backgroundColor: roleColor }}>
            {role.replace(/_/g, ' ')}
          </span>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <LiveClock />
          <span className="text-white/30 text-[11px]">{today}</span>
        </div>
      </div>

      {metrics.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {metrics.map(m => <MetricPill key={m.label} metric={m} />)}
        </div>
      )}
    </div>
  )
}
