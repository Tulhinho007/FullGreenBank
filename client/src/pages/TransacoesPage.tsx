import { useState, useEffect, FormEvent } from 'react'
import {
  BadgeDollarSign,
  ArrowDownCircle,
  Wallet,
  Hourglass,
  Filter,
  Plus,
  Trash2
} from 'lucide-react'
import { Modal } from '../components/ui/Modal'
import { usersService } from '../services/users.service'
import { formatCurrency as fmt, formatDate } from '../utils/formatters'
import toast from 'react-hot-toast'
import { CurrencyInput } from '../components/ui/CurrencyInput'

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

export const TransacoesPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  
  // Filtros
  const [filterUser, setFilterUser] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterMethod, setFilterMethod] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  // Estado do Form
  const initialForm = {
    date: new Date().toISOString().split('T')[0],
    type: 'DEPOSITO' as 'DEPOSITO' | 'SAQUE',
    userId: '',
    value: '',
    method: '',
    status: 'CONCLUIDO' as 'CONCLUIDO' | 'PENDENTE' | 'RECUSADO',
    notes: ''
  }
  const [formData, setFormData] = useState(initialForm)

  // ─── Efeitos Iniciais (Carregar Usuários) ─────────────────────────────────
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await usersService.getAll()
        const dataArray = Array.isArray(response) ? response : (Array.isArray(response?.users) ? response.users : [])
        // Se quiser filtrar só MEMBERS, pode usar dataArray.filter(u => u.role === 'MEMBRO'...)
        setUsers(dataArray)
      } catch (error) {
        console.error("Erro ao buscar usuários:", error)
        toast.error("Falha ao carregar lista de usuários.")
      }
    }
    fetchUsers()
  }, [])

  // ─── Cálculos dos Cards (KPIs) ────────────────────────────────────────────
  const totalDepositos = transactions
    .filter(t => t.type === 'DEPOSITO' && t.status === 'CONCLUIDO')
    .reduce((acc, t) => acc + t.value, 0)
    
  const totalSaques = transactions
    .filter(t => t.type === 'SAQUE' && t.status === 'CONCLUIDO')
    .reduce((acc, t) => acc + t.value, 0)
    
  const saldoLiquido = totalDepositos - totalSaques
  
  const totalPendentes = transactions.filter(t => t.status === 'PENDENTE').length

  // ─── Filtros de Tabela ────────────────────────────────────────────────────
  const filteredTransactions = transactions.filter(t => {
    if (filterUser && t.userId !== filterUser) return false
    if (filterType && t.type !== filterType) return false
    if (filterMethod && t.method !== filterMethod) return false
    if (filterStatus && t.status !== filterStatus) return false
    return true
  })

  // ─── Ações ────────────────────────────────────────────────────────────────
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    
    // Validação básica
    if (!formData.userId) return toast.error("Selecione um usuário!")
    if (!formData.value || Number(formData.value) <= 0) return toast.error("Informe um valor válido!")
    if (!formData.method) return toast.error("Selecione um método de pagamento!")

    const selectedUser = users.find(u => u.id === formData.userId)

    const newTransaction: Transaction = {
      id: crypto.randomUUID(), // Geração local de ID por enquanto
      date: formData.date,
      type: formData.type,
      userId: formData.userId,
      userName: selectedUser?.name || 'Desconhecido',
      value: Number(formData.value),
      method: formData.method,
      status: formData.status,
      notes: formData.notes
    }

    setTransactions(prev => [newTransaction, ...prev])
    toast.success("Transação registrada com sucesso!")
    
    // Fechar e Resetar Modal
    setIsModalOpen(false)
    setFormData(initialForm)
  }

  const handleDelete = (id: string) => {
    if(window.confirm("Deseja mesmo remover esta transação?")) {
      setTransactions(prev => prev.filter(t => t.id !== id))
      toast.success("Transação removida.")
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-10">

      {/* ─── Cabeçalho ─── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-slate-800 dark:text-white">Depósitos & Saques</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Controle financeiro completo por usuário
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors shadow-sm shadow-emerald-500/20"
        >
          <Plus size={18} />
          Nova Transação
        </button>
      </div>

      {/* ─── Cards de Resumo ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Depósitos */}
        <div className="card p-5 flex flex-col justify-between">
          <div className="flex items-start justify-between mb-4">
            <span className="text-sm font-semibold text-slate-500">Total Depósitos</span>
            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center shrink-0 border border-green-500/20">
              <BadgeDollarSign className="text-green-500" size={20} />
            </div>
          </div>
          <p className="text-2xl font-bold text-green-500 tracking-tight">{fmt(totalDepositos)}</p>
        </div>

        {/* Total Saques */}
        <div className="card p-5 flex flex-col justify-between">
          <div className="flex items-start justify-between mb-4">
            <span className="text-sm font-semibold text-slate-500">Total Saques</span>
            <div className="w-10 h-10 rounded-full bg-pink-500/10 flex items-center justify-center shrink-0 border border-pink-500/20">
              <ArrowDownCircle className="text-pink-500" size={20} />
            </div>
          </div>
          <p className="text-2xl font-bold text-red-500 tracking-tight">{fmt(totalSaques)}</p>
        </div>

        {/* Saldo Líquido */}
        <div className="card p-5 flex flex-col justify-between">
          <div className="flex items-start justify-between mb-4">
            <span className="text-sm font-semibold text-slate-500">Saldo Líquido</span>
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20">
              <Wallet className="text-blue-500" size={20} />
            </div>
          </div>
          <p className="text-2xl font-bold text-blue-500 tracking-tight">{fmt(saldoLiquido)}</p>
        </div>

        {/* Pendentes */}
        <div className="card p-5 flex flex-col justify-between">
          <div className="flex items-start justify-between mb-4">
            <span className="text-sm font-semibold text-slate-500">Pendentes</span>
            <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0 border border-orange-500/20">
              <Hourglass className="text-orange-500" size={20} />
            </div>
          </div>
          <p className="text-2xl font-bold text-orange-500 tracking-tight">{totalPendentes}</p>
        </div>
      </div>

      {/* ─── Linha de Filtros ─── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-surface-300/50 flex items-center justify-center shrink-0 border border-surface-300">
          <Filter size={18} className="text-slate-500" />
        </div>

        <select 
          className="input-field w-auto min-w-[150px] h-10 md:h-11 bg-surface-300/50 border-surface-300 text-sm cursor-pointer rounded-xl text-slate-600 dark:text-slate-300"
          value={filterUser} onChange={e => setFilterUser(e.target.value)}
        >
          <option value="">Todos os usuários</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>

        <select 
          className="input-field w-auto min-w-[150px] h-10 md:h-11 bg-surface-300/50 border-surface-300 text-sm cursor-pointer rounded-xl text-slate-600 dark:text-slate-300"
          value={filterType} onChange={e => setFilterType(e.target.value)}
        >
          <option value="">Todos os tipos</option>
          <option value="DEPOSITO">Depósito</option>
          <option value="SAQUE">Saque</option>
        </select>

        <select 
          className="input-field w-auto min-w-[150px] h-10 md:h-11 bg-surface-300/50 border-surface-300 text-sm cursor-pointer rounded-xl text-slate-600 dark:text-slate-300"
          value={filterMethod} onChange={e => setFilterMethod(e.target.value)}
        >
          <option value="">Todos os métodos</option>
          <option value="Pix">Pix</option>
          <option value="Transferência Bancária (TED/DOC)">Transferência Bancária (TED/DOC)</option>
          <option value="Boleto Bancário">Boleto Bancário</option>
          <option value="PayPal">PayPal</option>
          <option value="Cartão de Credito (Visa/Mastercard)">Cartão de Credito (Visa/Mastercard)</option>
          <option value="Criptomoedas (Stablecoins e Ativos)">Criptomoedas (Stablecoins e Ativos)</option>
          <option value="PicPay">PicPay</option>
          <option value="Outros">Outros</option>
        </select>

        <select 
          className="input-field w-auto min-w-[150px] h-10 md:h-11 bg-surface-300/50 border-surface-300 text-sm cursor-pointer rounded-xl text-slate-600 dark:text-slate-300"
          value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
        >
          <option value="">Todos os status</option>
          <option value="CONCLUIDO">Concluído</option>
          <option value="PENDENTE">Pendente</option>
          <option value="RECUSADO">Recusado</option>
        </select>
      </div>

      {/* ─── Área da Tabela ─── */}
      <div className="card overflow-hidden bg-white dark:bg-surface-200 border border-slate-200 dark:border-surface-300">
        <div className="hidden md:grid grid-cols-[100px_100px_1.5fr_120px_120px_120px_2fr_80px] gap-4 px-6 py-4 bg-slate-50 dark:bg-surface-300/30 border-b border-slate-100 dark:border-surface-300 text-[11px] font-bold text-slate-500 uppercase tracking-widest items-center">
          <span>Data</span>
          <span>Tipo</span>
          <span>Usuário</span>
          <span>Valor</span>
          <span>Método</span>
          <span>Status</span>
          <span>Observação</span>
          <span className="text-right pr-4">Ações</span>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-surface-300/50 rounded-full flex items-center justify-center mb-4 border border-slate-200 dark:border-surface-300">
              <BadgeDollarSign className="text-slate-300 dark:text-slate-500" size={24} />
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">Nenhuma transação registrada ainda.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-surface-300">
            {filteredTransactions.map(t => (
              <div key={t.id} className="grid grid-cols-1 md:grid-cols-[100px_100px_1.5fr_120px_120px_120px_2fr_80px] gap-4 px-6 py-4 text-sm items-center hover:bg-slate-50 dark:hover:bg-surface-300/20 transition-colors">
                <span className="text-slate-600 dark:text-slate-300">{formatDate(t.date)}</span>
                
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded inline-flex w-fit ${
                  t.type === 'DEPOSITO' ? 'bg-green-500/10 text-green-600 dark:text-green-500' : 'bg-pink-500/10 text-pink-600 dark:text-pink-500'
                }`}>
                  {t.type}
                </span>

                <span className="font-bold text-slate-700 dark:text-slate-200 truncate">{t.userName}</span>
                
                <span className={`font-bold ${t.type === 'DEPOSITO' ? 'text-green-600 dark:text-green-400' : 'text-pink-600 dark:text-pink-400'}`}>
                  {t.type === 'DEPOSITO' ? '+' : '-'}{fmt(t.value)}
                </span>
                
                <span className="text-slate-600 dark:text-slate-300">{t.method}</span>
                
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded inline-flex w-fit items-center gap-1.5 ${
                  t.status === 'CONCLUIDO' ? 'bg-green-500/10 text-green-600 dark:text-green-500 border border-green-500/20' : 
                  t.status === 'PENDENTE' ? 'bg-orange-500/10 text-orange-600 dark:text-orange-500 border border-orange-500/20' : 
                  'bg-surface-300 text-slate-500 border border-surface-400'
                }`}>
                  <div className="w-1.5 h-1.5 rounded-full bg-current" />
                  {t.status}
                </span>
                
                <span className="text-slate-500 text-xs truncate">{t.notes || '—'}</span>

                <div className="flex items-center justify-end gap-2 pr-2">
                  <button onClick={() => handleDelete(t.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded transition-all">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Modal de Nova Transação ─── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nova Transação"
        size="md"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-slate-700 dark:text-slate-300">
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Data *</label>
              <input 
                type="date" 
                className="input-field text-sm bg-slate-50 dark:bg-surface-300" 
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tipo *</label>
              <select 
                className="input-field text-sm cursor-pointer bg-slate-50 dark:bg-surface-300"
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value as 'DEPOSITO' | 'SAQUE'})}
                required
              >
                <option value="DEPOSITO">Depósito</option>
                <option value="SAQUE">Saque</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Valor (R$) *</label>
            <CurrencyInput
              value={formData.value ? Number(formData.value) : 0}
              onChange={(v) => setFormData({...formData, value: String(v)})}
              alertLimit={1000}
              className="text-sm bg-slate-50 dark:bg-surface-300"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Usuário *</label>
            <select 
              className="input-field text-sm cursor-pointer bg-slate-50 dark:bg-surface-300"
              value={formData.userId}
              onChange={e => setFormData({...formData, userId: e.target.value})}
              required
            >
              <option value="">Selecione...</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Método *</label>
            <select 
              className="input-field text-sm cursor-pointer bg-slate-50 dark:bg-surface-300"
              value={formData.method}
              onChange={e => setFormData({...formData, method: e.target.value})}
              required
            >
              <option value="">Selecione...</option>
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

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</label>
            <select 
              className="input-field text-sm cursor-pointer bg-slate-50 dark:bg-surface-300"
              value={formData.status}
              onChange={e => setFormData({...formData, status: e.target.value as 'CONCLUIDO' | 'PENDENTE' | 'RECUSADO'})}
            >
              <option value="CONCLUIDO">Concluído</option>
              <option value="PENDENTE">Pendente</option>
              <option value="RECUSADO">Recusado</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Observação</label>
            <textarea 
              className="input-field text-sm resize-none bg-slate-50 dark:bg-surface-300" 
              rows={3} 
              placeholder="Ex: bônus, rollover, saque parcial..."
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
            ></textarea>
          </div>

          {/* Botões do Rodapé */}
          <div className="grid grid-cols-2 gap-4 mt-2">
            <button 
              type="button" 
              onClick={() => setIsModalOpen(false)}
              className="btn-secondary py-3 text-sm font-bold border-slate-200 dark:border-surface-400"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="py-3 px-4 bg-[#0bb489] hover:bg-[#0aa07a] text-white font-bold rounded-lg transition-colors text-sm shadow-sm flex items-center justify-center"
            >
              Registrar
            </button>
          </div>
        </form>
      </Modal>

    </div>
  )
}
