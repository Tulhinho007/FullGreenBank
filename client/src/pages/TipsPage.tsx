import { useEffect, useState, useMemo } from 'react'
import {
  TrendingUp, Target, Clock, CheckCircle, XCircle,
  Plus, X, Edit2, Trash2, Info, Share2, Ban, DollarSign
} from 'lucide-react'
import { Modal } from '../components/ui/Modal'
import { formatCurrency as fmt, formatDate as fmtDate } from '../utils/formatters'
import { tipsService } from '../services/tips.service'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import { ShareTipModal } from '../components/ui/ShareTipModal'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend)

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Tip {
  id: string; title: string; description: string; sport: string
  event: string; market: string; odds: number; stake: number
  result?: string; profit?: number; tipDate: string
}

type ResultFilter = 'Todos' | 'GREEN' | 'RED' | 'VOID' | 'PENDING'

const FILTERS: ResultFilter[] = ['Todos', 'PENDING', 'GREEN', 'RED', 'VOID']
const FILTER_LABELS: Record<ResultFilter, string> = {
  Todos: 'Todas', PENDING: '⏳ Pendentes', GREEN: '✅ Greens', RED: '❌ Reds', VOID: '⚪ Anuladas'
}

const STATUS_CONFIG: Record<string, any> = {
  GREEN:   { bg: 'bg-emerald-500/10', text: 'text-emerald-500', borderL: 'border-l-emerald-500', label: 'Green', icon: <CheckCircle size={12} /> },
  RED:     { bg: 'bg-rose-500/10',    text: 'text-rose-500',    borderL: 'border-l-rose-500',    label: 'Red',   icon: <XCircle size={12} /> },
  VOID:    { bg: 'bg-slate-500/10',    text: 'text-slate-500',   borderL: 'border-l-slate-500',   label: 'Anulada', icon: <XCircle size={12} /> },
  PENDING: { bg: 'bg-amber-500/10',   text: 'text-amber-500',   borderL: 'border-l-amber-500',   label: 'Pendente', icon: <Clock size={12} /> },
}

// ─── Componentes Auxiliares (Fora para evitar recriação) ───────────────────────

