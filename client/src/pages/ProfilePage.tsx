import { useState, useEffect, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
// import { useTheme } from '../contexts/ThemeContext' // Removido
import { usersService } from '../services/users.service'
import { formatDateTime } from '../utils/formatters'
import { 
  User as UserIcon, Mail, Phone, Calendar, Eye, EyeOff, 
  Settings, Lock, CreditCard, ArrowLeft
} from 'lucide-react'
import toast from 'react-hot-toast'
import { addLog } from '../services/log.service'

export const ProfilePage = () => {
  const { user, updateUser } = useAuth()
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
      
      // Lógica de toggle removida: sistema fixo em Light Mode

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
      <Link to="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-emerald-600 transition-all text-[10px] font-black uppercase tracking-[0.2em] w-fit">
        <ArrowLeft size={14} /> Voltar para o Dashboard
      </Link>

      {/* Header Contextual */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-4">
          <h2 className="font-display font-semibold text-slate-900">Perfil & Configurações</h2>
          <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded border border-emerald-100 uppercase tracking-widest">ATIVO</span>
        </div>
        <p className="text-xs text-slate-500 uppercase tracking-widest mt-0.5">Gerencie seus dados e preferências</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LADO ESQUERDO: Resumo */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 flex flex-col items-center text-center shadow-sm">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-3xl font-display font-bold text-white shadow-xl mb-4 border-4 border-white">
              {user?.avatarUrl ? <img src={user.avatarUrl} alt={user.name} className="w-full h-full rounded-full object-cover" /> : initials}
            </div>
            <h3 className="font-display font-bold text-slate-900 text-xl">{user?.name}</h3>
            <p className="text-slate-500 text-sm mb-4">{user?.email}</p>
            
            <div className="flex flex-wrap justify-center gap-2">
              <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${
                user?.plan === 'PRO' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                'bg-slate-50 text-slate-600 border-slate-200'
              }`}>
                {user?.plan || 'STARTER'}
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                {user?.role}
              </span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-3xl border border-slate-200 flex flex-col gap-4 shadow-sm">
             <div className="flex items-center gap-3 text-slate-400">
               <Mail size={16} />
               <div className="flex flex-col">
                 <span className="text-[10px] uppercase text-slate-400 font-bold">Email</span>
                 <span className="text-xs text-slate-700 truncate max-w-[180px] font-bold">{user?.email}</span>
               </div>
             </div>
             <div className="flex items-center gap-3 text-slate-400">
               <Calendar size={16} />
               <div className="flex flex-col">
                 <span className="text-[10px] uppercase text-slate-400 font-bold">Membro desde</span>
                 <span className="text-xs text-slate-700 font-bold">{user?.createdAt ? (formatDateTime(user.createdAt)?.split(' ')[0] || '--') : '--'}</span>
               </div>
             </div>
          </div>
        </div>

        {/* LADO DIREITO: Formulários */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-8">
            
            {/* Seção 1: Dados Pessoais */}
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <UserIcon size={18} />
                </div>
                <h3 className="font-display font-semibold text-slate-900">Configurações de Perfil</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Nome Completo</label>
                  <input 
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-4 text-sm text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all" 
                    value={form.name} 
                    onChange={(e) => set('name', e.target.value)} 
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Telefone</label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all" 
                      placeholder="(11) 99999-9999" 
                      value={form.phone} 
                      onChange={(e) => set('phone', e.target.value)} 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Seção 2: Plano */}
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                  <CreditCard size={18} />
                </div>
                <h3 className="font-display font-semibold text-slate-900">Sua Assinatura</h3>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-slate-900 uppercase tracking-widest">{user?.plan || 'STARTER'}</span>
                    <span className="text-[10px] text-slate-400 font-bold">Plano Ativo</span>
                  </div>
                </div>
                <Link to="/planos" className="text-[10px] font-black uppercase tracking-widest bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all">Alterar Plano</Link>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
                  <Lock size={18} />
                </div>
                <h3 className="font-display font-semibold text-slate-900">Segurança</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Nova Senha</label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-4 text-sm text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
                      placeholder="••••••••"
                      value={form.password}
                      onChange={(e) => set('password', e.target.value)}
                    />
                    <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                      {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Confirmar Senha</label>
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-4 text-sm text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
                    placeholder="••••••••"
                    value={form.confirmPassword}
                    onChange={(e) => set('confirmPassword', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Ação Principal */}
            <div className="flex items-center justify-between bg-white/80 p-4 rounded-3xl border border-slate-200 backdrop-blur-md sticky bottom-4 z-10 shadow-lg">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 hidden md:block">Full Green Bank · Segurança de Dados</p>
              <button 
                type="submit" 
                disabled={loading} 
                className="w-full md:w-auto px-10 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-emerald-500/20 group"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <Settings size={18} className="group-hover:rotate-90 transition-transform duration-500" />
                )}
                {loading ? 'Processando...' : 'Salvar Perfil'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  )
}
