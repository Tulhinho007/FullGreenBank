import { useState, FormEvent, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { usersService } from '../services/users.service'
import { formatDateTime } from '../utils/formatters'
import { 
  User as UserIcon, Mail, Phone, Calendar, Eye, EyeOff, 
  Settings, Lock, Moon, Sun, Monitor, CreditCard
} from 'lucide-react'
import toast from 'react-hot-toast'
import { addLog } from '../services/log.service'

export const ProfilePage = () => {
  const { user, updateUser } = useAuth()
  const { toggleTheme } = useTheme()
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    password: '',
    confirmPassword: '',
    plan: user?.plan || 'STARTER',
    theme: (user?.theme?.toLowerCase() as any) || 'dark',
  })
  const [showPass, setShowPass] = useState(false)
  const [loading,  setLoading]  = useState(false)

  // Sync form with user when user loads
  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        name: user.name || '',
        phone: user.phone || '',
        plan: user.plan || 'STARTER',
        theme: (user.theme?.toLowerCase() as any) || 'dark',
      }))
    }
  }, [user])

  const set = (field: string, value: any) => {
    setForm(f => ({ ...f, [field]: value }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (form.password && form.password !== form.confirmPassword) {
      toast.error('Senhas não conferem'); return
    }
    setLoading(true)
    try {
      const payload: any = { 
        name: form.name, 
        phone: form.phone, 
        plan: form.plan,
        theme: form.theme.toUpperCase(),
      }
      if (form.password) payload.password = form.password
      
      const updated = await usersService.updateProfile(payload)
      updateUser(updated)
      
      if (form.password) {
        addLog({ userEmail: user?.email || '', userName: user?.name || '', userRole: user?.role || '', category: 'Segurança', action: 'Senha alterada', detail: 'Usuário alterou a própria senha' })
      } else {
        addLog({ userEmail: user?.email || '', userName: user?.name || '', userRole: user?.role || '', category: 'Sistema', action: 'Perfil atualizado', detail: 'Atualizou dados do perfil' })
      }
      
      if (payload.theme === 'SYSTEM') toggleTheme('system')
      else if (payload.theme === 'LIGHT') toggleTheme('light')
      else if (payload.theme === 'DARK') toggleTheme('dark')

      toast.success('Perfil atualizado com sucesso! ✨')
      setForm(f => ({ ...f, password: '', confirmPassword: '' }))
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erro ao atualizar'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const initials = user?.name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || 'U'

  return (
    <div className="max-w-4xl flex flex-col gap-8 pb-10 transition-colors duration-300">
      {/* Header Contextual */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-4">
          <h2 className="font-display font-semibold text-slate-900 dark:text-white">Perfil & Configurações</h2>
          <span className="text-[10px] bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400 px-2 py-0.5 rounded border border-green-200 dark:border-green-500/30">ATIVO</span>
        </div>
        <p className="text-xs text-slate-500 uppercase tracking-widest mt-0.5">Gerencie seus dados e preferências</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LADO ESQUERDO: Resumo */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="bg-white dark:bg-surface-200 p-6 rounded-[2rem] border border-slate-200 dark:border-white/5 flex flex-col items-center text-center shadow-sm">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-3xl font-display font-bold text-white shadow-xl mb-4 border-4 border-white dark:border-surface-300">
              {user?.avatarUrl ? <img src={user.avatarUrl} alt={user.name} className="w-full h-full rounded-full object-cover" /> : initials}
            </div>
            <h3 className="font-display font-bold text-slate-900 dark:text-white text-xl">{user?.name}</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">{user?.email}</p>
            
            <div className="flex flex-wrap justify-center gap-2">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                user?.plan === 'PRO' ? 'bg-yellow-50 text-yellow-600 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-400 dark:border-yellow-800/50' :
                'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/40 dark:text-slate-400 dark:border-slate-800/50'
              }`}>
                {user?.plan || 'STARTER'}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-900/40 dark:text-blue-400 dark:border-blue-800/50">
                {user?.role}
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-surface-200 p-4 rounded-3xl border border-slate-200 dark:border-white/5 flex flex-col gap-4 shadow-sm">
             <div className="flex items-center gap-3 text-slate-400 dark:text-slate-500">
               <Mail size={16} />
               <div className="flex flex-col">
                 <span className="text-[10px] uppercase text-slate-500 font-bold">Email</span>
                 <span className="text-xs text-slate-700 dark:text-white truncate max-w-[180px]">{user?.email}</span>
               </div>
             </div>
             <div className="flex items-center gap-3 text-slate-400 dark:text-slate-500">
               <Calendar size={16} />
               <div className="flex flex-col">
                 <span className="text-[10px] uppercase text-slate-500 font-bold">Membro desde</span>
                 <span className="text-xs text-slate-700 dark:text-white">{user?.createdAt ? (formatDateTime(user.createdAt)?.split(' ')[0] || '--') : '--'}</span>
               </div>
             </div>
          </div>
        </div>

        {/* LADO DIREITO: Formulários */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-8">
            
            {/* Seção 1: Dados Pessoais */}
            <div className="bg-white dark:bg-surface-200 p-6 rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500">
                  <UserIcon size={18} />
                </div>
                <h3 className="font-display font-semibold text-slate-900 dark:text-white">Usuário</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-400 mb-1.5 block">Nome Completo</label>
                  <input 
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-2.5 px-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all" 
                    value={form.name} 
                    onChange={(e) => set('name', e.target.value)} 
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-400 mb-1.5 block">Telefone</label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all" 
                      placeholder="(11) 99999-9999" 
                      value={form.phone} 
                      onChange={(e) => set('phone', e.target.value)} 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Seção 2: Aparência */}
            <div className="bg-white dark:bg-surface-200 p-6 rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <Monitor size={18} />
                </div>
                <h3 className="font-display font-semibold text-slate-900 dark:text-white">Aparência</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-400 mb-3 block flex items-center gap-2">
                    <Sun size={14} className="text-yellow-500" /> Preferência de Tema
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'light',  icon: <Sun size={14} />, label: 'Claro' },
                      { id: 'dark',   icon: <Moon size={14} />, label: 'Escuro' },
                      { id: 'system', icon: <Monitor size={14} />, label: 'Auto' },
                    ].map(tk => (
                      <button
                        key={tk.id}
                        type="button"
                        onClick={() => set('theme', tk.id)}
                        className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border text-[10px] font-bold transition-all ${
                          form.theme === tk.id 
                            ? 'bg-green-500 text-white border-green-500 shadow-md' 
                            : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-white/20'
                        }`}
                      >
                        {tk.icon}
                        {tk.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-1">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-400 mb-3 block flex items-center gap-2">
                    <CreditCard size={14} className="text-purple-500" /> Assinatura Atual
                  </label>
                  <div className="p-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white uppercase">{user?.plan || 'STARTER'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Seção 3: Segurança */}
            <div className="bg-white dark:bg-surface-200 p-6 rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500">
                  <Lock size={18} />
                </div>
                <h3 className="font-display font-semibold text-slate-900 dark:text-white">Segurança</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-400 mb-1.5 block">Nova Senha</label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-2.5 px-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all"
                      placeholder="••••••••"
                      value={form.password}
                      onChange={(e) => set('password', e.target.value)}
                    />
                    <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                      {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-400 mb-1.5 block">Confirmar Senha</label>
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-2.5 px-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all"
                    placeholder="••••••••"
                    value={form.confirmPassword}
                    onChange={(e) => set('confirmPassword', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Ação Principal */}
            <div className="flex items-center justify-between bg-white/80 dark:bg-surface-200/80 p-4 rounded-3xl border border-slate-200 dark:border-white/5 backdrop-blur-md sticky bottom-4 z-10 shadow-lg">
              <p className="text-[10px] text-slate-400 hidden md:block">Full Green Bank · Segurança garantida</p>
              <button 
                type="submit" 
                disabled={loading} 
                className="w-full md:w-auto px-10 py-3 bg-green-500 hover:bg-green-600 text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-green-500/20 group"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <Settings size={18} className="group-hover:rotate-90 transition-transform duration-500" />
                )}
                {loading ? 'Processando...' : 'Salvar Alterações'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  )
}
