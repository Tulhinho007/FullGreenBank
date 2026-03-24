import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { usersService } from '../../services/users.service'

interface Saque {
  id: string
  userId: string
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

interface User {
  id: string
  name: string
  email: string
}

export const NovoSaqueModal = ({ isOpen, onClose, onSave, initialData }: NovoSaqueModalProps) => {
  const [users, setUsers] = useState<User[]>([])
  const [userId, setUserId] = useState('')
  const [date, setDate] = useState('')
  const [grossValue, setGrossValue] = useState<number | ''>('')
  const [comissionPercent, setComissionPercent] = useState<number | ''>('')
  const [method, setMethod] = useState('Pix')
  const [status, setStatus] = useState<Saque['status']>('PENDENTE')
  const [rejectionReason, setRejectionReason] = useState('')

  useEffect(() => {
    // Carregar usuários
    usersService.getAll().then(res => {
      const arr = Array.isArray(res) ? res : (Array.isArray(res?.users) ? res.users : [])
      setUsers(arr)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (initialData && isOpen) {
      setUserId(initialData.userId)
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
      setUserId('')
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
    if (!userId || !date || grossValue === '') return

    const selectedUser = users.find(u => u.id === userId)

    onSave({
      userId,
      userName: selectedUser?.name || '',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
      <div 
        className="bg-white w-full max-w-xl rounded-[2.5rem] border border-slate-100 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-500"
      >
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-50 bg-slate-50/20">
          <h2 className="text-xl font-display font-black text-slate-800 tracking-tight">
            {initialData ? 'Editar Saque' : 'Novo Saque'}
          </h2>
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white border border-slate-100 hover:border-rose-200 text-slate-400 hover:text-rose-500 transition-all active:scale-90"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-0">
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="label uppercase text-[10px] tracking-[0.2em] font-black text-slate-400 mb-2">Usuário Beneficiário</label>
              <select 
                required
                value={userId}
                onChange={e => setUserId(e.target.value)}
                className="input-field bg-slate-50 border-slate-100 font-bold"
              >
                <option value="">Selecione o usuário...</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label uppercase text-[10px] tracking-[0.2em] font-black text-slate-400 mb-2">Data e Hora</label>
              <input 
                type="datetime-local" 
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="input-field bg-slate-50 border-slate-100 font-bold [color-scheme:light]"
              />
            </div>

            <div>
              <label className="label uppercase text-[10px] tracking-[0.2em] font-black text-slate-400 mb-2">Método de Resgate</label>
              <select 
                value={method}
                onChange={e => setMethod(e.target.value)}
                className="input-field bg-slate-50 border-slate-100 font-bold"
              >
                <option value="Pix">Pix</option>
                <option value="Transferência Bancária (TED/DOC)">Transferência Bancária (TED/DOC)</option>
                <option value="Boleto Bancário">Boleto Bancário</option>
                <option value="PayPal">PayPal</option>
                <option value="Cartão de Credito (Visa/Mastercard)">Cartão de Credito (Visa/Mastercard)</option>
                <option value="Criptomoedas (Stablecoins e Ativos)">Criptomoedas (Stablecoins e Ativos)</option>
                <option value="PicPay">PicPay</option>
                <option value="Outros">Outros</option>
              </select>
            </div>

            <div>
              <label className="label uppercase text-[10px] tracking-[0.2em] font-black text-slate-400 mb-2">Valor Bruto (BRL)</label>
              <input 
                type="number" 
                required
                min="0"
                step="0.01"
                value={grossValue}
                onChange={e => setGrossValue(e.target.value ? Number(e.target.value) : '')}
                className="input-field bg-slate-50 border-slate-100 font-bold"
              />
            </div>

            <div>
              <label className="label uppercase text-[10px] tracking-[0.2em] font-black text-slate-400 mb-2">Taxa / Comissão (%)</label>
              <input 
                type="number" 
                required
                min="0"
                max="100"
                step="0.1"
                value={comissionPercent}
                onChange={e => setComissionPercent(e.target.value ? Number(e.target.value) : '')}
                className="input-field bg-slate-50 border-slate-100 font-bold"
              />
            </div>

            <div className="md:col-span-2">
              <label className="label uppercase text-[10px] tracking-widest font-black text-slate-400 mb-2">Valor Líquido Estimado</label>
              <div className="h-16 px-6 flex items-center justify-between bg-emerald-50/50 border border-emerald-100 rounded-2xl text-emerald-700 font-black text-lg">
                <span>Total a receber</span>
                <span>{calcNetValue().toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </div>
              <p className="text-[10px] text-slate-300 mt-2 font-bold uppercase tracking-widest">Cálculo baseado na comissão de {comissionPercent}%</p>
            </div>

            <div className="md:col-span-2 border-t border-slate-50 pt-6 mt-2">
              <label className="label uppercase text-[10px] tracking-[0.2em] font-black text-slate-400 mb-2">Status do Saque</label>
              <select 
                value={status}
                onChange={e => setStatus(e.target.value as Saque['status'])}
                className="input-field bg-slate-50 border-slate-100 font-black uppercase tracking-widest text-[11px]"
              >
                <option value="PENDENTE">🟡 Pendente</option>
                <option value="PROCESSANDO">🔵 Processando</option>
                <option value="CONCLUIDO">🟢 Concluído</option>
                <option value="REJEITADO">🔴 Rejeitado</option>
              </select>
            </div>

            {status === 'REJEITADO' && (
              <div className="md:col-span-2">
                <label className="label uppercase text-[10px] tracking-[0.2em] font-black text-slate-400 mb-2">Motivo da Rejeição</label>
                <input 
                  type="text" 
                  required
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  placeholder="Ex: Dados bancários incorretos"
                  className="input-field bg-rose-50 border-rose-100 text-rose-700 font-bold placeholder-rose-300"
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 px-8 py-8 bg-slate-50/30 border-t border-slate-50">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-2xl transition-all"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="flex-[2] py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-[11px] rounded-2xl transition-all shadow-xl shadow-emerald-500/10 active:scale-95"
            >
              {initialData ? 'Salvar Alterações' : 'Confirmar Saque'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
