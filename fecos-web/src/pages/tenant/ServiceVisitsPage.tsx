import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Plus, ClipboardList, ChevronRight, Trash2, FlaskConical, AlertTriangle, FileText, MapPin, Camera, PenLine, Search, CheckSquare, Square, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { serviceVisitsApi } from '@/api/serviceVisits'
import type { ServiceVisit, ServiceVisitStop, VisitStatus, VisitStopStatus, DueWell, TreatmentReport } from '@/api/serviceVisits'
import { usersApi } from '@/api/users'
import type { UserRecord } from '@/api/users'
import { wellsApi } from '@/api/wells'
import type { WellRecord } from '@/api/wells'
import { SearchableDropdown } from '@/components/ui/SearchableDropdown'

// ── PDF View ───────────────────────────────────────────────────────────────────

async function openReportPdf(visitId: string, stopId: string) {
  const res = await serviceVisitsApi.getPdfReport(visitId, stopId)
  const url = URL.createObjectURL(new Blob([res.data as BlobPart], { type: 'application/pdf' }))
  window.open(url, '_blank')
}

// ── Constants ──────────────────────────────────────────────────────────────────

const STATUS_OPTS = [
  { value: 'SCHEDULED',   label: 'Scheduled'   },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED',   label: 'Completed'   },
  { value: 'CANCELLED',   label: 'Cancelled'   },
]

const STOP_STATUS_OPTS = [
  { value: 'PENDING',   label: 'Pending'   },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'SKIPPED',   label: 'Skipped'   },
]

// ── Badges ─────────────────────────────────────────────────────────────────────

function statusBadge(status: VisitStatus) {
  const map: Record<VisitStatus, { label: string; cls: string }> = {
    SCHEDULED:   { label: 'Scheduled',   cls: 'bg-blue-100 text-blue-700'   },
    IN_PROGRESS: { label: 'In Progress', cls: 'bg-amber-100 text-amber-700' },
    COMPLETED:   { label: 'Completed',   cls: 'bg-green-100 text-green-700' },
    CANCELLED:   { label: 'Cancelled',   cls: 'bg-gray-100 text-gray-500'   },
  }
  const { label, cls } = map[status]
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{label}</span>
}

function stopDot(status: VisitStopStatus) {
  const map: Record<VisitStopStatus, { label: string; dot: string }> = {
    PENDING:   { label: 'Pending',   dot: 'bg-gray-400'  },
    COMPLETED: { label: 'Completed', dot: 'bg-green-500' },
    SKIPPED:   { label: 'Skipped',   dot: 'bg-amber-400' },
  }
  const { label, dot } = map[status]
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
      <span className="text-xs text-gray-600">{label}</span>
    </span>
  )
}

// ── Create Panel ───────────────────────────────────────────────────────────────

