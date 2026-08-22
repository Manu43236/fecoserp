import api from '@/lib/axios'

export type VisitStatus     = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
export type VisitStopStatus = 'PENDING' | 'COMPLETED' | 'SKIPPED'

export interface ServiceVisitStop {
  id:              string
  wellId:          string
  wellName:        string
  leaseName:       string
  clientName:      string
  sequence:        number
  status:          VisitStopStatus
  sampleCollected: boolean
  hasSoar:         boolean
  soarAcknowledged: boolean
  hasReport:       boolean
  notes:           string | null
}

export interface TreatmentLine {
  id:          string
  planLineId:  string
  tankId:      string | null
  method:      string
  pumpRunning: boolean | null
  rateFound:   number | null
  rateSetTo:   number | null
  onRate:      boolean | null
  applied:     boolean | null
  notes:       string | null
  recordedAt:  string | null
  sortOrder:   number
}

export interface TreatmentReport {
  id:             string
  stopId:         string
  wellName:       string
  leaseName:      string
  clientName:     string
  techName:       string
  performedAt:    string | null
  gpsLat:         number | null
  gpsLng:         number | null
  gpsCapturedAt:  string | null
  photoUrl:       string | null
  photoCapturedAt: string | null
  soar:           boolean
  soarNote:       string | null
  soarAckByName:  string | null
  soarAckAt:      string | null
  soarAckNote:    string | null
  sampleType:     string | null
  sampleNotes:    string | null
  signatureUrl:   string | null
  signerName:     string | null
  signedAt:       string | null
  notes:          string | null
  submittedAt:    string | null
  lines:          TreatmentLine[]
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

  getTreatmentReport: (visitId: string, stopId: string) =>
    api.get<{ data: TreatmentReport }>(`/api/v1/service-visits/${visitId}/stops/${stopId}/treatment-report`),

  acknowledgeSoar: (visitId: string, stopId: string, ackNote: string) =>
    api.post<{ data: TreatmentReport }>(`/api/v1/service-visits/${visitId}/stops/${stopId}/treatment-report/acknowledge`, { ackNote }),
}
