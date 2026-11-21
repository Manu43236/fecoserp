import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, ChevronDown, X, Plus, Check, Minus, Building2, MapPin, Drill } from 'lucide-react'
import { coverageApi, type CoverageSelection, type ClientTree } from '@/api/coverage'
import { clientsApi } from '@/api/clients'
import { SearchableDropdown } from '@/components/ui/SearchableDropdown'

interface NameInfo { name: string; clientName?: string | null; leaseName?: string | null }

interface Props {
  repId?: string
  selection: CoverageSelection
  onChange: (sel: CoverageSelection) => void
}

const EMPTY: CoverageSelection = { clientIds: [], leaseIds: [], wellIds: [] }

function Box({ state, disabled }: { state: 'on' | 'off' | 'mixed'; disabled?: boolean }) {
  const base = 'w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-colors'
  if (state === 'on')
    return <span className={`${base} border-transparent`} style={{ backgroundColor: disabled ? 'var(--color-accent)' : 'var(--color-primary)' }}><Check size={11} className="text-white" /></span>
  if (state === 'mixed')
    return <span className={`${base} border-transparent`} style={{ backgroundColor: 'var(--color-primary)' }}><Minus size={11} className="text-white" /></span>
  return <span className={`${base} ${disabled ? 'border-gray-200 bg-gray-50' : 'border-gray-300 bg-white'}`} />
}

