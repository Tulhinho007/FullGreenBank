import { useState, useEffect, FormEvent } from 'react'
import {
  BadgeDollarSign,
  ArrowDownCircle,
  Wallet,
  Hourglass,
  Filter,
  Plus,
  Trash2,
  Edit2
} from 'lucide-react'
import { Modal } from '../components/ui/Modal'
import { useAuth } from '../contexts/AuthContext'
import { usersService } from '../services/users.service'
import { formatCurrency as fmt, formatDate } from '../utils/formatters'
import toast from 'react-hot-toast'
import { CurrencyInput } from '../components/ui/CurrencyInput'
import api from '../services/api'

// ─── Interfaces ─────────────────────────────────────────────────────────────
interface Transaction {
  id: string
  date: string
  type: 'DEPOSITO' | 'SAQUE'
  userId: string
  userName: string
  value: number
  method: string
  status: 'CONCLUIDO' | 'PENDENTE' | 'RECUSADO'
  notes: string
}

interface User {
  id: string
  name: string
  email: string
}

type ModalMode = 'create' | 'edit'

const METHODS = [
  'Pix',
  'Transferência Bancária (TED/DOC)',
  'Boleto Bancário',
  'PayPal',
  'Cartão de Credito (Visa/Mastercard)',
  'Criptomoedas (Stablecoins e Ativos)',
  'PicPay',
  'Outros',
]

