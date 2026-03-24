import { useEffect, useState, useMemo } from 'react'
import {
  TrendingUp, Target, Clock, CheckCircle, XCircle,
  Plus, X, Edit2, Trash2, Info, Share2, Ban, DollarSign, ChevronDown
} from 'lucide-react'
import { Modal } from '../components/ui/Modal'
import { formatCurrency as fmt, formatDate as fmtDate } from '../utils/formatters'
import { tipsService } from '../services/tips.service'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import { ShareTipModal } from '../components/ui/ShareTipModal'
import { ModalCriarAposta } from '../components/ui/ModalCriarAposta'
import { ModalCriarMultipla } from '../components/ui/ModalCriarMultipla'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import { CurrencyInput } from '../components/ui/CurrencyInput'
import { ModalMultiplaCriarAposta } from '../components/ui/ModalMultiplaCriarAposta'
import { SportSelect } from '../components/ui/SportSelect'
import { addLog } from '../services/log.service'

ChartJS.register(ArcElement, Tooltip, Legend)

interface Tip {
  id: string; title: string; description: string; sport: string
  event: string; market: string; odds: number; stake: number
  result?: string; profit?: number; valorCashout?: number; tipDate: string
  mercados?: string[]
  isMultipla?: boolean
  jogos?: any
  linkAposta?: string
}

type ResultFilter = 'Todos' | 'GREEN' | 'RED' | 'VOID' | 'PENDING' | 'CASHOUT'

const FILTERS: ResultFilter[] = ['Todos', 'PENDING', 'GREEN', 'RED', 'VOID', 'CASHOUT']
const FILTER_LABELS: Record<ResultFilter, string> = {
  Todos: 'Todas', PENDING: '⏳ Pendentes', GREEN: '✅ Greens', RED: '❌ Reds', VOID: '⚪ Anuladas', CASHOUT: '🟠 Cashout'
}

const STATUS_CONFIG: Record<string, any> = {
  GREEN:   { bg: 'bg-emerald-50', text: 'text-emerald-600', borderL: 'border-l-emerald-500', label: 'Green', icon: <CheckCircle size={12} /> },
  RED:     { bg: 'bg-rose-50',    text: 'text-rose-600',    borderL: 'border-l-rose-500',    label: 'Red',   icon: <XCircle size={12} /> },
  VOID:    { bg: 'bg-slate-50',   text: 'text-slate-500',   borderL: 'border-l-slate-400',   label: 'Anulada', icon: <XCircle size={12} /> },
  PENDING: { bg: 'bg-amber-50',   text: 'text-amber-600',   borderL: 'border-l-amber-500',   label: 'Pendente', icon: <Clock size={12} /> },
  CASHOUT: { bg: 'bg-orange-50',  text: 'text-orange-600',  borderL: 'border-l-orange-500',  label: 'Cashout',  icon: <DollarSign size={12} /> },
}

const DoughnutChart = ({ greens, reds, pending, voided, cashout }: any) => {
  const data = {
    labels: ['Green', 'Red', 'Pendente', 'Anulada', 'Cashout'],
    datasets: [{
      data: [greens, reds, pending, voided, cashout],
      backgroundColor: ['#10b981', '#f43f5e', '#f59e0b', '#64748b', '#f97316'],
      borderWidth: 0,
    }]
  }
  return (
    <div className="flex items-center gap-4">
      <div className="h-16 w-16 shrink-0">
        <Doughnut data={data} options={{ plugins: { legend: { display: false }, tooltip: { enabled: true } }, cutout: '70%', maintainAspectRatio: false }} />
      </div>
      <div className="flex flex-col gap-1 text-[10px] font-bold min-w-[80px]">
        <div className="flex items-center gap-1.5 text-emerald-600"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /><span>{greens} Green</span></div>
        <div className="flex items-center gap-1.5 text-rose-600"><span className="w-1.5 h-1.5 rounded-full bg-rose-500" /><span>{reds} Red</span></div>
        <div className="flex items-center gap-1.5 text-amber-600"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" /><span>{pending} Pend.</span></div>
        {voided > 0 && <div className="flex items-center gap-1.5 text-slate-400"><span className="w-1.5 h-1.5 rounded-full bg-slate-400" /><span>{voided} Anul.</span></div>}
        <div className="flex items-center gap-1.5 text-orange-600"><span className="w-1.5 h-1.5 rounded-full bg-orange-500" /><span>{cashout} Cash.</span></div>
      </div>
    </div>
  )
}

