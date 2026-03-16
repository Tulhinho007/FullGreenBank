import { resultLabel, formatDate } from '../../utils/formatters'

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
  author: { name: string; username: string }
}

interface TipCardProps {
  tip: Tip
  onUpdateResult?: (tip: Tip) => void
  isAdmin?: boolean
}

export const TipCard = ({ tip, onUpdateResult, isAdmin }: TipCardProps) => {
  const resultInfo = resultLabel[tip.result ?? 'PENDING'] ?? resultLabel['PENDING']

  return (
    <div className="card p-5 hover:border-green-800/40 transition-colors duration-200">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="font-display font-semibold text-white text-sm">{tip.title}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{tip.event}</p>
        </div>
        <span className={resultInfo.cls}>{resultInfo.label}</span>
      </div>

      {/* Description */}
      <p className="text-xs text-slate-400 mb-4 line-clamp-2">{tip.description}</p>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[
          { label: 'Esporte', value: tip.sport },
          { label: 'Mercado', value: tip.market },
          { label: 'Odd',     value: `@${tip.odds.toFixed(2)}` },
          { label: 'Stake',   value: `${tip.stake}u` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-surface-300 rounded-lg p-2 text-center">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</p>
            <p className="text-xs font-semibold text-white mt-0.5 font-mono">{value}</p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-green-800 flex items-center justify-center text-[10px] font-bold text-green-300">
            {tip.author.name[0].toUpperCase()}
          </div>
          <span className="text-xs text-slate-500">@{tip.author.username}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-600">{formatDate(tip.tipDate)}</span>
          {isAdmin && onUpdateResult && (!tip.result || tip.result === 'PENDING') && (
            <button
              onClick={() => onUpdateResult(tip)}
              className="text-xs bg-green-900/40 hover:bg-green-900/70 text-green-400 border border-green-800/50 px-2.5 py-1 rounded-md transition-colors"
            >
              Atualizar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
