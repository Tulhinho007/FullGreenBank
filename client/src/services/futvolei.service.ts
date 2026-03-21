import api from './api'

export interface FutvoleiMatch {
  id: string
  player1: string   // Dupla A — Jogador 1
  player2: string   // Dupla A — Jogador 2
  player3: string   // Dupla B — Jogador 1
  player4: string   // Dupla B — Jogador 2
  stake: number
  totalSets: number
  pointsPerSet: number
  scoreA: number
  scoreB: number
  status: 'PENDING' | 'FINISHED' | 'CANCELED'
  winnerTeam: 1 | 2 | null
  finishedAt: string | null
  createdAt: string
}

export interface FutvoleiStats {
  jogosHoje: number
  totalApostadoHoje: number
}

export interface CreateMatchData {
  player1: string
  player2: string
  player3: string
  player4: string
  stake: number
  totalSets: number
  pointsPerSet: number
}

export const futvoleiService = {
  getActive: async (): Promise<FutvoleiMatch[]> => {
    const res = await api.get('/futvolei/active')
    return res.data.data
  },

  getHistory: async (): Promise<FutvoleiMatch[]> => {
    const res = await api.get('/futvolei/history')
    return res.data.data
  },

  getStats: async (): Promise<FutvoleiStats> => {
    const res = await api.get('/futvolei/stats')
    return res.data.data
  },

  create: async (data: CreateMatchData): Promise<FutvoleiMatch> => {
    const res = await api.post('/futvolei', data)
    return res.data.data
  },

  updateScore: async (id: string, scoreA: number, scoreB: number): Promise<FutvoleiMatch> => {
    const res = await api.patch(`/futvolei/${id}/score`, { scoreA, scoreB })
    return res.data.data
  },

  finalize: async (id: string, winnerTeam: 1 | 2, scoreA: number, scoreB: number): Promise<FutvoleiMatch> => {
    const res = await api.patch(`/futvolei/${id}/finalize`, { winnerTeam, scoreA, scoreB })
    return res.data.data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/futvolei/${id}`)
  },
}
