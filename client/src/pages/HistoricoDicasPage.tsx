import { useEffect, useState, useMemo } from 'react'
import {
  Search, Filter, Edit2, Trash2, CheckCircle, XCircle, Clock,
  Layers, ListPlus, Target
} from 'lucide-react'
import { tipsService } from '../services/tips.service'
import { formatCurrency as fmt, formatDate as fmtDate } from '../utils/formatters'
import toast from 'react-hot-toast'
import { ModalCriarAposta } from '../components/ui/ModalCriarAposta'
import { ModalCriarMultipla } from '../components/ui/ModalCriarMultipla'
import { Modal } from '../components/ui/Modal'

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface Tip {
  id: string; title: string; description: string; sport: string
  event: string; market: string; odds: number; stake: number
  result?: string; profit?: number; tipDate: string
  mercados?: string[]
  isMultipla?: boolean
  jogos?: any
}

type TipoFiltro = 'TODAS' | 'S' | 'M' | 'C'
type StatusFiltro = 'TODOS' | 'GREEN' | 'RED' | 'VOID' | 'PENDING'

const STATUS_CONFIG: Record<string, any> = {
  GREEN:   { bg: 'bg-emerald-500/10', text: 'text-emerald-500', label: 'Green', icon: <CheckCircle size={14} /> },
  RED:     { bg: 'bg-rose-500/10',    text: 'text-rose-500',    label: 'Red',   icon: <XCircle size={14} /> },
  VOID:    { bg: 'bg-slate-500/10',    text: 'text-slate-500',   label: 'Anulada', icon: <XCircle size={14} /> },
  PENDING: { bg: 'bg-amber-500/10',   text: 'text-amber-500',   label: 'Pendente', icon: <Clock size={14} /> },
}

