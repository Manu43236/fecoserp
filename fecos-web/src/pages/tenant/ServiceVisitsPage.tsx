import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Plus, ClipboardList, ChevronRight, Trash2, FlaskConical, AlertTriangle, FileText, MapPin, Camera, PenLine, Printer } from 'lucide-react'
import toast from 'react-hot-toast'
import { serviceVisitsApi } from '@/api/serviceVisits'
import type { ServiceVisit, ServiceVisitStop, VisitStatus, VisitStopStatus, DueWell, TreatmentReport } from '@/api/serviceVisits'
import { usersApi } from '@/api/users'
import type { UserRecord } from '@/api/users'
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

  <script>window.onload = () => { window.print(); }<\/script>
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
  const [form, setForm] = useState({ techId: '', visitDate: today, notes: '' })

  const mutation = useMutation({
    mutationFn: () => serviceVisitsApi.create({ techId: form.techId, visitDate: form.visitDate, notes: form.notes }),
    onSuccess: () => { toast.success('Service visit created'); onSaved() },
    onError:   () => toast.error('Failed to create service visit'),
  })

  const techOpts = stUsers.map(u => ({ value: u.id, label: u.fullName }))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.techId || !form.visitDate) return toast.error('Select a service tech and date')
    mutation.mutate()
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-black/20" />
      <div className="relative w-[440px] h-full bg-white shadow-xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
          <h2 className="text-sm font-semibold text-gray-900">New Service Visit</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        <form onSubmit={submit} className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
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
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Visit Date *</label>
            <input type="date" value={form.visitDate}
              onChange={e => setForm(f => ({ ...f, visitDate: e.target.value }))}
              className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Notes <span className="text-gray-400">(optional)</span></label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]"
              placeholder="Any notes…" />
          </div>
        </form>

        <div className="px-5 py-4 flex gap-3 shrink-0" style={{ borderTop: '1px solid rgba(0,0,0,0.07)' }}>
          <button type="button" onClick={onClose}
            className="flex-1 h-10 text-sm font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={submit} disabled={mutation.isPending}
            className="flex-1 h-10 text-sm font-semibold rounded-lg text-white disabled:opacity-60 transition-colors"
            style={{ backgroundColor: 'var(--color-primary)' }}>
            {mutation.isPending ? 'Creating…' : 'Create Visit'}
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
  const [addingWell,    setAddingWell]    = useState(false)
  const [newWellId,     setNewWellId]     = useState('')
  const [reportStop,    setReportStop]    = useState<ServiceVisitStop | null>(null)

  const { data: dueData } = useQuery({
    queryKey: ['due-wells', visit.visitDate],
    queryFn:  () => serviceVisitsApi.dueWells(visit.visitDate).then(r => r.data?.data as DueWell[] ?? []),
    enabled:  visit.status === 'SCHEDULED' || visit.status === 'IN_PROGRESS',
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
    mutationFn: ({ stopId, data }: { stopId: string; data: { status?: VisitStopStatus; sampleCollected?: boolean } }) =>
      serviceVisitsApi.updateStop(visit.id, stopId, data),
    onSuccess: () => onRefresh(),
    onError:   () => toast.error('Failed to update stop'),
  })

  const updateVisitMutation = useMutation({
    mutationFn: (status: VisitStatus) => serviceVisitsApi.update(visit.id, { status }),
    onSuccess:  () => { toast.success('Status updated'); onRefresh() },
    onError:    () => toast.error('Failed to update status'),
  })

  const canEdit = visit.status === 'SCHEDULED' || visit.status === 'IN_PROGRESS'

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="fixed inset-0 bg-black/20" />
      <div className="relative w-[600px] h-full bg-white shadow-xl flex flex-col">

        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 shrink-0" style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary)' }}>
            <ClipboardList size={14} className="text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">{visit.techName}</h2>
            <p className="text-xs text-gray-500">{new Date(visit.visitDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {statusBadge(visit.status)}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 ml-1"><X size={18} /></button>
          </div>
        </div>

        {/* Body */}
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
                    onSampleToggle={() => updateStopMutation.mutate({ stopId: stop.id, data: { sampleCollected: !stop.sampleCollected } })}
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

        {/* Footer */}
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
      </div>

      {reportStop && (
        <TreatmentReportDrawer
          visitId={visit.id}
          stopId={reportStop.id}
          onClose={() => setReportStop(null)}
          onAcknowledged={onRefresh}
        />
      )}
    </div>
  )
}

