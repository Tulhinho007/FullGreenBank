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
  green:  { icon: 'bg-green-900/50 text-green-400',  border: 'border-green-800/30' },
  red:    { icon: 'bg-red-900/50   text-red-400',    border: 'border-red-800/30'   },
  blue:   { icon: 'bg-blue-900/50  text-blue-400',   border: 'border-blue-800/30'  },
  yellow: { icon: 'bg-yellow-900/50 text-yellow-400', border: 'border-yellow-800/30' },
}

export const StatCard = ({ title, value, subtitle, icon, trend, accent = 'green' }: StatCardProps) => {
  const { icon: iconCls, border } = accentMap[accent]

  return (
    <div className={`card p-5 border ${border}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-display font-bold text-white mt-1">{value}</p>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
          {trend && (
            <p className={`text-xs font-medium mt-2 ${trend.positive ? 'text-green-400' : 'text-red-400'}`}>
              {trend.positive ? '▲' : '▼'} {trend.value}
            </p>
          )}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconCls}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}
