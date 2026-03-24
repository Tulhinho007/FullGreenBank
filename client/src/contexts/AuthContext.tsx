import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authService } from '../services/auth.service'
import toast from 'react-hot-toast'
import { addLog } from '../services/log.service'
import { checkSubscription } from '../utils/subscription'

export interface User {
  id: string
  name: string
  email: string
  phone?: string
  username: string
  role: 'MASTER' | 'ADMIN' | 'TESTER' | 'MEMBRO'
  active: boolean
  isTipster?: boolean
  plan: string
  currency: string
  language: string
  theme: string
  twoFactorEnabled: boolean
  avatarUrl?: string
  paymentStatus?: string
  purchaseDate?: string | null
  lastPaymentDate?: string | null
  dueDate?: string | null
  isActive?: boolean
  value?: number | null
  payMethod?: string
  notes?: string
  createdAt: string
}

// Tipagem atualizada para suportar o novo payload de login
type LoginPayload = { email?: string; username?: string; password: string };

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  login: (payload: LoginPayload) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  updateUser: (user: User) => void
  impersonateUser: (targetUser: User) => void
  stopImpersonating: () => void
  isImpersonating: boolean
}

interface RegisterData {
  name: string; email: string; phone?: string; username: string; password: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token] = useState<string | null>(null) // Token state mantido por compatibilidade
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      const savedUser = localStorage.getItem('fgb_user')
      
      if (savedUser) {
        setUser(JSON.parse(savedUser))
      }
      
      try {
        const freshUser = await authService.getMe()
        if (freshUser) {
          const { status, isActive } = checkSubscription(freshUser)
          const userWithStatus = { ...freshUser, paymentStatus: status, isActive }
          setUser(userWithStatus)
          localStorage.setItem('fgb_user', JSON.stringify(userWithStatus))
        }
      } catch (err) {
        console.error('Failed to refresh user', err)
        setUser(null)
        localStorage.removeItem('fgb_user')
        // We log out automatically if me fails, handled by global interceptor anyway
      } finally {
        setLoading(false)
      }
    }
    initAuth()
  }, [])

  const isImpersonating = !!localStorage.getItem('fgb_impersonate_id')

  // Função login simplificada e integrada com o novo service
  const login = async (payload: LoginPayload) => {
    try {
      const userRes = await authService.login(payload)
      
      // Validação de assinatura
      const { status, isActive } = checkSubscription(userRes)
      const userWithStatus = { ...userRes, paymentStatus: status, isActive }
      
      // Persistência de estado
      setUser(userWithStatus)
      localStorage.setItem('fgb_user', JSON.stringify(userWithStatus))
      
      // Log de auditoria
      addLog({ 
        userEmail: userRes.email, 
        userName: userRes.name, 
        userRole: userRes.role, 
        category: 'Auth', 
        action: 'Login realizado', 
        detail: 'Acesso ao sistema via interface' 
      })

      // NOTA: O toast.success foi removido daqui para evitar duplicidade 
      // com o toast que já existe na LoginPage.tsx
    } catch (err) {
      // Importante: repassa o erro para que o componente (LoginPage) trate os status 401/404
      throw err
    }
  }

  const register = async (data: RegisterData) => {
    try {
      const userRes = await authService.register(data)
      setUser(userRes)
      localStorage.setItem('fgb_user', JSON.stringify(userRes))
      
      addLog({ 
        userEmail: userRes.email, 
        userName: userRes.name, 
        userRole: userRes.role, 
        category: 'Auth', 
        action: 'Cadastro realizado', 
        detail: 'Nova conta criada' 
      })
      toast.success('Conta criada com sucesso! 🎉')
    } catch (err) {
      throw err
    }
  }

  const logout = () => {
    if (user) {
      addLog({ 
        userEmail: user.email, 
        userName: user.name, 
        userRole: user.role, 
        category: 'Auth', 
        action: 'Logout', 
        detail: 'Sessão encerrada' 
      })
      authService.logout().catch(console.error)
    }
    setUser(null)
    localStorage.removeItem('fgb_user')
    toast('Sessão encerrada', { icon: '👋' })
  }

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser)
    localStorage.setItem('fgb_user', JSON.stringify(updatedUser))
  }

  const impersonateUser = (targetUser: User) => {
    localStorage.setItem('fgb_original_user', JSON.stringify(user))
    localStorage.setItem('fgb_impersonate_id', targetUser.id)
    setUser(targetUser)
    localStorage.setItem('fgb_user', JSON.stringify(targetUser))
    toast.success(`Gerenciando conta de ${targetUser.name}`)
    window.location.reload()
  }

  const stopImpersonating = () => {
    const originalUser = localStorage.getItem('fgb_original_user')
    if (originalUser) {
      const parsed = JSON.parse(originalUser)
      setUser(parsed)
      localStorage.setItem('fgb_user', originalUser)
    }
    localStorage.removeItem('fgb_original_user')
    localStorage.removeItem('fgb_impersonate_id')
    toast.success('De volta à sua conta')
    window.location.reload()
  }

  return (
    <AuthContext.Provider value={{ 
      user, token, loading, login, register, logout, updateUser, 
      impersonateUser, stopImpersonating, isImpersonating 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}