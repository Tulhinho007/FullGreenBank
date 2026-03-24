import { resultLabel, formatDate, formatCurrency } from '../../utils/formatters'

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
}

interface TipCardProps {
  tip: Tip
  onUpdateResult?: (tip: Tip) => void
  isAdmin?: boolean
}

export const TipCard = ({ tip, onUpdateResult, isAdmin }: TipCardProps) => {
  const resultInfo = resultLabel[tip.result ?? 'PENDING'] ?? resultLabel['PENDING']

  return (
    <div className="bg-white p-5 rounded-[2rem] border border-slate-100 hover:border-green-500/30 transition-all duration-300 shadow-sm group">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h3 className="font-display font-bold text-slate-900 text-sm truncate">{tip.title}</h3>
          <p className="text-[10px] uppercase font-bold text-slate-400 mt-1 tracking-widest">{tip.event}</p>
        </div>
        <span className={`${resultInfo.cls} shrink-0`}>{resultInfo.label}</span>
      </div>

      {/* Description */}
      <p className="text-xs text-slate-500 mb-5 line-clamp-2 leading-relaxed">{tip.description}</p>

        {/* Stats row */}
      <div className="grid grid-cols-4 gap-2 mb-5">
        {[
          { label: 'Esporte', value: tip.sport },
          { label: 'Mercado', value: tip.market },
          { label: 'Odd',     value: `@${tip.odds.toFixed(2)}` },
          { label: 'Valor',     value: formatCurrency(tip.stake) },
        ].map(({ label, value }) => (
          <div key={label} className="bg-slate-50 rounded-xl p-2 text-center border border-slate-100">
            <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">{label}</p>
            <p className="text-xs font-bold text-slate-800 mt-0.5 font-mono truncate">{value}</p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-green-500/10 flex items-center justify-center text-[10px] font-bold text-green-600 border border-green-200">
            {tip.author.name[0].toUpperCase()}
          </div>
          <span className="text-[10px] text-slate-400 font-medium">{tip.author.name.split(' ')[0]}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{formatDate(tip.tipDate)}</span>
          {isAdmin && onUpdateResult && (!tip.result || tip.result === 'PENDING') && (
            <button
              onClick={() => onUpdateResult(tip)}
              className="text-[10px] font-bold bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg transition-all shadow-md shadow-green-500/10 active:scale-95"
            >
              Resolver
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
