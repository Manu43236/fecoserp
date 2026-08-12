import { type ReactNode } from 'react'

interface EmptyStateProps {
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-2">
      <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{title}</p>
      {description && (
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{description}</p>
      )}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}
