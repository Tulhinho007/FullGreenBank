import { 
  BookOpen, 
  LayoutDashboard, 
  TrendingUp, 
  ShieldCheck, 
  CreditCard, 
  Lightbulb, 
  ChevronRight,
  ArrowLeft,
  MessageCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';

export const GuidePage = () => {
  const sections = [
    {
      id: 'dashboard',
      icon: <LayoutDashboard className="text-blue-500" size={24} />,
      title: '1. Início e Dashboard',
      description: 'Ao entrar no sistema, você terá uma visão geral da sua conta.',
      items: [
        { label: 'Acesso Direto', content: 'Aqui você acompanha o resumo das suas operações e o status da sua assinatura.' },
        { label: 'Navegação', content: 'Use o menu lateral para transitar entre a gestão de pagamentos, sinais e relatórios.' }
      ]
    },
    {
      id: 'signals',
      icon: <TrendingUp className="text-emerald-500" size={24} />,
      title: '2. Sinais e Sugestões de Entrada',
      description: 'O sistema é um hub de inteligência para suas apostas.',
      items: [
        { label: 'Sugestões do Sistema', content: 'Você pode visualizar entradas geradas automaticamente pelos nossos algoritmos.' },
        { label: 'Outros Tipsters', content: 'Além dos nossos sinais, você terá acesso a sugestões de especialistas parceiros.' },
        { label: 'Gestão de Stake', content: 'O sistema fornece a análise, mas o valor da stake (investimento) é definido exclusivamente por você. Nós fornecemos a informação, e você mantém o controle total sobre o seu capital.' }
      ]
    },
    {
      id: 'vip',
      icon: <ShieldCheck className="text-purple-500" size={24} />,
      title: '3. Serviço de Banca Gerenciada (VIP)',
      description: 'Este é o nosso serviço de elite para quem busca rentabilidade passiva.',
      items: [
        { label: 'Como funciona', content: 'Nossa tecnologia e especialistas operam o capital por você.' },
        { label: 'Seu papel', content: 'Você realiza apenas o investimento inicial através dos contratos.' },
        { label: 'Execução Profissional', content: 'O sistema cuida da estratégia e execução das ordens, eliminando o erro humano e o desgaste emocional. Você acompanha o lucro diretamente no seu painel.' }
      ]
    },
    {
      id: 'payments',
      icon: <CreditCard className="text-amber-500" size={24} />,
      title: '4. Gestão de Assinatura e Pagamentos',
      description: 'Mantenha sua conta sempre ativa para não perder as oportunidades.',
      items: [
        { label: 'Ciclo de 30 dias', content: 'Todas as assinaturas e acessos são válidos por um mês.' },
        { label: 'Status de Pagamento', content: 'No menu de pagamentos, você pode conferir se sua mensalidade está Paga ou Pendente.' },
        { label: 'Renovação', content: 'Assim que o status é atualizado para "Pago", o sistema calcula automaticamente mais 30 dias de acesso para você.' }
      ]
    }
  ];

  const [showContact, setShowContact] = useState(false);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Breadcrumb / Back */}
      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium pt-4">
        <Link to="/dashboard" className="hover:text-green-500 transition-colors flex items-center gap-1">
          Dashboard
        </Link>
        <ChevronRight size={12} className="opacity-30" />
        <span className="text-slate-400">Institucional</span>
        <ChevronRight size={12} className="opacity-30" />
        <span className="text-white">Guia da Plataforma</span>
      </div>

      {/* Header */}
      <div className="card p-8 bg-surface-200 border-surface-400 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-5">
            <div className="w-14 h-14 rounded-2xl bg-surface-300 flex items-center justify-center border border-white/5 shadow-inner">
              <BookOpen className="text-green-500" size={24} />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-white tracking-tight">Guia da Plataforma</h1>
              <p className="text-sm text-slate-400">Tudo o que você precisa saber para operar no Full Green Bank.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sections Grid */}
      <div className="grid grid-cols-1 gap-6">
        {sections.map((section) => (
          <div key={section.id} className="card p-6 bg-surface-100/40 border-surface-400 hover:bg-surface-100/60 transition-colors group">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 rounded-xl bg-surface-300 border border-white/5">
                {section.icon}
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{section.title}</h2>
                <p className="text-sm text-slate-400">{section.description}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-0 md:ml-16">
              {section.items.map((item, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-surface-200/50 border border-white/5 space-y-2">
                  <h4 className="text-xs font-bold text-green-500 uppercase tracking-wider">{item.label}</h4>
                  <p className="text-sm text-slate-300 leading-relaxed">{item.content}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Dicas Importantíssimas */}
      <div className="card p-8 bg-amber-500/5 border-amber-500/20">
        <div className="flex items-center gap-3 mb-6">
          <Lightbulb className="text-amber-400" size={24} />
          <h2 className="text-xl font-bold text-amber-200">Dicas Importantes</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-white">Disciplina é Lucro</h4>
            <p className="text-xs text-amber-200/60 leading-relaxed">Nunca aposte mais do que o sugerido pela gestão de banca.</p>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-white">Visão de Longo Prazo</h4>
            <p className="text-xs text-amber-200/60 leading-relaxed">Resultados em renda variável devem ser analisados mensalmente, não diariamente.</p>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-white">Suporte Técnico</h4>
            <p className="text-xs text-amber-200/60 leading-relaxed">Encontrou um erro? Use o link "Reportar Bug" no rodapé.</p>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-8 rounded-2xl border border-surface-400 bg-surface-200/50 shadow-lg">
        <div className="text-center md:text-left space-y-1">
          <p className="text-sm font-semibold text-white">Dúvidas sobre o nosso Guia?</p>
          <p className="text-xs text-slate-500">Nossa Central de Ajuda tem todas as respostas detalhadas.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/dashboard" className="px-6 py-2.5 rounded-xl bg-surface-300 border border-white/5 text-white font-bold text-sm hover:bg-surface-400 transition-all flex items-center gap-2">
            <ArrowLeft size={16} /> Voltar
          </Link>
          <button 
            onClick={() => setShowContact(true)}
            className="px-8 py-2.5 rounded-xl bg-green-600 text-white font-bold text-sm hover:bg-green-700 transition-all shadow-lg shadow-green-600/20"
          >
            Falar com Suporte
          </button>
        </div>
      </div>

      {/* Modal de Contato */}
      {showContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-surface-200 border border-surface-400 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
                <MessageCircle className="text-green-500" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Contato administrador</h3>
                <p className="text-xs text-slate-400 font-medium">Suporte Direto WhatsApp</p>
              </div>
            </div>
            
            <div className="bg-surface-300/50 rounded-xl p-4 border border-white/5 mb-6 text-center">
              <p className="text-green-400 font-mono font-bold text-xl tracking-tight">wpp: 81 995750402</p>
            </div>

            <p className="text-sm text-slate-300 text-center mb-6">
              Entre em contato com ele para tirar suas dúvidas ou resolver problemas.
            </p>

            <button 
              onClick={() => setShowContact(false)}
              className="w-full py-3 rounded-xl bg-surface-400 text-white font-bold text-sm hover:bg-surface-500 transition-colors"
            >
              Entendi
            </button>
          </div>
        </div>
      )}

      {/* Credits */}
      <p className="text-[10px] text-center text-slate-600 uppercase tracking-widest font-medium pb-12">
        © Full Green Bank · Sua Jornada Profissional Começa Aqui
      </p>
    </div>
  );
};
