import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  FileDown, FileText, BarChart3, X, ChevronDown,
  Send, Download, RefreshCw, Plus
} from 'lucide-react'
import {
  generalReportsApi, businessReportsApi,
  type GeneratedReport, type ReportType, type GenerateReportPayload
} from '@/api/reports'
import { clientsApi } from '@/api/clients'

// ── Types ─────────────────────────────────────────────────────────────────────

type GeneralTab = 'service-visits' | 'deliveries' | 'lab-results' | 'field-activity'
type MainTab    = 'general' | 'business'

const GENERAL_TABS: { id: GeneralTab; label: string }[] = [
  { id: 'service-visits', label: 'Service Visits' },
  { id: 'deliveries',     label: 'Deliveries'     },
  { id: 'lab-results',    label: 'Lab Results'     },
  { id: 'field-activity', label: 'Field Activity'  },
]

const BUSINESS_REPORT_TYPES: { value: ReportType; label: string; needsClient: boolean; hasPeriod: boolean }[] = [
  { value: 'MONTHLY_COST',       label: 'Monthly Cost Summary',   needsClient: true,  hasPeriod: true  },
  { value: 'SERVICE_VISIT_COPY', label: 'Service Report Copy',    needsClient: true,  hasPeriod: true  },
  { value: 'LAB_ANALYSIS',       label: 'Lab Analysis Report',    needsClient: true,  hasPeriod: true  },
  { value: 'PIPELINE_TREATING',  label: 'Pipeline Treating Report', needsClient: true, hasPeriod: true },
  { value: 'DOT_AUDIT',          label: 'DOT Audit Report',       needsClient: false, hasPeriod: false },
]

const MONTHS = [
  { value: 1,  label: 'January'   }, { value: 2,  label: 'February'  },
  { value: 3,  label: 'March'     }, { value: 4,  label: 'April'     },
  { value: 5,  label: 'May'       }, { value: 6,  label: 'June'      },
  { value: 7,  label: 'July'      }, { value: 8,  label: 'August'    },
  { value: 9,  label: 'September' }, { value: 10, label: 'October'   },
  { value: 11, label: 'November'  }, { value: 12, label: 'December'  },
]

