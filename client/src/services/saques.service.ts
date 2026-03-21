import api from './api'

export interface Saque {
  id: string
  userId: string
  userName: string
  grossValue: number
  comissionPercent: number
  netValue: number
  method: string
  status: 'CONCLUIDO' | 'PENDENTE' | 'PROCESSANDO' | 'REJEITADO'
  rejectionReason?: string
  date: string
}

export const saquesService = {
  async getAll() {
    const { data } = await api.get<Saque[]>('/saques')
    return data
  },

  async create(payload: Omit<Saque, 'id' | 'userName'>) {
    const { data } = await api.post<Saque>('/saques', payload)
    return data
  },

  async update(id: string, payload: Partial<Saque>) {
    const { data } = await api.put<Saque>(`/saques/${id}`, payload)
    return data
  },

  async delete(id: string) {
    await api.delete(`/saques/${id}`)
  }
}
