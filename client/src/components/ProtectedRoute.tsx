import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface Props {
  children: React.ReactNode
  allowedRoles?: string[]
  allowedPlans?: string[]
}

export const ProtectedRoute = ({ children, allowedRoles, allowedPlans }: Props) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-100">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  if (allowedRoles || allowedPlans) {
    const roleMatches = allowedRoles ? allowedRoles.includes(user.role) : false;
    const planMatches = allowedPlans ? allowedPlans.includes(user.plan) : false;

    // Se nenhum dos requisitos permitidos no override (role ou plan) for satisfeito, bloqueia
    if (!roleMatches && !planMatches) {
      // Mas se o único check for de roles, e deu fail (o caso padrão das outras rotas)
      // Ou seja, fallback global
      return <Navigate to="/dashboard" replace />
    }
  }

  return <>{children}</>
}
