import { type ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  accent?: boolean  // left red border — for KPI cards
}

export function Card({ children, className = '', accent = false }: CardProps) {
  return (
    <div
      className={`bg-white rounded-md border p-4 ${className}`}
      style={{
        borderColor: 'var(--color-border)',
        borderLeftColor: accent ? 'var(--color-primary)' : undefined,
        borderLeftWidth: accent ? 4 : undefined,
      }}
    >
      {children}
    </div>
  )
}

interface KpiCardProps {
  label: string
  value: string | number
  sub?: string
}

export function KpiCard({ label, value, sub }: KpiCardProps) {
  return (
    <Card accent>
      <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>
        {label}
      </p>
      <p className="text-3xl font-bold mt-1 numeric" style={{ color: 'var(--color-text-primary)' }}>
        {value}
      </p>
      {sub && (
        <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>{sub}</p>
      )}
    </Card>
  )
}
