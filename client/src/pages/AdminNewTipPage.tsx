import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { tipsService } from '../services/tips.service'
import { TrendingUp, ChevronLeft, Zap } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { addLog } from './SystemLogPage'
import toast from 'react-hot-toast'

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const SPORTS  = ['Futebol', 'Basquete', 'Tênis', 'Hóquei', 'Americano', 'Outros']
const MARKETS = [
  'Resultado (1X2)', 'Over/Under', 'BTTS', 'Handicap Asiático',
  'Dupla Chance', 'Placar Exato', 'Outros',
]

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export const AdminNewTipPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    title:       '',
    description: '',
    sport:       'Futebol',
    event:       '',
    market:      'Resultado (1X2)',
    odds:        '',
    stake:       '',
    tipDate:     '',
  })

  const set = (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await tipsService.create({
        ...form,
        odds:    Number(form.odds),
        stake:   Number(form.stake),
        tipDate: new Date(form.tipDate).toISOString(),
      })
      if (user) {
        addLog({
          userEmail: user.email,
          userName:  user.name,
          userRole:  user.role,
          category:  'Dicas',
          action:    'Dica criada',
          detail:    `${form.title} | ${form.event} | @${form.odds}`,
        })
      }
      toast.success('Dica criada com sucesso! 🟢')
      navigate('/tips')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erro ao criar dica'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const retornoPotencial = form.odds && form.stake
    ? ((Number(form.odds) - 1) * Number(form.stake)).toFixed(2)
    : null

  // ─────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────

  return (
    <div className="max-w-2xl">

      {/* ── Page Header ── */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-surface-400 transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="w-9 h-9 rounded-xl bg-green-900/50 flex items-center justify-center text-green-400">
          <TrendingUp size={18} />
        </div>
        <div>
          <h2 className="font-display font-semibold text-white">Nova Dica</h2>
          <p className="text-xs text-slate-500">Preencha todos os campos para publicar em Dicas do Dia</p>
        </div>
      </div>

      {/* ── Form Card ── */}
      <div className="card border border-surface-400">

        {/* Card Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-400">
          <p className="text-sm font-medium text-white">Detalhes da dica</p>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Dicas do Dia</span>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-6">

          {/* Título */}
          <div>
            <label className="label">Título da dica *</label>
            <input
              className="input-field"
              placeholder="Ex: Over 2.5 — Manchester City vs Arsenal"
              value={form.title}
              onChange={set('title')}
              required
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="label">Análise / Descrição *</label>
            <textarea
              className="input-field min-h-[100px] resize-none"
              placeholder="Explique o raciocínio por trás da entrada..."
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              required
            />
          </div>

          {/* Esporte + Evento */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Esporte *</label>
              <select className="input-field" value={form.sport} onChange={set('sport')}>
                {SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Evento / Jogo *</label>
              <input
                className="input-field"
                placeholder="Ex: City vs Arsenal"
                value={form.event}
                onChange={set('event')}
                required
              />
            </div>
          </div>

          {/* Mercado + Odd + Stake */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Mercado *</label>
              <select className="input-field" value={form.market} onChange={set('market')}>
                {MARKETS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Odd *</label>
              <input
                type="number" step="0.01" min="1.01"
                className="input-field font-mono"
                placeholder="2.10"
                value={form.odds}
                onChange={set('odds')}
                required
              />
            </div>
            <div>
              <label className="label">Stake (unid.) *</label>
              <input
                type="number" step="0.5" min="0.5"
                className="input-field font-mono"
                placeholder="1.0"
                value={form.stake}
                onChange={set('stake')}
                required
              />
            </div>
          </div>

          {/* Data */}
          <div>
            <label className="label">Data/Hora do jogo *</label>
            <input
              type="datetime-local"
              className="input-field"
              value={form.tipDate}
              onChange={set('tipDate')}
              required
            />
          </div>

          {/* ── Preview (igual ao design do DicasDoDia) ── */}
          {retornoPotencial && (
            <div className="bg-green-900/20 border border-green-800/40 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Zap size={13} className="text-green-400" />
                <p className="text-xs text-green-400 font-semibold">Prévia do card</p>
              </div>

              {/* Mini card preview */}
              <div className="bg-surface-300 border border-surface-400 border-l-4 border-l-amber-500 rounded-lg p-3 mb-3">
                <p className="text-sm font-semibold text-white truncate">{form.title || 'Título da dica'}</p>
                <p className="text-xs text-slate-400 mt-0.5">{form.event || 'Evento'} · {form.market}</p>
              </div>

              <div className="flex gap-6 text-sm">
                <div>
                  <span className="text-slate-400 text-xs">Odd</span>
                  <p className="font-mono font-semibold text-white">@{form.odds}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-xs">Stake</span>
                  <p className="font-mono font-semibold text-emerald-400">{form.stake}u</p>
                </div>
                <div>
                  <span className="text-slate-400 text-xs">Retorno potencial</span>
                  <p className="font-mono font-semibold text-green-400">+{retornoPotencial}u</p>
                </div>
                <div>
                  <span className="text-slate-400 text-xs">Status</span>
                  <p className="font-mono font-semibold text-amber-400">Pendente</p>
                </div>
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <p className="text-[10px] text-slate-500 italic border-t border-surface-400 pt-4">
            * O stake exibido é uma sugestão. Cada apostador deve adaptar conforme sua banca e gestão pessoal.
          </p>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center gap-2"
            >
              {loading
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Publicando...</>
                : '🟢 Publicar em Dicas do Dia'
              }
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
