import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { usePermissions } from '../contexts/PermissionsContext'
import { useAuth } from '../contexts/AuthContext'

interface PermissionGateProps {
  pageName: string
  require?: 'view' | 'edit' | 'delete'
  children: ReactNode
  /** Se true, redireciona para /dashboard ao invés de mostrar tela de bloqueio */
  redirect?: boolean
}

export const PermissionGate = ({
  pageName,
  require = 'view',
  children,
  redirect = false,
}: PermissionGateProps) => {
  const { user } = useAuth()
  const { canView, canEdit, canDelete, loading } = usePermissions()

  // MASTER e ADMIN passam sempre
  if (user?.role === 'MASTER' || user?.role === 'ADMIN') {
    return <>{children}</>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const hasAccess =
    require === 'view'   ? canView(pageName)   :
    require === 'edit'   ? canEdit(pageName)   :
    require === 'delete' ? canDelete(pageName) : false

  if (!hasAccess) {
    if (redirect) return <Navigate to="/dashboard" replace />

    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="w-16 h-16 rounded-full bg-red-900/30 border border-red-800/50 flex items-center justify-center text-3xl">
          🔒
        </div>
        <h2 className="text-xl font-bold text-white">Acesso Restrito</h2>
        <p className="text-slate-400 text-sm text-center max-w-xs">
          Você não tem permissão para acessar esta página.<br />
          Entre em contato com o administrador.
        </p>
      </div>
    )
  }

  return <>{children}</>
}
