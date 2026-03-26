import {
  TrendingUp,
  DollarSign,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Calendar,
  PieChart
} from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import { formatCurrency } from '../utils/formatters'
import { useAuth } from '../contexts/AuthContext'
import { tipsService } from '../services/tips.service'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

export type StatusType = 'GREEN' | 'RED' | 'VOID' | 'PENDING' | 'CASHOUT'
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
  status: StatusType
  profit: number
}

const StatCard = ({ title, value, subValue, icon: Icon, trend }: {
  title: string;
  value: string;
  subValue?: string;
  icon: any;
  trend?: 'up' | 'down' | 'neutral'
}) => (
  <div className="bg-white p-6 rounded-[2rem] border border-slate-100 hover:border-emerald-600/40 transition-all duration-300 shadow-sm group">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
        <h3 className="text-2xl font-display font-bold text-slate-800 mt-1">{value}</h3>
        {subValue && (
          <div className="flex items-center gap-1 mt-2">
            {trend === 'up' ? (
              <ArrowUpRight size={14} className="text-emerald-500" />
            ) : trend === 'down' ? (
              <ArrowDownRight size={14} className="text-rose-500" />
            ) : null}
            <span className={`text-[11px] font-bold ${trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-rose-500' : 'text-slate-400'}`}>
              {subValue}
            </span>
          </div>
        )}
      </div>
      <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
        <Icon size={24} className="text-emerald-600" />
      </div>
    </div>
  </div>
);

