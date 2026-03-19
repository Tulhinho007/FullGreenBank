import { useEffect, useState } from 'react'
import { usersService } from '../services/users.service'
import { roleLabelMap, formatDateTime } from '../utils/formatters'
import { Modal } from '../components/ui/Modal'
import { Users, ShieldCheck, Pencil, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'

interface User {
  id: string; name: string; email: string; phone?: string
  username: string; role: string; active: boolean; createdAt: string
}

type ModalType = 'edit' | 'role' | null

export const AdminUsersPage = () => {
  const { user: me } = useAuth()
  const isMaster = me?.role === 'MASTER'
  const isAdmin  = me?.role === 'ADMIN' || me?.role === 'MASTER'

  const [users,     setUsers]     = useState<User[]>([])
  const [loading,   setLoading]   = useState(true)
  const [selected,  setSelected]  = useState<User | null>(null)
  const [modalType, setModalType] = useState<ModalType>(null)
  const [saving,    setSaving]    = useState(false)

  // Role form
  const [newRole, setNewRole] = useState('')

  // Edit form
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', username: '', password: '' })
  const [showPass, setShowPass] = useState(false)

  const load = () => {
    usersService.getAll()
      .then(setUsers)
      .catch(() => toast.error('Erro ao carregar usuários'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  // Guard: Admin não pode mexer em Master
  const canEdit = (u: User) => {
    if (me?.role === 'TESTER') return false
    if (u.role === 'MASTER' && !isMaster) return false  // Admin não edita Master
    return isAdmin
  }

  const openEdit = (u: User) => {
    if (!canEdit(u)) {
      toast.error('Admins não podem editar usuários Master.')
      return
    }
    setSelected(u)
    setEditForm({ name: u.name, email: u.email, phone: u.phone || '', username: u.username, password: '' })
    setModalType('edit')
  }

  const openRole = (u: User) => {
    if (!isMaster) { toast.error('Apenas Masters podem alterar roles.'); return }
    setSelected(u)
    setNewRole(u.role)
    setModalType('role')
  }

  const closeModal = () => { setSelected(null); setModalType(null); setShowPass(false) }

  const handleToggle = async (u: User) => {
    if (!canEdit(u)) { toast.error('Admins não podem desativar usuários Master.'); return }
    try {
      await usersService.toggleActive(u.id)
      toast.success(`Usuário ${u.active ? 'desativado' : 'ativado'}!`)
      load()
    } catch { toast.error('Erro ao alterar status') }
  }

  const handleEditSave = async () => {
    if (!selected) return
    setSaving(true)
    try {
      const payload: Record<string, string> = {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        username: editForm.username,
      }
      if (editForm.password) payload.password = editForm.password
      await usersService.updateProfileById(selected.id, payload)
      toast.success('Usuário atualizado!')
      closeModal()
      load()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erro ao atualizar'
      toast.error(msg)
    } finally { setSaving(false) }
  }

  const handleRoleUpdate = async () => {
    if (!selected || !newRole) return
    setSaving(true)
    try {
      await usersService.updateRole(selected.id, newRole)
      toast.success('Role atualizado!')
      closeModal()
      load()
    } catch { toast.error('Erro ao atualizar role') }
    finally { setSaving(false) }
  }

  const setEdit = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
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
                  {['Usuário', 'Email', 'Telefone', 'Role', 'Cadastro', 'Status', 'Ações'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-300">
                {users.map(u => {
                  const roleInfo = roleLabelMap[u.role]
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
                            <p className="text-slate-500 text-[11px]">@{u.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{u.email}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{u.phone || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold ${roleInfo.color}`}>{roleInfo.label}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{formatDateTime(u.createdAt)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold ${u.active ? 'text-green-500' : 'text-red-500'}`}>
                          {u.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Editar */}
                          <button
                            onClick={() => openEdit(u)}
                            disabled={!editable}
                            className={`text-xs px-2.5 py-1 rounded-md border transition-colors flex items-center gap-1 font-medium ${
                              editable
                                ? 'text-green-600 border-green-500/50 hover:bg-green-50 dark:text-green-400 dark:border-green-800/40 dark:hover:bg-green-900/20'
                                : 'opacity-30 cursor-not-allowed border-slate-300 text-slate-400'
                            }`}
                          >
                            <Pencil size={10} />Editar
                          </button>

                          {/* Role — só master */}
                          {isMaster && (
                            <button
                              onClick={() => openRole(u)}
                              className="text-xs px-2.5 py-1 rounded-md border transition-colors flex items-center gap-1 font-medium text-blue-600 border-blue-400/50 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-800/40 dark:hover:bg-blue-900/20"
                            >
                              <ShieldCheck size={10} />Role
                            </button>
                          )}

                          {/* Ativar/Desativar */}
                          <button
                            onClick={() => handleToggle(u)}
                            disabled={!editable}
                            className={`text-xs px-2.5 py-1 rounded-md border transition-colors font-medium ${
                              !editable
                                ? 'opacity-30 cursor-not-allowed border-slate-300 text-slate-400'
                                : u.active
                                  ? 'text-red-600 border-red-400/50 hover:bg-red-50 dark:text-red-400 dark:border-red-800/40 dark:hover:bg-red-900/20'
                                  : 'text-green-600 border-green-400/50 hover:bg-green-50 dark:text-green-400 dark:border-green-800/40 dark:hover:bg-green-900/20'
                            }`}
                          >
                            {u.active ? 'Desativar' : 'Ativar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {users.length === 0 && (
            <div className="py-16 text-center">
              <Users size={32} className="text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500">Nenhum usuário encontrado.</p>
            </div>
          )}
        </div>
      )}

      {/* MODAL EDITAR */}
      <Modal isOpen={modalType === 'edit'} onClose={closeModal} title="Editar Usuário" size="md">
        {selected && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 pb-3 border-b border-surface-300">
              <div className="w-9 h-9 rounded-full bg-green-800 flex items-center justify-center text-sm font-bold text-green-300">
                {selected.name[0].toUpperCase()}
              </div>
              <div>
                <p className="text-white font-medium text-sm">{selected.name}</p>
                <p className="text-slate-500 text-xs">@{selected.username} · <span className={roleLabelMap[selected.role]?.color}>{roleLabelMap[selected.role]?.label}</span></p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Nome completo</label>
                <input className="input-field" value={editForm.name} onChange={setEdit('name')} />
              </div>
              <div>
                <label className="label">Usuário</label>
                <input className="input-field" value={editForm.username} onChange={setEdit('username')} />
              </div>
              <div className="col-span-2">
                <label className="label">Email</label>
                <input type="email" className="input-field" value={editForm.email} onChange={setEdit('email')} />
              </div>
              <div className="col-span-2">
                <label className="label">Telefone</label>
                <input className="input-field" placeholder="(11) 99999-9999" value={editForm.phone} onChange={setEdit('phone')} />
              </div>
              <div className="col-span-2">
                <label className="label">Nova senha <span className="text-slate-600 font-normal">(deixe em branco para não alterar)</span></label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="input-field pr-10"
                    placeholder="••••••••"
                    value={editForm.password}
                    onChange={setEdit('password')}
                  />
                  <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={closeModal} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={handleEditSave} disabled={saving} className="btn-primary flex-1">
                {saving ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL ROLE */}
      <Modal isOpen={modalType === 'role'} onClose={closeModal} title="Alterar Role" size="sm">
        {selected && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-slate-400">Alterar role de <strong className="text-white">{selected.name}</strong></p>
            <div>
              <label className="label">Novo Role</label>
              <select className="input-field" value={newRole} onChange={e => setNewRole(e.target.value)}>
                <option value="MEMBRO">Membro</option>
                <option value="TESTER">Visualizador</option>
                <option value="ADMIN">Admin</option>
                <option value="MASTER">Master</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button onClick={closeModal} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={handleRoleUpdate} disabled={saving} className="btn-primary flex-1">
                {saving ? 'Salvando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
