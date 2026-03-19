import { 
  TrendingUp, 
  DollarSign, 
  Target, 
  ArrowUpRight, 
  ArrowDownRight, 
  Activity,
  Calendar
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

// --- Mock Data ---

const MOCK_EVOLUTION = [
  { date: '01/03', balance: 5000, profit: 0 },
  { date: '03/03', balance: 5200, profit: 200 },
  { date: '05/03', balance: 5150, profit: -50 },
  { date: '07/03', balance: 5400, profit: 250 },
  { date: '10/03', balance: 5300, profit: -100 },
  { date: '12/03', balance: 5800, profit: 500 },
  { date: '15/03', balance: 6100, profit: 300 },
  { date: '18/03', balance: 5950, profit: -150 },
  { date: '20/03', balance: 6500, profit: 550 },
]

// --- Components ---

const StatCard = ({ title, value, subValue, icon: Icon, trend }: { 
  title: string; 
  value: string; 
  subValue?: string; 
  icon: any; 
  trend?: 'up' | 'down' 
}) => (
  <div className="card p-6 border border-surface-400 hover:border-green-600/40 transition-all duration-300 group">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</p>
        <h3 className="text-2xl font-bold text-white mt-1">{value}</h3>
        {subValue && (
          <div className="flex items-center gap-1 mt-2">
            {trend === 'up' ? (
              <ArrowUpRight size={14} className="text-green-400" />
            ) : trend === 'down' ? (
              <ArrowDownRight size={14} className="text-red-400" />
            ) : null}
            <span className={`text-xs font-medium ${trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-slate-400'}`}>
              {subValue}
            </span>
          </div>
        )}
      </div>
      <div className="w-12 h-12 rounded-2xl bg-surface-300 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
        <Icon size={24} className="text-green-500" />
      </div>
    </div>
  </div>
)

export const ReportsPage = () => {
  const chartColors = {
    stroke: '#22c55e',
    fill: 'url(#colorProfit)',
    grid: '#334155',
    text: '#94a3b8'
  }

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Relatório de Performance</h1>
          <p className="text-sm text-slate-500 mt-1">Visão geral da saúde e crescimento da sua banca</p>
        </div>
        <div className="flex items-center gap-2 bg-surface-200 border border-surface-400 rounded-xl p-1 shadow-inner">
          <button className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-green-600 text-white shadow-lg">Este Mês</button>
          <button className="px-4 py-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors">Total</button>
        </div>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="ROI Acumulado" 
          value="+18.42%" 
          subValue="2.1% vs mês anterior" 
          trend="up" 
          icon={TrendingUp} 
        />
        <StatCard 
          title="Lucro Total" 
          value="R$ 1.500,00" 
          subValue="R$ 450,00 este mês" 
          trend="up" 
          icon={DollarSign} 
        />
        <StatCard 
          title="Win Rate" 
          value="64.2%" 
          subValue="Estável" 
          icon={Target} 
        />
      </div>

      {/* Main Chart Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6 border border-surface-400">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Activity size={18} className="text-green-500" />
              Evolução da Banca
            </h3>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-slate-400">Saldo</span>
              </div>
            </div>
          </div>
          
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_EVOLUTION}>
                <defs>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
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
                  tickFormatter={(val) => `R$ ${val}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}
                  itemStyle={{ color: '#fff' }}
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
          </div>
        </div>

        {/* Side Metrics */}
        <div className="flex flex-col gap-6">
          <div className="card p-6 border border-surface-400 flex-1">
            <h3 className="font-semibold text-white mb-6 flex items-center gap-2">
              <Calendar size={18} className="text-green-500" />
              Saúde da Banca
            </h3>
            
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-slate-500 uppercase font-bold tracking-widest">Yield</span>
                  <span className="text-sm font-bold text-green-400">+12.5%</span>
                </div>
                <div className="w-full h-1.5 bg-surface-300 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: '75%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-slate-500 uppercase font-bold tracking-widest">Max Drawdown</span>
                  <span className="text-sm font-bold text-red-400">-8.2%</span>
                </div>
                <div className="w-full h-1.5 bg-surface-300 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 rounded-full" style={{ width: '15%' }} />
                </div>
              </div>

              <div className="pt-4 border-t border-surface-400 space-y-4">
                <div className="flex justify-between">
                  <span className="text-xs text-slate-400">Total Apostado</span>
                  <span className="text-xs font-semibold text-white">R$ 12.450,00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-400">Média por Aposta</span>
                  <span className="text-xs font-semibold text-white">R$ 150,00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-400">Última Atualização</span>
                  <span className="text-xs font-semibold text-white">Hoje, 14:10</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="card p-6 border border-surface-400 bg-green-600/10 border-green-600/20">
            <p className="text-xs text-green-400 font-bold uppercase tracking-widest">Insights</p>
            <p className="text-sm text-slate-200 mt-2 leading-relaxed">
              Sua performance em <span className="text-white font-bold">Futebol</span> atingiu <span className="text-white font-bold">78% de win rate</span> esta semana. Considere aumentar ligeiramente a stake nestes mercados.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