export const ReportsPage = () => {
  const { user } = useAuth()
  const [filterType, setFilterType] = useState<'month' | 'total'>('total')
  const [transactions, setTransactions] = useState<Transaction[]>([])

  useEffect(() => {
    async function loadData() {
      try {
        if (user?.role === 'MASTER') {
          // Conta Master: puxa da página histórico de dicas (backend)
          const params = { page: 1, limit: 1000 }
          const backendData = await tipsService.getAll(params.page, params.limit)
          const tipsArray = Array.isArray(backendData.tips) ? backendData.tips : []
          
          const mappedTx: Transaction[] = tipsArray.map((tip: any) => ({
            id: tip.id,
            tipsterId: user.id || 'master',
            tipsterName: user.name || 'Master',
            tipDate: tip.tipDate ? String(tip.tipDate).split('T')[0] : new Date().toLocaleDateString('en-CA'),
            linkAposta: tip.linkAposta || '',
            tipoAposta: tip.tipoAposta || 'Simples',
            sportsList: tip.sportsList || [tip.sport || 'Futebol'],
            odds: Number(tip.odds) || 1,
            stake: Number(tip.stake) || 0,
            status: (tip.result as StatusType) || 'PENDING',
            profit: Number(tip.profit) || 0
          }))
          setTransactions(mappedTx)
        } else {
          // Outras contas (Gestão Tipsters) lê do localStorage / registros atrelados
          const storedTx = localStorage.getItem('fgb_tipster_transactions')
          if (storedTx) {
            const allTx: Transaction[] = JSON.parse(storedTx)
            const myTx = allTx.filter(t => 
              t.tipsterName.toLowerCase() === user?.name?.toLowerCase() || 
              t.tipsterId === user?.id
            )
            setTransactions(myTx)
          }
        }
      } catch (error) {
        console.error('Erro ao carregar transações para relatórios:', error)
      }
    }
    loadData()
  }, [user])

  // --- Calculations ---
  
  const currentMonthDate = new Date()
  const currentMonth = `${currentMonthDate.getFullYear()}-${String(currentMonthDate.getMonth() + 1).padStart(2, '0')}`

  const filteredTransactions = useMemo(() => {
    if (filterType === 'month') {
      return transactions.filter(t => t.tipDate.startsWith(currentMonth))
    }
    return transactions
  }, [transactions, filterType, currentMonth])

  const metrics = useMemo(() => {
    const finalized = filteredTransactions.filter(t => t.status !== 'PENDING')
    const greens = finalized.filter(t => t.status === 'GREEN' || t.status === 'CASHOUT')
    const reds = finalized.filter(t => t.status === 'RED')
    const voids = finalized.filter(t => t.status === 'VOID')
    
    const profit = finalized.reduce((acc, t) => acc + (t.profit || 0), 0)
    const invested = finalized.reduce((acc, t) => acc + (t.stake || 0), 0)
    
    const winRateVal = greens.length + reds.length > 0 
      ? (greens.length / (greens.length + reds.length)) * 100 
      : 0
      
    const roiVal = invested > 0 ? (profit / invested) * 100 : 0
    const avgBetVal = finalized.length > 0 ? invested / finalized.length : 0

    return { profit, invested, winRateVal, roiVal, avgBetVal, greens, reds, voids, finalizedCount: finalized.length }
  }, [filteredTransactions])

  // --- Insights Generation ---
  
  const insights = useMemo(() => {
    const finalized = transactions.filter(t => t.status !== 'PENDING')
    if (finalized.length === 0) {
      return {
        bestSportMsg: "Você ainda não possui dados segmentados suficientes por esportes.",
        bestTypeMsg: "Sua diversificação de apostas ainda está construindo os primeiros lucros."
      }
    }

    const sportsStats: Record<string, { wins: number, total: number, profit: number }> = {}
    finalized.forEach(t => {
      const list = t.sportsList && t.sportsList.length > 0 ? t.sportsList : ['Sem Categoria']
      list.forEach(sport => {
        if(!sportsStats[sport]) sportsStats[sport] = { wins: 0, total: 0, profit: 0 }
        
        if (t.status !== 'VOID') {
          sportsStats[sport].total++
          if(t.status === 'GREEN' || t.status === 'CASHOUT') sportsStats[sport].wins++
        }
        sportsStats[sport].profit += t.profit || 0
      })
    })

    let bestSport = { name: '', winRate: 0, profit: -99999, total: 0 }
    Object.entries(sportsStats).forEach(([name, stats]) => {
      const rate = stats.total > 0 ? (stats.wins / stats.total) * 100 : 0
      if (stats.profit > bestSport.profit || (stats.profit === bestSport.profit && rate > bestSport.winRate)) {
        bestSport = { name, winRate: rate, profit: stats.profit, total: stats.total }
      }
    })

    const typeStats: Record<string, { profit: number, total: number }> = {}
    finalized.forEach(t => {
      const type = t.tipoAposta || 'Simples'
      if(!typeStats[type]) typeStats[type] = { profit: 0, total: 0 }
      typeStats[type].total++
      typeStats[type].profit += t.profit || 0
    })

    let bestType = { name: '', profit: -99999 }
    Object.entries(typeStats).forEach(([name, stats]) => {
      if (stats.profit > bestType.profit) {
        bestType = { name, profit: stats.profit }
      }
    })

    return {
      bestSportMsg: bestSport.name && bestSport.total > 0 
        ? `Seu melhor esporte para aposta é ${bestSport.name}, com ${bestSport.winRate.toFixed(1)}% de aproveitamento.`
        : "Você ainda não possui dados segmentados suficientes por esportes.",
      bestTypeMsg: bestType.name && bestType.profit > 0
        ? `Sua maior rentabilidade vem de apostas da categoria "${bestType.name}", com um saldo de ${formatCurrency(bestType.profit)}.`
        : "Sua diversificação de apostas ainda está construindo os primeiros lucros."
    }
  }, [transactions])

  // --- Evolution Chart ---
  
  const chartData = useMemo(() => {
    const finalized = filteredTransactions.filter(t => t.status !== 'PENDING')
    const grouped = finalized.reduce((acc, t) => {
      const parts = t.tipDate.split('-')
      const label = parts.length === 3 ? `${parts[2]}/${parts[1]}` : t.tipDate
      if(!acc[label]) acc[label] = 0
      acc[label] += t.profit || 0
      return acc
    }, {} as Record<string, number>)

    const sortedKeys = Object.keys(grouped).sort()
    let cum = 0
    return sortedKeys.map(k => {
      cum += grouped[k]
      return { date: k, balance: cum }
    })
  }, [filteredTransactions])

  const chartColors = { stroke: '#10b981', fill: 'url(#colorProfit)', grid: '#f1f5f9', text: '#94a3b8', tooltipBg: '#ffffff', tooltipBorder: '#f1f5f9', tooltipText: '#0f172a' }

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-800">Relatório de Performance</h1>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">Visão geral da saúde e crescimento estatístico</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-2xl p-1.5 shadow-inner">
          <button 
            onClick={() => setFilterType('month')}
            className={`px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${filterType === 'month' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 active:scale-95' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Este Mês
          </button>
          <button 
            onClick={() => setFilterType('total')}
            className={`px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${filterType === 'total' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 active:scale-95' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Total
          </button>
        </div>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="ROI Acumulado" 
          value={`${metrics.roiVal > 0 ? '+' : ''}${metrics.roiVal.toFixed(2)}%`} 
          subValue={metrics.finalizedCount > 0 ? "Retorno sobre o capital investido" : "Sem dados de aposta"} 
          trend={metrics.roiVal > 0 ? "up" : metrics.roiVal < 0 ? "down" : "neutral"} 
          icon={TrendingUp} 
        />
        <StatCard 
          title="Lucro Total" 
          value={formatCurrency(metrics.profit)} 
          subValue={""} 
          trend={metrics.profit > 0 ? "up" : metrics.profit < 0 ? "down" : "neutral"} 
          icon={DollarSign} 
        />
        <StatCard 
          title="Win Rate" 
          value={`${metrics.winRateVal.toFixed(1)}%`} 
          subValue={`Métrica apurada sobre ${metrics.greens.length + metrics.reds.length} resolvidas`} 
          icon={Target} 
          trend={metrics.winRateVal >= 50 ? "up" : metrics.winRateVal > 0 ? "down" : "neutral"}
        />
      </div>

      {/* Main Chart Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-display font-bold text-slate-800 flex items-center gap-2">
              <Activity size={18} className="text-emerald-500" />
              Curva de Acumulada de Lucro
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saldo Histórico</span>
              </div>
            </div>
          </div>
          
          <div className="h-[350px] w-full">
            {chartData.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-sm text-slate-400">
                O gráfico de evolução requer pelo menos uma aposta cadastrada.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: chartColors.text, fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: chartColors.text, fontSize: 12 }}
                    tickFormatter={(val) => user?.currency === 'BRL' ? `R$ ${val}` : user?.currency === 'USD' ? `$${val}` : `€${val}`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: chartColors.tooltipBg, 
                      border: `1px solid ${chartColors.tooltipBorder}`,
                      borderRadius: '16px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                    }}
                    itemStyle={{ color: chartColors.tooltipText, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                    labelStyle={{ color: '#94a3b8', fontWeight: 900, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}
                    formatter={(val: any) => [formatCurrency(Number(val)), 'Lucro Acumulado']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="balance" 
                    stroke={chartColors.stroke} 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill={chartColors.fill} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Side Metrics */}
        <div className="flex flex-col gap-6">
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
            <h3 className="font-display font-bold text-slate-800 mb-8 flex items-center gap-2">
              <Calendar size={18} className="text-emerald-500" />
              Estatísticas
            </h3>
            
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Greens Totais</span>
                  <span className="text-sm font-bold text-emerald-600">{metrics.greens.length}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden shadow-inner">
                  <div className="h-full bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/50" style={{ width: `${metrics.finalizedCount > 0 ? (metrics.greens.length / metrics.finalizedCount) * 100 : 0}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Reds Totais</span>
                  <span className="text-sm font-bold text-rose-600">{metrics.reds.length}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden shadow-inner">
                  <div className="h-full bg-rose-500 rounded-full shadow-lg shadow-rose-500/50" style={{ width: `${metrics.finalizedCount > 0 ? (metrics.reds.length / metrics.finalizedCount) * 100 : 0}%` }} />
                </div>
              </div>

              <div className="pt-6 border-t border-slate-50 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Apostado</span>
                  <span className="text-xs font-bold text-slate-800 font-mono">{formatCurrency(metrics.invested)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Média por Aposta</span>
                  <span className="text-xs font-bold text-slate-800 font-mono">{formatCurrency(metrics.avgBetVal)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Apostas Resolvidas</span>
                  <span className="text-xs font-bold text-slate-800 tracking-tighter">{metrics.finalizedCount} de {filteredTransactions.length} totais</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100 shadow-sm group">
            <p className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-black uppercase tracking-widest mb-3">
              <PieChart size={12} /> Insights do Dashboard
            </p>
            <ul className="space-y-3">
              <li className="text-sm text-slate-600 leading-relaxed font-bold flex items-start gap-2">
                <span className="text-emerald-500 mt-1">★</span>
                <span>{insights.bestSportMsg}</span>
              </li>
              <li className="text-sm text-slate-600 leading-relaxed font-bold flex items-start gap-2 border-t border-emerald-100/50 pt-3">
                <span className="text-emerald-500 mt-1">★</span>
                <span>{insights.bestTypeMsg}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
