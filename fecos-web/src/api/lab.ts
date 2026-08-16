import api from '@/lib/axios'
import type { ApiResponse, PageResponse } from '@/types'

export type SampleType     = 'PRODUCED_WATER' | 'SOLID_SCRAPING' | 'CORROSION_COUPON'
export type SamplePriority = 'ROUTINE' | 'RUSH'
export type LabSampleStatus = 'RECEIVED' | 'IN_PROGRESS' | 'COMPLETED'
export type ScaleSeverity  = 'LIGHT' | 'MODERATE' | 'SEVERE'
export type ApprovalStatus = 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED'

export interface LabResultRecord {
  id: string
  labTechId: string | null
  labTechName: string | null
  completedAt: string | null
  // Water Analysis
  calcium: number | null
  magnesium: number | null
  sodium: number | null
  chlorides: number | null
  sulfates: number | null
  bicarbonates: number | null
  iron: number | null
  ph: number | null
  tds: number | null
  specificGravity: number | null
  dissolvedOxygen: number | null
  scalingIndex: number | null
  corrosionPotential: number | null
  // Bacteriological
  srbCount: number | null
  apbCount: number | null
  treatmentEffectiveness: number | null
  // Scale Analysis
  scaleType: string | null
  scaleSeverity: ScaleSeverity | null
  scaleRemediation: string | null
  // Paraffin
  pourPoint: number | null
  paraffinInhibitorEffectiveness: number | null
  // Corrosion Wheel
  corrosionRate: number | null
  corrosionInhibitorPerformance: number | null
  // Failure Analysis
  failureType: string | null
  failureRootCause: string | null
  failureRecommendation: string | null
  // Oil in Water
  oilContent: number | null
  // Notes & Alerts
  labTechNotes: string | null
  hasCriticalValues: boolean
  alertSentAt: string | null
  // Approval
  approvalStatus: ApprovalStatus
  approvedById: string | null
  approvedByName: string | null
  approvedAt: string | null
  approvalNotes: string | null
  requiresTreatmentChange: boolean
}

export interface LabSampleRecord {
  id: string
  sampleNumber: string
  sampleType: SampleType
  wellId: string
  wellName: string | null
  leaseName: string | null
  clientName: string | null
  collectedById: string | null
  collectedByName: string | null
  collectedAt: string | null
  receivedAt: string
  priority: SamplePriority
  testsRequested: string | null
  status: LabSampleStatus
  createdAt: string
  activeTreatmentPlanId: string | null
  activeTreatmentPlanStatus: string | null
  result: LabResultRecord | null
}

export interface LabSamplePayload {
  sampleType: SampleType
  wellId: string
  collectedById?: string
  collectedAt?: string
  receivedAt: string
  priority?: SamplePriority
  testsRequested?: string
  status?: LabSampleStatus
}

export interface LabApprovePayload {
  requiresTreatmentChange: boolean
  approvalNotes?: string
}

export interface LabResultPayload {
  calcium?: number
  magnesium?: number
  sodium?: number
  chlorides?: number
  sulfates?: number
  bicarbonates?: number
  iron?: number
  ph?: number
  tds?: number
  specificGravity?: number
  dissolvedOxygen?: number
  srbCount?: number
  apbCount?: number
  treatmentEffectiveness?: number
  scaleType?: string
  scaleSeverity?: ScaleSeverity
  scaleRemediation?: string
  pourPoint?: number
  paraffinInhibitorEffectiveness?: number
  corrosionRate?: number
  corrosionInhibitorPerformance?: number
  failureType?: string
  failureRootCause?: string
  failureRecommendation?: string
  oilContent?: number
  labTechNotes?: string
}

export const labApi = {
  list:         (params?: object) => api.get<ApiResponse<PageResponse<LabSampleRecord>>>('/api/v1/lab/samples', { params }),
  get:          (id: string)      => api.get<ApiResponse<LabSampleRecord>>(`/api/v1/lab/samples/${id}`),
  create:       (data: LabSamplePayload) => api.post<ApiResponse<LabSampleRecord>>('/api/v1/lab/samples', data),
  update:       (id: string, data: LabSamplePayload) => api.put<ApiResponse<LabSampleRecord>>(`/api/v1/lab/samples/${id}`, data),
  enterResults: (id: string, data: LabResultPayload) => api.post<ApiResponse<LabSampleRecord>>(`/api/v1/lab/samples/${id}/results`, data),
  updateResults:(id: string, data: LabResultPayload) => api.put<ApiResponse<LabSampleRecord>>(`/api/v1/lab/samples/${id}/results`, data),
  approve:          (id: string, data: LabApprovePayload) => api.post<ApiResponse<LabSampleRecord>>(`/api/v1/lab/samples/${id}/approve`, data),
  pendingApprovals: (params?: object) => api.get<ApiResponse<PageResponse<LabSampleRecord>>>('/api/v1/lab/pending-approvals', { params }),
  alerts:       (params?: object) => api.get<ApiResponse<PageResponse<LabSampleRecord>>>('/api/v1/lab/alerts', { params }),
}
