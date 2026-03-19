import React from 'react'
import { Check, X, Star, Zap, Crown, Shield } from 'lucide-react'

const PLAN_DATA = [
  {
    id: 'starter',
    name: 'STARTER',
    subtitle: 'Free',
    price: 'Grátis',
    color: 'text-slate-400',
    borderColor: 'border-slate-200 dark:border-surface-400',
    bgColor: 'bg-slate-50 dark:bg-surface-300/10',
    icon: <Zap size={24} />,
    features: [
      'Dashboard Básico', 
      'Dicas & Palpites', 
      'Gerenciamento de 1 Banca', 
      'Sistema de Tipsters', 
      'Histórico (2 meses de teste)'
    ],
    notIncluded: ['Análise de Valor', 'Banca Gerenciada']
  },
  {
    id: 'standard',
    name: 'STANDARD',
    subtitle: 'Inter.',
    price: 'Intermediário',
    color: 'text-green-500',
    borderColor: 'border-green-500/30',
    bgColor: 'bg-green-500/5 dark:bg-green-500/10',
    icon: <Shield size={24} />,
    features: ['Dashboard Completo', 'Dicas & Palpites', 'Até 3 Bancas Ativas', 'Sistema de Tipsters', 'Histórico Completo'],
    notIncluded: ['Análise de Valor', 'Banca Gerenciada']
  },
  {
    id: 'pro',
    name: 'PRO',
    subtitle: 'Full',
    price: 'Acesso Total',
    color: 'text-yellow-500',
    borderColor: 'border-yellow-500/50',
    bgColor: 'bg-yellow-500/5 dark:bg-yellow-500/10',
    icon: <Crown size={24} />,
    highlight: true,
    features: [
      'Dashboard Avançado + Analytics',
      'Dicas & Palpites ILIMITADOS',
      'Bancas Ativas ILIMITADAS',
      'Sistema de Tipsters Profissional',
      'Análise de Valor (EV+)',
      'Histórico + Exportação total',
      'Banca Gerenciada & Investidores'
    ],
    notIncluded: []
  }
]

const COMPARISON_TABLE = [
  { category: 'PRINCIPAL', features: [
    { name: '📊 Dashboard', starter: 'Resumo Básico', standard: 'Completo', pro: 'Avançado + Analytics' },
    { name: '📈 Dicas', starter: true, standard: true, pro: true },
  ]},
  { category: 'GESTÃO', features: [
    { name: '💳 Bancas Ativas', starter: 'Apenas 1', standard: 'Até 3', pro: 'Ilimitadas' },
    { name: '🎯 Tipsters', starter: true, standard: true, pro: true },
    { name: '📊 Análise de Valor', starter: false, standard: false, pro: true },
    { name: '🕒 Histórico', starter: '2 Meses (Teste)', standard: 'Completo', pro: 'Completo + Exportação' },
  ]},
  { category: 'FINANCEIRO', features: [
    { name: '💸 Pagamentos', starter: true, standard: true, pro: true },
    { name: '💼 Banca Gerenciada', starter: false, standard: false, pro: true },
  ]}
]