const StatusBadge = ({ tip }: { tip: Tip }) => {
  const status = tip.result || 'PENDING'
  const c = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${c.bg} ${c.text}`}>
      {c.icon}{c.label}
    </span>
  )
}

export const TipsPage = () => {
  const { user: me } = useAuth()
  const isMaster = me?.role === 'MASTER' || me?.role === 'ADMIN'

  const [tips,       setTips]       = useState<Tip[]>([])
  const [loading,    setLoading]    = useState(true)
  const [filter,     setFilter]     = useState<ResultFilter>('Todos')
  const [page,       setPage]       = useState(1)
  const [selected,   setSelected]   = useState<Tip | null>(null)
  const [editForm,   setEditForm]   = useState({
    title: '', event: '', market: '', odds: '', stake: '', result: 'PENDING',
    profit: '', tipDate: '', valorCashout: '', sport: '', linkAposta: ''
  })
  const [newTipSport, setNewTipSport] = useState('')
  const [newTipLink,  setNewTipLink]  = useState('')
  const [saving,     setSaving]     = useState(false)
  const [showBanner, setShowBanner] = useState(true)
  const [newTipOpen, setNewTipOpen] = useState(false)
  const [isCriarApostaModalOpen, setIsCriarApostaModalOpen] = useState(false)
  const [isCriarMultiplaModalOpen, setIsCriarMultiplaModalOpen] = useState(false)
  const [sharingTip, setSharingTip] = useState<Tip | null>(null)
  const [editTipMultipla, setEditTipMultipla] = useState<Tip | null>(null)
  const [editTipMultiMercado, setEditTipMultiMercado] = useState<Tip | null>(null)
  const [isMultiplaCriarApostaModalOpen, setIsMultiplaCriarApostaModalOpen] = useState(false)
  const [editTipMultiplaCriarAposta, setEditTipMultiplaCriarAposta] = useState<Tip | null>(null)

  const load = async (p = 1) => {
    setLoading(true)
    try {
      const data = await tipsService.getAll(p, 12)
      const tipsRaw = Array.isArray(data.tips) ? data.tips : []
      setTips(tipsRaw)
      setPage(p)
    } finally { setLoading(false) }
  }

  useEffect(() => { load(1) }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta dica?')) return
    try {
      await tipsService.delete(id)
      toast.success('Dica removida.')
      if (me) addLog({ userEmail: me.email, userName: me.name, userRole: me.role, category: 'Dicas', action: 'Tip removida', detail: `Removeu tip ID: ${id}` })
      load(page)
    } catch { toast.error('Erro ao excluir dica') }
  }

  const handleUpdateTip = async () => {
    if (!selected) return
    setSaving(true)
    try {
      await tipsService.update(selected.id, {
        title: editForm.title,
        event: editForm.event,
        market: editForm.market,
        odds: Number(editForm.odds),
        stake: Number(editForm.stake),
        result: editForm.result,
        profit: Number(editForm.profit),
        tipDate: new Date(editForm.tipDate).toISOString(),
        valorCashout: editForm.result === 'CASHOUT' ? Number(editForm.valorCashout) : null,
        sport: editForm.sport || 'Futebol',
        linkAposta: editForm.linkAposta?.trim() || null,
      })
      toast.success('Dica atualizada! 🎯')
      if (me) addLog({ userEmail: me.email, userName: me.name, userRole: me.role, category: 'Operacional', action: 'Resultado atualizado', detail: `Resultado: ${editForm.result} — ${selected?.title}` })
      setSelected(null); load(page)
    } catch { toast.error('Erro ao atualizar') }
    finally { setSaving(false) }
  }

  const handleResultChange = (newResult: string) => {
    setEditForm(f => {
      const stakeVal = Number(f.stake) || 0
      const oddsVal = Number(f.odds) || 1
      let newProfit = f.profit
      if (newResult === 'GREEN') newProfit = (stakeVal * (oddsVal - 1)).toFixed(2)
      else if (newResult === 'RED') newProfit = (-stakeVal).toFixed(2)
      else if (newResult === 'VOID') newProfit = '0'
      else if (newResult === 'CASHOUT') newProfit = (Number(f.valorCashout || 0) - Number(f.stake || 0)).toFixed(2)
      else newProfit = ''
      return { ...f, result: newResult, profit: newProfit }
    })
  }

  const handleSaveNovoBilhete = async (data: any, id?: string) => {
    if (id) {
      await tipsService.update(id, data)
      if (me) addLog({ userEmail: me.email, userName: me.name, userRole: me.role, category: 'Dicas', action: 'Tip editada', detail: `Editou: ${data.title} — ${data.sport}` })
    } else {
      await tipsService.create(data)
      if (me) addLog({ userEmail: me.email, userName: me.name, userRole: me.role, category: 'Dicas', action: 'Tip publicada', detail: `Publicou: ${data.title} — ${data.sport}` })
    }
    load(1)
    setEditTipMultipla(null)
    setEditTipMultiMercado(null)
  }

  const openEdit = (tip: Tip) => {
    if (tip.isMultipla) {
      setEditTipMultiplaCriarAposta(tip)
      setIsMultiplaCriarApostaModalOpen(true)
    } else if (tip.mercados && tip.mercados.length > 0) {
      setEditTipMultiMercado(tip)
      setIsCriarApostaModalOpen(true)
    } else {
      setSelected(tip)
      setEditForm({
        title: tip.title,
        event: tip.event,
        market: tip.market,
        odds: tip.odds.toString(),
        stake: tip.stake.toString(),
        result: tip.result || 'PENDING',
        profit: tip.profit !== null && tip.profit !== undefined ? tip.profit.toString() : '',
        tipDate: new Date(tip.tipDate).toISOString().slice(0, 16),
        valorCashout: tip.valorCashout?.toString() || '',
        sport: tip.sport || '',
        linkAposta: tip.linkAposta || '',
      })
    }
  }

  const metrics = useMemo(() => {
    const ts = Array.isArray(tips) ? tips : []
    const greens  = ts.filter(t => t.result === 'GREEN')
    const reds    = ts.filter(t => t.result === 'RED')
    const voided  = ts.filter(t => t.result === 'VOID')
    const pending = ts.filter(t => !t.result || t.result === 'PENDING')
    const cashout = ts.filter(t => t.result === 'CASHOUT')
    const pnl     = ts.reduce((acc, t) => acc + (t.profit ?? 0), 0)
    const volume  = ts.reduce((acc, t) => acc + t.stake, 0)
    const fin     = greens.length + reds.length
    return {
      pnl, volume, winRate: fin > 0 ? (greens.length / fin) * 100 : 0,
      greens: greens.length, reds: reds.length, pending: pending.length, voided: voided.length, cashout: cashout.length,
    }
  }, [tips])

  const filtered = useMemo(() => {
    const ts = Array.isArray(tips) ? tips : []
    return filter === 'Todos' ? ts : ts.filter(t => (t.result || 'PENDING') === filter)
  }, [tips, filter])

  const TipCard = ({ tip }: { tip: Tip }) => {
    const [isExpanded, setIsExpanded] = useState(false)
    const c = STATUS_CONFIG[tip.result || 'PENDING'] || STATUS_CONFIG.PENDING
    const temMercados = tip.mercados && tip.mercados.length > 0
    const isMultipla = tip.isMultipla && Array.isArray(tip.jogos) && tip.jogos.length > 0
    const eExpansivel = temMercados || isMultipla

    return (
      <div className={`border border-l-4 ${c.borderL} rounded-2xl p-5 shadow-sm bg-white border-slate-100 group flex flex-col transition-all hover:border-emerald-500/30`}>
        <div
          className="flex justify-between items-start cursor-pointer w-full"
          onClick={() => eExpansivel && setIsExpanded(!isExpanded)}
        >
          <div className="flex-1 pr-4">
            <h3 className="font-display font-bold text-sm text-slate-800 leading-snug break-words">
              {tip.title}
              {isMultipla && <span className="ml-2 px-1.5 py-0.5 rounded bg-cyan-50 text-cyan-600 text-[10px] font-black uppercase tracking-widest border border-cyan-100">Múltipla</span>}
            </h3>
            <p className="text-[11px] font-bold text-slate-400 mt-1">
              {tip.sport} {tip.event ? `· ${tip.event}` : ''}
              {!eExpansivel && tip.market && ` · ${tip.market}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isMaster && (
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity mr-2" onClick={e => e.stopPropagation()}>
                <button onClick={() => setSharingTip(tip)} className="p-1.5 text-slate-300 hover:text-emerald-500 transition-colors"><Share2 size={13} /></button>
                <button onClick={() => openEdit(tip)} className="p-1.5 text-slate-300 hover:text-slate-800 transition-colors"><Edit2 size={13} /></button>
                <button onClick={() => handleDelete(tip.id)} className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={13} /></button>
              </div>
            )}
            {eExpansivel && (
              <span className={`text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                <ChevronDown size={18} />
              </span>
            )}
          </div>
        </div>

        <hr className="border-slate-100 my-4" />

        <div className="flex items-center justify-between text-center gap-2">
          <div className="text-left">
            <p className="text-[10px] text-slate-300 uppercase font-black tracking-widest mb-0.5">Odd</p>
            <p className="text-[15px] font-bold font-mono text-slate-800">@{tip.odds.toFixed(2)}</p>
          </div>
          <div className="h-8 w-px bg-slate-100" />
          <div className="text-center">
            <p className="text-[10px] text-slate-300 uppercase font-black tracking-widest mb-0.5">VALOR (R$)</p>
            <p className="text-[15px] font-bold font-mono text-slate-800">{fmt(tip.stake)}</p>
          </div>
          {tip.profit !== undefined && (
            <>
              <div className="h-8 w-px bg-slate-50" />
              <div className="text-center">
                <p className="text-[10px] text-slate-300 uppercase font-black tracking-widest mb-0.5">Profit</p>
                <p className={`text-[15px] font-bold font-mono ${tip.profit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {tip.profit >= 0 ? '+' : ''}{fmt(tip.profit)}
                </p>
              </div>
            </>
          )}

          <div className="h-8 w-px bg-slate-100 hidden sm:block" />
          <div className="flex flex-col items-end gap-1.5 flex-[1.5] text-right">
            <StatusBadge tip={tip} />
            <span className="text-[10px] text-slate-400 font-mono font-bold">{fmtDate(tip.tipDate)}</span>
            {tip.linkAposta && (
              <a
                href={tip.linkAposta}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-400 text-[10px] font-bold hover:bg-blue-500/30 transition-colors"
              >
                🔗 Ver Aposta
              </a>
            )}
          </div>
        </div>

        {isExpanded && eExpansivel && (
          <div className="mt-5 pt-5 border-t border-slate-100 space-y-3">
            {isMultipla ? (
              <>
                <div className="flex items-center gap-1.5 text-cyan-600 mb-3">
                  <span className="text-xs">★</span>
                  <h4 className="font-bold uppercase text-[10px] tracking-widest">Jogos do Bilhete (Múltipla)</h4>
                </div>
                {tip.jogos!.map((jogo: any, index: number) => {
                  const sC = STATUS_CONFIG[jogo.resultado || 'PENDING'] || STATUS_CONFIG.PENDING
                  return (
                    <div key={index} className="bg-slate-50 p-3 rounded-2xl flex flex-col gap-1.5 border border-slate-100 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="bg-cyan-50 text-cyan-600 text-[10px] font-black uppercase tracking-widest rounded-full px-2 py-0.5 w-max border border-cyan-100">Jogo {index + 1}</span>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${sC.text}`}>{sC.label}</span>
                      </div>
                      <p className="text-[13px] font-display font-bold text-slate-800 flex-1 leading-snug">{jogo.mandante} x {jogo.visitante}</p>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1 pt-2 border-t border-slate-100">
                        <span className="font-bold">{jogo.mercados?.map((m: any) => m.mercado || m).join(', ')}</span>
                        <span className="font-mono text-emerald-600 font-bold">@{Number(jogo.odd).toFixed(2)}</span>
                      </div>
                    </div>
                  )
                })}
              </>
            ) : (
              <>
                <div className="flex items-center gap-1.5 text-amber-600 mb-3">
                  <span className="text-xs">★</span>
                  <h4 className="font-bold uppercase text-[10px] tracking-widest">Mercados do Bilhete</h4>
                </div>
                {tip.mercados!.map((mercado, index) => (
                  <div key={index} className="bg-slate-50 p-3 rounded-2xl flex items-center gap-3 border border-slate-100 shadow-sm">
                    <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-full w-5 h-5 min-w-[20px] shrink-0 flex items-center justify-center border border-emerald-100">{index + 1}</span>
                    <p className="text-[13px] text-slate-600 flex-1 leading-snug font-bold">{mercado}</p>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 relative pb-32">
      {showBanner && (
        <div className="flex items-start gap-3 rounded-xl p-4 border bg-amber-50 border-amber-100">
          <Info size={16} className="mt-0.5 shrink-0 text-amber-500" />
          <p className="text-xs leading-relaxed text-amber-700 font-bold">
            <strong className="text-amber-800">Atenção:</strong> O stake exibido é a sugestão do tipster. Adapte conforme sua banca.
          </p>
          <button onClick={() => setShowBanner(false)} className="ml-auto text-amber-300 hover:text-amber-500 transition-colors"><X size={14} /></button>
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-slate-800 text-2xl">Dicas do Dia</h2>
          <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1">{tips.length} dicas carregadas</p>
        </div>
        {isMaster && (
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            <button onClick={() => setIsMultiplaCriarApostaModalOpen(true)}
              className="bg-slate-800 hover:bg-slate-700 transition-colors text-white px-4 py-2 font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-1.5 rounded-xl shadow-lg shadow-slate-200">
              <span className="text-purple-400">★</span> Múltipla + CA
            </button>
            <button onClick={() => setIsCriarMultiplaModalOpen(true)} className="bg-white hover:bg-slate-50 transition-colors text-slate-500 px-4 py-2 font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-1.5 rounded-xl shadow-sm border border-slate-100">
              <span className="text-cyan-400">★</span> Dicas - Múltiplas
            </button>
            <button onClick={() => setIsCriarApostaModalOpen(true)} className="bg-white hover:bg-slate-50 transition-colors text-slate-500 px-4 py-2 font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-1.5 rounded-xl shadow-sm border border-slate-100">
              <span className="text-emerald-400">★</span> Dicas - Criar apostas
            </button>
            <button onClick={() => setNewTipOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-500 transition-all active:scale-95 shadow-lg shadow-emerald-500/20">
              <Plus size={16} />Dicas simples
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">P&L Total</span>
            <TrendingUp size={14} className="text-emerald-500" />
          </div>
          <p className={`text-2xl font-display font-bold font-mono ${metrics.pnl >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            {metrics.pnl >= 0 ? '+' : ''}{fmt(metrics.pnl)}
          </p>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-tighter mt-1">Profit acumulado</p>
        </div>
        <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Win Rate</span>
            <Target size={14} className="text-sky-500" />
          </div>
          <p className="text-2xl font-display font-bold font-mono text-sky-700">{metrics.winRate.toFixed(1)}%</p>
          <div className="mt-3 h-1.5 bg-slate-50 rounded-full overflow-hidden shadow-inner">
            <div className="h-full bg-sky-500 shadow-lg shadow-sky-500/50" style={{ width: `${metrics.winRate}%` }} />
          </div>
        </div>
        <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Stake Total</span>
            <DollarSign size={14} className="text-purple-500" />
          </div>
          <p className="text-2xl font-display font-bold font-mono text-slate-800">{fmt(metrics.volume)}</p>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-tighter mt-1">Total apostado</p>
        </div>
        <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center">
          <DoughnutChart greens={metrics.greens} reds={metrics.reds} pending={metrics.pending} voided={metrics.voided} cashout={metrics.cashout} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border transition-all ${filter === f 
              ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-500/20' 
              : 'bg-white border-slate-100 text-slate-400 hover:border-emerald-500/30'}`}>
            {FILTER_LABELS[f]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24"><div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white p-20 rounded-[3rem] border border-slate-100 text-center shadow-sm">
          <Ban size={48} className="mx-auto mb-4 text-slate-200" />
          <p className="text-slate-500 font-medium">Nenhuma dica encontrada para este filtro.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(t => <TipCard key={t.id} tip={t} />)}
        </div>
      )}

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Editar Dica / Resultado" size="md">
        {selected && (
          <div className="flex flex-col gap-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Esporte</label>
                  <SportSelect value={editForm.sport} onChange={v => setEditForm(f => ({ ...f, sport: v }))} />
                </div>
                <div>
                  <label className="label">Evento</label>
                  <input className="input-field" value={editForm.event} onChange={e => setEditForm(f => ({ ...f, event: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="label">Mercado</label>
                <input className="input-field" value={editForm.market} onChange={e => setEditForm(f => ({ ...f, market: e.target.value }))} />
              </div>
              <div>
                <label className="label">Link da Aposta</label>
                <input type="url" className="input-field text-sm" placeholder="https://..." value={editForm.linkAposta} onChange={e => setEditForm(f => ({ ...f, linkAposta: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Odd</label>
                  <input type="number" step="0.01" className="input-field" value={editForm.odds} onChange={e => setEditForm(f => ({ ...f, odds: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Stake</label>
                  <CurrencyInput
                    value={editForm.stake ? Number(editForm.stake) : 0}
                    onChange={(v) => setEditForm(f => ({ ...f, stake: String(v) }))}
                    alertLimit={1000}
                    className="w-full"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 mt-4">
                <div>
                  <label className="label">Resultado</label>
                  <select value={editForm.result} onChange={e => handleResultChange(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-4 text-sm text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all">
                    <option value="PENDING">Pendente</option>
                    <option value="GREEN">Green</option>
                    <option value="RED">Red</option>
                    <option value="VOID">Anulada</option>
                    <option value="CASHOUT">Cashout</option>
                  </select>
                </div>
                <div>
                  <label className="label">
                    {editForm.result === 'CASHOUT' ? 'Valor Recebido' : `Lucro/Prejuízo (${me?.currency || 'BRL'})`}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-field font-mono"
                    value={editForm.result === 'CASHOUT' ? editForm.valorCashout : editForm.profit}
                    onChange={e => {
                      const val = e.target.value
                      if (editForm.result === 'CASHOUT') {
                        const prof = (Number(val) - Number(editForm.stake)).toFixed(2)
                        setEditForm(f => ({ ...f, valorCashout: val, profit: prof }))
                      } else {
                        setEditForm(f => ({ ...f, profit: val }))
                      }
                    }}
                  />
                </div>
              </div>
              <div>
                <label className="label">Data/Hora</label>
                <input type="datetime-local" className="input-field" value={editForm.tipDate} onChange={e => setEditForm(f => ({ ...f, tipDate: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setSelected(null)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={handleUpdateTip} disabled={saving} className="btn-primary flex-1">{saving ? 'Salvando...' : 'Confirmar'}</button>
            </div>
          </div>
        )}
      </Modal>

      {newTipOpen && (
        <Modal isOpen={newTipOpen} onClose={() => setNewTipOpen(false)} title="Nova Dica" size="md">
          <form className="flex flex-col gap-4" onSubmit={async (e) => {
            e.preventDefault()
            setSaving(true)
            try {
              const autoTitle = (e.currentTarget.elements.namedItem('champ') as HTMLInputElement).value
                ? `${(e.currentTarget.elements.namedItem('event') as HTMLInputElement).value} — ${(e.currentTarget.elements.namedItem('champ') as HTMLInputElement).value}`
                : (e.currentTarget.elements.namedItem('event') as HTMLInputElement).value
              await tipsService.create({
                title: autoTitle,
                event: (e.currentTarget.elements.namedItem('event') as HTMLInputElement).value,
                market: (e.currentTarget.elements.namedItem('market') as HTMLInputElement).value,
                odds: Number((e.currentTarget.elements.namedItem('odds') as HTMLInputElement).value),
                stake: Number((e.currentTarget.elements.namedItem('stake') as HTMLInputElement).value),
                tipDate: new Date((e.currentTarget.elements.namedItem('date') as HTMLInputElement).value).toISOString(),
                sport: newTipSport || 'Futebol',
                description: (e.currentTarget.elements.namedItem('market') as HTMLInputElement).value,
                linkAposta: newTipLink.trim() || null,
              })
              toast.success('Dica criada!')
              if (me) addLog({ userEmail: me.email, userName: me.name, userRole: me.role, category: 'Dicas', action: 'Tip publicada', detail: `Publicou: ${autoTitle} — ${newTipSport || 'Futebol'}` })
              setNewTipOpen(false)
              setNewTipSport('')
              setNewTipLink('')
              load(1)
            } catch { toast.error('Erro ao criar dica') }
            finally { setSaving(false) }
          }}>
            <div><label className="label">Evento *</label><input name="event" required className="input-field" /></div>
            <div><label className="label">Campeonato</label><input name="champ" className="input-field" /></div>
            <div>
              <label className="label">Esporte *</label>
              <SportSelect value={newTipSport} onChange={setNewTipSport} required />
            </div>
            <div><label className="label">Mercado *</label><input name="market" required className="input-field" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Odd *</label><input name="odds" type="number" step="0.01" required className="input-field" /></div>
              <div><label className="label">Stake *</label><input name="stake" type="number" step="0.5" required className="input-field" /></div>
            </div>
            <div><label className="label">Data/Hora *</label><input name="date" type="datetime-local" required className="input-field" /></div>
            <div>
              <label className="label">Link da Aposta</label>
              <input type="url" value={newTipLink} onChange={e => setNewTipLink(e.target.value)}
                placeholder="https://www.betano.bet.br/bookingcode/..."
                className="input-field text-sm" />
            </div>
            <button type="submit" disabled={saving} className="btn-primary w-full py-3">{saving ? 'Publicando...' : 'Publicar'}</button>
          </form>
        </Modal>
      )}

      {sharingTip && <ShareTipModal isOpen={!!sharingTip} onClose={() => setSharingTip(null)} tip={sharingTip} />}

      <ModalMultiplaCriarAposta
        isOpen={isMultiplaCriarApostaModalOpen}
        onClose={() => { setIsMultiplaCriarApostaModalOpen(false); setEditTipMultiplaCriarAposta(null) }}
        onSave={handleSaveNovoBilhete}
        initialData={editTipMultiplaCriarAposta}
      />

      <ModalCriarAposta
        isOpen={isCriarApostaModalOpen}
        onClose={() => { setIsCriarApostaModalOpen(false); setEditTipMultiMercado(null) }}
        onSave={handleSaveNovoBilhete}
        initialData={editTipMultiMercado}
      />

      <ModalCriarMultipla
        isOpen={isCriarMultiplaModalOpen}
        onClose={() => { setIsCriarMultiplaModalOpen(false); setEditTipMultipla(null) }}
        onSave={handleSaveNovoBilhete}
        initialData={editTipMultipla}
      />
    </div>
  )
}
