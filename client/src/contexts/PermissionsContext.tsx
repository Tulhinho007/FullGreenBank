import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { permissionsService, PagePermission } from '../services/permissions.service'

interface PermissionsContextType {
  permissions: PagePermission[]
  loading: boolean
  canView:   (pageName: string) => boolean
  canEdit:   (pageName: string) => boolean
  canDelete: (pageName: string) => boolean
  reload:    () => void
}

const PermissionsContext = createContext<PermissionsContextType>({
  permissions: [],
  loading: true,
  canView:   () => false,
  canEdit:   () => false,
  canDelete: () => false,
  reload:    () => {},
})

export const PermissionsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth()
  const [permissions, setPermissions] = useState<PagePermission[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPermissions = async () => {
    if (!user) { setLoading(false); return }

    // MASTER e ADMIN têm acesso total — não precisam de permissões granulares
    if (user.role === 'MASTER' || user.role === 'ADMIN') {
      setPermissions([])
      setLoading(false)
      return
    }

    try {
      const data = await permissionsService.getByUser(user.id)
      setPermissions(data.permissions)
    } catch {
      setPermissions([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPermissions() }, [user?.id])

  const isAdminOrMaster = user?.role === 'MASTER' || user?.role === 'ADMIN'

  const canView   = (pageName: string) => isAdminOrMaster || (permissions.find(p => p.pageName === pageName)?.canView   ?? false)
  const canEdit   = (pageName: string) => isAdminOrMaster || (permissions.find(p => p.pageName === pageName)?.canEdit   ?? false)
  const canDelete = (pageName: string) => isAdminOrMaster || (permissions.find(p => p.pageName === pageName)?.canDelete ?? false)

  return (
    <PermissionsContext.Provider value={{ permissions, loading, canView, canEdit, canDelete, reload: fetchPermissions }}>
      {children}
    </PermissionsContext.Provider>
  )
}

export const usePermissions = () => useContext(PermissionsContext)
