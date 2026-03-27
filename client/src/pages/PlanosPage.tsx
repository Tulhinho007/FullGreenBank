import React from 'react'
import { Link } from 'react-router-dom'
import { Check, X, Star, Zap, Crown, ArrowLeft, Shield } from 'lucide-react'

const PLAN_DATA = [
  {
    id: 'starter',
    name: 'STARTER',
    subtitle: 'Básico',
    price: 'Grátis',
    color: 'text-slate-300',
    borderColor: 'border-white/5',
    bgColor: 'bg-[#151921]',
    icon: <Zap size={24} />,
    features: [
      'Dashboard Geral', 
      'Dicas (Tips)', 
      'Gestão de Bancas (Apenas 1)', 
      'Calculadora Operacional', 
      'Suporte Comum'
    ],
    notIncluded: [
      'Tipsters', 
      'Histórico de Dicas', 
      'Relatórios de Performance', 
      '🌱 Simulador de consistência', 
      'Alavancagem', 
      'Dicas de Gestão', 
      'Análise de Valor'
    ]
  },
  {
    id: 'pro',
    name: 'PRO',
    subtitle: 'Completo',
    price: 'R$ 39,90',
    color: 'text-[#00FF7F]',
    borderColor: 'border-[#00FF7F]/20',
    bgColor: 'bg-[#151921]',
    icon: <Crown size={24} />,
    highlight: true,
    features: [
      'Dashboard Geral',
      'Dicas (Tips)',
      'Tipsters',
      'Histórico de Dicas',
      'Relatórios de Performance',
      'Gestão de Bancas (Ilimitadas)',
      'Calculadora Operacional',
      '🌱 Simulador de consistência',
      'Alavancagem',
      'Dicas de Gestão',
      'Análise de Valor',
      'Suporte VIP / Direto'
    ],
    notIncluded: []
  }
]

const COMPARISON_TABLE = [
  { category: 'FUNCIONALIDADES', features: [
    { name: 'Dashboard Geral', starter: true, pro: true },
    { name: 'Dicas (Tips)', starter: true, pro: true },
    { name: 'Tipsters', starter: false, pro: true },
    { name: 'Histórico de Dicas', starter: false, pro: true },
    { name: 'Relatórios de Performance', starter: false, pro: true },
    { name: 'Gestão de Bancas', starter: 'Apenas 1', pro: 'Ilimitadas' },
    { name: 'Calculadora Operacional', starter: true, pro: true },
    { name: 'Simulador de consistência', starter: false, pro: true },
    { name: 'Alavancagem', starter: false, pro: true },
    { name: 'Dicas de Gestão', starter: false, pro: true },
    { name: 'Análise de Valor', starter: false, pro: true },
    { name: 'Suporte', starter: 'Comum', pro: 'VIP / Direto' },
  ]}
]

