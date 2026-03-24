import { useState, useEffect } from 'react'
import { Shield, Search, Save, ChevronDown, ChevronUp, Check, X, Eye, Edit3, Trash2, User } from 'lucide-react'
import api from '../services/api'
import { permissionsService, PagePermission } from '../services/permissions.service'
import { useAuth } from '../contexts/AuthContext'

interface UserItem {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
  paymentStatus: string
}

const MODULE_LABELS: Record<string, string> = {
  analise:    '📊 Análise',
  gestao:     '🏦 Gestão',
  financeiro: '💰 Financeiro',
  admin:      '⚙️ Administração',
}

const MODULE_COLORS: Record<string, string> = {
  analise:    'text-blue-400 bg-blue-900/20 border-blue-800/40',
  gestao:     'text-green-400 bg-green-900/20 border-green-800/40',
  financeiro: 'text-yellow-400 bg-yellow-900/20 border-yellow-800/40',
  admin:      'text-purple-400 bg-purple-900/20 border-purple-800/40',
}

const getRoleColor = (role: string) => {
  if (role === 'MASTER') return 'text-purple-400 bg-purple-900/30 border-purple-700/50'
  if (role === 'ADMIN')  return 'text-blue-400 bg-blue-900/30 border-blue-700/50'
  if (role === 'TESTER') return 'text-yellow-400 bg-yellow-900/30 border-yellow-700/50'
  return 'text-slate-400 bg-slate-800/50 border-slate-700/50'
}