// ── Stop Card ──────────────────────────────────────────────────────────────────

function StopCard({ stop, index, canEdit, onRemove, onStatusChange, onSampleToggle, onViewReport }: {
  stop: ServiceVisitStop; index: number; canEdit: boolean
  onRemove: () => void; onStatusChange: (s: VisitStopStatus) => void
  onSampleToggle: () => void; onViewReport: () => void
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

        <button onClick={onSampleToggle} disabled={!canEdit}
          className={`flex items-center gap-1 h-7 px-2.5 text-xs font-medium rounded-lg border transition-colors ${
            stop.sampleCollected
              ? 'bg-blue-50 border-blue-200 text-blue-700'
              : 'border-gray-200 text-gray-500 hover:bg-gray-50'
          } ${!canEdit ? 'opacity-60 cursor-default' : ''}`}>
          <FlaskConical size={11} />
          {stop.sampleCollected ? 'Sample Collected' : 'Sample'}
        </button>

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

// ── Treatment Report Drawer ────────────────────────────────────────────────────

function TreatmentReportDrawer({ visitId, stopId, onClose, onAcknowledged }: {
  visitId: string; stopId: string; onClose: () => void; onAcknowledged: () => void
}) {
  const qc = useQueryClient()
  const [ackNote, setAckNote] = useState('')
  const [showAckForm, setShowAckForm] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['treatment-report', stopId],
    queryFn: () => serviceVisitsApi.getTreatmentReport(visitId, stopId).then(r => r.data?.data as TreatmentReport),
  })

  const ackMutation = useMutation({
    mutationFn: () => serviceVisitsApi.acknowledgeSoar(visitId, stopId, ackNote),
    onSuccess: () => {
      toast.success('SOAR acknowledged')
      qc.invalidateQueries({ queryKey: ['treatment-report', stopId] })
      qc.invalidateQueries({ queryKey: ['service-visits'] })
      setShowAckForm(false)
      onAcknowledged()
    },
    onError: () => toast.error('Failed to acknowledge'),
  })

  const fmt = (iso: string | null) => iso
    ? new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
    : '—'

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-black/20" />
      <div className="relative w-[560px] h-full bg-white shadow-xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Treatment Report</h2>
            {data && <p className="text-xs text-gray-500">{data.wellName} · {data.leaseName}</p>}
          </div>
          <div className="flex items-center gap-2">
            {data && (
              <button onClick={() => printReportPdf(data)}
                className="flex items-center gap-1.5 h-8 px-3 text-xs font-semibold rounded-lg border text-gray-600 hover:bg-gray-50 transition-colors"
                style={{ borderColor: 'rgba(0,0,0,0.15)' }}>
                <Printer size={13} /> Print / PDF
              </button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
            ))}</div>
          ) : !data ? (
            <p className="text-sm text-gray-400 text-center py-10">Report not found</p>
          ) : (
            <>
              {/* Meta */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-gray-500">Tech</p><p className="font-medium text-gray-900">{data.techName}</p></div>
                <div><p className="text-xs text-gray-500">Client</p><p className="font-medium text-gray-900">{data.clientName}</p></div>
                <div><p className="text-xs text-gray-500">Performed At</p><p className="font-medium text-gray-900">{fmt(data.performedAt)}</p></div>
                <div><p className="text-xs text-gray-500">Submitted At</p><p className="font-medium text-gray-900">{fmt(data.submittedAt)}</p></div>
              </div>

              {/* SOAR */}
              {data.soar && (
                <div className={`p-3 rounded-xl border ${data.soarAckAt ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={14} className={data.soarAckAt ? 'text-amber-600' : 'text-red-600'} />
                      <p className={`text-sm font-semibold ${data.soarAckAt ? 'text-amber-700' : 'text-red-700'}`}>
                        SOAR — Special Observation / Action Required
                      </p>
                    </div>
                    {!data.soarAckAt && !showAckForm && (
                      <button onClick={() => setShowAckForm(true)}
                        className="h-7 px-3 text-xs font-semibold rounded-lg text-white shrink-0"
                        style={{ backgroundColor: 'var(--color-primary)' }}>
                        Acknowledge
                      </button>
                    )}
                  </div>

                  {data.soarNote && <p className={`text-sm mt-1.5 ${data.soarAckAt ? 'text-amber-800' : 'text-red-800'}`}>{data.soarNote}</p>}

                  {/* Ack form */}
                  {showAckForm && (
                    <div className="mt-3 space-y-2">
                      <textarea
                        value={ackNote}
                        onChange={e => setAckNote(e.target.value)}
                        rows={2}
                        placeholder="Describe action taken (e.g. Maintenance crew dispatched)…"
                        className="w-full px-3 py-2 text-sm border border-red-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-red-200 bg-white"
                      />
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

                  {/* Ack record */}
                  {data.soarAckAt && (
                    <div className="mt-2 pt-2 border-t border-amber-200">
                      <p className="text-xs font-semibold text-amber-700">Acknowledged by {data.soarAckByName} · {fmt(data.soarAckAt)}</p>
                      {data.soarAckNote && <p className="text-xs text-amber-800 mt-0.5">{data.soarAckNote}</p>}
                    </div>
                  )}
                </div>
              )}

              {/* GPS */}
              {data.gpsLat && (
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <MapPin size={14} className="text-gray-400 shrink-0" />
                  <span>{data.gpsLat.toFixed(6)}, {data.gpsLng?.toFixed(6)}</span>
                  <span className="text-xs text-gray-400">· captured {fmt(data.gpsCapturedAt)}</span>
                </div>
              )}

              {/* Photo */}
              {data.photoUrl && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Camera size={14} className="text-gray-400" />
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Photo</p>
                  </div>
                  <img src={data.photoUrl} alt="Site photo" className="w-full rounded-xl object-cover max-h-64 border border-gray-200" />
                  {data.photoCapturedAt && <p className="text-xs text-gray-400 mt-1">Captured {fmt(data.photoCapturedAt)}</p>}
                </div>
              )}

              {/* Treatment Lines */}
              {data.lines.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Treatment Lines</p>
                  <div className="space-y-3">
                    {data.lines.map(l => {
                      const isCi = l.method === 'CONTINUOUS'
                      return (
                        <div key={l.id} className="border border-gray-200 rounded-xl overflow-hidden text-sm">
                          {/* Line header */}
                          <div className={`flex items-center justify-between px-3 py-2 ${isCi ? 'bg-blue-50' : 'bg-purple-50'}`}>
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

                          <div className="px-3 py-2.5 space-y-2">
                            {/* Tank check */}
                            {(l.tankSerial || l.tankLevelPct != null) && (
                              <div className="flex items-center gap-4 text-xs text-gray-600">
                                {l.tankSerial && <span><span className="text-gray-400">Tank </span>{l.tankSerial}</span>}
                                {l.tankLevelPct != null && (
                                  <span className={l.tankLevelPct < 10 ? 'text-red-600 font-semibold' : l.tankLevelPct < 25 ? 'text-amber-600 font-semibold' : 'text-green-700 font-semibold'}>
                                    {l.tankLevelPct.toFixed(2)}% level
                                  </span>
                                )}
                              </div>
                            )}

                            {/* CI details */}
                            {isCi && (
                              <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                                <div>
                                  <span className="text-gray-400">Pump</span><br />
                                  <span className={l.pumpRunning ? 'text-green-700 font-medium' : 'text-red-600 font-medium'}>
                                    {l.pumpRunning ? 'Running' : 'Down'}
                                  </span>
                                </div>
                                <div><span className="text-gray-400">Rate Found</span><br />{l.rateFound != null ? `${l.rateFound} gal/day` : '—'}</div>
                                <div><span className="text-gray-400">Rate Set To</span><br />{l.rateSetTo != null ? `${l.rateSetTo} gal/day` : '—'}</div>
                              </div>
                            )}

                            {/* Pump down reason */}
                            {isCi && !l.pumpRunning && l.pumpDownReason && (
                              <p className="text-xs text-red-700 bg-red-50 rounded px-2 py-1">
                                <span className="font-medium">Pump down: </span>{l.pumpDownReason}
                              </p>
                            )}

                            {/* Deviation reason */}
                            {isCi && l.deviationReason && (
                              <p className="text-xs text-amber-800 bg-amber-50 rounded px-2 py-1">
                                <span className="font-medium">Rate change: </span>{l.deviationReason}
                              </p>
                            )}

                            {/* Batch quantity */}
                            {!isCi && l.quantityApplied != null && (
                              <p className="text-xs text-gray-600">
                                <span className="text-gray-400">Quantity applied: </span>{l.quantityApplied} gal
                              </p>
                            )}

                            {l.notes && <p className="text-xs text-gray-500 italic">{l.notes}</p>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Sample */}
              {(data.sampleType || data.samplePhotoUrl) && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Sample</p>
                  {data.sampleType && <p className="text-sm text-gray-900">{data.sampleType}</p>}
                  {data.sampleNotes && <p className="text-sm text-gray-600">{data.sampleNotes}</p>}
                  {data.samplePhotoUrl && (
                    <img src={data.samplePhotoUrl} alt="Sample bottle" className="mt-2 w-full rounded-xl object-cover max-h-48 border border-gray-200" />
                  )}
                </div>
              )}

              {/* Signature */}
              {data.signerName && (
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                  <div className="flex items-center gap-2 mb-1">
                    <PenLine size={13} className="text-gray-400" />
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Signature</p>
                  </div>
                  {data.signatureUrl && (
                    <img src={data.signatureUrl} alt="Signature" className="h-16 object-contain mb-1" />
                  )}
                  <p className="text-sm text-gray-700">{data.signerName}</p>
                  <p className="text-xs text-gray-400">{fmt(data.signedAt)}</p>
                </div>
              )}

              {/* Notes */}
              {data.notes && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Notes</p>
                  <p className="text-sm text-gray-700">{data.notes}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function ServiceVisitsPage() {
  const today = new Date().toISOString().split('T')[0]
  const [dateFilter,   setDateFilter]   = useState(today)
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
    queryKey: ['service-visits', page, statusFilter, techFilter, dateFilter],
    queryFn:  () => serviceVisitsApi.list({
      page,
      size: 20,
      status:  statusFilter !== 'ALL' ? statusFilter : undefined,
      techId:  techFilter   || undefined,
      date:    dateFilter   || undefined,
    }).then(r => r.data?.data),
  })

  const visits: ServiceVisit[] = data?.content ?? []
  const totalPages: number     = data?.totalPages ?? 0

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
        <h1 className="text-xl font-bold text-gray-900">Service Visits</h1>
        <button onClick={() => setShowPanel(true)}
          className="flex items-center gap-2 h-9 px-4 text-sm font-semibold rounded-lg text-white"
          style={{ backgroundColor: 'var(--color-primary)' }}>
          <Plus size={15} /> New Visit
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <input type="date" value={dateFilter} onChange={e => { setDateFilter(e.target.value); setPage(0) }}
          className="h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]" />
        <div className="w-48">
          <SearchableDropdown
            value={techFilter}
            onChange={v => { setTechFilter(v ?? ''); setPage(0) }}
            options={techOpts}
            placeholder="All Techs"
            showClear={true}
          />
        </div>
        <div className="w-44">
          <SearchableDropdown
            value={statusFilter === 'ALL' ? '' : statusFilter}
            onChange={v => { setStatusFilter((v as VisitStatus) || 'ALL'); setPage(0) }}
            options={STATUS_OPTS}
            placeholder="All Statuses"
            showClear={true}
          />
        </div>
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
                <td className="px-4 py-3 font-medium text-gray-900">
                  {new Date(v.visitDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </td>
                <td className="px-4 py-3 text-gray-700">{v.techName}</td>
                <td className="px-4 py-3 text-gray-700">
                  <span className="inline-flex items-center gap-1.5 flex-wrap">
                    <span className="inline-flex items-center gap-1">
                      <ClipboardList size={13} className="text-gray-400" />
                      {v.stops.length} {v.stops.length === 1 ? 'well' : 'wells'}
                    </span>
                    {v.stops.filter(s => s.sampleCollected).length > 0 && (
                      <span className="text-xs text-blue-600 font-medium">
                        · {v.stops.filter(s => s.sampleCollected).length} sample{v.stops.filter(s => s.sampleCollected).length > 1 ? 's' : ''}
                      </span>
                    )}
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
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <button onClick={() => setPage(p => p - 1)} disabled={page === 0}
              className="h-8 px-3 text-sm rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-gray-50">
              Previous
            </button>
            <span className="text-xs text-gray-500">Page {page + 1} of {totalPages}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}
              className="h-8 px-3 text-sm rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-gray-50">
              Next
            </button>
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
