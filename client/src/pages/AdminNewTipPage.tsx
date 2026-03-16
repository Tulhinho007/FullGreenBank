import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { tipsService } from '../services/tips.service'
import { TrendingUp } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { addLog } from './SystemLogPage'
import toast from 'react-hot-toast'

const SPORTS  = ['Futebol','Basquete','Tênis','Hóquei','Americano','Outros']
const MARKETS = ['Resultado (1X2)','Over/Under','BTTS','Handicap Asiático','Dupla Chance','Placar Exato','Outros']

export const AdminNewTipPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '', description: '', sport: 'Futebol', event: '',
    market: 'Resultado (1X2)', odds: '', stake: '', tipDate: '',
  })

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await tipsService.create({
        ...form,
        odds: Number(form.odds),
        stake: Number(form.stake),
        tipDate: new Date(form.tipDate).toISOString(),
      })
      if (user) addLog({ userEmail: user.email, userName: user.name, userRole: user.role, category: 'Dicas', action: 'Dica criada', detail: `${form.title} | ${form.event} | @${form.odds}` })
      toast.success('Dica criada com sucesso! 🟢')
      navigate('/tips')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erro ao criar dica'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-green-900/50 flex items-center justify-center text-green-400">
          <TrendingUp size={18} />
        </div>
        <div>
          <h2 className="font-display font-semibold text-white">Nova Dica</h2>
          <p className="text-xs text-slate-500">Preencha todos os campos para publicar</p>
        </div>
      </div>

      <div className="card border border-surface-400 p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Título */}
          <div>
            <label className="label">Título da dica *</label>
            <input className="input-field" placeholder="Ex: Over 2.5 — Manchester City vs Arsenal" value={form.title} onChange={set('title')} required />
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
              <input className="input-field" placeholder="Ex: City vs Arsenal" value={form.event} onChange={set('event')} required />
            </div>
          </div>

          {/* Mercado + Odd + Stake */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1">
              <label className="label">Mercado *</label>
              <select className="input-field" value={form.market} onChange={set('market')}>
                {MARKETS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Odd *</label>
              <input type="number" step="0.01" min="1.01" className="input-field font-mono" placeholder="2.10" value={form.odds} onChange={set('odds')} required />
            </div>
            <div>
              <label className="label">Stake (unid.) *</label>
              <input type="number" step="0.5" min="0.5" className="input-field font-mono" placeholder="1.0" value={form.stake} onChange={set('stake')} required />
            </div>
          </div>

          {/* Data */}
          <div>
            <label className="label">Data/Hora do jogo *</label>
            <input type="datetime-local" className="input-field" value={form.tipDate} onChange={set('tipDate')} required />
          </div>

          {/* Preview */}
          {form.odds && form.stake && (
            <div className="bg-green-900/20 border border-green-800/40 rounded-lg p-4">
              <p className="text-xs text-green-400 font-semibold mb-2">Prévia da entrada</p>
              <div className="flex gap-6 text-sm">
                <div><span className="text-slate-400 text-xs">Odd:</span> <span className="font-mono font-semibold text-white">@{form.odds}</span></div>
                <div><span className="text-slate-400 text-xs">Stake:</span> <span className="font-mono font-semibold text-white">{form.stake}u</span></div>
                <div><span className="text-slate-400 text-xs">Retorno potencial:</span> <span className="font-mono font-semibold text-green-400">+{((Number(form.odds) - 1) * Number(form.stake)).toFixed(2)}u</span></div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
              {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Publicando...</> : '🟢 Publicar Dica'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
