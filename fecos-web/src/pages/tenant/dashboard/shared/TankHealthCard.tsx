import { useNavigate } from 'react-router-dom'
import { useCountUp } from './useCountUp'
import type { TankRecord } from '@/api/tanks'

const CRITICAL_COLOR = '#ef4444'
const WARNING_COLOR  = '#f59e0b'
const HEALTHY_COLOR  = '#10b981'

function levelColor(pct: number) {
  return pct < 30 ? CRITICAL_COLOR : pct < 60 ? WARNING_COLOR : HEALTHY_COLOR
}
function levelFill(pct: number) {
  return pct < 30 ? 'rgba(239,68,68,0.15)' : pct < 60 ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)'
}

function MiniCylinder({ tank }: { tank: TankRecord }) {
  const pct   = Math.min(Math.max(tank.calculatedLevelPct, 0), 100)
  const color = levelColor(pct)
  const fill  = levelFill(pct)
  const bW = 32, bH = 52, cx = 20, ry = 5, topY = 6, botY = topY + bH
  const fH = (bH * pct) / 100
  const fY = botY - fH
  return (
    <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white border shrink-0"
      style={{ borderColor: `${color}55`, minWidth: 64 }}>
      <svg width="40" height="68" viewBox="0 0 40 68">
        <defs><clipPath id={`th-${tank.id}`}><rect x={cx-bW/2} y={topY} width={bW} height={bH}/></clipPath></defs>
        <rect x={cx-bW/2} y={topY} width={bW} height={bH} fill="#f9fafb" stroke="#e5e7eb" strokeWidth="1.5"/>
        {fH > 0 && <rect x={cx-bW/2} y={fY} width={bW} height={fH} fill={fill} clipPath={`url(#th-${tank.id})`}/>}
        <ellipse cx={cx} cy={botY} rx={bW/2} ry={ry} fill={fH > 0 ? fill : '#f9fafb'} stroke="#e5e7eb" strokeWidth="1.5"/>
        <ellipse cx={cx} cy={topY} rx={bW/2} ry={ry} fill="#efefef" stroke="#e5e7eb" strokeWidth="1.5"/>
        <text x={cx} y={topY+bH/2+4} textAnchor="middle" fontSize="8" fontWeight="800" fill={color}>
          {pct.toFixed(1)}%
        </text>
      </svg>
      <span className="text-[9px] font-semibold text-gray-500 truncate max-w-[58px] text-center leading-tight">
        {tank.serialNumber ?? `${tank.capacityGallons}g`}
      </span>
    </div>
  )
}

interface Props {
  critical: number
  warning: number
  healthy: number
  atRiskTanks?: TankRecord[]
  title?: string
}

export function TankHealthCard({ critical, warning, healthy, atRiskTanks = [], title = 'Tank Health' }: Props) {
  const navigate = useNavigate()
  const total    = critical + warning + healthy

  const cCritical = useCountUp(critical)
  const cWarning  = useCountUp(warning)
  const cHealthy  = useCountUp(healthy)

  const hasCritical = critical > 0

  return (
    <div className="rounded-2xl p-5 flex flex-col gap-4 transition-colors"
      style={{
        backgroundColor: hasCritical ? 'rgba(239,68,68,0.04)' : 'white',
        border: `1.5px solid ${hasCritical ? 'rgba(239,68,68,0.25)' : '#f3f4f6'}`,
        borderLeft: `3px solid ${hasCritical ? '#ef4444' : 'var(--color-primary)'}`,
      }}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-gray-900">{title}</p>
        <button onClick={() => navigate('/tanks')}
          className="text-[10px] font-bold uppercase tracking-wider hover:opacity-70 transition-opacity"
          style={{ color: 'var(--color-primary)' }}>
          All Tanks →
        </button>
      </div>

      {total === 0 ? (
        <p className="text-sm text-gray-400">No tanks installed</p>
      ) : (
        <>
          <div className="flex">
            {[
              { count: cCritical, label: 'Critical', color: CRITICAL_COLOR },
              { count: cWarning,  label: 'Warning',  color: WARNING_COLOR  },
              { count: cHealthy,  label: 'Healthy',  color: HEALTHY_COLOR  },
            ].map(({ count, label, color }, i) => (
              <div key={label}
                className={`flex-1 text-center ${i > 0 ? 'border-l border-gray-100' : ''}`}>
                <p className="text-3xl font-black font-mono tabular-nums" style={{ color }}>{count}</p>
                <p className="text-[10px] font-semibold text-gray-400 mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* health bar */}
          <div className="flex rounded-full overflow-hidden h-1.5 bg-gray-100">
            {critical > 0 && <div style={{ flex: critical, backgroundColor: CRITICAL_COLOR }} />}
            {warning  > 0 && <div style={{ flex: warning,  backgroundColor: WARNING_COLOR  }} />}
            {healthy  > 0 && <div style={{ flex: healthy,  backgroundColor: HEALTHY_COLOR  }} />}
          </div>

          {atRiskTanks.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-0.5">
              {atRiskTanks.map(t => <MiniCylinder key={t.id} tank={t} />)}
            </div>
          )}
        </>
      )}
    </div>
  )
}
