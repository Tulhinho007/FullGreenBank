import { useState, useMemo, useEffect } from 'react'
import { CheckCircle, XCircle, MinusCircle, Clock, Edit2, Trash2, TrendingUp, DollarSign, Target, User } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { Tipster } from '../components/ui/TipstersModal'

// --- Mock Data ---

const MOCK_EVOLUTION_DATA = [
  { date: '01/10', profit: 0 },
  { date: '05/10', profit: 50 },
  { date: '10/10', profit: 120 },
  { date: '15/10', profit: 80 },
  { date: '20/10', profit: 210 },
  { date: '25/10', profit: 190 },
  { date: '30/10', profit: 320 },
]

type StatusType = 'GREEN' | 'RED' | 'VOID' | 'PENDING'

interface Transaction {
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

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: '1', tipsterId: 't1', tipsterName: 'Mestre das Odds', date: '30/10/2023', event: 'Flamengo x Vasco', market: 'Over 2.5 Gols', status: 'GREEN', amount: 100, profit: 85 },
  { id: '2', tipsterId: 't1', tipsterName: 'Mestre das Odds', date: '29/10/2023', event: 'Arsenal x Chelsea', market: 'Ambas Marcam', status: 'RED', amount: 50, profit: -50 },
  { id: '3', tipsterId: 't2', tipsterName: 'Green VIP', date: '28/10/2023', event: 'Lakers x Warriors', market: 'Handicap -5.5', status: 'VOID', amount: 200, profit: 0 },
  { id: '4', tipsterId: 't1', tipsterName: 'Mestre das Odds', date: '31/10/2023', event: 'Real Madrid x Barcelona', market: 'Vitória Real', status: 'PENDING', amount: 150, profit: 0 },
  { id: '5', tipsterId: 't3', tipsterName: 'Rei do Escanteio', date: '25/10/2023', event: 'Boca x River', market: 'Mais de 9.5 Escanteios', status: 'GREEN', amount: 100, profit: 90 },
]

const STATUS_CONFIG: Record<StatusType, { label: string, colorClass: string, icon: React.ReactNode }> = {
  GREEN:   { label: 'Green',    colorClass: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/50', icon: <CheckCircle size={14} /> },
  RED:     { label: 'Red',      colorClass: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/50',           icon: <XCircle size={14} /> },
  VOID:    { label: 'Anulada',  colorClass: 'bg-slate-100 dark:bg-surface-300 text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-surface-400', icon: <MinusCircle size={14} /> },
  PENDING: { label: 'Pendente', colorClass: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800/50', icon: <Clock size={14} /> },
}

export const GestaoTipstersPage = () => {
  const [tipsters, setTipsters] = useState<Tipster[]>([])
  const [selectedTipsterId, setSelectedTipsterId] = useState<string>('all')

  // Load Tipsters from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('fgb_tipsters')
      if (stored) {
        setTipsters(JSON.parse(stored))
      }
    } catch (err) {
      console.error('Failed to load tipsters', err)
    }
  }, [])

  const filteredTransactions = useMemo(() => {
    if (selectedTipsterId === 'all') return MOCK_TRANSACTIONS
    return MOCK_TRANSACTIONS.filter(t => t.tipsterId === selectedTipsterId)
  }, [selectedTipsterId])

  // Fake KPI calculations
  const totalProfit = filteredTransactions.reduce((acc, t) => acc + t.profit, 0)
  const totalInvested = filteredTransactions.reduce((acc, t) => acc + t.amount, 0)
  const roi = totalInvested > 0 ? ((totalProfit / totalInvested) * 100).toFixed(2) : '0.00'

  const counts = {
    green: filteredTransactions.filter(t => t.status === 'GREEN').length,
    red: filteredTransactions.filter(t => t.status === 'RED').length,
    void: filteredTransactions.filter(t => t.status === 'VOID').length,
    pending: filteredTransactions.filter(t => t.status === 'PENDING').length,
  }

  // Define dynamic colors based on dark mode class on document
  // In a real scenario, useTheme hook might be better, but this handles responsive SVG rendering
  const isDark = document.documentElement.classList.contains('dark')
  const chartStroke = isDark ? '#4ade80' : '#16a34a' // Green 400 / Green 600
  const gridColor = isDark ? '#334155' : '#e2e8f0' // slate-700 / slate-200

  return (
    <div className="flex flex-col gap-6 w-full pb-10">
      
      {/* --- HEADER & FILTERS --- */}
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
          {/* Select Tipster */}
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
              {/* Fallback mocks if localStorage empty */}
              {tipsters.length === 0 && (
                <>
                  <option value="t1">Mestre das Odds (Mock)</option>
                  <option value="t2">Green VIP (Mock)</option>
                  <option value="t3">Rei do Escanteio (Mock)</option>
                </>
              )}
            </select>
          </div>

          {/* Quick Summary Card */}
          <div className="bg-white dark:bg-surface-200 border border-slate-200 dark:border-surface-400 rounded-xl px-5 py-2.5 flex items-center gap-6 shadow-sm">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Lucro Total</p>
              <p className={`text-lg font-bold flex items-center gap-1 ${totalProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                <DollarSign size={16} />
                {totalProfit.toFixed(2)}
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

      {/* --- KPI CARDS --- */}
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

      {/* --- CHART SECTION --- */}
      <div className="bg-white dark:bg-surface-200 border border-slate-200 dark:border-surface-400 rounded-2xl p-5 lg:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Evolução de Patrimônio</h2>
          <span className="text-xs text-slate-400 bg-slate-100 dark:bg-surface-300 px-2.5 py-1 rounded-full border border-slate-200 dark:border-surface-400">
            Últimos 30 dias
          </span>
        </div>
        
        <div className="w-full h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={MOCK_EVOLUTION_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                tickFormatter={(val) => `R$ ${val}`}
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
                formatter={(val: any) => [`R$ ${Number(val).toFixed(2)}`, 'Lucro Acumulado']}
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
        </div>
      </div>

      {/* --- TRANSACTIONS TABLE --- */}
      <div className="bg-white dark:bg-surface-200 border border-slate-200 dark:border-surface-400 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 lg:p-6 border-b border-slate-200 dark:border-surface-300 flex justify-between items-center bg-slate-50/50 dark:bg-surface-300/20">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Últimos Registros</h2>
          <button className="text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium">
            Ver Todos →
          </button>
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
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-500">
                    Nenhum registro encontrado para este filtro.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(t => (
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
                      {t.date}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-800 dark:text-white">{t.event}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t.market}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-slate-800 dark:text-white">R$ {t.amount.toFixed(2)}</p>
                      <p className={`text-xs font-medium mt-0.5 ${t.profit > 0 ? 'text-green-500' : t.profit < 0 ? 'text-red-500' : 'text-slate-500'}`}>
                        {t.profit > 0 ? '+' : ''}{t.profit.toFixed(2)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${STATUS_CONFIG[t.status].colorClass}`}>
                        {STATUS_CONFIG[t.status].icon}
                        {STATUS_CONFIG[t.status].label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="w-8 h-8 rounded-lg flex items-center justify-center text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title="Editar">
                          <Edit2 size={16} />
                        </button>
                        <button className="w-8 h-8 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Excluir">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
