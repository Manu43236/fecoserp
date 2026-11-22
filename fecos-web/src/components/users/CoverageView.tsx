import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Building2, MapPin, Drill, ChevronRight, ChevronLeft } from 'lucide-react'
import { coverageApi, type CoverageData } from '@/api/coverage'

/** Read-only drill-down of an AR's clients → leases → wells, for the user detail drawer. */
export function CoverageView({ repId }: { repId: string }) {
  const [client, setClient] = useState<{ id: string; name: string } | null>(null)
  const [lease, setLease]   = useState<{ id: string; name: string } | null>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['coverage', repId],
    queryFn: () => coverageApi.get(repId).then(r => r.data.data),
  })

  if (isLoading) return <p className="text-xs text-gray-400">Loading clients…</p>
  if (isError)   return <p className="text-xs text-red-500">Couldn’t load clients.</p>
  const d = data as CoverageData

  // ── Level data derived from the compact coverage ──────────────────────────────
  const wholeClientIds = new Set(d.clients.map(c => c.id))
  const clientMap = new Map<string, string>()
  d.clients.forEach(c => clientMap.set(c.id, c.name))
  d.leases.forEach(l => l.clientId && clientMap.set(l.clientId, l.clientName ?? l.clientId))
  d.wells.forEach(w => w.clientId && clientMap.set(w.clientId, w.clientName ?? w.clientId))
  const clientList = [...clientMap.entries()].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name))

  const leasesOf = (clientId: string) => {
    const wholeLeaseIds = new Set(d.leases.filter(l => l.clientId === clientId).map(l => l.id))
    const m = new Map<string, string>()
    d.leases.filter(l => l.clientId === clientId).forEach(l => m.set(l.id, l.name))
    d.wells.filter(w => w.clientId === clientId && w.leaseId).forEach(w => m.set(w.leaseId!, w.leaseName ?? w.leaseId!))
    return { wholeLeaseIds, list: [...m.entries()].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name)) }
  }
  const wellsOf = (leaseId: string) =>
    d.wells.filter(w => w.leaseId === leaseId).map(w => ({ id: w.id, name: w.name })).sort((a, b) => a.name.localeCompare(b.name))

  if (clientList.length === 0) return <p className="text-xs text-gray-400">Not tied to any clients.</p>

  // ── Wells level ───────────────────────────────────────────────────────────────
  if (client && lease) {
    const wells = wellsOf(lease.id)
    return (
      <div className="space-y-1">
        <Crumb onBack={() => setLease(null)} icon={<MapPin size={11} />} text={lease.name} />
        {wells.length === 0
          ? <Row icon={<Drill size={12} />} text="Entire lease — all wells" muted />
          : wells.map(w => <Row key={w.id} icon={<Drill size={12} />} text={w.name} />)}
      </div>
    )
  }

  // ── Leases level ──────────────────────────────────────────────────────────────
  if (client) {
    if (wholeClientIds.has(client.id)) {
      return (
        <div className="space-y-1">
          <Crumb onBack={() => setClient(null)} icon={<Building2 size={11} />} text={client.name} />
          <Row icon={<MapPin size={12} />} text="Entire operator — all leases & wells" muted />
        </div>
      )
    }
    const { wholeLeaseIds, list } = leasesOf(client.id)
    return (
      <div className="space-y-1">
        <Crumb onBack={() => setClient(null)} icon={<Building2 size={11} />} text={client.name} />
        {list.map(l => (
          <Row key={l.id} icon={<MapPin size={12} />} text={l.name}
            sub={wholeLeaseIds.has(l.id) ? 'all wells' : undefined}
            onClick={wholeLeaseIds.has(l.id) ? undefined : () => setLease(l)} />
        ))}
      </div>
    )
  }

  // ── Clients level ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-1">
      {clientList.map(c => (
        <Row key={c.id} icon={<Building2 size={12} />} text={c.name}
          sub={wholeClientIds.has(c.id) ? 'entire operator' : undefined}
          onClick={() => setClient(c)} />
      ))}
    </div>
  )
}

function Crumb({ onBack, icon, text }: { onBack: () => void; icon: React.ReactNode; text: string }) {
  return (
    <button type="button" onClick={onBack} className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 hover:text-gray-900 mb-1">
      <ChevronLeft size={13} className="text-gray-400" />
      <span className="text-gray-400">{icon}</span>
      <span className="truncate">{text}</span>
    </button>
  )
}

function Row({ icon, text, sub, muted, onClick }: { icon: React.ReactNode; text: string; sub?: string; muted?: boolean; onClick?: () => void }) {
  const Comp = onClick ? 'button' : 'div'
  return (
    <Comp type={onClick ? 'button' : undefined} onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left ${onClick ? 'hover:bg-gray-50 cursor-pointer' : ''}`}>
      <span className={muted ? 'text-gray-300' : 'text-gray-400'}>{icon}</span>
      <span className={`text-xs flex-1 truncate ${muted ? 'text-gray-400 italic' : 'font-medium text-gray-700'}`}>{text}</span>
      {sub && <span className="text-[10px] text-gray-400 shrink-0">{sub}</span>}
      {onClick && <ChevronRight size={13} className="text-gray-300 shrink-0" />}
    </Comp>
  )
}
