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
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-display font-bold text-white flex items-center gap-3">
          <CalcIcon className="text-green-500" size={28} />
          Calculadora de Stake
        </h1>
        <p className="text-slate-400 text-sm italic">Defina sua unidade de aposta com base na gestão de banca profissional.</p>
      </header>

      {/* Input de Banca */}
      <div className="card p-6 flex flex-col md:flex-row items-center gap-6">
        <div className="w-14 h-14 rounded-xl bg-green-500/10 flex items-center justify-center border border-green-500/20 shrink-0">
          <CalcIcon className="text-green-500" size={28} />
        </div>
        <div className="flex-1 w-full">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Valor da Banca (R$)</label>
          <input 
            type="text"
            inputMode="decimal"
            value={banca}
            onChange={(e) => setBanca(e.target.value)}
            placeholder="Ex: 500,00"
            className="input-field w-full text-lg h-14"
          />
        </div>
      </div>

      {/* Configuração de Porcentagem */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Percent size={18} className="text-green-500" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Porcentagem Fixa</h2>
          </div>
          <div className="w-5 h-5 rounded-full bg-surface-300 flex items-center justify-center text-slate-500 hover:text-white cursor-help" title="Cálculo de stake baseado em porcentagem fixa da banca total">
            <Info size={12} />
          </div>
        </div>

        <p className="text-sm text-slate-400 mb-6">Calcule o stake usando uma porcentagem fixa da sua banca</p>

        <div className="space-y-6">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Porcentagem da Banca (%)</label>
            <input 
              type="text"
              inputMode="decimal"
              value={porcentagem}
              onChange={(e) => setPorcentagem(e.target.value)}
              className="input-field w-full text-lg h-12"
            />
            <p className="text-[10px] text-slate-500 mt-2 italic px-1">Recomendado: 1% a 5% dependendo do seu perfil de risco</p>
          </div>

          {/* Quick Select Buttons */}
          <div className="flex flex-wrap gap-2">
            {['1', '2', '3', '5'].map(val => (
              <button
                key={val}
                onClick={() => handleQuickSelect(val)}
                className={`px-6 py-2 rounded-lg border text-sm font-bold transition-all ${
                  porcentagem === val 
                    ? 'bg-green-600 border-green-500 text-white shadow-lg' 
                    : 'bg-surface-300 border-surface-400 text-slate-400 hover:text-white hover:border-slate-500'
                }`}
              >
                {val}%
              </button>
            ))}
          </div>

          <button 
            onClick={handleCalculate}
            className="w-full h-14 btn-primary flex items-center justify-center gap-3 text-base shadow-lg shadow-green-500/10"
          >
            <MousePointer2 size={18} />
            Calcular Stake
          </button>
        </div>

        {/* Recomendação por Perfil */}
        <div className="mt-8 space-y-3 pt-6 border-t border-surface-300">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck size={18} className="text-blue-500" />
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none">Recomendação por Perfil:</h3>
          </div>

          <div className="space-y-2">
            {/* Conservador */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 group hover:border-emerald-500/40 transition-colors">
              <span className="text-sm font-bold text-emerald-500">Conservador</span>
              <span className="text-xs font-mono font-bold text-emerald-500/70">1% — 2%</span>
            </div>
            {/* Moderado */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 group hover:border-amber-500/40 transition-colors">
              <span className="text-sm font-bold text-amber-500">Moderado</span>
              <span className="text-xs font-mono font-bold text-amber-500/70">2% — 3%</span>
            </div>
            {/* Agressivo */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-rose-500/5 border border-rose-500/20 group hover:border-rose-500/40 transition-colors">
              <span className="text-sm font-bold text-rose-500">Agressivo</span>
              <span className="text-xs font-mono font-bold text-rose-500/70">3% — 5%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Resultado */}
      {showResult && (
        <div className="card p-6 bg-gradient-to-br from-surface-200 to-green-900/10 border-green-500/20 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-surface-300/50">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Resultado do Cálculo</h3>
            <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-400 text-[10px] font-bold uppercase tracking-tighter italic">Stake Sugerida</span>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Valor Unitário:</p>
              <div className="text-4xl font-mono font-bold text-green-500 drop-shadow-sm">
                {formatCurrency(stakeResult)}
              </div>
            </div>
            
            <div className="flex gap-4 border-l border-surface-300 pl-4">
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Banca Final:</p>
                <div className="text-lg font-mono font-bold text-white">
                  {formatCurrency(Number(banca.replace(',', '.')) || 0)}
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Risco:</p>
                <div className="text-lg font-mono font-bold text-slate-300">
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
