import { useEffect, useState } from 'react'
import { usersService } from '../services/users.service'
import { getRoleInfo, formatDateTime } from '../utils/formatters'
import { Modal } from '../components/ui/Modal'
import { ShieldCheck, Pencil, Eye, EyeOff, User as UserIcon, UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { addLog } from '../services/log.service'

interface User {
  id: string; name: string; email: string; phone?: string
  role: string; active: boolean; createdAt: string
  plan?: string
}

type ModalType = 'edit' | 'role' | 'create' | null

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
    plan: 'STARTER' 
  })

  // Create form
  const [createForm, setCreateForm] = useState({ 
    name: '', email: '', phone: '', password: '', 
    role: 'MEMBRO', plan: 'STARTER' 
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

  const openCreate = () => {
    setCreateForm({ name: '', email: '', phone: '', password: '', role: 'MEMBRO', plan: 'STARTER' })
    setModalType('create')
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

  const handleCreateSave = async () => {
    if (!createForm.name || !createForm.email || !createForm.password) {
      toast.error('Preencha os campos obrigatórios (Nome, Email, Senha)'); return;
    }
    setSaving(true)
    try {
      await usersService.create(createForm)
      toast.success('Usuário criado com sucesso!')
      if (me) addLog({ userEmail: me.email, userName: me.name, userRole: me.role, category: 'Admin', action: 'Nova Conta Criada', detail: `Criou usuário: ${createForm.email}` })
      closeModal()
      load()
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Erro ao criar usuário'
      toast.error(msg)
    } finally { setSaving(false) }
  }

  const setEdit = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setEditForm(f => ({ ...f, [field]: e.target.value }))
    
  const setCreate = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setCreateForm(f => ({ ...f, [field]: e.target.value }))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="font-display font-black text-slate-800 text-2xl tracking-tight">Gestão de Usuários</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">
            {users.length} usuários registrados na plataforma
          </p>
        </div>
        <button 
          onClick={openCreate}
          className="btn-primary rounded-xl px-4 py-3 text-[11px] font-black uppercase tracking-widest shadow-md shadow-emerald-500/20 flex items-center gap-2"
        >
          <UserPlus size={16} /> Novo Usuário
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-50 bg-slate-50/30">
                  {['Usuários', 'Status', 'Plano', 'Cargo', 'Telefone', 'Cadastro', 'Ações'].map((h, i) => (
                    <th key={i} className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map(u => {
                  const editable = canEdit(u)
                  return (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center text-sm font-black text-emerald-600 shrink-0 border border-emerald-100/50">
                            {u.name[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-black text-slate-800 text-sm tracking-tight leading-none mb-1">{u.name}</p>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-tight">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <button 
                          onClick={() => handleToggle(u)}
                          disabled={!editable || loading}
                          className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border ${
                            u.active 
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                              : 'bg-rose-50 text-rose-600 border-rose-100'
                          } ${editable ? 'hover:scale-105 active:scale-95' : 'opacity-50 cursor-not-allowed'}`}
                        >
                          {u.active ? 'Ativo' : 'Inativo'}
                        </button>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg border ${
                          u.plan === 'PRO' 
                            ? 'bg-amber-50 text-amber-600 border-amber-100' 
                            : 'bg-slate-50 text-slate-500 border-slate-200'
                        }`}>
                          {u.plan || 'STARTER'}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1">
                          <p className={`text-[10px] font-black uppercase tracking-widest leading-none ${getRoleInfo(u.role).color.replace('green', 'emerald').replace('blue', 'blue').replace('amber', 'amber')}`}>
                            {getRoleInfo(u.role).label}
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-400 text-[11px] font-bold font-mono">
                        {u.phone || '—'}
                      </td>
                      <td className="px-5 py-4 text-slate-400 text-[11px] font-bold">
                        {formatDateTime(u.createdAt)?.split(' ')[0]}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => openEdit(u)}
                            className="p-2.5 rounded-2xl bg-slate-50 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all border border-slate-100"
                            title="Editar Perfil"
                          >
                            <Pencil size={15} />
                          </button>
                          {isMaster && (
                            <button 
                              onClick={() => openRole(u)}
                              className="p-2.5 rounded-2xl bg-slate-50 text-blue-500 hover:text-white hover:bg-blue-500 transition-all border border-slate-100"
                              title="Alterar Cargo"
                            >
                              <ShieldCheck size={15} />
                            </button>
                          )}
                          {isMaster && (
                            <button 
                              onClick={() => impersonateUser(u as any)}
                              className="p-2.5 rounded-2xl bg-slate-50 text-amber-500 hover:text-white hover:bg-amber-500 transition-all border border-slate-100"
                              title="Acessar conta"
                            >
                              <UserIcon size={15} />
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
          <div className="flex border-b border-slate-50">
            <button 
              onClick={() => setActiveTab('geral')}
              className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'geral' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              Geral
            </button>
            <button 
              onClick={() => setActiveTab('plano')}
              className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'plano' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {['STARTER', 'PRO', 'VIP PREMIUM'].map(p => (
                    <button
                      key={p}
                      onClick={() => setEditForm(f => ({ ...f, plan: p }))}
                      className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-2 ${
                        editForm.plan === p 
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-700' 
                          : 'border-slate-50 bg-slate-50 text-slate-400 hover:border-slate-100'
                      }`}
                    >
                      <span className="text-[11px] font-black tracking-[0.2em]">{p}</span>
                    </button>
                  ))}
                </div>
              </div>
              </div>
          )}

          <div className="flex gap-4 mt-4">
            <button onClick={closeModal} className="btn-secondary flex-1 py-4 text-[10px] font-black uppercase tracking-widest border-slate-100">Cancelar</button>
            <button onClick={handleEditSave} disabled={saving} className="btn-primary flex-1 py-4 text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-500/10">
              {saving ? 'PROCESSANDO...' : 'SALVAR ALTERAÇÕES'}
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
          <p className="text-sm text-slate-500">
            Alterar o cargo de <span className="text-slate-900 font-bold">{selected?.name}</span> para:
          </p>
          <div className="flex flex-col gap-2">
            {['MEMBRO', 'ADMIN', 'MASTER'].map(r => (
              <button 
                key={r}
                onClick={() => setNewRole(r)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  newRole === r 
                    ? 'border-green-500 bg-green-50 text-green-700' 
                    : 'border-slate-100 bg-slate-50 text-slate-400 hover:bg-slate-100'
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

      {/* Modal: Novo Usuário */}
      <Modal 
        isOpen={modalType === 'create'} 
        onClose={closeModal} 
        title="Criar Novo Usuário"
      >
        <div className="flex flex-col gap-5">
          {/* Tabs */}
          <div className="flex border-b border-slate-50">
            <button 
              onClick={() => setActiveTab('geral')}
              className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'geral' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              Geral
            </button>
            <button 
              onClick={() => setActiveTab('plano')}
              className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'plano' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              Plano & Acesso
            </button>
          </div>

          {activeTab === 'geral' && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="label">Nome</label>
                  <input className="input-field" value={createForm.name} onChange={setCreate('name')} placeholder="Nome completo" />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input className="input-field" value={createForm.email} onChange={setCreate('email')} placeholder="usuario@email.com" />
                </div>
                <div>
                  <label className="label">Telefone</label>
                  <input className="input-field" value={createForm.phone} onChange={setCreate('phone')} placeholder="(11) 90000-0000" />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="label">Senha (Obrigatória)</label>
                  <div className="relative">
                    <input 
                      type={showPass ? 'text' : 'password'} 
                      className="input-field pr-10" 
                      value={createForm.password} 
                      onChange={setCreate('password')} 
                      placeholder="Mín. 6 caracteres"
                    />
                    <button 
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {['STARTER', 'PRO', 'VIP PREMIUM'].map(p => (
                    <button
                      key={p}
                      onClick={() => setCreateForm(f => ({ ...f, plan: p }))}
                      className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-2 ${
                        createForm.plan === p 
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-700' 
                          : 'border-slate-50 bg-slate-50 text-slate-400 hover:border-slate-100'
                      }`}
                    >
                      <span className="text-[11px] font-black tracking-[0.2em]">{p}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label mb-3">Cargo / Permissão</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {['MEMBRO', 'ADMIN', ...(isMaster ? ['MASTER'] : [])].map(r => (
                    <button
                      key={r}
                      onClick={() => setCreateForm(f => ({ ...f, role: r }))}
                      className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${
                        createForm.role === r 
                          ? 'border-blue-500 bg-blue-50 text-blue-700' 
                          : 'border-slate-50 bg-slate-50 text-slate-400 hover:border-slate-100'
                      }`}
                    >
                      <span className="text-[10px] font-black tracking-[0.1em]">{r}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          <div className="flex gap-4 mt-4">
            <button onClick={closeModal} className="btn-secondary flex-1 py-4 text-[10px] font-black uppercase tracking-widest border-slate-100">Cancelar</button>
            <button onClick={handleCreateSave} disabled={saving} className="btn-primary flex-1 py-4 text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-500/10">
              {saving ? 'CRIANDO...' : 'CRIAR USUÁRIO'}
            </button>
          </div>
        </div>
      </Modal>

    </div>
  )
}
