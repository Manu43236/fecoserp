import api from '@/lib/axios'
import type { ApiResponse } from '@/types'

export interface UserRecord {
  id: string
  fullName: string
  mobileNumber: string
  email: string | null
  role: string
  isActive: boolean
  createdAt: string
  pin: string | null
}

export interface CreateUserPayload {
  fullName: string
  mobileNumber: string
  pin: string
  email?: string
  role: string
}

export interface UpdateUserPayload {
  fullName: string
  email?: string
  role: string
}

export interface SAUserRecord extends UserRecord {
  tenantId: string | null
  tenantName: string
}

export interface SACreateUserPayload {
  tenantId: string
  fullName: string
  mobileNumber: string
  pin: string
  email?: string
  role: string
}

export const saUsersApi = {
  list:   (tenantId?: string) =>
    api.get<ApiResponse<SAUserRecord[]>>('/api/v1/sa/users', { params: tenantId ? { tenantId } : {} }),
  create: (data: SACreateUserPayload) =>
    api.post<ApiResponse<UserRecord>>('/api/v1/sa/users', data),
  update: (id: string, data: UpdateUserPayload) =>
    api.put<ApiResponse<UserRecord>>(`/api/v1/sa/users/${id}`, data),
}

export const usersApi = {
  list:       () => api.get<ApiResponse<UserRecord[]>>('/api/v1/users'),
  create:     (data: CreateUserPayload) => api.post<ApiResponse<UserRecord>>('/api/v1/users', data),
  update:     (id: string, data: UpdateUserPayload) => api.put<ApiResponse<UserRecord>>(`/api/v1/users/${id}`, data),
  resetPin:   (id: string, pin: string) => api.post<ApiResponse<void>>(`/api/v1/users/${id}/reset-pin`, { pin }),
  toggle:     (id: string) => api.patch<ApiResponse<UserRecord>>(`/api/v1/users/${id}/toggle`),
  delete:     (id: string) => api.delete<ApiResponse<void>>(`/api/v1/users/${id}`),
}
