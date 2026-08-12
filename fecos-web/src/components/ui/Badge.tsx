import { STATUS_LABELS } from '@/constants'

type BadgeVariant = 'success' | 'warning' | 'critical' | 'info' | 'default'

const variantStyles: Record<BadgeVariant, { bg: string; color: string }> = {
  success:  { bg: 'var(--color-success-bg)',  color: 'var(--color-success)' },
  warning:  { bg: 'var(--color-warning-bg)',  color: 'var(--color-warning)' },
  critical: { bg: 'var(--color-critical-bg)', color: 'var(--color-critical)' },
  info:     { bg: 'var(--color-info-bg)',      color: 'var(--color-info)' },
  default:  { bg: '#F3F4F6',                  color: '#374151' },
}

const statusVariantMap: Record<string, BadgeVariant> = {
  COMPLETED: 'success', APPROVED: 'success', PASS: 'success', ACTIVE: 'success', SYNCED: 'success',
  PENDING: 'default', DRAFT: 'default', INACTIVE: 'default',
  IN_PROGRESS: 'info', SUBMITTED: 'info',
  OFF_TARGET: 'warning', SKIPPED: 'default', FAIL: 'warning', REJECTED: 'warning',
  CRITICAL: 'critical',
}

interface BadgeProps {
  status?: string
  variant?: BadgeVariant
  label?: string
}

export function Badge({ status, variant, label }: BadgeProps) {
  const resolvedVariant = variant ?? (status ? statusVariantMap[status] ?? 'default' : 'default')
  const { bg, color } = variantStyles[resolvedVariant]
  const text = label ?? (status ? STATUS_LABELS[status] ?? status : '')

  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: bg, color }}
    >
      {text}
    </span>
  )
}
