import api from './api'

export interface Sport     { id: string; name: string; emoji: string; slug: string }
export interface League    { id: string; name: string; category: string; featured: boolean }
export interface Bookmaker { id: string; name: string; differential: string; focus: string }
export interface Market    { id: string; name: string; sportSlug: string }
export interface CustomTeam{ id: string; name: string; group: string }

// ── Esportes ──────────────────────────────────────────────────────────────────
export const sportsService = {
  getAll: async (): Promise<Sport[]> => {
    const { data } = await api.get('/cadastros/sports')
    return data
  },
  create: async (payload: Omit<Sport, 'id'>): Promise<Sport> => {
    const { data } = await api.post('/cadastros/sports', payload)
    return data
  },
  update: async (id: string, payload: Partial<Omit<Sport, 'id'>>): Promise<Sport> => {
    const { data } = await api.put(`/cadastros/sports/${id}`, payload)
    return data
  },
  remove: async (id: string): Promise<void> => {
    await api.delete(`/cadastros/sports/${id}`)
  },
}

// ── Ligas ─────────────────────────────────────────────────────────────────────
export const leaguesService = {
  getAll: async (): Promise<League[]> => {
    const { data } = await api.get('/cadastros/leagues')
    return data
  },
  create: async (payload: Omit<League, 'id'>): Promise<League> => {
    const { data } = await api.post('/cadastros/leagues', payload)
    return data
  },
  update: async (id: string, payload: Partial<Omit<League, 'id'>>): Promise<League> => {
    const { data } = await api.put(`/cadastros/leagues/${id}`, payload)
    return data
  },
  remove: async (id: string): Promise<void> => {
    await api.delete(`/cadastros/leagues/${id}`)
  },
}

// ── Casas de Apostas ──────────────────────────────────────────────────────────
export const bookmakersService = {
  getAll: async (): Promise<Bookmaker[]> => {
    const { data } = await api.get('/cadastros/bookmakers')
    return data
  },
  create: async (payload: Omit<Bookmaker, 'id'>): Promise<Bookmaker> => {
    const { data } = await api.post('/cadastros/bookmakers', payload)
    return data
  },
  update: async (id: string, payload: Partial<Omit<Bookmaker, 'id'>>): Promise<Bookmaker> => {
    const { data } = await api.put(`/cadastros/bookmakers/${id}`, payload)
    return data
  },
  remove: async (id: string): Promise<void> => {
    await api.delete(`/cadastros/bookmakers/${id}`)
  },
}

// ── Mercados ──────────────────────────────────────────────────────────────────
export const marketsService = {
  getAll: async (): Promise<Market[]> => {
    const { data } = await api.get('/cadastros/markets')
    return data
  },
  create: async (payload: Omit<Market, 'id'>): Promise<Market> => {
    const { data } = await api.post('/cadastros/markets', payload)
    return data
  },
  update: async (id: string, payload: Partial<Omit<Market, 'id'>>): Promise<Market> => {
    const { data } = await api.put(`/cadastros/markets/${id}`, payload)
    return data
  },
  remove: async (id: string): Promise<void> => {
    await api.delete(`/cadastros/markets/${id}`)
  },
}

// ── Times Personalizados ──────────────────────────────────────────────────────
export const customTeamsService = {
  getAll: async (params?: { search?: string; group?: string }): Promise<CustomTeam[]> => {
    const { data } = await api.get('/cadastros/custom-teams', { params })
    return data
  },
  create: async (payload: Omit<CustomTeam, 'id'>): Promise<CustomTeam> => {
    const { data } = await api.post('/cadastros/custom-teams', payload)
    return data
  },
  update: async (id: string, payload: Partial<Omit<CustomTeam, 'id'>>): Promise<CustomTeam> => {
    const { data } = await api.put(`/cadastros/custom-teams/${id}`, payload)
    return data
  },
  remove: async (id: string): Promise<void> => {
    await api.delete(`/cadastros/custom-teams/${id}`)
  },
}

// ── Seed ──────────────────────────────────────────────────────────────────────
export const runSeed = async () => {
  const { data } = await api.post('/cadastros/seed')
  return data
}
