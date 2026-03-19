import { useState, FormEvent } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { usersService } from '../services/users.service'
import { formatDateTime } from '../utils/formatters'
import { 
  User as UserIcon, Mail, Phone, AtSign, Calendar, Eye, EyeOff, 
  Settings, Lock, Globe, Coins, Moon, Sun, Monitor, CreditCard, CheckCircle2
} from 'lucide-react'
import toast from 'react-hot-toast'

export const ProfilePage = () => {
  const { user, updateUser } = useAuth()

  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    username: user?.username || '',
    password: '',
    confirmPassword: '',
    plan: user?.plan || 'FREE',
    currency: user?.currency || 'BRL',
    language: user?.language || 'PT-BR',
    theme: user?.theme || 'DARK',
    twoFactorEnabled: user?.twoFactorEnabled || false,
  })

  const [showPass, setShowPass] = useState(false)
  const [loading,  setLoading]  = useState(false)

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
        username: form.username,
        plan: form.plan,
        currency: form.currency,
        language: form.language,
        theme: form.theme,
        twoFactorEnabled: form.twoFactorEnabled
      }
      if (form.password) payload.password = form.password
      
      const updated = await usersService.updateProfile(payload)
      updateUser(updated)
      toast.success('Perfil e preferências atualizados! ✨')
      setForm(f => ({ ...f, password: '', confirmPassword: '' }))
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erro ao atualizar'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const initials = user?.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div className="max-w-4xl flex flex-col gap-8 pb-10">
      {/* Header Contextual */}
      <div className="flex flex-col gap-1">
        <h2 className="font-display font-semibold text-white">Perfil & Configurações</h2>
        <p className="text-xs text-slate-500 uppercase tracking-widest mt-0.5">Gerencie sua conta e preferências</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LADO ESQUERDO: Resumo e Nav rápida */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="card p-6 border border-surface-400 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-600 to-green-900 flex items-center justify-center text-3xl font-display font-bold text-white shadow-xl mb-4 border-4 border-surface-300">
              {user?.avatarUrl ? <img src={user.avatarUrl} alt={user.name} className="w-full h-full rounded-full object-cover" /> : initials}
            </div>
            <h3 className="font-display font-bold text-white text-xl">{user?.name}</h3>
            <p className="text-slate-400 text-sm mb-4">@{user?.username}</p>
            
            <div className="flex flex-wrap justify-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-green-900/40 text-green-400 border border-green-800/50">
                {user?.plan || 'FREE'}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-900/40 text-blue-400 border border-blue-800/50">
                {user?.role}
              </span>
            </div>
          </div>

          <div className="card p-4 border border-surface-300 flex flex-col gap-4">
             <div className="flex items-center gap-3 text-slate-400">
               <Mail size={16} />
               <div className="flex flex-col">
                 <span className="text-[10px] uppercase text-slate-500 font-bold">Email</span>
                 <span className="text-xs text-white truncate max-w-[180px]">{user?.email}</span>
               </div>
             </div>
             <div className="flex items-center gap-3 text-slate-400">
               <Calendar size={16} />
               <div className="flex flex-col">
                 <span className="text-[10px] uppercase text-slate-500 font-bold">Membro desde</span>
                 <span className="text-xs text-white">{user?.createdAt ? formatDateTime(user.createdAt).split(' ')[0] : '--'}</span>
               </div>
             </div>
          </div>
        </div>

        {/* LADO DIREITO: Formulários e Configs */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-8">
            
            {/* Seção 1: Dados Pessoais */}
            <div className="card p-6 border border-surface-400">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-green-900/30 flex items-center justify-center text-green-400">
                  <UserIcon size={18} />
                </div>
                <h3 className="font-display font-semibold text-white">Dados Pessoais</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="label-sm">Nome completo</label>
                  <input className="input-field-sm" value={form.name} onChange={(e) => set('name', e.target.value)} />
                </div>
                <div>
                  <label className="label-sm">Usuário</label>
                  <div className="relative">
                    <AtSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input className="input-field-sm pl-10" value={form.username} onChange={(e) => set('username', e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="label-sm">Telefone</label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input className="input-field-sm pl-10" placeholder="(11) 99999-9999" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
                  </div>
                </div>
              </div>
            </div>

            {/* Seção 2: Preferências de Interface */}
            <div className="card p-6 border border-surface-400">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-blue-900/30 flex items-center justify-center text-blue-400">
                  <Monitor size={18} />
                </div>
                <h3 className="font-display font-semibold text-white">Preferências de Interface</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tema */}
                <div>
                  <label className="label-sm flex items-center gap-2 mb-2">
                    <Sun size={14} className="text-yellow-400" /> Tema do Sistema
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'LIGHT', icon: <Sun size={14} />, label: 'Claro' },
                      { id: 'DARK', icon: <Moon size={14} />, label: 'Escuro' },
                      { id: 'SYSTEM', icon: <Monitor size={14} />, label: 'Auto' },
                    ].map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => set('theme', t.id)}
                        className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border text-[10px] font-bold transition-all ${
                          form.theme === t.id 
                            ? 'bg-green-900/20 border-green-600/50 text-green-400' 
                            : 'bg-surface-300 border-surface-400 text-slate-400 hover:border-slate-500'
                        }`}
                      >
                        {t.icon}
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Idioma */}
                <div>
                  <label className="label-sm flex items-center gap-2 mb-2">
                    <Globe size={14} className="text-blue-400" /> Idioma
                  </label>
                  <select 
                    className="input-field-sm" 
                    value={form.language} 
                    onChange={(e) => set('language', e.target.value)}
                  >
                    <option value="PT-BR">Português (BR)</option>
                    <option value="EN-US">English (US)</option>
                    <option value="ES-ES">Español (ES)</option>
                  </select>
                </div>

                {/* Moeda */}
                <div>
                  <label className="label-sm flex items-center gap-2 mb-2">
                    <Coins size={14} className="text-yellow-500" /> Moeda Principal
                  </label>
                  <select 
                    className="input-field-sm" 
                    value={form.currency} 
                    onChange={(e) => set('currency', e.target.value)}
                  >
                    <option value="BRL">R$ (Real Brasileiro)</option>
                    <option value="USD">$ (Dólar Americano)</option>
                    <option value="EUR">€ (Euro)</option>
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1.5">Isso afetará como os valores monetários são exibidos no sistema.</p>
                </div>

                {/* Plano / Stats (info) */}
                <div className="md:col-span-1">
                  <label className="label-sm flex items-center gap-2 mb-2">
                    <CreditCard size={14} className="text-purple-400" /> Assinatura Atual
                  </label>
                  <div className="p-3 bg-surface-300 border border-surface-400 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-xs font-bold text-white uppercase">{user?.plan || 'FREE'}</span>
                    </div>
                    <button type="button" className="text-[10px] font-bold text-green-400 hover:underline">Ver planos</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Seção 3: Segurança */}
            <div className="card p-6 border border-surface-400 bg-surface-800/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-red-900/20 flex items-center justify-center text-red-500">
                  <Lock size={18} />
                </div>
                <h3 className="font-display font-semibold text-white">Segurança</h3>
              </div>

              <div className="flex flex-col gap-6">
                {/* 2FA Toggle */}
                <div className="flex items-center justify-between p-4 bg-surface-400/30 rounded-xl border border-surface-300">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-bold text-white flex items-center gap-2">
                      Autenticação em Dois Fatores (2FA)
                      {form.twoFactorEnabled && <CheckCircle2 size={14} className="text-green-500" />}
                    </span>
                    <span className="text-[10px] text-slate-500 italic">Aumente a proteção da sua conta com uma camada extra de segurança.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => set('twoFactorEnabled', !form.twoFactorEnabled)}
                    className={`relative w-10 h-5 rounded-full transition-colors ${form.twoFactorEnabled ? 'bg-green-600' : 'bg-slate-700'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${form.twoFactorEnabled ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>

                {/* Senha */}
                <div className="pt-4 border-t border-surface-300">
                  <p className="text-[11px] text-slate-500 mb-4 bg-blue-900/10 p-2 rounded border border-blue-900/20">
                    💡 <span className="text-slate-400 font-medium">Dica:</span> Use pelo menos 8 caracteres, números e símbolos para uma senha forte.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="label-sm">Nova senha</label>
                      <div className="relative">
                        <input
                          type={showPass ? 'text' : 'password'}
                          className="input-field-sm pr-10"
                          placeholder="••••••••"
                          value={form.password}
                          onChange={(e) => set('password', e.target.value)}
                        />
                        <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                          {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="label-sm">Confirmar senha</label>
                      <input
                        type={showPass ? 'text' : 'password'}
                        className="input-field-sm"
                        placeholder="••••••••"
                        value={form.confirmPassword}
                        onChange={(e) => set('confirmPassword', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Ação Principal */}
            <div className="flex items-center justify-between bg-surface-400/20 p-4 rounded-2xl border border-surface-300 backdrop-blur-sm sticky bottom-4 z-10">
              <p className="text-[10px] text-slate-500 hidden md:block">* Campos de senha podem ficar vazios se não quiser alterar.</p>
              <button 
                type="submit" 
                disabled={loading} 
                className="btn-primary w-full md:w-auto px-10 flex items-center justify-center gap-3 shadow-lg group"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <Settings size={18} className="group-hover:rotate-90 transition-transform duration-500" />
                )}
                {loading ? 'Salvando...' : 'Salvar todas as alterações'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  )
}

