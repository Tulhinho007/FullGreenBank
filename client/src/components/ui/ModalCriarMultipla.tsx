import { useEffect, useState, useMemo } from 'react'
import { Plus, X, ListPlus, Edit2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface JogoMultipla {
  mandante: string
  visitante: string
  mercado: string
  odd: string
  resultado: string
}

interface ModalCriarMultiplaProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any, id?: string) => Promise<void>
  initialData?: any
}

const formatDateForInput = (dateString?: string) => {
  if (!dateString) return ''
  const d = new Date(dateString)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0,16)
}

export const ModalCriarMultipla = ({ isOpen, onClose, onSave, initialData }: ModalCriarMultiplaProps) => {
  const [dataAposta, setDataAposta] = useState('')
  const [stake, setStake] = useState('')
  const [resultado, setResultado] = useState('PENDING')
  const [profit, setProfit] = useState('')
  const [jogos, setJogos] = useState<JogoMultipla[]>([
    { mandante: '', visitante: '', mercado: '', odd: '', resultado: 'PENDING' }
  ])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setDataAposta(formatDateForInput(initialData.tipDate))
        setStake(initialData.stake?.toString() || '')
        setResultado(initialData.result || 'PENDING')
        setProfit(initialData.profit !== null && initialData.profit !== undefined ? initialData.profit.toString() : '')
        setJogos(initialData.jogos?.length > 0 ? initialData.jogos : [{ mandante: '', visitante: '', mercado: '', odd: '', resultado: 'PENDING' }])
      } else {
        setDataAposta('')
        setStake('')
        setResultado('PENDING')
        setProfit('')
        setJogos([{ mandante: '', visitante: '', mercado: '', odd: '', resultado: 'PENDING' }])
      }
    }
  }, [isOpen, initialData])

  const oddTotal = useMemo(() => {
    return jogos.reduce((acc, jogo) => {
      const o = Number(jogo.odd)
      return (o > 0 && !isNaN(o)) ? acc * o : acc
    }, 1).toFixed(2)
  }, [jogos])

  useEffect(() => {
    if (resultado === 'GREEN') {
      const s = Number(stake)
      const o = Number(oddTotal)
      if (s > 0 && o > 0) setProfit((s * (o - 1)).toFixed(2))
    } else if (resultado === 'RED') {
      const s = Number(stake)
      if (s > 0) setProfit((-s).toFixed(2))
    } else if (resultado === 'VOID') {
      setProfit('0')
    } else {
      setProfit('')
    }
  }, [resultado, stake, oddTotal])

  if (!isOpen) return null

  const handleAddJogo = () => {
    setJogos([...jogos, { mandante: '', visitante: '', mercado: '', odd: '', resultado: 'PENDING' }])
  }

  const handleRemoveJogo = (index: number) => {
    if (jogos.length > 1) {
      setJogos(jogos.filter((_, i) => i !== index))
    }
  }

  const handleJogoChange = (index: number, field: keyof JogoMultipla, value: string) => {
    const newJogos = [...jogos]
    newJogos[index] = { ...newJogos[index], [field]: value }
    setJogos(newJogos)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!dataAposta || !stake || jogos.some(j => !j.mandante.trim() || !j.visitante.trim() || !j.mercado.trim() || !j.odd)) {
      toast.error('Preencha todos os campos dos jogos e do bilhete')
      return
    }

    setSaving(true)
    try {
      const numJogos = jogos.length
      const title = `Aposta Múltipla (${numJogos} times)`
      const event = `Múltipla de ${numJogos} Jogos`
      
      await onSave({
        event,
        title,
        description: 'Bilhete Múltiplo',
        sport: 'Futebol', 
        market: 'Múltipla',
        odds: Number(oddTotal),
        stake: Number(stake),
        tipDate: new Date(dataAposta).toISOString(),
        result: resultado,
        profit: profit ? Number(profit) : null,
        isMultipla: true,
        jogos: jogos // Prisma Json handles this
      }, initialData?.id)
      onClose()
      toast.success(initialData ? 'Múltipla atualizada!' : 'Bilhete salvo!')
    } catch {
      toast.error('Erro ao salvar bilhete múltiplo')
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
            {initialData ? <Edit2 className="text-cyan-400" size={20} /> : <ListPlus className="text-cyan-400" size={20} />}
            {initialData ? 'Editar Bilhete' : 'Novo Bilhete'}
          </h3>
          <button onClick={onClose} className="p-2 -mr-2 text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Data</label>
              <input 
                type="datetime-local" 
                value={dataAposta}
                onChange={e => setDataAposta(e.target.value)}
                className="input-field py-2.5 px-3 w-full bg-surface-200" 
                required 
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Stake (R$)</label>
              <input 
                type="number" 
                step="0.01" 
                value={stake}
                onChange={e => setStake(e.target.value)}
                placeholder="Ex: 50.00"
                className="input-field py-2.5 px-3 w-full bg-surface-200" 
                required 
              />
            </div>
          </div>

          <div className="flex items-center justify-between mb-3">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Jogos do Bilhete</label>
            <button 
              type="button" 
              onClick={handleAddJogo}
              className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-surface-300 hover:bg-surface-300 transition-colors"
            >
              <Plus size={14} /> Adicionar Jogo
            </button>
          </div>

          <div className="space-y-3">
            {jogos.map((jogo, idx) => (
              <div key={idx} className="bg-surface-100/50 rounded-xl p-4 border border-surface-300">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">
                    Jogo {idx + 1}
                  </span>
                  {jogos.length > 1 && (
                    <button type="button" onClick={() => handleRemoveJogo(idx)} className="text-slate-500 hover:text-red-400 transition-colors">
                      <X size={16} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Mandante</label>
                    <input 
                      type="text" 
                      value={jogo.mandante}
                      onChange={e => handleJogoChange(idx, 'mandante', e.target.value)}
                      placeholder="Ex: Flamengo"
                      className="input-field py-2 px-2.5 w-full bg-surface-200 text-sm" 
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Visitante</label>
                    <input 
                      type="text" 
                      value={jogo.visitante}
                      onChange={e => handleJogoChange(idx, 'visitante', e.target.value)}
                      placeholder="Ex: São Paulo"
                      className="input-field py-2 px-2.5 w-full bg-surface-200 text-sm" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Mercado</label>
                    <input 
                      type="text" 
                      value={jogo.mercado}
                      onChange={e => handleJogoChange(idx, 'mercado', e.target.value)}
                      placeholder="Ex: Vitória Mandante"
                      className="input-field py-2 px-2.5 w-full bg-surface-200 text-sm" 
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Odd</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      value={jogo.odd}
                      onChange={e => handleJogoChange(idx, 'odd', e.target.value)}
                      placeholder="Ex: 1,7"
                      className="input-field py-2 px-2.5 w-full bg-surface-200 text-sm" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Resultado (Opcional)</label>
                  <select 
                    value={jogo.resultado}
                    onChange={e => handleJogoChange(idx, 'resultado', e.target.value)}
                    className="input-field py-2 px-2.5 w-full bg-surface-200 text-sm"
                  >
                    <option value="PENDING">— Pendente —</option>
                    <option value="GREEN">✅ Green</option>
                    <option value="RED">❌ Red</option>
                    <option value="VOID">⚪ Anulado</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 mb-2">
            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Resultado Múltipla (Overall)</label>
            <select 
              value={resultado}
              onChange={e => setResultado(e.target.value)}
              className="input-field py-2.5 px-3 w-full bg-surface-200 text-sm"
            >
              <option value="PENDING">— Pendente —</option>
              <option value="GREEN">✅ Green</option>
              <option value="RED">❌ Red</option>
              <option value="VOID">⚪ Anulado</option>
            </select>
          </div>

        </div>

        {/* Footer Elements */}
        <div className="p-5 border-t border-surface-300 shrink-0 bg-surface-100 rounded-b-2xl space-y-3">
          
          <div className="flex items-center justify-between bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-3">
            <span className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest">Odd Total (Multiplicada)</span>
            <div className="text-xl font-black font-display tracking-tight text-cyan-400">
              {oddTotal}
            </div>
          </div>

          <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
            <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Lucro Potencial</span>
            <div className="text-xl font-black font-display tracking-tight text-emerald-400">
              R$ {profit ? Number(profit).toFixed(2) : '0.00'}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl font-bold text-sm text-slate-400 border border-surface-300 hover:bg-surface-300 hover:text-white transition-all"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSubmit}
              disabled={saving}
              className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-cyan-500 hover:bg-cyan-400 text-white shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-all"
            >
              {saving ? 'Salvando...' : 'Salvar Bilhete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
