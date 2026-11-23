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
  loadedQty: number | null
  actualQtyDelivered: number | null
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
  skipReason: string | null
  items: RouteStopItemRecord[]
  deliveryPhotoUrl: string | null
  deliveryLat: number | null
  deliveryLng: number | null
  deliveredAt: string | null
  receivedAt: string | null
  syncedLate: boolean
}

export interface RouteRecord {
  id: string
  driverId: string | null
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
  driverId?: string
  vehicleId?: string
  truckNumber?: string
  warehouseId?: string
  routeDate: string
  status?: RouteStatus
  notes?: string
  stops?: RouteStopPayload[]
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

export interface SkippedStopRecord {
  stopId: string
  routeId: string
  routeDate: string | null
  wellName: string | null
  leaseName: string | null
  clientName: string | null
  skipReason: string | null
  driverName: string | null
}

export interface LoadItemPayload { itemId: string; loadedQty: number }
export interface DeliverItemPayload { itemId: string; actualQty: number }
export interface DeliverStopPayload { items?: DeliverItemPayload[]; notes?: string }

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
  confirmLoad: (id: string, items: LoadItemPayload[]) => api.post<ApiResponse<RouteRecord>>(`/api/v1/routes/${id}/load-confirmation`, { items }),
  skippedStops: () => api.get<ApiResponse<SkippedStopRecord[]>>('/api/v1/routes/skipped-stops'),
  deliverStop: (id: string, stopId: string, data: DeliverStopPayload) => api.patch<ApiResponse<RouteRecord>>(`/api/v1/routes/${id}/stops/${stopId}/deliver`, data),
  getPdf: (id: string) => api.get(`/api/v1/routes/${id}/pdf`, { responseType: 'blob' }),
}
