import { useState, useMemo } from 'react'
import { 
  Calculator as CalcIcon, Percent, Info, 
  ShieldCheck, MousePointer2 
} from 'lucide-react'
import { formatCurrency } from '../utils/formatters'

export const CalculadoraPage = () => {
  const [banca, setBanca] = useState<string>('')
  const [porcentagem, setPorcentagem] = useState<string>('0')
  const [showResult, setShowResult] = useState(false)

  const stakeResult = useMemo(() => {
    const b = Number(banca.replace(',', '.')) || 0
    const p = Number(porcentagem.replace(',', '.')) || 0
    return b * (p / 100)
  }, [banca, porcentagem])

  const handleQuickSelect = (val: string) => {
    setPorcentagem(val)
    setShowResult(true)
  }

  const handleCalculate = () => {
    setShowResult(true)
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      <header className="flex flex-col items-center text-center gap-2 mb-2">
        <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white flex items-center justify-center gap-3">
          <CalcIcon className="text-green-500" size={28} />
          Calculadora de Stake
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Defina sua unidade de aposta com base na gestão de banca profissional.</p>
      </header>

      {/* Input de Banca */}
      <div className="bg-white dark:bg-surface-200 p-8 rounded-[2rem] border border-slate-200 dark:border-surface-400 shadow-sm flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
        <div className="w-14 h-14 rounded-2xl bg-green-500/10 dark:bg-green-500/20 flex items-center justify-center border border-green-500/20 shrink-0 shadow-inner">
          <CalcIcon className="text-green-600 dark:text-green-400" size={28} />
        </div>
        <div className="flex-1 w-full">
          <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 px-1">Valor da Banca (R$)</label>
          <input 
            type="text"
            inputMode="decimal"
            value={banca}
            onChange={(e) => setBanca(e.target.value)}
            placeholder="Ex: 500,00"
            className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-4 px-5 text-xl font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all shadow-inner"
          />
        </div>
      </div>

      {/* Configuração de Porcentagem */}
      <div className="bg-white dark:bg-surface-200 p-8 rounded-[2rem] border border-slate-200 dark:border-surface-400 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <Percent size={18} className="text-green-500" />
            <h2 className="text-[10px] font-bold text-slate-900 dark:text-white uppercase tracking-widest">Porcentagem da Unidade</h2>
          </div>
          <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-surface-300 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-green-500 dark:hover:text-white cursor-help transition-colors" title="Cálculo de stake baseado em porcentagem fixa da banca total">
            <Info size={12} />
          </div>
        </div>

        <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-8">Calcule o stake usando uma porcentagem fixa da sua banca</p>

        <div className="space-y-6">
          <div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 px-1">Porcentagem da Banca (%)</label>
            <input 
              type="text"
              inputMode="decimal"
              value={porcentagem}
              onChange={(e) => setPorcentagem(e.target.value)}
              className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-3 px-5 text-lg font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all shadow-inner"
            />
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-3 px-1 opacity-60">Recomendado: 1% a 5% dependendo do seu perfil</p>
          </div>
          </div>

          {/* Quick Select Buttons */}
          <div className="flex flex-wrap gap-2">
            {['1', '2', '3', '5'].map(val => (
              <button
                key={val}
                onClick={() => handleQuickSelect(val)}
                className={`px-6 py-2 rounded-xl border text-[11px] font-bold transition-all uppercase tracking-widest ${
                  porcentagem === val 
                    ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/20 scale-105' 
                    : 'bg-slate-50 dark:bg-surface-300 border-slate-200 dark:border-surface-400 text-slate-500 dark:text-slate-400 hover:border-green-500/30 dark:hover:text-white'
                }`}
              >
                {val}%
              </button>
            ))}
          </div>

          <button 
            onClick={handleCalculate}
            className="w-full h-14 bg-slate-900 dark:bg-green-500 text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-black/5 dark:shadow-green-500/20 hover:opacity-90 active:scale-95 transition-all text-sm uppercase tracking-widest"
          >
            <MousePointer2 size={18} />
            Calcular Stake
          </button>
        </div>

        {/* Recomendação por Perfil */}
        <div className="mt-10 space-y-4 pt-8 border-t border-slate-100 dark:border-surface-300">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck size={18} className="text-blue-500" />
            <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Sugestão por Perfil Operacional:</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Conservador */}
            <div className="flex flex-col p-4 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/5 border border-emerald-500/10 dark:border-emerald-500/20 group hover:border-emerald-500/40 transition-colors">
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest mb-1">Conservador</span>
              <span className="text-xl font-display font-bold text-emerald-600 dark:text-emerald-500">1% — 2%</span>
            </div>
            {/* Moderado */}
            <div className="flex flex-col p-4 rounded-2xl bg-amber-500/5 dark:bg-amber-500/5 border border-amber-500/10 dark:border-amber-500/20 group hover:border-amber-500/40 transition-colors">
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest mb-1">Moderado</span>
              <span className="text-xl font-display font-bold text-amber-600 dark:text-amber-500">2% — 3%</span>
            </div>
            {/* Agressivo */}
            <div className="flex flex-col p-4 rounded-2xl bg-rose-500/5 dark:bg-rose-500/5 border border-rose-500/10 dark:border-rose-500/20 group hover:border-rose-500/40 transition-colors">
              <span className="text-[10px] font-bold text-rose-600 dark:text-rose-500 uppercase tracking-widest mb-1">Agressivo</span>
              <span className="text-xl font-display font-bold text-rose-600 dark:text-rose-500">3% — 5%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Resultado */}
      {showResult && (
        <div className="bg-white dark:bg-surface-200 p-8 rounded-[2rem] border border-green-500/20 dark:border-green-600/30 shadow-xl bg-gradient-to-br from-white dark:from-surface-200 to-green-500/10 dark:to-green-900/10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100 dark:border-surface-300/50">
            <h3 className="text-[10px] font-bold text-slate-900 dark:text-white uppercase tracking-widest">Resultado do Cálculo Profissional</h3>
            <span className="px-3 py-1 rounded-full bg-green-500/10 dark:bg-green-500/20 text-green-600 dark:text-green-400 text-[10px] font-bold uppercase tracking-widest border border-green-200 dark:border-green-500/30">Valor Unitário</span>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mb-2">Stake Recomendada:</p>
              <div className="text-4xl md:text-5xl font-display font-bold text-green-600 dark:text-green-500">
                {formatCurrency(stakeResult)}
              </div>
            </div>
            
            <div className="flex gap-8 border-t md:border-t-0 md:border-l border-slate-100 dark:border-surface-300 pt-6 md:pt-0 md:pl-8">
              <div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mb-1">Banca Total:</p>
                <div className="text-xl font-display font-bold text-slate-900 dark:text-white">
                  {formatCurrency(Number(banca.replace(',', '.')) || 0)}
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mb-1">Risco Unitário:</p>
                <div className="text-xl font-display font-bold text-blue-600 dark:text-blue-400">
                  {porcentagem}%
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
