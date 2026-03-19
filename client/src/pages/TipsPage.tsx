import { useEffect, useState, useMemo, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { tipsService } from '../services/tips.service'
import { Modal } from '../components/ui/Modal'
import {
  TrendingUp, Target, DollarSign,
  Edit2, Trash2, Info, X, Plus, Share2,
  ChevronUp, ChevronDown, CalendarDays, ChevronLeft, ChevronRight as ChevronRightIcon,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { ShareTipModal } from '../components/ui/ShareTipModal'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface Tip {
  id: string
  title: string
  description: string
  sport: string
  event: string
  market: string
  odds: number
  stake: number
  result?: string
  profit?: number
  tipDate: string
  author: { name: string; username: string }
}

type ResultFilter = 'Todos' | 'PENDING' | 'GREEN' | 'RED' | 'VOID'

interface NewTipForm {
  event: string
  championship: string
  market: string
  odds: string
  stake: string
  tipDate: string
}

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const FILTERS: ResultFilter[] = ['Todos', 'PENDING', 'GREEN', 'RED', 'VOID']

const FILTER_LABELS: Record<ResultFilter, string> = {
  Todos: 'Todos', PENDING: '🟡 Pendente', GREEN: '🟢 Green', RED: '🔴 Red', VOID: '⚪ Anulado',
}

// ─────────────────────────────────────────────
// Status Config — light + dark mode safe
// ─────────────────────────────────────────────

const STATUS_CONFIG: Record<string, {
  label: string
  badgeBg: string
  badgeText: string
  dot: string
  borderL: string
}> = {
  GREEN:   { label: '🟢 Green',    badgeBg: 'bg-emerald-100 dark:bg-emerald-500/20', badgeText: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500', borderL: 'border-l-emerald-500' },
  RED:     { label: '🔴 Red',      badgeBg: 'bg-rose-100 dark:bg-rose-500/20',       badgeText: 'text-rose-700 dark:text-rose-400',       dot: 'bg-rose-500',    borderL: 'border-l-rose-500'    },
  VOID:    { label: '⚪ Anulado',  badgeBg: 'bg-slate-100 dark:bg-slate-700/40',     badgeText: 'text-slate-600 dark:text-slate-400',     dot: 'bg-slate-400',   borderL: 'border-l-slate-400'   },
  PENDING: { label: '🟡 Pendente', badgeBg: 'bg-amber-100 dark:bg-amber-500/20',     badgeText: 'text-amber-700 dark:text-amber-400',     dot: 'bg-amber-500',   borderL: 'border-l-amber-500'   },
}

const getStatus = (tip: Tip) => tip.result || 'PENDING'
const scfg = (tip: Tip) => STATUS_CONFIG[getStatus(tip)] ?? STATUS_CONFIG.PENDING

const formatBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

const EMPTY_FORM: NewTipForm = {
  event: '', championship: '', market: '', odds: '', stake: '', tipDate: '',
}

// ─────────────────────────────────────────────
// Doughnut Chart (canvas — sem lib externa)
// ─────────────────────────────────────────────

function DoughnutChart({ greens, reds, pending, voided }: {
  greens: number; reds: number; pending: number; voided: number
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const total = greens + reds + pending + voided || 1

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const cx = canvas.width / 2, cy = canvas.height / 2
    const r = cx - 6, ir = r * 0.62
    const slices = [
      { value: greens,  color: '#10b981' },
      { value: reds,    color: '#f43f5e' },
      { value: pending, color: '#f59e0b' },
      { value: voided,  color: '#64748b' },
    ]
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    let start = -Math.PI / 2
    slices.forEach(({ value, color }) => {
      if (!value) return
      const sweep = (value / total) * 2 * Math.PI
      ctx.beginPath(); ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, r, start, start + sweep)
      ctx.closePath(); ctx.fillStyle = color; ctx.fill()
      start += sweep
    })
    // hole
    ctx.beginPath(); ctx.arc(cx, cy, ir, 0, 2 * Math.PI)
    ctx.fillStyle = 'transparent'; ctx.fill()
    // center %
    ctx.fillStyle = '#94a3b8'
    ctx.font = `bold ${Math.round(r * 0.38)}px sans-serif`
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText(`${Math.round((greens / total) * 100)}%`, cx, cy)
  }, [greens, reds, pending, voided, total])

  return (
    <div className="flex items-center gap-3">
      <canvas ref={canvasRef} width={76} height={76} />
      <div className="flex flex-col gap-1 text-xs">
        <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400"><span className="w-2 h-2 rounded-full bg-emerald-500" />{greens} Green</span>
        <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400"><span className="w-2 h-2 rounded-full bg-rose-500" />{reds} Red</span>
        <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400"><span className="w-2 h-2 rounded-full bg-amber-500" />{pending} Pend.</span>
        {voided > 0 && <span className="flex items-center gap-1.5 text-slate-500"><span className="w-2 h-2 rounded-full bg-slate-400" />{voided} Anul.</span>}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Status Badge
// ─────────────────────────────────────────────

function StatusBadge({ tip }: { tip: Tip }) {
  const c = scfg(tip)
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${c.badgeBg} ${c.badgeText}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  )
}

// ─────────────────────────────────────────────
// Tip Card
// ─────────────────────────────────────────────

function TipCard({ tip, isAdmin, onUpdateResult, onDelete, onShare }: {
  tip: Tip
  isAdmin: boolean
  onUpdateResult: (t: Tip) => void
  onDelete: (id: string) => void
  onShare: (t: Tip) => void
}) {
  const c = scfg(tip)
  return (
    <div className={`
      border border-l-4 ${c.borderL} rounded-xl p-5 shadow-sm group transition-all
      bg-white dark:bg-surface-200
      border-slate-200 dark:border-surface-400
      hover:shadow-md hover:border-slate-300 dark:hover:border-surface-300
    `}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-1">
        <h3 className="font-semibold text-sm text-slate-900 dark:text-white leading-snug line-clamp-2 flex-1">
          {tip.title}
        </h3>
        {isAdmin && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button onClick={() => onShare(tip)} title="Compartilhar"
              className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-500/10 transition-colors">
              <Share2 size={13} />
            </button>
            <button onClick={() => onUpdateResult(tip)} title="Editar resultado"
              className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-surface-400 transition-colors">
              <Edit2 size={13} />
            </button>
            <button onClick={() => onDelete(tip.id)} title="Excluir"
              className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors">
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-400 mb-1"><span className="text-slate-500">{tip.sport}</span> · {tip.event}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{tip.market}</p>

      {/* Values */}
      <div className="flex items-center justify-between mb-4 gap-2">
        <div className="text-center">
          <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Odd</p>
          <p className="text-base font-bold font-mono text-slate-900 dark:text-white">@{tip.odds.toFixed(2)}</p>
        </div>
        <div className="h-8 w-px bg-slate-200 dark:bg-surface-400" />
        <div className="text-center">
          <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Valor*</p>
          <p className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">{formatBRL(tip.stake)}</p>
        </div>
        {tip.profit !== undefined && tip.profit !== null && (
          <>
            <div className="h-8 w-px bg-slate-200 dark:bg-surface-400" />
            <div className="text-center">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Profit</p>
              <p className={`text-base font-bold font-mono ${tip.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {/* ALTERADO: De 'u' para formatBRL */}
                {tip.profit >= 0 ? '+' : ''}{formatBRL(tip.profit)}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Footer — badge + date */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-surface-400">
        <StatusBadge tip={tip} />
        <span className="text-[10px] text-slate-400">{formatDate(tip.tipDate)}</span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Modal Nova Dica (inline, sem rota separada)
// ─────────────────────────────────────────────

function NewTipModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<NewTipForm>(EMPTY_FORM)
  const [loading, setLoading] = useState(false)

  const set = (f: keyof NewTipForm) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(p => ({ ...p, [f]: e.target.value }))

  const handleSubmit = async () => {
    if (!form.event || !form.odds || !form.stake || !form.tipDate) {
      toast.error('Preencha todos os campos obrigatórios'); return
    }
    setLoading(true)
    try {
      // Monta título automático e preenche campos obrigatórios do backend
      const autoTitle = form.championship
        ? `${form.event} — ${form.championship}`
        : form.event

      await tipsService.create({
        title:       autoTitle,
        description: form.market || autoTitle,
        sport:       'Futebol',
        event:       form.event,
        market:      form.market,
        odds:        Number(form.odds),
        stake:       Number(form.stake),
        tipDate:     new Date(form.tipDate).toISOString(),
      })
      toast.success('Dica criada com sucesso! 🟢')
      onSaved(); onClose()
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erro ao criar dica')
    } finally { setLoading(false) }
  }

  const inp = `w-full rounded-lg px-3 py-2.5 text-sm border transition-colors
    bg-white dark:bg-surface-300
    border-slate-200 dark:border-surface-400
    text-slate-900 dark:text-white
    placeholder-slate-400 dark:placeholder-slate-500
    focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/30`
  const lbl = 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto
        bg-white dark:bg-surface-200 border border-slate-200 dark:border-surface-400">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-surface-400 sticky top-0 bg-white dark:bg-surface-200 z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
              <TrendingUp size={17} className="text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Nova Dica</p>
              <p className="text-xs text-slate-400">Publicar em Dicas do Dia</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-surface-400 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-5">

          {/* ── Preview do Card ── */}
          <div className="border-l-4 border-l-amber-500 rounded-xl p-5
            bg-slate-50 dark:bg-surface-300
            border border-slate-200 dark:border-surface-400">
            <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
              Preview do card
            </p>
            {/* Evento em destaque */}
            <p className="text-base font-bold text-slate-900 dark:text-white leading-snug">
              {form.event || <span className="text-slate-300 dark:text-slate-600 font-normal">Nome do Evento</span>}
            </p>
            {/* Campeonato + Mercado */}
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {[form.championship, form.market].filter(Boolean).join(' · ') || <span className="text-slate-300 dark:text-slate-600">Campeonato · Mercado</span>}
            </p>
            {/* Valores */}
            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-200 dark:border-surface-400 flex-wrap">
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Odd</p>
                <p className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                  {/* ALTERADO: Adicionado 'Odd @' */}
                  {form.odds ? `Odd @${form.odds}` : <span className="text-slate-300 dark:text-slate-600">Odd @—</span>}
                </p>
              </div>
              <div className="h-6 w-px bg-slate-200 dark:bg-surface-400" />
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Valor</p>
                <p className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  {form.stake ? formatBRL(Number(form.stake)) : <span className="text-slate-300 dark:text-slate-600">R$ —</span>}
                </p>
              </div>
              <div className="h-6 w-px bg-slate-200 dark:bg-surface-400" />
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Data</p>
                <p className="text-sm font-mono text-slate-700 dark:text-slate-300">
                  {form.tipDate
                    ? new Date(form.tipDate).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })
                    : <span className="text-slate-300 dark:text-slate-600">—</span>
                  }
                </p>
              </div>
              <span className="ml-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />🟡 Pendente
              </span>
            </div>
          </div>

          {/* ── Campos ── */}
          <div>
            <label className={lbl}>Evento *</label>
            <input className={inp} placeholder="Ex: Manchester City vs Arsenal"
              value={form.event} onChange={set('event')} />
          </div>

          <div>
            <label className={lbl}>Campeonato</label>
            <input className={inp} placeholder="Ex: Premier League, Champions League..."
              value={form.championship} onChange={set('championship')} />
          </div>

          <div>
            <label className={lbl}>Mercado *</label>
            <input className={inp} placeholder="Ex: Over 2.5, BTTS, Resultado Final..."
              value={form.market} onChange={set('market')} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Odd *</label>
              <input type="number" step="0.01" min="1.01" className={`${inp} font-mono`}
                placeholder="2.10" value={form.odds} onChange={set('odds')} />
            </div>
            <div>
              <label className={lbl}>Valor (R$) *</label>
              <input type="number" step="0.5" min="0.5" className={`${inp} font-mono`}
                placeholder="50" value={form.stake} onChange={set('stake')} />
            </div>
          </div>

          <div>
            <label className={lbl}>Data/Hora do evento *</label>
            <input type="datetime-local" className={inp} value={form.tipDate} onChange={set('tipDate')} />
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-slate-400 italic border-t border-slate-100 dark:border-surface-400 pt-3 leading-relaxed">
            * O valor exibido é uma sugestão do tipster. Cada apostador deve adaptar conforme
            o tamanho da sua banca e sua gestão pessoal.
          </p>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors
              border-slate-200 dark:border-surface-400 text-slate-600 dark:text-slate-300
              hover:bg-slate-50 dark:hover:bg-surface-400">
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 py-2.5 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm font-semibold
              shadow-lg shadow-green-500/20 transition-all active:scale-95 disabled:opacity-60
              flex items-center justify-center gap-2">
            {loading
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Publicando...</>
              : '🟢 Publicar Dica'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// History Table
// ─────────────────────────────────────────────

type DateRange = 'hoje' | 'ontem' | '2dias' | '7dias' | 'tudo'

const DATE_RANGE_LABELS: Record<DateRange, string> = {
  hoje:   'Hoje',
  ontem:  'Ontem',
  '2dias': 'Últimos 2 dias',
  '7dias': 'Últimos 7 dias',
  tudo:   'Tudo',
}

function getDateBounds(range: DateRange): { from: Date; to: Date } {
  const now = new Date()
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const endOfDay   = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59)

  switch (range) {
    case 'hoje':
      return { from: startOfDay(now), to: endOfDay(now) }
    case 'ontem': {
      const y = new Date(now); y.setDate(y.getDate() - 1)
      return { from: startOfDay(y), to: endOfDay(y) }
    }
    case '2dias': {
      const d = new Date(now); d.setDate(d.getDate() - 1)
      return { from: startOfDay(d), to: endOfDay(now) }
    }
    case '7dias': {
      const d = new Date(now); d.setDate(d.getDate() - 6)
      return { from: startOfDay(d), to: endOfDay(now) }
    }
    default:
      return { from: new Date(0), to: endOfDay(now) }
  }
}

const RESULT_BADGE: Record<string, string> = {
  GREEN:   'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400',
  RED:     'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400',
  VOID:    'bg-slate-100 dark:bg-slate-700/40 text-slate-600 dark:text-slate-400',
  PENDING: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400',
}
const RESULT_LABEL: Record<string, string> = {
  GREEN: '🟢 Green', RED: '🔴 Red', VOID: '⚪ Anulado', PENDING: '🟡 Pendente',
}

function HistoryTable({ tips }: { tips: Tip[] }) {
  const [range, setRange] = useState<DateRange>('7dias')
  const [resultFilter, setResultFilter] = useState<string>('Todos')
  const [histPage, setHistPage] = useState(1)
  const PER_PAGE = 10

  const filtered = useMemo(() => {
    const { from, to } = getDateBounds(range)
    return tips
      .filter(t => {
        const d = new Date(t.tipDate)
        return d >= from && d <= to
      })
      .filter(t => resultFilter === 'Todos' || (t.result || 'PENDING') === resultFilter)
      .sort((a, b) => new Date(b.tipDate).getTime() - new Date(a.tipDate).getTime())
  }, [tips, range, resultFilter])

  const totalHistPages = Math.ceil(filtered.length / PER_PAGE)
  const paginated = filtered.slice((histPage - 1) * PER_PAGE, histPage * PER_PAGE)

  // reset page when filters change
  useMemo(() => setHistPage(1), [range, resultFilter])

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })

  return (
    <div className="rounded-xl border bg-white dark:bg-surface-200 border-slate-200 dark:border-surface-400 overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 dark:border-surface-400">
        <div className="flex items-center gap-2">
          <CalendarDays size={16} className="text-slate-400" />
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Histórico de Tips</p>
          <span className="text-xs text-slate-400 bg-slate-100 dark:bg-surface-400 px-2 py-0.5 rounded-full">
            {filtered.length} registros
          </span>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Resultado */}
          {(['Todos', 'GREEN', 'RED', 'VOID', 'PENDING'] as const).map(r => (
            <button key={r} onClick={() => setResultFilter(r)}
              className={`text-xs font-medium px-2.5 py-1 rounded-lg border transition-all ${
                resultFilter === r
                  ? 'bg-green-600 border-green-600 text-white dark:bg-green-900/60 dark:border-green-700 dark:text-green-300'
                  : 'bg-white dark:bg-surface-300 border-slate-200 dark:border-surface-400 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}>
              {r === 'Todos' ? 'Todos' : RESULT_LABEL[r]}
            </button>
          ))}

          <div className="w-px h-4 bg-slate-200 dark:bg-surface-400 mx-1" />

          {/* Período */}
          {(Object.keys(DATE_RANGE_LABELS) as DateRange[]).map(r => (
            <button key={r} onClick={() => setRange(r)}
              className={`text-xs font-medium px-2.5 py-1 rounded-lg border transition-all ${
                range === r
                  ? 'bg-slate-800 dark:bg-slate-200 border-slate-800 dark:border-slate-200 text-slate-50 dark:text-slate-900'
                  : 'bg-white dark:bg-surface-300 border-slate-200 dark:border-surface-400 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}>
              {DATE_RANGE_LABELS[r]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {paginated.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-sm">
          <CalendarDays size={32} className="mx-auto mb-3 opacity-30" />
          Nenhuma tip encontrada nesse período.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-surface-400">
                {['Data', 'Campeonato / Sport', 'Evento', 'Mercado', 'Odd', 'Valor', 'Resultado'].map(h => (
                  <th key={h} className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 py-3 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map((tip, i) => {
                const status = tip.result || 'PENDING'
                return (
                  <tr key={tip.id}
                    className={`border-b border-slate-50 dark:border-surface-400/50 transition-colors hover:bg-slate-50 dark:hover:bg-surface-300/50 ${
                      i % 2 === 0 ? '' : 'bg-slate-50/50 dark:bg-surface-300/20'
                    }`}>
                    {/* Data */}
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400 font-mono">
                      {fmtDate(tip.tipDate)}
                    </td>
                    {/* Campeonato / Sport */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-xs text-slate-500 dark:text-slate-400">{tip.sport}</span>
                    </td>
                    {/* Evento */}
                    <td className="px-4 py-3 max-w-[200px]">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{tip.event}</p>
                      {tip.title !== tip.event && (
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">{tip.title}</p>
                      )}
                    </td>
                    {/* Mercado */}
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-600 dark:text-slate-300">
                      {tip.market}
                    </td>
                    {/* Odd */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {/* ALTERADO: Adicionado 'Odd' */}
                      <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">Odd @{tip.odds.toFixed(2)}</span>
                    </td>
                    {/* Valor */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-mono font-semibold text-sm text-emerald-600 dark:text-emerald-400">
                        {formatBRL(tip.stake)}
                      </span>
                    </td>
                    {/* Resultado */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${RESULT_BADGE[status] ?? RESULT_BADGE.PENDING}`}>
                        {RESULT_LABEL[status] ?? '🟡 Pendente'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginação da tabela */}
      {totalHistPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 dark:border-surface-400">
          <span className="text-xs text-slate-400">
            Página {histPage} de {totalHistPages} · {filtered.length} registros
          </span>
          <div className="flex items-center gap-1">
            <button disabled={histPage <= 1} onClick={() => setHistPage(p => p - 1)}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 dark:border-surface-400 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-surface-400 disabled:opacity-40 transition-colors">
              <ChevronLeft size={13} />
            </button>
            <button disabled={histPage >= totalHistPages} onClick={() => setHistPage(p => p + 1)}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 dark:border-surface-400 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-surface-400 disabled:opacity-40 transition-colors">
              <ChevronRightIcon size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────

export const TipsPage = () => {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'MASTER'

  const [tips,       setTips]       = useState<Tip[]>([])
  const [loading,    setLoading]    = useState(true)
  const [filter,     setFilter]     = useState<ResultFilter>('Todos')
  const [page,       setPage]       = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selected,   setSelected]   = useState<Tip | null>(null)
  const [resultForm, setResultForm] = useState({ result: 'GREEN', profit: '' })
  const [saving,     setSaving]     = useState(false)
  const [showBanner, setShowBanner] = useState(true)
  const [newTipOpen, setNewTipOpen] = useState(false)
  const [sharingTip, setSharingTip] = useState<Tip | null>(null)

  const load = async (p = 1) => {
    setLoading(true)
    try {
      const data = await tipsService.getAll(p, 9)
      setTips(data.tips); setTotalPages(data.totalPages); setPage(p)
    } finally { setLoading(false) }
  }

  useEffect(() => { load(1) }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta dica?')) return
    try {
      await tipsService.delete(id)
      toast.success('Dica removida.')
      load(page)
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erro ao excluir dica')
    }
  }

  const handleUpdateResult = async () => {
    if (!selected) return
    setSaving(true)
    try {
      await tipsService.updateResult(selected.id, resultForm.result, Number(resultForm.profit))
      toast.success('Resultado atualizado! 🎯'); setSelected(null); load(page)
    } catch { toast.error('Erro ao atualizar resultado') }
    finally { setSaving(false) }
  }

  const openResultModal = (tip: Tip) => {
    setSelected(tip)
    setResultForm({ result: tip.result || 'GREEN', profit: tip.profit?.toString() || '' })
  }

  const metrics = useMemo(() => {
    const greens  = tips.filter(t => t.result === 'GREEN')
    const reds    = tips.filter(t => t.result === 'RED')
    const voided  = tips.filter(t => t.result === 'VOID')
    const pending = tips.filter(t => !t.result || t.result === 'PENDING')
    const pnl     = tips.reduce((acc, t) => acc + (t.profit ?? 0), 0)
    const volume  = tips.reduce((acc, t) => acc + t.stake, 0)
    const fin     = greens.length + reds.length
    return {
      pnl, volume,
      winRate: fin > 0 ? (greens.length / fin) * 100 : 0,
      greens: greens.length, reds: reds.length,
      pending: pending.length, voided: voided.length,
    }
  }, [tips])

  const filtered = useMemo(
    () => filter === 'Todos' ? tips : tips.filter(t => getStatus(t) === filter),
    [tips, filter]
  )

  const inp = `w-full rounded-lg px-3 py-2.5 text-sm border transition-colors
    bg-white dark:bg-surface-300 border-slate-200 dark:border-surface-400
    text-slate-900 dark:text-white placeholder-slate-400
    focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/30`

  return (
    <div className="flex flex-col gap-6 relative pb-20">

      {/* Banner */}
      {showBanner && (
        <div className="flex items-start gap-3 rounded-xl p-4 border
          bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30">
          <Info size={16} className="mt-0.5 shrink-0 text-amber-500 dark:text-amber-400" />
          <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-300">
            <strong className="text-amber-900 dark:text-amber-200">Atenção:</strong> O stake exibido é a sugestão do tipster.
            Adapte conforme sua banca e gestão pessoal.
          </p>
          <button onClick={() => setShowBanner(false)} className="ml-auto shrink-0 text-amber-500 hover:text-amber-700 dark:hover:text-amber-200">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display font-semibold text-slate-900 dark:text-white">Dicas do Dia</h2>
          <p className="text-xs text-slate-500">{tips.length} dicas carregadas</p>
        </div>
        {isAdmin && (
          <button onClick={() => setNewTipOpen(true)}
            className="hidden lg:flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-lg shadow-green-500/20 transition-all active:scale-95">
            <Plus size={16} />Nova Dica
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl p-4 shadow-sm border bg-white dark:bg-surface-200 border-slate-200 dark:border-surface-400">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">P&amp;L</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center">
              <TrendingUp size={13} className="text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          {/* ALTERADO: De 'u' para formatBRL */}
          <p className={`text-xl font-bold font-mono ${metrics.pnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {metrics.pnl >= 0 ? '+' : ''}{formatBRL(metrics.pnl)}
          </p>
          <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400">
            {metrics.pnl >= 0 ? <ChevronUp size={10} className="text-emerald-500" /> : <ChevronDown size={10} className="text-rose-500" />}
            profit acumulado
          </div>
        </div>

        <div className="rounded-xl p-4 shadow-sm border bg-white dark:bg-surface-200 border-slate-200 dark:border-surface-400">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Win Rate</span>
            <div className="w-7 h-7 rounded-lg bg-sky-100 dark:bg-sky-500/10 flex items-center justify-center">
              <Target size={13} className="text-sky-600 dark:text-sky-400" />
            </div>
          </div>
          <p className="text-xl font-bold font-mono text-sky-600 dark:text-sky-400">{metrics.winRate.toFixed(1)}%</p>
          <div className="mt-2 h-1 rounded-full bg-slate-100 dark:bg-surface-400 overflow-hidden">
            <div className="h-full bg-sky-500 rounded-full transition-all" style={{ width: `${metrics.winRate}%` }} />
          </div>
        </div>

        <div className="rounded-xl p-4 shadow-sm border bg-white dark:bg-surface-200 border-slate-200 dark:border-surface-400">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Volume</span>
            <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-500/10 flex items-center justify-center">
              <DollarSign size={13} className="text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <p className="text-xl font-bold font-mono text-slate-900 dark:text-white">{formatBRL(metrics.volume)}</p>
          <p className="text-[10px] text-slate-400 mt-1">total apostado</p>
        </div>

        <div className="rounded-xl p-4 shadow-sm border bg-white dark:bg-surface-200 border-slate-200 dark:border-surface-400">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block mb-2">Proporção</span>
          <DoughnutChart greens={metrics.greens} reds={metrics.reds} pending={metrics.pending} voided={metrics.voided} />
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
              filter === f
                ? 'bg-green-600 border-green-600 text-white dark:bg-green-900/60 dark:border-green-700 dark:text-green-300'
                : 'bg-white dark:bg-surface-300 border-slate-200 dark:border-surface-400 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-surface-300'
            }`}>
            {FILTER_LABELS[f]}
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-400">{filtered.length} dica(s)</span>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border p-16 text-center bg-white dark:bg-surface-200 border-slate-200 dark:border-surface-400">
          <TrendingUp size={36} className="text-slate-300 dark:text-slate-700 mx-auto mb-4" />
          <p className="text-slate-500 text-sm">Nenhuma dica encontrada.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(tip => (
            <TipCard key={tip.id} tip={tip} isAdmin={isAdmin} onUpdateResult={openResultModal} onDelete={handleDelete} onShare={setSharingTip} />
          ))}
        </div>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button disabled={page <= 1}          onClick={() => load(page - 1)} className="btn-secondary text-sm disabled:opacity-40">← Anterior</button>
          <span className="text-sm text-slate-500">{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => load(page + 1)} className="btn-secondary text-sm disabled:opacity-40">Próxima →</button>
        </div>
      )}


      {/* ── Histórico em Tabela ── */}
      <HistoryTable tips={tips} />

      {/* FAB mobile */}
      {isAdmin && (
        <button onClick={() => setNewTipOpen(true)}
          className="fixed bottom-6 right-6 lg:hidden w-14 h-14 rounded-full bg-green-600 hover:bg-green-500 text-white shadow-2xl shadow-green-500/30 flex items-center justify-center transition-all active:scale-95 z-40">
          <Plus size={24} />
        </button>
      )}

      {/* Modal — Atualizar resultado */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Atualizar Resultado" size="sm">
        {selected && (
          <div className="flex flex-col gap-4">
            <div className="rounded-lg p-3 bg-slate-50 dark:bg-surface-300 border border-slate-200 dark:border-surface-400">
              <p className="text-sm font-medium text-slate-900 dark:text-white line-clamp-1">{selected.title}</p>
              {/* ALTERADO: Adicionado 'Odd @' */}
              <p className="text-xs text-slate-400 mt-0.5">{selected.event} · Odd @{selected.odds.toFixed(2)} · {formatBRL(selected.stake)}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Resultado</label>
              <select className={inp} value={resultForm.result} onChange={e => setResultForm(f => ({ ...f, result: e.target.value }))}>
                {[{ v: 'GREEN', l: '🟢 Green' }, { v: 'RED', l: '🔴 Red' }, { v: 'VOID', l: '⚪ Anulado' }]
                  .map(({ v, l }) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              {/* ALTERADO: Label de Profit (unidades) para Profit (R$) */}
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Profit (R$)</label>
              <input type="number" step="0.01" className={`${inp} font-mono`} placeholder="Ex: +0.85 ou -1.00"
                value={resultForm.profit} onChange={e => setResultForm(f => ({ ...f, profit: e.target.value }))} />
              
              {/* ALTERADO: Cálculo do retorno potencial real (Odd * Stake) */}
              <p className="text-[10px] text-slate-400 mt-1">
                Retorno potencial: {formatBRL(selected.odds * selected.stake)}
              </p>
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setSelected(null)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={handleUpdateResult} disabled={saving} className="btn-primary flex-1">
                {saving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block mr-2" />Salvando...</> : 'Salvar Resultado'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal — Nova Dica */}
      {newTipOpen && <NewTipModal onClose={() => setNewTipOpen(false)} onSaved={() => load(1)} />}

      {/* Modal — Compartilhar (Share) */}
      {sharingTip && (
        <ShareTipModal isOpen={!!sharingTip} onClose={() => setSharingTip(null)} tip={sharingTip} />
      )}
    </div>
  )
}