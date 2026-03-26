import { useState, useMemo, useEffect } from 'react'
import { CheckCircle, XCircle, MinusCircle, Clock, Edit2, Trash2, TrendingUp, Target, User, Plus, X, AlertTriangle, Hash, Calendar, Link as LinkIcon, DollarSign } from 'lucide-react'
import { formatCurrency } from '../utils/formatters'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { useAuth } from '../contexts/AuthContext'
import { usersService } from '../services/users.service'
import { CurrencyInput } from '../components/ui/CurrencyInput'
import { SportSelect } from '../components/ui/SportSelect'
import toast from 'react-hot-toast'

// --- Types & Config ---

export type StatusType = 'GREEN' | 'RED' | 'VOID' | 'PENDING' | 'CASHOUT'

export interface Tipster {
  id: string
  name: string
}

export interface Transaction {
  id: string
  tipsterId: string
  tipsterName: string
  tipDate: string
  linkAposta: string
  tipoAposta: string
  sportsList: string[]
  odds: number
  stake: number
  status: StatusType | 'CASHOUT'
  profit: number
  event?: string
  market?: string
}

const STATUS_CONFIG: Record<StatusType, { label: string, colorClass: string, icon: React.ReactNode }> = {
  GREEN:   { label: 'Green',    colorClass: 'bg-emerald-50 text-emerald-600 border border-emerald-100', icon: <CheckCircle size={14} /> },
  RED:     { label: 'Red',      colorClass: 'bg-rose-50 text-rose-600 border border-rose-100',           icon: <XCircle size={14} /> },
  VOID:    { label: 'Anulada',  colorClass: 'bg-slate-50 text-slate-400 border border-slate-100', icon: <MinusCircle size={14} /> },
  PENDING: { label: 'Pendente', colorClass: 'bg-amber-50 text-amber-600 border border-amber-100', icon: <Clock size={14} /> },
  CASHOUT: { label: 'Cash Out', colorClass: 'bg-orange-50 text-orange-600 border border-orange-100', icon: <DollarSign size={14} /> },
}

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: '1', tipsterId: 't1', tipsterName: 'Mestre das Odds', tipDate: '2023-10-30', linkAposta: '', tipoAposta: 'Simples', sportsList: ['Futebol'], odds: 1.85, stake: 100, status: 'GREEN', profit: 85 },
  { id: '2', tipsterId: 't1', tipsterName: 'Mestre das Odds', tipDate: '2023-10-29', linkAposta: '', tipoAposta: 'Múltipla', sportsList: ['Futebol', 'Basquete'], odds: 2.0, stake: 50, status: 'RED', profit: -50 },
  { id: '3', tipsterId: 't2', tipsterName: 'Green VIP', tipDate: '2023-10-28', linkAposta: '', tipoAposta: 'Simples', sportsList: ['Basquete'], odds: 1.9, stake: 200, status: 'VOID', profit: 0 },
  { id: '4', tipsterId: 't1', tipsterName: 'Mestre das Odds', tipDate: '2023-10-31', linkAposta: '', tipoAposta: 'Simples', sportsList: ['Futebol'], odds: 1.5, stake: 150, status: 'PENDING', profit: 0 },
  { id: '5', tipsterId: 't3', tipsterName: 'Rei do Escanteio', tipDate: '2023-10-25', linkAposta: '', tipoAposta: 'Simples', sportsList: ['Futebol'], odds: 1.9, stake: 100, status: 'GREEN', profit: 90 },
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

