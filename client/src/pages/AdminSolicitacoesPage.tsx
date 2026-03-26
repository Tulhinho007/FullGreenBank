import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Search, Edit2, Trash2, UserPlus } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'
import { formatCurrency } from '../utils/formatters'
import { CurrencyInput } from '../components/ui/CurrencyInput'
import { Modal } from '../components/ui/Modal'
import { usersService } from '../services/users.service'
import { useAuth } from '../contexts/AuthContext'
import { addLog } from '../services/log.service'

interface Solicitacao {
  id: string
  usuario: {
    name: string
    email: string
  }
  valorAporte: number
  dataPedido: string
  status: string
  observacoes?: string
}

export const AdminSolicitacoesPage = () => {
  const { user: me } = useAuth()
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setLoadingSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('TODOS')
  const [dataFilter, setDataFilter] = useState('')

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  
  const [selectedSolicitacao, setSelectedSolicitacao] = useState<Solicitacao | null>(null)
  const [editValor, setEditValor] = useState('')
  const [editObservacoes, setEditObservacoes] = useState('')

  const [users, setUsers] = useState<any[]>([])
  const [newSolicitacao, setNewSolicitacao] = useState({
    userId: '',
    valorAporte: 0,
    observacoes: ''
  })

  const fetchSolicitacoes = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/solicitacoes')
      const arr = Array.isArray(data) ? data : (Array.isArray(data?.solicitacoes) ? data.solicitacoes : (Array.isArray(data?.data) ? data.data : []))
      setSolicitacoes(arr)
    } catch {
      toast.error('Erro ao carregar solicitações')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSolicitacoes()
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const data = await usersService.getAll()
      setUsers(data)
    } catch {
      toast.error('Erro ao carregar lista de usuários')
    }
  }

  const handleAddManual = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSolicitacao.userId || !newSolicitacao.valorAporte) {
      toast.error('Preencha os campos obrigatórios')
      return
    }

    setLoadingSaving(true)
    try {
      const { data } = await api.post('/solicitacoes', {
        ...newSolicitacao,
        status: 'ACEITO', // Adesão manual já entra como aceita/confirmada
        termoAceito: true
      })
      
      toast.success('Adesão manual realizada com sucesso!')
      
      if (me) {
        addLog({
          userEmail: me.email,
          userName: me.name,
          userRole: me.role,
          category: 'Financeiro',
          action: 'Adesão Manual',
          detail: `Usuário ID: ${newSolicitacao.userId} - Valor: ${formatCurrency(newSolicitacao.valorAporte)}`
        })
      }

      setSolicitacoes(prev => [data, ...prev])
      setIsAddModalOpen(false)
      setNewSolicitacao({ userId: '', valorAporte: 0, observacoes: '' })
    } catch {
      toast.error('Erro ao realizar adesão manual')
    } finally {
      setLoadingSaving(false)
    }
  }

  const handleUpdateStatus = async (id: string, novoStatus: 'ACEITO' | 'RECUSADO') => {
    try {
      await api.patch(`/solicitacoes/${id}/status`, { status: novoStatus })
      toast.success(`Solicitação ${novoStatus.toLowerCase()}!`)
      setSolicitacoes(prev => prev.map(s => s.id === id ? { ...s, status: novoStatus } : s))
    } catch {
      toast.error('Erro ao atualizar status da solicitação')
    }
  }

  const filteredData = Array.isArray(solicitacoes) ? solicitacoes.filter(s => {
    const matchesSearch = (s.usuario?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (s.usuario?.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'TODOS' || s.status === statusFilter
    const matchesDate = !dataFilter || (s.dataPedido && s.dataPedido.startsWith(dataFilter))
    
    return matchesSearch && matchesStatus && matchesDate
  }) : []

  const handleDelete = async () => {
    if (!selectedSolicitacao) return
    setLoading(true)
    try {
      await api.delete(`/solicitacoes/${selectedSolicitacao.id}`)
      toast.success('Solicitação excluída com sucesso!')
      setSolicitacoes(prev => prev.filter(s => s.id !== selectedSolicitacao.id))
      setIsDeleteModalOpen(false)
    } catch {
      toast.error('Erro ao excluir solicitação')
    } finally {
      setLoading(false)
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSolicitacao) return
    
    setLoading(true)
    try {
      const { data } = await api.put(`/solicitacoes/${selectedSolicitacao.id}`, {
        valorAporte: editValor ? Number(editValor) : selectedSolicitacao.valorAporte,
        observacoes: editObservacoes
      })
      toast.success('Solicitação atualizada!')
      setSolicitacoes(prev => prev.map(s => s.id === selectedSolicitacao.id ? data : s))
      setIsEditModalOpen(false)
    } catch {
      toast.error('Erro ao atualizar solicitação')
    } finally {
      setLoading(false)
    }
  }

  const openEditModal = (s: Solicitacao) => {
    setSelectedSolicitacao(s)
    setEditValor(s.valorAporte.toString())
    setEditObservacoes(s.observacoes || '')
    setIsEditModalOpen(true)
  }

  const openDeleteModal = (s: Solicitacao) => {
    setSelectedSolicitacao(s)
    setIsDeleteModalOpen(true)
  }



  return (
    <div className="flex flex-col gap-8 font-sans pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="font-display font-black text-slate-800 text-2xl tracking-tight">Solicitações de Adesão</h2>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Gerenciamento de aportes em Banca Gerenciada</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="btn-primary flex items-center gap-2 px-6 py-3.5 rounded-2xl shadow-xl shadow-emerald-500/20 active:scale-95 transition-all text-[11px] font-black uppercase tracking-widest"
          >
            <UserPlus size={18} />
            Nova Adesão Manual
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-wrap items-center gap-4 transition-all hover:shadow-md">
        <div className="relative flex-1 min-w-[280px]">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Pesquise por nome ou email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
        </div>
        
        <div className="flex items-center gap-3">
          <input 
            type="date" 
            value={dataFilter}
            onChange={(e) => setDataFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-2xl px-4 h-12 text-xs font-bold text-slate-600 focus:outline-none shadow-sm cursor-pointer"
          />
          
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-2xl px-4 h-12 text-xs font-bold text-slate-600 focus:outline-none shadow-sm cursor-pointer min-w-[160px]"
          >
            <option value="TODOS">Todos os Status</option>
            <option value="EM_ANALISE">Em Análise</option>
            <option value="ACEITO">Aceito</option>
            <option value="RECUSADO">Recusado</option>
          </select>
        </div>
      </div>

      {/* Tabela / Grid */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-8 py-5">Usuário</th>
                <th className="px-8 py-5">Data do Pedido</th>
                <th className="px-8 py-5">Valor do Aporte</th>
                <th className="px-8 py-5 text-center">Status</th>
                <th className="px-8 py-5">Observações</th>
                <th className="px-8 py-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Carregando solicitações...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-30">
                      <Search size={40} className="text-slate-400" />
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Nenhuma solicitação encontrada</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-800 uppercase tracking-tight">{s.usuario.name}</span>
                        <span className="text-[10px] font-bold text-slate-400 mt-0.5">{s.usuario.email}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-slate-500">
                          {new Date(s.dataPedido).toLocaleDateString('pt-BR')}
                        </span>
                        <span className="text-[10px] font-medium text-slate-400 mt-0.5 uppercase">
                          {new Date(s.dataPedido).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-sm font-black text-emerald-600 font-mono bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                        {formatCurrency(s.valorAporte)}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <div className="flex justify-center">
                        {s.status === 'ACEITO' ? (
                          <span className="px-4 py-1.5 rounded-full text-[9px] font-black bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase tracking-widest flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Aceito
                          </span>
                        ) : s.status === 'RECUSADO' ? (
                           <span className="px-4 py-1.5 rounded-full text-[9px] font-black bg-rose-50 text-rose-600 border border-rose-100 uppercase tracking-widest flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Recusado
                          </span>
                        ) : (
                           <span className="px-4 py-1.5 rounded-full text-[9px] font-black bg-amber-50 text-amber-600 border border-amber-100 uppercase tracking-widest flex items-center gap-2 animate-pulse">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Em Análise
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-[11px] font-bold text-slate-400 max-w-[180px] truncate italic" title={s.observacoes || '-'}>
                        {s.observacoes || '—'}
                      </p>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {s.status === 'EM_ANALISE' && (
                          <>
                            <button 
                              onClick={() => handleUpdateStatus(s.id, 'ACEITO')} 
                              className="nm-icon w-9 h-9 flex items-center justify-center text-emerald-500 hover:text-emerald-600 border border-emerald-100/50 bg-emerald-50 rounded-xl transition-all active:scale-90"
                              title="Aceitar"
                            >
                              <CheckCircle size={16} strokeWidth={2.5} />
                            </button>
                            <button 
                              onClick={() => handleUpdateStatus(s.id, 'RECUSADO')} 
                              className="nm-icon w-9 h-9 flex items-center justify-center text-rose-500 hover:text-rose-600 border border-rose-100/50 bg-rose-50 rounded-xl transition-all active:scale-90"
                              title="Recusar"
                            >
                              <XCircle size={16} strokeWidth={2.5} />
                            </button>
                          </>
                        )}
                        <button 
                          onClick={() => openEditModal(s)} 
                          className="nm-icon w-9 h-9 flex items-center justify-center text-blue-500 hover:text-blue-600 border border-blue-100/50 bg-blue-50 rounded-xl transition-all active:scale-90"
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => openDeleteModal(s)} 
                          className="nm-icon w-9 h-9 flex items-center justify-center text-rose-500 hover:text-rose-600 border border-rose-100/50 bg-slate-50 rounded-xl transition-all active:scale-90"
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Adesão Manual */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Nova Adesão Manual"
        size="md"
      >
        <form onSubmit={handleAddManual} className="flex flex-col gap-6">
          <div className="space-y-4">
            <div>
              <label className="label mb-2">Selecione o Usuário</label>
              <select 
                className="input-field w-full h-12 bg-slate-50 border-slate-100 text-sm font-bold text-slate-700"
                value={newSolicitacao.userId}
                onChange={e => setNewSolicitacao(prev => ({ ...prev, userId: e.target.value }))}
                required
              >
                <option value="">— Selecione um usuário —</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label mb-2">Valor do Aporte</label>
              <CurrencyInput
                value={newSolicitacao.valorAporte}
                onChange={v => setNewSolicitacao(prev => ({ ...prev, valorAporte: v }))}
                className="w-full bg-slate-50 border-slate-100"
              />
            </div>

            <div>
              <label className="label mb-2">Observações Internas</label>
              <textarea 
                className="input-field w-full h-24 bg-slate-50 border-slate-100 py-3 px-4 resize-none text-sm font-medium"
                placeholder="Ex: Pagamento recebido via transferência..."
                value={newSolicitacao.observacoes}
                onChange={e => setNewSolicitacao(prev => ({ ...prev, observacoes: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-slate-50">
            <button 
              type="button" 
              onClick={() => setIsAddModalOpen(false)} 
              className="btn-secondary flex-1 py-4 text-[10px] font-black uppercase tracking-widest border-slate-100"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={saving} 
              className="btn-primary flex-1 py-4 text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-500/10"
            >
              {saving ? 'PROCESSANDO...' : 'FINALIZAR ADESÃO'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal de Edição */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Editar Solicitação"
        size="md"
      >
        {selectedSolicitacao && (
          <form onSubmit={handleEditSubmit} className="flex flex-col gap-6">
            <div className="space-y-5">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Usuário</p>
                <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{selectedSolicitacao.usuario.name}</p>
                <p className="text-[10px] font-bold text-slate-400 mt-0.5">{selectedSolicitacao.usuario.email}</p>
              </div>

              <div>
                <label className="label mb-2">Valor do Aporte</label>
                <CurrencyInput
                  value={Number(editValor)}
                  onChange={v => setEditValor(String(v))}
                  className="w-full bg-slate-50 border-slate-100"
                />
              </div>

              <div>
                <label className="label mb-2">Observações</label>
                <textarea 
                  className="input-field w-full h-24 bg-slate-50 border-slate-100 py-3 px-4 resize-none text-sm font-medium"
                  placeholder="Ex: Revisão de valores..."
                  value={editObservacoes} 
                  onChange={(e) => setEditObservacoes(e.target.value)} 
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-slate-50">
              <button 
                type="button" 
                onClick={() => setIsEditModalOpen(false)} 
                className="btn-secondary flex-1 py-4 text-[10px] font-black uppercase tracking-widest border-slate-100"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                disabled={loading} 
                className="btn-primary flex-1 py-4 text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-blue-500/10 !bg-blue-600 !hover:bg-blue-700 !border-blue-500"
              >
                {loading ? 'SALVANDO...' : 'SALVAR ALTERAÇÕES'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal de Exclusão */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        showHeader={false}
        size="sm"
      >
        {selectedSolicitacao && (
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-20 h-20 bg-rose-50 rounded-[2.5rem] flex items-center justify-center mb-6 border border-rose-100/50">
              <Trash2 size={36} className="text-rose-500" />
            </div>
            <h3 className="font-display font-black text-slate-800 text-xl tracking-tight mb-2">Excluir Solicitação?</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-loose max-w-[240px]">
              Deseja remover a solicitação de <span className="text-slate-900">{selectedSolicitacao.usuario.name}</span> no valor de <span className="text-emerald-600 font-black">{formatCurrency(selectedSolicitacao.valorAporte)}</span>?
            </p>
            
            <div className="flex flex-col w-full gap-3 mt-10">
              <button 
                onClick={handleDelete} 
                disabled={loading} 
                className="w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-rose-600 text-white hover:bg-rose-700 transition-all shadow-xl shadow-rose-900/10 active:scale-95"
              >
                {loading ? 'EXCLUINDO...' : 'SIM, EXCLUIR AGORA'}
              </button>
              <button 
                onClick={() => setIsDeleteModalOpen(false)} 
                className="w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all"
              >
                CANCELAR
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
