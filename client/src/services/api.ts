import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

// Attach headers dynamically
api.interceptors.request.use((config) => {
  // O token JWT agora vai automaticamente via cookie httpOnly.
  // Não precisamos mais inserir Authorization
  
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
      localStorage.removeItem('fgb_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
