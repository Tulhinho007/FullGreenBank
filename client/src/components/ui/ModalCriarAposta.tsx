import { useEffect, useState } from 'react'
import { Plus, X, Star, Edit2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { SportSelect } from './SportSelect'

interface ModalCriarApostaProps {
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

export const ModalCriarAposta = ({ isOpen, onClose, onSave, initialData }: ModalCriarApostaProps) => {
  const [dataAposta, setDataAposta] = useState('')
  const [stake, setStake] = useState('')
  const [oddTotal, setOddTotal] = useState('')
  const [resultado, setResultado] = useState('PENDING')
  const [profit, setProfit] = useState('')
  const [event, setEvent] = useState('')
  const [sport, setSport] = useState('')
  const [linkAposta, setLinkAposta] = useState('')
  const [mercados, setMercados] = useState<string[]>([''])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setDataAposta(formatDateForInput(initialData.tipDate))
        setStake(initialData.stake?.toString() || '')
        setOddTotal(initialData.odds?.toString() || '')
        setResultado(initialData.result || 'PENDING')
        setProfit(initialData.profit !== null && initialData.profit !== undefined ? initialData.profit.toString() : '')
        setEvent(initialData.event || '')
        setSport(initialData.sport || '')
        setLinkAposta(initialData.linkAposta || '')
        setMercados(initialData.mercados?.length > 0 ? initialData.mercados : [''])
      } else {
        setDataAposta('')
        setStake('')
        setOddTotal('')
        setResultado('PENDING')
        setProfit('')
        setEvent('')
        setSport('')
        setLinkAposta('')
        setMercados([''])
      }
    }
  }, [isOpen, initialData])

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
        title: event,
        description: 'Bilhete Multi-Mercados',
        sport: sport || 'Futebol',
        market: mercados[0] || 'Múltiplo',
        odds: Number(oddTotal),
        stake: Number(stake),
        tipDate: new Date(dataAposta).toISOString(),
        result: resultado,
        profit: profit ? Number(profit) : null,
        mercados: mercados.filter(m => m.trim() !== ''),
        linkAposta: linkAposta.trim() || null,
      }, initialData?.id)
      onClose()
      toast.success(initialData ? 'Bilhete atualizado!' : 'Bilhete salvo!')
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
          <h3 className="font-display font-black text-xl text-white flex items-center gap-2 italic">
            {initialData ? <Edit2 className="text-yellow-400" size={20} /> : <Star className="text-yellow-400 fill-yellow-400" size={20} />}
            {initialData ? 'Editar Bilhete' : 'Novo Bilhete'}
          </h3>
          <button onClick={onClose} className="p-2 -mr-2 text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Evento *</label>
              <input
                type="text"
                value={event}
                onChange={e => setEvent(e.target.value)}
                placeholder="Ex: Arsenal x Chelsea"
                className="input-field py-2.5 px-3 w-full bg-surface-200"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Esporte *</label>
              <SportSelect value={sport} onChange={setSport} required />
            </div>
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
                type="number" step="0.01" value={stake}
                onChange={e => setStake(e.target.value)}
                placeholder="Ex: 10"
                className="input-field py-2.5 px-3 w-full bg-surface-200" required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Odd Total</label>
              <input
                type="number" step="0.01" value={oddTotal}
                onChange={e => setOddTotal(e.target.value)}
                placeholder="Ex: 5,3"
                className="input-field py-2.5 px-3 w-full bg-surface-200" required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Resultado</label>
              <select value={resultado} onChange={e => setResultado(e.target.value)}
                className="input-field py-2.5 px-3 w-full bg-surface-200">
                <option value="PENDING">— Pendente —</option>
                <option value="GREEN">✅ Green</option>
                <option value="RED">❌ Red</option>
                <option value="VOID">⚪ Anulado</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Link da Aposta</label>
              <input
                type="url"
                value={linkAposta}
                onChange={e => setLinkAposta(e.target.value)}
                placeholder="Ex: https://www.betano.bet.br/bookingcode/..."
                className="input-field py-2.5 px-3 w-full bg-surface-200 text-sm"
              />
            </div>
          </div>

          <div className="flex items-center justify-between mb-3">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Estratégias do Bilhete</label>
            <button 
              type="button" 
              onClick={handleAddMercado}
              className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-surface-300 hover:bg-surface-300 transition-colors"
            >
              <Plus size={14} /> Adicionar Estratégia
            </button>
          </div>

          <div className="space-y-3">
            {mercados.map((m, idx) => (
              <div key={idx} className="bg-surface-100/50 rounded-xl p-3 border border-surface-300">
                <div className="flex justify-between flex-row items-center mb-2">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                    Estratégia {idx + 1}
                  </span>
                  {mercados.length > 1 && (
                    <button type="button" onClick={() => handleRemoveMercado(idx)} className="text-slate-500 hover:text-red-400 transition-colors">
                      <X size={16} />
                    </button>
                  )}
                </div>
                <input 
                  type="text" 
                  value={m}
                  onChange={e => handleMercadoChange(idx, e.target.value)}
                  placeholder="Ex: Arsenal - Resultado Final"
                  className="input-field py-2.5 px-3 w-full bg-surface-200 text-sm" 
                  required 
                />
              </div>
            ))}
          </div>

        </div>

        {/* Footer */}
        <div className="p-5 border-t border-surface-300 shrink-0 bg-surface-100 rounded-b-2xl">
          <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-4">
            <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Lucro Potencial</span>
            <div className="text-2xl font-black font-display tracking-tight text-emerald-400">
              R$ {profit ? Number(profit).toFixed(2) : '0.00'}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl font-bold text-sm text-slate-300 border border-surface-300 hover:bg-surface-300 hover:text-white transition-all"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSubmit}
              disabled={saving}
              className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all"
            >
              {saving ? 'Salvando...' : 'Salvar Bilhete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