const formField = 'w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all placeholder:text-slate-300'
const formLabel = 'block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5'

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
    tipsterId: '', tipDate: new Date().toLocaleDateString('en-CA'), linkAposta: '', tipoAposta: 'Simples',
    qtdEsportes: '', sportsList: [] as string[], odds: '', stake: '', status: 'GREEN' as StatusType | 'CASHOUT'
  })

  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setForm({
          tipsterId: editData.tipsterId, tipDate: editData.tipDate, linkAposta: editData.linkAposta || '',
          tipoAposta: editData.tipoAposta || editData.market || editData.event || 'Simples', 
          qtdEsportes: editData.sportsList?.length ? String(editData.sportsList.length) : '',
          sportsList: editData.sportsList || [], odds: String(editData.odds || ''), stake: String(editData.stake || ''), status: editData.status
        })
      } else {
        const matchingTipster = tipsters.find(t => t.name.toLowerCase() === user?.name.toLowerCase())
        setForm({
          tipsterId: matchingTipster?.id || user?.id || 'manual', 
          tipDate: new Date().toLocaleDateString('en-CA'), linkAposta: '', tipoAposta: 'Simples',
          qtdEsportes: '', sportsList: [], odds: '', stake: '', status: 'GREEN'
        })
      }
    }
  }, [isOpen, editData, tipsters, user])

  if (!isOpen) return null

  const updateQtdEsportes = (qty: string) => {
    const n = Math.max(0, Math.min(20, Number(qty) || 0))
    const prev = form.sportsList
    const next = Array.from({ length: n }, (_, i) => prev[i] ?? '')
    setForm(f => ({ ...f, qtdEsportes: qty, sportsList: next }))
  }

  const updateSportAt = (idx: number, val: string) => {
    setForm(f => {
      const list = [...f.sportsList]
      list[idx] = val
      return { ...f, sportsList: list }
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const odds = Number(form.odds) || 0
    const stake = Number(form.stake) || 0
    let profit = 0
    if (form.status === 'GREEN') {
      profit = stake * (odds - 1)
    } else if (form.status === 'RED') {
      profit = -stake
    }
    
    onSave({
      id: editData?.id,
      tipsterId: form.tipsterId,
      tipDate: form.tipDate,
      linkAposta: form.linkAposta,
      tipoAposta: form.tipoAposta,
      sportsList: form.sportsList,
      status: form.status,
      odds,
      stake,
      profit
    })
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-[6px]" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white rounded-[2.5rem] flex flex-col overflow-hidden border border-slate-100">
          <div className="flex items-center justify-between p-6 border-b border-slate-50">
            <h2 className="text-xl font-black text-slate-800 tracking-tight">
              {editData ? 'Editar Registro' : 'Novo Registro'}
            </h2>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-300 hover:bg-slate-50 transition-colors"><X size={18} /></button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
            <div className="flex flex-col gap-2 opacity-80">
              <label className={formLabel}>Tipster (Automático)</label>
              <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-slate-400 text-sm font-bold cursor-not-allowed mb-2">
                {editData ? editData.tipsterName : user?.name}
              </div>
            </div>

            {/* Data */}
            <div>
              <label className={formLabel}><Calendar size={10} className="inline mr-1" />Data</label>
              <input type="date" className={formField} required value={form.tipDate} onChange={e => setForm(f => ({ ...f, tipDate: e.target.value }))} />
            </div>

            {/* Link de Aposta */}
            <div>
              <label className={formLabel}><LinkIcon size={10} className="inline mr-1" />Link de Aposta</label>
              <input type="url" className={formField} placeholder="https://..." value={form.linkAposta} onChange={e => setForm(f => ({ ...f, linkAposta: e.target.value }))} />
            </div>

            {/* Tipo de Aposta */}
            <div>
              <label className={formLabel}>Tipo de Aposta</label>
              <select className={formField} value={form.tipoAposta} onChange={e => setForm(f => ({ ...f, tipoAposta: e.target.value }))}>
                <option value="Simples">Simples</option>
                <option value="Múltipla">Múltipla</option>
                <option value="Criar Aposta">Criar Aposta</option>
              </select>
            </div>

            {/* Quantidade de Esportes */}
            <div>
              <label className={formLabel}><Hash size={10} className="inline mr-1" />Quantidade de Esportes</label>
              <input type="number" min="0" max="20" className={formField} placeholder="Ex: 2" value={form.qtdEsportes} onChange={e => updateQtdEsportes(e.target.value)} />
            </div>

            {/* Dynamic Sport Selects */}
            {form.sportsList.length > 0 && (
              <div className="flex flex-col gap-2 pl-3 border-l-2 border-emerald-200">
                {form.sportsList.map((sp, idx) => (
                  <div key={idx}>
                    <label className={formLabel}>Esporte {idx + 1}</label>
                    <SportSelect value={sp} onChange={v => updateSportAt(idx, v)} />
                  </div>
                ))}
              </div>
            )}

            {/* Odd + Stake */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={formLabel}>Odd</label>
                <input type="number" step="0.01" min="1" required className={formField} placeholder="Ex: 1.85" value={form.odds} onChange={e => setForm(f => ({ ...f, odds: e.target.value }))} />
              </div>
              <div>
                <label className={formLabel}>Stake (R$)</label>
                <CurrencyInput value={form.stake ? Number(form.stake) : 0} onChange={v => setForm(f => ({ ...f, stake: String(v) }))} alertLimit={5000} className={formField} />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className={formLabel}>Status</label>
              <select className={formField} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as StatusType | 'CASHOUT' }))}>
                <option value="PENDING">— Pendente —</option>
                <option value="GREEN">✅ Green</option>
                <option value="RED">❌ Red</option>
                <option value="CASHOUT">🟠 Cash Out</option>
                <option value="VOID">⚪ Anulado</option>
              </select>
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

  const isAdmin = user?.role === 'MASTER' || user?.role === 'ADMIN'
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

  const checkPermission = (item: Transaction) => {
    const isOwner = item.tipsterId === user?.id || item.tipsterName.toLowerCase() === user?.name?.toLowerCase()
    if (isOwner || isAdmin) return true
    
    toast.error('Você não tem permissão, apenas administradores.')
    return false
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
  const totalInvested = filteredTransactions.reduce((acc, t) => acc + t.stake, 0)
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
      const parts = t.tipDate.split('-')
      const label = parts.length === 3 ? `${parts[2]}/${parts[1]}` : t.tipDate
      
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
          <button 
            onClick={() => { setEditTarget(null); setIsModalOpen(true) }}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black uppercase tracking-widest px-6 py-3 rounded-xl transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
          >
            <Plus size={16} /> Novo Registro
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <th className="px-8 py-5">Tipster</th>
                <th className="px-8 py-5">Data</th>
                <th className="px-8 py-5">Aposta</th>
                <th className="px-8 py-5">Odd / Stake</th>
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
                  const parts = t.tipDate.split('-')
                  const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : t.tipDate

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
                        <p className="text-sm font-black text-slate-800 tracking-tight leading-tight mb-1 max-w-[200px] truncate">
                          {t.tipoAposta || t.event || 'Simples'}
                        </p>
                        {t.sportsList && t.sportsList.length > 0 ? (
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                            {t.sportsList.join(', ')}
                          </p>
                        ) : t.market ? (
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                            {t.market}
                          </p>
                        ) : null}
                        {t.linkAposta && (
                          <a href={t.linkAposta} target="_blank" rel="noreferrer" className="inline-flex mt-1 text-[10px] text-blue-500 hover:underline">Acessar Bilhete</a>
                        )}
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <p className="text-xs font-bold text-slate-400 font-mono">
                          @{Number(t.odds || 0).toFixed(2)} <span className="text-slate-200 mx-1">|</span> {formatCurrency(t.stake || 0)}
                        </p>
                        {t.status !== 'PENDING' && (
                          <p className={`text-sm font-black mt-1 tracking-tight ${t.profit > 0 ? 'text-emerald-600' : t.profit < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                            {t.profit > 0 ? '+' : ''}{formatCurrency(t.profit)}
                          </p>
                        )}
                      </td>
                      <td className="px-8 py-6">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm ${(STATUS_CONFIG[t.status] || STATUS_CONFIG.PENDING).colorClass}`}>
                          {(STATUS_CONFIG[t.status] || STATUS_CONFIG.PENDING).icon}
                          {(STATUS_CONFIG[t.status] || STATUS_CONFIG.PENDING).label}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => { if(checkPermission(t)) { setEditTarget(t); setIsModalOpen(true) } }}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors" title="Editar"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => { if(checkPermission(t)) { setDeleteConfirm(t.id) } }}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors" title="Excluir"
                          >
                            <Trash2 size={16} />
                          </button>
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
