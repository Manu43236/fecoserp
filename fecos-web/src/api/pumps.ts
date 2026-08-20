import api from '@/lib/axios'
import type { ApiResponse, PageResponse } from '@/types'

export type PumpStatus = 'IN_SHOP' | 'DEPLOYED' | 'UNDER_REPAIR'
export type PumpOwner = 'OWN' | 'THIRD_PARTY'
export type MaintenanceType = 'SERVICE' | 'REPAIR' | 'INSPECTION'

export interface MaintenanceLogRecord {
  id: string
  maintenanceType: MaintenanceType
  performedAt: string
  performedByName: string | null
  notes: string | null
  createdAt: string
}

export interface PumpRecord {
  id: string
  serialNumber: string
  make: string | null
  model: string | null
  pumpType: string | null
  owner: PumpOwner
  status: PumpStatus
  tankId: string | null
  tankSerial: string | null
  wellId: string | null
  wellName: string | null
  leaseName: string | null
  clientName: string | null
  notes: string | null
  onActiveTreatment: boolean
  maintenanceLogs: MaintenanceLogRecord[]
  createdAt: string
}

export interface PumpPayload {
  serialNumber: string
  make?: string
  model?: string
  pumpType?: string
  owner: PumpOwner
  notes?: string
}

export interface DeployPayload {
  tankId: string
}

export interface MaintenancePayload {
  maintenanceType: MaintenanceType
  performedAt: string
  notes?: string
}

export const pumpsApi = {
  list:           (params?: object) => api.get<ApiResponse<PageResponse<PumpRecord>>>('/api/v1/pumps', { params }),
  get:            (id: string) => api.get<ApiResponse<PumpRecord>>(`/api/v1/pumps/${id}`),
  create:         (data: PumpPayload) => api.post<ApiResponse<PumpRecord>>('/api/v1/pumps', data),
  update:         (id: string, data: PumpPayload) => api.put<ApiResponse<PumpRecord>>(`/api/v1/pumps/${id}`, data),
  deploy:         (id: string, data: DeployPayload) => api.patch<ApiResponse<PumpRecord>>(`/api/v1/pumps/${id}/deploy`, data),
  pull:           (id: string) => api.patch<ApiResponse<PumpRecord>>(`/api/v1/pumps/${id}/pull`),
  sendToRepair:   (id: string) => api.patch<ApiResponse<PumpRecord>>(`/api/v1/pumps/${id}/repair`),
  logMaintenance: (id: string, data: MaintenancePayload) => api.post<ApiResponse<PumpRecord>>(`/api/v1/pumps/${id}/maintenance`, data),
  delete:         (id: string) => api.delete<ApiResponse<void>>(`/api/v1/pumps/${id}`),
}
