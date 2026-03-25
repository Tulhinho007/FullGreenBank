import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { StatCard } from '../components/ui/StatCard'
import { tipsService } from '../services/tips.service'
import { TipCard } from '../components/ui/TipCard'
import {
  TrendingUp, DollarSign, Target, BarChart3,
  BookOpen, Lightbulb, ShieldCheck, RefreshCw,
} from 'lucide-react'
import { formatCurrency } from '../utils/formatters'

interface Tip {
  id: string; title: string; description: string; sport: string
  event: string; market: string; odds: number; stake: number
  result?: string; profit?: number; valorCashout?: number; tipDate: string
  author: { name: string; username: string }
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

  useEffect(() => {
    tipsService.getAll(1, 12)
      .then(resp => {
        const ts = Array.isArray(resp?.tips) ? resp.tips : (Array.isArray(resp?.data) ? resp.data : (Array.isArray(resp) ? resp : []));
        setTips(ts);
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const ts = Array.isArray(tips) ? tips : []
  const greens   = ts.filter(t => t.result === 'GREEN').length
  const reds     = ts.filter(t => t.result === 'RED').length
  const cashouts = ts.filter(t => t.result === 'CASHOUT')
  const profitableCashouts = cashouts.filter(t => (t.profit || 0) > 0).length
  
  const profit   = ts.reduce((a: number, t: Tip) => a + (t.profit || 0), 0)
  
  const winRateNumerator = greens + profitableCashouts
  const winRateDenominator = greens + reds + profitableCashouts
  const winRate = winRateDenominator > 0 ? ((winRateNumerator / winRateDenominator) * 100).toFixed(0) : '--'
  
  const totalStake = ts.reduce((a: number, t: Tip) => a + t.stake, 0)

  return (
    <div className="flex flex-col gap-8 transition-colors duration-300">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total de Dicas"
          value={tips.length}
          icon={<TrendingUp size={18} />}
          accent="green"
          subtitle="Dicas registradas"
        />
        <StatCard
          title="Lucro Acumulado"
          value={profit >= 0 ? `+${formatCurrency(profit)}` : formatCurrency(profit)}
          icon={<DollarSign size={18} />}
          accent={profit >= 0 ? 'green' : 'red'}
          subtitle={`Total em BRL`}
        />
        <StatCard
          title="Win Rate"
          value={`${winRate}%`}
          icon={<Target size={18} />}
          accent="blue"
          subtitle={`${greens} G / ${reds} R / ${cashouts.length} C`}
        />
        <StatCard
          title="ROI Estimado"
          value={tips.length > 0 ? `${((profit / totalStake) * 100).toFixed(1)}%` : '--'}
          icon={<BarChart3 size={18} />}
          accent="yellow"
          subtitle="Retorno sobre investido"
        />
      </div>

      {/* Management tips */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display font-semibold text-slate-900">Gestão</h2>
            <p className="text-xs text-slate-500 mt-0.5">Dicas e boas práticas de banca</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mgmtCards.map(card => (
            <div key={card.title} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 hover:border-emerald-500/30 transition-all duration-300 shadow-sm group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform duration-300">
                  {card.icon}
                </div>
                <h3 className="font-black text-slate-800 text-[11px] uppercase tracking-widest">{card.title}</h3>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-bold uppercase tracking-tight opacity-80">{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Recent tips */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display font-black text-slate-800 uppercase tracking-widest text-sm">Próximas Dicas</h2>
          <a href="/tips" className="text-[10px] text-emerald-600 hover:text-emerald-700 font-black uppercase tracking-widest transition-colors">Ver catálogo completo →</a>
        </div>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-[2rem] border border-slate-100">
            <div className="w-10 h-10 border-2 border-green-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs text-slate-400">Carregando dicas...</p>
          </div>
        ) : tips.length === 0 ? (
          <div className="bg-white p-20 rounded-[3rem] border border-slate-100 text-center shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
               <TrendingUp size={40} className="text-slate-200" />
            </div>
            <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Aguardando novos sinais do mercado...</p>
            {(user?.role === 'ADMIN' || user?.role === 'MASTER') && (
              <a href="/tips" className="inline-flex items-center gap-3 mt-8 px-10 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-emerald-500/20 active:scale-95">
                Criar primeira dica
              </a>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tips.map(tip => <TipCard key={tip.id} tip={tip} />)}
          </div>
        )}
      </section>
    </div>
  )
}
