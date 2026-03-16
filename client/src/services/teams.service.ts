import api from './api'

export interface Team {
  id: number
  name: string
  group: string
}

export const teamsService = {
  search: async (params: { search?: string; group?: string; page?: number; limit?: number }) => {
    const res = await api.get('/teams', { params })
    return res.data.data as { teams: Team[]; total: number; page: number; totalPages: number }
  },

  getGroups: async (): Promise<string[]> => {
    const res = await api.get('/teams/groups')
    return res.data.data
  },
}