function VisitPanel({ onClose, onSaved, stUsers }: {
  onClose: () => void; onSaved: () => void; stUsers: UserRecord[]
}) {
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm]               = useState({ name: '', techId: '', visitDate: today, notes: '' })
  const [clientName, setClientName]   = useState('')
  const [leaseId, setLeaseId]         = useState('')
  const [selectedWellIds, setSelectedWellIds] = useState<string[]>([])

  const { data: wellsData } = useQuery({
    queryKey: ['wells-all'],
    queryFn:  () => wellsApi.list({ size: 500 }).then(r => r.data?.data?.content as WellRecord[] ?? []),
  })
  const allWells: WellRecord[] = wellsData ?? []

  // Unique clients
  const clientOpts = useMemo(() => {
    const seen = new Set<string>()
    return allWells
      .filter(w => w.clientName && !seen.has(w.clientName) && seen.add(w.clientName))
      .map(w => ({ value: w.clientName!, label: w.clientName! }))
  }, [allWells])

  // Leases for selected client
  const leaseOpts = useMemo(() => {
    if (!clientName) return []
    const seen = new Set<string>()
    return allWells
      .filter(w => w.clientName === clientName && !seen.has(w.leaseId) && seen.add(w.leaseId))
      .map(w => ({ value: w.leaseId, label: w.leaseName ?? w.leaseId }))
  }, [allWells, clientName])

  // Wells for selected lease
  const leaseWells = useMemo(() =>
    leaseId ? allWells.filter(w => w.leaseId === leaseId) : []
  , [allWells, leaseId])

  const toggleWell = (id: string) =>
    setSelectedWellIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const selectAll = () => setSelectedWellIds(leaseWells.map(w => w.id))
  const clearAll  = () => setSelectedWellIds([])

  const mutation = useMutation({
    mutationFn: () => serviceVisitsApi.create({
      name: form.name, techId: form.techId, visitDate: form.visitDate,
      notes: form.notes, wellIds: selectedWellIds,
    }),
    onSuccess: () => { toast.success('Schedule created'); onSaved() },
    onError:   () => toast.error('Failed to create schedule'),
  })

  const techOpts = stUsers.map(u => ({ value: u.id, label: u.fullName }))

  const submit = () => {
    if (!form.name.trim())           return toast.error('Enter a schedule name')
    if (!form.techId)                return toast.error('Select a service tech')
    if (!form.visitDate)             return toast.error('Select a date')
    if (!clientName)                 return toast.error('Select a client')
    if (!leaseId)                    return toast.error('Select a lease')
    if (selectedWellIds.length === 0) return toast.error('Select at least one well')
    mutation.mutate()
  }

  const inputCls = 'w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]'

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-black/20" />
      <div className="relative w-full md:w-[440px] h-full bg-white shadow-xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
          <h2 className="text-sm font-semibold text-gray-900">New Schedule</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Schedule Name *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. North District – Week 34" className={inputCls} />
          </div>

          {/* Tech */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Service Tech *</label>
            <SearchableDropdown value={form.techId}
              onChange={v => setForm(f => ({ ...f, techId: v ?? '' }))}
              options={techOpts} placeholder="Select service tech…" showClear={false} />
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Visit Date *</label>
            <input type="date" value={form.visitDate}
              onChange={e => setForm(f => ({ ...f, visitDate: e.target.value }))} className={inputCls} />
          </div>

          <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }} />

          {/* Client */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Client *</label>
            <SearchableDropdown value={clientName}
              onChange={v => { setClientName(v ?? ''); setLeaseId(''); setSelectedWellIds([]) }}
              options={clientOpts} placeholder="Select client…" showClear={false} />
          </div>

          {/* Lease */}
          <div>
            <label className={`block text-xs font-medium mb-1 ${clientName ? 'text-gray-700' : 'text-gray-400'}`}>
              Lease *
            </label>
            <SearchableDropdown value={leaseId}
              onChange={v => { setLeaseId(v ?? ''); setSelectedWellIds([]) }}
              options={leaseOpts} placeholder={clientName ? 'Select lease…' : 'Select a client first'}
              showClear={false} />
          </div>

          {/* Wells */}
          {leaseId && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-gray-700">
                  Wells * <span className="text-gray-400 font-normal">({leaseWells.length} available)</span>
                </label>
                <div className="flex items-center gap-2">
                  {selectedWellIds.length > 0 && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: 'var(--color-primary)' }}>
                      {selectedWellIds.length} selected
                    </span>
                  )}
                  {selectedWellIds.length < leaseWells.length
                    ? <button onClick={selectAll} className="text-xs text-[var(--color-primary)] hover:underline">All</button>
                    : <button onClick={clearAll}  className="text-xs text-gray-400 hover:underline">Clear</button>
                  }
                </div>
              </div>
              <div className="border border-gray-200 rounded-lg overflow-hidden max-h-52 overflow-y-auto">
                {leaseWells.map(w => {
                  const checked = selectedWellIds.includes(w.id)
                  return (
                    <button key={w.id} type="button" onClick={() => toggleWell(w.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors border-b border-gray-100 last:border-0 ${checked ? 'bg-[var(--color-primary)]/5' : 'hover:bg-gray-50'}`}>
                      {checked
                        ? <CheckSquare size={15} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                        : <Square size={15} className="text-gray-300 shrink-0" />}
                      <p className="text-xs font-semibold text-gray-900 truncate">{w.wellName}</p>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Notes <span className="text-gray-400">(optional)</span></label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]"
              placeholder="Any notes…" />
          </div>
        </div>

        <div className="px-5 py-4 flex gap-3 shrink-0" style={{ borderTop: '1px solid rgba(0,0,0,0.07)' }}>
          <button type="button" onClick={onClose}
            className="flex-1 h-10 text-sm font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={submit} disabled={mutation.isPending}
            className="flex-1 h-10 text-sm font-semibold rounded-lg text-white disabled:opacity-60 transition-colors"
            style={{ backgroundColor: 'var(--color-primary)' }}>
            {mutation.isPending ? 'Creating…' : 'Create Schedule'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Detail Drawer ──────────────────────────────────────────────────────────────

function VisitDrawer({ visit, onClose, onRefresh, wellOpts }: {
  visit: ServiceVisit; onClose: () => void; onRefresh: () => void; wellOpts: { value: string; label: string }[]
}) {
  const qc = useQueryClient()
  const [addingWell,  setAddingWell]  = useState(false)
  const [newWellId,   setNewWellId]   = useState('')
  const [reportStop,  setReportStop]  = useState<ServiceVisitStop | null>(null)
  const [ackNote,     setAckNote]     = useState('')
  const [showAckForm, setShowAckForm] = useState(false)
  const [pdfLoading,  setPdfLoading]  = useState(false)

  const { data: dueData } = useQuery({
    queryKey: ['due-wells', visit.visitDate],
    queryFn:  () => serviceVisitsApi.dueWells(visit.visitDate).then(r => r.data?.data as DueWell[] ?? []),
    enabled:  visit.status === 'SCHEDULED' || visit.status === 'IN_PROGRESS',
  })

  const { data: reportData, isLoading: reportLoading } = useQuery({
    queryKey: ['treatment-report', reportStop?.id],
    queryFn:  () => serviceVisitsApi.getTreatmentReport(visit.id, reportStop!.id).then(r => r.data?.data as TreatmentReport),
    enabled:  !!reportStop,
  })

  const dueWells: DueWell[] = dueData ?? []
  const alreadyAdded = new Set(visit.stops.map(s => s.wellId))
  const suggestions  = dueWells.filter(d => !alreadyAdded.has(d.wellId))

  const addStopMutation = useMutation({
    mutationFn: (wellId: string) => serviceVisitsApi.addStop(visit.id, { wellId }),
    onSuccess:  () => { toast.success('Well added'); onRefresh(); setNewWellId(''); setAddingWell(false) },
    onError:    () => toast.error('Failed to add well'),
  })

  const removeStopMutation = useMutation({
    mutationFn: (stopId: string) => serviceVisitsApi.removeStop(visit.id, stopId),
    onSuccess:  () => { toast.success('Well removed'); onRefresh() },
    onError:    () => toast.error('Failed to remove well'),
  })

  const updateStopMutation = useMutation({
    mutationFn: ({ stopId, data }: { stopId: string; data: { status?: VisitStopStatus } }) =>
      serviceVisitsApi.updateStop(visit.id, stopId, data),
    onSuccess: () => onRefresh(),
    onError:   () => toast.error('Failed to update stop'),
  })

  const updateVisitMutation = useMutation({
    mutationFn: (status: VisitStatus) => serviceVisitsApi.update(visit.id, { status }),
    onSuccess:  () => { toast.success('Status updated'); onRefresh() },
    onError:    () => toast.error('Failed to update status'),
  })

  const ackMutation = useMutation({
    mutationFn: () => serviceVisitsApi.acknowledgeSoar(visit.id, reportStop!.id, ackNote),
    onSuccess:  () => {
      toast.success('SOAR acknowledged')
      qc.invalidateQueries({ queryKey: ['treatment-report', reportStop?.id] })
      qc.invalidateQueries({ queryKey: ['service-visits'] })
      setShowAckForm(false)
      onRefresh()
    },
    onError: () => toast.error('Failed to acknowledge'),
  })

  const canEdit = visit.status === 'SCHEDULED' || visit.status === 'IN_PROGRESS'

  const fmt = (iso: string | null) => iso
    ? new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
    : '—'

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="fixed inset-0 bg-black/20" />
      <div className="relative w-[620px] h-full bg-white shadow-xl flex flex-col">

        {/* Header */}
        {reportStop ? (
          <div className="flex items-center gap-3 px-5 py-4 shrink-0" style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
            <button onClick={() => { setReportStop(null); setShowAckForm(false); setAckNote('') }}
              className="flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors shrink-0">
              ← Back
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">Treatment Report — {reportStop.wellName}</p>
              <p className="text-xs text-gray-500">{reportStop.leaseName} · {reportStop.clientName}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {reportStop && (
                <button
                  onClick={async () => {
                    setPdfLoading(true)
                    try { await openReportPdf(visit.id, reportStop.id) }
                    finally { setPdfLoading(false) }
                  }}
                  disabled={pdfLoading}
                  className="flex items-center justify-center w-8 h-8 rounded-lg border text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  style={{ borderColor: 'rgba(0,0,0,0.15)' }}
                  title="View PDF">
                  {pdfLoading ? <Loader2 size={15} className="animate-spin" /> : <FileText size={15} />}
                </button>
              )}
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 px-6 py-4 shrink-0" style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary)' }}>
              <ClipboardList size={14} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">{visit.name ?? visit.techName}</h2>
              <p className="text-xs text-gray-500">{visit.techName} · {new Date(visit.visitDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {statusBadge(visit.status)}
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 ml-1"><X size={18} /></button>
            </div>
          </div>
        )}

        {/* Body — Report View */}
        {reportStop ? (
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {reportLoading ? (
              <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
              ))}</div>
            ) : !reportData ? (
              <p className="text-sm text-gray-400 text-center py-10">Report not found</p>
            ) : (
              <>
                {/* Meta */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-0.5">Service Tech</p>
                    <p className="text-sm font-semibold text-gray-900">{reportData.techName}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-0.5">Client</p>
                    <p className="text-sm font-semibold text-gray-900">{reportData.clientName}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-0.5">Performed At</p>
                    <p className="text-sm font-semibold text-gray-900">{fmt(reportData.performedAt)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-0.5">Submitted At</p>
                    <p className="text-sm font-semibold text-gray-900">{fmt(reportData.submittedAt)}</p>
                  </div>
                </div>

                {/* GPS */}
                {reportData.gpsLat && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-2.5">
                    <MapPin size={14} className="text-gray-400 shrink-0" />
                    <span className="font-medium">{reportData.gpsLat.toFixed(6)}, {reportData.gpsLng?.toFixed(6)}</span>
                    <span className="text-xs text-gray-400 ml-auto">captured {fmt(reportData.gpsCapturedAt)}</span>
                  </div>
                )}

                {/* SOAR */}
                {reportData.soar && (
                  <div className={`p-3.5 rounded-xl border ${reportData.soarAckAt ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle size={14} className={reportData.soarAckAt ? 'text-amber-600' : 'text-red-600'} />
                        <p className={`text-sm font-semibold ${reportData.soarAckAt ? 'text-amber-700' : 'text-red-700'}`}>
                          SOAR — Special Observation / Action Required
                        </p>
                      </div>
                      {!reportData.soarAckAt && !showAckForm && (
                        <button onClick={() => setShowAckForm(true)}
                          className="h-7 px-3 text-xs font-semibold rounded-lg text-white shrink-0"
                          style={{ backgroundColor: 'var(--color-primary)' }}>
                          Acknowledge
                        </button>
                      )}
                    </div>
                    {reportData.soarNote && <p className={`text-sm mt-1.5 ${reportData.soarAckAt ? 'text-amber-800' : 'text-red-800'}`}>{reportData.soarNote}</p>}
                    {showAckForm && (
                      <div className="mt-3 space-y-2">
                        <textarea value={ackNote} onChange={e => setAckNote(e.target.value)} rows={2}
                          placeholder="Describe action taken…"
                          className="w-full px-3 py-2 text-sm border border-red-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-red-200 bg-white" />
                        <div className="flex gap-2">
                          <button onClick={() => ackMutation.mutate()} disabled={!ackNote.trim() || ackMutation.isPending}
                            className="h-8 px-4 text-xs font-semibold rounded-lg text-white disabled:opacity-60"
                            style={{ backgroundColor: 'var(--color-primary)' }}>
                            {ackMutation.isPending ? 'Saving…' : 'Confirm Acknowledgement'}
                          </button>
                          <button onClick={() => setShowAckForm(false)}
                            className="h-8 px-3 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                    {reportData.soarAckAt && (
                      <div className="mt-2 pt-2 border-t border-amber-200">
                        <p className="text-xs font-semibold text-amber-700">Acknowledged by {reportData.soarAckByName} · {fmt(reportData.soarAckAt)}</p>
                        {reportData.soarAckNote && <p className="text-xs text-amber-800 mt-0.5">{reportData.soarAckNote}</p>}
                      </div>
                    )}
                  </div>
                )}

                {/* Site Photo */}
                {reportData.photoUrl && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Camera size={12} /> Site Photo
                    </p>
                    <img src={reportData.photoUrl} alt="Site photo" className="w-full rounded-xl object-cover max-h-72 border border-gray-200" />
                    {reportData.photoCapturedAt && <p className="text-xs text-gray-400 mt-1">Captured {fmt(reportData.photoCapturedAt)}</p>}
                  </div>
                )}

                {/* Treatment Lines */}
                {reportData.lines.length === 0 && (
                  <div className="flex items-start gap-2.5 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                    <span className="mt-0.5">⚠</span>
                    <span>No treatment line data was submitted with this report. The service tech may have encountered a plan loading error on the app.</span>
                  </div>
                )}
                {reportData.lines.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Treatment Lines</p>
                    <div className="space-y-3">
                      {reportData.lines.map(l => {
                        const isCi = l.method === 'CONTINUOUS'
                        return (
                          <div key={l.id} className="border border-gray-200 rounded-xl overflow-hidden text-sm">
                            <div className={`flex items-center justify-between px-3 py-2.5 ${isCi ? 'bg-blue-50' : 'bg-purple-50'}`}>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${isCi ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                                  {isCi ? 'CI' : 'Batch'}
                                </span>
                                <span className="font-semibold text-gray-900">{l.productName ?? l.method}</span>
                              </div>
                              {isCi && l.onRate !== null && (
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${l.onRate ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                  {l.onRate ? 'On Rate' : 'Off Rate'}
                                </span>
                              )}
                              {!isCi && (
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${l.applied ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                  {l.applied ? 'Applied' : 'Not Applied'}
                                </span>
                              )}
                            </div>
                            <div className="px-3 py-3 space-y-2.5">
                              {(l.tankSerial || l.tankLevelPct != null) && (
                                <div className="flex items-center gap-4 text-xs">
                                  {l.tankSerial && <span className="text-gray-600"><span className="text-gray-400">Tank </span>{l.tankSerial}</span>}
                                  {l.tankCapacityGallons != null && <span className="text-gray-500">{l.tankCapacityGallons} gal capacity</span>}
                                  {l.tankLevelPct != null && (
                                    <span className={`font-semibold ${l.tankLevelPct < 10 ? 'text-red-600' : l.tankLevelPct < 25 ? 'text-amber-600' : 'text-green-700'}`}>
                                      {l.tankLevelPct.toFixed(2)}% level
                                    </span>
                                  )}
                                </div>
                              )}
                              {isCi && (
                                <div className="grid grid-cols-3 gap-3 text-xs">
                                  <div className="bg-gray-50 rounded-lg px-2.5 py-2">
                                    <p className="text-gray-400 mb-0.5">Pump</p>
                                    <p className={`font-semibold ${l.pumpRunning ? 'text-green-700' : 'text-red-600'}`}>
                                      {l.pumpRunning ? 'Running' : 'Down'}
                                    </p>
                                  </div>
                                  <div className="bg-gray-50 rounded-lg px-2.5 py-2">
                                    <p className="text-gray-400 mb-0.5">Rate Found</p>
                                    <p className="font-semibold text-gray-800">{l.rateFound != null ? `${l.rateFound} gal/day` : '—'}</p>
                                  </div>
                                  <div className="bg-gray-50 rounded-lg px-2.5 py-2">
                                    <p className="text-gray-400 mb-0.5">Rate Set To</p>
                                    <p className="font-semibold text-gray-800">{l.rateSetTo != null ? `${l.rateSetTo} gal/day` : '—'}</p>
                                  </div>
                                </div>
                              )}
                              {isCi && !l.pumpRunning && l.pumpDownReason && (
                                <p className="text-xs text-red-700 bg-red-50 rounded-lg px-2.5 py-2">
                                  <span className="font-medium">Pump down: </span>{l.pumpDownReason}
                                </p>
                              )}
                              {isCi && l.deviationReason && (
                                <p className="text-xs text-amber-800 bg-amber-50 rounded-lg px-2.5 py-2">
                                  <span className="font-medium">Rate change reason: </span>{l.deviationReason}
                                </p>
                              )}
                              {!isCi && l.quantityApplied != null && (
                                <div className="bg-gray-50 rounded-lg px-2.5 py-2 text-xs">
                                  <p className="text-gray-400 mb-0.5">Quantity Applied</p>
                                  <p className="font-semibold text-gray-800">{l.quantityApplied} gal</p>
                                </div>
                              )}
                              {l.notes && <p className="text-xs text-gray-500 italic">{l.notes}</p>}
                              {l.recordedAt && <p className="text-xs text-gray-400">Recorded {fmt(l.recordedAt)}</p>}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Sample */}
                {(reportData.sampleType || reportData.sampleNotes || reportData.samplePhotoUrl) && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <FlaskConical size={12} /> Sample
                    </p>
                    <div className="border border-blue-100 bg-blue-50/50 rounded-xl p-3 space-y-2">
                      {reportData.sampleType && (
                        <div>
                          <p className="text-xs text-gray-400">Sample Type</p>
                          <p className="text-sm font-semibold text-gray-900">{reportData.sampleType}</p>
                        </div>
                      )}
                      {reportData.sampleNotes && (
                        <div>
                          <p className="text-xs text-gray-400">Sample Notes</p>
                          <p className="text-sm text-gray-700">{reportData.sampleNotes}</p>
                        </div>
                      )}
                      {reportData.samplePhotoUrl && (
                        <div>
                          <p className="text-xs text-gray-400 mb-1.5">Sample Photo</p>
                          <img src={reportData.samplePhotoUrl} alt="Sample bottle"
                            className="w-full rounded-xl object-cover max-h-56 border border-blue-200" />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Signature */}
                {(reportData.signatureUrl || reportData.signerName) && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <PenLine size={12} /> Operator Signature
                    </p>
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                      <div className="bg-gray-50 flex items-center justify-center min-h-[90px] border-b border-gray-200 p-3">
                        {reportData.signatureUrl ? (
                          <img src={reportData.signatureUrl} alt="Signature"
                            className="max-h-20 object-contain" />
                        ) : (
                          <PenLine size={24} className="text-gray-300" />
                        )}
                      </div>
                      <div className="px-3 py-2.5 flex items-center justify-between bg-white">
                        <div>
                          <p className="text-xs text-gray-400">Operator</p>
                          <p className="text-sm font-semibold text-gray-900">{reportData.signerName ?? '—'}</p>
                        </div>
                        {reportData.signedAt && (
                          <div className="text-right">
                            <p className="text-xs text-gray-400">Signed</p>
                            <p className="text-xs font-medium text-gray-600">{fmt(reportData.signedAt)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {reportData.notes && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Notes</p>
                    <p className="text-sm text-gray-700 bg-gray-50 rounded-xl px-3 py-2.5">{reportData.notes}</p>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (

        /* Body — Wells List View */
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Due Today Suggestions */}
          {canEdit && suggestions.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Due Today</p>
              <div className="space-y-1.5">
                {suggestions.map(d => (
                  <div key={d.wellId} className="flex items-center justify-between px-3 py-2 bg-amber-50 border border-amber-100 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{d.wellName}</p>
                      <p className="text-xs text-gray-500">{d.leaseName} · {d.schedule.charAt(0) + d.schedule.slice(1).toLowerCase()}
                        {d.daysSinceLastVisit != null ? ` · ${d.daysSinceLastVisit}d ago` : ' · Never visited'}
                      </p>
                    </div>
                    <button onClick={() => addStopMutation.mutate(d.wellId)}
                      disabled={addStopMutation.isPending}
                      className="h-7 px-3 text-xs font-semibold rounded-lg text-white disabled:opacity-60"
                      style={{ backgroundColor: 'var(--color-primary)' }}>
                      + Add
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Other Well */}
          {canEdit && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Add Well</p>
              {addingWell ? (
                <div className="flex gap-2">
                  <div className="flex-1">
                    <SearchableDropdown
                      value={newWellId}
                      onChange={v => setNewWellId(v ?? '')}
                      options={wellOpts.filter(w => !alreadyAdded.has(w.value))}
                      placeholder="Search wells…"
                      showClear={false}
                    />
                  </div>
                  <button onClick={() => { if (newWellId) addStopMutation.mutate(newWellId) }}
                    disabled={!newWellId || addStopMutation.isPending}
                    className="h-9 px-3 text-sm font-semibold rounded-lg text-white disabled:opacity-60"
                    style={{ backgroundColor: 'var(--color-primary)' }}>
                    Add
                  </button>
                  <button onClick={() => { setAddingWell(false); setNewWellId('') }}
                    className="h-9 px-3 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button onClick={() => setAddingWell(true)}
                  className="flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                  <Plus size={13} /> Add Other Well
                </button>
              )}
            </div>
          )}

          {/* Stops */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Wells ({visit.stops.length})
            </p>
            {visit.stops.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No wells added yet</p>
            ) : (
              <div className="space-y-2">
                {visit.stops.map((stop, i) => (
                  <StopCard key={stop.id} stop={stop} index={i}
                    canEdit={canEdit}
                    onRemove={() => removeStopMutation.mutate(stop.id)}
                    onStatusChange={s => updateStopMutation.mutate({ stopId: stop.id, data: { status: s } })}
                    onViewReport={() => setReportStop(stop)}
                  />
                ))}
              </div>
            )}
          </div>

          {visit.notes && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Notes</p>
              <p className="text-sm text-gray-700">{visit.notes}</p>
            </div>
          )}
        </div>
        )}

        {/* Footer — only on wells list view */}
        {!reportStop && (
          <div className="px-6 py-4 flex gap-3 shrink-0" style={{ borderTop: '1px solid rgba(0,0,0,0.07)' }}>
            {visit.status === 'SCHEDULED' && (
              <button onClick={() => updateVisitMutation.mutate('CANCELLED')}
                className="flex items-center gap-1.5 h-10 px-4 text-sm font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors">
                Cancel Visit
              </button>
            )}
            {visit.status === 'SCHEDULED' && (
              <button onClick={() => updateVisitMutation.mutate('IN_PROGRESS')}
                disabled={updateVisitMutation.isPending}
                className="flex-1 h-10 text-sm font-semibold rounded-lg text-white transition-colors"
                style={{ backgroundColor: 'var(--color-primary)' }}>
                Mark In Progress
              </button>
            )}
            {visit.status === 'IN_PROGRESS' && (
              <button onClick={() => updateVisitMutation.mutate('COMPLETED')}
                disabled={updateVisitMutation.isPending}
                className="flex-1 h-10 text-sm font-semibold rounded-lg text-white transition-colors"
                style={{ backgroundColor: 'var(--color-primary)' }}>
                Mark Completed
              </button>
            )}
            {(visit.status === 'COMPLETED' || visit.status === 'CANCELLED') && (
              <p className="flex-1 text-center text-sm text-gray-400 self-center">Visit {visit.status.toLowerCase()}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Stop Card ──────────────────────────────────────────────────────────────────

function StopCard({ stop, index, canEdit, onRemove, onStatusChange, onViewReport }: {
  stop: ServiceVisitStop; index: number; canEdit: boolean
  onRemove: () => void; onStatusChange: (s: VisitStopStatus) => void
  onViewReport: () => void
}) {
  return (
    <div className={`border rounded-xl p-3 bg-white ${stop.hasSoar && !stop.soarAcknowledged ? 'border-red-200' : stop.hasSoar ? 'border-amber-200' : 'border-gray-200'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5">
          <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
            {index + 1}
          </span>
          <div>
            <p className="text-sm font-medium text-gray-900">{stop.wellName}</p>
            <p className="text-xs text-gray-500">{stop.leaseName} · {stop.clientName}</p>
            {stop.hasSoar && !stop.soarAcknowledged && (
              <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-700">
                <AlertTriangle size={10} /> SOAR — Needs Acknowledgement
              </span>
            )}
            {stop.hasSoar && stop.soarAcknowledged && (
              <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-700">
                <AlertTriangle size={10} /> SOAR — Acknowledged
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {canEdit && (
            <button onClick={onRemove} className="text-gray-300 hover:text-red-400 transition-colors">
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="mt-2.5 flex items-center gap-2 flex-wrap">
        {canEdit ? (
          <select value={stop.status}
            onChange={e => onStatusChange(e.target.value as VisitStopStatus)}
            className="h-7 px-2 text-xs border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20">
            {STOP_STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ) : (
          stopDot(stop.status)
        )}

        {stop.hasReport && (
          <button onClick={onViewReport}
            className="flex items-center gap-1 h-7 px-2.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
            <FileText size={11} /> View Report
          </button>
        )}
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function ServiceVisitsPage() {
  const [searchText,   setSearchText]   = useState('')
  const [dateFrom,     setDateFrom]     = useState('')
  const [dateTo,       setDateTo]       = useState('')
  const [statusFilter, setStatusFilter] = useState<VisitStatus | 'ALL'>('ALL')
  const [techFilter,   setTechFilter]   = useState('')
  const [page,         setPage]         = useState(0)
  const [showPanel,    setShowPanel]    = useState(false)
  const [activeVisit,  setActiveVisit]  = useState<ServiceVisit | null>(null)

  const qc = useQueryClient()

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn:  () => usersApi.list().then(r => r.data?.data as UserRecord[] ?? []),
  })
  const allUsers: UserRecord[] = usersData ?? []
  const stUsers  = allUsers.filter(u => u.role === 'SERVICE_TECH')
  const techOpts = stUsers.map(u => ({ value: u.id, label: u.fullName }))

  const { data: wellsData } = useQuery({
    queryKey: ['wells-list'],
    queryFn:  () => import('@/api/wells').then(m =>
      m.wellsApi.list({ size: 200 }).then(r => r.data?.data?.content ?? [])
    ),
  })
  const wellOpts = (wellsData ?? []).map((w: { id: string; wellName: string }) => ({ value: w.id, label: w.wellName }))

  const { data, isLoading } = useQuery({
    queryKey: ['service-visits', page, statusFilter, techFilter, dateFrom, dateTo],
    queryFn:  () => serviceVisitsApi.list({
      page,
      size: 20,
      status:   statusFilter !== 'ALL' ? statusFilter : undefined,
      techId:   techFilter || undefined,
      dateFrom: dateFrom || undefined,
      dateTo:   dateTo   || undefined,
    }).then(r => r.data?.data),
  })

  const visits: ServiceVisit[] = data?.content ?? []
  const totalPages: number     = data?.totalPages ?? 0
  const totalElements: number  = data?.totalElements ?? 0

  const filteredVisits = useMemo(() =>
    searchText
      ? visits.filter(v =>
          (v.name ?? '').toLowerCase().includes(searchText.toLowerCase()) ||
          v.techName.toLowerCase().includes(searchText.toLowerCase())
        )
      : visits
  , [visits, searchText])

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['service-visits'] })
    if (activeVisit) {
      serviceVisitsApi.get(activeVisit.id).then(r => setActiveVisit(r.data?.data ?? null))
    }
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Service Visits</h1>
          <p className="text-sm text-gray-500 mt-0.5">{totalElements} visit{totalElements !== 1 ? 's' : ''} total</p>
        </div>
        <button onClick={() => setShowPanel(true)}
          className="flex items-center gap-2 h-9 px-4 text-sm font-semibold rounded-lg text-white"
          style={{ backgroundColor: 'var(--color-primary)' }}>
          <Plus size={15} /> New Visit
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search visits…" value={searchText}
            onChange={e => setSearchText(e.target.value)}
            className="h-9 pl-8 pr-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] w-48" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 whitespace-nowrap">From</label>
          <input type="date" value={dateFrom}
            onChange={e => { setDateFrom(e.target.value); setPage(0) }}
            className="h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 whitespace-nowrap">To</label>
          <input type="date" value={dateTo}
            onChange={e => { setDateTo(e.target.value); setPage(0) }}
            className="h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]" />
        </div>
        <div className="w-44">
          <SearchableDropdown
            value={techFilter}
            onChange={v => { setTechFilter(v ?? ''); setPage(0) }}
            options={techOpts}
            placeholder="All Techs"
            showClear={true}
          />
        </div>
        <div className="w-40">
          <SearchableDropdown
            value={statusFilter === 'ALL' ? '' : statusFilter}
            onChange={v => { setStatusFilter((v as VisitStatus) || 'ALL'); setPage(0) }}
            options={STATUS_OPTS}
            placeholder="All Statuses"
            showClear={true}
          />
        </div>
        {(searchText || dateFrom || dateTo || techFilter || statusFilter !== 'ALL') && (
          <button onClick={() => { setSearchText(''); setDateFrom(''); setDateTo(''); setTechFilter(''); setStatusFilter('ALL'); setPage(0) }}
            className="flex items-center gap-1.5 h-9 px-3 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <X size={13} /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead>
            <tr className="text-xs font-semibold uppercase tracking-wide text-white" style={{ backgroundColor: 'var(--color-primary)' }}>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Service Tech</th>
              <th className="px-4 py-3 text-left">Wells</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={5} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" /></td></tr>
              ))
            ) : filteredVisits.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-400">No service visits found</td></tr>
            ) : filteredVisits.map(v => (
              <tr key={v.id} onClick={() => setActiveVisit(v)}
                className="hover:bg-gray-50 cursor-pointer transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{v.name ?? new Date(v.visitDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                  {v.name && <p className="text-xs text-gray-400 mt-0.5">{new Date(v.visitDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>}
                </td>
                <td className="px-4 py-3 text-gray-700">{v.techName}</td>
                <td className="px-4 py-3 text-gray-700">
                  <span className="inline-flex items-center gap-1.5 flex-wrap">
                    <span className="inline-flex items-center gap-1">
                      <ClipboardList size={13} className="text-gray-400" />
                      {v.stops.length} {v.stops.length === 1 ? 'well' : 'wells'}
                    </span>
                    {v.stops.some(s => s.hasSoar && !s.soarAcknowledged) && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-700">
                        <AlertTriangle size={10} /> SOAR
                      </span>
                    )}
                    {v.stops.some(s => s.hasSoar && s.soarAcknowledged) && !v.stops.some(s => s.hasSoar && !s.soarAcknowledged) && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-700">
                        <AlertTriangle size={10} /> SOAR ✓
                      </span>
                    )}
                  </span>
                </td>
                <td className="px-4 py-3">{statusBadge(v.status)}</td>
                <td className="px-4 py-3 text-right text-gray-400"><ChevronRight size={16} /></td>
              </tr>
            ))}
          </tbody>
        </table></div>

        {/* Pagination */}
        {visits.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-500">
              {totalElements} visit{totalElements !== 1 ? 's' : ''} · Page {page + 1} of {Math.max(totalPages, 1)}
            </span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => p - 1)} disabled={page === 0}
                className="h-8 px-3 text-sm rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-gray-50">
                Previous
              </button>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}
                className="h-8 px-3 text-sm rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-gray-50">
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {showPanel && (
        <VisitPanel stUsers={stUsers} onClose={() => setShowPanel(false)} onSaved={() => { setShowPanel(false); refresh() }} />
      )}
      {activeVisit && (
        <VisitDrawer visit={activeVisit} onClose={() => setActiveVisit(null)} onRefresh={refresh} wellOpts={wellOpts} />
      )}
    </div>
  )
}
