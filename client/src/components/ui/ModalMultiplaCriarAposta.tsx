import { useEffect, useState, useMemo } from 'react'
import { Plus, X, Edit2, Layers } from 'lucide-react'
import toast from 'react-hot-toast'
import { SportSelect } from './SportSelect'

interface MercadoJogo {
  selecao: string   // Ex: "Newcastle United", "Mais de 1.5"
  mercado: string   // Ex: "Resultado Final", "Total de Gols"
}

interface JogoMultiplaCriarAposta {
  mandante:  string
  visitante: string
  odd:       string
  resultado: string
  mercados:  MercadoJogo[]
}

interface ModalMultiplaCriarApostaProps {
  isOpen:      boolean
  onClose:     () => void
  onSave:      (data: any, id?: string) => Promise<void>
  initialData?: any
}

const formatDateForInput = (dateString?: string) => {
  if (!dateString) return ''
  const d = new Date(dateString)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

const emptyJogo = (): JogoMultiplaCriarAposta => ({
  mandante:  '',
  visitante: '',
  odd:       '',
  resultado: 'PENDING',
  mercados:  [{ selecao: '', mercado: '' }],
})

export const ModalMultiplaCriarAposta = ({
  isOpen, onClose, onSave, initialData,
}: ModalMultiplaCriarApostaProps) => {
  const [dataAposta, setDataAposta] = useState('')
  const [stake,      setStake]      = useState('')
  const [sport,      setSport]      = useState('')
  const [linkAposta, setLinkAposta] = useState('')
  const [resultado,  setResultado]  = useState('PENDING')
  const [profit,     setProfit]     = useState('')
  const [jogos,      setJogos]      = useState<JogoMultiplaCriarAposta[]>([emptyJogo()])
  const [saving,     setSaving]     = useState(false)

  useEffect(() => {
    if (!isOpen) return
    if (initialData) {
      setDataAposta(formatDateForInput(initialData.tipDate))
      setStake(initialData.stake?.toString() || '')
      setSport(initialData.sport || '')
      setLinkAposta(initialData.linkAposta || '')
      setResultado(initialData.result || 'PENDING')
      setProfit(initialData.profit != null ? initialData.profit.toString() : '')
      setJogos(initialData.jogos?.length > 0 ? initialData.jogos : [emptyJogo()])
    } else {
      setDataAposta('')
      setStake('')
      setSport('')
      setLinkAposta('')
      setResultado('PENDING')
      setProfit('')
      setJogos([emptyJogo()])
    }
  }, [isOpen, initialData])

  const oddTotal = useMemo(() =>
    jogos.reduce((acc, j) => {
      const o = Number(j.odd)
      return o > 0 && !isNaN(o) ? acc * o : acc
    }, 1).toFixed(2),
  [jogos])

  useEffect(() => {
    const s = Number(stake)
    const o = Number(oddTotal)
    if (resultado === 'GREEN' && s > 0 && o > 0) setProfit((s * (o - 1)).toFixed(2))
    else if (resultado === 'RED'  && s > 0) setProfit((-s).toFixed(2))
    else if (resultado === 'VOID') setProfit('0')
    else setProfit('')
  }, [resultado, stake, oddTotal])

  if (!isOpen) return null

  // ── Jogo handlers ──────────────────────────────────────────────────────────
  const addJogo = () => setJogos(p => [...p, emptyJogo()])
  const removeJogo = (i: number) => setJogos(p => p.filter((_, idx) => idx !== i))
  const updateJogo = (i: number, field: keyof Omit<JogoMultiplaCriarAposta, 'mercados'>, val: string) =>
    setJogos(p => p.map((j, idx) => idx === i ? { ...j, [field]: val } : j))

  // ── Mercado handlers ────────────────────────────────────────────────────────
  const addMercado = (jogoIdx: number) =>
    setJogos(p => p.map((j, i) =>
      i === jogoIdx ? { ...j, mercados: [...j.mercados, { selecao: '', mercado: '' }] } : j
    ))
  const removeMercado = (jogoIdx: number, mIdx: number) =>
    setJogos(p => p.map((j, i) =>
      i === jogoIdx ? { ...j, mercados: j.mercados.filter((_, mi) => mi !== mIdx) } : j
    ))
  const updateMercado = (jogoIdx: number, mIdx: number, field: keyof MercadoJogo, val: string) =>
    setJogos(p => p.map((j, i) =>
      i === jogoIdx
        ? { ...j, mercados: j.mercados.map((m, mi) => mi === mIdx ? { ...m, [field]: val } : m) }
        : j
    ))

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!dataAposta || !stake) { toast.error('Preencha data e stake'); return }
    for (const j of jogos) {
      if (!j.mandante || !j.visitante || !j.odd) { toast.error('Preencha todos os jogos'); return }
      for (const m of j.mercados) {
        if (!m.selecao || !m.mercado) { toast.error('Preencha todos os mercados dos jogos'); return }
      }
    }

    setSaving(true)
    try {
      const numJogos = jogos.length
      await onSave({
        event:       `Múltipla Criar Aposta (${numJogos} jogos)`,
        title:       `Múltipla CA — ${numJogos} jogos`,
        description: 'Múltipla com Criar Aposta',
        sport:       sport || 'Futebol',
        market:      'Múltipla / Criar Aposta',
        odds:        Number(oddTotal),
        stake:       Number(stake),
        tipDate:     new Date(dataAposta).toISOString(),
        result:      resultado,
        profit:      profit ? Number(profit) : null,
        isMultipla:  true,
        jogos,
        linkAposta:  linkAposta.trim() || null,
      }, initialData?.id)

      toast.success(initialData ? 'Bilhete atualizado!' : 'Bilhete salvo!')
      onClose()
    } catch {
      toast.error('Erro ao salvar bilhete')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-surface-100 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="p-5 flex justify-between items-center border-b border-surface-300 shrink-0">
          <h3 className="font-display font-black text-xl text-white flex items-center gap-2 italic tracking-wide">
            {initialData
              ? <Edit2 className="text-purple-400" size={20} />
              : <Layers className="text-purple-400" size={20} />}
            {initialData ? 'Editar Bilhete' : 'Múltipla + Criar Aposta'}
          </h3>
          <button onClick={onClose} className="p-2 -mr-2 text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto custom-scrollbar flex flex-col gap-5">

          {/* Data + Stake + Esporte + Link */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Data</label>
              <input type="datetime-local" value={dataAposta} onChange={e => setDataAposta(e.target.value)}
                className="input-field py-2.5 px-3 w-full bg-surface-200" required />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Stake (R$)</label>
              <input type="number" step="0.01" value={stake} onChange={e => setStake(e.target.value)}
                placeholder="Ex: 10.00" className="input-field py-2.5 px-3 w-full bg-surface-200" required />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Esporte *</label>
              <SportSelect value={sport} onChange={setSport} required />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Link da Aposta</label>
              <input type="url" value={linkAposta} onChange={e => setLinkAposta(e.target.value)}
                placeholder="https://www.betano.bet.br/bookingcode/..."
                className="input-field py-2.5 px-3 w-full bg-surface-200 text-sm" />
            </div>
          </div>

          {/* Jogos */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Jogos do Bilhete
              </label>
              <button type="button" onClick={addJogo}
                className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-surface-300 hover:bg-surface-300 transition-colors">
                <Plus size={14} /> Adicionar Jogo
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {jogos.map((jogo, jogoIdx) => (
                <div key={jogoIdx} className="bg-surface-100/50 rounded-xl border border-surface-300 overflow-hidden">

                  {/* Jogo header */}
                  <div className="flex items-center justify-between px-4 py-2.5 bg-purple-500/10 border-b border-surface-300">
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">
                      Jogo {jogoIdx + 1}
                    </span>
                    {jogos.length > 1 && (
                      <button type="button" onClick={() => removeJogo(jogoIdx)}
                        className="text-slate-500 hover:text-red-400 transition-colors p-1">
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  <div className="p-4 flex flex-col gap-3">
                    {/* Times + Odd */}
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Mandante</label>
                        <input type="text" value={jogo.mandante}
                          onChange={e => updateJogo(jogoIdx, 'mandante', e.target.value)}
                          placeholder="Ex: Newcastle" className="input-field py-2 px-2.5 w-full bg-surface-200 text-sm" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Visitante</label>
                        <input type="text" value={jogo.visitante}
                          onChange={e => updateJogo(jogoIdx, 'visitante', e.target.value)}
                          placeholder="Ex: Sunderland" className="input-field py-2 px-2.5 w-full bg-surface-200 text-sm" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Odd</label>
                        <input type="number" step="0.01" value={jogo.odd}
                          onChange={e => updateJogo(jogoIdx, 'odd', e.target.value)}
                          placeholder="2.05" className="input-field py-2 px-2.5 w-full bg-surface-200 text-sm" />
                      </div>
                    </div>

                    {/* Resultado do jogo */}
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Resultado do Jogo</label>
                      <select value={jogo.resultado} onChange={e => updateJogo(jogoIdx, 'resultado', e.target.value)}
                        className="input-field py-2 px-2.5 w-full bg-surface-200 text-sm">
                        <option value="PENDING">— Pendente —</option>
                        <option value="GREEN">✅ Green</option>
                        <option value="RED">❌ Red</option>
                        <option value="VOID">⚪ Anulado</option>
                      </select>
                    </div>

                    {/* Mercados do jogo */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-[9px] font-bold text-purple-400 uppercase tracking-widest">
                          Mercados / Seleções
                        </label>
                        <button type="button" onClick={() => addMercado(jogoIdx)}
                          className="text-[10px] font-bold text-slate-500 hover:text-white flex items-center gap-1 px-2 py-1 rounded border border-surface-400 hover:bg-surface-300 transition-colors">
                          <Plus size={11} /> Mercado
                        </button>
                      </div>
                      <div className="flex flex-col gap-2">
                        {jogo.mercados.map((m, mIdx) => (
                          <div key={mIdx} className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 text-[10px] font-bold flex items-center justify-center shrink-0">
                              {mIdx + 1}
                            </span>
                            <input type="text" value={m.selecao}
                              onChange={e => updateMercado(jogoIdx, mIdx, 'selecao', e.target.value)}
                              placeholder="Seleção (ex: Newcastle United)"
                              className="input-field py-1.5 px-2.5 flex-1 bg-surface-200 text-xs" />
                            <input type="text" value={m.mercado}
                              onChange={e => updateMercado(jogoIdx, mIdx, 'mercado', e.target.value)}
                              placeholder="Mercado (ex: Resultado Final)"
                              className="input-field py-1.5 px-2.5 flex-1 bg-surface-200 text-xs" />
                            {jogo.mercados.length > 1 && (
                              <button type="button" onClick={() => removeMercado(jogoIdx, mIdx)}
                                className="text-slate-500 hover:text-red-400 transition-colors p-1 shrink-0">
                                <X size={13} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resultado geral */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Resultado Geral</label>
            <select value={resultado} onChange={e => setResultado(e.target.value)}
              className="input-field py-2.5 px-3 w-full bg-surface-200">
              <option value="PENDING">— Pendente —</option>
              <option value="GREEN">✅ Green</option>
              <option value="RED">❌ Red</option>
              <option value="VOID">⚪ Anulado</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-surface-300 shrink-0 bg-surface-100 rounded-b-2xl space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center justify-between bg-purple-500/10 border border-purple-500/20 rounded-xl p-3">
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Odd Total</span>
              <span className="text-xl font-black text-purple-300">{oddTotal}</span>
            </div>
            <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Lucro</span>
              <span className="text-xl font-black text-emerald-400">
                R$ {profit ? Number(profit).toFixed(2) : '0.00'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl font-bold text-sm text-slate-400 border border-surface-300 hover:bg-surface-300 hover:text-white transition-all">
              Cancelar
            </button>
            <button onClick={handleSubmit} disabled={saving}
              className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/20 disabled:opacity-50 transition-all">
              {saving ? 'Salvando...' : 'Salvar Bilhete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
