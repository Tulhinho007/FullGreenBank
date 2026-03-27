import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { StatCard } from '../components/ui/StatCard'
import { tipsService } from '../services/tips.service'
import { TipCard } from '../components/ui/TipCard'
import {
  TrendingUp, DollarSign, Target, BarChart3,
  BookOpen, Lightbulb, ShieldCheck, RefreshCw,
  ChevronDown, ChevronUp, Clock,
  ArrowRight, Search
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { formatCurrency, formatDate } from '../utils/formatters'

interface Tip {
  id: string; title: string; description: string; sport: string
  event: string; market: string; odds: number; stake: number
  result?: string; profit?: number; valorCashout?: number; tipDate: string
  author: { id?: string; name: string; username: string }
}

const mgmtCards = [
  { icon: <BookOpen size={18} />, title: 'Gestão de Banca', desc: 'Nunca aposte mais do que 2–5% da sua banca em uma única entrada. Proteja seu capital acima de tudo.' },
  { icon: <Target size={18} />,   title: 'Staking Flat',    desc: 'Use staking flat (1 unidade por entrada) para manter consistência e controle emocional no longo prazo.' },
  { icon: <Lightbulb size={18} />, title: 'Value Betting',  desc: 'Aposte apenas quando a odd oferecida pelo mercado for superior à probabilidade real que você estimou.' },
  { icon: <ShieldCheck size={18} />, title: 'Stop Loss',    desc: 'Defina um limite de perdas diário/semanal. Ao atingir, pare. Discipline é mais importante que coragem.' },
  { icon: <RefreshCw size={18} />, title: 'ROI & Revisão', desc: 'Monitore seu ROI mensalmente. Um ROI positivo de 5–10% já é excelente. Consistência é a meta.' },
  { icon: <BarChart3 size={18} />, title: 'Mercados Certos', desc: 'Especializar-se em 2-3 mercados/ligas melhora muito sua edge. Generalista perde, especialista lucra.' },
]

export const DashboardPage = () => {
  const { user } = useAuth()
  const [tips,    setTips]    = useState<Tip[]>([])
  const [loading, setLoading] = useState(true)
  const [mgmtOpen, setMgmtOpen] = useState(false)
  const [tipFilter, setTipFilter] = useState('Pendentes')

  useEffect(() => {
    tipsService.getAll(1, 50)
      .then(resp => {
        const ts = Array.isArray(resp?.tips) ? resp.tips : (Array.isArray(resp?.data) ? resp.data : (Array.isArray(resp) ? resp : []));
        setTips(ts);
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const userId = user?.id
  const userTips = tips.filter(t => t.author?.id === userId || (t as any).authorId === userId)
  const statsTips = userTips.length > 0 ? userTips : []

  const greens   = statsTips.filter(t => t.result === 'GREEN').length
  const reds     = statsTips.filter(t => t.result === 'RED').length
  const cashouts = statsTips.filter(t => t.result === 'CASHOUT')
  const profitableCashouts = cashouts.filter(t => (t.profit || 0) > 0).length
  const losingCashouts = cashouts.filter(t => (t.profit || 0) <= 0).length
  
  const profit   = statsTips.reduce((a: number, t: Tip) => a + (t.profit || 0), 0)
  const totalStake = statsTips.reduce((a: number, t: Tip) => a + t.stake, 0)

  const winRateNumerator = greens + profitableCashouts
  const winRateDenominator = greens + reds + profitableCashouts + losingCashouts
  const winRate = winRateDenominator > 0 ? ((winRateNumerator / winRateDenominator) * 100).toFixed(0) : '0'

  const pendingTipsCount = tips.filter(t => t.result === 'PENDING').length

  const filteredTips = tips.filter(t => {
    // Only show pending tips in this section as requested
    if (t.result !== 'PENDING') return false
    
    if (tipFilter === 'Todos' || tipFilter === 'Pendentes') return true
    return t.sport === tipFilter
  }).slice(0, 6)

  // Chart data calculation
  const chartData = statsTips
    .filter(t => t.result !== 'PENDING')
    .sort((a, b) => new Date(a.tipDate).getTime() - new Date(b.tipDate).getTime())
    .reduce((acc: any[], tip) => {
      const prevProfit = acc.length > 0 ? acc[acc.length - 1].profit : 0
      acc.push({
        date: formatDate(tip.tipDate),
        profit: prevProfit + (tip.profit || 0)
      })
      return acc
    }, [])

  return (
    <div className="flex flex-col gap-6 transition-colors duration-300 pb-10">
      {/* Hero Section */}
      <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden relative group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-50 group-hover:scale-110 transition-transform duration-700 pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">
              Olá, <span className="text-emerald-600">{user?.name?.split(' ')[0]}</span>! 👋
            </h1>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              Bem-vindo de volta ao <span className="text-slate-800">Full Green Bank</span>
            </p>
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-xl border border-amber-100">
                <Clock className="text-amber-500" size={16} />
                <span className="text-xs font-black text-amber-700 uppercase tracking-wide">
                  {pendingTipsCount} {pendingTipsCount === 1 ? 'dica pendente' : 'dicas pendentes'} para hoje
                </span>
              </div>
              <a 
                href="/tips" 
                className="inline-flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
              >
                Ver Tips do Dia <ArrowRight size={14} />
              </a>
            </div>
          </div>
          <div className="hidden lg:block">
            <TrendingUp size={80} className="text-slate-50" />
          </div>
        </div>
      </section>

      {/* Stats - Personalized */}
      {userTips.length > 0 ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Dicas Seguidas"
              value={userTips.length}
              icon={<TrendingUp size={18} />}
              accent="green"
              subtitle="Sua atividade"
            />
            <StatCard
              title="Lucro Acumulado"
              value={profit >= 0 ? `+${formatCurrency(profit)}` : formatCurrency(profit)}
              icon={<DollarSign size={18} />}
              accent={profit >= 0 ? 'green' : 'red'}
              subtitle={`Individual`}
            />
            <StatCard
              title="Win Rate"
              value={`${winRate}%`}
              icon={<Target size={18} />}
              accent="blue"
              subtitle={`${greens} G / ${reds} R`}
            />
            <StatCard
              title="ROI"
              value={totalStake > 0 ? `${((profit / totalStake) * 100).toFixed(1)}%` : '0%'}
              icon={<BarChart3 size={18} />}
              accent="yellow"
              subtitle="Peso individual"
            />
          </div>

          {/* Performance Chart */}
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden h-[300px]">
             <div className="flex items-center justify-between mb-6">
                <div>
                   <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em]">Evolução de Lucro</h3>
                   <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight mt-1">Sua trajetória individual (BRL)</p>
                </div>
             </div>
             <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="date" 
                      hide
                    />
                    <YAxis 
                      tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value) => `R$ ${value}`}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      labelStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', color: '#64748b' }}
                      itemStyle={{ fontSize: '12px', fontWeight: 700, color: '#10b981' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="profit" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorProfit)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
             </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-dashed border-slate-200 text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Comece a registrar suas dicas para visualizar estatísticas personalizadas</p>
        </div>
      )}

      {/* Management tips - Retractable */}
      <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden transition-all duration-500">
        <button 
          onClick={() => setMgmtOpen(!mgmtOpen)}
          className="w-full flex items-center justify-between p-6 hover:bg-slate-50/50 transition-colors group"
        >
          <div className="flex items-center gap-4 text-left">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 className="font-display font-black text-slate-800 uppercase tracking-widest text-sm">Mentalidade & Gestão</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">Clique para ver dicas fundamentais</p>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-emerald-500 transition-colors">
            {mgmtOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </button>
        
        <div className={`overflow-hidden transition-all duration-500 ease-in-out ${mgmtOpen ? 'max-h-[800px] opacity-100 p-6 pt-0' : 'max-h-0 opacity-0'}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 border-t border-slate-50 pt-6">
            {mgmtCards.map(card => (
              <div key={card.title} className="bg-slate-50/50 p-5 rounded-3xl border border-slate-100 hover:border-emerald-500/20 transition-all duration-300">
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-emerald-600">
                    {card.icon}
                  </div>
                  <h3 className="font-black text-slate-800 text-[10px] uppercase tracking-widest">{card.title}</h3>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed font-bold uppercase tracking-tight opacity-80">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent tips */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="font-display font-black text-slate-800 uppercase tracking-widest text-sm">Próximas Dicas</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">Oportunidades selecionadas pelo algoritmo</p>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
            {['Todos', 'Futebol', 'Basquete', 'Pendentes'].map(f => (
              <button 
                key={f}
                onClick={() => setTipFilter(f)}
                className={`whitespace-nowrap px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${tipFilter === f ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'bg-white border-slate-100 text-slate-400 hover:border-emerald-200'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sincronizando mercado...</p>
          </div>
        ) : filteredTips.length === 0 ? (
          <div className="bg-white p-20 rounded-[3rem] border border-slate-100 text-center shadow-sm">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
               <Search size={32} className="text-slate-200" />
            </div>
            <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Nenhuma dica encontrada com este filtro...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTips.map(tip => <TipCard key={tip.id} tip={tip} />)}
          </div>
        )}
        
        {tips.length > 6 && (
          <div className="mt-8 flex justify-center">
            <a href="/tips" className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-emerald-600 uppercase tracking-[0.2em] transition-colors">
              Explorar Catálogo Completo <ArrowRight size={14} />
            </a>
          </div>
        )}
      </section>
    </div>
  )
}
