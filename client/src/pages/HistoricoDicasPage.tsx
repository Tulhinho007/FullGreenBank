import { useEffect, useState, useMemo } from 'react'
import {
  Search, Filter, Edit2, Trash2, CheckCircle, XCircle, Clock,
  Layers, ListPlus, Target, Calendar, DollarSign, X, Hash, Link as LinkIcon, MinusCircle, Wallet, TrendingUp, TrendingDown
} from 'lucide-react'
import { tipsService } from '../services/tips.service'
import { formatCurrency as fmt, formatDate as fmtDate } from '../utils/formatters'
import toast from 'react-hot-toast'
import { SportSelect } from '../components/ui/SportSelect'

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface Tip {
  id: string; title: string; description: string; sport: string
  event: string; market: string; odds: number; stake: number
  result?: string; profit?: number; valorCashout?: number; tipDate: string
  linkAposta?: string
  sportsList?: string[]
  isPublic: boolean
}

type TipoFiltro = 'TODAS' | 'S' | 'M' | 'C'
type StatusFiltro = 'TODOS' | 'GREEN' | 'RED' | 'VOID' | 'PENDING' | 'CASHOUT'

const STATUS_CONFIG: Record<string, any> = {
  GREEN:   { bg: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-600', label: 'Green', icon: <CheckCircle size={14} />, headerBg: 'from-emerald-500 to-emerald-600', headerText: 'text-emerald-100' },
  RED:     { bg: 'bg-rose-50 border-rose-100',    text: 'text-rose-600',    label: 'Red',   icon: <XCircle size={14} />, headerBg: 'from-rose-500 to-rose-600', headerText: 'text-rose-100' },
  VOID:    { bg: 'bg-slate-50 border-slate-100',    text: 'text-slate-400',   label: 'Anulada', icon: <XCircle size={14} />, headerBg: 'from-slate-400 to-slate-500', headerText: 'text-slate-100' },
  PENDING: { bg: 'bg-amber-50 border-amber-100',   text: 'text-amber-600',   label: 'Pendente', icon: <Clock size={14} />, headerBg: 'from-amber-400 to-amber-500', headerText: 'text-amber-100' },
  CASHOUT: { bg: 'bg-sky-50 border-sky-100',  text: 'text-sky-600',  label: 'Cashout',  icon: <DollarSign size={14} />, headerBg: 'from-sky-400 to-sky-500', headerText: 'text-sky-100' },
}

const TIPO_CONFIG = {
  S: { label: 'Simples', icon: <Target size={14} />, bg: 'bg-slate-50 border-slate-100', text: 'text-slate-500', border: 'border-slate-100' },
  M: { label: 'Múltipla', icon: <Layers size={14} />, bg: 'bg-purple-50 border-purple-100', text: 'text-purple-600', border: 'border-purple-100' },
  C: { label: 'Criar Aposta', icon: <ListPlus size={14} />, bg: 'bg-cyan-50 border-cyan-100', text: 'text-cyan-600', border: 'border-cyan-100' }
}

const formField = 'w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all placeholder:text-slate-300'
const formLabel = 'block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5'

const ModalHeader = ({ status, title, onClose }: { status: string; title: string; onClose: () => void }) => {
  const c = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING
  return (
    <div className={`bg-gradient-to-r ${c.headerBg} flex items-center justify-between px-6 py-4 rounded-t-2xl`}>
      <div className="flex items-center gap-2">
        <span className={`${c.headerText} opacity-80`}>{c.icon}</span>
        <h2 className="text-white font-black text-sm tracking-wide">{title}</h2>
        <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-white/20 text-white`}>{c.label}</span>
      </div>
      <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
        <X size={18} />
      </button>
    </div>
  )
}

interface BetFormState {
  tipDate: string
  linkAposta: string
  tipoAposta: string
  qtdEsportes: string
  sportsList: string[]
  odds: string
  stake: string
  status: string
  isPublic: boolean
}

export const HistoricoDicasPage = () => {
  const [tips, setTips] = useState<Tip[]>([])
  const [loading, setLoading] = useState(true)

  // Filtros
  const [search, setSearch] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState<TipoFiltro>('TODAS')
  const [statusFiltro, setStatusFiltro] = useState<StatusFiltro>('TODOS')
  const [dateFilter, setDateFilter] = useState('')

  // Edição
  const [editingTip, setEditingTip] = useState<Tip | null>(null)
  const [editForm, setEditForm] = useState<BetFormState>({
    tipDate: '', linkAposta: '', tipoAposta: 'Simples', qtdEsportes: '', sportsList: [], odds: '', stake: '', status: 'PENDING', isPublic: true
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchTips()
  }, [])

  const fetchTips = async () => {
    try {
      setLoading(true)
      const data = await tipsService.getAll(1, 100)
      const ts = Array.isArray(data?.tips) ? data.tips : (Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []));
      setTips(ts)
    } catch {
      toast.error('Erro ao buscar histórico de dicas')
    } finally {
      setLoading(false)
    }
  }

  const getTipo = (tip: Tip): 'S' | 'M' | 'C' => {
    if (tip.event === 'Múltipla') return 'M'
    if (tip.event === 'Criar Aposta') return 'C'
    return 'S'
  }

  const filteredTips = useMemo(() => {
    if (!Array.isArray(tips)) return []
    return tips.filter(tip => {
      const tipo = getTipo(tip)
      const searchMatch = (tip.sport || '').toLowerCase().includes(search.toLowerCase()) ||
                          (tip.title || '').toLowerCase().includes(search.toLowerCase())
      const tipoMatch = tipoFiltro === 'TODAS' || tipo === tipoFiltro
      const statusMatch = statusFiltro === 'TODOS' || (tip.result || 'PENDING') === statusFiltro
      
      const tipDateObj = new Date(tip.tipDate)
      const tipDateStr = `${tipDateObj.getFullYear()}-${String(tipDateObj.getMonth() + 1).padStart(2, '0')}-${String(tipDateObj.getDate()).padStart(2, '0')}`
      const dateMatch = !dateFilter || tipDateStr === dateFilter
      
      return searchMatch && tipoMatch && statusMatch && dateMatch
    }).sort((a, b) => new Date(b.tipDate).getTime() - new Date(a.tipDate).getTime())
  }, [tips, search, tipoFiltro, statusFiltro, dateFilter])

  const kpis = useMemo(() => {
    let greens = 0
    let reds = 0
    let voids = 0
    let cashouts = 0
    let valProfit = 0
    
    filteredTips.forEach(tip => {
      const res = tip.result || 'PENDING'
      if (res === 'GREEN') greens++
      if (res === 'RED') reds++
      if (res === 'VOID') voids++
      if (res === 'CASHOUT') cashouts++
      
      if (typeof tip.profit === 'number') {
        valProfit += tip.profit
      }
    })
    
    return { greens, reds, voids, cashouts, valProfit }
  }, [filteredTips])

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
    const datePart = new Date(tip.tipDate).toISOString().slice(0, 10)
    setEditForm({
      tipDate: datePart,
      linkAposta: tip.linkAposta || '',
      tipoAposta: tip.market || 'Simples',
      qtdEsportes: tip.sport ? '1' : '',
      sportsList: tip.sport ? [tip.sport] : [],
      odds: tip.odds?.toString() ?? '',
      stake: tip.stake?.toString() ?? '',
      status: tip.result || 'PENDING',
      isPublic: tip.isPublic ?? true
    })
  }

  const handleUpdateTip = async () => {
    if (!editingTip) return
    setSaving(true)
    try {
      const sport = editForm.sportsList[0] || editingTip.sport || 'Futebol'
      
      const stakeNum = editForm.stake ? Number(editForm.stake) : (editingTip.stake ? Number(editingTip.stake) : 0)
      const oddsNum = editForm.odds ? Number(editForm.odds) : (editingTip.odds ? Number(editingTip.odds) : 1)
      let profit: number | undefined = undefined

      if (editForm.status === 'GREEN') {
        profit = stakeNum * (oddsNum - 1)
      } else if (editForm.status === 'RED') {
        profit = -stakeNum
      } else if (['VOID', 'CASHOUT'].includes(editForm.status)) {
        profit = 0
      }

      await tipsService.update(editingTip.id, {
        title: editForm.tipoAposta ? `${editForm.tipoAposta} — ${fmtDate(editForm.tipDate)}` : editingTip.title,
        event: editForm.tipoAposta || editingTip.event,
        market: editForm.tipoAposta || editingTip.market,
        odds: oddsNum,
        stake: stakeNum,
        result: editForm.status,
        profit,
        tipDate: new Date(editForm.tipDate + 'T12:00:00').toISOString(),
        sport,
        description: editForm.tipoAposta || editingTip.description,
        linkAposta: editForm.linkAposta?.trim() || null,
      })
      toast.success('Dica atualizada!')
      setEditingTip(null)
      fetchTips()
    } catch {
      toast.error('Erro ao atualizar')
    } finally {
      setSaving(false)
    }
  }

  const updateQtdEsportes = (form: BetFormState, qty: string): BetFormState => {
    const n = Math.max(0, Math.min(20, Number(qty) || 0))
    const prev = form.sportsList
    const next = Array.from({ length: n }, (_, i) => prev[i] ?? '')
    return { ...form, qtdEsportes: qty, sportsList: next }
  }

  const updateSportAt = (form: BetFormState, idx: number, val: string): BetFormState => {
    const list = [...form.sportsList]
    list[idx] = val
    return { ...form, sportsList: list }
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
              placeholder="Buscar por esporte ou título..."
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

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* GREEN */}
        <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm hover:shadow-md transition-all group">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 rounded-[1.25rem] bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform border border-emerald-100">
              <CheckCircle size={24} />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Greens</span>
          </div>
          <h3 className="text-3xl font-black text-slate-800 tracking-tight">{kpis.greens}</h3>
          <p className="text-[10px] font-bold text-emerald-600/60 uppercase tracking-wider mt-1">Apostas ganhas</p>
        </div>
        
        {/* RED */}
        <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm hover:shadow-md transition-all group">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 rounded-[1.25rem] bg-rose-50 flex items-center justify-center text-rose-600 group-hover:scale-110 transition-transform border border-rose-100">
              <XCircle size={24} />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reds</span>
          </div>
          <h3 className="text-3xl font-black text-slate-800 tracking-tight">{kpis.reds}</h3>
          <p className="text-[10px] font-bold text-rose-600/60 uppercase tracking-wider mt-1">Apostas perdidas</p>
        </div>
        
        {/* VOID */}
        <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm hover:shadow-md transition-all group">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 rounded-[1.25rem] bg-slate-50 flex items-center justify-center text-slate-400 group-hover:scale-110 transition-transform border border-slate-100">
              <MinusCircle size={24} />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Anuladas</span>
          </div>
          <h3 className="text-3xl font-black text-slate-800 tracking-tight">{kpis.voids}</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Devoluções (Void)</p>
        </div>
        
        {/* CASHOUT */}
        <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm hover:shadow-md transition-all group">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 rounded-[1.25rem] bg-sky-50 flex items-center justify-center text-sky-600 group-hover:scale-110 transition-transform border border-sky-100">
              <Wallet size={24} />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cash Out</span>
          </div>
          <h3 className="text-3xl font-black text-slate-800 tracking-tight">{kpis.cashouts}</h3>
          <p className="text-[10px] font-bold text-sky-600/60 uppercase tracking-wider mt-1">Encerradas antes</p>
        </div>

        {/* LUCRO / PREJUÍZO TOTAL */}
        <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm hover:shadow-md transition-all group">
          <div className="flex justify-between items-start mb-6">
            <div className={`w-12 h-12 rounded-[1.25rem] flex items-center justify-center group-hover:scale-110 transition-transform border ${
              kpis.valProfit >= 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
            }`}>
              {kpis.valProfit >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resultado</span>
          </div>
          <h3 className={`text-2xl font-black tracking-tight ${kpis.valProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {fmt(kpis.valProfit)}
          </h3>
          <p className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${kpis.valProfit >= 0 ? 'text-emerald-600/60' : 'text-rose-600/60'}`}>
            {kpis.valProfit >= 0 ? 'Lucro Acumulado' : 'Prejuízo Acumulado'}
          </p>
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
                <th className="px-8 py-5">Título / Esporte</th>
                <th className="px-8 py-5">Odd</th>
                <th className="px-8 py-5">Stake</th>
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
                          {conf.label}
                        </div>
                      </td>
                      <td className="px-8 py-5 text-xs text-slate-400 font-bold whitespace-nowrap">
                        {fmtDate(tip.tipDate)}
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-sm font-black text-slate-800 tracking-tight leading-tight mb-0.5">{tip.title}</p>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest truncate max-w-[200px]">{tip.sport}</p>
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
                          {tip.linkAposta && (
                            <a
                              href={tip.linkAposta}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Ver Bilhete"
                            >
                              <LinkIcon size={16} />
                            </a>
                          )}
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

      {/* ── EDITAR DICA MODAL ──────────────────────────────────────────── */}
      {editingTip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-[6px]">
          <div className="nm-modal w-full max-w-lg overflow-hidden rounded-[2.5rem] border-none">
            <ModalHeader status={editForm.status} title="Editar Dica" onClose={() => setEditingTip(null)} />
            <div className="p-6 flex flex-col gap-4 max-h-[80vh] overflow-y-auto">

              {/* Data */}
              <div>
                <label className={formLabel}><Calendar size={10} className="inline mr-1" />Data</label>
                <input
                  type="date"
                  className={formField}
                  value={editForm.tipDate}
                  onChange={e => setEditForm(f => ({ ...f, tipDate: e.target.value }))}
                />
              </div>

              {/* Link de Aposta */}
              <div>
                <label className={formLabel}><LinkIcon size={10} className="inline mr-1" />Link de Aposta</label>
                <input
                  type="url"
                  className={formField}
                  placeholder="https://..."
                  value={editForm.linkAposta}
                  onChange={e => setEditForm(f => ({ ...f, linkAposta: e.target.value }))}
                />
              </div>

              {/* Tipo de Aposta */}
              <div>
                <label className={formLabel}>Tipo de Aposta</label>
                <select
                  className={formField}
                  value={editForm.tipoAposta}
                  onChange={e => setEditForm(f => ({ ...f, tipoAposta: e.target.value }))}
                >
                  <option value="Simples">Simples</option>
                  <option value="Múltipla">Múltipla</option>
                  <option value="Criar Aposta">Criar Aposta</option>
                </select>
              </div>

              {/* Quantidade de Esportes */}
              <div>
                <label className={formLabel}><Hash size={10} className="inline mr-1" />Quantidade de Esportes</label>
                <input
                  type="number"
                  min="0" max="20"
                  className={formField}
                  placeholder="Ex: 2"
                  value={editForm.qtdEsportes}
                  onChange={e => setEditForm(f => updateQtdEsportes(f, e.target.value))}
                />
              </div>

              {/* Dynamic Sport Selects */}
              {editForm.sportsList.length > 0 && (
                <div className="flex flex-col gap-2 pl-3 border-l-2 border-emerald-200">
                  {editForm.sportsList.map((sp, idx) => (
                    <div key={idx}>
                      <label className={formLabel}>Esporte {idx + 1}</label>
                      <SportSelect
                        value={sp}
                        onChange={v => setEditForm(f => updateSportAt(f, idx, v))}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Odd + Stake */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={formLabel}>Odd</label>
                  <input
                    type="number" step="0.01" min="1"
                    className={formField}
                    placeholder="Ex: 1.85"
                    value={editForm.odds}
                    onChange={e => setEditForm(f => ({ ...f, odds: e.target.value }))}
                  />
                </div>
                <div>
                  <label className={formLabel}>Stake (R$)</label>
                  <input
                    type="number" step="0.5" min="0"
                    className={formField}
                    placeholder="Ex: 50"
                    value={editForm.stake}
                    onChange={e => setEditForm(f => ({ ...f, stake: e.target.value }))}
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className={formLabel}>Status</label>
                <select
                  className={formField}
                  value={editForm.status}
                  onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
                >
                  <option value="PENDING">— Pendente —</option>
                  <option value="GREEN">✅ Green</option>
                  <option value="RED">❌ Red</option>
                  <option value="CASHOUT">🟠 Cash Out</option>
                  <option value="VOID">⚪ Anulado</option>
                </select>
              </div>

              {/* Visibilidade */}
              <div className="flex items-center gap-2 px-1">
                <input
                  type="checkbox"
                  id="isPublicEdit"
                  className="w-4 h-4 text-emerald-600 bg-slate-50 border-slate-200 rounded focus:ring-emerald-500"
                  checked={editForm.isPublic}
                  onChange={e => setEditForm(f => ({ ...f, isPublic: e.target.checked }))}
                />
                <label htmlFor="isPublicEdit" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer">
                  Dica Pública (Feed)
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2 border-t border-slate-100">
                <button onClick={() => setEditingTip(null)} className="btn-secondary flex-1">Cancelar</button>
                <button
                  onClick={handleUpdateTip}
                  disabled={saving}
                  className="btn-primary flex-1"
                >
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
