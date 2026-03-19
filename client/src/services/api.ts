import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fgb_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  
  const impersonateId = localStorage.getItem('fgb_impersonate_id')
  if (impersonateId) {
    config.headers['X-Impersonate-User-Id'] = impersonateId
  }
  
  return config
})

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('fgb_token')
      localStorage.removeItem('fgb_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
