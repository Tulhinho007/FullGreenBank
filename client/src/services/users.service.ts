import api from './api'

export const usersService = {
  getAll: async () => {
    const res = await api.get('/users')
    return res.data.data
  },

  create: async (data: any) => {
    const res = await api.post('/users', data)
    return res.data.data
  },

  delete: async (id: string) => {
    const res = await api.delete(`/users/${id}`)
    return res.data
  },

  updateProfile: async (data: {
    name?: string; phone?: string; password?: string;
    plan?: string; currency?: string; language?: string; theme?: string;
    twoFactorEnabled?: boolean; welcomeSeen?: boolean; avatarUrl?: string;
  }) => {
    const res = await api.patch('/users/profile/me', data)
    return res.data.data
  },

  updateProfileById: async (id: string, data: any) => {
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
