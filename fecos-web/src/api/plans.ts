import api from '@/lib/axios'
import type { ApiResponse, PageResponse } from '@/types'

export type PlanStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'SUSPENDED' | 'COMPLETED' | 'INACTIVE' | 'SUPERSEDED'
export type PlanMethod = 'CONTINUOUS' | 'BATCH'
export type PlanSchedule = 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY'

export type TankOwner = 'ENDURA' | 'THIRD_PARTY'

export interface PlanLineRecord {
  id: string
  programId: string
  productId: string
  productName: string
  recRate: number
  method: PlanMethod
  schedule: PlanSchedule | null
  notes: string | null
  tankOwner: TankOwner | null
  tankLevelPct: number | null
  tankLevelCheckedAt: string | null
  tankId: string | null
  calculatedLevelPct: number | null
}

export interface PlanRecord {
  id: string
  wellId: string
  wellName: string | null
  leaseName: string | null
  clientName: string | null
  accountRepId: string | null
  accountRepName: string | null
  status: PlanStatus
  notes: string | null
  startDate: string | null
  endDate: string | null
  startedAt: string | null
  pausedAt: string | null
  resumedAt: string | null
  lines: PlanLineRecord[]
  lineCount: number
  createdAt: string
}

export interface PlanPayload {
  wellId: string
  accountRepId?: string | null
  status: PlanStatus
  notes?: string
  startDate?: string | null
  endDate?: string | null
}

export interface PlanLinePayload {
  productId: string
  recRate: number
  method: PlanMethod
  schedule?: PlanSchedule | null
  notes?: string
  tankOwner?: TankOwner | null
  tankLevelPct?: number | null
  tankLevelCheckedAt?: string | null
  tankId?: string | null
}

export const plansApi = {
  list:       (params?: object) => api.get<ApiResponse<PageResponse<PlanRecord>>>('/api/v1/plans', { params }),
  get:        (id: string) => api.get<ApiResponse<PlanRecord>>(`/api/v1/plans/${id}`),
  create:     (data: PlanPayload) => api.post<ApiResponse<PlanRecord>>('/api/v1/plans', data),
  update:     (id: string, data: PlanPayload) => api.put<ApiResponse<PlanRecord>>(`/api/v1/plans/${id}`, data),
  delete:     (id: string) => api.delete<ApiResponse<void>>(`/api/v1/plans/${id}`),
  addLine:    (id: string, data: PlanLinePayload) => api.post<ApiResponse<PlanRecord>>(`/api/v1/plans/${id}/lines`, data),
  updateLine: (id: string, lineId: string, data: PlanLinePayload) => api.put<ApiResponse<PlanRecord>>(`/api/v1/plans/${id}/lines/${lineId}`, data),
  removeLine:  (id: string, lineId: string) => api.delete<ApiResponse<void>>(`/api/v1/plans/${id}/lines/${lineId}`),
  start:       (id: string) => api.post<ApiResponse<PlanRecord>>(`/api/v1/plans/${id}/start`),
  pause:       (id: string) => api.post<ApiResponse<PlanRecord>>(`/api/v1/plans/${id}/pause`),
  resume:      (id: string) => api.post<ApiResponse<PlanRecord>>(`/api/v1/plans/${id}/resume`),
  suspend:     (id: string) => api.post<ApiResponse<PlanRecord>>(`/api/v1/plans/${id}/suspend`),
  complete:    (id: string) => api.post<ApiResponse<PlanRecord>>(`/api/v1/plans/${id}/complete`),
}
