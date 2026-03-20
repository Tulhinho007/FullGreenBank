import { useState } from 'react'
import { Plus, X, Star } from 'lucide-react'
import toast from 'react-hot-toast'

interface ModalCriarApostaProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => Promise<void>
}

export const ModalCriarAposta = ({ isOpen, onClose, onSave }: ModalCriarApostaProps) => {
  const [dataAposta, setDataAposta] = useState('')
  const [stake, setStake] = useState('')
  const [oddTotal, setOddTotal] = useState('')
  const [resultado, setResultado] = useState('PENDING')
  const [event, setEvent] = useState('')
  const [mercados, setMercados] = useState<string[]>([''])
  const [saving, setSaving] = useState(false)

  if (!isOpen) return null

  const handleAddMercado = () => {
    setMercados([...mercados, ''])
  }

  const handleRemoveMercado = (index: number) => {
    if (mercados.length > 1) {
      setMercados(mercados.filter((_, i) => i !== index))
    }
  }

  const handleMercadoChange = (index: number, value: string) => {
    const newMercados = [...mercados]
    newMercados[index] = value
    setMercados(newMercados)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!event || !dataAposta || !stake || !oddTotal || mercados.some(m => !m.trim())) {
      toast.error('Preencha os campos obrigatórios')
      return
    }

    setSaving(true)
    try {
      await onSave({
        event,
        title: event, // Title could just be the event name for tickets
        description: 'Bilhete Multi-Mercados',
        sport: 'Futebol', // Default sport (could be selectable later)
        market: mercados[0] || 'Múltiplo', // Default fallback
        odds: Number(oddTotal),
        stake: Number(stake),
        tipDate: new Date(dataAposta).toISOString(),
        result: resultado,
        mercados: mercados.filter(m => m.trim() !== '')
      })
      onClose()
      toast.success('Bilhete salvo!')
    } catch {
      toast.error('Erro ao salvar bilhete')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-surface-100 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 flex justify-between items-center border-b border-surface-300 shrink-0">
          <h3 className="font-display font-bold text-xl text-white flex items-center gap-2">
            <Star className="text-yellow-400 fill-yellow-400" size={24} />
            Novo Bilhete
          </h3>
          <button onClick={onClose} className="p-2 -mr-2 text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Evento</label>
              <input 
                type="text" 
                value={event}
                onChange={e => setEvent(e.target.value)}
                placeholder="Ex: Chelsea x PSG"
                className="input-field py-2.5 px-3 w-full bg-surface-200" 
                required 
              />
            </div>
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
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Odd Total</label>
              <input 
                type="number" 
                step="0.01" 
                value={oddTotal}
                onChange={e => setOddTotal(e.target.value)}
                placeholder="Ex: 5.30"
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
                placeholder="Ex: 10.00"
                className="input-field py-2.5 px-3 w-full bg-surface-200" 
                required 
              />
            </div>
            <div className="col-span-2">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Resultado</label>
              <select 
                value={resultado}
                onChange={e => setResultado(e.target.value)}
                className="input-field py-2.5 px-3 w-full bg-surface-200"
              >
                <option value="PENDING">— Pendente —</option>
                <option value="GREEN">Green</option>
                <option value="RED">Red</option>
                <option value="VOID">Anulado</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mx-1 mb-3">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                Mercados do Bilhete
              </label>
              <button 
                type="button" 
                onClick={handleAddMercado}
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
              >
                <Plus size={14} /> Adicionar Mercado
              </button>
            </div>
            <div className="space-y-3 p-4 bg-surface-200/50 border border-surface-300 rounded-xl">
              {mercados.map((mercado, index) => (
                <div key={index} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                      Mercado {index + 1}
                    </label>
                    {mercados.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => handleRemoveMercado(index)}
                        className="text-[10px] text-rose-500 hover:text-rose-400 flex items-center gap-0.5"
                      >
                        <X size={12} /> Remover
                      </button>
                    )}
                  </div>
                  <input 
                    type="text" 
                    value={mercado}
                    onChange={e => handleMercadoChange(index, e.target.value)}
                    placeholder="Ex: Arsenal - Resultado Final"
                    className="input-field py-2.5 px-3 w-full bg-surface-100" 
                    required 
                  />
                </div>
              ))}
            </div>
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
              disabled={saving} 
              className="flex-[2] py-3 rounded-xl font-bold bg-emerald-500 text-white hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
            >
              {saving ? 'Salvando...' : 'Salvar Bilhete'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
