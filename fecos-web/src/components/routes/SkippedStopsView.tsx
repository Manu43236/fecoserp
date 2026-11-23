import { useQuery } from '@tanstack/react-query'
import { MapPinOff } from 'lucide-react'
import { routesApi, type SkippedStopRecord } from '@/api/routes'

// Driver-side skip codes → readable text.
const REASON_LABEL: Record<string, string> = {
  GATE_LOCKED: 'Gate locked / no access',
  ROAD_BLOCKED: 'Road blocked',
  CUSTOMER_REFUSED: 'Customer refused delivery',
  TANK_FULL: 'Tank already full',
  OTHER: 'Other',
}
const reasonText = (r: string | null) => (r ? REASON_LABEL[r] ?? r : '—')

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

export function SkippedStopsView() {
  const { data, isLoading } = useQuery({
    queryKey: ['skipped-stops'],
    queryFn: () => routesApi.skippedStops().then(r => r.data.data ?? []),
  })
  const rows: SkippedStopRecord[] = data ?? []

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-gray-500">
          Stops a driver couldn't deliver. Review and schedule a new route for any that still need service.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: 'var(--color-primary)' }}>
              {['Client', 'Lease', 'Well', 'Reason', 'Date', 'Driver'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-white/90 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 6 }).map((_, j) => (
                  <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" /></td>
                ))}</tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-14 text-center">
                  <MapPinOff size={32} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-sm text-gray-500 font-medium">No skipped stops</p>
                  <p className="text-xs text-gray-400 mt-1">Every scheduled stop has been delivered.</p>
                </td>
              </tr>
            ) : rows.map(r => (
              <tr key={r.stopId} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900">{r.clientName ?? '—'}</td>
                <td className="px-4 py-3 text-gray-700">{r.leaseName ?? '—'}</td>
                <td className="px-4 py-3 text-gray-700">{r.wellName ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600 ring-1 ring-red-200">
                    {reasonText(r.skipReason)}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{fmtDate(r.routeDate)}</td>
                <td className="px-4 py-3 text-gray-600">{r.driverName ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>
    </div>
  )
}
