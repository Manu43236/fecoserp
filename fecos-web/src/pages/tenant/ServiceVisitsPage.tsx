import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Plus, ClipboardList, ChevronRight, Trash2, FlaskConical, AlertTriangle, FileText, MapPin, Camera, PenLine, Search, CheckSquare, Square } from 'lucide-react'
import toast from 'react-hot-toast'
import { serviceVisitsApi } from '@/api/serviceVisits'
import type { ServiceVisit, ServiceVisitStop, VisitStatus, VisitStopStatus, DueWell, TreatmentReport } from '@/api/serviceVisits'
import { usersApi } from '@/api/users'
import type { UserRecord } from '@/api/users'
import { wellsApi } from '@/api/wells'
import type { WellRecord } from '@/api/wells'
import { SearchableDropdown } from '@/components/ui/SearchableDropdown'

// ── PDF Print ──────────────────────────────────────────────────────────────────

function printReportPdf(r: TreatmentReport) {
  const fmt = (iso: string | null) => iso
    ? new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
    : '—'

  const row = (label: string, value: string) =>
    `<tr><td style="color:#666;padding:4px 8px 4px 0;white-space:nowrap;vertical-align:top;font-size:12px">${label}</td><td style="padding:4px 0;font-size:13px;font-weight:500">${value}</td></tr>`

  const linesHtml = r.lines.map(l => {
    const isCi = l.method === 'CONTINUOUS'
    const badge = isCi
      ? `<span style="background:#dbeafe;color:#1e40af;font-size:11px;font-weight:700;padding:2px 7px;border-radius:4px">CI</span>`
      : `<span style="background:#ede9fe;color:#5b21b6;font-size:11px;font-weight:700;padding:2px 7px;border-radius:4px">Batch</span>`
    const onRateBadge = isCi && l.onRate !== null
      ? `<span style="font-size:11px;font-weight:600;padding:2px 7px;border-radius:10px;${l.onRate ? 'background:#dcfce7;color:#15803d' : 'background:#fee2e2;color:#b91c1c'}">${l.onRate ? 'On Rate' : 'Off Rate'}</span>`
      : ''
    const appliedBadge = !isCi
      ? `<span style="font-size:11px;font-weight:600;padding:2px 7px;border-radius:10px;${l.applied ? 'background:#dcfce7;color:#15803d' : 'background:#f3f4f6;color:#6b7280'}">${l.applied ? 'Applied' : 'Not Applied'}</span>`
      : ''
    const levelColor = l.tankLevelPct == null ? '' : l.tankLevelPct < 10 ? 'color:#dc2626;font-weight:600' : l.tankLevelPct < 25 ? 'color:#d97706;font-weight:600' : 'color:#16a34a;font-weight:600'

    return `
      <div style="border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;margin-bottom:12px">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:${isCi ? '#eff6ff' : '#f5f3ff'}">
          <div style="display:flex;align-items:center;gap:8px">${badge}<span style="font-size:14px;font-weight:600">${l.productName ?? l.method}</span></div>
          <div>${onRateBadge}${appliedBadge}</div>
        </div>
        <div style="padding:10px 12px;font-size:13px">
          ${l.tankSerial || l.tankLevelPct != null ? `<div style="margin-bottom:6px;color:#4b5563">
            ${l.tankSerial ? `<span>Tank ${l.tankSerial}</span>` : ''}
            ${l.tankLevelPct != null ? `<span style="margin-left:12px;${levelColor}">${l.tankLevelPct.toFixed(2)}% level</span>` : ''}
          </div>` : ''}
          ${isCi ? `<table style="width:100%;border-collapse:collapse">
            <tr>
              <td style="width:33%;font-size:11px;color:#9ca3af">Pump</td>
              <td style="width:33%;font-size:11px;color:#9ca3af">Rate Found</td>
              <td style="width:33%;font-size:11px;color:#9ca3af">Rate Set To</td>
            </tr>
            <tr>
              <td style="font-size:13px;font-weight:500;${l.pumpRunning ? 'color:#15803d' : 'color:#dc2626'}">${l.pumpRunning ? 'Running' : 'Down'}</td>
              <td style="font-size:13px;font-weight:500">${l.rateFound != null ? `${l.rateFound} gal/day` : '—'}</td>
              <td style="font-size:13px;font-weight:500">${l.rateSetTo != null ? `${l.rateSetTo} gal/day` : '—'}</td>
            </tr>
          </table>` : ''}
          ${isCi && !l.pumpRunning && l.pumpDownReason ? `<div style="margin-top:6px;background:#fef2f2;border-radius:6px;padding:6px 8px;font-size:12px;color:#b91c1c"><b>Pump down:</b> ${l.pumpDownReason}</div>` : ''}
          ${isCi && l.deviationReason ? `<div style="margin-top:6px;background:#fffbeb;border-radius:6px;padding:6px 8px;font-size:12px;color:#92400e"><b>Rate change:</b> ${l.deviationReason}</div>` : ''}
          ${!isCi && l.quantityApplied != null ? `<div style="margin-top:4px;color:#4b5563"><span style="color:#9ca3af">Quantity applied: </span>${l.quantityApplied} gal</div>` : ''}
          ${l.notes ? `<div style="margin-top:6px;font-size:12px;color:#6b7280;font-style:italic">${l.notes}</div>` : ''}
        </div>
      </div>`
  }).join('')

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
  <title>Treatment Report — ${r.wellName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111; background: #fff; padding: 32px; max-width: 700px; margin: 0 auto; }
    h1 { font-size: 20px; font-weight: 700; margin-bottom: 2px; }
    .sub { font-size: 13px; color: #6b7280; margin-bottom: 20px; }
    .section-title { font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.07em; margin: 20px 0 8px; }
    .card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px 14px; margin-bottom: 8px; }
    table.meta { border-collapse: collapse; width: 100%; }
    .sig-img { height: 60px; object-fit: contain; display: block; margin-bottom: 4px; }
    img.photo { width: 100%; border-radius: 10px; object-fit: cover; max-height: 260px; border: 1px solid #e5e7eb; margin-top: 6px; }
    .soar { background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 10px 12px; margin-bottom: 8px; }
    .soar-ack { background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 10px 12px; }
    @media print { body { padding: 16px; } }
  </style>
  </head><body>
  <h1>Treatment Report</h1>
  <div class="sub">${r.wellName} · ${r.leaseName} · ${r.clientName}</div>

  <div class="section-title">Visit Info</div>
  <div class="card">
    <table class="meta">
      ${row('Service Tech', r.techName)}
      ${row('Performed At', fmt(r.performedAt))}
      ${row('Submitted At', fmt(r.submittedAt))}
      ${r.gpsLat ? row('GPS', `${r.gpsLat.toFixed(6)}, ${r.gpsLng?.toFixed(6)}`) : ''}
    </table>
  </div>

  ${r.soar ? `
  <div class="section-title">SOAR</div>
  <div class="${r.soarAckAt ? 'soar-ack' : 'soar'}">
    <div style="font-size:13px;font-weight:600;margin-bottom:4px">Special Observation / Action Required</div>
    ${r.soarNote ? `<div style="font-size:13px">${r.soarNote}</div>` : ''}
    ${r.soarAckAt ? `<div style="font-size:12px;color:#92400e;margin-top:6px;border-top:1px solid #fde68a;padding-top:6px">
      Acknowledged by ${r.soarAckByName} · ${fmt(r.soarAckAt)}
      ${r.soarAckNote ? `<br/>${r.soarAckNote}` : ''}
    </div>` : '<div style="font-size:12px;color:#b91c1c;margin-top:4px;font-weight:600">⚠ Not yet acknowledged</div>'}
  </div>` : ''}

  ${r.photoUrl ? `
  <div class="section-title">Site Photo</div>
  <img class="photo" src="${r.photoUrl}" alt="Site photo"/>
  ${r.photoCapturedAt ? `<div style="font-size:11px;color:#9ca3af;margin-top:4px">Captured ${fmt(r.photoCapturedAt)}</div>` : ''}` : ''}

  ${r.lines.length > 0 ? `
  <div class="section-title">Treatment Lines</div>
  ${linesHtml}` : ''}

  ${r.sampleType || r.sampleNotes || r.samplePhotoUrl ? `
  <div class="section-title">Sample</div>
  <div class="card">
    ${r.sampleType ? `<div style="font-size:13px;font-weight:500;margin-bottom:2px">${r.sampleType}</div>` : ''}
    ${r.sampleNotes ? `<div style="font-size:13px;color:#4b5563">${r.sampleNotes}</div>` : ''}
    ${r.samplePhotoUrl ? `<img class="photo" src="${r.samplePhotoUrl}" alt="Sample bottle"/>` : ''}
  </div>` : ''}

  ${r.signerName ? `
  <div class="section-title">Signature</div>
  <div class="card">
    ${r.signatureUrl ? `<img class="sig-img" src="${r.signatureUrl}" alt="Signature"/>` : ''}
    <div style="font-size:13px;font-weight:500">${r.signerName}</div>
    <div style="font-size:12px;color:#9ca3af">${fmt(r.signedAt)}</div>
  </div>` : ''}

  ${r.notes ? `
  <div class="section-title">Notes</div>
  <div class="card"><p style="font-size:13px;color:#374151">${r.notes}</p></div>` : ''}

  </body></html>`

  const w = window.open('', '_blank')
  if (w) { w.document.write(html); w.document.close() }
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
  const [form, setForm]           = useState({ name: '', techId: '', visitDate: today, notes: '' })
  const [selectedWellIds, setSelectedWellIds] = useState<string[]>([])
  const [wellSearch, setWellSearch]           = useState('')

  const { data: wellsData } = useQuery({
    queryKey: ['wells-all'],
    queryFn:  () => wellsApi.list({ size: 500 }).then(r => r.data?.data?.content as WellRecord[] ?? []),
  })
  const allWells: WellRecord[] = wellsData ?? []

  const filteredWells = useMemo(() => {
    const q = wellSearch.toLowerCase()
    return q ? allWells.filter(w =>
      w.wellName.toLowerCase().includes(q) ||
      (w.leaseName ?? '').toLowerCase().includes(q) ||
      (w.clientName ?? '').toLowerCase().includes(q)
    ) : allWells
  }, [allWells, wellSearch])

  const toggleWell = (id: string) =>
    setSelectedWellIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

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
    if (!form.name.trim())  return toast.error('Enter a schedule name')
    if (!form.techId)        return toast.error('Select a service tech')
    if (!form.visitDate)     return toast.error('Select a date')
    if (selectedWellIds.length === 0) return toast.error('Select at least one well')
    mutation.mutate()
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-black/20" />
      <div className="relative w-[440px] h-full bg-white shadow-xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
          <h2 className="text-sm font-semibold text-gray-900">New Schedule</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Schedule Name *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. North District – Week 34"
              className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]" />
          </div>

          {/* Tech */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Service Tech *</label>
            <SearchableDropdown
              value={form.techId}
              onChange={v => setForm(f => ({ ...f, techId: v ?? '' }))}
              options={techOpts}
              placeholder="Select service tech…"
              showClear={false}
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Visit Date *</label>
            <input type="date" value={form.visitDate}
              onChange={e => setForm(f => ({ ...f, visitDate: e.target.value }))}
              className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]" />
          </div>

          {/* Wells */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-gray-700">Wells *</label>
              {selectedWellIds.length > 0 && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: 'var(--color-primary)' }}>
                  {selectedWellIds.length} selected
                </span>
              )}
            </div>
            <div className="relative mb-2">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={wellSearch} onChange={e => setWellSearch(e.target.value)}
                placeholder="Search wells…"
                className="w-full h-8 pl-8 pr-3 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]" />
            </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden max-h-52 overflow-y-auto">
              {filteredWells.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">No wells found</p>
              ) : filteredWells.map(w => {
                const checked = selectedWellIds.includes(w.id)
                return (
                  <button key={w.id} type="button" onClick={() => toggleWell(w.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors border-b border-gray-100 last:border-0 ${checked ? 'bg-[var(--color-primary)]/5' : 'hover:bg-gray-50'}`}>
                    {checked
                      ? <CheckSquare size={15} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                      : <Square size={15} className="text-gray-300 shrink-0" />}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-900 truncate">{w.wellName}</p>
                      <p className="text-xs text-gray-400 truncate">{w.leaseName ?? ''}{w.clientName ? ` · ${w.clientName}` : ''}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

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
              {reportData && (
                <button onClick={() => printReportPdf(reportData)}
                  className="flex items-center gap-1.5 h-8 px-3 text-xs font-semibold rounded-lg border text-gray-600 hover:bg-gray-50 transition-colors"
                  style={{ borderColor: 'rgba(0,0,0,0.15)' }}>
                  <FileText size={13} /> View PDF
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

function defaultDateFrom() {
  const d = new Date()
  d.setDate(d.getDate() - 14)
  return d.toISOString().split('T')[0]
}
function defaultDateTo() {
  const d = new Date()
  d.setDate(d.getDate() + 30)
  return d.toISOString().split('T')[0]
}

export default function ServiceVisitsPage() {
  const [dateFrom,     setDateFrom]     = useState(defaultDateFrom)
  const [dateTo,       setDateTo]       = useState(defaultDateTo)
  const [statusFilter, setStatusFilter] = useState<VisitStatus | 'ALL'>('ALL')
  const [techFilter,   setTechFilter]   = useState('')
  const [page,         setPage]         = useState(0)
  const [showPanel,    setShowPanel]    = useState(false)
  const [activeVisit,  setActiveVisit]  = useState<ServiceVisit | null>(null)

  // committed filters — only update when user clicks Search
  const [committed, setCommitted] = useState({ dateFrom: defaultDateFrom(), dateTo: defaultDateTo(), status: 'ALL' as VisitStatus | 'ALL', techId: '' })

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
    queryKey: ['service-visits', page, committed],
    queryFn:  () => serviceVisitsApi.list({
      page,
      size: 20,
      status:   committed.status !== 'ALL' ? committed.status : undefined,
      techId:   committed.techId || undefined,
      dateFrom: committed.dateFrom || undefined,
      dateTo:   committed.dateTo   || undefined,
    }).then(r => r.data?.data),
  })

  const visits: ServiceVisit[] = data?.content ?? []
  const totalPages: number     = data?.totalPages ?? 0
  const totalElements: number  = data?.totalElements ?? 0

  const search = () => {
    setPage(0)
    setCommitted({ dateFrom, dateTo, status: statusFilter, techId: techFilter })
  }

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
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 whitespace-nowrap">From</label>
          <input type="date" value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
            className="h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 whitespace-nowrap">To</label>
          <input type="date" value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
            className="h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]" />
        </div>
        <div className="w-44">
          <SearchableDropdown
            value={techFilter}
            onChange={v => setTechFilter(v ?? '')}
            options={techOpts}
            placeholder="All Techs"
            showClear={true}
          />
        </div>
        <div className="w-40">
          <SearchableDropdown
            value={statusFilter === 'ALL' ? '' : statusFilter}
            onChange={v => setStatusFilter((v as VisitStatus) || 'ALL')}
            options={STATUS_OPTS}
            placeholder="All Statuses"
            showClear={true}
          />
        </div>
        <button onClick={search}
          className="flex items-center gap-1.5 h-9 px-4 text-sm font-semibold rounded-lg text-white"
          style={{ backgroundColor: 'var(--color-primary)' }}>
          <Search size={14} /> Search
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
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
            ) : visits.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-400">No service visits found</td></tr>
            ) : visits.map(v => (
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
        </table>

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
