import { useState, useMemo, useEffect } from 'react'
import { CheckCircle, XCircle, MinusCircle, Clock, Edit2, Trash2, TrendingUp, Target, User, Plus, X, AlertTriangle } from 'lucide-react'
import { formatCurrency } from '../utils/formatters'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { useAuth } from '../contexts/AuthContext'
import { usersService } from '../services/users.service'

// --- Types & Config ---

export type StatusType = 'GREEN' | 'RED' | 'VOID' | 'PENDING'

export interface Tipster {
  id: string
  name: string
}

export interface Transaction {
  id: string
  tipsterId: string
  tipsterName: string
  date: string
  event: string
  market: string
  status: StatusType
  amount: number
  profit: number
}

const STATUS_CONFIG: Record<StatusType, { label: string, colorClass: string, icon: React.ReactNode }> = {
  GREEN:   { label: 'Green',    colorClass: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/50', icon: <CheckCircle size={14} /> },
  RED:     { label: 'Red',      colorClass: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/50',           icon: <XCircle size={14} /> },
  VOID:    { label: 'Anulada',  colorClass: 'bg-slate-100 dark:bg-surface-300 text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-surface-400', icon: <MinusCircle size={14} /> },
  PENDING: { label: 'Pendente', colorClass: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800/50', icon: <Clock size={14} /> },
}

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: '1', tipsterId: 't1', tipsterName: 'Mestre das Odds', date: '2023-10-30', event: 'Flamengo x Vasco', market: 'Over 2.5 Gols', status: 'GREEN', amount: 100, profit: 85 },
  { id: '2', tipsterId: 't1', tipsterName: 'Mestre das Odds', date: '2023-10-29', event: 'Arsenal x Chelsea', market: 'Ambas Marcam', status: 'RED', amount: 50, profit: -50 },
  { id: '3', tipsterId: 't2', tipsterName: 'Green VIP', date: '2023-10-28', event: 'Lakers x Warriors', market: 'Handicap -5.5', status: 'VOID', amount: 200, profit: 0 },
  { id: '4', tipsterId: 't1', tipsterName: 'Mestre das Odds', date: '2023-10-31', event: 'Real Madrid x Barcelona', market: 'Vitória Real', status: 'PENDING', amount: 150, profit: 0 },
  { id: '5', tipsterId: 't3', tipsterName: 'Rei do Escanteio', date: '2023-10-25', event: 'Boca x River', market: 'Mais de 9.5 Escanteios', status: 'GREEN', amount: 100, profit: 90 },
]

// ── Modals ──────────────────────────────────────────────────────────────

const ConfirmPopup = ({ title, message, onConfirm, onCancel }: { title: string; message: string; onConfirm: () => void; onCancel: () => void }) => (
  <>
    <div className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm" onClick={onCancel} />
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 pointer-events-none">
      <div className="w-full max-w-sm pointer-events-auto bg-white dark:bg-surface-200 rounded-2xl border border-slate-200 dark:border-surface-400 shadow-2xl p-6">
        <div className="w-11 h-11 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={20} className="text-red-500" />
        </div>
        <h3 className="text-sm font-semibold text-slate-800 dark:text-white text-center mb-1">{title}</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center mb-5">{message}</p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-2 rounded-xl border font-medium text-xs">Cancelar</button>
          <button onClick={onConfirm} className="flex-1 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-xs transition-colors">Confirmar</button>
        </div>
      </div>
    </div>
  </>
)

interface TransactionModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (t: Omit<Transaction, 'id' | 'tipsterName'> & { id?: string }) => void
  tipsters: Tipster[]
  editData: Transaction | null
}

