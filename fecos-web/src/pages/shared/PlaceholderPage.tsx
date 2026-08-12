interface Props { title: string }

export function PlaceholderPage({ title }: Props) {
  return (
    <div className="flex items-center justify-center h-64">
      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{title} — coming soon</p>
    </div>
  )
}
