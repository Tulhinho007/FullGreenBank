import api from './api'

export const authService = {
  login: async (data: { email?: string; username?: string; password: string }) => {
    console.log('=== [AUTH SERVICE] login() CHAMADO ===')
    console.log('[AUTH SERVICE] data recebida:', {
      email: data.email,
      username: data.username,
      password: data.password ? '***preenchida***' : 'VAZIA',
    })

    try {
      console.log('[AUTH SERVICE] enviando POST /auth/login...')
      const res = await api.post('/auth/login', data)
      console.log('[AUTH SERVICE] resposta status:', res.status)
      console.log('[AUTH SERVICE] resposta data:', res.data)
      return res.data.data
    } catch (error: any) {
      console.error('[AUTH SERVICE] ERRO na requisição:')
      console.error('[AUTH SERVICE] status:', error?.response?.status)
      console.error('[AUTH SERVICE] data:', error?.response?.data)
      console.error('[AUTH SERVICE] message:', error?.message)
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
