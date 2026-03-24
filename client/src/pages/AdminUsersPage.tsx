import { useEffect, useState } from 'react'
import { usersService } from '../services/users.service'
import { getRoleInfo, formatDateTime } from '../utils/formatters'
import { Modal } from '../components/ui/Modal'
import { ShieldCheck, Pencil, Eye, EyeOff, TrendingUp, User as UserIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { addLog } from '../services/log.service'

interface User {
  id: string; name: string; email: string; phone?: string
  role: string; active: boolean; isTipster?: boolean; createdAt: string
  plan?: string
}

type ModalType = 'edit' | 'role' | null

export const AdminUsersPage = () => {
  const { user: me, impersonateUser } = useAuth()
  const isMaster = me?.role === 'MASTER'
  const isAdmin  = me?.role === 'ADMIN' || me?.role === 'MASTER'

  const [users,     setUsers]     = useState<User[]>([])
  const [loading,   setLoading]   = useState(true)
  const [selected,  setSelected]  = useState<User | null>(null)
  const [modalType, setModalType] = useState<ModalType>(null)
  const [saving,    setSaving]    = useState(false)
  const [activeTab, setActiveTab] = useState<'geral' | 'plano'>('geral')

  // Role form
  const [newRole, setNewRole] = useState('')

  // Edit form
  const [editForm, setEditForm] = useState({ 
    name: '', email: '', phone: '', password: '', 
    isTipster: false, plan: 'STARTER' 
  })
  const [showPass, setShowPass] = useState(false)

  const load = () => {
    usersService.getAll()
      .then(data => {
        const arr = Array.isArray(data) ? data : (Array.isArray(data?.users) ? data.users : [])
        setUsers(arr)
      })
      .catch(() => toast.error('Erro ao carregar usuários'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const canEdit = (u: User) => {
    if (me?.role === 'TESTER') return false
    if (u.role === 'MASTER' && !isMaster) return false
    return isAdmin
  }

  const openEdit = (u: User) => {
    if (!canEdit(u)) {
      toast.error('Admins não podem editar usuários Master.')
      return
    }
    setSelected(u)
    setEditForm({ 
      name: u.name, 
      email: u.email, 
      phone: u.phone || '', 
      password: '', 
      isTipster: u.isTipster || false, 
      plan: u.plan || 'STARTER' 
    })
    setModalType('edit')
  }

  const openRole = (u: User) => {
    if (!isMaster) { toast.error('Apenas Masters podem alterar roles.'); return }
    setSelected(u)
    setNewRole(u.role)
    setModalType('role')
  }

  const closeModal = () => { 
    setSelected(null)
    setModalType(null)
    setShowPass(false)
    setActiveTab('geral') 
  }

  const handleToggle = async (u: User) => {
    if (!canEdit(u)) { toast.error('Admins não podem desativar usuários Master.'); return }
    try {
      await usersService.toggleActive(u.id)
      toast.success(`Usuário ${u.active ? 'desativado' : 'ativado'}!`)
      if (me) addLog({ userEmail: me.email, userName: me.name, userRole: me.role, category: 'Admin', action: u.active ? 'Usuário desativado' : 'Usuário ativado', detail: `${u.email}` })
      load()
    } catch { toast.error('Erro ao alterar status') }
  }

  const handleEditSave = async () => {
    if (!selected) return
    setSaving(true)
    try {
      const payload: any = { 
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        isTipster: editForm.isTipster,
        plan: editForm.plan,
      }
      if (editForm.password) payload.password = editForm.password
      await usersService.updateProfileById(selected.id, payload)
      toast.success('Usuário atualizado!')
      if (me) addLog({ userEmail: me.email, userName: me.name, userRole: me.role, category: 'Admin', action: 'Usuário editado', detail: `Editou usuário: ${selected.email} · Plano: ${editForm.plan}` })
      closeModal()
      load()
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Erro ao atualizar'
      toast.error(msg)
    } finally { setSaving(false) }
  }

  const handleRoleUpdate = async () => {
    if (!selected || !newRole) return
    setSaving(true)
    try {
      await usersService.updateRole(selected.id, newRole)
      toast.success('Role atualizado!')
      if (me) addLog({ userEmail: me.email, userName: me.name, userRole: me.role, category: 'Admin', action: 'Role alterado', detail: `Alterou role de ${selected.email} para ${newRole}` })
      closeModal()
      load()
    } catch { toast.error('Erro ao atualizar role') }
    finally { setSaving(false) }
  }

  const setEdit = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setEditForm(f => ({ ...f, [field]: e.target.value }))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-semibold text-white">Usuários</h2>
          <p className="text-xs text-slate-500">{users.length} usuários cadastrados</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="card border border-surface-400 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-300">
                  {['Usuários', 'Email', 'Telefone', 'Plano', 'Role', 'Cadastro', 'Status', 'Ações'].map((h, i) => (
                    <th key={i} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-300">
                {users.map(u => {
                  const editable = canEdit(u)
                  return (
                    <tr key={u.id} className="hover:bg-surface-300/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-green-700 flex items-center justify-center text-xs font-bold text-green-100 shrink-0">
                            {u.name[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{u.name}</p>
                            <p className="text-slate-500 text-[11px]">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{u.email}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{u.phone || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                          u.plan === 'PRO' ? 'bg-yellow-900/40 text-yellow-400 border-yellow-800/50' :
                          u.plan === 'STANDARD' ? 'bg-green-900/40 text-green-400 border-green-800/50' :
                          'bg-slate-900/40 text-slate-400 border-slate-800/50'
                        }`}>
                          {u.plan || 'STARTER'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          <p className={`text-[11px] ${getRoleInfo(u.role).color}`}>
                            {getRoleInfo(u.role).label}
                          </p>
                          {u.isTipster && (
                            <span className="flex items-center gap-1 text-[9px] font-bold text-orange-500 uppercase tracking-tight">
                              <TrendingUp size={9} /> Tipster
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{formatDateTime(u.createdAt)?.split(' ')[0]}</td>
                      <td className="px-4 py-3">
                        <button 
                          onClick={() => handleToggle(u)}
                          disabled={!editable || loading}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors ${
                            u.active 
                              ? 'bg-green-900/30 text-green-500 border border-green-800/50 hover:bg-green-900/50' 
                              : 'bg-red-900/30 text-red-500 border border-red-800/50 hover:bg-red-900/50'
                          }`}
                        >
                          {u.active ? 'Ativo' : 'Inativo'}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => openEdit(u)}
                            className="p-1.5 rounded-lg bg-surface-300 text-slate-400 hover:text-white hover:bg-surface-400 transition-all"
                            title="Editar Perfil"
                          >
                            <Pencil size={14} />
                          </button>
                          {isMaster && (
                            <button 
                              onClick={() => openRole(u)}
                              className="p-1.5 rounded-lg bg-surface-300 text-blue-400 hover:text-white hover:bg-blue-600/50 transition-all"
                              title="Alterar Cargo"
                            >
                              <ShieldCheck size={14} />
                            </button>
                          )}
                          {isMaster && (
                            <button 
                              onClick={() => impersonateUser(u as any)}
                              className="p-1.5 rounded-lg bg-surface-300 text-orange-400 hover:text-white hover:bg-orange-600/50 transition-all"
                              title="Acessar conta"
                            >
                              <UserIcon size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Editar Perfil */}
      <Modal 
        isOpen={modalType === 'edit'} 
        onClose={closeModal} 
        title="Editar Usuário"
      >
        <div className="flex flex-col gap-5">
          {/* Tabs */}
          <div className="flex border-b border-surface-300">
            <button 
              onClick={() => setActiveTab('geral')}
              className={`px-4 py-2 text-sm font-bold transition-all border-b-2 ${activeTab === 'geral' ? 'border-green-500 text-green-500' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
            >
              Geral
            </button>
            <button 
              onClick={() => setActiveTab('plano')}
              className={`px-4 py-2 text-sm font-bold transition-all border-b-2 ${activeTab === 'plano' ? 'border-green-500 text-green-500' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
            >
              Plano & Acesso
            </button>
          </div>

          {activeTab === 'geral' && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="label">Nome</label>
                  <input className="input-field" value={editForm.name} onChange={setEdit('name')} />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input className="input-field" value={editForm.email} onChange={setEdit('email')} />
                </div>
                <div>
                  <label className="label">Telefone</label>
                  <input className="input-field" value={editForm.phone} onChange={setEdit('phone')} />
                </div>
                <div>
                  <label className="label">Nova Senha (opcional)</label>
                  <div className="relative">
                    <input 
                      type={showPass ? 'text' : 'password'} 
                      className="input-field pr-10" 
                      value={editForm.password} 
                      onChange={setEdit('password')} 
                    />
                    <button 
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                      onClick={() => setShowPass(!showPass)}
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'plano' && (
            <div className="flex flex-col gap-6">
              <div>
                <label className="label mb-3">Plano de Assinatura</label>
                <div className="grid grid-cols-3 gap-2">
                  {['STARTER', 'STANDARD', 'PRO'].map(p => (
                    <button
                      key={p}
                      onClick={() => setEditForm(f => ({ ...f, plan: p }))}
                      className={`py-3 px-2 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                        editForm.plan === p 
                          ? 'border-green-500 bg-green-500/10 text-green-400' 
                          : 'border-surface-300 bg-surface-300/30 text-slate-500 hover:border-surface-400'
                      }`}
                    >
                      <span className="text-[10px] font-black tracking-widest">{p}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-surface-300/20 border border-surface-400">
                <div>
                  <p className="text-sm font-bold text-white tracking-tight">Status de Tipster</p>
                  <p className="text-[10px] text-slate-500">Permite postar dicas de apostas</p>
                </div>
                <button
                  onClick={() => setEditForm(f => ({ ...f, isTipster: !f.isTipster }))}
                  className={`w-12 h-6 rounded-full transition-all relative ${editForm.isTipster ? 'bg-green-500' : 'bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${editForm.isTipster ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-2">
            <button onClick={closeModal} className="btn-secondary flex-1">Cancelar</button>
            <button onClick={handleEditSave} disabled={saving} className="btn-primary flex-1">
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Alterar Role */}
      <Modal 
        isOpen={modalType === 'role'} 
        onClose={closeModal} 
        title="Alterar Nível de Acesso"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-slate-400">
            Alterar o cargo de <span className="text-white font-bold">{selected?.name}</span> para:
          </p>
          <div className="flex flex-col gap-2">
            {['USER', 'ADMIN', 'MASTER'].map(r => (
              <button 
                key={r}
                onClick={() => setNewRole(r)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  newRole === r 
                    ? 'border-green-500 bg-green-500/10 text-green-400' 
                    : 'border-surface-300 bg-surface-300/20 text-slate-400 hover:bg-surface-300'
                }`}
              >
                <p className="font-bold text-sm tracking-wide">{getRoleInfo(r).label}</p>
                <p className="text-[10px] opacity-70">
                  {r === 'MASTER' ? 'Acesso total e gerenciamento de administradores.' : 
                   r === 'ADMIN' ? 'Gerenciamento de usuários e financeiro.' : 
                   'Acesso padrão de membro.'}
                </p>
              </button>
            ))}
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={closeModal} className="btn-secondary flex-1">Cancelar</button>
            <button onClick={handleRoleUpdate} disabled={saving} className="btn-primary flex-1">
              {saving ? 'Salvando...' : 'Confirmar Alteração'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
