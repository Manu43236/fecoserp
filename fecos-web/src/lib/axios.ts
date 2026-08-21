import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: { 'Content-Type': 'application/json' },
})

function getTenantSubdomain(): string | null {
  const parts = window.location.hostname.split('.')
  const reserved = ['api', 'www']
  if (parts.length >= 3 && !reserved.includes(parts[0])) return parts[0]
  return null
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fecos_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  const subdomain = getTenantSubdomain()
  if (subdomain) config.headers['X-Tenant-Subdomain'] = subdomain
  return config
})


api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isLoginEndpoint = (err.config?.url as string | undefined)?.includes('/auth/login')
    if (err.response?.status === 401 && !isLoginEndpoint) {
      localStorage.removeItem('fecos_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  },
)

export default api
