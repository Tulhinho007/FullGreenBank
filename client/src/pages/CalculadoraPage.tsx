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
    <div className="flex flex-col gap-6 max-w-4xl mx-auto transition-all duration-300">
      <header className="flex flex-col items-center text-center gap-2 mb-4">
        <h1 className="text-3xl font-display font-black text-slate-800 flex items-center justify-center gap-3 tracking-tight">
          <CalcIcon className="text-emerald-600" size={32} />
          Calculadora Profissional
        </h1>
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Defina sua unidade de aposta com base na gestão de banca profissional.</p>
      </header>

      {/* Input de Banca */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-8 relative overflow-hidden transition-all hover:border-emerald-500/30">
        <div className="w-16 h-16 rounded-[1.5rem] bg-emerald-50 flex items-center justify-center border border-emerald-100 shrink-0 shadow-sm">
          <CalcIcon className="text-emerald-600" size={32} />
        </div>
        <div className="flex-1 w-full text-center md:text-left">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Valor Total da Banca (BRL)</label>
          <input 
            type="text"
            inputMode="decimal"
            value={banca}
            onChange={(e) => setBanca(e.target.value)}
            placeholder="Ex: 5.000,00"
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 px-6 text-3xl font-display font-black text-slate-800 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-inner text-center md:text-left placeholder:text-slate-200"
          />
        </div>
      </div>

      {/* Configuração de Porcentagem */}
      <div className="bg-white p-8 lg:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden transition-all hover:border-emerald-500/30">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <Percent size={20} className="text-emerald-500" />
            <h2 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Definição da Unidade</h2>
          </div>
          <div className="w-7 h-7 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-emerald-500 cursor-help transition-all border border-slate-100" title="Cálculo de stake baseado em porcentagem fixa da banca total">
            <Info size={14} />
          </div>
        </div>

        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-10">Calcule o stake usando uma porcentagem fixa da sua banca</p>

        <div className="space-y-8">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-1">Porcentagem Desejada (%)</label>
            <input 
              type="text"
              inputMode="decimal"
              value={porcentagem}
              onChange={(e) => setPorcentagem(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-2xl font-display font-black text-slate-800 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-inner"
            />
            <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest mt-4 px-1">Recomendado: 1% a 5% dependendo do seu perfil</p>
          </div>

          {/* Quick Select Buttons */}
          <div className="flex flex-wrap gap-3">
            {['1', '2', '3', '5'].map(val => (
              <button
                key={val}
                onClick={() => handleQuickSelect(val)}
                className={`px-8 py-3 rounded-2xl border text-[11px] font-black transition-all uppercase tracking-widest ${
                  porcentagem === val 
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-500/20 scale-105' 
                    : 'bg-white border-slate-100 text-slate-400 hover:border-emerald-500/30 hover:text-emerald-600 shadow-sm'
                }`}
              >
                {val}%
              </button>
            ))}
          </div>

          <button 
            onClick={handleCalculate}
            className="w-full h-16 bg-emerald-600 text-white rounded-[1.5rem] font-black flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/10 hover:bg-emerald-700 active:scale-95 transition-all text-[11px] uppercase tracking-[0.2em]"
          >
            <MousePointer2 size={18} />
            Calcular Unidade
          </button>
        </div>

        {/* Recomendação por Perfil */}
        <div className="mt-12 space-y-6 pt-10 border-t border-slate-50">
          <div className="flex items-center gap-3">
            <ShieldCheck size={20} className="text-blue-500" />
            <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none">Sugestão Profissional por Perfil:</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Conservador */}
            <div className="flex flex-col p-5 rounded-[1.5rem] bg-emerald-50/30 border border-emerald-100/50 group hover:border-emerald-500/30 transition-all">
              <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-2">Conservador</span>
              <span className="text-2xl font-display font-black text-emerald-700">1% — 2%</span>
            </div>
            {/* Moderado */}
            <div className="flex flex-col p-5 rounded-[1.5rem] bg-amber-50/30 border border-amber-100/50 group hover:border-amber-500/30 transition-all">
              <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-2">Moderado</span>
              <span className="text-2xl font-display font-black text-amber-700">2% — 3%</span>
            </div>
            {/* Agressivo */}
            <div className="flex flex-col p-5 rounded-[1.5rem] bg-rose-50/30 border border-rose-100/50 group hover:border-rose-500/30 transition-all">
              <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest mb-2">Agressivo</span>
              <span className="text-2xl font-display font-black text-rose-700">3% — 5%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Resultado */}
      {showResult && (
        <div className="bg-white p-10 rounded-[3rem] border border-emerald-100 shadow-2xl shadow-emerald-500/10 bg-gradient-to-br from-white to-emerald-50/50 animate-in fade-in slide-in-from-bottom-6 duration-700">
          <div className="flex items-center justify-between mb-10 pb-6 border-b border-slate-50">
            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em]">Resultado Profissional</h3>
            <span className="px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase tracking-widest border border-emerald-200">Valor Unitário</span>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
            <div>
              <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest mb-3">Sua Stake Recomendada:</p>
              <div className="text-5xl md:text-7xl font-display font-black text-emerald-600 tracking-tighter">
                {formatCurrency(stakeResult)}
              </div>
            </div>
            
            <div className="flex gap-10 border-t md:border-t-0 md:border-l border-slate-100 pt-8 md:pt-0 md:pl-10">
              <div>
                <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest mb-2">Banca Pro:</p>
                <div className="text-xl font-display font-bold text-slate-800">
                  {formatCurrency(Number(banca.replace(',', '.')) || 0)}
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest mb-2">Risco:</p>
                <div className="text-xl font-display font-bold text-blue-600">
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
