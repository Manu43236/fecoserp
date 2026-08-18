import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { X, ExternalLink, AlertTriangle } from 'lucide-react'
import type React from 'react'
import { labApi, type LabSampleRecord, type LabApprovePayload } from '@/api/lab'
import { useAuthStore } from '@/store/authStore'

const PAGE_SIZE = 20

const SAMPLE_TYPE_LABEL: Record<string, string> = {
  PRODUCED_WATER:   'Produced Water',
  SOLID_SCRAPING:   'Solid Scraping',
  CORROSION_COUPON: 'Corrosion Coupon',
}

function PriorityBadge({ priority }: { priority: string }) {
  const isRush = priority === 'RUSH'
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ${
      isRush ? 'bg-red-50 text-red-700 ring-red-200' : 'bg-gray-50 text-gray-500 ring-gray-200'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isRush ? 'bg-red-500' : 'bg-gray-400'}`} />
      {isRush ? 'Rush' : 'Routine'}
    </span>
  )
}

function CriticalBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 ring-1 ring-red-200">
      🔴 {label}
    </span>
  )
}

function fmt(v: number | null | undefined, unit = ''): React.ReactNode {
  if (v == null) return <span className="text-gray-300">—</span>
  return <>{v}{unit}</>
}

function criticalFlags(r: LabSampleRecord['result']): string[] {
  if (!r) return []
  const flags: string[] = []
  if (r.srbCount != null && r.srbCount > 1000)              flags.push(`SRB ${r.srbCount.toLocaleString()} cells/mL`)
  if (r.apbCount != null && r.apbCount > 10000)             flags.push(`APB ${r.apbCount.toLocaleString()} cells/mL`)
  if (r.corrosionRate != null && r.corrosionRate > 5)       flags.push(`Corrosion ${r.corrosionRate} mils/yr`)
  if (r.scalingIndex != null && r.scalingIndex > 2.0)       flags.push(`LSI ${r.scalingIndex}`)
  if (r.iron != null && r.iron > 50)                        flags.push(`Iron ${r.iron} mg/L`)
  if (r.ph != null && (r.ph < 5.5 || r.ph > 9.0))          flags.push(`pH ${r.ph}`)
  if (r.dissolvedOxygen != null && r.dissolvedOxygen > 0.5) flags.push(`DO ${r.dissolvedOxygen} mg/L`)
  return flags
}

// ── Approval Drawer ───────────────────────────────────────────────────────────
function ApprovalDrawer({ sample, onClose }: { sample: LabSampleRecord; onClose: () => void }) {
  const navigate   = useNavigate()
  const qc         = useQueryClient()
  const r          = sample.result
  const flags      = criticalFlags(r)
  const [notes, setNotes] = useState('')

  const mutation = useMutation({
    mutationFn: (data: LabApprovePayload) => labApi.approve(sample.id, data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['pending-approvals'] })
      qc.invalidateQueries({ queryKey: ['lab'] })
      qc.invalidateQueries({ queryKey: ['plans'] })
      if (variables.requiresTreatmentChange) {
        toast.success('Approved — active plan superseded. Create new treatment plan.')
        navigate('/plans', { state: { wellId: sample.wellId, triggeredByLabSampleId: sample.id } })
      } else {
        toast.success('Approved — current plan continues.')
      }
      onClose()
    },
    onError: (e: unknown) =>
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed'),
  })

  const row = (label: string, value: React.ReactNode, critical = false) => (
    <div key={label} className="flex items-center justify-between py-1.5" style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
      <span className="text-xs text-gray-500">{label}</span>
      <span className={`text-sm font-medium ${critical ? 'text-red-600' : 'text-gray-900'}`}>{value}</span>
    </div>
  )

  const section = (title: string) => (
    <p className="text-[11px] text-gray-400 uppercase tracking-wide font-semibold mb-2 mt-4">{title}</p>
  )

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative bg-white w-[560px] h-full shadow-2xl flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
          <div>
            <p className="text-sm font-bold text-gray-900 font-mono">{sample.sampleNumber}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {SAMPLE_TYPE_LABEL[sample.sampleType]} · {sample.wellName} · {sample.leaseName}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {/* Critical alert */}
          {flags.length > 0 && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 mb-4">
              <p className="text-xs font-bold text-red-700 uppercase tracking-wide mb-2">🔴 Critical Values</p>
              <div className="flex flex-wrap gap-1.5">
                {flags.map(f => <CriticalBadge key={f} label={f} />)}
              </div>
            </div>
          )}

          {/* Sample info */}
          {section('Sample Info')}
          {row('Client', sample.clientName ?? '—')}
          {row('Well', sample.wellName ?? '—')}
          {row('Lease', sample.leaseName ?? '—')}
          {row('Received', new Date(sample.receivedAt).toLocaleString())}
          {row('Priority', <PriorityBadge priority={sample.priority} />)}
          {sample.testsRequested && row('Tests Requested', sample.testsRequested)}

          {/* Results */}
          {r && (<>
            {r.calcium != null && (<>
              {section('Water Analysis')}
              {row('Calcium', fmt(r.calcium, ' mg/L'))}
              {row('Magnesium', fmt(r.magnesium, ' mg/L'))}
              {row('Iron (Fe)', fmt(r.iron, ' mg/L'), r.iron != null && r.iron > 50)}
              {row('pH', fmt(r.ph), r.ph != null && (r.ph < 5.5 || r.ph > 9.0))}
              {row('TDS', fmt(r.tds, ' mg/L'))}
              {row('Dissolved O₂', fmt(r.dissolvedOxygen, ' mg/L'), r.dissolvedOxygen != null && r.dissolvedOxygen > 0.5)}
              {row('Scaling Index (LSI)', fmt(r.scalingIndex), r.scalingIndex != null && r.scalingIndex > 2.0)}
              {row('Corrosion Potential', r.corrosionPotential != null ? `${r.corrosionPotential}/10` : <span className="text-gray-300">—</span>)}
            </>)}
            {r.srbCount != null && (<>
              {section('Bacteriological')}
              {row('SRB Count', fmt(r.srbCount, ' cells/mL'), r.srbCount > 1000)}
              {row('APB Count', fmt(r.apbCount, ' cells/mL'), r.apbCount != null && r.apbCount > 10000)}
              {row('Treatment Effectiveness', fmt(r.treatmentEffectiveness, '%'))}
            </>)}
            {r.corrosionRate != null && (<>
              {section('Corrosion')}
              {row('Corrosion Rate', fmt(r.corrosionRate, ' mils/yr'), r.corrosionRate > 5)}
            </>)}
            {r.scaleType && (<>
              {section('Scale')}
              {row('Scale Type', r.scaleType)}
              {row('Severity', r.scaleSeverity ?? '—')}
            </>)}
            {r.labTechNotes && (<>
              {section('Lab Tech Notes')}
              <p className="text-sm text-gray-700 leading-relaxed">{r.labTechNotes}</p>
            </>)}
          </>)}
        </div>

        {/* Approval footer */}
        <div className="px-6 py-4 space-y-3 shrink-0" style={{ borderTop: '1px solid rgba(0,0,0,0.07)' }}>
          {sample.activeTreatmentPlanId && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-100">
              <ExternalLink size={13} className="text-blue-500 shrink-0" />
              <p className="text-xs text-blue-700">This well has an active treatment plan. "Approve — Update Treatment" will supersede it.</p>
            </div>
          )}
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Approval notes (optional)…"
            rows={2}
            className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-red-100 resize-none transition"
          />
          <div className="flex gap-2">
            <button
              onClick={() => mutation.mutate({ requiresTreatmentChange: false, approvalNotes: notes || undefined })}
              disabled={mutation.isPending}
              className="flex-1 h-10 text-sm font-semibold rounded-lg border-2 transition disabled:opacity-60"
              style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}>
              Approve — No Changes
            </button>
            <button
              onClick={() => mutation.mutate({ requiresTreatmentChange: true, approvalNotes: notes || undefined })}
              disabled={mutation.isPending}
              className="flex-1 h-10 text-sm font-semibold text-white rounded-lg transition disabled:opacity-60"
              style={{ backgroundColor: 'var(--color-primary)' }}>
              Approve — Update Treatment
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── ApprovalsPage ─────────────────────────────────────────────────────────────
export default function ApprovalsPage() {
  const [page, setPage]         = useState(0)
  const [selected, setSelected] = useState<LabSampleRecord | undefined>()
  const { user } = useAuthStore()

  const { data, isLoading } = useQuery({
    queryKey: ['pending-approvals', page],
    queryFn: () => labApi.pendingApprovals({ page, size: PAGE_SIZE }).then(r => r.data.data),
  })

  const samples    = data?.content      ?? []
  const total      = data?.totalElements ?? 0
  const totalPages = data?.totalPages    ?? 0

  return (
    <div className="flex flex-col h-full bg-white">

      {/* Header */}
      <div className="px-6 py-5 shrink-0" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <h1 className="text-xl font-bold text-gray-900">Approvals</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {isLoading ? 'Loading…' : `${total} lab result${total !== 1 ? 's' : ''} pending review`}
        </p>
      </div>

      {/* Info banner */}
      {total > 0 && (
        <div className="px-6 py-3 flex items-center gap-2 bg-amber-50 border-b border-amber-100 shrink-0">
          <AlertTriangle size={14} className="text-amber-600 shrink-0" />
          <p className="text-xs text-amber-700">
            These lab results have been completed by the lab tech and are waiting for your approval before treatment plans are updated.
          </p>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: 'var(--color-primary)' }}>
              {['Sample #', 'Type', 'Well / Lease', 'Client', 'Received', 'Priority', 'Critical Flags', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-white/80 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {samples.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-20 text-center">
                  <p className="text-gray-400 text-sm">✅ No pending approvals — all lab results reviewed.</p>
                </td>
              </tr>
            ) : samples.map((s: LabSampleRecord, i: number) => {
              const flags = criticalFlags(s.result)
              return (
                <tr key={s.id}
                  onClick={() => setSelected(s)}
                  className="cursor-pointer hover:bg-gray-50 transition-colors"
                  style={i > 0 ? { borderTop: '1px solid rgba(0,0,0,0.05)' } : {}}>
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-700">{s.sampleNumber}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{SAMPLE_TYPE_LABEL[s.sampleType]}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{s.wellName ?? '—'}</p>
                    {s.leaseName && <p className="text-xs text-gray-400">{s.leaseName}</p>}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{s.clientName ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{new Date(s.receivedAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3"><PriorityBadge priority={s.priority} /></td>
                  <td className="px-4 py-3">
                    {flags.length > 0
                      ? <div className="flex flex-wrap gap-1">{flags.map(f => <CriticalBadge key={f} label={f} />)}</div>
                      : <span className="text-xs text-gray-400">None</span>}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={e => { e.stopPropagation(); setSelected(s) }}
                      className="px-3 py-1.5 text-xs font-semibold text-white rounded-lg transition"
                      style={{ backgroundColor: 'var(--color-primary)' }}>
                      Review
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-3 flex items-center justify-between shrink-0" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          <p className="text-xs text-gray-500">Page {page + 1} of {totalPages}</p>
          <div className="flex gap-2">
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors">Previous</button>
            <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors">Next</button>
          </div>
        </div>
      )}

      {selected && (
        <ApprovalDrawer sample={selected} onClose={() => setSelected(undefined)} />
      )}
    </div>
  )
}
