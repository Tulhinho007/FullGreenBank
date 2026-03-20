import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Search, Clock, Edit2, Trash2 } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'
import { formatCurrency } from '../utils/formatters'

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
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('TODOS')
  const [dataFilter, setDataFilter] = useState('')

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedSolicitacao, setSelectedSolicitacao] = useState<Solicitacao | null>(null)
  const [editValor, setEditValor] = useState('')
  const [editObservacoes, setEditObservacoes] = useState('')

  const fetchSolicitacoes = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/solicitacoes')
      setSolicitacoes(data)
    } catch {
      toast.error('Erro ao carregar solicitações')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSolicitacoes()
  }, [])

  const handleUpdateStatus = async (id: string, novoStatus: 'ACEITO' | 'RECUSADO') => {
    try {
      await api.patch(`/solicitacoes/${id}/status`, { status: novoStatus })
      toast.success(`Solicitação ${novoStatus.toLowerCase()}!`)
      setSolicitacoes(prev => prev.map(s => s.id === id ? { ...s, status: novoStatus } : s))
    } catch {
      toast.error('Erro ao atualizar status da solicitação')
    }
  }

  const filteredData = solicitacoes.filter(s => {
    const matchesSearch = s.usuario.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.usuario.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'TODOS' || s.status === statusFilter
    const matchesDate = !dataFilter || s.dataPedido.startsWith(dataFilter)
    
    return matchesSearch && matchesStatus && matchesDate
  })

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

  const getStatusBadge = (status: string) => {
    if (status === 'ACEITO') return <span className="px-2 py-0.5 rounded text-xs bg-green-500/20 text-green-400 border border-green-500/30 flex items-center gap-1 w-max"><CheckCircle size={12}/> Aceito</span>
    if (status === 'RECUSADO') return <span className="px-2 py-0.5 rounded text-xs bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1 w-max"><XCircle size={12}/> Recusado</span>
    return <span className="px-2 py-0.5 rounded text-xs bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 flex items-center gap-1 w-max"><Clock size={12}/> Em Análise</span>
  }

  return (
    <div className="flex flex-col gap-6 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-semibold text-white">Solicitações de Adesão</h2>
          <p className="text-xs text-slate-500 mt-0.5">Gerenciamento de aportes em Banca Gerenciada</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 relative w-full sm:w-auto mt-4 sm:mt-0">
          <div className="relative w-full sm:w-auto">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              placeholder="Buscar usuário..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="input-field pl-9 py-2 text-sm w-full sm:w-64 bg-surface-200"
            />
          </div>
          <input 
            type="date" 
            title="Filtrar por data"
            value={dataFilter}
            onChange={(e) => setDataFilter(e.target.value)}
            className="input-field py-2 px-3 text-sm bg-surface-200 w-full sm:w-auto"
          />
          <select 
            title="Filtrar por status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field py-2 px-3 text-sm bg-surface-200 w-full sm:w-auto sm:min-w-[140px]"
          >
            <option value="TODOS">Todos os Status</option>
            <option value="EM_ANALISE">Em Análise</option>
            <option value="ACEITO">Aceito</option>
            <option value="RECUSADO">Recusado</option>
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-100/50 border-b border-surface-300 text-xs text-slate-400 uppercase tracking-wider">
                <th className="px-5 py-4 font-semibold">Usuário</th>
                <th className="px-5 py-4 font-semibold">Data do Pedido</th>
                <th className="px-5 py-4 font-semibold">Valor do Aporte</th>
                <th className="px-5 py-4 font-semibold">Status</th>
                <th className="px-5 py-4 font-semibold">Observações</th>
                <th className="px-5 py-4 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200/50">
              {loading ? (
                <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-500 text-sm">Carregando solicitações...</td></tr>
              ) : filteredData.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-500 text-sm">Nenhuma solicitação encontrada.</td></tr>
              ) : (
                filteredData.map(s => (
                  <tr key={s.id} className="hover:bg-surface-200/20 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-white">{s.usuario.name}</span>
                        <span className="text-xs text-slate-500">{s.usuario.email}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-400">
                      {new Date(s.dataPedido).toLocaleDateString('pt-BR')} às {new Date(s.dataPedido).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                    </td>
                    <td className="px-5 py-3 text-sm font-bold text-white font-mono">
                      {formatCurrency(s.valorAporte)}
                    </td>
                    <td className="px-5 py-3">
                      {getStatusBadge(s.status)}
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-400 max-w-[200px] truncate" title={s.observacoes || '-'}>
                      {s.observacoes || '-'}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {s.status === 'EM_ANALISE' && (
                          <>
                            <button onClick={() => handleUpdateStatus(s.id, 'ACEITO')} className="p-1.5 text-green-500 hover:bg-green-500/10 rounded-lg transition-colors border border-transparent hover:border-green-500/20" title="Aceitar">
                              <CheckCircle size={16} />
                            </button>
                            <button onClick={() => handleUpdateStatus(s.id, 'RECUSADO')} className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20" title="Recusar">
                              <XCircle size={16} />
                            </button>
                          </>
                        )}
                        <button onClick={() => openEditModal(s)} className="p-1.5 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors border border-transparent hover:border-blue-400/20" title="Editar">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => openDeleteModal(s)} className="p-1.5 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors border border-transparent hover:border-red-400/20" title="Excluir">
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

      {/* Modal de Edição */}
      {isEditModalOpen && selectedSolicitacao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-100 border border-surface-300 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-surface-300 flex justify-between items-center">
              <h3 className="font-display font-bold text-white flex items-center gap-2">
                <Edit2 size={18} className="text-blue-400" />
                Editar Solicitação
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <XCircle size={20} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Usuário</label>
                <input type="text" value={selectedSolicitacao.usuario.name} disabled className="input-field py-2.5 px-3 w-full opacity-50 cursor-not-allowed bg-surface-200" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Valor do Aporte</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">R$</span>
                  <input type="number" step="0.01" value={editValor} onChange={(e) => setEditValor(e.target.value)} className="input-field py-2.5 pl-9 pr-3 w-full bg-surface-200" required />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Observações</label>
                <textarea 
                  value={editObservacoes} 
                  onChange={(e) => setEditObservacoes(e.target.value)} 
                  placeholder="Ex: Usuário solicitou alterar o valor..."
                  className="input-field py-2.5 px-3 w-full h-24 resize-none bg-surface-200" 
                />
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className="btn-primary py-2 px-6">
                  {loading ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Exclusão */}
      {isDeleteModalOpen && selectedSolicitacao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-100 border border-surface-300 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="p-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                <Trash2 size={24} className="text-red-500" />
              </div>
              <h3 className="font-display font-bold text-lg text-white mb-2">Excluir Solicitação?</h3>
              <p className="text-sm text-slate-400 mb-6">
                Tem certeza que deseja excluir a solicitação de <strong>{selectedSolicitacao.usuario.name}</strong> no valor de <strong>{formatCurrency(selectedSolicitacao.valorAporte)}</strong>? Esta ação não pode ser desfeita.
              </p>
              <div className="flex gap-3 w-full">
                <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-2.5 rounded-xl font-bold bg-surface-200 text-white hover:bg-surface-300 transition-colors">
                  Cancelar
                </button>
                <button onClick={handleDelete} disabled={loading} className="flex-1 py-2.5 rounded-xl font-bold bg-red-600 text-white hover:bg-red-500 transition-colors shadow-lg shadow-red-900/20">
                  {loading ? 'Excluindo...' : 'Excluir'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
