import { useNavigate } from 'react-router-dom'
import { useCountUp } from './useCountUp'

interface Props {
  received: number
  inProgress: number
  completedToday: number
  overdue: number
  pendingApprovals?: number
  title?: string
}

export function LabQueueCard({
  received, inProgress, completedToday, overdue, pendingApprovals = 0, title = 'Lab Queue',
}: Props) {
  const navigate = useNavigate()

  const lanes = [
    { value: useCountUp(received),       label: 'Received',  color: '#3b82f6', bg: '#eff6ff' },
    { value: useCountUp(inProgress),     label: 'In Progress', color: 'var(--color-primary)', bg: 'color-mix(in srgb, var(--color-primary) 8%, white)' },
    { value: useCountUp(completedToday), label: 'Done Today', color: '#10b981', bg: '#ecfdf5' },
    { value: useCountUp(overdue),        label: 'Overdue',   color: '#ef4444', bg: '#fef2f2' },
  ]

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col gap-4"
      style={{ borderLeft: '3px solid var(--color-primary)' }}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-gray-900">{title}</p>
        <button onClick={() => navigate('/lab/queue')}
          className="text-[10px] font-bold uppercase tracking-wider hover:opacity-70 transition-opacity"
          style={{ color: 'var(--color-primary)' }}>
          Open Queue →
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {lanes.map(({ value, label, color, bg }) => (
          <div key={label} className="rounded-xl p-3 text-center" style={{ backgroundColor: bg }}>
            <p className="text-3xl font-black font-mono tabular-nums leading-none" style={{ color }}>{value}</p>
            <p className="text-[10px] font-semibold mt-1.5" style={{ color, opacity: 0.75 }}>{label}</p>
          </div>
        ))}
      </div>

      {pendingApprovals > 0 && (
        <button onClick={() => navigate('/rep/approvals')}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-amber-50 border border-amber-100 hover:bg-amber-100 transition-colors">
          <span className="text-xs font-bold text-amber-800">{pendingApprovals} result{pendingApprovals !== 1 ? 's' : ''} pending approval</span>
          <span className="text-xs text-amber-500">Review →</span>
        </button>
      )}
    </div>
  )
}
