import { useState, FormEvent } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { usersService } from '../services/users.service'
import { roleLabelMap, formatDateTime } from '../utils/formatters'
import { User, Mail, Phone, AtSign, Shield, Calendar, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

export const ProfilePage = () => {
  const { user, updateUser } = useAuth()

  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    username: user?.username || '',
    password: '',
    confirmPassword: '',
  })
  const [showPass, setShowPass] = useState(false)
  const [loading,  setLoading]  = useState(false)

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (form.password && form.password !== form.confirmPassword) {
      toast.error('Senhas não conferem'); return
    }
    setLoading(true)
    try {
      const payload: Record<string, string> = { name: form.name, phone: form.phone, username: form.username }
      if (form.password) payload.password = form.password
      const updated = await usersService.updateProfile(payload)
      updateUser(updated)
      toast.success('Perfil atualizado!')
      setForm(f => ({ ...f, password: '', confirmPassword: '' }))
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erro ao atualizar'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const roleInfo = roleLabelMap[user?.role || 'MEMBRO']
  const initials = user?.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div className="max-w-2xl flex flex-col gap-6">
      {/* Profile header card */}
      <div className="card p-6 flex items-center gap-5 border border-surface-400">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-700 to-green-900 flex items-center justify-center text-2xl font-display font-bold text-white shrink-0">
          {initials}
        </div>
        <div>
          <h2 className="font-display font-bold text-white text-lg">{user?.name}</h2>
          <p className="text-slate-400 text-sm">@{user?.username}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
              user?.role === 'MASTER' ? 'bg-yellow-900/40 text-yellow-400 border-yellow-800/50' :
              user?.role === 'ADMIN'  ? 'bg-blue-900/40  text-blue-400  border-blue-800/50'  :
                                        'bg-surface-400   text-slate-400 border-surface-400'
            }`}>
              {roleInfo.label}
            </span>
            {user?.createdAt && (
              <span className="text-xs text-slate-600">
                Desde {formatDateTime(user.createdAt).split(' ')[0]}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Info cards row */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { icon: <Mail size={15} />,     label: 'Email',        value: user?.email,    note: 'Não editável' },
          { icon: <Shield size={15} />,   label: 'Tipo de conta',value: roleInfo.label, note: 'Definido pelo admin' },
          { icon: <Calendar size={15} />, label: 'Cadastro',     value: user?.createdAt ? formatDateTime(user.createdAt) : '--', note: '' },
          { icon: <User size={15} />,     label: 'Status',       value: user?.active ? 'Ativo ✅' : 'Inativo ❌', note: '' },
        ].map(item => (
          <div key={item.label} className="card p-4 border border-surface-300">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              {item.icon} {item.label}
            </div>
            <p className="text-white text-sm font-medium">{item.value || '--'}</p>
            {item.note && <p className="text-slate-600 text-[10px] mt-0.5">{item.note}</p>}
          </div>
        ))}
      </div>

      {/* Edit form */}
      <div className="card p-6 border border-surface-400">
        <h3 className="font-display font-semibold text-white mb-5">Editar Informações</h3>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label"><User size={12} className="inline mr-1" />Nome completo</label>
              <input className="input-field" value={form.name} onChange={set('name')} />
            </div>
            <div>
              <label className="label"><AtSign size={12} className="inline mr-1" />Usuário</label>
              <input className="input-field" value={form.username} onChange={set('username')} />
            </div>
            <div>
              <label className="label"><Phone size={12} className="inline mr-1" />Telefone</label>
              <input className="input-field" placeholder="(11) 99999-9999" value={form.phone} onChange={set('phone')} />
            </div>
          </div>

          <div className="border-t border-surface-300 pt-4">
            <p className="text-xs text-slate-500 mb-3">Deixe em branco para não alterar a senha</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Nova senha</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="input-field pr-10"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={set('password')}
                  />
                  <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="label">Confirmar senha</label>
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input-field"
                  placeholder="••••••••"
                  value={form.confirmPassword}
                  onChange={set('confirmPassword')}
                />
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary self-start px-8 flex items-center gap-2">
            {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Salvando...</> : 'Salvar alterações'}
          </button>
        </form>
      </div>
    </div>
  )
}
