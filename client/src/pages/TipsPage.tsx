import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { tipsService } from '../services/tips.service'
import { Modal } from '../components/ui/Modal'
import {
  TrendingUp, Target, Zap, Filter,
  Edit2, Trash2, ChevronUp, ChevronDown, Info, X,
} from 'lucide-react'
import toast from 'react-hot-toast'

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
  result?: string      // 'GREEN' | 'RED' | 'VOID' | 'PENDING' | undefined
  profit?: number
  tipDate: string
  author: { name: string; username: string }
}

type ResultFilter = 'Todos' | 'PENDING' | 'GREEN' | 'RED' | 'VOID'

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string; border: string }> = {
  GREEN:   { label: 'Green ✓',  bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400', border: 'border-l-emerald-500' },
  RED:     { label: 'Red ✗',    bg: 'bg-rose-500/15',    text: 'text-rose-400',    dot: 'bg-rose-400',    border: 'border-l-rose-500'    },
  VOID:    { label: 'Anulado',  bg: 'bg-slate-500/20',   text: 'text-slate-400',   dot: 'bg-slate-400',   border: 'border-l-slate-600'   },
  PENDING: { label: 'Pendente', bg: 'bg-amber-500/15',   text: 'text-amber-400',   dot: 'bg-amber-400',   border: 'border-l-amber-500'   },
}

const getStatus = (tip: Tip) => tip.result || 'PENDING'
const cfg = (tip: Tip) => STATUS_CONFIG[getStatus(tip)] ?? STATUS_CONFIG.PENDING

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

const FILTERS: ResultFilter[] = ['Todos', 'PENDING', 'GREEN', 'RED', 'VOID']
const FILTER_LABELS: Record<ResultFilter, string> = {
  Todos: 'Todos', PENDING: 'Pendente', GREEN: 'Green ✓', RED: 'Red ✗', VOID: 'Anulado',
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

function StatusBadge({ tip }: { tip: Tip }) {
  const c = cfg(tip)
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  )
}

function MiniDonut({ greens, reds }: { greens: number; reds: number }) {
  const total = greens + reds || 1
  return (
    <div className="flex flex-col gap-1.5 w-36">
      <div className="flex items-center gap-1.5 text-xs text-slate-400">
        <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
        Green
        <span className="ml-auto text-emerald-400 font-semibold">{greens}</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
        <div className="h-full bg-emerald-400 rounded-full transition-all" style={{ width: `${(greens / total) * 100}%` }} />
      </div>
      <div className="flex items-center gap-1.5 text-xs text-slate-400">
        <span className="w-2 h-2 rounded-full bg-rose-400 inline-block" />
        Red
        <span className="ml-auto text-rose-400 font-semibold">{reds}</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
        <div className="h-full bg-rose-400 rounded-full transition-all" style={{ width: `${(reds / total) * 100}%` }} />
      </div>
    </div>
  )
}

function TipCard({
  tip, isAdmin,
  onUpdateResult, onDelete,
}: {
  tip: Tip
  isAdmin: boolean
  onUpdateResult: (t: Tip) => void
  onDelete: (id: string) => void
}) {
  const c = cfg(tip)
  return (
    <div className={`bg-surface-200 border border-surface-400 border-l-4 ${c.border} rounded-xl p-5 shadow-sm hover:shadow-md hover:border-surface-300 transition-all group`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-1">
        <h3 className="font-semibold text-sm text-white leading-snug line-clamp-2 flex-1">
          {tip.title}
        </h3>
        {isAdmin && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button
              onClick={() => onUpdateResult(tip)}
              className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-white hover:bg-surface-400 transition-colors"
              title="Atualizar resultado"
            >
              <Edit2 size={13} />
            </button>
            <button
              onClick={() => onDelete(tip.id)}
              className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              title="Excluir dica"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>

      {/* Sport + Event */}
      <p className="text-xs text-slate-500 mb-1">
        <span className="text-slate-400">{tip.sport}</span> · {tip.event}
      </p>

      {/* Market */}
      <p className="text-xs text-slate-400 mb-4 leading-relaxed">{tip.market}</p>

      {/* Valores */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-center">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Odd</p>
          <p className="text-base font-bold font-mono text-white">@{tip.odds.toFixed(2)}</p>
        </div>
        <div className="h-8 w-px bg-surface-400" />
        <div className="text-center">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Stake*</p>
          <p className="text-base font-bold font-mono text-emerald-400">{tip.stake}u</p>
        </div>
        {tip.profit !== undefined && tip.profit !== null && (
          <>
            <div className="h-8 w-px bg-surface-400" />
            <div className="text-center">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Profit</p>
              <p className={`text-base font-bold font-mono ${tip.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {tip.profit >= 0 ? '+' : ''}{tip.profit.toFixed(2)}u
              </p>
            </div>
          </>
        )}
        <div className="h-8 w-px bg-surface-400" />
        <StatusBadge tip={tip} />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-surface-400">
        <span className="text-[10px] text-slate-500">{formatDate(tip.tipDate)}</span>
        <span className="text-[10px] text-slate-600 italic">*stake tipster</span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────

export const TipsPage = () => {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'MASTER'

  const [tips,        setTips]        = useState<Tip[]>([])
  const [loading,     setLoading]     = useState(true)
  const [filter,      setFilter]      = useState<ResultFilter>('Todos')
  const [page,        setPage]        = useState(1)
  const [totalPages,  setTotalPages]  = useState(1)
  const [selected,    setSelected]    = useState<Tip | null>(null)
  const [resultForm,  setResultForm]  = useState({ result: 'GREEN', profit: '' })
  const [saving,      setSaving]      = useState(false)
  const [showBanner,  setShowBanner]  = useState(true)

  // ── Load ──────────────────────────────────
  const load = async (p = 1) => {
    setLoading(true)
    try {
      const data = await tipsService.getAll(p, 9)
      setTips(data.tips)
      setTotalPages(data.totalPages)
      setPage(p)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(1) }, [])

  // ── Delete ────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta dica?')) return
    try {
      await tipsService.delete(id)
      toast.success('Dica removida.')
      load(page)
    } catch {
      toast.error('Erro ao excluir dica')
    }
  }

  // ── Update result ─────────────────────────
  const handleUpdateResult = async () => {
    if (!selected) return
    setSaving(true)
    try {
      await tipsService.updateResult(selected.id, resultForm.result, Number(resultForm.profit))
      toast.success('Resultado atualizado! 🎯')
      setSelected(null)
      load(page)
    } catch {
      toast.error('Erro ao atualizar resultado')
    } finally {
      setSaving(false)
    }
  }

  const openResultModal = (tip: Tip) => {
    setSelected(tip)
    setResultForm({ result: tip.result || 'GREEN', profit: tip.profit?.toString() || '' })
  }

  // ── Métricas ──────────────────────────────
  const metrics = useMemo(() => {
    const greens   = tips.filter(t => t.result === 'GREEN')
    const reds     = tips.filter(t => t.result === 'RED')
    const pendente = tips.filter(t => !t.result || t.result === 'PENDING')
    const lucro    = tips.reduce((acc, t) => acc + (t.profit ?? 0), 0)
    const finalizadas = greens.length + reds.length
    const taxaAcerto  = finalizadas > 0 ? (greens.length / finalizadas) * 100 : 0
    return { lucro, taxaAcerto, ativas: pendente.length, greens: greens.length, reds: reds.length }
  }, [tips])

  // ── Filter ────────────────────────────────
  const filtered = useMemo(
    () => filter === 'Todos' ? tips : tips.filter(t => getStatus(t) === filter),
    [tips, filter]
  )

  // ─────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">

      {/* ── Banner disclaimer ── */}
      {showBanner && (
        <div className="relative flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-sm text-amber-300">
          <Info size={16} className="mt-0.5 shrink-0 text-amber-400" />
          <p className="leading-relaxed text-xs">
            <strong className="text-amber-200">Atenção:</strong> O stake exibido é a sugestão do tipster.
            Adapte o valor de acordo com o tamanho da sua banca e sua gestão pessoal.
          </p>
          <button onClick={() => setShowBanner(false)} className="ml-auto shrink-0 text-amber-400 hover:text-amber-200">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Header + Métricas ── */}
      <div>
        <div className="mb-4">
          <h2 className="font-display font-semibold text-white">Dicas do Dia</h2>
          <p className="text-xs text-slate-500">{tips.length} dicas carregadas</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Lucro/Profit */}
          <div className="card border border-surface-400 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Profit Total</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp size={13} className="text-emerald-400" />
              </div>
            </div>
            <p className={`text-xl font-bold font-mono ${metrics.lucro >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {metrics.lucro >= 0 ? '+' : ''}{metrics.lucro.toFixed(2)}u
            </p>
            <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-500">
              {metrics.lucro >= 0
                ? <ChevronUp size={11} className="text-emerald-500" />
                : <ChevronDown size={11} className="text-rose-500" />}
              acumulado no período
            </div>
          </div>

          {/* Taxa de acerto */}
          <div className="card border border-surface-400 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Taxa Acerto</span>
              <div className="w-7 h-7 rounded-lg bg-sky-500/10 flex items-center justify-center">
                <Target size={13} className="text-sky-400" />
              </div>
            </div>
            <p className="text-xl font-bold font-mono text-sky-400">{metrics.taxaAcerto.toFixed(1)}%</p>
            <div className="mt-2 h-1 rounded-full bg-surface-400 overflow-hidden">
              <div className="h-full bg-sky-400 rounded-full transition-all" style={{ width: `${metrics.taxaAcerto}%` }} />
            </div>
          </div>

          {/* Dicas ativas */}
          <div className="card border border-surface-400 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Pendentes</span>
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Zap size={13} className="text-amber-400" />
              </div>
            </div>
            <p className="text-xl font-bold font-mono text-amber-400">{metrics.ativas}</p>
            <p className="text-[10px] text-slate-500 mt-1">{tips.length} total de dicas</p>
          </div>

          {/* G/R */}
          <div className="card border border-surface-400 p-4">
            <div className="mb-2">
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Resultado</span>
            </div>
            <MiniDonut greens={metrics.greens} reds={metrics.reds} />
          </div>
        </div>
      </div>

      {/* ── Filtros ── */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter size={14} className="text-slate-500" />
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
              filter === f
                ? 'bg-green-900/50 border-green-700 text-green-400'
                : 'bg-surface-300 border-surface-400 text-slate-400 hover:text-white hover:border-surface-300'
            }`}
          >
            {FILTER_LABELS[f]}
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-500">{filtered.length} dica(s)</span>
      </div>

      {/* ── Grid ── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card border border-surface-400 p-16 text-center">
          <TrendingUp size={36} className="text-slate-700 mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Nenhuma dica encontrada.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(tip => (
            <TipCard
              key={tip.id}
              tip={tip}
              isAdmin={isAdmin}
              onUpdateResult={openResultModal}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* ── Paginação ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button disabled={page <= 1}          onClick={() => load(page - 1)} className="btn-secondary text-sm disabled:opacity-40">← Anterior</button>
          <span className="text-sm text-slate-400">{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => load(page + 1)} className="btn-secondary text-sm disabled:opacity-40">Próxima →</button>
        </div>
      )}

      {/* ── Modal Atualizar Resultado ── */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Atualizar Resultado" size="sm">
        {selected && (
          <div className="flex flex-col gap-4">
            {/* Dica info */}
            <div className="bg-surface-300 border border-surface-400 rounded-lg p-3">
              <p className="text-sm font-medium text-white line-clamp-1">{selected.title}</p>
              <p className="text-xs text-slate-400 mt-0.5">{selected.event} · @{selected.odds.toFixed(2)} · {selected.stake}u</p>
            </div>

            <div>
              <label className="label">Resultado</label>
              <select
                className="input-field"
                value={resultForm.result}
                onChange={e => setResultForm(f => ({ ...f, result: e.target.value }))}
              >
                {[
                  { v: 'GREEN', l: 'Green ✓' },
                  { v: 'RED',   l: 'Red ✗'   },
                  { v: 'VOID',  l: 'Anulado'  },
                ].map(({ v, l }) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>

            <div>
              <label className="label">Profit (unidades)</label>
              <input
                type="number"
                step="0.01"
                className="input-field font-mono"
                placeholder="Ex: +0.85 ou -1.00"
                value={resultForm.profit}
                onChange={e => setResultForm(f => ({ ...f, profit: e.target.value }))}
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Retorno potencial: +{((selected.odds - 1) * selected.stake).toFixed(2)}u
              </p>
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={() => setSelected(null)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={handleUpdateResult} disabled={saving} className="btn-primary flex-1">
                {saving
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block mr-2" />Salvando...</>
                  : 'Salvar Resultado'
                }
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
