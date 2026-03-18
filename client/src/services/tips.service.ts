import api from './api'

export const tipsService = {
  getAll: async (page = 1, limit = 10) => {
    const res = await api.get(`/tips?page=${page}&limit=${limit}`)
    return res.data.data
  },

  getById: async (id: string) => {
    const res = await api.get(`/tips/${id}`)
    return res.data.data
  },

  create: async (data: {
    title: string; description: string; sport: string; event: string
    market: string; odds: number; stake: number; tipDate: string
  }) => {
    const res = await api.post('/tips', data)
    return res.data.data
  },

  delete: async (id: string) => {
    const res = await api.delete(`/tips/${id}`)
    return res.data
  },

  updateResult: async (id: string, result: string, profit: number) => {
    const res = await api.patch(`/tips/${id}/result`, { result, profit })
    return res.data.data
  },
}
