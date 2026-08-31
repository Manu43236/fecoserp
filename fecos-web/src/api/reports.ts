import api from '@/lib/axios'
import type { ApiResponse, PageResponse } from '@/types'

// ── Types ─────────────────────────────────────────────────────────────────────

export type ReportType =
  | 'MONTHLY_COST'
  | 'SERVICE_VISIT_COPY'
  | 'LAB_ANALYSIS'
  | 'PIPELINE_TREATING'
  | 'DOT_AUDIT'

export type ReportStatus = 'READY' | 'SENT'

export interface GeneratedReport {
  id: string
  reportType: ReportType
  reportTypeLabel: string
  clientId: string | null
  clientName: string | null
  periodMonth: number | null
  periodYear: number | null
  period: string | null
  status: ReportStatus
  generatedByName: string
  sentAt: string | null
  notes: string | null
  createdAt: string
}

export interface GenerateReportPayload {
  reportType: ReportType
  clientId: string
  periodMonth: number
  periodYear: number
}

// ── Download helper ───────────────────────────────────────────────────────────

async function downloadFile(url: string, filename: string, params?: Record<string, string>) {
  const token = localStorage.getItem('fecos_token')
  const fullUrl = new URL((import.meta.env.VITE_API_URL || '') + url, window.location.origin)
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v) fullUrl.searchParams.set(k, v)
    })
  }
  const res = await fetch(fullUrl.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Download failed')
  const blob = await res.blob()
  const link  = document.createElement('a')
  link.href   = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}

// ── General reports ───────────────────────────────────────────────────────────

export const generalReportsApi = {
  downloadServiceVisits: (params: { from?: string; to?: string; format: 'excel' | 'pdf' }) =>
    downloadFile('/api/v1/reports/general/service-visits',
      params.format === 'pdf' ? 'service-visits.pdf' : 'service-visits.xlsx',
      params as Record<string, string>),

  downloadDeliveries: (params: { from?: string; to?: string; format: 'excel' | 'pdf' }) =>
    downloadFile('/api/v1/reports/general/deliveries',
      params.format === 'pdf' ? 'deliveries.pdf' : 'deliveries.xlsx',
      params as Record<string, string>),

  downloadLabResults: (params: { from?: string; to?: string; format: 'excel' | 'pdf' }) =>
    downloadFile('/api/v1/reports/general/lab-results',
      params.format === 'pdf' ? 'lab-results.pdf' : 'lab-results.xlsx',
      params as Record<string, string>),

  downloadFieldActivity: (params: { from?: string; to?: string; format: 'excel' | 'pdf' }) =>
    downloadFile('/api/v1/reports/general/field-activity',
      params.format === 'pdf' ? 'field-activity.pdf' : 'field-activity.xlsx',
      params as Record<string, string>),
}

// ── Business reports ──────────────────────────────────────────────────────────

export const businessReportsApi = {
  generate: (data: GenerateReportPayload) =>
    api.post<ApiResponse<GeneratedReport>>('/api/v1/reports/business/generate', data),

  list: (params?: { page?: number; size?: number }) =>
    api.get<ApiResponse<PageResponse<GeneratedReport>>>('/api/v1/reports/business', { params }),

  download: (id: string, reportTypeLabel: string) =>
    downloadFile(`/api/v1/reports/business/${id}/download`, `${reportTypeLabel.replace(/\s+/g, '-').toLowerCase()}.pdf`),

  markSent: (id: string) =>
    api.put<ApiResponse<GeneratedReport>>(`/api/v1/reports/business/${id}/mark-sent`),
}
