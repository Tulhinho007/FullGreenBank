import { resultLabel, formatDate, formatCurrency } from '../../utils/formatters'
import { ExternalLink } from 'lucide-react'

interface Tip {
  id: string
  title: string
  description: string
  sport: string
  event: string
  market: string
  odds: number
  stake: number
  result?: string
  profit?: number
  tipDate: string
  author: { name: string }
  linkAposta?: string
}

interface TipCardProps {
  tip: Tip
  onUpdateResult?: (tip: Tip) => void
  isAdmin?: boolean
}

export const TipCard = ({ tip, onUpdateResult, isAdmin }: TipCardProps) => {
  const resultInfo = resultLabel[tip.result ?? 'PENDING'] ?? resultLabel['PENDING']

  const handleCardClick = () => {
    if (tip.linkAposta) {
      window.open(tip.linkAposta, '_blank')
    }
  }

  return (
    <div 
      onClick={handleCardClick}
      className={`bg-white p-4 rounded-[2rem] border border-slate-100 hover:border-emerald-500/30 transition-all duration-300 shadow-sm group ${tip.linkAposta ? 'cursor-pointer' : ''}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-display font-bold text-slate-900 text-[13px] leading-tight truncate">{tip.title}</h3>
            {tip.linkAposta && <ExternalLink size={12} className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />}
          </div>
          <p className="text-[9px] uppercase font-black text-slate-400 mt-0.5 tracking-widest">{tip.event}</p>
        </div>
        <span className={`${resultInfo.cls} shrink-0 text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest`}>{resultInfo.label}</span>
      </div>

      {/* Description */}
      <p className="text-[11px] text-slate-500 mb-4 line-clamp-1 leading-relaxed">{tip.description}</p>

        {/* Stats row */}
      <div className="grid grid-cols-4 gap-1.5 mb-4">
        {[
          { label: 'Esporte', value: tip.sport },
          { label: 'Mercado', value: tip.market },
          { label: 'Odd',     value: `@${tip.odds.toFixed(2)}` },
          { label: 'Valor',     value: formatCurrency(tip.stake) },
        ].map(({ label, value }) => (
          <div key={label} className="bg-slate-50/50 rounded-xl p-1.5 text-center border border-slate-100/50">
            <p className="text-[8px] text-slate-300 uppercase font-black tracking-tighter">{label}</p>
            <p className="text-[10px] font-black text-slate-700 mt-0.5 font-mono truncate">{value}</p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-50">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center text-[9px] font-black text-emerald-600 border border-emerald-200">
            {tip.author.name[0].toUpperCase()}
          </div>
          <span className="text-[10px] text-slate-400 font-medium">{tip.author.name.split(' ')[0]}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{formatDate(tip.tipDate)}</span>
          {isAdmin && onUpdateResult && (!tip.result || tip.result === 'PENDING') && (
            <button
              onClick={(e) => { e.stopPropagation(); onUpdateResult(tip); }}
              className="text-[10px] font-bold bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg transition-all shadow-md shadow-green-500/10 active:scale-95"
            >
              Resolver
            </button>
          )}
          {tip.linkAposta && (
             <button 
               className="text-[9px] font-black bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors uppercase tracking-widest shadow-lg shadow-slate-200"
               onClick={(e) => { e.stopPropagation(); window.open(tip.linkAposta, '_blank'); }}
             >
               Apostar
             </button>
          )}
        </div>
      </div>
    </div>
  )
}
