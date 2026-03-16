import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { tipsService } from '../services/tips.service'
import { TipCard } from '../components/ui/TipCard'
import { Modal } from '../components/ui/Modal'
import { TrendingUp, Filter } from 'lucide-react'
import toast from 'react-hot-toast'

interface Tip {
  id: string; title: string; description: string; sport: string
  event: string; market: string; odds: number; stake: number
  result?: string; profit?: number; tipDate: string
  author: { name: string; username: string }
}

const RESULTS = ['Todos', 'PENDING', 'GREEN', 'RED', 'VOID']

export const TipsPage = () => {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'MASTER'

  const [tips,       setTips]       = useState<Tip[]>([])
  const [loading,    setLoading]    = useState(true)
  const [filter,     setFilter]     = useState('Todos')
  const [page,       setPage]       = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selected,   setSelected]   = useState<Tip | null>(null)
  const [resultForm, setResultForm] = useState({ result: 'GREEN', profit: '' })
  const [saving,     setSaving]     = useState(false)

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

  const filtered = filter === 'Todos' ? tips : tips.filter(t => t.result === filter)

  const handleUpdateResult = async () => {
    if (!selected) return
    setSaving(true)
    try {
      await tipsService.updateResult(selected.id, resultForm.result, Number(resultForm.profit))
      toast.success('Resultado atualizado!')
      setSelected(null)
      load(page)
    } catch {
      toast.error('Erro ao atualizar resultado')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display font-semibold text-white">Todas as Dicas</h2>
          <p className="text-xs text-slate-500">{tips.length} dicas encontradas</p>
        </div>

        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-500" />
          {RESULTS.map(r => (
            <button
              key={r}
              onClick={() => setFilter(r)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                filter === r
                  ? 'bg-green-900/50 border-green-700 text-green-400'
                  : 'bg-surface-300 border-surface-400 text-slate-400 hover:text-white'
              }`}
            >
              {r === 'Todos' ? 'Todos' : r.charAt(0) + r.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-16 text-center">
          <TrendingUp size={36} className="text-slate-700 mx-auto mb-4" />
          <p className="text-slate-400">Nenhuma dica encontrada.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(tip => (
            <TipCard
              key={tip.id}
              tip={tip}
              isAdmin={isAdmin}
              onUpdateResult={setSelected}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button disabled={page <= 1}           onClick={() => load(page - 1)} className="btn-secondary text-sm disabled:opacity-40">← Anterior</button>
          <span className="text-sm text-slate-400">{page} / {totalPages}</span>
          <button disabled={page >= totalPages}  onClick={() => load(page + 1)} className="btn-secondary text-sm disabled:opacity-40">Próxima →</button>
        </div>
      )}

      {/* Update result modal */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Atualizar Resultado" size="sm">
        {selected && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-slate-400">{selected.title}</p>
            <div>
              <label className="label">Resultado</label>
              <select
                className="input-field"
                value={resultForm.result}
                onChange={e => setResultForm(f => ({ ...f, result: e.target.value }))}
              >
                {['GREEN', 'RED', 'VOID'].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Profit (unidades)</label>
              <input
                type="number"
                step="0.01"
                className="input-field"
                placeholder="Ex: 0.85 ou -1"
                value={resultForm.profit}
                onChange={e => setResultForm(f => ({ ...f, profit: e.target.value }))}
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setSelected(null)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={handleUpdateResult} disabled={saving} className="btn-primary flex-1">
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
