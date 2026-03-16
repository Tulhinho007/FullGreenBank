import api from './api'

export const usersService = {
  getAll: async () => {
    const res = await api.get('/users')
    return res.data.data
  },

  updateProfile: async (data: {
    name?: string; phone?: string; username?: string; password?: string
  }) => {
    const res = await api.patch('/users/profile/me', data)
    return res.data.data
  },

  updateProfileById: async (id: string, data: Record<string, string>) => {
    const res = await api.patch(`/users/${id}/profile`, data)
    return res.data.data
  },

  updateRole: async (id: string, role: string) => {
    const res = await api.patch(`/users/${id}/role`, { role })
    return res.data.data
  },

  toggleActive: async (id: string) => {
    const res = await api.patch(`/users/${id}/toggle-active`)
    return res.data.data
  },
}
