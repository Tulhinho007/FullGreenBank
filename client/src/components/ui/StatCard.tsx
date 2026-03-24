import { ReactNode } from 'react'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: ReactNode
  trend?: { value: string; positive: boolean }
  accent?: 'green' | 'red' | 'blue' | 'yellow'
}

const accentMap = {
  green:  { icon: 'bg-green-500/10 text-green-600',  border: 'border-slate-200' },
  red:    { icon: 'bg-red-500/10 text-red-600',       border: 'border-slate-200' },
  blue:   { icon: 'bg-blue-500/10 text-blue-600',    border: 'border-slate-200' },
  yellow: { icon: 'bg-yellow-500/10 text-yellow-600', border: 'border-slate-200' },
}

export const StatCard = ({ title, value, subtitle, icon, trend, accent = 'green' }: StatCardProps) => {
  const { icon: iconCls, border } = accentMap[accent]

  return (
    <div className={`bg-white p-5 rounded-[2rem] border transition-all duration-300 shadow-sm ${border}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</p>
          <p className="text-2xl font-display font-bold text-slate-900 mt-1 break-words">{value}</p>
          {subtitle && <p className="text-[11px] text-slate-500 mt-1 truncate">{subtitle}</p>}
          {trend && (
            <p className={`text-xs font-bold mt-2 flex items-center gap-1 ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.positive ? '▲' : '▼'} {trend.value}
            </p>
          )}
        </div>
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105 ${iconCls}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}
