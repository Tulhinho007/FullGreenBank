import { useState, useEffect } from 'react'
import { Shield, Search, Save, ChevronDown, ChevronUp, Eye, Edit3, Trash2, User } from 'lucide-react'
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
  analise:    'text-blue-500 bg-blue-50 border-blue-100',
  gestao:     'text-emerald-500 bg-emerald-50 border-emerald-100',
  financeiro: 'text-amber-600 bg-amber-50 border-amber-100',
  admin:      'text-purple-500 bg-purple-50 border-purple-100',
}

const getRoleColor = (role: string) => {
  if (role === 'MASTER') return 'text-purple-600 bg-purple-50 border-purple-100'
  if (role === 'ADMIN')  return 'text-blue-600 bg-blue-50 border-blue-100'
  if (role === 'TESTER') return 'text-amber-600 bg-amber-50 border-amber-100'
  return 'text-slate-600 bg-slate-50 border-slate-100'
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

  const groupedPermissions = permissions.reduce((acc, p) => {
    const module = p.module || 'outros'
    if (!acc[module]) acc[module] = []
    acc[module].push(p)
    return acc
  }, {} as Record<string, PagePermission[]>)

  return (
    <div className="p-4 lg:p-10 min-h-screen bg-slate-50/50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-green-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-green-500/20">
              <Shield size={28} />
            </div>
            <div>
               <h1 className="text-2xl font-black text-slate-800 tracking-tight">Controle de Acesso</h1>
               <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest mt-1">Gerencie permissões granulares por página</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User List Panel */}
           <div className="lg:col-span-1 bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden flex flex-col shadow-sm">
            <div className="p-5 border-b border-slate-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Buscar usuário..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                   className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-300 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                 />
               </div>
             </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1 max-h-[600px]">
              {users
                .filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
                .map(u => (
                  <button
                   key={u.id}
                   onClick={() => handleSelectUser(u)}
                   className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all duration-200 ${
                     selectedUser?.id === u.id 
                       ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 active:scale-[0.98]' 
                       : 'text-slate-400 hover:bg-slate-50'
                   }`}
                 >
                     <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${
                       selectedUser?.id === u.id ? 'bg-white/20' : 'bg-slate-50 text-emerald-600 border border-emerald-100/50'
                     }`}>
                       {u.name[0]}
                     </div>
                     <div className="text-left flex-1 min-w-0">
                       <p className={`text-sm font-bold truncate ${selectedUser?.id === u.id ? 'text-white' : 'text-slate-800'}`}>
                         {u.name}
                       </p>
                       <p className={`text-[10px] font-bold truncate ${selectedUser?.id === u.id ? 'text-white/70' : 'text-slate-400'}`}>
                         {u.email}
                       </p>
                     </div>
                     <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${getRoleColor(u.role)}`}>
                       {u.role}
                     </span>
                  </button>
                ))}
            </div>
          </div>

          {/* Permissions Matrix Panel */}
          <div className="lg:col-span-2">
            {selectedUser ? (
              <div className="space-y-6">
                {/* User Profile Header */}
                <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 font-bold text-lg">
                    {selectedUser.name[0]}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{selectedUser.name}</h2>
                    <p className="text-sm text-slate-500">{selectedUser.email}</p>
                  </div>
                  <div className="ml-auto">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-green-500/20"
                    >
                      <Save size={18} />
                      {saving ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                  </div>
                </div>

                {loading ? (
                  <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[2rem] border border-slate-200">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mb-4"></div>
                    <p className="text-slate-500">Carregando permissões...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                     {Object.entries(groupedPermissions).map(([module, pages]) => {
                       const isCollapsed = collapsed[module]
                       const allGranted = pages.every(p => p.canView && p.canEdit && p.canDelete)

                       return (
                         <div key={module} className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
                           {/* Module header */}
                           <div
                             className={`flex items-center justify-between p-5 cursor-pointer hover:bg-slate-50 transition-colors ${!isCollapsed ? 'border-b border-slate-50' : ''}`}
                             onClick={() => setCollapsed(prev => ({ ...prev, [module]: !isCollapsed }))}
                           >
                             <div className="flex items-center gap-4">
                               <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${MODULE_COLORS[module] || 'bg-slate-50 border-slate-100'}`}>
                                 {MODULE_LABELS[module] || module}
                               </span>
                               <span className="text-[11px] text-slate-400 font-black uppercase tracking-[0.2em]">
                                 {pages.length} módulos
                               </span>
                             </div>
                             <div className="flex items-center gap-6" onClick={e => e.stopPropagation()}>
                               <button
                                 onClick={() => toggleModule(module, !allGranted)}
                                 className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-md transition-colors ${
                                   allGranted ? 'text-rose-500 hover:bg-rose-50' : 'text-emerald-600 hover:bg-emerald-50'
                                 }`}
                               >
                                 {allGranted ? 'Remover Tudo' : 'Liberar Tudo'}
                               </button>
                               <div className="text-slate-300">
                                 {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                               </div>
                             </div>
                           </div>
                           {/* Pages table */}
                           {!isCollapsed && (
                             <div className="bg-slate-50/30">
                               {/* Table header */}
                               <div className="grid grid-cols-[1fr_90px_90px_90px] px-8 py-3 border-b border-slate-100 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                 <span>Página</span>
                                 <span className="text-center flex items-center justify-center gap-1.5">
                                   <Eye size={12} /> Ver
                                 </span>
                                 <span className="text-center flex items-center justify-center gap-1.5">
                                   <Edit3 size={12} /> Editar
                                 </span>
                                 <span className="text-center flex items-center justify-center gap-1.5">
                                   <Trash2 size={12} /> Deletar
                                 </span>
                               </div>

                               {pages.map((p) => (
                                 <div
                                   key={p.pageName}
                                   className="grid grid-cols-[1fr_90px_90px_90px] px-8 py-5 border-b border-slate-50 last:border-0 hover:bg-white transition-colors"
                                 >
                                   <span className="text-sm text-slate-700 font-bold self-center">{p.pageLabel}</span>
                                   {(['canView', 'canEdit', 'canDelete'] as const).map((field) => (
                                     <div key={field} className="flex items-center justify-center">
                                       <button
                                         onClick={() => togglePermission(p.pageName, field)}
                                         className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all duration-200 active:scale-90 ${
                                           p[field]
                                             ? field === 'canView'   ? 'bg-emerald-600 border-emerald-500 shadow-lg shadow-emerald-500/20'
                                             : field === 'canEdit'   ? 'bg-blue-600 border-blue-500 shadow-lg shadow-blue-500/20'
                                             : 'bg-rose-600 border-rose-500 shadow-lg shadow-rose-500/20'
                                             : 'bg-white border-slate-100 text-slate-200 hover:border-slate-200'
                                         }`}
                                       >
                                         {p[field] ? (
                                           field === 'canView' ? <Eye size={15} className="text-white" strokeWidth={3} /> :
                                           field === 'canEdit' ? <Edit3 size={15} className="text-white" strokeWidth={3} /> :
                                           <Trash2 size={15} className="text-white" strokeWidth={3} />
                                         ) : (
                                           <div className="w-1.5 h-1.5 rounded-full bg-slate-100" />
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
            ) : (
               <div className="flex flex-col items-center justify-center h-[500px] text-center p-10 bg-white rounded-[3rem] border border-slate-100 border-dashed shadow-sm">
                 <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6 border border-slate-50">
                   <User size={40} className="text-slate-200" />
                 </div>
                 <h3 className="text-xl font-black text-slate-800 mb-2">Selecione um Usuário</h3>
                 <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest max-w-xs leading-relaxed">
                   Clique em um usuário na lista ao lado para gerenciar suas permissões de acesso e módulos ativos.
                 </p>
               </div>
            )}
          </div>
        </div>
      </div>

       {/* Toast */}
       {toast && (
         <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-2xl z-50 border animate-in fade-in slide-in-from-bottom-8 duration-500 ${
           toast.type === 'success'
             ? 'bg-white text-emerald-600 border-emerald-100'
             : 'bg-white text-rose-600 border-rose-100'
         }`}>
           {toast.msg}
         </div>
       )}
    </div>
  )
}
