import { type ReactNode } from 'react'

interface Column<T> {
  key: string
  header: string
  render: (row: T) => ReactNode
  numeric?: boolean
}

interface TableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (row: T) => string
  loading?: boolean
  empty?: string
}

export function Table<T>({ columns, data, keyExtractor, loading = false, empty = 'No data' }: TableProps<T>) {
  return (
    <div className="w-full overflow-x-auto rounded-md border" style={{ borderColor: 'var(--color-border)' }}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b" style={{ backgroundColor: '#F8FAFC', borderColor: 'var(--color-border)' }}>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide ${col.numeric ? 'text-right font-mono' : ''}`}
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Loading...
              </td>
            </tr>
          )}
          {!loading && data.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                {empty}
              </td>
            </tr>
          )}
          {!loading && data.map((row) => (
            <tr
              key={keyExtractor(row)}
              className="border-b last:border-0 hover:bg-slate-50 transition-colors duration-150"
              style={{ borderColor: 'var(--color-border)' }}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`px-4 py-2.5 ${col.numeric ? 'text-right font-mono' : ''}`}
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