export function CoverageEditor({ repId, selection, onChange }: Props) {
  const [names, setNames]         = useState<Record<string, NameInfo>>({})
  const [adding, setAdding]       = useState(false)
  const [addClientId, setAddClientId] = useState<string | null>(null)
  const [expanded, setExpanded]   = useState<Set<string>>(new Set())
  const [loadedRep, setLoadedRep] = useState<string | undefined>()
  const [loading, setLoading]     = useState(false)
  const [loadError, setLoadError] = useState(false)

  // Load this AR's existing coverage once (clients/leases/wells already pointing at this rep).
  useEffect(() => {
    if (!repId) { setLoadedRep(undefined); return }
    if (loadedRep === repId) return
    setLoading(true); setLoadError(false)
    coverageApi.get(repId)
      .then(r => {
        const d = r.data.data
        const nm: Record<string, NameInfo> = {}
        d.clients.forEach(c => { nm[c.id] = { name: c.name } })
        d.leases.forEach(l => { nm[l.id] = { name: l.name, clientName: l.clientName } })
        d.wells.forEach(w => { nm[w.id] = { name: w.name, leaseName: w.leaseName, clientName: w.clientName } })
        setNames(prev => ({ ...prev, ...nm }))
        onChange({ clientIds: d.clients.map(c => c.id), leaseIds: d.leases.map(l => l.id), wellIds: d.wells.map(w => w.id) })
        setLoadedRep(repId)
      })
      .catch(() => setLoadError(true))   // don't mark loaded — surface the failure, allow retry
      .finally(() => setLoading(false))
  }, [repId])  // eslint-disable-line react-hooks/exhaustive-deps

  const { data: clients = [] } = useQuery({
    queryKey: ['clients', 'all'],
    queryFn: () => clientsApi.list({ size: 1000 }).then(r => r.data.data.content),
    enabled: adding,
  })

  const { data: tree } = useQuery({
    queryKey: ['coverage-tree', addClientId],
    queryFn: () => coverageApi.clientTree(addClientId!).then(r => r.data.data),
    enabled: !!addClientId,
  })

  useEffect(() => {
    if (!tree) return
    const nm: Record<string, NameInfo> = { [tree.clientId]: { name: tree.clientName } }
    tree.leases.forEach(l => {
      nm[l.id] = { name: l.name, clientName: tree.clientName }
      l.wells.forEach(w => { nm[w.id] = { name: w.name, leaseName: l.name, clientName: tree.clientName } })
    })
    setNames(prev => ({ ...prev, ...nm }))
  }, [tree])

  // ── Toggle logic (broader scope collapses narrower; already-covered = no-op) ──
  function toggleClient(t: ClientTree) {
    if (selection.clientIds.includes(t.clientId)) {
      onChange({ ...selection, clientIds: selection.clientIds.filter(id => id !== t.clientId) })
    } else {
      const lIds = new Set(t.leases.map(l => l.id))
      const wIds = new Set(t.leases.flatMap(l => l.wells.map(w => w.id)))
      onChange({
        clientIds: [...selection.clientIds, t.clientId],
        leaseIds:  selection.leaseIds.filter(id => !lIds.has(id)),
        wellIds:   selection.wellIds.filter(id => !wIds.has(id)),
      })
    }
  }
  function toggleLease(lease: ClientTree['leases'][number]) {
    if (selection.leaseIds.includes(lease.id)) {
      onChange({ ...selection, leaseIds: selection.leaseIds.filter(id => id !== lease.id) })
    } else {
      const wIds = new Set(lease.wells.map(w => w.id))
      onChange({ ...selection, leaseIds: [...selection.leaseIds, lease.id], wellIds: selection.wellIds.filter(id => !wIds.has(id)) })
    }
  }
  function toggleWell(wellId: string) {
    onChange({ ...selection, wellIds: selection.wellIds.includes(wellId) ? selection.wellIds.filter(id => id !== wellId) : [...selection.wellIds, wellId] })
  }

  const totalCount = selection.clientIds.length + selection.leaseIds.length + selection.wellIds.length
  const label = (id: string) => names[id]?.name ?? id

  return (
    <div className="space-y-3">
      {/* Covering summary */}
      {loading ? (
        <p className="text-xs text-gray-400 px-3 py-2">Loading coverage…</p>
      ) : loadError ? (
        <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          Couldn’t load this rep’s coverage. The coverage service may be unavailable — refresh to retry.
        </p>
      ) : totalCount === 0 ? (
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          No coverage yet — this rep isn’t tied to any clients. Assign a rep on a Client/Lease/Well, or add coverage below.
        </p>
      ) : (
        <div className="space-y-1.5">
          {selection.clientIds.map(id => (
            <Chip key={id} icon={<Building2 size={11} />} main={label(id)} sub="entire operator" onRemove={() => onChange({ ...selection, clientIds: selection.clientIds.filter(x => x !== id) })} />
          ))}
          {selection.leaseIds.map(id => (
            <Chip key={id} icon={<MapPin size={11} />} main={label(id)} sub={names[id]?.clientName ?? 'lease'} onRemove={() => onChange({ ...selection, leaseIds: selection.leaseIds.filter(x => x !== id) })} />
          ))}
          {selection.wellIds.map(id => (
            <Chip key={id} icon={<Drill size={11} />} main={label(id)} sub={names[id]?.leaseName ?? 'well'} onRemove={() => onChange({ ...selection, wellIds: selection.wellIds.filter(x => x !== id) })} />
          ))}
        </div>
      )}

      {/* Add coverage */}
      {!adding ? (
        <button type="button" onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-gray-600 hover:border-gray-400 transition-colors">
          <Plus size={13} /> Add coverage
        </button>
      ) : (
        <div className="rounded-xl border border-gray-200 p-3 space-y-3 bg-gray-50/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-600">Add coverage</span>
            <button type="button" onClick={() => { setAdding(false); setAddClientId(null) }} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
          </div>

          <SearchableDropdown
            value={addClientId}
            onChange={v => { setAddClientId(v); setExpanded(new Set()) }}
            options={clients.map(c => ({ value: c.id, label: c.companyName }))}
            placeholder="Select a client…"
            searchPlaceholder="Search clients…"
            showClear={false}
          />

          {tree && (
            <div className="space-y-0.5 max-h-72 overflow-y-auto">
              {/* Entire client */}
              <button type="button" onClick={() => toggleClient(tree)}
                className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-white transition-colors text-left">
                <Box state={selection.clientIds.includes(tree.clientId) ? 'on' : 'off'} />
                <Building2 size={13} className="text-gray-400 shrink-0" />
                <span className="text-xs font-semibold text-gray-800 flex-1 truncate">Entire operator</span>
                <span className="text-[10px] text-gray-400">{tree.leases.length} leases</span>
              </button>

              {(() => {
                const clientWhole = selection.clientIds.includes(tree.clientId)
                return tree.leases.map(lease => {
                  const leaseOn = clientWhole || selection.leaseIds.includes(lease.id)
                  const leaseMixed = !leaseOn && lease.wells.some(w => selection.wellIds.includes(w.id))
                  const isOpen = expanded.has(lease.id)
                  return (
                    <div key={lease.id} className="pl-3">
                      <div className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white transition-colors">
                        <button type="button" disabled={clientWhole} onClick={() => toggleLease(lease)} className="flex items-center gap-2.5 flex-1 min-w-0 text-left disabled:cursor-not-allowed">
                          <Box state={leaseOn ? 'on' : leaseMixed ? 'mixed' : 'off'} disabled={clientWhole} />
                          <MapPin size={12} className="text-gray-400 shrink-0" />
                          <span className="text-xs font-medium text-gray-700 truncate">{lease.name}</span>
                        </button>
                        <span className="text-[10px] text-gray-400 shrink-0">{lease.wells.length}</span>
                        <button type="button" onClick={() => setExpanded(s => { const n = new Set(s); n.has(lease.id) ? n.delete(lease.id) : n.add(lease.id); return n })}
                          className="text-gray-400 hover:text-gray-600 shrink-0 disabled:opacity-30" disabled={lease.wells.length === 0}>
                          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                      </div>
                      {isOpen && lease.wells.map(well => {
                        const wellOn = leaseOn || selection.wellIds.includes(well.id)
                        return (
                          <button key={well.id} type="button" disabled={leaseOn} onClick={() => toggleWell(well.id)}
                            className="w-full flex items-center gap-2.5 pl-8 pr-2 py-1.5 rounded-lg hover:bg-white transition-colors text-left disabled:cursor-not-allowed">
                            <Box state={wellOn ? 'on' : 'off'} disabled={leaseOn} />
                            <Drill size={11} className="text-gray-400 shrink-0" />
                            <span className="text-xs text-gray-600 truncate">{well.name}</span>
                          </button>
                        )
                      })}
                    </div>
                  )
                })
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Chip({ icon, main, sub, onRemove }: { icon: React.ReactNode; main: string; sub: string; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white border border-gray-100">
      <span className="text-gray-400 shrink-0">{icon}</span>
      <span className="text-xs font-medium text-gray-800 truncate flex-1">{main}</span>
      <span className="text-[10px] text-gray-400 shrink-0">{sub}</span>
      <button type="button" onClick={onRemove} className="text-gray-300 hover:text-red-500 transition-colors shrink-0"><X size={13} /></button>
    </div>
  )
}

export { EMPTY as EMPTY_COVERAGE }
