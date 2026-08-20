import api from '@/lib/axios'

export type VehicleType   = 'TRUCK' | 'TRAILER' | 'SERVICE_VEHICLE'
export type VehicleStatus = 'AVAILABLE' | 'ASSIGNED' | 'ON_TRIP'

export interface Vehicle {
  id:             string
  vehicleType:    VehicleType
  make:           string
  model:          string
  year:           number
  licensePlate:   string
  vinNumber?:     string
  dotNumber?:     string
  currentMileage?: number
  status:         VehicleStatus
  notes?:         string
  createdAt:      string
}

export interface VehiclePayload {
  vehicleType:    VehicleType
  make:           string
  model:          string
  year:           number
  licensePlate:   string
  vinNumber?:     string
  dotNumber?:     string
  currentMileage?: number
  status?:        VehicleStatus
  notes?:         string
}

export const vehiclesApi = {
  list: (params?: { type?: VehicleType; status?: VehicleStatus; search?: string; page?: number; size?: number }) =>
    api.get('/api/v1/vehicles', { params }),
  get:    (id: string) => api.get(`/api/v1/vehicles/${id}`),
  create: (data: VehiclePayload) => api.post('/api/v1/vehicles', data),
  update: (id: string, data: VehiclePayload) => api.put(`/api/v1/vehicles/${id}`, data),
  delete: (id: string) => api.delete(`/api/v1/vehicles/${id}`),
}
