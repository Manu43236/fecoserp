import { useEffect, useRef, useState } from 'react'
import { useQuery, useQueries } from '@tanstack/react-query'
import { X, Building2, MapPin, Drill } from 'lucide-react'
import { coverageApi, type CoverageSelection, type ClientTree } from '@/api/coverage'
import { clientsApi } from '@/api/clients'
import { MultiSelectDropdown, type MultiOption } from '@/components/ui/MultiSelectDropdown'

interface Props {
  repId?: string
  onChange: (sel: CoverageSelection) => void
}

/**
 * Account Rep client coverage. Three cascading levels:
 *   Clients → Leases (of picked clients) → Wells (of picked leases).
 * Compact rule emitted to the server: a picked client with NO leases picked = entire client;
 * a picked lease with NO wells picked = entire lease; otherwise scoped to exactly what's ticked.
 */
export function CoverageEditor({ repId, onChange }: Props) {
  const [clientIds, setClientIds] = useState<string[]>([])
  const [leaseIds, setLeaseIds]   = useState<string[]>([])
  const [wellIds, setWellIds]     = useState<string[]>([])
  const [loadedRep, setLoadedRep] = useState<string | undefined>()
  const [loading, setLoading]     = useState(false)
  const [loadError, setLoadError] = useState(false)
  const seededClients = useRef<Set<string>>(new Set())

  const { data: clients = [] } = useQuery({
    queryKey: ['clients', 'all'],
    queryFn: () => clientsApi.list({ size: 1000 }).then(r => r.data.data.content),
  })

  // One tree per picked client (leases + wells) — cached, lazy.
  const treeQueries = useQueries({
    queries: clientIds.map(id => ({
      queryKey: ['coverage-tree', id],
      queryFn: () => coverageApi.clientTree(id).then(r => r.data.data),
      staleTime: 60_000,
    })),
  })
  const trees: ClientTree[] = treeQueries.map(q => q.data).filter((t): t is ClientTree => !!t)
  const treeByClient = new Map(trees.map(t => [t.clientId, t]))

  // Load existing coverage once, expand compact → raw picks.
  useEffect(() => {
    if (!repId) { setLoadedRep(undefined); return }
    if (loadedRep === repId) return
    setLoading(true); setLoadError(false)
    coverageApi.get(repId)
      .then(r => {
        const d = r.data.data
        // A client is "in scope" if it has any coverage at any level.
        const cIds = new Set<string>(d.clients.map(c => c.id))
        d.leases.forEach(l => { if (l.clientId) cIds.add(l.clientId) })
        d.wells.forEach(w => { if (w.clientId) cIds.add(w.clientId) })
        const lIds = new Set<string>(d.leases.map(l => l.id))
        d.wells.forEach(w => { if (w.leaseId) lIds.add(w.leaseId) })
        setClientIds([...cIds])
        setLeaseIds([...lIds])
        setWellIds(d.wells.map(w => w.id))
        setLoadedRep(repId)
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false))
  }, [repId])  // eslint-disable-line react-hooks/exhaustive-deps

  // Prune leases/wells that no longer belong to a picked client once its tree is known.
  useEffect(() => {
    const loadedClientIds = trees.map(t => t.clientId)
    if (!loadedClientIds.length) return
    loadedClientIds.forEach(id => seededClients.current.add(id))
    const validLeases = new Set(trees.flatMap(t => t.leases.map(l => l.id)))
    const validWells  = new Set(trees.flatMap(t => t.leases.flatMap(l => l.wells.map(w => w.id))))
    // Only prune within clients whose tree is loaded (don't drop not-yet-loaded picks).
    const leaseClient = new Map(trees.flatMap(t => t.leases.map(l => [l.id, t.clientId] as const)))
    const wellLease   = new Map(trees.flatMap(t => t.leases.flatMap(l => l.wells.map(w => [w.id, l.id] as const))))
    setLeaseIds(prev => prev.filter(id => !leaseClient.has(id) || validLeases.has(id) || !seededClients.current.has(leaseClient.get(id)!)))
    setWellIds(prev => prev.filter(id => validWells.has(id) || !wellLease.has(id)))
  }, [trees.length])  // eslint-disable-line react-hooks/exhaustive-deps

  // Emit compact selection whenever picks change.
  useEffect(() => {
    const leasesByClient = new Map<string, Set<string>>()   // clientId → picked lease ids
    const wellsByLease = new Map<string, Set<string>>()      // leaseId → picked well ids
    for (const t of trees) {
      for (const l of t.leases) {
        if (leaseIds.includes(l.id)) {
          if (!leasesByClient.has(t.clientId)) leasesByClient.set(t.clientId, new Set())
          leasesByClient.get(t.clientId)!.add(l.id)
        }
        const pickedWells = l.wells.filter(w => wellIds.includes(w.id)).map(w => w.id)
        if (pickedWells.length) wellsByLease.set(l.id, new Set(pickedWells))
      }
    }
    // Client is "whole" if picked and has no lease picks under it.
    const wholeClients = clientIds.filter(c => !(leasesByClient.get(c)?.size))
    // Lease is "whole" if picked and has no well picks under it.
    const wholeLeases = leaseIds.filter(l => !(wellsByLease.get(l)?.size))
    onChange({ clientIds: wholeClients, leaseIds: wholeLeases, wellIds })
  }, [clientIds, leaseIds, wellIds, trees.length])  // eslint-disable-line react-hooks/exhaustive-deps

  // ── Options ──────────────────────────────────────────────────────────────────
  const clientOptions: MultiOption[] = clients.map(c => ({ value: c.id, label: c.companyName }))

  const leaseOptions: MultiOption[] = trees.flatMap(t =>
    t.leases.map(l => ({ value: l.id, label: l.name, group: t.clientId, groupLabel: t.clientName })))

  const pickedLeases = leaseOptions.filter(o => leaseIds.includes(o.value))
  const wellOptions: MultiOption[] = trees.flatMap(t =>
    t.leases.filter(l => leaseIds.includes(l.id)).flatMap(l =>
      l.wells.map(w => ({ value: w.id, label: w.name, group: l.id, groupLabel: l.name }))))

  const clientName = (id: string) => clients.find(c => c.id === id)?.companyName ?? id
  const leaseInfo  = (id: string) => leaseOptions.find(o => o.value === id)
  const wellInfo   = (id: string) => wellOptions.find(o => o.value === id)

  const removeClient = (id: string) => {
    setClientIds(prev => prev.filter(x => x !== id))
    const t = treeByClient.get(id)
    if (t) {
      const ls = new Set(t.leases.map(l => l.id))
      const ws = new Set(t.leases.flatMap(l => l.wells.map(w => w.id)))
      setLeaseIds(prev => prev.filter(x => !ls.has(x)))
      setWellIds(prev => prev.filter(x => !ws.has(x)))
    }
  }
  const removeLease = (id: string) => {
    setLeaseIds(prev => prev.filter(x => x !== id))
    const t = trees.find(t => t.leases.some(l => l.id === id))
    const ws = new Set(t?.leases.find(l => l.id === id)?.wells.map(w => w.id) ?? [])
    setWellIds(prev => prev.filter(x => !ws.has(x)))
  }

  if (loading) return <p className="text-xs text-gray-400 px-1 py-2">Loading clients…</p>
  if (loadError) return (
    <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
      Couldn’t load this rep’s clients. The service may be unavailable — refresh to retry.
    </p>
  )

  return (
    <div className="space-y-4">
      {/* 1 — Clients */}
      <Level label="Clients" icon={<Building2 size={11} />}>
        <MultiSelectDropdown
          value={clientIds} onChange={setClientIds} options={clientOptions}
          placeholder="Select clients…" searchPlaceholder="Search clients…"
        />
        <Chips items={clientIds.map(id => ({ id, main: clientName(id), sub: 'entire operator' }))}
          icon={<Building2 size={11} />} onRemove={removeClient} />
      </Level>

      {/* 2 — Leases (of picked clients) */}
      {clientIds.length > 0 && (
        <Level label="Leases" icon={<MapPin size={11} />} hint="Leave a client with no leases picked to cover all of it.">
          <MultiSelectDropdown
            value={leaseIds} onChange={setLeaseIds} options={leaseOptions}
            placeholder="Pick specific leases (optional)…" searchPlaceholder="Search leases…"
            emptyText="No leases for the selected clients"
          />
          <Chips items={leaseIds.map(id => ({ id, main: leaseInfo(id)?.label ?? id, sub: leaseInfo(id)?.groupLabel ?? 'lease' }))}
            icon={<MapPin size={11} />} onRemove={removeLease} />
        </Level>
      )}

      {/* 3 — Wells (of picked leases) */}
      {pickedLeases.length > 0 && (
        <Level label="Wells" icon={<Drill size={11} />} hint="Leave a lease with no wells picked to cover all of it.">
          <MultiSelectDropdown
            value={wellIds} onChange={setWellIds} options={wellOptions}
            placeholder="Pick specific wells (optional)…" searchPlaceholder="Search wells…"
            emptyText="No wells for the selected leases"
          />
          <Chips items={wellIds.map(id => ({ id, main: wellInfo(id)?.label ?? id, sub: wellInfo(id)?.groupLabel ?? 'well' }))}
            icon={<Drill size={11} />} onRemove={id => setWellIds(prev => prev.filter(x => x !== id))} />
        </Level>
      )}

      {clientIds.length === 0 && (
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          No clients yet — this rep isn’t tied to anyone. Add clients above, or assign a rep on a Client/Lease/Well.
        </p>
      )}
    </div>
  )
}

function Level({ label, icon, hint, children }: { label: string; icon: React.ReactNode; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">{icon} {label}</label>
      {hint && <p className="text-[11px] text-gray-400 -mt-0.5">{hint}</p>}
      {children}
    </div>
  )
}

function Chips({ items, icon, onRemove }: { items: { id: string; main: string; sub: string }[]; icon: React.ReactNode; onRemove: (id: string) => void }) {
  if (items.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1.5 pt-1">
      {items.map(it => (
        <span key={it.id} className="inline-flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-lg bg-gray-50 border border-gray-100 text-xs">
          <span className="text-gray-400 shrink-0">{icon}</span>
          <span className="font-medium text-gray-800 truncate max-w-[120px]">{it.main}</span>
          <span className="text-[10px] text-gray-400 shrink-0">{it.sub}</span>
          <button type="button" onClick={() => onRemove(it.id)} className="text-gray-300 hover:text-red-500 transition-colors shrink-0"><X size={12} /></button>
        </span>
      ))}
    </div>
  )
}
