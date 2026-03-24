import { 
  BookOpen, 
  LayoutDashboard, 
  TrendingUp, 
  ShieldCheck, 
  CreditCard, 
  Lightbulb, 
  ChevronRight,
  ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { SupportModal } from '../components/ui/SupportModal';

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
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 pt-6">
        <Link to="/dashboard" className="hover:text-emerald-600 transition-colors flex items-center gap-1">
          DASHBOARD
        </Link>
        <ChevronRight size={10} className="text-slate-300" />
        <span className="text-slate-300">INSTITUCIONAL</span>
        <ChevronRight size={10} className="text-slate-300" />
        <span className="text-slate-800">GUIA DA PLATAFORMA</span>
      </div>

      {/* Header */}
      <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full -mr-20 -mt-20 blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-6">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 shadow-inner">
              <BookOpen className="text-emerald-500" size={28} />
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">Guia da Plataforma</h1>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">Tudo o que você precisa saber para operar com maestria no Full Green Bank.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sections Grid */}
      <div className="grid grid-cols-1 gap-6">
        {sections.map((section) => (
          <div key={section.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 hover:border-emerald-100 transition-all group shadow-sm">
            <div className="flex items-start gap-5 mb-8">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 shadow-inner group-hover:bg-emerald-50/50 group-hover:border-emerald-100 transition-colors">
                {section.icon}
              </div>
              <div className="pt-1">
                <h2 className="text-xl font-black text-slate-800 tracking-tight mb-1">{section.title}</h2>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{section.description}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-0 md:ml-20">
              {section.items.map((item, idx) => (
                <div key={idx} className="p-5 rounded-2xl bg-slate-50/50 border border-slate-50 space-y-3 group/item hover:bg-white hover:border-slate-100 hover:shadow-lg hover:shadow-slate-200/20 transition-all">
                  <h4 className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.2em]">{item.label}</h4>
                  <p className="text-sm text-slate-500 leading-relaxed font-medium opacity-80 group-hover/item:opacity-100 transition-opacity">{item.content}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Dicas Importantíssimas */}
      <div className="bg-amber-50 p-10 rounded-[2.5rem] border border-amber-100 relative overflow-hidden group shadow-sm">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full -mr-16 -mt-16 blur-3xl animate-pulse"></div>
        <div className="flex items-center gap-4 mb-8 relative z-10">
          <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
            <Lightbulb size={24} />
          </div>
          <h2 className="text-2xl font-black text-amber-600 tracking-tight">Dicas de Sucesso</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
          <div className="space-y-2">
            <h4 className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Disciplina é Lucro</h4>
            <p className="text-sm font-medium text-amber-600/70 leading-relaxed">Nunca aposte mais do que o sugerido pela gestão de banca estratégica.</p>
          </div>
          <div className="space-y-2">
            <h4 className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Longo Prazo</h4>
            <p className="text-sm font-medium text-amber-600/70 leading-relaxed">Resultados em renda variável devem ser analisados mensalmente, evite a ansiedade diária.</p>
          </div>
          <div className="space-y-2">
            <h4 className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Suporte</h4>
            <p className="text-sm font-medium text-amber-600/70 leading-relaxed">Encontrou algo estranho? Use o link "Falar com Suporte" abaixo para ajuda imediata.</p>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-10 rounded-[2.5rem] border border-slate-100 bg-white shadow-sm relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        <div className="text-center md:text-left space-y-1 relative z-10">
          <p className="text-lg font-black text-slate-800 tracking-tight">Dúvidas sobre o nosso Guia?</p>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Nossa Central de Ajuda tem todas as respostas detalhadas.</p>
        </div>
        <div className="flex gap-4 relative z-10">
          <Link to="/dashboard" className="flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all active:scale-95">
            <ArrowLeft size={16} /> Voltar
          </Link>
          <button 
            onClick={() => setShowContact(true)}
            className="flex items-center gap-2 px-10 py-3 rounded-xl bg-emerald-600 text-[10px] font-black uppercase tracking-widest text-white hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
          >
            Falar com Suporte
          </button>
        </div>
      </div>

      {/* Modal de Contato */}
      <SupportModal isOpen={showContact} onClose={() => setShowContact(false)} />

      {/* Credits */}
      <p className="text-[10px] text-center text-slate-600 uppercase tracking-widest font-medium pb-12">
        © Full Green Bank · Sua Jornada Profissional Começa Aqui
      </p>
    </div>
  );
};
