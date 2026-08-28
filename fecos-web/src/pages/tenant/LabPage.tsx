import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus, X, ChevronRight, ExternalLink, AlertTriangle, FileText } from 'lucide-react'
import type React from 'react'
import {
  labApi,
  type LabSampleRecord, type LabSamplePayload, type LabResultPayload, type LabApprovePayload,
  type SampleType, type LabSampleStatus,
} from '@/api/lab'
import { wellsApi, type WellRecord } from '@/api/wells'
import { usersApi, type UserRecord } from '@/api/users'
import { SearchableDropdown, type DropdownOption } from '@/components/ui/SearchableDropdown'
import { useAuthStore } from '@/store/authStore'
import { useNavigate } from 'react-router-dom'

const PAGE_SIZE = 20

type TabId = 'all' | 'RECEIVED' | 'IN_PROGRESS' | 'COMPLETED' | 'alerts' | 'pending_approval'


const SAMPLE_TYPE_LABEL: Record<SampleType, string> = {
  PRODUCED_WATER:   'Produced Water',
  SOLID_SCRAPING:   'Solid Scraping',
  CORROSION_COUPON: 'Corrosion Coupon',
}

const SAMPLE_TYPE_OPTIONS: DropdownOption[] = [
  { value: 'PRODUCED_WATER',   label: 'Produced Water'   },
  { value: 'SOLID_SCRAPING',   label: 'Solid Scraping'   },
  { value: 'CORROSION_COUPON', label: 'Corrosion Coupon' },
]

const PRIORITY_OPTIONS: DropdownOption[] = [
  { value: 'ROUTINE', label: 'Routine' },
  { value: 'RUSH',    label: 'Rush'    },
]

const SCALE_SEVERITY_OPTIONS: DropdownOption[] = [
  { value: 'LIGHT',    label: 'Light'    },
  { value: 'MODERATE', label: 'Moderate' },
  { value: 'SEVERE',   label: 'Severe'   },
]

// ── Badges ────────────────────────────────────────────────────────────────────
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

