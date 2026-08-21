import api from '@/lib/axios'

export type VisitStatus     = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
export type VisitStopStatus = 'PENDING' | 'COMPLETED' | 'SKIPPED'

export interface ServiceVisitStop {
  id:              string
  wellId:          string
  wellName:        string
  leaseName:       string
  sequence:        number
  status:          VisitStopStatus
  sampleCollected: boolean
  notes:           string | null
}

export interface ServiceVisit {
  id:        string
  visitDate: string
  techId:    string
  techName:  string
  status:    VisitStatus
  notes:     string | null
  stops:     ServiceVisitStop[]
  createdAt: string
}

export interface DueWell {
  wellId:             string
  wellName:           string
  leaseName:          string
  planId:             string
  schedule:           string
  lastVisitedAt:      string | null
  daysSinceLastVisit: number | null
}

export const serviceVisitsApi = {
  list: (params?: { status?: VisitStatus; techId?: string; date?: string; page?: number; size?: number }) =>
    api.get('/api/v1/service-visits', { params }),
  get:    (id: string) => api.get(`/api/v1/service-visits/${id}`),
  create: (data: { techId: string; visitDate: string; notes?: string }) =>
    api.post('/api/v1/service-visits', data),
  update: (id: string, data: { techId?: string; visitDate?: string; status?: VisitStatus; notes?: string }) =>
    api.put(`/api/v1/service-visits/${id}`, data),
  delete: (id: string) => api.delete(`/api/v1/service-visits/${id}`),

  addStop:    (id: string, data: { wellId: string; notes?: string }) =>
    api.post(`/api/v1/service-visits/${id}/stops`, data),
  updateStop: (id: string, stopId: string, data: { status?: VisitStopStatus; sampleCollected?: boolean; notes?: string }) =>
    api.put(`/api/v1/service-visits/${id}/stops/${stopId}`, data),
  removeStop: (id: string, stopId: string) =>
    api.delete(`/api/v1/service-visits/${id}/stops/${stopId}`),

  dueWells: (date: string) =>
    api.get('/api/v1/service-visits/due-wells', { params: { date } }),
}