const TIPO_CONFIG = {
  S: { label: 'Simples', icon: <Target size={14} />, bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20' },
  M: { label: 'Múltipla', icon: <Layers size={14} />, bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
  C: { label: 'Criar Aposta', icon: <ListPlus size={14} />, bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' }
}

export const HistoricoDicasPage = () => {
  const [tips, setTips] = useState<Tip[]>([])
  const [loading, setLoading] = useState(true)

  // Filtros
  const [search, setSearch] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState<TipoFiltro>('TODAS')
  const [statusFiltro, setStatusFiltro] = useState<StatusFiltro>('TODOS')

  // Modais de Edição
  const [isEditSimpleOpen, setIsEditSimpleOpen] = useState(false)
  const [isEditMultiMercadosOpen, setIsEditMultiMercadosOpen] = useState(false)
  const [isEditMultiplaOpen, setIsEditMultiplaOpen] = useState(false)
  const [editingTip, setEditingTip] = useState<Tip | null>(null)

  // Modal de Simples (Para edição)
  const [editDataAposta, setEditDataAposta] = useState('')
  const [editTime, setEditTime] = useState('')
  const [editMercado, setEditMercado] = useState('')
  const [editOdd, setEditOdd] = useState('')
  const [editStake, setEditStake] = useState('')
  const [editResultado, setEditResultado] = useState('PENDING')
  const [editProfit, setEditProfit] = useState('')

  useEffect(() => {
    fetchTips()
  }, [])

  const fetchTips = async () => {
    try {
      setLoading(true)
      const data = await tipsService.getAll(1, 100)
      // Robust extraction covering all possible API response formats
      const ts = Array.isArray(data?.tips) ? data.tips : (Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []));
      setTips(ts)
    } catch {
      toast.error('Erro ao buscar histórico de dicas')
    } finally {
      setLoading(false)
    }
  }

  const getTipo = (tip: Tip): 'S' | 'M' | 'C' => {
    if (tip.isMultipla) return 'M'
    if (tip.mercados && tip.mercados.length > 0) return 'C'
    return 'S'
  }

  const filteredTips = useMemo(() => {
    if (!Array.isArray(tips)) return []
    return tips.filter(tip => {
      const tipo = getTipo(tip)
      const searchMatch = (tip.event || '').toLowerCase().includes(search.toLowerCase()) ||
                          (tip.market || '').toLowerCase().includes(search.toLowerCase())
      const tipoMatch = tipoFiltro === 'TODAS' || tipo === tipoFiltro
      const statusMatch = statusFiltro === 'TODOS' || (tip.result || 'PENDING') === statusFiltro
      return searchMatch && tipoMatch && statusMatch
    }).sort((a, b) => new Date(b.tipDate).getTime() - new Date(a.tipDate).getTime())
  }, [tips, search, tipoFiltro, statusFiltro])

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta dica?')) return
    try {
      await tipsService.delete(id)
      setTips(tips.filter(t => t.id !== id))
      toast.success('Dica excluída')
    } catch {
      toast.error('Erro ao excluir')
    }
  }

  const openEdit = (tip: Tip) => {
    setEditingTip(tip)
    if (tip.isMultipla) {
      setIsEditMultiplaOpen(true)
    } else if (tip.mercados && tip.mercados.length > 0) {
      setIsEditMultiMercadosOpen(true)
    } else {
      // Simples
      setEditDataAposta(new Date(new Date(tip.tipDate).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0,16))
      setEditTime(tip.event)
      setEditMercado(tip.market)
      setEditOdd(tip.odds.toString())
      setEditStake(tip.stake.toString())
      setEditResultado(tip.result || 'PENDING')
      setEditProfit(tip.profit !== null && tip.profit !== undefined ? tip.profit.toString() : '')
      setIsEditSimpleOpen(true)
    }
  }

  const handleUpdateTip = async (data: any, id?: string) => {
    if (!id) return
    try {
      await tipsService.update(id, data)
      await fetchTips()
    } catch (err) {
      console.error(err)
      throw err
    }
  }

  const handleSubmitSimpleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTip) return
    
    try {
      await tipsService.update(editingTip.id, {
        event: editTime,
        title: editTime,
        description: 'Tip Simples Atualizada',
        sport: 'Futebol',
        market: editMercado,
        odds: Number(editOdd),
        stake: Number(editStake),
        tipDate: new Date(editDataAposta).toISOString(),
        result: editResultado,
        profit: editProfit ? Number(editProfit) : null
      })
      toast.success('Dica simples atualizada')
      setIsEditSimpleOpen(false)
      fetchTips()
    } catch {
      toast.error('Erro ao atualizar')
    }
  }



  return (
    <div className="space-y-6">
      
      {/* Header & Filters */}
      <div className="bg-surface-100 p-5 rounded-2xl shadow-sm border border-surface-300">
        <h1 className="text-xl font-display font-black text-white mb-6">Histórico Geral de Dicas</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative col-span-1 md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por jogo ou mercado..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-200 border border-surface-300 text-white text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-green-500 transition-colors"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <select
              value={tipoFiltro}
              onChange={(e) => setTipoFiltro(e.target.value as TipoFiltro)}
              className="w-full bg-surface-200 border border-surface-300 text-white text-sm rounded-xl pl-10 pr-4 py-2.5 appearance-none focus:outline-none focus:border-green-500 transition-colors"
            >
              <option value="TODAS">Tipos: Todos</option>
              <option value="S">Simples</option>
              <option value="C">Criar Aposta (Mercados)</option>
              <option value="M">Múltipla</option>
            </select>
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <select
              value={statusFiltro}
              onChange={(e) => setStatusFiltro(e.target.value as StatusFiltro)}
              className="w-full bg-surface-200 border border-surface-300 text-white text-sm rounded-xl pl-10 pr-4 py-2.5 appearance-none focus:outline-none focus:border-green-500 transition-colors"
            >
              <option value="TODOS">Status: Todos</option>
              <option value="PENDING">Pendentes</option>
              <option value="GREEN">Greens</option>
              <option value="RED">Reds</option>
              <option value="VOID">Anuladas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-surface-100 rounded-2xl border border-surface-300 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-surface-200/50 border-b border-surface-300 text-[10px] uppercase tracking-wider text-slate-400">
                <th className="px-5 py-4 font-bold">Tipo</th>
                <th className="px-5 py-4 font-bold">Data</th>
                <th className="px-5 py-4 font-bold">Evento / Descrição</th>
                <th className="px-5 py-4 font-bold">Odd</th>
                <th className="px-5 py-4 font-bold">Stake</th>
                <th className="px-5 py-4 font-bold">Lucro Líquido</th>
                <th className="px-5 py-4 font-bold">Status</th>
                <th className="px-5 py-4 font-bold text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-300/50">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-slate-400 text-sm">
                    Carregando histórico...
                  </td>
                </tr>
              ) : filteredTips.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-slate-400 text-sm">
                    Nenhuma dica encontrada com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredTips.map((tip) => {
                  const tipo = getTipo(tip)
                  const conf = TIPO_CONFIG[tipo]
                  const status = tip.result || 'PENDING'
                  const statusConf = STATUS_CONFIG[status]

                  return (
                    <tr key={tip.id} className="hover:bg-surface-200/30 transition-colors group">
                      <td className="px-5 py-4">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border ${conf.bg} ${conf.text} ${conf.border} text-[10px] font-bold uppercase tracking-wider`}>
                          {conf.icon}
                          {tipo}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-300 whitespace-nowrap">
                        {fmtDate(tip.tipDate)}
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-bold text-white leading-tight mb-0.5">{tip.event}</p>
                        <p className="text-xs text-slate-400 capitalize max-w-[200px] truncate">{tip.market}</p>
                      </td>
                      <td className="px-5 py-4 text-sm font-bold text-slate-200">
                        {tip.odds.toFixed(2)}
                      </td>
                      <td className="px-5 py-4 text-sm font-medium text-slate-300">
                        {fmt(tip.stake)}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-sm font-bold ${
                          status === 'GREEN' ? 'text-emerald-400' :
                          status === 'RED' ? 'text-rose-400' :
                          'text-slate-400'
                        }`}>
                          {status === 'GREEN' && tip.profit ? `+ ${fmt(tip.profit)}` :
                           status === 'RED' ? `- ${fmt(tip.stake)}` :
                           '---'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md ${statusConf.bg} ${statusConf.text} text-[10px] font-bold uppercase tracking-wider`}>
                          {statusConf.icon}
                          {statusConf.label}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEdit(tip)}
                            className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-cyan-400/10 rounded-lg transition-colors"
                            title="Editar Bilhete"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(tip.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-colors"
                            title="Excluir Bilhete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
          
          {/* Pagination block placeholder */}
          {!loading && filteredTips.length > 0 && (
            <div className="px-5 py-4 border-t border-surface-300 flex items-center justify-between text-xs text-slate-400">
              <span>Mostrando <strong className="text-white">{filteredTips.length}</strong> {filteredTips.length === 1 ? 'resultado' : 'resultados'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Modals para Edição */}
      <ModalCriarMultipla 
        isOpen={isEditMultiplaOpen} 
        onClose={() => setIsEditMultiplaOpen(false)} 
        onSave={handleUpdateTip} 
        initialData={editingTip} 
      />
      <ModalCriarAposta 
        isOpen={isEditMultiMercadosOpen} 
        onClose={() => setIsEditMultiMercadosOpen(false)} 
        onSave={handleUpdateTip} 
        initialData={editingTip} 
      />

      {/* Modal Edição Simples */}
      <Modal isOpen={isEditSimpleOpen} onClose={() => setIsEditSimpleOpen(false)} title="Editar Dica Simples">
        <form onSubmit={handleSubmitSimpleEdit} className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Data/Hora</label>
              <input type="datetime-local" value={editDataAposta} onChange={e => setEditDataAposta(e.target.value)} className="input-field py-2 px-3 w-full" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Evento/Jogo</label>
              <input type="text" value={editTime} onChange={e => setEditTime(e.target.value)} placeholder="Ex: Flamengo x Vasco" className="input-field py-2 px-3 w-full" required />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Stake (R$)</label>
              <input type="number" step="0.01" value={editStake} onChange={e => setEditStake(e.target.value)} className="input-field py-2 px-3 w-full" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Odd</label>
              <input type="number" step="0.01" value={editOdd} onChange={e => setEditOdd(e.target.value)} className="input-field py-2 px-3 w-full" required />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Mercado</label>
            <input type="text" value={editMercado} onChange={e => setEditMercado(e.target.value)} placeholder="Ex: Vitória Mandante" className="input-field py-2 px-3 w-full" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Resultado</label>
              <select value={editResultado} onChange={e => setEditResultado(e.target.value)} className="input-field py-2 px-3 w-full text-white bg-surface-200">
                <option value="PENDING">Pendente</option>
                <option value="GREEN">Green</option>
                <option value="RED">Red</option>
                <option value="VOID">Anulada</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Lucro (Opcional)</label>
              <input type="number" step="0.01" value={editProfit} onChange={e => setEditProfit(e.target.value)} placeholder="Ex: 50.00" className="input-field py-2 px-3 w-full" />
            </div>
          </div>

          <button type="submit" className="w-full btn-primary py-2.5">
            Salvar Alterações
          </button>
        </form>
      </Modal>

    </div>
  )
}