const TransactionModal = ({ isOpen, onClose, onSave, tipsters, editData }: TransactionModalProps) => {
  const { user } = useAuth()
  const [form, setForm] = useState({
    tipsterId: '', date: new Date().toISOString().split('T')[0], event: '', market: '',
    status: 'GREEN' as StatusType, amount: '', profit: ''
  })

  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setForm({
          tipsterId: editData.tipsterId, date: editData.date, event: editData.event, 
          market: editData.market, status: editData.status, amount: String(editData.amount),
          profit: String(editData.profit)
        })
      } else {
        // Tenta encontrar o tipster que corresponde ao usuário logado
        const matchingTipster = tipsters.find(t => t.name.toLowerCase() === user?.name.toLowerCase())
        
        setForm({
          tipsterId: matchingTipster?.id || user?.id || 'manual', 
          date: new Date().toISOString().split('T')[0],
          event: '', market: '', status: 'GREEN', amount: '', profit: ''
        })
      }
    }
  }, [isOpen, editData, tipsters, user])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    onSave({
      id: editData?.id,
      tipsterId: form.tipsterId,
      date: form.date,
      event: form.event,
      market: form.market,
      status: form.status,
      amount: Number(form.amount) || 0,
      profit: Number(form.profit) || 0
    })
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-surface-200 rounded-2xl shadow-xl flex flex-col">
          <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-surface-300">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
              {editData ? 'Editar Registro' : 'Novo Registro'}
            </h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5 opacity-80">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Tipster (Automático)</label>
              <div className="input-field py-2 bg-slate-50 dark:bg-surface-300/30 text-slate-500 font-medium cursor-not-allowed">
                {editData ? editData.tipsterName : user?.name}
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex flex-col gap-1.5 flex-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Data</label>
                <input required type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="input-field py-2" />
              </div>
              <div className="flex flex-col gap-1.5 flex-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as StatusType })} className="input-field py-2">
                  <option value="GREEN">Green</option>
                  <option value="RED">Red</option>
                  <option value="VOID">Anulada</option>
                  <option value="PENDING">Pendente</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Evento</label>
              <input required value={form.event} onChange={e => setForm({ ...form, event: e.target.value })} className="input-field py-2" placeholder="Ex: Flamengo x Vasco" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Mercado</label>
              <input required value={form.market} onChange={e => setForm({ ...form, market: e.target.value })} className="input-field py-2" placeholder="Ex: Over 2.5 Gols" />
            </div>

              <div className="flex gap-3">
              <div className="flex flex-col gap-1.5 flex-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Investimento</label>
                <input required type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="input-field py-2" placeholder="100.00" />
              </div>
              <div className="flex flex-col gap-1.5 flex-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Lucro / Prej.</label>
                <input required type="number" step="0.01" value={form.profit} onChange={e => setForm({ ...form, profit: e.target.value })} className="input-field py-2" placeholder="Ex: 85.00 ou -50.00" />
              </div>
            </div>

            <button type="submit" className="mt-2 w-full py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white font-semibold transition-colors">
              Salvar Registro
            </button>
          </form>
        </div>
      </div>
    </>
  )
}


// ── Page Main ────────────────────────────────────────────────────────────

