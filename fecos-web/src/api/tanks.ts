import api from '@/lib/axios'
import type { ApiResponse, PageResponse } from '@/types'

export type TankStatus = 'AVAILABLE' | 'ASSIGNED' | 'INSTALLED' | 'CLEANING'
export type TankEventType = 'INSTALLED' | 'FILLED' | 'RATE_CHANGED' | 'REFILLED' | 'REMOVED' | 'EMPTIED' | 'PAUSED' | 'RESUMED'

export interface TankEventRecord {
  id: string
  eventType: TankEventType
  amountGallons: number | null
  recRate: number | null
  levelPct: number | null
  performedByName: string | null
  eventAt: string
  createdAt: string
}

export interface TankRecord {
  id: string
  serialNumber: string | null
  capacityGallons: number
  wellId: string | null
  wellName: string | null
  leaseName: string | null
  clientName: string | null
  status: TankStatus
  installedAt: string | null
  removedAt: string | null
  calculatedLevelPct: number
  calculatedLevelGallons: number
  lastRefilledAt: string | null
  events: TankEventRecord[]
  createdAt: string
}

export interface TankPayload {
  serialNumber?: string
  capacityGallons: number
  wellId?: string | null
  status?: TankStatus
  installedAt?: string | null
}

export interface TankEventPayload {
  eventType: TankEventType
  amountGallons?: number | null
  recRate?: number | null
  levelPct?: number | null
  eventAt: string
}

export const tanksApi = {
  list:     (params?: object) => api.get<ApiResponse<PageResponse<TankRecord>>>('/api/v1/tanks', { params }),
  get:      (id: string) => api.get<ApiResponse<TankRecord>>(`/api/v1/tanks/${id}`),
  create:   (data: TankPayload) => api.post<ApiResponse<TankRecord>>('/api/v1/tanks', data),
  update:   (id: string, data: TankPayload) => api.put<ApiResponse<TankRecord>>(`/api/v1/tanks/${id}`, data),
  delete:        (id: string) => api.delete<ApiResponse<void>>(`/api/v1/tanks/${id}`),
  markAvailable: (id: string) => api.patch<ApiResponse<void>>(`/api/v1/tanks/${id}/available`),
  logEvent: (id: string, data: TankEventPayload) => api.post<ApiResponse<TankRecord>>(`/api/v1/tanks/${id}/events`, data),
  getLevel: (id: string) => api.get<ApiResponse<number>>(`/api/v1/tanks/${id}/level`),
}
