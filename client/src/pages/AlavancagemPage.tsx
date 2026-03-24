import { useState, useMemo } from 'react'
import { 
  TrendingUp, Target, Calculator as CalcIcon, 
  ArrowUpRight, List, Info
} from 'lucide-react'
import { formatCurrency } from '../utils/formatters'

type MetaType = 'PERCENT' | 'ODD'

interface CalculationRow {
  index: number
  before: number
  metaValue: number
  after: number
}

export const AlavancagemPage = () => {
  const [bancaInicial, setBancaInicial] = useState<string>('100')
  const [tipoMeta, setTipoMeta] = useState<MetaType>('PERCENT')
  const [valorMeta, setValorMeta] = useState<string>('10')
  const [numEntradas, setNumEntradas] = useState<string>('10')

  const results = useMemo(() => {
    const rows: CalculationRow[] = []
    const bancaBase = Number(bancaInicial) || 0
    const metaVal = Number(valorMeta.replace(',', '.')) || 0
    const entradas = Math.min(Number(numEntradas) || 0, 100)
    
    let current = bancaBase

    for (let i = 1; i <= entradas; i++) {
      let profit = 0
      if (tipoMeta === 'PERCENT') {
        profit = current * (metaVal / 100)
      } else {
        profit = current * (metaVal - 1)
      }

      const before = current
      const after = current + profit
      
      rows.push({
        index: i,
        before,
        metaValue: profit,
        after
      })
      
      current = after
    }

    return rows
  }, [bancaInicial, tipoMeta, valorMeta, numEntradas])

  const bancaBase = Number(bancaInicial) || 0
  const finalResult = results[results.length - 1]?.after || bancaBase
  const totalProfitValue = finalResult - bancaBase
  const totalProfitPercent = bancaBase > 0 ? (totalProfitValue / bancaBase) * 100 : 0

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col items-center text-center gap-2 mb-2">
        <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white flex items-center justify-center gap-3">
          <CalcIcon className="text-green-500" size={28} />
          Alavancagem Operacional
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Simule o crescimento composto entrada por entrada e planeje suas metas.</p>
      </header>

      {/* Configuração */}
      <div className="bg-white dark:bg-surface-200 p-8 rounded-[2rem] border border-slate-200 dark:border-surface-400 shadow-sm relative overflow-hidden">
        <div className="flex items-center gap-2 mb-8 pb-4 border-b border-slate-100 dark:border-surface-300">
          <Target size={18} className="text-green-500" />
          <h2 className="text-[10px] font-bold text-slate-900 dark:text-white uppercase tracking-widest">Configuração do Ciclo</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Banca Inicial (R$)</label>
            <input 
              type="text" 
              inputMode="decimal"
              value={bancaInicial} 
              onChange={(e) => setBancaInicial(e.target.value)}
              className="input-field w-full"
              placeholder="Ex: 100"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 text-center md:text-left">Tipo de Meta</label>
            <div className="flex bg-slate-100 dark:bg-surface-300 rounded-2xl p-1.5 shadow-inner">
              <button 
                onClick={() => { setTipoMeta('PERCENT'); setValorMeta('10'); }}
                className={`flex-1 py-2 text-[10px] font-bold rounded-xl transition-all ${tipoMeta === 'PERCENT' ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 'text-slate-500 hover:text-slate-700 dark:hover:text-white'}`}
              >
                PORCENTAGEM (%)
              </button>
              <button 
                onClick={() => { setTipoMeta('ODD'); setValorMeta('2.0'); }}
                className={`flex-1 py-2 text-[10px] font-bold rounded-xl transition-all ${tipoMeta === 'ODD' ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 'text-slate-500 hover:text-slate-700 dark:hover:text-white'}`}
              >
                POR ODD (@)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
              {tipoMeta === 'PERCENT' ? 'Meta por Entrada (%)' : 'Odd por Entrada (@)'}
            </label>
            <input 
              type="text" 
              inputMode="decimal"
              value={valorMeta} 
              onChange={(e) => setValorMeta(e.target.value)}
              className="input-field w-full"
              placeholder={tipoMeta === 'PERCENT' ? "Ex: 10" : "Ex: 1.50"}
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Número de Entradas</label>
            <input 
              type="text" 
              inputMode="numeric"
              value={numEntradas} 
              onChange={(e) => setNumEntradas(e.target.value)}
              className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-3 px-4 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all text-center md:text-left shadow-inner"
              placeholder="Ex: 10"
            />
          </div>
        </div>
      </div>

      {/* Tabela de Previsão */}
      <div className="bg-white dark:bg-surface-200 rounded-[2rem] border border-slate-200 dark:border-surface-400 shadow-sm overflow-hidden transition-all">
        <div className="p-8 border-b border-slate-100 dark:border-surface-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <List size={18} className="text-green-500" />
            <h2 className="text-[10px] font-bold text-slate-900 dark:text-white uppercase tracking-widest">
              Tabela de Projeção — {numEntradas || 0} Ciclos ({tipoMeta === 'PERCENT' ? `${valorMeta}%` : `@${valorMeta}`})
            </h2>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 dark:bg-surface-300/50 text-[10px] uppercase font-bold text-slate-500 dark:text-slate-500 tracking-widest border-b border-slate-100 dark:border-surface-300">
              <tr>
                <th className="px-8 py-5"># Ciclo</th>
                <th className="px-8 py-5 text-center">Banca Base</th>
                <th className="px-8 py-5 text-center text-green-600 dark:text-green-500">{tipoMeta === 'PERCENT' ? 'Lucro/Entrada' : 'Lucro/Ciclo'}</th>
                <th className="px-8 py-5 text-right">Acumulado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-surface-300/30">
              {results.map((row: CalculationRow) => (
                <tr key={row.index} className="hover:bg-green-500/5 transition-colors group">
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-surface-300 flex items-center justify-center text-[11px] font-bold text-slate-500 dark:text-slate-400 group-hover:bg-green-500/10 group-hover:text-green-500 transition-colors border border-slate-200 dark:border-surface-300/50">
                        {row.index}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-4 text-center font-mono text-xs font-bold text-slate-600 dark:text-slate-400">
                    {formatCurrency(row.before)}
                  </td>
                  <td className="px-8 py-4 text-center font-mono text-xs font-bold text-green-600 dark:text-green-500/80">
                    +{formatCurrency(row.metaValue)}
                  </td>
                  <td className="px-8 py-4 text-right">
                    <span className="px-4 py-1.5 rounded-xl bg-green-500/10 text-green-600 dark:text-green-400 text-sm font-bold font-mono border border-green-200 dark:border-green-500/20 shadow-sm">
                      {formatCurrency(row.after)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-surface-200 p-6 rounded-[2rem] border border-slate-200 dark:border-surface-400 shadow-sm bg-gradient-to-br from-white dark:from-surface-200 to-green-500/5 dark:to-green-900/10">
          <div className="flex items-center justify-between mb-2 text-slate-400 dark:text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-widest">Resultado Final</span>
            <ArrowUpRight size={14} className="text-green-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-display font-bold text-green-600 dark:text-green-500">{formatCurrency(finalResult)}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-surface-200 p-6 rounded-[2rem] border border-slate-200 dark:border-surface-400 shadow-sm">
          <div className="flex items-center justify-between mb-2 text-slate-400 dark:text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-widest">Lucro Projetado</span>
            <TrendingUp size={14} className="text-sky-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-display font-bold text-emerald-600 dark:text-emerald-400">+{totalProfitPercent.toFixed(1)}%</span>
            <span className="text-[11px] font-bold font-mono text-emerald-600/60 dark:text-emerald-400/60">+{formatCurrency(totalProfitValue)}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-surface-200 p-6 rounded-[2rem] border border-slate-200 dark:border-surface-400 shadow-sm">
          <div className="flex items-center justify-between mb-2 text-slate-400 dark:text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-widest">Total de Ciclos</span>
            <Target size={14} className="text-purple-500" />
          </div>
          <span className="text-3xl font-display font-bold text-slate-900 dark:text-white leading-none">{numEntradas}</span>
        </div>
      </div>

      {/* Footer / Tip */}
      <div className="flex items-start gap-4 p-4 bg-sky-500/10 border border-sky-500/20 rounded-xl">
        <Info className="text-sky-500 shrink-0 mt-0.5" size={20} />
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-sky-400 uppercase tracking-tight">Dica de Gestão</h4>
          <p className="text-xs text-sky-500/80 leading-relaxed">
            A alavancagem com juros compostos é poderosa, mas extremante arriscada. Nunca utilize toda sua banca principal em um ciclo de alavancagem. 
            O ideal é separar uma 'banca de alavancagem' (ex: 5-10% da banca total) e seguir o plano rigorosamente até o fim.
          </p>
        </div>
      </div>
    </div>
  )
}
