import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authService } from '../services/auth.service'
import toast from 'react-hot-toast'
import { addLog } from '../pages/SystemLogPage'

export interface User {
  id: string
  name: string
  email: string
  phone?: string
  username: string
  role: 'MASTER' | 'ADMIN' | 'TESTER' | 'MEMBRO'
  active: boolean
  isTipster?: boolean
  createdAt: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  login:    (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout:   () => void
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
  const [user,    setUser]    = useState<User | null>(null)
  const [token,   setToken]   = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedToken = localStorage.getItem('fgb_token')
    const savedUser  = localStorage.getItem('fgb_user')
    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const isImpersonating = !!localStorage.getItem('fgb_impersonate_id')

  const login = async (email: string, password: string) => {
    const res = await authService.login({ email, password })
    setToken(res.token)
    setUser(res.user)
    localStorage.setItem('fgb_token', res.token)
    localStorage.setItem('fgb_user',  JSON.stringify(res.user))
    addLog({ userEmail: res.user.email, userName: res.user.name, userRole: res.user.role, category: 'Auth', action: 'Login realizado', detail: 'Acesso ao sistema' })
    toast.success(`Bem-vindo, ${res.user.name}! 🟢`)
  }

  const register = async (data: RegisterData) => {
    const res = await authService.register(data)
    setToken(res.token)
    setUser(res.user)
    localStorage.setItem('fgb_token', res.token)
    localStorage.setItem('fgb_user',  JSON.stringify(res.user))
    addLog({ userEmail: res.user.email, userName: res.user.name, userRole: res.user.role, category: 'Auth', action: 'Cadastro realizado', detail: 'Nova conta criada no sistema' })
    toast.success('Conta criada com sucesso! 🎉')
  }

  const logout = () => {
    if (user) addLog({ userEmail: user.email, userName: user.name, userRole: user.role, category: 'Auth', action: 'Logout', detail: 'Sessão encerrada' })
    setUser(null)
    setToken(null)
    localStorage.removeItem('fgb_token')
    localStorage.removeItem('fgb_user')
    toast('Sessão encerrada', { icon: '👋' })
  }

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser)
    localStorage.setItem('fgb_user', JSON.stringify(updatedUser))
  }

  const impersonateUser = (targetUser: User) => {
    // Salvamos o admin original antes de trocar
    localStorage.setItem('fgb_original_user', JSON.stringify(user))
    localStorage.setItem('fgb_impersonate_id', targetUser.id)
    
    // Trocamos o usuário ativo
    setUser(targetUser)
    localStorage.setItem('fgb_user', JSON.stringify(targetUser))
    
    toast.success(`Gerenciando conta de ${targetUser.name}`)
    // Recarregamos para garantir que todos os contextos e a API peguem o novo estado
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