export const TransacoesPage = () => {
  const { user: me } = useAuth()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<ModalMode>('create')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Filtros
  const [filterUser, setFilterUser] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterMethod, setFilterMethod] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const emptyForm = {
    date: new Date().toISOString().split('T')[0],
    type: 'DEPOSITO' as 'DEPOSITO' | 'SAQUE',
    userId: '',
    value: '',
    method: '',
    status: 'CONCLUIDO' as 'CONCLUIDO' | 'PENDENTE' | 'RECUSADO',
    notes: ''
  }
  const [formData, setFormData] = useState(emptyForm)

  // ─── Carrega dados do servidor ─────────────────────────────────────────────
  const fetchTransactions = async () => {
    setLoading(true)
    try {
      const res = await api.get('/transacoes')
      setTransactions(res.data.data || [])
    } catch {
      toast.error('Falha ao carregar transações.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await usersService.getAll()
        const dataArray = Array.isArray(response) ? response : (Array.isArray(response?.users) ? response.users : [])
        setUsers(dataArray)
      } catch {
        toast.error('Falha ao carregar lista de usuários.')
      }
    }
    fetchUsers()
    fetchTransactions()
  }, [])

  // ─── KPIs ─────────────────────────────────────────────────────────────────
  const totalDepositos = transactions.filter(t => t.type === 'DEPOSITO' && t.status === 'CONCLUIDO').reduce((acc, t) => acc + t.value, 0)
  const totalSaques    = transactions.filter(t => t.type === 'SAQUE'    && t.status === 'CONCLUIDO').reduce((acc, t) => acc + t.value, 0)
  const saldoLiquido   = totalDepositos - totalSaques
  const totalPendentes = transactions.filter(t => t.status === 'PENDENTE').length

  // ─── Filtros ──────────────────────────────────────────────────────────────
  const filteredTransactions = transactions.filter(t => {
    if (filterUser   && t.userId !== filterUser)  return false
    if (filterType   && t.type !== filterType)    return false
    if (filterMethod && t.method !== filterMethod) return false
    if (filterStatus && t.status !== filterStatus) return false
    return true
  })

  // ─── Abrir Modal ──────────────────────────────────────────────────────────
  const openCreate = () => {
    setModalMode('create')
    setEditingId(null)
    setFormData(emptyForm)
    setIsModalOpen(true)
  }

  const openEdit = (t: Transaction) => {
    setModalMode('edit')
    setEditingId(t.id)
    setFormData({
      date:   t.date,
      type:   t.type,
      userId: t.userId,
      value:  String(t.value),
      method: t.method,
      status: t.status,
      notes:  t.notes || ''
    })
    setIsModalOpen(true)
  }

  // ─── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (modalMode === 'create') {
        if (!formData.userId) { toast.error('Selecione um usuário!'); setSaving(false); return }
        if (!formData.value || Number(formData.value) <= 0) { toast.error('Informe um valor válido!'); setSaving(false); return }
        if (!formData.method) { toast.error('Selecione um método!'); setSaving(false); return }

        const selectedUser = users.find(u => u.id === formData.userId)
        await api.post('/transacoes', {
          date: formData.date,
          type: formData.type,
          userId: formData.userId,
          userName: selectedUser?.name || 'Desconhecido',
          value: Number(formData.value),
          method: formData.method,
          status: formData.status,
          notes: formData.notes
        })
        toast.success('Transação registrada!')
      } else {
        // EDIT — só envia campos preenchidos
        const payload: any = {}
        if (formData.date)   payload.date   = formData.date
        if (formData.type)   payload.type   = formData.type
        if (formData.method) payload.method = formData.method
        if (formData.status) payload.status = formData.status
        payload.notes = formData.notes
        if (formData.value && Number(formData.value) > 0) payload.value = Number(formData.value)
        if (formData.userId) {
          const selectedUser = users.find(u => u.id === formData.userId)
          payload.userId = formData.userId
          payload.userName = selectedUser?.name || 'Desconhecido'
        }
        await api.patch(`/transacoes/${editingId}`, payload)
        toast.success('Transação atualizada!')
      }
      setIsModalOpen(false)
      fetchTransactions()
    } catch {
      toast.error('Erro ao salvar transação.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Deseja mesmo remover esta transação?')) return
    try {
      await api.delete(`/transacoes/${id}`)
      toast.success('Transação removida.')
      fetchTransactions()
    } catch {
      toast.error('Erro ao excluir transação.')
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-10">

      {/* ─── Cabeçalho ─── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-slate-800">Depósitos & Saques</h2>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">Controle financeiro completo por usuário</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-emerald-500 transition-all active:scale-95 shadow-lg shadow-emerald-500/20">
          <Plus size={18} /> Nova Transação
        </button>
      </div>

      {/* ─── Cards de Resumo ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Depósitos', value: fmt(totalDepositos), color: 'emerald', Icon: BadgeDollarSign },
          { label: 'Total Saques',    value: fmt(totalSaques),    color: 'rose',    Icon: ArrowDownCircle },
          { label: 'Saldo Líquido',  value: fmt(saldoLiquido),   color: 'blue',    Icon: Wallet },
          { label: 'Pendentes',      value: String(totalPendentes), color: 'amber', Icon: Hourglass },
        ].map(({ label, value, color, Icon }) => (
          <div key={label} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between">
            <div className="flex items-start justify-between mb-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
              <div className={`w-10 h-10 rounded-full bg-${color}-50 flex items-center justify-center shrink-0 border border-${color}-100`}>
                <Icon className={`text-${color}-500`} size={20} />
              </div>
            </div>
            <p className={`text-2xl font-display font-bold text-${color}-600 tracking-tight`}>{value}</p>
          </div>
        ))}
      </div>

      {/* ─── Filtros ─── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
          <Filter size={18} className="text-slate-400" />
        </div>
        {[
          { value: filterUser,   setter: setFilterUser,   options: [{ v:'', l:'Todos os usuários' }, ...users.map(u => ({ v: u.id, l: u.name }))] },
          { value: filterType,   setter: setFilterType,   options: [{ v:'', l:'Todos os tipos' }, { v:'DEPOSITO', l:'Depósito' }, { v:'SAQUE', l:'Saque' }] },
          { value: filterStatus, setter: setFilterStatus, options: [{ v:'', l:'Todos os status' }, { v:'CONCLUIDO', l:'Concluído' }, { v:'PENDENTE', l:'Pendente' }, { v:'RECUSADO', l:'Recusado' }] },
        ].map(({ value, setter, options }, i) => (
          <select key={i} value={value} onChange={e => setter(e.target.value)}
            className="w-auto min-w-[150px] h-11 bg-white border border-slate-100 text-sm cursor-pointer rounded-xl text-slate-800 font-bold focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none px-3">
            {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
          </select>
        ))}
      </div>

      {/* ─── Tabela ─── */}
      <div className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm">
        <div className="hidden md:grid grid-cols-[100px_100px_1.5fr_120px_150px_120px_2fr_100px] gap-4 px-6 py-4 bg-slate-50 border-b border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest items-center">
          <span>Data</span><span>Tipo</span><span>Usuário</span><span>Valor</span><span>Método</span><span>Status</span><span>Observação</span><span className="text-right pr-2">Ações</span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 text-sm">Carregando transações...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
              <BadgeDollarSign className="text-slate-300" size={24} />
            </div>
            <p className="text-slate-500 text-sm font-medium">Nenhuma transação registrada ainda.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredTransactions.map(t => (
              <div key={t.id} className="grid grid-cols-1 md:grid-cols-[100px_100px_1.5fr_120px_150px_120px_2fr_100px] gap-4 px-6 py-4 text-sm items-center hover:bg-slate-50 transition-colors group">
                <span className="text-slate-600 font-medium">{formatDate(t.date)}</span>
                <span className={`text-[10px] font-black px-3 py-1.5 rounded-full inline-flex w-fit uppercase tracking-widest ${t.type === 'DEPOSITO' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>{t.type}</span>
                <span className="font-bold text-slate-800 truncate">{t.userName}</span>
                <span className={`font-display font-black text-sm ${t.type === 'DEPOSITO' ? 'text-emerald-600' : 'text-rose-600'}`}>{t.type === 'DEPOSITO' ? '+' : '-'}{fmt(t.value)}</span>
                <span className="text-slate-500 text-xs truncate">{t.method}</span>
                <span className={`text-[10px] font-black px-3 py-1.5 rounded-full inline-flex w-fit items-center gap-2 uppercase tracking-widest ${t.status === 'CONCLUIDO' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : t.status === 'PENDENTE' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-slate-50 text-slate-500 border border-slate-100'}`}>
                  <div className="w-1.5 h-1.5 rounded-full bg-current" />{t.status}
                </span>
                <span className="text-slate-500 text-xs truncate">{t.notes || '—'}</span>
                <div className="flex items-center justify-end gap-1 pr-1">
                  <button onClick={() => openEdit(t)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-all" title="Editar">
                    <Edit2 size={15} />
                  </button>
                  <button onClick={() => handleDelete(t.id)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded transition-all" title="Excluir">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Modal (Criar / Editar) ─── */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalMode === 'create' ? 'Nova Transação' : 'Editar Transação'} size="md">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-slate-900">

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Data</label>
              <input type="date" className="input-field text-sm bg-slate-50" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tipo</label>
              <select className="input-field text-sm cursor-pointer bg-slate-50 border-slate-100 font-bold" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as any })}>
                <option value="DEPOSITO">Depósito</option>
                <option value="SAQUE">Saque</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Valor (R$){modalMode === 'create' && ' *'}</label>
            <CurrencyInput value={formData.value ? Number(formData.value) : 0} onChange={v => setFormData({ ...formData, value: String(v) })} alertLimit={1000} className="text-sm bg-slate-50 border-slate-100 font-bold" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Usuário{modalMode === 'create' && ' *'}</label>
            <select className="input-field text-sm cursor-pointer bg-slate-50 border-slate-100 font-bold" value={formData.userId} onChange={e => setFormData({ ...formData, userId: e.target.value })}>
              <option value="">Selecione...</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Método{modalMode === 'create' && ' *'}</label>
            <select className="input-field text-sm cursor-pointer bg-slate-50 border-slate-100 font-bold" value={formData.method} onChange={e => setFormData({ ...formData, method: e.target.value })}>
              <option value="">Selecione...</option>
              {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</label>
            <select className="input-field text-sm cursor-pointer bg-slate-50 border-slate-100 font-bold" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as any })}>
              <option value="CONCLUIDO">Concluído</option>
              <option value="PENDENTE">Pendente</option>
              <option value="RECUSADO">Recusado</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Observação</label>
            <textarea className="input-field text-sm resize-none bg-slate-50 border-slate-100 font-bold" rows={3} placeholder="Ex: bônus, rollover, saque parcial..." value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-4 mt-2">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary py-3 text-sm font-bold border-slate-200">Cancelar</button>
            <button type="submit" disabled={saving} className="py-4 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-[11px] rounded-[1.5rem] transition-all shadow-xl shadow-emerald-500/10 active:scale-95 flex items-center justify-center disabled:opacity-60">
              {saving ? 'Salvando...' : modalMode === 'create' ? 'Registrar' : 'Salvar Edição'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
