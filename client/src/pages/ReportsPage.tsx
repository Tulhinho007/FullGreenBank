import {
  TrendingUp,
  DollarSign,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Calendar
} from 'lucide-react'

import { formatCurrency } from '../utils/formatters'
import { useAuth } from '../contexts/AuthContext'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,

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



  const chartColors = {
    stroke: '#10b981',
    fill: 'url(#colorProfit)',
    grid: '#f1f5f9',
    text: '#94a3b8',
    tooltipBg: '#ffffff',
    tooltipBorder: '#f1f5f9',
    tooltipText: '#0f172a'
  }

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-800">Relatório de Performance</h1>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">Visão geral da saúde e crescimento da sua banca</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-2xl p-1.5 shadow-inner">
          <button className="px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">Este Mês</button>
          <button className="px-5 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Total</button>
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
          value={formatCurrency(1500)} 
          subValue={`${formatCurrency(450)} este mês`} 
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
        <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-display font-bold text-slate-800 flex items-center gap-2">
              <Activity size={18} className="text-emerald-500" />
              Evolução da Banca
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saldo Atual</span>
              </div>
            </div>
          </div>
          
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_EVOLUTION}>
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
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
            <h3 className="font-display font-bold text-slate-800 mb-8 flex items-center gap-2">
              <Calendar size={18} className="text-emerald-500" />
              Saúde da Banca
            </h3>
            
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Yield</span>
                  <span className="text-sm font-bold text-emerald-600">+12.5%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden shadow-inner">
                  <div className="h-full bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/50" style={{ width: '75%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Max Drawdown</span>
                  <span className="text-sm font-bold text-rose-600">-8.2%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden shadow-inner">
                  <div className="h-full bg-rose-500 rounded-full shadow-lg shadow-rose-500/50" style={{ width: '15%' }} />
                </div>
              </div>

              <div className="pt-6 border-t border-slate-50 space-y-4">
                <div className="flex justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Apostado</span>
                  <span className="text-xs font-bold text-slate-800 font-mono">{formatCurrency(12450)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Média por Aposta</span>
                  <span className="text-xs font-bold text-slate-800 font-mono">{formatCurrency(150)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Última Atualização</span>
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-tighter">Hoje, 14:10</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100 shadow-sm group">
            <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">Insights</p>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed font-bold">
              Sua performance em <span className="text-emerald-600 font-bold">Futebol</span> atingiu <span className="text-emerald-600 font-bold">78% de win rate</span> esta semana. Considere aumentar ligeiramente a stake nestes mercados.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
