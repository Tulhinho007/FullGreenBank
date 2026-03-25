import { useState, useMemo, useEffect } from 'react'
import { CheckCircle, XCircle, MinusCircle, Clock, Edit2, Trash2, TrendingUp, Target, User, Plus, X, AlertTriangle } from 'lucide-react'
import { formatCurrency } from '../utils/formatters'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { useAuth } from '../contexts/AuthContext'
import { usersService } from '../services/users.service'
import { CurrencyInput } from '../components/ui/CurrencyInput'

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
  GREEN:   { label: 'Green',    colorClass: 'bg-emerald-50 text-emerald-600 border border-emerald-100', icon: <CheckCircle size={14} /> },
  RED:     { label: 'Red',      colorClass: 'bg-rose-50 text-rose-600 border border-rose-100',           icon: <XCircle size={14} /> },
  VOID:    { label: 'Anulada',  colorClass: 'bg-slate-50 text-slate-400 border border-slate-100', icon: <MinusCircle size={14} /> },
  PENDING: { label: 'Pendente', colorClass: 'bg-amber-50 text-amber-600 border border-amber-100', icon: <Clock size={14} /> },
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
    <div className="fixed inset-0 z-[80] bg-slate-900/50 backdrop-blur-[6px]" onClick={onCancel} />
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 pointer-events-none">
      <div className="w-full max-w-sm pointer-events-auto bg-white rounded-[2.5rem] border border-slate-100  p-8">
        <div className="w-16 h-16 rounded-[1.5rem] bg-rose-50 flex items-center justify-center mx-auto mb-6 border border-rose-100">
          <AlertTriangle size={32} className="text-rose-500" />
        </div>
        <h3 className="text-lg font-black text-slate-800 text-center mb-2 tracking-tight">{title}</h3>
        <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 text-center mb-8">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 rounded-xl border border-slate-100 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-colors">Cancelar</button>
          <button onClick={onConfirm} className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-rose-500/20">Confirmar</button>
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
      <div className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-[6px]" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-[2.5rem]  flex flex-col overflow-hidden border border-slate-100">
          <div className="flex items-center justify-between p-8 border-b border-slate-50">
            <h2 className="text-xl font-black text-slate-800 tracking-tight">
              {editData ? 'Editar Registro' : 'Novo Registro'}
            </h2>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-300 hover:bg-slate-50 transition-colors"><X size={18} /></button>
          </div>

          <form onSubmit={handleSubmit} className="p-8 flex flex-col gap-6">
            <div className="flex flex-col gap-2 opacity-80">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tipster (Automático)</label>
              <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-slate-400 text-sm font-bold cursor-not-allowed">
                {editData ? editData.tipsterName : user?.name}
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex flex-col gap-2 flex-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Data</label>
                <input required type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all" />
              </div>
              <div className="flex flex-col gap-2 flex-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as StatusType })} className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer appearance-none">
                  <option value="GREEN">Green</option>
                  <option value="RED">Red</option>
                  <option value="VOID">Anulada</option>
                  <option value="PENDING">Pendente</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Evento / Jogo</label>
              <input required value={form.event} onChange={e => setForm({ ...form, event: e.target.value })} className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder-slate-300" placeholder="Ex: Flamengo x Vasco" />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mercado</label>
              <input required value={form.market} onChange={e => setForm({ ...form, market: e.target.value })} className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder-slate-300" placeholder="Ex: Over 2.5 Gols" />
            </div>

            <div className="flex gap-4">
              <div className="flex flex-col gap-2 flex-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Investimento</label>
                <CurrencyInput
                  value={form.amount ? Number(form.amount) : 0}
                  onChange={(v) => setForm({ ...form, amount: String(v) })}
                  alertLimit={1000}
                  className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
              </div>
              <div className="flex flex-col gap-2 flex-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Lucro / Prejuízo</label>
                <CurrencyInput
                  value={form.profit ? Number(form.profit) : 0}
                  onChange={(v) => setForm({ ...form, profit: String(v) })}
                  alertLimit={1000}
                  className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
              </div>
            </div>

            <button type="submit" className="mt-4 w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-emerald-500/20">
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
        if (!Array.isArray(allUsers)) return
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
    if (!Array.isArray(transactions)) return []
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

  const chartStroke = '#059669'
  const gridColor = '#f1f5f9'

  return (
    <div className="flex flex-col gap-6 w-full pb-10">
      
      {/* HEADER & FILTERS */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <Target className="text-emerald-500" size={32} />
            Dashboard Tipsters
          </h1>
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mt-1">
            Performance e estatísticas em tempo real
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto items-stretch sm:items-center">
          <div className="flex-1 sm:w-64">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Filtro de Tipster</label>
            <select 
              value={selectedTipsterId} 
              onChange={e => setSelectedTipsterId(e.target.value)}
              className="w-full bg-white border border-slate-100 rounded-xl px-5 py-3 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all appearance-none cursor-pointer shadow-sm"
            >
              <option value="all">Visão Geral (Todos)</option>
              {tipsters.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="bg-white border border-slate-100 rounded-[1.5rem] px-6 py-3 flex items-center gap-8 shadow-sm">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lucro Total</p>
              <p className={`text-xl font-black tracking-tight ${totalProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatCurrency(totalProfit)}
              </p>
            </div>
            <div className="w-px h-10 bg-slate-50"></div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ROI Líquido</p>
              <p className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-1">
                <TrendingUp size={18} className="text-blue-500" />
                {roi}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* GREEN */}
        <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm hover:shadow-md transition-all group">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 rounded-[1.25rem] bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform border border-emerald-100">
              <CheckCircle size={24} />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Greens</span>
          </div>
          <h3 className="text-3xl font-black text-slate-800 tracking-tight">{counts.green}</h3>
          <p className="text-[10px] font-bold text-emerald-600/60 uppercase tracking-wider mt-1">Apostas ganhas</p>
        </div>
        {/* RED */}
        <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm hover:shadow-md transition-all group">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 rounded-[1.25rem] bg-rose-50 flex items-center justify-center text-rose-600 group-hover:scale-110 transition-transform border border-rose-100">
              <XCircle size={24} />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reds</span>
          </div>
          <h3 className="text-3xl font-black text-slate-800 tracking-tight">{counts.red}</h3>
          <p className="text-[10px] font-bold text-rose-600/60 uppercase tracking-wider mt-1">Apostas perdidas</p>
        </div>
        {/* VOID */}
        <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm hover:shadow-md transition-all group">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 rounded-[1.25rem] bg-slate-50 flex items-center justify-center text-slate-400 group-hover:scale-110 transition-transform border border-slate-100">
              <MinusCircle size={24} />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Anuladas</span>
          </div>
          <h3 className="text-3xl font-black text-slate-800 tracking-tight">{counts.void}</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Devoluções (Void)</p>
        </div>
        {/* PENDING */}
        <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm hover:shadow-md transition-all group">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 rounded-[1.25rem] bg-amber-50 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform border border-amber-100">
              <Clock size={24} />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pendentes</span>
          </div>
          <h3 className="text-3xl font-black text-slate-800 tracking-tight">{counts.pending}</h3>
          <p className="text-[10px] font-bold text-amber-600/60 uppercase tracking-wider mt-1">Aguardando resultado</p>
        </div>
      </div>

      {/* CHART SECTION */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Evolução de Patrimônio</h2>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
            Lucro Acumulado
          </span>
        </div>
        
        <div className="w-full h-[300px] min-h-[300px]">
          {chartData.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center text-sm text-slate-400">
              Nenhum dado com lucro suficiente para montagem do gráfico.
            </div>
          ) : (
            <ResponsiveContainer width="99%" height="100%">
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
                  tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} 
                  dy={15}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} 
                  tickFormatter={(val) => user?.currency === 'BRL' ? `R$ ${val}` : user?.currency === 'USD' ? `$${val}` : `€${val}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    borderColor: '#f1f5f9',
                    borderRadius: '24px',
                    padding: '16px',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05)'
                  }}
                  itemStyle={{ color: '#059669', fontWeight: 900, fontSize: '14px' }}
                  formatter={(val: any) => [formatCurrency(Number(val)), 'Lucro Acumulado']}
                  labelStyle={{ color: '#94a3b8', fontWeight: 900, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}
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
      <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/30">
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Registros de Apostas</h2>
          {isTipster && (
            <button 
              onClick={() => { setEditTarget(null); setIsModalOpen(true) }}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black uppercase tracking-widest px-6 py-3 rounded-xl transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
            >
              <Plus size={16} /> Novo Registro
            </button>
          )}
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <th className="px-8 py-5">Tipster</th>
                <th className="px-8 py-5">Data</th>
                <th className="px-8 py-5">Evento / Mercado</th>
                <th className="px-8 py-5">Investimento</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
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
                    <tr key={t.id} className="hover:bg-slate-50/50 transition-all group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                            <User size={16} className="text-slate-300" />
                          </div>
                          <span className="text-sm font-black text-slate-800 tracking-tight uppercase">{t.tipsterName}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-xs text-slate-400 font-bold whitespace-nowrap">
                        {formattedDate}
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-sm font-black text-slate-800 tracking-tight leading-tight mb-1 max-w-[200px] truncate" title={t.event}>{t.event}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.market}</p>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <p className="text-xs font-bold text-slate-400">{formatCurrency(t.amount)}</p>
                        <p className={`text-sm font-black mt-1 tracking-tight ${t.profit > 0 ? 'text-emerald-600' : t.profit < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                          {t.profit > 0 ? '+' : ''}{formatCurrency(t.profit)}
                        </p>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm ${(STATUS_CONFIG[t.status] || STATUS_CONFIG.PENDING).colorClass}`}>
                          {(STATUS_CONFIG[t.status] || STATUS_CONFIG.PENDING).icon}
                          {(STATUS_CONFIG[t.status] || STATUS_CONFIG.PENDING).label}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {(isTipster && (t.tipsterName.toLowerCase() === user?.name.toLowerCase() || user?.role === 'MASTER' || user?.role === 'ADMIN')) && (
                            <>
                              <button 
                                onClick={() => { setEditTarget(t); setIsModalOpen(true) }}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors" title="Editar"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button 
                                onClick={() => setDeleteConfirm(t.id)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors" title="Excluir"
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
