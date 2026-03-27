import api from './api'

export const tipsService = {
  getAll: async (page = 1, limit = 10, authorId?: string, isPublic?: boolean) => {
    let url = `/tips?page=${page}&limit=${limit}`
    if (authorId) url += `&authorId=${authorId}`
    if (isPublic !== undefined) url += `&isPublic=${isPublic}`
    const res = await api.get(url)
    return res.data.data
  },

  getById: async (id: string) => {
    const res = await api.get(`/tips/${id}`)
    return res.data.data
  },

create: async (data: any) => {
  console.log('📦 Payload:', JSON.stringify(data, null, 2))
  try {
    const res = await api.post('/tips', data)
    return res.data.data
  } catch (err: any) {
    console.error('❌ Erro response:', err.response?.data)
    throw err
  }
},

  delete: async (id: string) => {
    const res = await api.delete(`/tips/${id}`)
    return res.data
  },

  update: async (id: string, data: any) => {
    const res = await api.patch(`/tips/${id}`, data)
    return res.data.data
  },

  updateResult: async (id: string, result: string, profit: number, valorCashout?: number) => {
    const res = await api.patch(`/tips/${id}/result`, { result, profit, valorCashout })
    return res.data.data
  },
}
