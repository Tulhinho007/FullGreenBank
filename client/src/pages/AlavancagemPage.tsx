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
        <h1 className="text-2xl font-display font-bold text-white flex items-center justify-center gap-3">
          <CalcIcon className="text-green-500" size={28} />
          Alavancagem Operacional
        </h1>
        <p className="text-slate-400 text-sm">Simule o crescimento composto entrada por entrada e planeje suas metas.</p>
      </header>

      {/* Configuração */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-surface-300">
          <Target size={18} className="text-green-500" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Configuração</h2>
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
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Tipo de Meta</label>
            <div className="flex bg-surface-300 rounded-lg p-1">
              <button 
                onClick={() => { setTipoMeta('PERCENT'); setValorMeta('10'); }}
                className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${tipoMeta === 'PERCENT' ? 'bg-green-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
              >
                PORCENTAGEM (%)
              </button>
              <button 
                onClick={() => { setTipoMeta('ODD'); setValorMeta('2.0'); }}
                className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${tipoMeta === 'ODD' ? 'bg-green-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
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
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Número de Entradas</label>
            <input 
              type="text" 
              inputMode="numeric"
              value={numEntradas} 
              onChange={(e) => setNumEntradas(e.target.value)}
              className="input-field w-full"
              placeholder="Ex: 10"
            />
          </div>
        </div>
      </div>

      {/* Tabela de Previsão */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-surface-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <List size={18} className="text-green-500" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Tabela de Alavancagem — {numEntradas || 0} Entradas ({tipoMeta === 'PERCENT' ? `${valorMeta}% por aposta` : `@${valorMeta} por aposta`})
            </h2>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead className="bg-surface-300/50 text-[10px] uppercase font-bold text-slate-500 tracking-widest border-b border-surface-300">
              <tr>
                <th className="px-6 py-4">Entrada</th>
                <th className="px-6 py-4 text-center">Banca Antes</th>
                <th className="px-6 py-4 text-center text-green-500">{tipoMeta === 'PERCENT' ? '%' : 'Odd'}</th>
                <th className="px-6 py-4 text-right">Banca Depois</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-300/30">
              {results.map((row: CalculationRow) => (
                <tr key={row.index} className="hover:bg-green-500/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-md bg-surface-300 flex items-center justify-center text-[11px] font-bold text-slate-400 group-hover:bg-green-900/30 group-hover:text-green-500 transition-colors">
                        {row.index}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center font-mono text-sm text-slate-300">
                    {row.before.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-center font-mono text-sm font-bold text-green-500/80">
                    {row.metaValue.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="px-3 py-1 rounded-md bg-green-500/10 text-green-400 text-sm font-bold font-mono border border-green-500/20">
                      {row.after.toFixed(2)}
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
        <div className="card p-5 bg-gradient-to-br from-surface-200 to-green-900/10 border-green-500/10">
          <div className="flex items-center justify-between mb-2 text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-widest">Resultado Final</span>
            <ArrowUpRight size={14} className="text-green-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-green-500">{formatCurrency(finalResult)}</span>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-2 text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-widest">Lucro Total</span>
            <TrendingUp size={14} className="text-sky-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-mono font-bold text-emerald-400">+{totalProfitPercent.toFixed(1)}%</span>
            <span className="text-sm font-mono text-emerald-400/60">+{formatCurrency(totalProfitValue)}</span>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-2 text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-widest">Total de Entradas</span>
            <Target size={14} className="text-purple-500" />
          </div>
          <span className="text-3xl font-mono font-bold text-white">{numEntradas}</span>
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
