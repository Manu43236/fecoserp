interface SkeletonProps { className?: string }

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`animate-pulse rounded bg-gray-200 ${className}`} />
  )
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="w-full rounded-md border overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
      <div className="h-10 bg-slate-50 border-b" style={{ borderColor: 'var(--color-border)' }} />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3 border-b last:border-0" style={{ borderColor: 'var(--color-border)' }}>
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function KpiCardSkeleton() {
  return (
    <div className="bg-white rounded-md border p-4" style={{ borderColor: 'var(--color-border)', borderLeftWidth: 4, borderLeftColor: 'var(--color-border)' }}>
      <Skeleton className="h-3 w-24 mb-2" />
      <Skeleton className="h-8 w-16 mb-1" />
      <Skeleton className="h-3 w-20" />
    </div>
  )
}