export const PlanosPage = () => {
  return (
    <div className="min-h-screen bg-[#0D1016] flex flex-col items-center">
      <div className="flex flex-col gap-10 w-full py-16 px-4 md:px-8 max-w-6xl mx-auto relative">
        
        {/* BACK BUTTON */}
        <div className="absolute top-8 left-4 md:left-8">
          <Link 
            to="/dashboard" 
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-medium text-sm drop-shadow-md"
          >
            <ArrowLeft size={18} />
            Voltar para o sistema
          </Link>
        </div>

        {/* HEADER SECTION */}
        <div className="text-center space-y-4 pt-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full shadow-[-4px_-4px_10px_rgba(255,255,255,0.02),_4px_4px_10px_rgba(0,0,0,0.5)] border border-white/5 text-[#00FF7F] text-[10px] font-black uppercase tracking-widest bg-[#151921] ring-1 ring-[#00FF7F]/20">
             <Star size={12} fill="currentColor" /> Planos & Assinaturas
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white tracking-tight drop-shadow-md">
            O poder de escala para o seu <span className="text-[#00FF7F] drop-shadow-[0_0_15px_rgba(0,255,127,0.4)]">Green</span>.
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            Escolha o plano ideal para o seu nível de gestão e impulsione seus resultados com ferramentas profissionais.
          </p>
        </div>

        {/* PLAN CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-stretch max-w-4xl mx-auto w-full mt-8">
          {PLAN_DATA.map((plan) => (
            <div 
              key={plan.id}
              className={`relative flex flex-col p-8 rounded-3xl transition-all duration-300 ${plan.bgColor} border ${plan.borderColor} ${plan.highlight ? 'shadow-[-15px_-15px_30px_rgba(255,255,255,0.02),_15px_15px_30px_rgba(0,0,0,0.6)] ring-1 ring-[#00FF7F]/30 glow-card' : 'shadow-[-10px_-10px_20px_rgba(255,255,255,0.02),_10px_10px_20px_rgba(0,0,0,0.5)]'}`}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#00FF7F] text-[#0D1016] text-[10px] font-black px-5 py-1.5 rounded-full uppercase tracking-widest shadow-[0_0_20px_rgba(0,255,127,0.4)]">
                  Recomendado
                </div>
              )}

              <div className={`mb-6 p-4 rounded-2xl inline-block ${plan.color} bg-[#0D1016] shadow-[inset_-5px_-5px_10px_rgba(255,255,255,0.02),_inset_5px_5px_10px_rgba(0,0,0,0.6)] border border-white/5`}>
                {plan.icon}
              </div>

              <h3 className="text-2xl font-display font-bold text-white leading-none mb-1 tracking-wide">
                {plan.name}
              </h3>
              <p className="text-slate-400 text-sm font-medium mb-6">{plan.subtitle}</p>

              <div className="mb-8 flex items-end">
                <span className={`text-4xl font-black ${plan.highlight ? 'text-white' : 'text-slate-200'} drop-shadow-md`}>{plan.price}</span>
                {plan.id !== 'starter' && <span className="text-slate-400 text-sm ml-2 mb-1">/mensal</span>}
              </div>

              <div className="space-y-5 mb-12 flex-1 relative z-10">
                {plan.features.map((feat, i) => (
                  <div key={i} className="flex items-start gap-4 text-sm group">
                    <div className="mt-0.5 w-6 h-6 rounded-full shadow-[-2px_-2px_5px_rgba(255,255,255,0.03),_2px_2px_5px_rgba(0,0,0,0.4)] bg-[#1A1F29] border border-white/5 flex items-center justify-center text-[#00FF7F] shrink-0">
                      <Check size={12} strokeWidth={4} />
                    </div>
                    <span className="text-slate-200 font-medium tracking-wide group-hover:text-white transition-colors">{feat}</span>
                  </div>
                ))}
                {plan.notIncluded.map((feat, i) => (
                  <div key={i} className="flex items-start gap-4 text-sm opacity-50 grayscale">
                    <div className="mt-0.5 w-6 h-6 rounded-full shadow-[inset_-2px_-2px_5px_rgba(255,255,255,0.02),_inset_2px_2px_5px_rgba(0,0,0,0.4)] bg-[#0D1016] border border-white/5 flex items-center justify-center text-rose-500 shrink-0">
                      <X size={12} strokeWidth={3} />
                    </div>
                    <span className="text-slate-500 line-through tracking-wide">{feat}</span>
                  </div>
                ))}
              </div>

              <a 
                href="https://w.app/ixpqkt"
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full py-4 rounded-2xl font-bold text-xs uppercase tracking-widest text-center transition-all flex items-center justify-center relative shadow-[-5px_-5px_15px_rgba(255,255,255,0.05),_5px_5px_15px_rgba(0,0,0,0.6)] ${
                  plan.id === 'starter' 
                    ? 'bg-[#151921] hover:bg-[#1A1F29] text-white border border-white/10 active:shadow-[inset_-3px_-3px_8px_rgba(255,255,255,0.02),_inset_3px_3px_8px_rgba(0,0,0,0.6)]' 
                    : 'bg-[#00FF7F] hover:bg-[#00E673] text-[#0D1016] shadow-[0_0_20px_rgba(0,255,127,0.2)] hover:shadow-[0_0_25px_rgba(0,255,127,0.4)] border border-[#00FF7F] active:shadow-[inset_-3px_-3px_8px_rgba(255,255,255,0.3),_inset_3px_3px_8px_rgba(0,0,0,0.3)]'
                }`}
              >
                {plan.id === 'starter' ? 'Plano Atual' : 'Assinar Plano'}
              </a>
            </div>
          ))}
        </div>

        {/* MIDDLE ICON SHIELD SECTION */}
        <div className="flex justify-center py-10">
          <div className="relative shadow-[-8px_-8px_20px_rgba(255,255,255,0.02),_8px_8px_20px_rgba(0,0,0,0.6)] bg-[#151921] p-6 rounded-full border border-white/5">
            <div className="relative">
              <Shield size={56} className="text-[#0D1016] drop-shadow-md" strokeWidth={1.5} fill="currentColor" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-1 drop-shadow-[0_0_10px_rgba(0,255,127,0.6)]">
                <Zap size={28} className="text-[#00FF7F]" fill="currentColor" />
              </div>
            </div>
          </div>
        </div>

        {/* COMPARISON TABLE */}
        <div className="space-y-10 w-full mb-10">
          <div className="text-center max-w-xl mx-auto">
            <h2 className="text-3xl font-display font-bold text-white drop-shadow-md">Compare cada detalhe.</h2>
            <p className="text-slate-400 mt-3 text-sm tracking-wide">Visão técnica detalhada de todas as permissões e recursos disponíveis.</p>
          </div>

          <div className="bg-[#151921] rounded-3xl shadow-[-15px_-15px_30px_rgba(255,255,255,0.02),_15px_15px_30px_rgba(0,0,0,0.6)] border border-white/5 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0D1016]">
                  <th className="px-8 py-6 text-sm font-bold text-slate-400 uppercase tracking-widest border-b border-white/5 shadow-[inset_0_-2px_10px_rgba(0,0,0,0.4)]">Funcionalidade</th>
                  <th className="px-8 py-6 text-center text-sm font-bold text-slate-400 uppercase tracking-widest border-b border-white/5 shadow-[inset_0_-2px_10px_rgba(0,0,0,0.4)]">Starter</th>
                  <th className="px-8 py-6 text-center text-sm font-bold text-[#00FF7F] uppercase tracking-widest border-b border-white/5 shadow-[inset_0_-2px_10px_rgba(0,0,0,0.4)]">Pro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {COMPARISON_TABLE.map((section, idx) => (
                  <React.Fragment key={idx}>
                    <tr className="bg-[#0F1218]">
                      <td colSpan={4} className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] shadow-[inset_0_2px_10px_rgba(0,0,0,0.2)]">
                        {section.category}
                      </td>
                    </tr>
                    {section.features.map((feature, fIdx) => (
                      <tr key={fIdx} className="hover:bg-[#1A1F29] transition-colors">
                        <td className="px-8 py-5 text-sm font-medium text-white tracking-wide">{feature.name}</td>
                        <td className="px-8 py-5 text-center text-sm">
                          {renderValue(feature.starter)}
                        </td>
                        <td className="px-8 py-5 text-center text-sm bg-[linear-gradient(to_bottom,rgba(0,255,127,0.01),rgba(0,255,127,0.03))]">
                          {renderValue(feature.pro)}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}

const renderValue = (val: any) => {
  if (typeof val === 'boolean') {
    return val ? (
      <div className="flex justify-center text-[#00FF7F] drop-shadow-[0_0_8px_rgba(0,255,127,0.3)]"><Check size={20} strokeWidth={3} /></div>
    ) : (
      <div className="flex justify-center text-rose-500"><X size={20} strokeWidth={3} /></div>
    )
  }
  return <span className="font-bold text-slate-300 tracking-wide text-xs uppercase">{val}</span>
}
