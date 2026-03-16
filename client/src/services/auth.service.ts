import api from './api'

export const authService = {
  login: async (data: { email: string; password: string }) => {
    const res = await api.post('/auth/login', data)
    return res.data.data
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
