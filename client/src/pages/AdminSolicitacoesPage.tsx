import { useState, useEffect } from 'react'
import { FileText, CheckCircle, XCircle, Search, Clock } from 'lucide-react'
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
}

export const AdminSolicitacoesPage = () => {
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

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

  const filteredData = solicitacoes.filter(s => 
    s.usuario.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.usuario.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input 
            type="text" 
            placeholder="Buscar usuário..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="input-field pl-9 py-2 text-sm w-64 bg-surface-200"
          />
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
                    <td className="px-5 py-3 text-right">
                      {s.status === 'EM_ANALISE' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleUpdateStatus(s.id, 'ACEITO')} className="p-1.5 text-green-500 hover:bg-green-500/10 rounded-lg transition-colors border border-transparent hover:border-green-500/20" title="Aceitar">
                            <CheckCircle size={16} />
                          </button>
                          <button onClick={() => handleUpdateStatus(s.id, 'RECUSADO')} className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20" title="Recusar">
                            <XCircle size={16} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 italic block">Processado</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
