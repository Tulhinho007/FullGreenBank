import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from '../utils/i18n'
import { StatCard } from '../components/ui/StatCard'
import { tipsService } from '../services/tips.service'
import { TipCard } from '../components/ui/TipCard'
import {
  TrendingUp, DollarSign, Target, BarChart3,
  BookOpen, Lightbulb, ShieldCheck, RefreshCw,
} from 'lucide-react'

interface Tip {
  id: string; title: string; description: string; sport: string
  event: string; market: string; odds: number; stake: number
  result?: string; profit?: number; tipDate: string
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
  const { t } = useTranslation()
  const [tips,    setTips]    = useState<Tip[]>([])
  const [loading, setLoading] = useState(true)

  const formatCurrency = (v: number) =>
    v.toLocaleString(user?.language === 'en-US' ? 'en-US' : (user?.language === 'es-ES' ? 'es-ES' : 'pt-BR'), { 
      style: 'currency', 
      currency: user?.currency || 'BRL' 
    })

  useEffect(() => {
    tipsService.getAll(1, 3)
      .then(data => setTips(data.tips))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const greens   = tips.filter(t => t.result === 'GREEN').length
  const reds     = tips.filter(t => t.result === 'RED').length
  const profit   = tips.reduce((a: number, t: Tip) => a + (t.profit || 0), 0)
  const winRate  = tips.length > 0 ? ((greens / (greens + reds || 1)) * 100).toFixed(0) : '--'
  const totalStake = tips.reduce((a: number, t: Tip) => a + t.stake, 0)

  return (
    <div className="flex flex-col gap-6">
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
          title={t('profit')}
          value={profit >= 0 ? `+${formatCurrency(profit)}` : formatCurrency(profit)}
          icon={<DollarSign size={18} />}
          accent={profit >= 0 ? 'green' : 'red'}
          subtitle={`${t('result')} em ${user?.currency || 'BRL'}`}
        />
        <StatCard
          title="Win Rate"
          value={`${winRate}%`}
          icon={<Target size={18} />}
          accent="blue"
          subtitle={`${greens} greens / ${reds} reds`}
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
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display font-semibold text-white">{t('gestao')}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{t('dashboard_subtitle')}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mgmtCards.map(card => (
            <div key={card.title} className="card p-5 hover:border-green-800/40 transition-colors duration-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-green-900/50 flex items-center justify-center text-green-400">
                  {card.icon}
                </div>
                <h3 className="font-semibold text-white text-sm">{card.title}</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent tips */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-white">{t('tips_recent')}</h2>
          <a href="/tips" className="text-xs text-green-400 hover:text-green-300">{t('view_all')} →</a>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tips.length === 0 ? (
          <div className="card p-12 text-center">
            <TrendingUp size={32} className="text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">Nenhuma dica cadastrada ainda.</p>
            {(user?.role === 'ADMIN' || user?.role === 'MASTER') && (
              <a href="/admin/tips/new" className="text-green-400 text-sm mt-2 inline-block hover:underline">
                Criar primeira dica →
              </a>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tips.map(tip => <TipCard key={tip.id} tip={tip} />)}
          </div>
        )}
      </div>
    </div>
  )
}
