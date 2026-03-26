import { useState, useMemo } from 'react'
import { 
  Calculator as CalcIcon, Info, 
  ShieldCheck, MousePointer2, ShieldAlert,
  TrendingUp, TrendingDown, Swords, Shield
} from 'lucide-react'
import { formatCurrency } from '../utils/formatters'
import toast from 'react-hot-toast'

interface StakeVariation {
  label: string
  units: number
  value: number
  description: string
}

export const CalculadoraPage = () => {
  const [banca, setBanca] = useState<string>('1000')
  const [porcentagem, setPorcentagem] = useState<string>('2.5')
  const [showResult, setShowResult] = useState(false)

  const bancaNum = Number(banca.replace(',', '.')) || 0
  const percentNum = Number(porcentagem.replace(',', '.')) || 0

  const metrics = useMemo(() => {
    const unitValue = bancaNum * (percentNum / 100)
    
    // Variações de Stake
    const variations: StakeVariation[] = [
      { label: '0.25 Unidade', units: 0.25, value: unitValue * 0.25, description: 'Baixa Confiança / Exploração' },
      { label: '0.50 Unidade', units: 0.5, value: unitValue * 0.5, description: 'Confiança Moderada' },
      { label: '1.00 Unidade', units: 1.0, value: unitValue, description: 'Confiança Padrão (Full Stake)' },
      { label: '1.50 Unidades', units: 1.5, value: unitValue * 1.5, description: 'Alta Confiança' },
      { label: '2.00 Unidades', units: 2.0, value: unitValue * 2.0, description: 'Máxima Confiança' },
    ]

    // Stop Loss / Green (Recomendado: Loss 3u, Green 2u)
    const stopLoss = unitValue * 3
    const stopGreen = unitValue * 2
    
    // Tentativas até a Ruína
    const ruinAttempts = percentNum > 0 ? Math.floor(100 / percentNum) : 0

    return {
      unitValue,
      variations,
      stopLoss,
      stopGreen,
      ruinAttempts
    }
  }, [bancaNum, percentNum])

  const handleQuickSelect = (val: string) => {
    setPorcentagem(val)
    setShowResult(true)
    toast.success(`Unidade definida para ${val}%`)
  }

  const handleCalculate = () => {
    if (bancaNum <= 0) {
      toast.error('Informe o valor da sua banca')
      return
    }
    setShowResult(true)
  }

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto pb-20">
      <header className="flex flex-col items-center text-center gap-2 mb-4">
        <h1 className="text-4xl font-black text-slate-800 flex items-center justify-center gap-3 tracking-tight">
          <CalcIcon className="text-emerald-500" size={40} />
          Calculadora de Unidade
        </h1>
        <p className="text-slate-400 text-[11px] font-black uppercase tracking-[0.2em] mt-2">Defina sua gestão de banca profissional e limites de risco.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coluna de Configuração */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all hover:border-emerald-500/30">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Valor Total da Banca (BRL)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-bold">R$</span>
              <input 
                type="text"
                inputMode="decimal"
                value={banca}
                onChange={(e) => setBanca(e.target.value)}
                placeholder="0,00"
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 pl-12 pr-6 text-3xl font-black text-slate-800 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-inner font-mono"
              />
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all hover:border-emerald-500/30 flex-1">
            <div className="flex items-center justify-between mb-8">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Porcentagem (%)</label>
              <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 cursor-help border border-slate-100" title="Defina quanto da sua banca representa 1 unidade">
                <Info size={12} />
              </div>
            </div>
            
            <div className="space-y-6">
              <input 
                type="text"
                inputMode="decimal"
                value={porcentagem}
                onChange={(e) => setPorcentagem(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-2xl font-black text-slate-800 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-inner text-center font-mono"
              />
              
              <div className="grid grid-cols-2 gap-3">
                {['1.0', '2.0', '2.5', '5.0'].map(val => (
                  <button
                    key={val}
                    onClick={() => handleQuickSelect(val)}
                    className={`py-3 rounded-xl border text-[10px] font-black transition-all uppercase tracking-widest ${
                      porcentagem === val 
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-500/20' 
                        : 'bg-white border-slate-100 text-slate-400 hover:border-emerald-500/30'
                    }`}
                  >
                    {val}%
                  </button>
                ))}
              </div>

              <button 
                onClick={handleCalculate}
                className="w-full h-14 bg-emerald-600 text-white rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/20 hover:bg-emerald-700 active:scale-95 transition-all text-[11px] uppercase tracking-widest"
              >
                <MousePointer2 size={18} />
                Calcular Unidade
              </button>
            </div>
          </div>
        </div>

        {/* Coluna de Perfis e Comparativo */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <ShieldCheck size={18} className="text-emerald-500" />
              <h2 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Selecione seu Perfil de Investidor</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button 
                onClick={() => handleQuickSelect('1.0')}
                className={`group flex flex-col p-6 rounded-[2rem] border transition-all text-left ${porcentagem === '1.0' ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20' : 'bg-white border-slate-100 hover:border-emerald-300'}`}
              >
                <div className={`w-10 h-10 rounded-xl mb-4 flex items-center justify-center transition-colors ${porcentagem === '1.0' ? 'bg-emerald-500 text-white' : 'bg-emerald-50 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white'}`}>
                  <Shield size={20} />
                </div>
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Conservador</span>
                <span className="text-2xl font-black text-slate-800">1.0%</span>
                <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-tight">Foco em longevidade e segurança total.</p>
              </button>

              <button 
                onClick={() => handleQuickSelect('2.5')}
                className={`group flex flex-col p-6 rounded-[2rem] border transition-all text-left ${porcentagem === '2.5' ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20' : 'bg-white border-slate-100 hover:border-amber-300'}`}
              >
                <div className={`w-10 h-10 rounded-xl mb-4 flex items-center justify-center transition-colors ${porcentagem === '2.5' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-500 group-hover:bg-amber-500 group-hover:text-white'}`}>
                  <Shield size={20} />
                </div>
                <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Moderado</span>
                <span className="text-2xl font-black text-slate-800">2.5%</span>
                <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-tight">Equilíbrio entre lucro e risco de banca.</p>
              </button>

              <button 
                onClick={() => handleQuickSelect('5.0')}
                className={`group flex flex-col p-6 rounded-[2rem] border transition-all text-left ${porcentagem === '5.0' ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-500/20' : 'bg-white border-slate-100 hover:border-rose-300'}`}
              >
                <div className={`w-10 h-10 rounded-xl mb-4 flex items-center justify-center transition-colors ${porcentagem === '5.0' ? 'bg-rose-500 text-white' : 'bg-rose-50 text-rose-500 group-hover:bg-rose-500 group-hover:text-white'}`}>
                  <ShieldAlert size={20} />
                </div>
                <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">Agressivo</span>
                <span className="text-2xl font-black text-slate-800">5.0%</span>
                <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-tight">Foco em crescimento rápido (Risco Alto).</p>
              </button>
            </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <ShieldAlert size={120} className="text-emerald-500" />
            </div>
            
            <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-4">
              <ShieldAlert size={18} className="text-emerald-500" />
              <h2 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Simulador de Sobrevivência (Risco de Ruína)</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <p className="text-sm font-medium text-slate-400 leading-relaxed mb-4">
                  Com uma gestão de <span className="text-white font-black">{percentNum}%</span>, você precisa de <span className="text-emerald-500 font-black">{metrics.ruinAttempts} erros seguidos</span> para quebrar sua banca completamente.
                </p>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${percentNum <= 2 ? 'bg-emerald-500' : percentNum <= 4 ? 'bg-amber-500' : 'bg-rose-500'}`}
                    style={{ width: `${Math.max(0, Math.min(100, (metrics.ruinAttempts / 100) * 100))}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50">
                <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Nível de Segurança:</div>
                <div className={`text-lg font-black uppercase tracking-widest ${percentNum <= 2 ? 'text-emerald-400' : percentNum <= 4 ? 'text-amber-400' : 'text-rose-400'}`}>
                  {percentNum <= 2 ? '🛡️ Máxima Segurança' : percentNum <= 4 ? '⚖️ Equilibrado' : '🔥 Risco Elevado'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Resultados e Stop Loss/Green */}
      {showResult && (
        <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <CalcIcon className="text-emerald-500" size={16} />
                    <span className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em]">Sua Unidade Padrão</span>
                  </div>
                  <div className="text-7xl font-black text-emerald-600 tracking-tighter">
                    {formatCurrency(metrics.unitValue)}
                  </div>
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-4">
                    BASEADO EM {percentNum}% DE {formatCurrency(bancaNum)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-50">
                  <div className="p-5 rounded-3xl bg-emerald-500/5 border border-emerald-500/10">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp size={14} className="text-emerald-600" />
                      <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">Meta de Ganho</span>
                    </div>
                    <span className="text-2xl font-black text-emerald-600">{formatCurrency(metrics.stopGreen)}</span>
                    <p className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest mt-1">Sugerido: Stop Green 2u</p>
                  </div>
                  <div className="p-5 rounded-3xl bg-rose-500/5 border border-rose-500/10">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingDown size={14} className="text-rose-600" />
                      <span className="text-[9px] font-black text-rose-700 uppercase tracking-widest">Limite de Perda</span>
                    </div>
                    <span className="text-2xl font-black text-rose-600">{formatCurrency(metrics.stopLoss)}</span>
                    <p className="text-[10px] font-black text-rose-600/60 uppercase tracking-widest mt-1">Sugerido: Stop Loss 3u</p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-6">
                  <Swords size={16} className="text-slate-400" />
                  <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Variações de Stake por Confiança</h3>
                </div>
                <div className="bg-slate-50 rounded-[2rem] border border-slate-100 overflow-hidden divide-y divide-slate-100">
                  {metrics.variations.map((v, i) => (
                    <div key={i} className="px-6 py-5 flex items-center justify-between hover:bg-white transition-colors">
                      <div>
                        <div className="text-[12px] font-black text-slate-800 uppercase tracking-widest">{v.label}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{v.description}</div>
                      </div>
                      <div className="text-lg font-black text-emerald-600 font-mono">
                        {formatCurrency(v.value)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Dica de Especialista */}
          <div className="bg-sky-500/10 border border-sky-500/20 p-8 rounded-[2.5rem] flex items-start gap-4">
            <Info className="text-sky-500 shrink-0 mt-1" size={24} />
            <div>
              <h4 className="text-sm font-black text-sky-600 uppercase tracking-[0.2em] mb-2">Dica de Gestão Profissional</h4>
              <p className="text-sm font-medium text-sky-900/60 leading-relaxed">
                Um erro comum é aumentar a unidade para recuperar perdas. No longo prazo, a disciplina de manter a unidade calculada é o que gera lucro consistente. 
                Se você atingir seu <span className="font-black text-rose-600">Stop Loss diário (3 unidades)</span>, pare imediatamente e retorne amanhã com a mente fresca.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
