import api from './api'

export const authService = {
  // Agora aceita explicitamente email ou username
  login: async (data: { email?: string; username?: string; password: string }) => {
    try {
      const res = await api.post('/auth/login', data)
      return res.data.data
    } catch (error) {
      // Relança o erro para ser tratado pelo componente UI
      throw error
    }
  },

  register: async (data: {
    name: string; email: string; phone?: string; username: string; password: string
  }) => {
    const res = await api.post('/auth/register', data)
    return res.data.data
  },

  getMe: async () => {
    const res = await api.get('/auth/me')
    return res.data.data
  },
}