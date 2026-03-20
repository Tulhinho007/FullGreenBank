import { useState, useMemo } from 'react'
import { Plus, X, ListPlus } from 'lucide-react'
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
  onSave: (data: any) => Promise<void>
}

export const ModalCriarMultipla = ({ isOpen, onClose, onSave }: ModalCriarMultiplaProps) => {
  const [dataAposta, setDataAposta] = useState('')
  const [stake, setStake] = useState('')
  const [jogos, setJogos] = useState<JogoMultipla[]>([
    { mandante: '', visitante: '', mercado: '', odd: '', resultado: 'PENDING' }
  ])
  const [saving, setSaving] = useState(false)

  const oddTotal = useMemo(() => {
    return jogos.reduce((acc, jogo) => {
      const o = Number(jogo.odd)
      return (o > 0 && !isNaN(o)) ? acc * o : acc
    }, 1).toFixed(2)
  }, [jogos])

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
        result: 'PENDING', 
        isMultipla: true,
        jogos: jogos // Prisma Json handles this
      })
      onClose()
      toast.success('Bilhete salvo!')
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
          <h3 className="font-display font-bold text-xl text-white flex items-center gap-2">
            <ListPlus className="text-cyan-400" size={24} />
            Novo Bilhete (Múltipla)
          </h3>
          <button onClick={onClose} className="p-2 -mr-2 text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Data</label>
              <input 
                type="datetime-local" 
                value={dataAposta}
                onChange={e => setDataAposta(e.target.value)}
                className="input-field py-2.5 px-3 w-full bg-surface-200" 
                required 
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Stake (R$)</label>
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

          <div>
            <div className="flex items-center justify-between mx-1 mb-3">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                Jogos do Bilhete
              </label>
              <button 
                type="button" 
                onClick={handleAddJogo}
                className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors bg-cyan-400/10 px-3 py-1.5 rounded-lg border border-cyan-400/20"
              >
                <Plus size={14} /> Adicionar Jogo
              </button>
            </div>
            
            <div className="space-y-4">
              {jogos.map((jogo, index) => (
                <div key={index} className="p-4 bg-surface-200/50 border border-surface-300 rounded-xl relative">
                  
                  <div className="flex items-center justify-between mb-4 border-b border-surface-300/50 pb-3">
                    <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-widest bg-cyan-400/10 px-2 py-0.5 rounded">
                      Jogo {index + 1}
                    </span>
                    {jogos.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => handleRemoveJogo(index)}
                        className="text-[11px] font-semibold text-rose-500 hover:text-rose-400 flex items-center gap-1 transition-colors"
                      >
                        <X size={14} /> Remover
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Mandante</label>
                      <input 
                        type="text" 
                        value={jogo.mandante}
                        onChange={e => handleJogoChange(index, 'mandante', e.target.value)}
                        placeholder="Time mandante"
                        className="input-field py-2 px-3 w-full bg-surface-100 text-sm" 
                        required 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Visitante</label>
                      <input 
                        type="text" 
                        value={jogo.visitante}
                        onChange={e => handleJogoChange(index, 'visitante', e.target.value)}
                        placeholder="Time visitante"
                        className="input-field py-2 px-3 w-full bg-surface-100 text-sm" 
                        required 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Mercado</label>
                      <input 
                        type="text" 
                        value={jogo.mercado}
                        onChange={e => handleJogoChange(index, 'mercado', e.target.value)}
                        placeholder="Ex: Ambas Marcam"
                        className="input-field py-2 px-3 w-full bg-surface-100 text-sm" 
                        required 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Odd</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        value={jogo.odd}
                        onChange={e => handleJogoChange(index, 'odd', e.target.value)}
                        placeholder="1.50"
                        className="input-field py-2 px-3 w-full bg-surface-100 text-sm" 
                        required 
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Resultado</label>
                      <select 
                        value={jogo.resultado}
                        onChange={e => handleJogoChange(index, 'resultado', e.target.value)}
                        className="input-field py-2 px-3 w-full bg-surface-100 text-sm"
                      >
                        <option value="PENDING">— Pendente —</option>
                        <option value="GREEN">Green</option>
                        <option value="RED">Red</option>
                        <option value="VOID">Anulado</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center justify-between shrink-0">
            <span className="text-xs font-bold text-emerald-500 tracking-widest uppercase">
              Odd Total (Multiplicada)
            </span>
            <span className="text-2xl font-black font-display text-emerald-400 tracking-tight">
              {Number(oddTotal) > 1 ? oddTotal : '1.00'}
            </span>
          </div>

          <div className="pt-2 flex gap-3 shrink-0">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-[1] py-3 rounded-xl font-bold bg-surface-200 text-white hover:bg-surface-300 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={saving || Number(oddTotal) <= 1} 
              className="flex-[2] py-3 rounded-xl font-bold bg-emerald-500 text-white hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Salvando...' : 'Salvar Bilhete'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