export const GestaoTipstersPage = () => {
  const { user } = useAuth()
  const fmt = (v: number) => formatCurrency(v)

  const isTipster = user?.isTipster || user?.role === 'MASTER'
  const [tipsters, setTipsters] = useState<Tipster[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [selectedTipsterId, setSelectedTipsterId] = useState<string>('all')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Transaction | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Load Tipsters and Transactions
  useEffect(() => {
    // Busca usuários que são Tipsters do banco de dados
    usersService.getAll()
      .then(allUsers => {
        const activeTipsters = allUsers
          .filter((u: any) => u.isTipster)
          .map((u: any) => ({ id: u.id, name: u.name }))
        setTipsters(activeTipsters)
      })
      .catch(err => console.error('Failed to load tipsters', err))

    try {
      const storedTx = localStorage.getItem('fgb_tipster_transactions')
      if (storedTx) {
        setTransactions(JSON.parse(storedTx))
      } else {
        setTransactions(MOCK_TRANSACTIONS) // Fallback for preview
      }
    } catch (err) {
      console.error('Failed to load transactions', err)
    }
  }, [])

  const saveTransactions = (newTx: Transaction[]) => {
    setTransactions(newTx)
    localStorage.setItem('fgb_tipster_transactions', JSON.stringify(newTx))
  }

  const handleSaveModal = (data: Omit<Transaction, 'id' | 'tipsterName'> & { id?: string }) => {
    if (data.id) {
      // Edit: Mantém o nome que já estava ou atualiza se mudou o tipsterId
      const tipsterName = tipsters.find(t => t.id === data.tipsterId)?.name || transactions.find(t => t.id === data.id)?.tipsterName || 'Anônimo'
      const updated = transactions.map(t => t.id === data.id ? { ...t, ...data, tipsterName } : t)
      saveTransactions(updated)
    } else {
      // Add: Usa o nome do usuário logado/impersonado
      const tipsterName = user?.name || 'Anônimo'
      const newRecord: Transaction = { ...data, id: crypto.randomUUID(), tipsterName }
      saveTransactions([newRecord, ...transactions])
    }
    setIsModalOpen(false)
  }

  const confirmDelete = () => {
    if (!deleteConfirm) return
    const updated = transactions.filter(t => t.id !== deleteConfirm)
    saveTransactions(updated)
    setDeleteConfirm(null)
  }

  // Derived Data
  const filteredTransactions = useMemo(() => {
    if (selectedTipsterId === 'all') return transactions
    return transactions.filter(t => t.tipsterId === selectedTipsterId)
  }, [selectedTipsterId, transactions])

  const totalProfit = filteredTransactions.reduce((acc, t) => acc + t.profit, 0)
  const totalInvested = filteredTransactions.reduce((acc, t) => acc + t.amount, 0)
  const roi = totalInvested > 0 ? ((totalProfit / totalInvested) * 100).toFixed(2) : '0.00'

  const counts = {
    green: filteredTransactions.filter(t => t.status === 'GREEN').length,
    red: filteredTransactions.filter(t => t.status === 'RED').length,
    void: filteredTransactions.filter(t => t.status === 'VOID').length,
    pending: filteredTransactions.filter(t => t.status === 'PENDING').length,
  }

  // Evolution chart mapping: group by date and sum profit
  const buildEvolutionChart = () => {
    const grouped = filteredTransactions.reduce((acc, t) => {
      // Basic formatting of date (YYYY-MM-DD to DD/MM)
      const parts = t.date.split('-')
      const label = parts.length === 3 ? `${parts[2]}/${parts[1]}` : t.date
      
      if (!acc[label]) acc[label] = 0
      acc[label] += t.profit
      return acc
    }, {} as Record<string, number>)

    // sort keys by actual date conceptually - simple alpha sort if ISO
    const sortedKeys = Object.keys(grouped).sort()
    
    let cum = 0
    return sortedKeys.map(k => {
      cum += grouped[k]
      return { date: k, profit: cum }
    })
  }
  const chartData = useMemo(() => buildEvolutionChart(), [filteredTransactions])

  const isDark = document.documentElement.classList.contains('dark')
  const chartStroke = isDark ? '#4ade80' : '#16a34a'
  const gridColor = isDark ? '#334155' : '#e2e8f0'

  return (
    <div className="flex flex-col gap-6 w-full pb-10">
      
      {/* HEADER & FILTERS */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Target className="text-green-500" />
            Dashboard Tipsters
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Acompanhe o desempenho e as estatísticas dos analistas.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto items-stretch sm:items-center">
          <div className="flex-1 sm:w-64">
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5 ml-1">Tipster</label>
            <select 
              value={selectedTipsterId} 
              onChange={e => setSelectedTipsterId(e.target.value)}
              className="w-full bg-white dark:bg-surface-200 border border-slate-200 dark:border-surface-400 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-white outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all appearance-none cursor-pointer"
            >
              <option value="all">Visão Geral (Todos)</option>
              {tipsters.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
              {tipsters.length === 0 && (
                 <option value="" disabled>Nenhum tipster cadastrado</option>
              )}
            </select>
          </div>

          <div className="bg-white dark:bg-surface-200 border border-slate-200 dark:border-surface-400 rounded-xl px-5 py-2.5 flex items-center gap-6 shadow-sm">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Lucro Total</p>
              <p className={`text-lg font-bold flex items-center gap-1 ${totalProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {formatCurrency(totalProfit)}
              </p>
            </div>
            <div className="w-px h-8 bg-slate-200 dark:bg-surface-300"></div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">ROI</p>
              <p className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-1">
                <TrendingUp size={16} className="text-blue-500" />
                {roi}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* GREEN */}
        <div className="bg-white dark:bg-surface-200 border border-slate-200 dark:border-surface-400 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-green-500/50 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform">
              <CheckCircle size={20} />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase">Greens</span>
          </div>
          <h3 className="text-2xl font-display font-bold text-slate-800 dark:text-white">{counts.green}</h3>
          <p className="text-xs text-slate-500 mt-1">Apostas ganhas</p>
        </div>
        {/* RED */}
        <div className="bg-white dark:bg-surface-200 border border-slate-200 dark:border-surface-400 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-red-500/50 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 group-hover:scale-110 transition-transform">
              <XCircle size={20} />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase">Reds</span>
          </div>
          <h3 className="text-2xl font-display font-bold text-slate-800 dark:text-white">{counts.red}</h3>
          <p className="text-xs text-slate-500 mt-1">Apostas perdidas</p>
        </div>
        {/* VOID */}
        <div className="bg-white dark:bg-surface-200 border border-slate-200 dark:border-surface-400 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-slate-400 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-surface-300 flex items-center justify-center text-slate-600 dark:text-slate-400 group-hover:scale-110 transition-transform">
              <MinusCircle size={20} />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase">Anuladas</span>
          </div>
          <h3 className="text-2xl font-display font-bold text-slate-800 dark:text-white">{counts.void}</h3>
          <p className="text-xs text-slate-500 mt-1">Devoluções (Void)</p>
        </div>
        {/* PENDING */}
        <div className="bg-white dark:bg-surface-200 border border-slate-200 dark:border-surface-400 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-yellow-500/50 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-600 dark:text-yellow-400 group-hover:scale-110 transition-transform">
              <Clock size={20} />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase">Pendentes</span>
          </div>
          <h3 className="text-2xl font-display font-bold text-slate-800 dark:text-white">{counts.pending}</h3>
          <p className="text-xs text-slate-500 mt-1">Aguardando resultado</p>
        </div>
      </div>

      {/* CHART SECTION */}
      <div className="bg-white dark:bg-surface-200 border border-slate-200 dark:border-surface-400 rounded-2xl p-5 lg:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Evolução de Patrimônio</h2>
          <span className="text-xs text-slate-400 bg-slate-100 dark:bg-surface-300 px-2.5 py-1 rounded-full border border-slate-200 dark:border-surface-400">
            Últimos Registros
          </span>
        </div>
        
        <div className="w-full h-[300px]">
          {chartData.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center text-sm text-slate-400">
              Nenhum dado com lucro suficiente para montagem do gráfico.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartStroke} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={chartStroke} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: isDark ? '#94a3b8' : '#64748b' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: isDark ? '#94a3b8' : '#64748b' }} 
                  tickFormatter={(val) => user?.currency === 'BRL' ? `R$ ${val}` : user?.currency === 'USD' ? `$${val}` : `€${val}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDark ? '#1e293b' : '#ffffff', 
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                    borderRadius: '12px',
                    color: isDark ? '#f8fafc' : '#0f172a',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                  itemStyle={{ color: chartStroke, fontWeight: 'bold' }}
                  formatter={(val: any) => [formatCurrency(Number(val)), 'Lucro Acumulado']}
                  labelStyle={{ color: isDark ? '#94a3b8' : '#64748b', marginBottom: '4px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="profit" 
                  stroke={chartStroke} 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorProfit)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* TRANSACTIONS TABLE */}
      <div className="bg-white dark:bg-surface-200 border border-slate-200 dark:border-surface-400 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 lg:p-6 border-b border-slate-200 dark:border-surface-300 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50 dark:bg-surface-300/20">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Registros de Apostas</h2>
          {isTipster && (
            <button 
              onClick={() => { setEditTarget(null); setIsModalOpen(true) }}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              <Plus size={16} /> Novo Registro
            </button>
          )}
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-surface-300/50 border-b border-slate-200 dark:border-surface-300">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tipster</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Data</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Evento / Mercado</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Investimento</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-24">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-surface-300/50">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-500">
                    Nenhum registro encontrado para este filtro. Adicione novas transações.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(t => {
                  // Basic formatting of date
                  const parts = t.date.split('-')
                  const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : t.date

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/80 dark:hover:bg-surface-300/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-surface-300 dark:bg-surface-400 flex items-center justify-center shrink-0">
                            <User size={14} className="text-slate-500 dark:text-slate-300" />
                          </div>
                          <span className="text-sm font-semibold text-slate-800 dark:text-white">{t.tipsterName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {formattedDate}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-slate-800 dark:text-white max-w-[200px] truncate" title={t.event}>{t.event}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t.market}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-slate-800 dark:text-white">{formatCurrency(t.amount)}</p>
                        <p className={`text-xs font-medium mt-0.5 ${t.profit > 0 ? 'text-green-500' : t.profit < 0 ? 'text-red-500' : 'text-slate-500'}`}>
                          {t.profit > 0 ? '+' : ''}{formatCurrency(t.profit)}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${(STATUS_CONFIG[t.status] || STATUS_CONFIG.PENDING).colorClass}`}>
                          {(STATUS_CONFIG[t.status] || STATUS_CONFIG.PENDING).icon}
                          {(STATUS_CONFIG[t.status] || STATUS_CONFIG.PENDING).label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          {(isTipster && (t.tipsterName.toLowerCase() === user?.name.toLowerCase() || user?.role === 'MASTER' || user?.role === 'ADMIN')) && (
                            <>
                              <button 
                                onClick={() => { setEditTarget(t); setIsModalOpen(true) }}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title="Editar"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button 
                                onClick={() => setDeleteConfirm(t.id)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Excluir"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveModal}
        tipsters={tipsters}
        editData={editTarget}
      />
      
      {deleteConfirm && (
        <ConfirmPopup 
          title="Excluir Registro"
          message="Tem certeza que deseja remover este registro permanentemente?"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  )
}
