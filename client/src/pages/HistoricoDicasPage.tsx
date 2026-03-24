import { useEffect, useState, useMemo } from 'react'
import {
  Search, Filter, Edit2, Trash2, CheckCircle, XCircle, Clock,
  Layers, ListPlus, Target, Calendar, DollarSign
} from 'lucide-react'
import { tipsService } from '../services/tips.service'
import { formatCurrency as fmt, formatDate as fmtDate } from '../utils/formatters'
import toast from 'react-hot-toast'
import { CurrencyInput } from '../components/ui/CurrencyInput'
import { ModalCriarAposta } from '../components/ui/ModalCriarAposta'
import { ModalCriarMultipla } from '../components/ui/ModalCriarMultipla'
import { Modal } from '../components/ui/Modal'

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface Tip {
  id: string; title: string; description: string; sport: string
  event: string; market: string; odds: number; stake: number
  result?: string; profit?: number; valorCashout?: number; tipDate: string
  mercados?: string[]
  isMultipla?: boolean
  jogos?: any
}

type TipoFiltro = 'TODAS' | 'S' | 'M' | 'C'
type StatusFiltro = 'TODOS' | 'GREEN' | 'RED' | 'VOID' | 'PENDING' | 'CASHOUT'

const STATUS_CONFIG: Record<string, any> = {
  GREEN:   { bg: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-600', label: 'Green', icon: <CheckCircle size={14} /> },
  RED:     { bg: 'bg-rose-50 border-rose-100',    text: 'text-rose-600',    label: 'Red',   icon: <XCircle size={14} /> },
  VOID:    { bg: 'bg-slate-50 border-slate-100',    text: 'text-slate-400',   label: 'Anulada', icon: <XCircle size={14} /> },
  PENDING: { bg: 'bg-amber-50 border-amber-100',   text: 'text-amber-600',   label: 'Pendente', icon: <Clock size={14} /> },
  CASHOUT: { bg: 'bg-sky-50 border-sky-100',  text: 'text-sky-600',  label: 'Cashout',  icon: <DollarSign size={14} /> },
}

const TIPO_CONFIG = {
  S: { label: 'Simples', icon: <Target size={14} />, bg: 'bg-slate-50 border-slate-100', text: 'text-slate-500', border: 'border-slate-100' },
  M: { label: 'Múltipla', icon: <Layers size={14} />, bg: 'bg-purple-50 border-purple-100', text: 'text-purple-600', border: 'border-purple-100' },
  C: { label: 'Criar Aposta', icon: <ListPlus size={14} />, bg: 'bg-cyan-50 border-cyan-100', text: 'text-cyan-600', border: 'border-cyan-100' }
}

export const HistoricoDicasPage = () => {
  const [tips, setTips] = useState<Tip[]>([])
  const [loading, setLoading] = useState(true)

  // Filtros
  const [search, setSearch] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState<TipoFiltro>('TODAS')
  const [statusFiltro, setStatusFiltro] = useState<StatusFiltro>('TODOS')
  const [dateFilter, setDateFilter] = useState('')

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
      
      const tipDateObj = new Date(tip.tipDate)
      const tipDateStr = `${tipDateObj.getFullYear()}-${String(tipDateObj.getMonth() + 1).padStart(2, '0')}-${String(tipDateObj.getDate()).padStart(2, '0')}`
      const dateMatch = !dateFilter || tipDateStr === dateFilter
      
      return searchMatch && tipoMatch && statusMatch && dateMatch
    }).sort((a, b) => new Date(b.tipDate).getTime() - new Date(a.tipDate).getTime())
  }, [tips, search, tipoFiltro, statusFiltro, dateFilter])

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
        title: editTime,
        event: editTime,
        market: editMercado,
        odds: Number(editOdd),
        stake: Number(editStake),
        result: editResultado,
        profit: Number(editProfit),
        tipDate: new Date(editDataAposta).toISOString(),
        valorCashout: editResultado === 'CASHOUT' ? Number(editProfit) : null
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
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-8">Histórico Geral de Dicas</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input
              type="text"
              placeholder="Buscar por jogo ou mercado..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 text-slate-800 text-sm font-bold rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder-slate-300"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <select
              value={tipoFiltro}
              onChange={(e) => setTipoFiltro(e.target.value as TipoFiltro)}
              className="w-full bg-slate-50 border border-slate-100 text-slate-800 text-sm font-bold rounded-xl pl-10 pr-4 py-2.5 appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer"
            >
              <option value="TODAS">Tipos: Todos</option>
              <option value="S">Simples</option>
              <option value="C">Criar Aposta</option>
              <option value="M">Múltipla</option>
            </select>
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <select
              value={statusFiltro}
              onChange={(e) => setStatusFiltro(e.target.value as StatusFiltro)}
              className="w-full bg-slate-50 border border-slate-100 text-slate-800 text-sm font-bold rounded-xl pl-10 pr-4 py-2.5 appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer"
            >
              <option value="TODOS">Status: Todos</option>
              <option value="PENDING">Pendentes</option>
              <option value="GREEN">Greens</option>
              <option value="RED">Reds</option>
              <option value="VOID">Anuladas</option>
              <option value="CASHOUT">Cashouts</option>
            </select>
          </div>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 text-slate-800 text-sm font-bold rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <th className="px-8 py-5">Tipo</th>
                <th className="px-8 py-5">Data</th>
                <th className="px-8 py-5">Evento / Descrição</th>
                <th className="px-8 py-5">Odd</th>
                <th className="px-8 py-5">VALOR</th>
                <th className="px-8 py-5">Lucro Líquido</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5 text-center">Ações</th>
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
                    <tr key={tip.id} className="hover:bg-slate-50/50 transition-all group">
                      <td className="px-8 py-5">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${conf.bg} ${conf.text} ${conf.border} text-[9px] font-black uppercase tracking-widest shadow-sm`}>
                          {conf.icon}
                          {tipo}
                        </div>
                      </td>
                      <td className="px-8 py-5 text-xs text-slate-400 font-bold whitespace-nowrap">
                        {fmtDate(tip.tipDate)}
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-sm font-black text-slate-800 tracking-tight leading-tight mb-0.5">{tip.event}</p>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest truncate max-w-[200px]">{tip.market}</p>
                      </td>
                      <td className="px-8 py-5 text-sm font-black text-slate-800">
                        {tip.odds.toFixed(2)}
                      </td>
                      <td className="px-8 py-5 text-sm font-bold text-slate-400">
                        {fmt(tip.stake)}
                      </td>
                      <td className="px-8 py-5">
                        <span className={`text-sm font-black ${
                          status === 'GREEN' ? 'text-emerald-600' :
                          status === 'RED' ? 'text-rose-600' :
                          'text-slate-400'
                        }`}>
                          {status === 'GREEN' && tip.profit ? `+ ${fmt(tip.profit)}` :
                           status === 'RED' ? `- ${fmt(tip.stake)}` :
                           '---'}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${statusConf.bg} ${statusConf.text} ${statusConf.bg.replace('bg-', 'border-')} text-[9px] font-black uppercase tracking-widest shadow-sm`}>
                          {statusConf.icon}
                          {statusConf.label}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEdit(tip)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                            title="Editar Bilhete"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(tip.id)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
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
            <div className="px-8 py-5 border-t border-slate-50 bg-slate-50/30 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total de <strong className="text-emerald-600">{filteredTips.length}</strong> {filteredTips.length === 1 ? 'registro' : 'registros'}</span>
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
              <CurrencyInput
                value={editStake ? Number(editStake) : 0}
                onChange={(v) => setEditStake(String(v))}
                alertLimit={1000}
                className="py-2 px-3 w-full"
              />
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
                <option value="CASHOUT">Cashout</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                {editResultado === 'CASHOUT' ? 'Recebido' : 'Lucro (Opcional)'}
              </label>
              <CurrencyInput
                value={editProfit ? Number(editProfit) : 0}
                onChange={(v) => setEditProfit(String(v))}
                alertLimit={1000}
                className="py-2 px-3 w-full"
              />
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