const DoughnutChart = ({ greens, reds, pending, voided }: any) => {
  const data = {
    labels: ['Green', 'Red', 'Pendente', 'Anulada'],
    datasets: [{
      data: [greens, reds, pending, voided],
      backgroundColor: ['#10b981', '#f43f5e', '#f59e0b', '#64748b'],
      borderWidth: 0,
    }]
  }
  return (
    <div className="flex items-center gap-4">
      <div className="h-16 w-16 shrink-0">
        <Doughnut data={data} options={{ plugins: { legend: { display: false }, tooltip: { enabled: true } }, cutout: '70%', maintainAspectRatio: false }} />
      </div>
      <div className="flex flex-col gap-1 text-[10px] font-medium min-w-[80px]">
        <div className="flex items-center gap-1.5 text-emerald-500">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>{greens} Green</span>
        </div>
        <div className="flex items-center gap-1.5 text-rose-500">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          <span>{reds} Red</span>
        </div>
        <div className="flex items-center gap-1.5 text-amber-500">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          <span>{pending} Pend.</span>
        </div>
        {voided > 0 && (
          <div className="flex items-center gap-1.5 text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
            <span>{voided} Anul.</span>
          </div>
        )}
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

// ─── Componente Principal ─────────────────────────────────────────────────────

export const TipsPage = () => {
  const { user: me } = useAuth()
  const isMaster = me?.role === 'MASTER' || me?.role === 'ADMIN'

  const [tips,       setTips]       = useState<Tip[]>([])
  const [loading,    setLoading]    = useState(true)
  const [filter,     setFilter]     = useState<ResultFilter>('Todos')
  const [page,       setPage]       = useState(1)
  const [selected,   setSelected]   = useState<Tip | null>(null)
  const [editForm,   setEditForm]   = useState({
    title: '', event: '', market: '', odds: '', stake: '', tipDate: '', result: 'PENDING', profit: ''
  })
  const [saving,     setSaving]     = useState(false)
  const [showBanner, setShowBanner] = useState(true)
  const [newTipOpen, setNewTipOpen] = useState(false)
  const [sharingTip, setSharingTip] = useState<Tip | null>(null)

  const load = async (p = 1) => {
    setLoading(true)
    try {
      const data = await tipsService.getAll(p, 9)
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
      load(page)
    } catch { toast.error('Erro ao excluir dica') }
  }

  const handleUpdateTip = async () => {
    if (!selected) return
    setSaving(true)
    try {
      await tipsService.update(selected.id, {
        title: editForm.title, event: editForm.event, market: editForm.market,
        odds: Number(editForm.odds), stake: Number(editForm.stake),
        tipDate: new Date(editForm.tipDate).toISOString(),
      })
      await tipsService.updateResult(selected.id, editForm.result, Number(editForm.profit))
      toast.success('Dica atualizada! 🎯')
      setSelected(null); load(page)
    } catch { toast.error('Erro ao atualizar') }
    finally { setSaving(false) }
  }

  const handleResultChange = (newResult: string) => {
    setEditForm(f => {
      const stakeVal = Number(f.stake) || 0;
      const oddsVal = Number(f.odds) || 1;
      let newProfit = f.profit;

      if (newResult === 'GREEN') {
        newProfit = (stakeVal * (oddsVal - 1)).toFixed(2);
      } else if (newResult === 'RED') {
        newProfit = (-stakeVal).toFixed(2);
      } else if (newResult === 'VOID') {
        newProfit = '0';
      } else {
        newProfit = '';
      }

      return { ...f, result: newResult, profit: newProfit };
    });
  };

  const openEdit = (tip: Tip) => {
    setSelected(tip)
    setEditForm({
      title: tip.title, event: tip.event, market: tip.market,
      odds: tip.odds.toString(), stake: tip.stake.toString(),
      tipDate: new Date(tip.tipDate).toISOString().slice(0, 16),
      result: tip.result || 'PENDING', profit: tip.profit?.toString() || '',
    })
  }

  const metrics = useMemo(() => {
    const ts = Array.isArray(tips) ? tips : []
    const greens  = ts.filter(t => t.result === 'GREEN')
    const reds    = ts.filter(t => t.result === 'RED')
    const voided  = ts.filter(t => t.result === 'VOID')
    const pending = ts.filter(t => !t.result || t.result === 'PENDING')
    const pnl     = ts.reduce((acc, t) => acc + (t.profit ?? 0), 0)
    const volume  = ts.reduce((acc, t) => acc + t.stake, 0)
    const fin     = greens.length + reds.length
    return {
      pnl, volume, winRate: fin > 0 ? (greens.length / fin) * 100 : 0,
      greens: greens.length, reds: reds.length, pending: pending.length, voided: voided.length,
    }
  }, [tips])

  const filtered = useMemo(() => {
    const ts = Array.isArray(tips) ? tips : []
    return filter === 'Todos' ? ts : ts.filter(t => (t.result || 'PENDING') === filter)
  }, [tips, filter])

  // ─── Sub-componentes internos para acessar fmt/fmtDate ───────────────────────

  const TipCard = ({ tip }: { tip: Tip }) => {
    const c = STATUS_CONFIG[tip.result || 'PENDING'] || STATUS_CONFIG.PENDING
    return (
      <div className={`border border-l-4 ${c.borderL} rounded-xl p-5 shadow-sm group transition-all bg-surface-200 border-surface-400 hover:border-surface-300`}>
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-sm text-white leading-snug line-clamp-2 flex-1">{tip.title}</h3>
          {isMaster && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => setSharingTip(tip)} className="p-1.5 text-slate-400 hover:text-green-400 transition-colors"><Share2 size={13} /></button>
              <button onClick={() => openEdit(tip)} className="p-1.5 text-slate-400 hover:text-white transition-colors"><Edit2 size={13} /></button>
              <button onClick={() => handleDelete(tip.id)} className="p-1.5 text-slate-400 hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
            </div>
          )}
        </div>
        <p className="text-xs text-slate-400 mb-1">{tip.sport} · {tip.event}</p>
        <p className="text-xs text-slate-500 mb-4">{tip.market}</p>
        <div className="flex items-center justify-between mb-4 gap-2">
          <div className="text-center">
            <p className="text-[10px] text-slate-500 uppercase mb-0.5">Odd</p>
            <p className="text-base font-bold font-mono text-white">@{tip.odds.toFixed(2)}</p>
          </div>
          <div className="h-8 w-px bg-surface-400" />
          <div className="text-center">
            <p className="text-[10px] text-slate-500 uppercase mb-0.5">Valor</p>
            <p className="text-base font-bold font-mono text-emerald-400">{fmt(tip.stake)}</p>
          </div>
          {tip.profit !== undefined && (
            <>
              <div className="h-8 w-px bg-surface-400" />
              <div className="text-center">
                <p className="text-[10px] text-slate-500 uppercase mb-0.5">Profit</p>
                <p className={`text-base font-bold font-mono ${tip.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {tip.profit >= 0 ? '+' : ''}{fmt(tip.profit)}
                </p>
              </div>
            </>
          )}
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-surface-400">
          <StatusBadge tip={tip} />
          <span className="text-[10px] text-slate-500 font-mono">{fmtDate(tip.tipDate)}</span>
        </div>
      </div>
    )
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 relative pb-20">
      {/* Banner */}
      {showBanner && (
        <div className="flex items-start gap-3 rounded-xl p-4 border bg-amber-500/10 border-amber-500/30">
          <Info size={16} className="mt-0.5 shrink-0 text-amber-400" />
          <p className="text-xs leading-relaxed text-amber-300">
            <strong className="text-amber-200">Atenção:</strong> O stake exibido é a sugestão do tipster. Adapte conforme sua banca.
          </p>
          <button onClick={() => setShowBanner(false)} className="ml-auto text-amber-500 hover:text-amber-200"><X size={14} /></button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display font-semibold text-white">Dicas do Dia</h2>
          <p className="text-xs text-slate-500 uppercase tracking-widest">{tips.length} dicas carregadas</p>
        </div>
        {isMaster && (
          <button onClick={() => setNewTipOpen(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} />Nova Dica
          </button>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">P&L Total</span>
            <TrendingUp size={14} className="text-emerald-400" />
          </div>
          <p className={`text-xl font-bold font-mono ${metrics.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {metrics.pnl >= 0 ? '+' : ''}{fmt(metrics.pnl)}
          </p>
          <p className="text-[10px] text-slate-600 mt-1">Profit acumulado</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Win Rate</span>
            <Target size={14} className="text-sky-400" />
          </div>
          <p className="text-xl font-bold font-mono text-sky-400">{metrics.winRate.toFixed(1)}%</p>
          <div className="mt-2 h-1 bg-surface-400 rounded-full overflow-hidden">
            <div className="h-full bg-sky-400" style={{ width: `${metrics.winRate}%` }} />
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Volume</span>
            <DollarSign size={14} className="text-purple-400" />
          </div>
          <p className="text-xl font-bold font-mono text-white">{fmt(metrics.volume)}</p>
          <p className="text-[10px] text-slate-600 mt-1">Total apostado</p>
        </div>
        <div className="card p-4 flex flex-col items-center justify-center">
          <DoughnutChart greens={metrics.greens} reds={metrics.reds} pending={metrics.pending} voided={metrics.voided} />
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${filter === f ? 'bg-green-600 border-green-600 text-white' : 'bg-surface-300 border-surface-400 text-slate-400 hover:text-white'}`}>
            {FILTER_LABELS[f]}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="card p-16 text-center text-slate-500"><Ban size={32} className="mx-auto mb-4 opacity-20" />Nenhuma dica encontrada.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(t => <TipCard key={t.id} tip={t} />)}
        </div>
      )}

      {/* Modal Editar */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Editar Dica / Resultado" size="md">
        {selected && (
          <div className="flex flex-col gap-4">
            <div className="space-y-4">
              <div>
                <label className="label">Evento</label>
                <input className="input-field" value={editForm.event} onChange={e => setEditForm(f => ({ ...f, event: e.target.value }))} />
              </div>
              <div>
                <label className="label">Mercado</label>
                <input className="input-field" value={editForm.market} onChange={e => setEditForm(f => ({ ...f, market: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Odd</label>
                  <input type="number" step="0.01" className="input-field" value={editForm.odds} onChange={e => setEditForm(f => ({ ...f, odds: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Stake</label>
                  <input type="number" step="0.5" className="input-field" value={editForm.stake} onChange={e => setEditForm(f => ({ ...f, stake: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 border-t border-surface-400 pt-4 mt-4">
                <div>
                  <label className="label">Resultado</label>
                  <select className="input-field" value={editForm.result} onChange={e => handleResultChange(e.target.value)}>
                    <option value="PENDING">🟡 Pendente</option>
                    <option value="GREEN">🟢 Green</option>
                    <option value="RED">🔴 Red</option>
                    <option value="VOID">⚪ Anulado</option>
                  </select>
                </div>
                <div>
                  <label className="label">Lucro/Prejuízo ({me?.currency || 'BRL'})</label>
                  <input type="number" step="0.01" className="input-field font-mono" value={editForm.profit} onChange={e => setEditForm(f => ({ ...f, profit: e.target.value }))} />
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

      {/* Modal Novo */}
      {newTipOpen && (
        <Modal isOpen={newTipOpen} onClose={() => setNewTipOpen(false)} title="Nova Dica" size="md">
          <form className="flex flex-col gap-4" onSubmit={async (e) => {
            e.preventDefault();
            setSaving(true);
            try {
               const autoTitle = (e.currentTarget.elements.namedItem('champ') as HTMLInputElement).value 
                ? `${(e.currentTarget.elements.namedItem('event') as HTMLInputElement).value} — ${(e.currentTarget.elements.namedItem('champ') as HTMLInputElement).value}`
                : (e.currentTarget.elements.namedItem('event') as HTMLInputElement).value;
               
               await tipsService.create({
                 title: autoTitle,
                 event: (e.currentTarget.elements.namedItem('event') as HTMLInputElement).value,
                 market: (e.currentTarget.elements.namedItem('market') as HTMLInputElement).value,
                 odds: Number((e.currentTarget.elements.namedItem('odds') as HTMLInputElement).value),
                 stake: Number((e.currentTarget.elements.namedItem('stake') as HTMLInputElement).value),
                 tipDate: new Date((e.currentTarget.elements.namedItem('date') as HTMLInputElement).value).toISOString(),
                 sport: 'Futebol',
                 description: (e.currentTarget.elements.namedItem('market') as HTMLInputElement).value
               });
               toast.success('Dica criada!');
               setNewTipOpen(false); load(1);
            } catch { toast.error('Erro ao criar dica'); }
            finally { setSaving(false); }
          }}>
            <div><label className="label">Evento *</label><input name="event" required className="input-field" /></div>
            <div><label className="label">Campeonato</label><input name="champ" className="input-field" /></div>
            <div><label className="label">Mercado *</label><input name="market" required className="input-field" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Odd *</label><input name="odds" type="number" step="0.01" required className="input-field" /></div>
              <div><label className="label">Stake *</label><input name="stake" type="number" step="0.5" required className="input-field" /></div>
            </div>
            <div><label className="label">Data/Hora *</label><input name="date" type="datetime-local" required className="input-field" /></div>
            <button type="submit" disabled={saving} className="btn-primary w-full py-3">{saving ? 'Publicando...' : 'Publicar'}</button>
          </form>
        </Modal>
      )}

      {/* Modal Compartilhar */}
      {sharingTip && <ShareTipModal isOpen={!!sharingTip} onClose={() => setSharingTip(null)} tip={sharingTip} />}
    </div>
  )
}