const currentYear  = new Date().getFullYear()
const currentMonth = new Date().getMonth() + 1
const YEARS = Array.from({ length: 3 }, (_, i) => currentYear - i)

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    READY: 'bg-blue-50 text-blue-700 ring-blue-200',
    SENT:  'bg-emerald-50 text-emerald-700 ring-emerald-200',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ${map[status] ?? 'bg-gray-50 text-gray-600 ring-gray-200'}`}>
      {status}
    </span>
  )
}

// ── Date range filter ─────────────────────────────────────────────────────────

function DateRangeFilter({
  from, to, onFromChange, onToChange
}: {
  from: string; to: string;
  onFromChange: (v: string) => void;
  onToChange:   (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500">From</span>
      <input
        type="date"
        value={from}
        onChange={e => onFromChange(e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
      />
      <span className="text-sm text-gray-500">To</span>
      <input
        type="date"
        value={to}
        onChange={e => onToChange(e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
      />
    </div>
  )
}

// ── Download buttons ──────────────────────────────────────────────────────────

function DownloadButtons({ onExcel, onPdf, loading }: {
  onExcel: () => void; onPdf: () => void; loading: boolean
}) {
  return (
    <div className="flex gap-2">
      <button
        onClick={onExcel}
        disabled={loading}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
      >
        <FileDown size={15} />
        Excel
      </button>
      <button
        onClick={onPdf}
        disabled={loading}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50 transition-colors"
      >
        <FileText size={15} />
        PDF
      </button>
    </div>
  )
}

// ── General Reports Tab ───────────────────────────────────────────────────────

function GeneralReportsTab() {
  const [activeTab, setActiveTab] = useState<GeneralTab>('service-visits')
  const [from, setFrom]           = useState('')
  const [to, setTo]               = useState('')
  const [loading, setLoading]     = useState(false)

  const params = { from: from || undefined, to: to || undefined }

  async function handle(fn: () => Promise<void>) {
    setLoading(true)
    try { await fn() }
    catch { toast.error('Download failed') }
    finally { setLoading(false) }
  }

  const actions: Record<GeneralTab, { excel: () => Promise<void>; pdf: () => Promise<void> }> = {
    'service-visits': {
      excel: () => generalReportsApi.downloadServiceVisits({ ...params, format: 'excel' }),
      pdf:   () => generalReportsApi.downloadServiceVisits({ ...params, format: 'pdf'   }),
    },
    'deliveries': {
      excel: () => generalReportsApi.downloadDeliveries({ ...params, format: 'excel' }),
      pdf:   () => generalReportsApi.downloadDeliveries({ ...params, format: 'pdf'   }),
    },
    'lab-results': {
      excel: () => generalReportsApi.downloadLabResults({ ...params, format: 'excel' }),
      pdf:   () => generalReportsApi.downloadLabResults({ ...params, format: 'pdf'   }),
    },
    'field-activity': {
      excel: () => generalReportsApi.downloadFieldActivity({ ...params, format: 'excel' }),
      pdf:   () => generalReportsApi.downloadFieldActivity({ ...params, format: 'pdf'   }),
    },
  }

  return (
    <div>
      {/* Sub-tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {GENERAL_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters + download */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <DateRangeFilter from={from} to={to} onFromChange={setFrom} onToChange={setTo} />
        <DownloadButtons
          onExcel={() => handle(actions[activeTab].excel)}
          onPdf={() => handle(actions[activeTab].pdf)}
          loading={loading}
        />
      </div>

      {/* Info card */}
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
        <FileDown size={40} className="mx-auto mb-3 text-gray-300" />
        <p className="text-sm font-medium text-gray-700 mb-1">
          {GENERAL_TABS.find(t => t.id === activeTab)?.label}
        </p>
        <p className="text-sm text-gray-500 mb-4">
          Set your date range above and click Excel or PDF to download the report.
        </p>
        <DownloadButtons
          onExcel={() => handle(actions[activeTab].excel)}
          onPdf={() => handle(actions[activeTab].pdf)}
          loading={loading}
        />
      </div>
    </div>
  )
}

// ── Generate Report Panel ─────────────────────────────────────────────────────

function GenerateReportPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState<Partial<GenerateReportPayload>>({
    periodMonth: currentMonth,
    periodYear:  currentYear,
  })

  const { data: clientsData } = useQuery({
    queryKey: ['clients-dropdown'],
    queryFn: () => clientsApi.list({ size: 200 }),
    enabled: open,
  })
  const clients = clientsData?.data?.data?.content ?? []

  const mutation = useMutation({
    mutationFn: () => businessReportsApi.generate(form as GenerateReportPayload),
    onSuccess: () => {
      toast.success('Report created')
      qc.invalidateQueries({ queryKey: ['business-reports'] })
      onClose()
      setForm({ periodMonth: currentMonth, periodYear: currentYear })
    },
    onError: () => toast.error('Failed to create report'),
  })

  const selectedType = BUSINESS_REPORT_TYPES.find(t => t.value === form.reportType)

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" />
      <div className="fixed right-0 top-0 bottom-0 w-[440px] bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Generate Business Report</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Report type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Type *</label>
            <div className="relative">
              <select
                value={form.reportType ?? ''}
                onChange={e => setForm(f => ({ ...f, reportType: e.target.value as ReportType }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              >
                <option value="">Select report type…</option>
                {BUSINESS_REPORT_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-3 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Client */}
          {selectedType?.needsClient && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
              <div className="relative">
                <select
                  value={form.clientId ?? ''}
                  onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                >
                  <option value="">Select client…</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.companyName}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-3 text-gray-400 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Period */}
          {selectedType?.hasPeriod && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Month *</label>
                <div className="relative">
                  <select
                    value={form.periodMonth ?? ''}
                    onChange={e => setForm(f => ({ ...f, periodMonth: Number(e.target.value) }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  >
                    {MONTHS.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-3 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year *</label>
                <div className="relative">
                  <select
                    value={form.periodYear ?? ''}
                    onChange={e => setForm(f => ({ ...f, periodYear: Number(e.target.value) }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  >
                    {YEARS.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-3 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          )}

          {/* Info box */}
          {selectedType && (
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800">
              <strong>{selectedType.label}</strong>
              {' — '}
              {selectedType.needsClient ? 'Pulls all data for the selected client and period.' : 'Pulls compliance data for all routes.'}
              {' Click Generate to create the record. Download the PDF anytime from the list.'}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !form.reportType || (selectedType?.needsClient && !form.clientId)}
            className="px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 transition-colors"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {mutation.isPending ? 'Generating…' : 'Generate Report'}
          </button>
        </div>
      </div>
    </>
  )
}

// ── Business Reports Tab ──────────────────────────────────────────────────────

function BusinessReportsTab() {
  const qc = useQueryClient()
  const [panelOpen, setPanelOpen] = useState(false)
  const [downloading, setDownloading] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['business-reports'],
    queryFn: () => businessReportsApi.list({ size: 50 }),
  })
  const reports: GeneratedReport[] = data?.data?.data?.content ?? []

  const markSentMutation = useMutation({
    mutationFn: (id: string) => businessReportsApi.markSent(id),
    onSuccess: () => {
      toast.success('Marked as sent')
      qc.invalidateQueries({ queryKey: ['business-reports'] })
    },
    onError: () => toast.error('Failed to mark as sent'),
  })

  async function handleDownload(report: GeneratedReport) {
    setDownloading(report.id)
    try {
      await businessReportsApi.download(report.id, report.reportTypeLabel)
    } catch {
      toast.error('Download failed')
    } finally {
      setDownloading(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-gray-500">
            Generate professional PDF reports to send to clients.
          </p>
        </div>
        <button
          onClick={() => setPanelOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          <Plus size={16} />
          Generate Report
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <BarChart3 size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="text-sm font-medium text-gray-700 mb-1">No reports yet</p>
          <p className="text-sm text-gray-500 mb-4">
            Generate your first client-facing business report.
          </p>
          <button
            onClick={() => setPanelOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            <Plus size={16} />
            Generate Report
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Client</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Period</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Generated By</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reports.map(r => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{r.reportTypeLabel}</td>
                  <td className="px-4 py-3 text-gray-600">{r.clientName ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{r.period ?? '—'}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-3 text-gray-600">{r.generatedByName}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleDownload(r)}
                        disabled={downloading === r.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                        title="Download PDF"
                      >
                        {downloading === r.id
                          ? <RefreshCw size={13} className="animate-spin" />
                          : <Download size={13} />
                        }
                        PDF
                      </button>
                      {r.status === 'READY' && (
                        <button
                          onClick={() => markSentMutation.mutate(r.id)}
                          disabled={markSentMutation.isPending}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 transition-colors"
                          title="Mark as sent to client"
                        >
                          <Send size={13} />
                          Mark Sent
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <GenerateReportPanel open={panelOpen} onClose={() => setPanelOpen(false)} />
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [mainTab, setMainTab] = useState<MainTab>('general')

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-500 mt-1">
          General data exports and client-facing business reports.
        </p>
      </div>

      {/* Main tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        <button
          onClick={() => setMainTab('general')}
          className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            mainTab === 'general'
              ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <span className="flex items-center gap-2">
            <FileDown size={15} />
            General Reports
          </span>
        </button>
        <button
          onClick={() => setMainTab('business')}
          className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            mainTab === 'business'
              ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <span className="flex items-center gap-2">
            <BarChart3 size={15} />
            Business Reports
          </span>
        </button>
      </div>

      {mainTab === 'general'  && <GeneralReportsTab  />}
      {mainTab === 'business' && <BusinessReportsTab />}
    </div>
  )
}