export const AdminPermissoesPage = () => {
  const { user: currentUser } = useAuth()

  const [users, setUsers]               = useState<UserItem[]>([])
  const [search, setSearch]             = useState('')
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null)
  const [permissions, setPermissions]   = useState<PagePermission[]>([])
  const [collapsed, setCollapsed]       = useState<Record<string, boolean>>({})
  const [loading, setLoading]           = useState(false)
  const [saving, setSaving]             = useState(false)
  const [toast, setToast]               = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  // Busca usuários
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get('/users')
        const all: UserItem[] = res.data.data?.users || res.data.data || []
        // Filtra: ADMIN não vê MASTER nem outros ADMIN (exceto a si mesmo)
        const filtered = all.filter((u) => {
          if (currentUser?.role === 'ADMIN') {
            return u.role !== 'MASTER' && u.role !== 'ADMIN'
          }
          return u.role !== 'MASTER' // MASTER não edita outro MASTER
        })
        setUsers(filtered)
      } catch {
        showToast('Erro ao carregar usuários', 'error')
      }
    }
    fetchUsers()
  }, [currentUser?.role])

  // Busca permissões do usuário selecionado
  const handleSelectUser = async (u: UserItem) => {
    setSelectedUser(u)
    setLoading(true)
    try {
      const data = await permissionsService.getByUser(u.id)
      setPermissions(data.permissions)
    } catch {
      showToast('Erro ao carregar permissões', 'error')
    } finally {
      setLoading(false)
    }
  }

  const togglePermission = (pageName: string, field: 'canView' | 'canEdit' | 'canDelete') => {
    setPermissions((prev) =>
      prev.map((p) => {
        if (p.pageName !== pageName) return p
        const updated = { ...p, [field]: !p[field] }
        // canEdit e canDelete exigem canView
        if (field === 'canView' && !updated.canView) {
          updated.canEdit = false
          updated.canDelete = false
        }
        // canDelete exige canEdit
        if (field === 'canEdit' && !updated.canEdit) {
          updated.canDelete = false
        }
        if (field === 'canDelete' && updated.canDelete) {
          updated.canEdit = true
          updated.canView = true
        }
        if (field === 'canEdit' && updated.canEdit) {
          updated.canView = true
        }
        return updated
      })
    )
  }

  const toggleModule = (module: string, grant: boolean) => {
    setPermissions((prev) =>
      prev.map((p) =>
        p.module === module
          ? { ...p, canView: grant, canEdit: grant, canDelete: grant }
          : p
      )
    )
  }

  const handleSave = async () => {
    if (!selectedUser) return
    setSaving(true)
    try {
      await permissionsService.save(
        selectedUser.id,
        permissions.map(({ pageName, canView, canEdit, canDelete }) => ({
          pageName, canView, canEdit, canDelete,
        }))
      )
      showToast(`✅ Permissões de ${selectedUser.name} salvas!`)
    } catch {
      showToast('❌ Erro ao salvar permissões', 'error')
    } finally {
      setSaving(false)
    }
  }

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  )

  // Agrupa permissões por módulo
  const byModule = permissions.reduce<Record<string, PagePermission[]>>((acc, p) => {
    if (!acc[p.module]) acc[p.module] = []
    acc[p.module].push(p)
    return acc
  }, {})

  const toggleCollapse = (module: string) =>
    setCollapsed((prev) => ({ ...prev, [module]: !prev[module] }))

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-700/40 flex items-center justify-center">
          <Shield size={20} className="text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white font-display">Controle de Acesso</h1>
          <p className="text-slate-400 text-sm">Gerencie as permissões de cada usuário por módulo e página</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Coluna esquerda — lista de usuários */}
        <div className="lg:col-span-1">
          <div className="card p-4">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-4">
              Selecionar Usuário
            </h2>

            {/* Search */}
            <div className="relative mb-4">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome ou email..."
                className="input-field pl-9 text-sm"
              />
            </div>

            {/* Lista */}
            <div className="flex flex-col gap-1 max-h-[520px] overflow-y-auto custom-scrollbar">
              {filteredUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => handleSelectUser(u)}
                  className={`w-full text-left px-3 py-3 rounded-lg transition-all duration-150 border ${
                    selectedUser?.id === u.id
                      ? 'bg-green-900/20 border-green-700/40 text-white'
                      : 'bg-transparent border-transparent hover:bg-surface-300/40 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-700/50 flex items-center justify-center text-xs font-bold text-white shrink-0">
                      {u.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm truncate">{u.name}</div>
                      <div className="text-xs text-slate-500 truncate">{u.email}</div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${getRoleColor(u.role)}`}>
                      {u.role}
                    </span>
                  </div>
                </button>
              ))}
              {filteredUsers.length === 0 && (
                <p className="text-slate-500 text-sm text-center py-8">Nenhum usuário encontrado</p>
              )}
            </div>
          </div>
        </div>

        {/* Coluna direita — matriz de permissões */}
        <div className="lg:col-span-2">
          {!selectedUser ? (
            <div className="card p-12 flex flex-col items-center justify-center gap-3 text-center h-full">
              <User size={40} className="text-slate-600" />
              <p className="text-slate-400 font-medium">Selecione um usuário para gerenciar permissões</p>
              <p className="text-slate-600 text-sm">As permissões são configuradas por página e módulo</p>
            </div>
          ) : (
            <div className="card p-6">
              {/* User header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-700/50 flex items-center justify-center text-sm font-bold text-white">
                    {selectedUser.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-white">{selectedUser.name}</div>
                    <div className="text-xs text-slate-400">{selectedUser.email}</div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${getRoleColor(selectedUser.role)}`}>
                    {selectedUser.role}
                  </span>
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-primary flex items-center gap-2 text-sm"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save size={15} />
                  )}
                  {saving ? 'Salvando...' : 'Salvar Permissões'}
                </button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {Object.entries(byModule).map(([module, pages]) => {
                    const allGranted = pages.every((p) => p.canView && p.canEdit && p.canDelete)
                    const isCollapsed = collapsed[module]

                    return (
                      <div key={module} className={`rounded-xl border ${MODULE_COLORS[module] || 'border-slate-700'} overflow-hidden`}>
                        {/* Module header */}
                        <div className={`flex items-center justify-between px-4 py-3 ${MODULE_COLORS[module] || ''}`}>
                          <button
                            onClick={() => toggleCollapse(module)}
                            className="flex items-center gap-2 font-bold text-sm flex-1"
                          >
                            {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                            {MODULE_LABELS[module] || module}
                            <span className="text-xs font-normal opacity-70">({pages.length} páginas)</span>
                          </button>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleModule(module, true)}
                              className="text-xs px-2 py-1 rounded bg-green-600/30 hover:bg-green-600/50 text-green-300 transition-colors flex items-center gap-1"
                            >
                              <Check size={11} /> Tudo
                            </button>
                            <button
                              onClick={() => toggleModule(module, false)}
                              className="text-xs px-2 py-1 rounded bg-red-600/20 hover:bg-red-600/40 text-red-400 transition-colors flex items-center gap-1"
                            >
                              <X size={11} /> Nada
                            </button>
                          </div>
                        </div>

                        {/* Pages table */}
                        {!isCollapsed && (
                          <div className="bg-surface-200/50">
                            {/* Table header */}
                            <div className="grid grid-cols-[1fr_80px_80px_80px] px-4 py-2 border-b border-slate-700/50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                              <span>Página</span>
                              <span className="text-center flex items-center justify-center gap-1">
                                <Eye size={11} /> Ver
                              </span>
                              <span className="text-center flex items-center justify-center gap-1">
                                <Edit3 size={11} /> Editar
                              </span>
                              <span className="text-center flex items-center justify-center gap-1">
                                <Trash2 size={11} /> Deletar
                              </span>
                            </div>

                            {pages.map((p) => (
                              <div
                                key={p.pageName}
                                className="grid grid-cols-[1fr_80px_80px_80px] px-4 py-3 border-b border-slate-800/60 last:border-0 hover:bg-surface-300/20 transition-colors"
                              >
                                <span className="text-sm text-slate-200 font-medium self-center">{p.pageLabel}</span>
                                {(['canView', 'canEdit', 'canDelete'] as const).map((field) => (
                                  <div key={field} className="flex items-center justify-center">
                                    <button
                                      onClick={() => togglePermission(p.pageName, field)}
                                      className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all duration-150 ${
                                        p[field]
                                          ? field === 'canView'   ? 'bg-green-500 border-green-400'
                                          : field === 'canEdit'   ? 'bg-blue-500 border-blue-400'
                                          : 'bg-red-500 border-red-400'
                                          : 'bg-transparent border-slate-600 hover:border-slate-400'
                                      }`}
                                    >
                                      {p[field] && (
                                        field === 'canView' ? <Eye size={13} className="text-white" strokeWidth={3} /> :
                                        field === 'canEdit' ? <Edit3 size={13} className="text-white" strokeWidth={3} /> :
                                        <Trash2 size={13} className="text-white" strokeWidth={3} />
                                      )}
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl font-semibold text-sm shadow-2xl z-50 border ${
          toast.type === 'success'
            ? 'bg-slate-900 text-white border-green-500/50'
            : 'bg-slate-900 text-red-400 border-red-500/50'
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
