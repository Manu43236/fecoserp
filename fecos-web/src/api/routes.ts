import api from '@/lib/axios'
import type { ApiResponse, PageResponse } from '@/types'

export type RouteStatus = 'PLANNED' | 'DISPATCHED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
export type RouteStopStatus = 'PENDING' | 'COMPLETED' | 'SKIPPED'

export interface RouteStopItemRecord {
  id: string
  stopId: string
  productId: string
  productName: string | null
  quantity: number
  unit: string
  notes: string | null
}

export interface RouteStopRecord {
  id: string
  routeId: string
  leaseId: string
  leaseName: string | null
  wellId: string
  wellName: string | null
  sequenceOrder: number
  status: RouteStopStatus
  notes: string | null
  items: RouteStopItemRecord[]
}

export interface RouteRecord {
  id: string
  driverId: string
  driverName: string | null
  vehicleId: string | null
  truckNumber: string | null
  warehouseId: string | null
  warehouseName: string | null
  routeDate: string
  status: RouteStatus
  notes: string | null
  stopCount: number
  stops: RouteStopRecord[]
  createdAt: string
}

export interface RoutePayload {
  driverId: string
  vehicleId?: string
  warehouseId?: string
  routeDate: string
  status?: RouteStatus
  notes?: string
}

export interface RouteStopPayload {
  leaseId: string
  wellId: string
  notes?: string
  items?: RouteStopItemPayload[]
}

export interface RouteStopItemPayload {
  productId: string
  quantity: number
  unit: string
  notes?: string
}

export const routesApi = {
  list:       (params?: object) => api.get<ApiResponse<PageResponse<RouteRecord>>>('/api/v1/routes', { params }),
  get:        (id: string) => api.get<ApiResponse<RouteRecord>>(`/api/v1/routes/${id}`),
  create:     (data: RoutePayload) => api.post<ApiResponse<RouteRecord>>('/api/v1/routes', data),
  update:     (id: string, data: RoutePayload) => api.put<ApiResponse<RouteRecord>>(`/api/v1/routes/${id}`, data),
  delete:     (id: string) => api.delete<ApiResponse<void>>(`/api/v1/routes/${id}`),
  addStop:    (id: string, data: RouteStopPayload) => api.post<ApiResponse<RouteRecord>>(`/api/v1/routes/${id}/stops`, data),
  removeStop: (id: string, stopId: string) => api.delete<ApiResponse<RouteRecord>>(`/api/v1/routes/${id}/stops/${stopId}`),
  addItem:        (id: string, stopId: string, data: RouteStopItemPayload) => api.post<ApiResponse<RouteRecord>>(`/api/v1/routes/${id}/stops/${stopId}/items`, data),
  removeItem:     (id: string, stopId: string, itemId: string) => api.delete<ApiResponse<RouteRecord>>(`/api/v1/routes/${id}/stops/${stopId}/items/${itemId}`),
  updateStatus:   (id: string, status: RouteStatus) => api.patch<ApiResponse<RouteRecord>>(`/api/v1/routes/${id}/status`, null, { params: { status } }),
  updateStopStatus: (id: string, stopId: string, status: RouteStopStatus) => api.patch<ApiResponse<RouteRecord>>(`/api/v1/routes/${id}/stops/${stopId}/status`, null, { params: { status } }),
}