function StatusBadge({ status }: { status: LabSampleStatus }) {
  const map: Record<LabSampleStatus, { cls: string; dot: string; label: string }> = {
    RECEIVED:    { cls: 'bg-blue-50 text-blue-700 ring-blue-200',          dot: 'bg-blue-500',   label: 'Received'    },
    IN_PROGRESS: { cls: 'bg-amber-50 text-amber-700 ring-amber-200',       dot: 'bg-amber-500',  label: 'In Progress' },
    COMPLETED:   { cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-500',label: 'Completed'   },
  }
  const s = map[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ${s.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
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

// ── Log Sample Panel ──────────────────────────────────────────────────────────
function LogSamplePanel({ open, onClose, wells, users }: {
  open: boolean; onClose: () => void
  wells: WellRecord[]; users: UserRecord[]
}) {
  const qc = useQueryClient()
  const [sampleType, setSampleType]       = useState('')
  const [wellId, setWellId]               = useState('')
  const [collectedById, setCollectedById] = useState('')
  const [collectedAt, setCollectedAt]     = useState('')
  const [receivedAt, setReceivedAt]       = useState('')
  const [priority, setPriority]           = useState('ROUTINE')
  const [testsRequested, setTestsRequested] = useState('')

  const wellOptions: DropdownOption[] = wells.map(w => ({
    value: w.id,
    label: `${w.wellName}${w.leaseName ? ` — ${w.leaseName}` : ''}`,
  }))

  const userOptions: DropdownOption[] = users
    .filter(u => u.role === 'SERVICE_TECH' || u.role === 'ACCOUNT_REP')
    .map(u => ({ value: u.id, label: `${u.fullName} (${u.role.replace('_', ' ')})` }))

  const mutation = useMutation({
    mutationFn: (data: LabSamplePayload) => labApi.create(data),
    onSuccess: () => {
      toast.success('Sample logged')
      qc.invalidateQueries({ queryKey: ['lab'] })
      onClose()
      setSampleType(''); setWellId(''); setCollectedById('')
      setCollectedAt(''); setReceivedAt(''); setPriority('ROUTINE'); setTestsRequested('')
    },
    onError: (e: unknown) =>
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed'),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!sampleType || !wellId || !receivedAt) {
      toast.error('Sample type, well, and received date are required')
      return
    }
    mutation.mutate({
      sampleType: sampleType as SampleType,
      wellId,
      collectedById: collectedById || undefined,
      collectedAt:   collectedAt ? `${collectedAt}:00` : undefined,
      receivedAt:    `${receivedAt}:00`,
      priority:      priority as 'ROUTINE' | 'RUSH',
      testsRequested: testsRequested || undefined,
    })
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative bg-white w-[440px] h-full shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
          <h2 className="text-sm font-semibold text-gray-900">Log New Sample</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Sample Type *</label>
              <SearchableDropdown options={SAMPLE_TYPE_OPTIONS} value={sampleType} onChange={v => setSampleType(v ?? '')} placeholder="Select sample type…" showClear={false} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Well *</label>
              <SearchableDropdown options={wellOptions} value={wellId} onChange={v => setWellId(v ?? '')} placeholder="Select well…" showClear={false} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Collected By <span className="text-gray-400 font-normal normal-case">(optional)</span>
              </label>
              <SearchableDropdown options={userOptions} value={collectedById} onChange={v => setCollectedById(v ?? '')} placeholder="Service tech or account rep…" showClear />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Collected At</label>
                <input type="datetime-local" value={collectedAt} onChange={e => setCollectedAt(e.target.value)}
                  className="w-full h-10 px-3 text-sm rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-red-100 transition" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Received At *</label>
                <input type="datetime-local" value={receivedAt} onChange={e => setReceivedAt(e.target.value)}
                  className="w-full h-10 px-3 text-sm rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-red-100 transition" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Priority</label>
              <SearchableDropdown options={PRIORITY_OPTIONS} value={priority} onChange={v => setPriority(v ?? 'ROUTINE')} placeholder="Priority…" showClear={false} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Tests Requested <span className="text-gray-400 font-normal normal-case">(optional)</span>
              </label>
              <textarea value={testsRequested} onChange={e => setTestsRequested(e.target.value)}
                placeholder="e.g. Water analysis, bacteriological…" rows={3}
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-red-100 transition resize-none" />
            </div>
          </div>
          <div className="px-5 py-4 flex gap-3 shrink-0" style={{ borderTop: '1px solid rgba(0,0,0,0.07)' }}>
            <button type="button" onClick={onClose}
              className="flex-1 h-10 text-sm font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" disabled={mutation.isPending}
              className="flex-1 h-10 text-sm font-semibold text-white rounded-lg transition disabled:opacity-60"
              style={{ backgroundColor: 'var(--color-primary)' }}>
              {mutation.isPending ? 'Logging…' : 'Log Sample'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Enter Results Panel ───────────────────────────────────────────────────────
function ResultsPanel({ sample, onClose }: { sample: LabSampleRecord; onClose: () => void }) {
  const qc = useQueryClient()
  const existing = sample.result
  const isUpdate = !!existing

  const [calcium, setCalcium]                     = useState(existing?.calcium?.toString() ?? '')
  const [magnesium, setMagnesium]                 = useState(existing?.magnesium?.toString() ?? '')
  const [sodium, setSodium]                       = useState(existing?.sodium?.toString() ?? '')
  const [chlorides, setChlorides]                 = useState(existing?.chlorides?.toString() ?? '')
  const [sulfates, setSulfates]                   = useState(existing?.sulfates?.toString() ?? '')
  const [bicarbonates, setBicarbonates]           = useState(existing?.bicarbonates?.toString() ?? '')
  const [iron, setIron]                           = useState(existing?.iron?.toString() ?? '')
  const [ph, setPh]                               = useState(existing?.ph?.toString() ?? '')
  const [tds, setTds]                             = useState(existing?.tds?.toString() ?? '')
  const [specificGravity, setSpecificGravity]     = useState(existing?.specificGravity?.toString() ?? '')
  const [dissolvedOxygen, setDissolvedOxygen]     = useState(existing?.dissolvedOxygen?.toString() ?? '')
  const [srbCount, setSrbCount]                   = useState(existing?.srbCount?.toString() ?? '')
  const [apbCount, setApbCount]                   = useState(existing?.apbCount?.toString() ?? '')
  const [treatmentEff, setTreatmentEff]           = useState(existing?.treatmentEffectiveness?.toString() ?? '')
  const [scaleType, setScaleType]                 = useState(existing?.scaleType ?? '')
  const [scaleSeverity, setScaleSeverity]         = useState(existing?.scaleSeverity ?? '')
  const [scaleRemediation, setScaleRemediation]   = useState(existing?.scaleRemediation ?? '')
  const [showParaffin, setShowParaffin]           = useState(!!existing?.pourPoint)
  const [pourPoint, setPourPoint]                 = useState(existing?.pourPoint?.toString() ?? '')
  const [paraffinEff, setParaffinEff]             = useState(existing?.paraffinInhibitorEffectiveness?.toString() ?? '')
  const [corrosionRate, setCorrosionRate]         = useState(existing?.corrosionRate?.toString() ?? '')
  const [corrosionPerf, setCorrosionPerf]         = useState(existing?.corrosionInhibitorPerformance?.toString() ?? '')
  const [showFailure, setShowFailure]             = useState(!!existing?.failureType)
  const [failureType, setFailureType]             = useState(existing?.failureType ?? '')
  const [failureRootCause, setFailureRootCause]   = useState(existing?.failureRootCause ?? '')
  const [failureRec, setFailureRec]               = useState(existing?.failureRecommendation ?? '')
  const [showOil, setShowOil]                     = useState(existing?.oilContent != null)
  const [oilContent, setOilContent]               = useState(existing?.oilContent?.toString() ?? '')
  const [labTechNotes, setLabTechNotes]           = useState(existing?.labTechNotes ?? '')

  const n = (v: string) => v !== '' ? parseFloat(v) : undefined

  const mutation = useMutation({
    mutationFn: (data: LabResultPayload) =>
      isUpdate ? labApi.updateResults(sample.id, data) : labApi.enterResults(sample.id, data),
    onSuccess: (res) => {
      const saved = res.data.data
      toast.success(saved?.result?.hasCriticalValues
        ? '🔴 Results saved — Critical values detected. Account rep alerted.'
        : 'Results saved')
      qc.invalidateQueries({ queryKey: ['lab'] })
      onClose()
    },
    onError: (e: unknown) =>
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed'),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    mutation.mutate({
      calcium: n(calcium), magnesium: n(magnesium), sodium: n(sodium),
      chlorides: n(chlorides), sulfates: n(sulfates), bicarbonates: n(bicarbonates),
      iron: n(iron), ph: n(ph), tds: n(tds),
      specificGravity: n(specificGravity), dissolvedOxygen: n(dissolvedOxygen),
      srbCount: n(srbCount), apbCount: n(apbCount), treatmentEffectiveness: n(treatmentEff),
      scaleType: scaleType || undefined,
      scaleSeverity: (scaleSeverity as 'LIGHT' | 'MODERATE' | 'SEVERE') || undefined,
      scaleRemediation: scaleRemediation || undefined,
      pourPoint: showParaffin ? n(pourPoint) : undefined,
      paraffinInhibitorEffectiveness: showParaffin ? n(paraffinEff) : undefined,
      corrosionRate: n(corrosionRate), corrosionInhibitorPerformance: n(corrosionPerf),
      failureType: showFailure ? failureType || undefined : undefined,
      failureRootCause: showFailure ? failureRootCause || undefined : undefined,
      failureRecommendation: showFailure ? failureRec || undefined : undefined,
      oilContent: showOil ? n(oilContent) : undefined,
      labTechNotes: labTechNotes || undefined,
    })
  }

  const isWater  = sample.sampleType === 'PRODUCED_WATER'
  const isSolid  = sample.sampleType === 'SOLID_SCRAPING'
  const isCoupon = sample.sampleType === 'CORROSION_COUPON'
  const inp = "w-full h-9 px-3 text-sm rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-red-100 transition"
  const lbl = "text-xs font-semibold text-gray-500 uppercase tracking-wide"
  const divider = (title: string) => (
    <div className="flex items-center gap-2 pt-1">
      <div className="h-px flex-1 bg-gray-100" />
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{title}</span>
      <div className="h-px flex-1 bg-gray-100" />
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative bg-white w-[440px] h-full shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">{isUpdate ? 'Update Results' : 'Enter Results'}</h2>
            <p className="text-xs text-gray-400">{sample.sampleNumber} · {SAMPLE_TYPE_LABEL[sample.sampleType]} · {sample.wellName}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">

            {isWater && (<>
              {divider('Water Analysis')}
              <div className="grid grid-cols-2 gap-3">
                {([
                  ['Calcium (Ca) mg/L', calcium, setCalcium],
                  ['Magnesium (Mg) mg/L', magnesium, setMagnesium],
                  ['Sodium (Na) mg/L', sodium, setSodium],
                  ['Chlorides (Cl) mg/L', chlorides, setChlorides],
                  ['Sulfates (SO₄) mg/L', sulfates, setSulfates],
                  ['Bicarbonates (HCO₃) mg/L', bicarbonates, setBicarbonates],
                  ['Iron (Fe) mg/L', iron, setIron],
                  ['pH', ph, setPh],
                  ['TDS mg/L', tds, setTds],
                  ['Specific Gravity', specificGravity, setSpecificGravity],
                  ['Dissolved O₂ mg/L', dissolvedOxygen, setDissolvedOxygen],
                ] as [string, string, (v: string) => void][]).map(([label, val, setter]) => (
                  <div key={label} className="space-y-1">
                    <label className={lbl}>{label}</label>
                    <input type="number" step="any" value={val} onChange={e => setter(e.target.value)} className={inp} placeholder="—" />
                  </div>
                ))}
              </div>
              {divider('Bacteriological')}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className={lbl}>SRB Count cells/mL</label>
                  <input type="number" step="1" value={srbCount} onChange={e => setSrbCount(e.target.value)} className={inp} placeholder="—" />
                </div>
                <div className="space-y-1">
                  <label className={lbl}>APB Count cells/mL</label>
                  <input type="number" step="1" value={apbCount} onChange={e => setApbCount(e.target.value)} className={inp} placeholder="—" />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className={lbl}>Treatment Effectiveness %</label>
                  <input type="number" step="any" min="0" max="100" value={treatmentEff} onChange={e => setTreatmentEff(e.target.value)} className={inp} placeholder="—" />
                </div>
              </div>
            </>)}

            {isSolid && (<>
              {divider('Scale Analysis')}
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className={lbl}>Scale Type</label>
                  <input value={scaleType} onChange={e => setScaleType(e.target.value)} className={inp} placeholder="e.g. Calcite, Barium Sulfate…" />
                </div>
                <div className="space-y-1">
                  <label className={lbl}>Severity</label>
                  <SearchableDropdown options={SCALE_SEVERITY_OPTIONS} value={scaleSeverity} onChange={v => setScaleSeverity(v ?? '')} placeholder="Select severity…" showClear />
                </div>
                <div className="space-y-1">
                  <label className={lbl}>Remediation</label>
                  <textarea value={scaleRemediation} onChange={e => setScaleRemediation(e.target.value)} rows={3}
                    placeholder="What chemical will dissolve it…"
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-red-100 transition resize-none" />
                </div>
              </div>
            </>)}

            {isCoupon && (<>
              {divider('Corrosion Wheel')}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className={lbl}>Corrosion Rate mils/yr</label>
                  <input type="number" step="any" value={corrosionRate} onChange={e => setCorrosionRate(e.target.value)} className={inp} placeholder="—" />
                </div>
                <div className="space-y-1">
                  <label className={lbl}>Inhibitor Performance %</label>
                  <input type="number" step="any" min="0" max="100" value={corrosionPerf} onChange={e => setCorrosionPerf(e.target.value)} className={inp} placeholder="—" />
                </div>
              </div>
            </>)}

            {/* Optional sections */}
            <button type="button" onClick={() => setShowParaffin(p => !p)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-dashed border-gray-200 text-xs text-gray-500 hover:bg-gray-50 transition-colors">
              <span>Paraffin Testing</span><span>{showParaffin ? '▲ Hide' : '▼ Add'}</span>
            </button>
            {showParaffin && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><label className={lbl}>Pour Point °F</label>
                  <input type="number" step="any" value={pourPoint} onChange={e => setPourPoint(e.target.value)} className={inp} placeholder="—" /></div>
                <div className="space-y-1"><label className={lbl}>Inhibitor Effectiveness %</label>
                  <input type="number" step="any" min="0" max="100" value={paraffinEff} onChange={e => setParaffinEff(e.target.value)} className={inp} placeholder="—" /></div>
              </div>
            )}

            <button type="button" onClick={() => setShowFailure(p => !p)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-dashed border-gray-200 text-xs text-gray-500 hover:bg-gray-50 transition-colors">
              <span>Failure Analysis</span><span>{showFailure ? '▲ Hide' : '▼ Add'}</span>
            </button>
            {showFailure && (
              <div className="space-y-3">
                <div className="space-y-1"><label className={lbl}>Failure Type</label>
                  <input value={failureType} onChange={e => setFailureType(e.target.value)} className={inp} placeholder="e.g. Pump, tubing, valve…" /></div>
                <div className="space-y-1"><label className={lbl}>Root Cause</label>
                  <textarea value={failureRootCause} onChange={e => setFailureRootCause(e.target.value)} rows={2}
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-red-100 transition resize-none" placeholder="Why it failed…" /></div>
                <div className="space-y-1"><label className={lbl}>Recommendation</label>
                  <textarea value={failureRec} onChange={e => setFailureRec(e.target.value)} rows={2}
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-red-100 transition resize-none" placeholder="What to change in the treatment program…" /></div>
              </div>
            )}

            <button type="button" onClick={() => setShowOil(p => !p)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-dashed border-gray-200 text-xs text-gray-500 hover:bg-gray-50 transition-colors">
              <span>Oil in Water</span><span>{showOil ? '▲ Hide' : '▼ Add'}</span>
            </button>
            {showOil && (
              <div className="space-y-1"><label className={lbl}>Oil Content mg/L</label>
                <input type="number" step="any" value={oilContent} onChange={e => setOilContent(e.target.value)} className={inp} placeholder="—" /></div>
            )}

            <div className="space-y-1.5">
              <label className={lbl}>Lab Tech Notes</label>
              <textarea value={labTechNotes} onChange={e => setLabTechNotes(e.target.value)} rows={4}
                placeholder="Observations, recommendations for account rep…"
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-red-100 transition resize-none" />
            </div>
          </div>

          <div className="px-5 py-4 flex gap-3 shrink-0" style={{ borderTop: '1px solid rgba(0,0,0,0.07)' }}>
            <button type="button" onClick={onClose}
              className="flex-1 h-10 text-sm font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" disabled={mutation.isPending}
              className="flex-1 h-10 text-sm font-semibold text-white rounded-lg transition disabled:opacity-60"
              style={{ backgroundColor: 'var(--color-primary)' }}>
              {mutation.isPending ? 'Saving…' : isUpdate ? 'Update Results' : 'Save Results'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ApprovalBadge({ status }: { status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' }) {
  const map = {
    PENDING_REVIEW: 'bg-amber-50 text-amber-700 ring-amber-200',
    APPROVED:       'bg-emerald-50 text-emerald-700 ring-emerald-200',
    REJECTED:       'bg-red-50 text-red-700 ring-red-200',
  }
  const label = { PENDING_REVIEW: 'Pending Review', APPROVED: 'Approved', REJECTED: 'Rejected' }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ${map[status]}`}>
      {label[status]}
    </span>
  )
}

// ── Lab Report Drawer ─────────────────────────────────────────────────────────
function LabReportDrawer({ sample, onClose, onEnterResults, onStartTesting }: {
  sample: LabSampleRecord; onClose: () => void; onEnterResults: () => void; onStartTesting: () => void
}) {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const canApprove = user?.role === 'ACCOUNT_REP' || user?.role === 'ADMIN'
  const canEdit    = user?.role === 'LAB_TECH'    || user?.role === 'ADMIN'
  const [approvalNotes, setApprovalNotes] = useState('')

  const { data: fullSample } = useQuery({
    queryKey: ['lab-sample', sample.id],
    queryFn: () => labApi.get(sample.id).then(res => res.data.data!),
  })

  const s = fullSample ?? sample
  const r = s.result
  const flags = criticalFlags(r)
  const isPendingReview = r?.approvalStatus === 'PENDING_REVIEW'

  const approveMutation = useMutation({
    mutationFn: (data: LabApprovePayload) => labApi.approve(sample.id, data),
    onSuccess: (res, variables) => {
      qc.invalidateQueries({ queryKey: ['lab'] })
      qc.invalidateQueries({ queryKey: ['lab-sample', sample.id] })
      qc.invalidateQueries({ queryKey: ['plans'] })
      if (variables.requiresTreatmentChange) {
        toast.success('Approved — active program superseded. Create new program.')
        navigate('/plans', { state: { wellId: sample.wellId, triggeredByLabSampleId: sample.id, sampleNumber: sample.sampleNumber } })
      } else {
        toast.success('Approved — current plan continues.')
      }
      onClose()
    },
    onError: (e: unknown) =>
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed'),
  })

  function handleApprove(requiresTreatmentChange: boolean) {
    approveMutation.mutate({ requiresTreatmentChange, approvalNotes: approvalNotes || undefined })
  }

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
      <div className="relative bg-white w-[600px] h-full shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
          <div>
            <p className="text-sm font-bold text-gray-900 font-mono">{s.sampleNumber}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {SAMPLE_TYPE_LABEL[s.sampleType]} · {s.wellName} · {s.leaseName}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={async () => {
                const res = await labApi.getPdf(s.id)
                const url = URL.createObjectURL(new Blob([res.data as BlobPart], { type: 'application/pdf' }))
                window.open(url, '_blank')
              }}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors"
              title="Download PDF">
              <FileText size={16} />
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-2">

          {flags.length > 0 && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 mb-4">
              <p className="text-xs font-bold text-red-700 uppercase tracking-wide mb-2">🔴 Critical Values Detected</p>
              <div className="flex flex-wrap gap-1.5">
                {flags.map(f => <CriticalBadge key={f} label={f} />)}
              </div>
            </div>
          )}

          {section('Sample Info')}
          {row('Client', s.clientName ?? '—')}
          {row('Lease', s.leaseName ?? '—')}
          {row('Well', s.wellName ?? '—')}
          {row('Collected By', s.collectedByName ?? '—')}
          {row('Collected At', s.collectedAt ? new Date(s.collectedAt).toLocaleString() : '—')}
          {row('Received At', new Date(s.receivedAt).toLocaleString())}
          {row('Priority', <PriorityBadge priority={s.priority} />)}
          {row('Status', s.status === 'COMPLETED' && s.approvalStatus === 'PENDING_REVIEW'
            ? <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 bg-amber-50 text-amber-700 ring-amber-200"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" />Pending Approval</span>
            : <StatusBadge status={s.status} />)}
          {s.testsRequested && row('Tests Requested', s.testsRequested)}

          {r && (<>
            {r.calcium != null && (<>
              {section('Water Analysis')}
              {row('Calcium (Ca)', fmt(r.calcium, ' mg/L'))}
              {row('Magnesium (Mg)', fmt(r.magnesium, ' mg/L'))}
              {row('Sodium (Na)', fmt(r.sodium, ' mg/L'))}
              {row('Chlorides (Cl)', fmt(r.chlorides, ' mg/L'))}
              {row('Sulfates (SO₄)', fmt(r.sulfates, ' mg/L'))}
              {row('Bicarbonates (HCO₃)', fmt(r.bicarbonates, ' mg/L'))}
              {row('Iron (Fe)', fmt(r.iron, ' mg/L'), r.iron != null && r.iron > 50)}
              {row('pH', fmt(r.ph), r.ph != null && (r.ph < 5.5 || r.ph > 9.0))}
              {row('TDS', fmt(r.tds, ' mg/L'))}
              {row('Specific Gravity', fmt(r.specificGravity))}
              {row('Dissolved Oxygen', fmt(r.dissolvedOxygen, ' mg/L'), r.dissolvedOxygen != null && r.dissolvedOxygen > 0.5)}
              {row('Scaling Index (LSI)', fmt(r.scalingIndex), r.scalingIndex != null && r.scalingIndex > 2.0)}
              {row('Corrosion Potential', r.corrosionPotential != null ? `${r.corrosionPotential}/10` : <span className="text-gray-300">—</span>)}
            </>)}

            {r.srbCount != null && (<>
              {section('Bacteriological')}
              {row('SRB Count', fmt(r.srbCount, ' cells/mL'), r.srbCount > 1000)}
              {row('APB Count', fmt(r.apbCount, ' cells/mL'), r.apbCount != null && r.apbCount > 10000)}
              {row('Treatment Effectiveness', fmt(r.treatmentEffectiveness, '%'))}
            </>)}

            {r.scaleType && (<>
              {section('Scale Analysis')}
              {row('Scale Type', r.scaleType)}
              {row('Severity', r.scaleSeverity ?? '—')}
              {r.scaleRemediation && row('Remediation', r.scaleRemediation)}
            </>)}

            {r.pourPoint != null && (<>
              {section('Paraffin')}
              {row('Pour Point', fmt(r.pourPoint, '°F'))}
              {row('Inhibitor Effectiveness', fmt(r.paraffinInhibitorEffectiveness, '%'))}
            </>)}

            {r.corrosionRate != null && (<>
              {section('Corrosion Wheel')}
              {row('Corrosion Rate', fmt(r.corrosionRate, ' mils/yr'), r.corrosionRate > 5)}
              {row('Inhibitor Performance', fmt(r.corrosionInhibitorPerformance, '%'))}
            </>)}

            {r.failureType && (<>
              {section('Failure Analysis')}
              {row('Failure Type', r.failureType)}
              {r.failureRootCause && row('Root Cause', r.failureRootCause)}
              {r.failureRecommendation && row('Recommendation', r.failureRecommendation)}
            </>)}

            {r.oilContent != null && (<>
              {section('Oil in Water')}
              {row('Oil Content', fmt(r.oilContent, ' mg/L'))}
            </>)}

            {r.labTechNotes && (<>
              {section('Lab Tech Notes')}
              <p className="text-sm text-gray-700 leading-relaxed">{r.labTechNotes}</p>
            </>)}

            <p className="text-xs text-gray-400 pt-2">
              Results by <span className="font-medium text-gray-600">{r.labTechName ?? 'Lab Tech'}</span>
              {r.completedAt && <> · {new Date(r.completedAt).toLocaleString()}</>}
              {r.alertSentAt && <> · <span className="text-red-500">Alert sent {new Date(r.alertSentAt).toLocaleString()}</span></>}
            </p>
          </>)}
        </div>

        <div className="px-6 py-4 space-y-3 shrink-0" style={{ borderTop: '1px solid rgba(0,0,0,0.07)' }}>
          {/* Approval section — shown to ACCOUNT_REP / ADMIN when results exist and pending */}
          {canApprove && r && isPendingReview && (
            <div className="space-y-2">
              <textarea
                value={approvalNotes}
                onChange={e => setApprovalNotes(e.target.value)}
                placeholder="Approval notes (optional)…"
                rows={2}
                className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-red-100 resize-none transition"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleApprove(false)}
                  disabled={approveMutation.isPending}
                  className="flex-1 h-9 text-xs font-semibold rounded-lg border-2 transition disabled:opacity-60"
                  style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}>
                  Approve — No Changes
                </button>
                <button
                  onClick={() => handleApprove(true)}
                  disabled={approveMutation.isPending}
                  className="flex-1 h-9 text-xs font-semibold text-white rounded-lg transition disabled:opacity-60"
                  style={{ backgroundColor: 'var(--color-primary)' }}>
                  Approve — Update Treatment
                </button>
              </div>
            </div>
          )}

          {/* Approval status when already actioned */}
          {r && r.approvalStatus !== 'PENDING_REVIEW' && (
            <div className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Approval</span>
                <ApprovalBadge status={r.approvalStatus} />
              </div>
              <p className="text-xs text-gray-600">
                By <span className="font-medium">{r.approvedByName ?? 'Unknown'}</span>
                {r.approvedAt && <> · {new Date(r.approvedAt).toLocaleString()}</>}
              </p>
              {r.approvalNotes && <p className="text-xs text-gray-400 italic">"{r.approvalNotes}"</p>}
            </div>
          )}

          {/* Status-driven actions */}
          <div className="flex gap-2">
            {canEdit && s.status === 'RECEIVED' && (
              <button onClick={onStartTesting}
                className="flex-1 h-9 text-xs font-semibold rounded-lg text-white transition"
                style={{ backgroundColor: 'var(--color-primary)' }}>
                Start Testing
              </button>
            )}
            {canEdit && s.status === 'IN_PROGRESS' && r?.approvalStatus !== 'APPROVED' && (
              <button onClick={onEnterResults}
                className="flex-1 h-9 text-xs font-semibold rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition">
                {r ? 'Update Results' : 'Enter Results'}
              </button>
            )}
            {s.activeTreatmentPlanId && (
              <button onClick={() => navigate('/plans')}
                className="flex items-center gap-1.5 flex-1 h-9 text-xs font-semibold text-white rounded-lg transition justify-center"
                style={{ backgroundColor: 'var(--color-primary)' }}>
                <ExternalLink size={13} /> View Plan
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main LabPage ──────────────────────────────────────────────────────────────

const FILTER_OPTIONS: DropdownOption[] = [
  { value: 'RECEIVED',         label: 'Received'         },
  { value: 'IN_PROGRESS',      label: 'In Progress'      },
  { value: 'COMPLETED',        label: 'Completed'        },
  { value: 'alerts',           label: '🔴 Alerts'        },
  { value: 'pending_approval', label: 'Pending Approval' },
]

export default function LabPage() {
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const canEdit    = user?.role === 'LAB_TECH'    || user?.role === 'ADMIN'
  const canApprove = user?.role === 'ACCOUNT_REP' || user?.role === 'ADMIN'

  const [activeTab, setActiveTab]       = useState<TabId>('all')
  const [page, setPage]                 = useState(0)
  const [logOpen, setLogOpen]           = useState(false)
  const [selected, setSelected]         = useState<LabSampleRecord | undefined>()
  const [enterResults, setEnterResults] = useState<LabSampleRecord | undefined>()

  const isAlertsTab  = activeTab === 'alerts'
  const isPendingTab = activeTab === 'pending_approval'
  const statusParam  = activeTab === 'all' || isAlertsTab || isPendingTab ? undefined : activeTab as LabSampleStatus

  const { data, isLoading } = useQuery({
    queryKey: ['lab', activeTab, page],
    queryFn: () => {
      if (isAlertsTab)  return labApi.alerts({ page, size: PAGE_SIZE }).then(r => r.data.data)
      if (isPendingTab) return labApi.pendingApprovals({ page, size: PAGE_SIZE }).then(r => r.data.data)
      return labApi.list({ status: statusParam, page, size: PAGE_SIZE }).then(r => r.data.data)
    },
  })

  const { data: wells = [] } = useQuery({
    queryKey: ['wells-all'],
    queryFn: () => wellsApi.list({ size: 200 }).then(r => r.data.data?.content ?? []),
  })

  const { data: users = [] } = useQuery({
    queryKey: ['users-all'],
    queryFn: () => usersApi.list().then(r => r.data.data ?? []),
  })

  const samples    = data?.content       ?? []
  const total      = data?.totalElements ?? 0
  const totalPages = data?.totalPages    ?? 0

  function openResults(s: LabSampleRecord) {
    setSelected(undefined)
    setEnterResults(s)
  }

  const startTestingMutation = useMutation({
    mutationFn: (s: LabSampleRecord) => labApi.update(s.id, {
      sampleType:     s.sampleType,
      wellId:         s.wellId,
      collectedById:  s.collectedById ?? undefined,
      collectedAt:    s.collectedAt   ?? undefined,
      receivedAt:     s.receivedAt,
      priority:       s.priority,
      testsRequested: s.testsRequested ?? undefined,
      status:         'IN_PROGRESS',
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lab'] }),
    onError:   () => toast.error('Failed to update status'),
  })

  const visibleFilterOptions = canApprove
    ? FILTER_OPTIONS
    : FILTER_OPTIONS.filter(o => o.value !== 'pending_approval')

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Lab</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} sample{total !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-48">
            <SearchableDropdown
              options={visibleFilterOptions}
              value={activeTab === 'all' ? '' : activeTab}
              onChange={v => { setActiveTab((v ?? 'all') as TabId); setPage(0) }}
              placeholder="All Samples"
              showClear
            />
          </div>
          {canEdit && (
            <button onClick={() => setLogOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg transition"
              style={{ backgroundColor: 'var(--color-primary)' }}>
              <Plus size={15} /> Log Sample
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: 'var(--color-primary)' }}>
              {['Sample #', 'Type', 'Well / Lease', 'Received', 'Priority', 'Status',
                ...(isAlertsTab ? ['Critical Flags'] : ['']),
              ].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-white/90 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 7 }).map((_, j) => (
                  <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" /></td>
                ))}</tr>
              ))
            ) : samples.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-14 text-center">
                  <AlertTriangle size={32} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-sm text-gray-500 font-medium">
                    {isAlertsTab ? 'No critical alerts — all samples within normal thresholds' : 'No samples found'}
                  </p>
                </td>
              </tr>
            ) : samples.map((s: LabSampleRecord) => {
              const flags = isAlertsTab ? criticalFlags(s.result) : []
              return (
                <tr key={s.id}
                  onClick={() => setSelected(s)}
                  className="cursor-pointer hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-700">{s.sampleNumber}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{SAMPLE_TYPE_LABEL[s.sampleType]}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 text-xs">{s.wellName ?? '—'}</p>
                    {s.leaseName && <p className="text-xs text-gray-400">{s.leaseName}</p>}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{new Date(s.receivedAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3"><PriorityBadge priority={s.priority} /></td>
                  <td className="px-4 py-3">
                    {s.status === 'COMPLETED' && s.approvalStatus === 'PENDING_REVIEW'
                      ? <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 bg-amber-50 text-amber-700 ring-amber-200"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" />Pending Approval</span>
                      : <StatusBadge status={s.status} />}
                  </td>
                  {isAlertsTab ? (
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {flags.map(f => <CriticalBadge key={f} label={f} />)}
                      </div>
                    </td>
                  ) : (
                    <td className="px-4 py-3 text-right">
                      <ChevronRight size={14} className="text-gray-400 ml-auto" />
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">Page {page + 1} of {totalPages} · {total} total</p>
            <div className="flex gap-2">
              <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 text-xs font-medium rounded-md border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors">Previous</button>
              <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 text-xs font-medium rounded-md border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors">Next</button>
            </div>
          </div>
        )}
      </div>

      <LogSamplePanel open={logOpen} onClose={() => setLogOpen(false)} wells={wells} users={users} />
      {enterResults && <ResultsPanel sample={enterResults} onClose={() => setEnterResults(undefined)} />}
      {selected && !enterResults && (
        <LabReportDrawer
          sample={selected}
          onClose={() => setSelected(undefined)}
          onEnterResults={() => openResults(selected)}
          onStartTesting={() => {
            startTestingMutation.mutate(selected)
            setSelected(undefined)
          }}
        />
      )}
    </div>
  )
}
