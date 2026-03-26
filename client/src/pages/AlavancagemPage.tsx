import { useState, useMemo } from 'react'
import { 
  TrendingUp, Target, Calculator as CalcIcon, 
  ArrowUpRight, List, Info, CheckCircle2, 
  ShieldAlert, FileSpreadsheet, FileText,
  Calendar, RotateCcw
} from 'lucide-react'
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer
} from 'recharts'
import { formatCurrency } from '../utils/formatters'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

type MetaType = 'PERCENT' | 'ODD'

interface CalculationRow {
  index: number
  date: string
  before: number
  metaValue: number
  profit: number
  reinvest: number
  withdraw: number
  after: number
  isCompleted: boolean
}

export const AlavancagemPage = () => {
  const [bancaInicial, setBancaInicial] = useState<string>('100')
  const [tipoMeta, setTipoMeta] = useState<MetaType>('PERCENT')
  const [valorMeta, setValorMeta] = useState<string>('10')
  const [numEntradas, setNumEntradas] = useState<string>('10')
  
  // Novos Estados
  const [reinvestimento, setReinvestimento] = useState<number>(100)
  const frequencia = 'D'
  const [completedCycles, setCompletedCycles] = useState<number[]>([])

  const results = useMemo(() => {
    const rows: CalculationRow[] = []
    const bancaBase = Number(bancaInicial) || 0
    const metaVal = Number(valorMeta.replace(',', '.')) || 0
    const entradas = Math.min(Number(numEntradas) || 0, 100)
    const reinvestRate = reinvestimento / 100
    
    let current = bancaBase
    const startDate = new Date()

    for (let i = 1; i <= entradas; i++) {
      let profitPotential = 0
      if (tipoMeta === 'PERCENT') {
        profitPotential = current * (metaVal / 100)
      } else {
        profitPotential = current * (metaVal - 1)
      }

      const reinvestAmount = profitPotential * reinvestRate
      const withdrawAmount = profitPotential * (1 - reinvestRate)
      
      // Cálculo de data estimada (Diário por padrão)
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + (i - 1))

      const before = current
      const after = current + reinvestAmount
      
      rows.push({
        index: i,
        date: date.toLocaleDateString('pt-BR'),
        before,
        metaValue: profitPotential,
        profit: profitPotential,
        reinvest: reinvestAmount,
        withdraw: withdrawAmount,
        after,
        isCompleted: completedCycles.includes(i)
      })
      
      current = after
    }

    return rows
  }, [bancaInicial, tipoMeta, valorMeta, numEntradas, reinvestimento, frequencia, completedCycles])

  const bancaBase = Number(bancaInicial) || 0
  const finalResult = results[results.length - 1]?.after || bancaBase
  const totalProfitValue = finalResult - bancaBase
  const totalProfitPercent = bancaBase > 0 ? (totalProfitValue / bancaBase) * 100 : 0

  const resetProgress = () => {
    if (confirm('Deseja resetar todo o progresso dos ciclos?')) {
      setCompletedCycles([])
      toast.success('Progresso resetado')
    }
  }

  const toggleCycle = (idx: number) => {
    setCompletedCycles(prev => 
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    )
  }

  const exportExcel = () => {
    const data = results.map(r => ({
      'Ciclo': r.index,
      'Data Estimada': r.date,
      'Banca Inicial': r.before,
      'Lucro Total': r.profit,
      'Reinvestido': r.reinvest,
      'Sacado': r.withdraw,
      'Banca Final': r.after,
      'Status': r.isCompleted ? 'Concluído' : 'Pendente'
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Alavancagem')
    XLSX.writeFile(wb, 'Plano_Alavancagem.xlsx')
    toast.success('Excel gerado com sucesso!')
  }

  const exportPDF = () => {
    try {
      const doc = new jsPDF()
      doc.setFontSize(16)
      doc.text('Plano de Alavancagem Operacional - Full Green Bank', 14, 15)
      doc.setFontSize(10)
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 22)
      
      const tableData = results.map(r => [
        r.index, 
        r.date, 
        formatCurrency(r.before), 
        formatCurrency(r.profit), 
        formatCurrency(r.reinvest), 
        formatCurrency(r.withdraw), 
        formatCurrency(r.after)
      ])

      autoTable(doc, {
        head: [['#', 'Data', 'Banca Base', 'Lucro', 'Reinvest.', 'Saque', 'Acumulado']],
        body: tableData,
        startY: 30,
        styles: { fontSize: 8, font: 'helvetica' },
        headStyles: { fillColor: [16, 185, 129] }
      })

      doc.save('Plano_Alavancagem.pdf')
      toast.success('PDF gerado com sucesso!')
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      toast.error('Erro ao gerar PDF. Tente novamente.')
    }
  }

  return (
    <div className="flex flex-col gap-8 pb-20">
      <header className="flex flex-col md:flex-row items-center justify-between gap-6 mb-2">
        <div>
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3 tracking-tight">
            <CalcIcon className="text-emerald-500" size={32} />
            Alavancagem Operacional
          </h1>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mt-1">Simule o crescimento exponencial e rastreie seu progresso.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={exportExcel} className="nm-icon px-4 h-12 flex items-center gap-2 rounded-2xl text-emerald-600 font-black text-[10px] uppercase tracking-widest border border-emerald-100/50 hover:bg-emerald-50 transition-all">
            <FileSpreadsheet size={18} />
            Excel
          </button>
          <button onClick={exportPDF} className="nm-icon px-4 h-12 flex items-center gap-2 rounded-2xl text-rose-600 font-black text-[10px] uppercase tracking-widest border border-rose-100/50 hover:bg-rose-50 transition-all">
            <FileText size={18} />
            PDF
          </button>
          <button onClick={resetProgress} className="nm-icon w-12 h-12 flex items-center justify-center rounded-2xl text-slate-400 hover:text-blue-500 border border-slate-100 transition-all" title="Resetar Progresso">
            <RotateCcw size={18} />
          </button>
        </div>
      </header>

      {/* Configuração Principal e Gestão de Risco */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-2 mb-8 pb-4 border-b border-slate-50">
            <Target size={18} className="text-emerald-500" />
            <h2 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Configuração do Plano</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Banca Inicial (R$)</label>
              <input 
                type="text" 
                inputMode="decimal"
                value={bancaInicial} 
                onChange={(e) => setBancaInicial(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 h-12 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 text-center md:text-left">Tipo de Meta</label>
              <div className="flex bg-slate-50 rounded-2xl p-1.5 border border-slate-100 shadow-inner h-12">
                <button 
                  onClick={() => { setTipoMeta('PERCENT'); setValorMeta('10'); }}
                  className={`flex-1 text-[9px] font-black rounded-xl transition-all ${tipoMeta === 'PERCENT' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  PORCENTAGEM
                </button>
                <button 
                  onClick={() => { setTipoMeta('ODD'); setValorMeta('2.0'); }}
                  className={`flex-1 text-[9px] font-black rounded-xl transition-all ${tipoMeta === 'ODD' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  POR ODD (@)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                {tipoMeta === 'PERCENT' ? 'Meta (%)' : 'Odd (@)'}
              </label>
              <input 
                type="text" 
                inputMode="decimal"
                value={valorMeta} 
                onChange={(e) => setValorMeta(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 h-12 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Total de Ciclos</label>
              <input 
                type="text" 
                inputMode="numeric"
                value={numEntradas} 
                onChange={(e) => setNumEntradas(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 h-12 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-center md:text-left font-mono"
              />
            </div>
          </div>
        </div>

        <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <ShieldAlert size={80} className="text-emerald-500" />
          </div>
          
          <div className="flex items-center gap-2 mb-8 pb-4 border-b border-slate-800 relative z-10">
            <ShieldAlert size={18} className="text-emerald-500" />
            <h2 className="text-[10px] font-black text-emerald-500/80 uppercase tracking-widest">Gestão de Risco</h2>
          </div>

          <div className="space-y-6 relative z-10">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reinvestir Lucro</label>
                <span className="text-xs font-black text-emerald-500">{reinvestimento}%</span>
              </div>
              <input 
                type="range" min="0" max="100" step="5"
                value={reinvestimento}
                onChange={e => setReinvestimento(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Frequência</label>
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Diário</span>
              </div>
              <div className="flex bg-slate-800 rounded-xl p-1">
                <button 
                  className="flex-1 py-1.5 text-[10px] font-black rounded-lg bg-emerald-600 text-white shadow-lg shadow-emerald-500/40 cursor-default"
                >
                  DIÁRIO
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <label className="flex items-center gap-2 text-[10px] font-black text-rose-400 uppercase tracking-widest mb-3">
                <ShieldAlert size={14} />
                Simulador de Risco
              </label>
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4">
                <p className="text-[10px] font-bold text-rose-400 leading-relaxed">
                  Em caso de falha em qualquer ciclo, o capital total acumulado até aquele ponto é perdido. Mantenha saques regulares para mitigar riscos.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos e Visualização */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-emerald-500" />
              <h2 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Curva de Crescimento Exponencial</h2>
            </div>
          </div>
          
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={results}>
                <defs>
                  <linearGradient id="colorAfter" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="index" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px' }}
                  formatter={(value: any) => [formatCurrency(value), 'Banca']}
                  labelFormatter={(label) => `Ciclo ${label}`}
                />
                <Area 
                  type="monotone" 
                  dataKey="after" 
                  stroke="#10b981" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorAfter)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden flex-1 flex flex-col justify-center">
            <div className="absolute top-0 right-0 p-6 opacity-5">
              <TrendingUp size={120} className="text-emerald-500" />
            </div>
            <div className="flex items-center justify-between mb-4 text-slate-400 relative z-10">
              <span className="text-[10px] font-black uppercase tracking-widest">Resultado Final</span>
              <ArrowUpRight size={16} className="text-emerald-500" />
            </div>
            <div className="space-y-1 relative z-10">
              <span className="text-5xl font-black text-emerald-600 tracking-tighter leading-tight block">
                {formatCurrency(finalResult)}
              </span>
              <p className="text-[11px] font-black text-emerald-600/50 uppercase tracking-widest">Projeção estimada após {numEntradas} ciclos</p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden flex-1 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-4 text-slate-400">
              <span className="text-[10px] font-black uppercase tracking-widest">Lucro Projetado (ROI)</span>
              <TrendingUp size={16} className="text-blue-500" />
            </div>
            <div className="space-y-1">
              <span className="text-5xl font-black text-slate-800 tracking-tighter leading-tight block">
                +{totalProfitPercent.toFixed(1)}%
              </span>
              <p className="text-[11px] font-black text-emerald-600 uppercase tracking-widest block">
                +{formatCurrency(totalProfitValue)} acumulado
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Previsão */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden transition-all">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <List size={18} className="text-emerald-500" />
            <h2 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">
              Acompanhamento de Ciclos — Fluxo Operacional
            </h2>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-[10px] uppercase font-black text-slate-400 tracking-widest border-b border-slate-50">
              <tr>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5"># Ciclo</th>
                <th className="px-8 py-5">Data Estimada</th>
                <th className="px-8 py-5 text-center">Banca Base</th>
                <th className="px-8 py-5 text-center text-emerald-600">Lucro/Ciclo</th>
                <th className="px-8 py-5 text-center text-blue-500">Saque</th>
                <th className="px-8 py-5 text-right">Banca Final</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {results.map((row: CalculationRow) => (
                <tr key={row.index} className={`hover:bg-slate-50/50 transition-colors group ${row.isCompleted ? 'bg-emerald-50/20' : ''}`}>
                  <td className="px-8 py-4">
                    <button 
                      onClick={() => toggleCycle(row.index)}
                      className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${row.isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 text-transparent hover:border-emerald-300'}`}
                    >
                      <CheckCircle2 size={14} />
                    </button>
                  </td>
                  <td className="px-8 py-4 text-xs font-black text-slate-400">
                    #{String(row.index).padStart(2, '0')}
                  </td>
                  <td className="px-8 py-4 text-xs font-bold text-slate-800">
                    <div className="flex items-center gap-2">
                      <Calendar size={12} className="text-slate-300" />
                      {row.date}
                    </div>
                  </td>
                  <td className="px-8 py-4 text-center text-xs font-bold text-slate-500">
                    {formatCurrency(row.before)}
                  </td>
                  <td className="px-8 py-4 text-center text-xs font-black text-emerald-600">
                    +{formatCurrency(row.profit)}
                  </td>
                  <td className="px-8 py-4 text-center text-xs font-bold text-blue-500">
                    {row.withdraw > 0 ? `- ${formatCurrency(row.withdraw)}` : 'R$ 0,00'}
                  </td>
                  <td className="px-8 py-4 text-right">
                    <span className={`px-4 py-2 rounded-xl text-sm font-black border transition-all ${row.isCompleted ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-900 border-slate-100'}`}>
                      {formatCurrency(row.after)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer / Dicas Ampliadas */}
      <div className="flex flex-col gap-6">
        <div className="flex items-start gap-4 p-8 bg-sky-500/10 border border-sky-500/20 rounded-[2rem] relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
            <Info size={160} className="text-sky-500" />
          </div>
          <Info className="text-sky-500 shrink-0 mt-1" size={24} />
          <div className="space-y-3 relative z-10">
            <h4 className="text-lg font-black text-sky-600 uppercase tracking-tighter">Dica de Gestão</h4>
            <p className="text-sm font-medium text-sky-800 leading-relaxed max-w-4xl">
              A alavancagem com juros compostos é poderosa, mas extremamente arriscada. Para uma gestão profissional, nunca utilize toda sua banca principal em um ciclo. 
              Separe uma 'banca de alavancagem' (ex: 5-10% do seu capital total) e siga o plano rigorosamente até atingir seu objetivo.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 p-8 bg-amber-500/10 border border-amber-500/20 rounded-[2rem] relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
            <ShieldAlert size={160} className="text-amber-500" />
          </div>
          <ShieldAlert className="text-amber-500 shrink-0 mt-1" size={24} />
          <div className="space-y-3 relative z-10">
            <h4 className="text-lg font-black text-amber-600 uppercase tracking-tighter">Dica de Ouro: Gestão de Risco</h4>
            <p className="text-sm font-bold text-amber-800 leading-relaxed max-w-4xl">
              Lembre-se: Ganhos passados não garantem lucros futuros. A disciplina é o que separa os vencedores dos amadores. 
              Nunca invista dinheiro destinado a despesas essenciais e esteja ciente de que cada ciclo de alavancagem herda o risco acumulado dos anteriores.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