export const PlanosPage = () => {
  return (
    <div className="flex flex-col gap-10 w-full pb-20 max-w-6xl mx-auto">
      
      {/* HEADER SECTION */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-500 text-xs font-bold uppercase tracking-widest animate-pulse">
           <Star size={12} fill="currentColor" /> Planos & Assinaturas
        </div>
        <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-900 dark:text-white tracking-tight">
          O poder de escala para o seu <span className="text-green-500">Green</span>.
        </h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-lg">
          Escolha o plano ideal para o seu nível de gestão e impulsione seus resultados com ferramentas profissionais.
        </p>
      </div>

      {/* PLAN CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {PLAN_DATA.map((plan) => (
          <div 
            key={plan.id}
            className={`relative flex flex-col p-8 rounded-3xl border-2 transition-all duration-300 hover:scale-[1.02] ${plan.borderColor} ${plan.bgColor} ${plan.highlight ? 'shadow-[0_20px_50px_rgba(234,179,8,0.1)] ring-2 ring-yellow-500/20' : 'shadow-sm'}`}
          >
            {plan.highlight && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-tighter shadow-lg">
                Recomendado
              </div>
            )}

            <div className={`mb-6 p-3 rounded-2xl inline-block ${plan.color} bg-white dark:bg-surface-200 border border-slate-100 dark:border-surface-400 shadow-sm`}>
              {plan.icon}
            </div>

            <h3 className="text-2xl font-display font-bold text-slate-900 dark:text-white leading-none mb-1">
              {plan.name}
            </h3>
            <p className="text-slate-500 text-sm font-medium mb-6">{plan.subtitle}</p>

            <div className="mb-8">
              <span className="text-4xl font-black text-slate-900 dark:text-white">{plan.price}</span>
              {plan.id !== 'starter' && <span className="text-slate-500 text-sm ml-2">/mensal</span>}
            </div>

            <div className="space-y-4 mb-10 flex-1">
              {plan.features.map((feat, i) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <div className="mt-0.5 w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 shrink-0">
                    <Check size={12} strokeWidth={3} />
                  </div>
                  <span className="text-slate-700 dark:text-slate-300 font-medium">{feat}</span>
                </div>
              ))}
              {plan.notIncluded.map((feat, i) => (
                <div key={i} className="flex items-start gap-3 text-sm opacity-40 grayscale">
                  <div className="mt-0.5 w-5 h-5 rounded-full bg-slate-500/10 flex items-center justify-center text-slate-400 shrink-0">
                    <X size={12} strokeWidth={3} />
                  </div>
                  <span className="text-slate-500 dark:text-slate-500 line-through">{feat}</span>
                </div>
              ))}
            </div>

            <button className={`w-full py-4 rounded-2xl font-bold text-sm transition-all active:scale-95 ${plan.highlight ? 'bg-yellow-500 hover:bg-yellow-400 text-black shadow-yellow-500/20' : 'bg-slate-900 dark:bg-white text-white dark:text-black hover:opacity-90 shadow-lg'} shadow-xl`}>
              {plan.id === 'starter' ? 'Começar Agora' : 'Assinar Plano'}
            </button>
          </div>
        ))}
      </div>

      {/* PRO OBSERVER & STARTER TRIAL NOTE */}
      <div className="flex flex-col gap-4">
        <div className="p-6 rounded-2xl bg-gradient-to-r from-yellow-500/10 via-yellow-500/20 to-yellow-500/10 border border-yellow-500/30 text-center text-sm font-semibold text-yellow-600 dark:text-yellow-400">
          <p className="flex items-center justify-center gap-2">
            <Zap size={16} fill="currentColor" /> 
            Obs: Qualquer nova funcionalidade no sistema o plano <span className="underline font-black">PRO</span> terá acesso imediato e garantido.
          </p>
        </div>
        
        <div className="p-6 rounded-2xl bg-slate-100 dark:bg-surface-300/10 border border-slate-200 dark:border-surface-400 text-center text-sm text-slate-600 dark:text-slate-400">
          <p>
            <span className="font-bold text-slate-900 dark:text-white">Atenção:</span> O plano <span className="font-bold">STARTER</span> possui acesso ao Histórico por apenas <span className="text-green-500 font-bold">2 meses como teste</span>. 
            Após esse período, as funcionalidades avançadas serão bloqueadas e o acesso será restrito à visualização do Dashboard inicial.
          </p>
        </div>
      </div>

      {/* COMPARISON TABLE */}
      <div className="mt-20 space-y-10">
        <div className="text-center max-w-xl mx-auto">
          <h2 className="text-3xl font-display font-bold text-slate-900 dark:text-white">Compare cada detalhe.</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Visão técnica detalhada de todas as permissões e recursos disponíveis.</p>
        </div>

        <div className="bg-white dark:bg-surface-200 rounded-3xl border border-slate-200 dark:border-surface-400 shadow-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-surface-300/50">
                <th className="px-8 py-6 text-sm font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-surface-400">Funcionalidade</th>
                <th className="px-8 py-6 text-center text-sm font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 dark:border-surface-400">Starter</th>
                <th className="px-8 py-6 text-center text-sm font-bold text-green-500 uppercase tracking-widest border-b border-slate-200 dark:border-surface-400">Standard</th>
                <th className="px-8 py-6 text-center text-sm font-bold text-yellow-500 uppercase tracking-widest border-b border-slate-200 dark:border-surface-400">Pro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-surface-300/50">
              {COMPARISON_TABLE.map((section, idx) => (
                <React.Fragment key={idx}>
                  <tr className="bg-slate-100/50 dark:bg-surface-300/20">
                    <td colSpan={4} className="px-8 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                      {section.category}
                    </td>
                  </tr>
                  {section.features.map((feature, fIdx) => (
                    <tr key={fIdx} className="hover:bg-slate-50/50 dark:hover:bg-surface-300/10 transition-colors">
                      <td className="px-8 py-5 text-sm font-semibold text-slate-800 dark:text-slate-200">{feature.name}</td>
                      <td className="px-8 py-5 text-center text-sm">
                        {renderValue(feature.starter)}
                      </td>
                      <td className="px-8 py-5 text-center text-sm bg-green-500/5 dark:bg-green-500/5">
                        {renderValue(feature.standard)}
                      </td>
                      <td className="px-8 py-5 text-center text-sm bg-yellow-500/5 dark:bg-yellow-500/5">
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

      {/* FOOTER CTA */}
      <div className="bg-slate-900 rounded-3xl p-10 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/20 blur-[100px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-500/20 blur-[100px] translate-y-1/2 -translate-x-1/2" />
        
        <h2 className="text-3xl font-display font-bold text-white mb-4 relative z-10">Ainda com dúvidas?</h2>
        <p className="text-slate-400 mb-8 max-w-md mx-auto relative z-10">Nosso time está pronto para te ajudar a escolher o melhor caminho para sua banca.</p>
        <button className="px-10 py-4 bg-white text-slate-900 font-bold rounded-2xl hover:scale-105 transition-all relative z-10">
          Falar com suporte
        </button>
      </div>

    </div>
  )
}

const renderValue = (val: any) => {
  if (typeof val === 'boolean') {
    return val ? (
      <div className="flex justify-center text-green-500"><Check size={20} strokeWidth={3} /></div>
    ) : (
      <div className="flex justify-center text-red-500"><X size={20} strokeWidth={3} /></div>
    )
  }
  return <span className="font-semibold text-slate-600 dark:text-slate-400">{val}</span>
}

