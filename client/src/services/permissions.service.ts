import api from './api'

export interface PagePermission {
  module: string
  pageName: string
  pageLabel: string
  canView: boolean
  canEdit: boolean
  canDelete: boolean
}

export interface UserPermissionsResponse {
  user: { id: string; name: string; role: string }
  permissions: PagePermission[]
}

export const permissionsService = {
  // Busca permissões de um usuário
  getByUser: async (userId: string): Promise<UserPermissionsResponse> => {
    const res = await api.get(`/permissions/${userId}`)
    return res.data.data
  },

  // Salva permissões de um usuário
  save: async (userId: string, permissions: Omit<PagePermission, 'module' | 'pageLabel'>[]): Promise<void> => {
    await api.put(`/permissions/${userId}`, { permissions })
  },

  // Busca todas as páginas do sistema
  getSystemPages: async (): Promise<PagePermission[]> => {
    const res = await api.get('/permissions/pages')
    return res.data.data
  },
}
