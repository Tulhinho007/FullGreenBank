import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface Saque {
  id: string
  date: string
  userName: string
  grossValue: number
  comissionPercent: number
  netValue: number
  method: string
  status: 'CONCLUIDO' | 'PENDENTE' | 'PROCESSANDO' | 'REJEITADO'
  rejectionReason?: string
}

interface NovoSaqueModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (saque: Omit<Saque, 'id'>) => void
  initialData?: Saque | null
}

export const NovoSaqueModal = ({ isOpen, onClose, onSave, initialData }: NovoSaqueModalProps) => {
  const [userName, setUserName] = useState('')
  const [date, setDate] = useState('')
  const [grossValue, setGrossValue] = useState<number | ''>('')
  const [comissionPercent, setComissionPercent] = useState<number | ''>('')
  const [method, setMethod] = useState('Pix')
  const [status, setStatus] = useState<Saque['status']>('PENDENTE')
  const [rejectionReason, setRejectionReason] = useState('')

  useEffect(() => {
    if (initialData && isOpen) {
      setUserName(initialData.userName)
      // Extrair YY-MM-DDTHH:MM local format per input type="datetime-local"
      const d = new Date(initialData.date)
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
      setDate(d.toISOString().slice(0, 16))
      
      setGrossValue(initialData.grossValue)
      setComissionPercent(initialData.comissionPercent)
      setMethod(initialData.method)
      setStatus(initialData.status)
      setRejectionReason(initialData.rejectionReason || '')
    } else if (isOpen) {
      setUserName('')
      const d = new Date()
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
      setDate(d.toISOString().slice(0, 16))
      setGrossValue('')
      setComissionPercent(10)
      setMethod('Pix')
      setStatus('PENDENTE')
      setRejectionReason('')
    }
  }, [initialData, isOpen])

  if (!isOpen) return null

  const calcNetValue = () => {
    const gross = Number(grossValue) || 0
    const percent = Number(comissionPercent) || 0
    return gross - (gross * (percent / 100))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!userName || !date || grossValue === '') return

    onSave({
      userName,
      date: new Date(date).toISOString(),
      grossValue: Number(grossValue),
      comissionPercent: Number(comissionPercent),
      netValue: calcNetValue(),
      method,
      status,
      rejectionReason: status === 'REJEITADO' ? rejectionReason : undefined
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div 
        className="bg-white dark:bg-surface-200 w-full max-w-lg rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-surface-300 animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-surface-300">
          <h2 className="text-xl font-display font-bold text-slate-800 dark:text-white">
            {initialData ? 'Editar Saque' : 'Novo Saque'}
          </h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-surface-300 text-slate-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">Nome do Usuário</label>
              <input 
                type="text" 
                required
                value={userName}
                onChange={e => setUserName(e.target.value)}
                placeholder="Ex: Carlos Silva"
                className="input-field bg-slate-50 dark:bg-surface-300"
              />
            </div>

            <div>
              <label className="label">Data e Hora</label>
              <input 
                type="datetime-local" 
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="input-field bg-slate-50 dark:bg-surface-300 [color-scheme:light] dark:[color-scheme:dark]"
              />
            </div>

            <div>
              <label className="label">Método</label>
              <select 
                value={method}
                onChange={e => setMethod(e.target.value)}
                className="input-field bg-slate-50 dark:bg-surface-300"
              >
                <option value="Pix">Pix</option>
                <option value="Transferência">Transferência</option>
                <option value="Outros">Outros</option>
              </select>
            </div>

            <div>
              <label className="label">Valor Bruto (R$)</label>
              <input 
                type="number" 
                required
                min="0"
                step="0.01"
                value={grossValue}
                onChange={e => setGrossValue(e.target.value ? Number(e.target.value) : '')}
                className="input-field bg-slate-50 dark:bg-surface-300"
              />
            </div>

            <div>
              <label className="label">Comissão (%)</label>
              <input 
                type="number" 
                required
                min="0"
                max="100"
                step="0.1"
                value={comissionPercent}
                onChange={e => setComissionPercent(e.target.value ? Number(e.target.value) : '')}
                className="input-field bg-slate-50 dark:bg-surface-300"
              />
            </div>

            <div className="md:col-span-2">
              <label className="label">Valor Líquido (R$)</label>
              <div className="h-11 px-4 flex items-center bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 rounded-lg text-green-700 dark:text-green-500 font-bold">
                {calcNetValue().toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
              <p className="text-xs text-slate-400 mt-1">Calculado automaticamente</p>
            </div>

            <div className="md:col-span-2 border-t border-slate-100 dark:border-surface-300 pt-4 mt-2">
              <label className="label">Status Inicial</label>
              <select 
                value={status}
                onChange={e => setStatus(e.target.value as Saque['status'])}
                className="input-field bg-slate-50 dark:bg-surface-300 font-medium"
              >
                <option value="PENDENTE">🟡 Pendente</option>
                <option value="PROCESSANDO">🔵 Processando</option>
                <option value="CONCLUIDO">🟢 Concluído (Aprovado)</option>
                <option value="REJEITADO">🔴 Rejeitado</option>
              </select>
            </div>

            {status === 'REJEITADO' && (
              <div className="md:col-span-2">
                <label className="label">Motivo da Rejeição</label>
                <input 
                  type="text" 
                  required
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  placeholder="Ex: Dados bancários divergentes"
                  className="input-field bg-slate-50 dark:bg-surface-300 border-red-300 focus:border-red-500"
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-6">
            <button 
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-surface-300 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="btn-primary flex items-center gap-2"
            >
              {initialData ? 'Salvar Alterações' : 'Cadastrar Saque'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
