import {
  TrendingUp,
  Target,
  PieChart as PieChartIcon,
  Activity,
  Layers,
} from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import { formatCurrency } from '../utils/formatters'
import { useAuth } from '../contexts/AuthContext'
import { tipsService } from '../services/tips.service'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, LabelList
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

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#f97316', '#14b8a6', '#f43f5e']

export const StrategyAnalysisPage = () => {
  const { user } = useAuth()
  const [filterType, setFilterType] = useState<'month' | 'total'>('total')
  const [transactions, setTransactions] = useState<Transaction[]>([])

  useEffect(() => {
    async function loadData() {
      try {
        const params = { page: 1, limit: 1000 }
        const backendData = await tipsService.getAll(params.page, params.limit)
        const tipsArray = Array.isArray(backendData.tips) ? backendData.tips : []
        
        // Se não for MASTER, filtramos apenas as tips do próprio usuário
        // se houver necessidade (o backend getAll já deve filtrar se for um usuário comum)
        // mas para garantir consistência com o que o MASTER vê:
        const myTips = tipsArray.filter((tip: any) => 
          user?.role === 'MASTER' || 
          tip.authorId === user?.id || 
          (tip.author?.name?.toLowerCase() === user?.name?.toLowerCase())
        )

        const mappedTx: Transaction[] = myTips.map((tip: any) => {
          // Determina o tipo real da aposta usando o campo 'event' do banco
          // Valores reais no DB: event = 'Múltipla' | 'Criar Aposta' | null
          const tipoLabel = tip.event || tip.market || 'Simples'

          return {
            id: tip.id,
            tipsterId: tip.authorId || user?.id || 'tipster',
            tipsterName: tip.author?.name || user?.name || 'Tipster',
            tipDate: tip.tipDate ? String(tip.tipDate).split('T')[0] : new Date().toISOString().split('T')[0],
            linkAposta: tip.linkAposta || '',
            tipoAposta: tipoLabel,
            sportsList: tip.sportsList || [tip.sport || 'Futebol'],
            odds: Number(tip.odds) || 1,
            stake: Number(tip.stake) || 0,
            status: (tip.result as StatusType) || 'PENDING',
            profit: Number(tip.profit) || 0
          }
        })
        setTransactions(mappedTx)
      } catch (error) {
        console.error('Erro ao carregar dados de estratégia:', error)
      }
    }
    loadData()
  }, [user])

  const currentMonthDate = new Date()
  const currentMonth = `${currentMonthDate.getFullYear()}-${String(currentMonthDate.getMonth() + 1).padStart(2, '0')}`

  const filteredTransactions = useMemo(() => {
    const finalized = transactions.filter(t => t.status !== 'PENDING')
    if (filterType === 'month') {
      return finalized.filter(t => t.tipDate.startsWith(currentMonth))
    }
    return finalized
  }, [transactions, filterType, currentMonth])

  // Aggregate Data
  const efficiencyData = useMemo(() => {
    const bySport: Record<string, any> = {}
    const byMarket: Record<string, any> = {}

    filteredTransactions.forEach(t => {
      // 1. By Sport
      const list = t.sportsList && t.sportsList.length > 0 ? t.sportsList : ['Sem Categoria']
      list.forEach(sport => {
        if (!bySport[sport]) bySport[sport] = { name: sport, category: 'Esporte', profit: 0, invested: 0, wins: 0, count: 0 }
        if (t.status !== 'VOID') {
          bySport[sport].count++
          bySport[sport].invested += (t.stake || 0)
          if (t.status === 'GREEN' || (t.status === 'CASHOUT' && (t.profit || 0) > 0)) bySport[sport].wins++
        }
        bySport[sport].profit += (t.profit || 0)
      })

      // 2. By Market
      const market = t.tipoAposta || 'Simples'
      if (!byMarket[market]) byMarket[market] = { name: market, category: 'Mercado', profit: 0, invested: 0, wins: 0, count: 0 }
      if (t.status !== 'VOID') {
        byMarket[market].count++
        byMarket[market].invested += (t.stake || 0)
        if (t.status === 'GREEN' || (t.status === 'CASHOUT' && (t.profit || 0) > 0)) byMarket[market].wins++
      }
      byMarket[market].profit += (t.profit || 0)
    })

    const processStats = (obj: Record<string, any>) => Object.values(obj).map(s => ({
      ...s,
      winRate: s.count > 0 ? (s.wins / s.count) * 100 : 0,
      roi: s.invested > 0 ? (s.profit / s.invested) * 100 : 0
    })).sort((a, b) => b.profit - a.profit)

    return {
      sports: processStats(bySport),
      markets: processStats(byMarket),
      all: [...processStats(bySport), ...processStats(byMarket)].sort((a, b) => b.profit - a.profit)
    }
  }, [filteredTransactions])

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-800">Análise de Estratégia e Gestão</h1>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">Descubra de onde vem o seu verdadeiro lucro</p>
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

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Gráfico Esportes */}
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col">
          <h3 className="font-display font-bold text-slate-800 mb-6 flex items-center gap-2">
            <PieChartIcon size={18} className="text-emerald-500" />
            Lucro por Esporte
          </h3>
          <div className="flex-1 min-h-[320px] w-full">
            {efficiencyData.sports.filter(s => s.profit > 0).length === 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-sm text-slate-400 text-center px-4">
                <Target size={32} className="text-slate-200 mb-3" />
                 Você ainda não tem lucros segmentados suficientes em esportes.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 30, right: 80, left: 80, bottom: 30 }}>
                  <Pie
                    data={efficiencyData.sports.filter(s => s.profit > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={65}
                    paddingAngle={5}
                    dataKey="profit"
                    label={({ name, percent, x, y, midAngle: _midAngle }) => {
                      const mid = _midAngle ?? 0
                      const cx2 = (x ?? 0) + (mid > 90 && mid < 270 ? -10 : 10)
                      return (
                        <text x={cx2} y={y} fill="#475569" textAnchor={mid > 90 && mid < 270 ? 'end' : 'start'} dominantBaseline="central" fontSize={11} fontWeight={600}>
                          {`${name} ${((percent || 0) * 100).toFixed(0)}%`}
                        </text>
                      )
                    }}
                    labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
                  >
                    {efficiencyData.sports.filter(s => s.profit > 0).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(val: any) => formatCurrency(Number(val))} 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Gráfico Mercados */}
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col">
          <h3 className="font-display font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Layers size={18} className="text-sky-500" />
            Lucro por Tipo de Aposta
          </h3>
          <div className="flex-1 min-h-[250px] w-full">
             {efficiencyData.markets.filter(s => s.profit > 0).length === 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-sm text-slate-400 text-center px-4">
                <Target size={32} className="text-slate-200 mb-3" />
                 Nenhum tipo de aposta lucrativo identificado no período.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={efficiencyData.markets} layout="vertical" margin={{ top: 0, right: 30, left: 30, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" tickFormatter={(val) => `R$${val}`} stroke="#cbd5e1" fontSize={12} />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} fontWeight="bold" width={100} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    formatter={(val: any) => formatCurrency(Number(val))}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="profit" name="Lucro Líquido" radius={[0, 4, 4, 0]}>
                    <LabelList 
                      dataKey="profit" 
                      position="right" 
                      formatter={(val: any) => formatCurrency(Number(val))} 
                      style={{ fontSize: '11px', fontWeight: 'bold', fill: '#64748b' }} 
                    />
                    {
                      efficiencyData.markets.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.profit >= 0 ? '#10b981' : '#f43f5e'} />
                      ))
                    }
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Tabela de Eficiência */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
          <h3 className="font-display font-bold text-slate-800 flex items-center gap-2">
            <Activity size={18} className="text-emerald-500" />
            Ranking de Eficiência e Rentabilidade
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Categoria</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Nome</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Resolvidas</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Win Rate</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">ROI</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Lucro/Prejuízo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {efficiencyData.all.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-10 text-center text-sm text-slate-400 font-bold">
                    Nenhum registro consolidado foi encontrado neste filtro.
                  </td>
                </tr>
              ) : (
                efficiencyData.all.map((item, i) => (
                  <tr key={`${item.category}-${item.name}-${i}`} className="hover:bg-slate-50 transition-colors">
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        item.category === 'Esporte' ? 'bg-sky-50 text-sky-600' : 
                        item.category === 'Mercado' ? 'bg-indigo-50 text-indigo-600' : 
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {item.category}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-sm font-bold text-slate-800">
                      {item.name}
                    </td>
                    <td className="px-8 py-5 text-sm font-bold text-slate-500">
                      {item.count} apostas
                    </td>
                    <td className="px-8 py-5">
                      <span className={`text-sm font-bold ${item.winRate >= 50 ? 'text-emerald-600' : item.winRate > 0 ? 'text-amber-500' : 'text-rose-600'}`}>
                        {item.winRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`text-sm font-bold flex items-center gap-1 ${item.roi > 0 ? 'text-emerald-600' : item.roi < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                        {item.roi > 0 ? <TrendingUp size={14}/> : item.roi < 0 ? <TrendingUp size={14} className="rotate-180"/> : null}
                        {item.roi > 0 ? '+' : ''}{item.roi.toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <span className={`text-[15px] font-black tracking-tight ${item.profit > 0 ? 'text-emerald-600' : item.profit < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                        {item.profit > 0 ? '+' : ''}{formatCurrency(item.profit)}
                      </span>
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
