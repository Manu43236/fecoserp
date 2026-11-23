import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Package } from 'lucide-react'
import { routesApi, type RouteRecord } from '@/api/routes'
import { inventoryApi } from '@/api/inventory'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useDialogs } from '@/components/ui/DialogProvider'

/** Item id → typed quantity string, seeded from each item's planned quantity. */
function seedQuantities(route: RouteRecord): Record<string, string> {
  const seed: Record<string, string> = {}
  route.stops.forEach(s => s.items.forEach(i => { seed[i.id] = String(i.quantity) }))
  return seed
}

const stopLabel = (s: RouteRecord['stops'][number]) => s.wellName ?? s.leaseName ?? 'Stop'

function QtyRow({ name, unit, value, onChange, available, planned }: {
  name: string; unit: string; value: string; onChange: (v: string) => void
  available?: number; planned?: number
}) {
  const short = available !== undefined && planned !== undefined && available < planned
  return (
    <div className="flex items-start gap-2">
      <Package size={12} className="text-gray-400 shrink-0 mt-2" />
      <div className="flex-1 min-w-0">
        <span className="text-sm text-gray-700 truncate block">{name}</span>
        {available !== undefined && (
          <span className={`text-[11px] ${short ? 'text-red-600 font-semibold' : 'text-gray-400'}`}>
            Available: {available} {unit}
          </span>
        )}
      </div>
      <input
        type="number" step="0.01" min="0"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-24 h-8 px-2 text-sm rounded-lg border border-gray-200 outline-none focus:ring-2 text-right"
      />
      <span className="w-14 text-xs text-gray-400 mt-2">{unit}</span>
    </div>
  )
}

// ── Load confirmation (Dispatched → In Progress / "Start") ───────────────────────
export function RouteLoadDialog({ route, onClose, onDone }: {
  route: RouteRecord; onClose: () => void; onDone: () => void
}) {
  const dialogs = useDialogs()
  const [qty, setQty] = useState<Record<string, string>>(() => seedQuantities(route))
  const items = route.stops.flatMap(s => s.items.map(i => ({ ...i, stop: stopLabel(s) })))

  // Current stock at the pickup warehouse, so the dispatcher sees shortfalls (backend still gates).
  const { data: stock } = useQuery({
    queryKey: ['stock', route.warehouseId],
    queryFn: () => inventoryApi.stock({ warehouseId: route.warehouseId }).then(r => r.data.data ?? []),
    enabled: !!route.warehouseId,
  })
  const availableByProduct = new Map((stock ?? []).map(s => [s.productId, s.currentQty]))
  const anyShort = route.stops.some(s => s.items.some(i => {
    const a = availableByProduct.get(i.productId)
    return a !== undefined && a < i.quantity
  }))

  const mutation = useMutation({
    mutationFn: async () => {
      await routesApi.confirmLoad(route.id, items.map(i => ({ itemId: i.id, loadedQty: parseFloat(qty[i.id]) || 0 })))
      await routesApi.updateStatus(route.id, 'IN_PROGRESS')
    },
    onSuccess: () => { onDone(); onClose() },
    onError: () => dialogs.error({ title: 'Could not start route', message: 'Something went wrong confirming the load. Please try again.' }),
  })

  return (
    <Modal open onClose={onClose} title="Confirm load & start route" size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={mutation.isPending}>Cancel</Button>
          <Button variant="primary" loading={mutation.isPending} onClick={() => mutation.mutate()}>Start route</Button>
        </>
      }>
      {items.length === 0 ? (
        <p className="text-sm text-gray-500">No products on this route — nothing to load. You can still start the route.</p>
      ) : (
        <div className="space-y-4 max-h-[55vh] overflow-y-auto">
          <p className="text-xs text-gray-500">Confirm the quantity loaded onto the truck for each product.</p>
          {anyShort && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5">
              <p className="text-[11px] text-amber-700">
                ⚠ Some products are low in stock (shown in red). Loading is capped at what's available — the shortfall is recorded.
              </p>
            </div>
          )}
          {route.stops.filter(s => s.items.length > 0).map(s => (
            <div key={s.id} className="space-y-1.5">
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{stopLabel(s)}</p>
              {s.items.map(i => (
                <QtyRow key={i.id} name={i.productName ?? '—'} unit={i.unit}
                  value={qty[i.id] ?? ''} onChange={v => setQty(q => ({ ...q, [i.id]: v }))}
                  available={availableByProduct.get(i.productId)} planned={i.quantity} />
              ))}
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}

// ── Delivery entry (In Progress → Completed / "Complete") ────────────────────────
export function RouteDeliveryDialog({ route, onClose, onDone }: {
  route: RouteRecord; onClose: () => void; onDone: () => void
}) {
  const dialogs = useDialogs()
  const [qty, setQty] = useState<Record<string, string>>(() => seedQuantities(route))

  const mutation = useMutation({
    mutationFn: async () => {
      for (const s of route.stops) {
        const items = s.items.map(i => ({ itemId: i.id, actualQty: parseFloat(qty[i.id]) || 0 }))
        await routesApi.deliverStop(route.id, s.id, { items })
      }
      await routesApi.updateStatus(route.id, 'COMPLETED')
    },
    onSuccess: () => { onDone(); onClose() },
    onError: () => dialogs.error({ title: 'Could not complete route', message: 'Something went wrong recording the delivery. Please try again.' }),
  })

  return (
    <Modal open onClose={onClose} title="Record delivery & complete" size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={mutation.isPending}>Cancel</Button>
          <Button variant="primary" loading={mutation.isPending} onClick={() => mutation.mutate()}>Complete route</Button>
        </>
      }>
      {route.stops.length === 0 ? (
        <p className="text-sm text-gray-500">This route has no stops.</p>
      ) : (
        <div className="space-y-4 max-h-[55vh] overflow-y-auto">
          <p className="text-xs text-gray-500">Enter the quantity actually delivered at each stop.</p>
          {route.stops.map(s => (
            <div key={s.id} className="space-y-1.5">
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{stopLabel(s)}</p>
              {s.items.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No products at this stop.</p>
              ) : s.items.map(i => (
                <QtyRow key={i.id} name={i.productName ?? '—'} unit={i.unit}
                  value={qty[i.id] ?? ''} onChange={v => setQty(q => ({ ...q, [i.id]: v }))} />
              ))}
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}
