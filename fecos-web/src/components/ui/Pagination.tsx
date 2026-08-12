import { Button } from './Button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  page: number
  total: number
  limit: number
  onChange: (page: number) => void
}

export function Pagination({ page, total, limit, onChange }: PaginationProps) {
  const totalPages = Math.ceil(total / limit)
  const from = (page - 1) * limit + 1
  const to = Math.min(page * limit, total)

  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between mt-4">
      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
        Showing <span className="numeric font-medium">{from}–{to}</span> of{' '}
        <span className="numeric font-medium">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          className="w-8 h-8 p-0 flex items-center justify-center"
        >
          <ChevronLeft size={14} />
        </Button>
        <span className="text-sm px-2 numeric" style={{ color: 'var(--color-text-secondary)' }}>
          {page} / {totalPages}
        </span>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
          className="w-8 h-8 p-0 flex items-center justify-center"
        >
          <ChevronRight size={14} />
        </Button>
      </div>
    </div>
  )
}
