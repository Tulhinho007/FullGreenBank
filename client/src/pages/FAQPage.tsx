import { useState } from 'react';
import { ChevronDown, HelpCircle, BookOpen, MessageCircle, ShieldCheck, ChevronRight, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { SupportModal } from '../components/ui/SupportModal';

const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-slate-100 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-5 flex justify-between items-center text-left transition-all hover:bg-slate-50 px-4 rounded-xl"
      >
        <span className="font-bold text-slate-700">{question}</span>
        <ChevronDown 
          className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-emerald-500' : ''}`} 
          size={18} 
        />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[500px] pb-6 px-4' : 'max-h-0'}`}>
        <p className="text-slate-500 text-sm leading-relaxed font-medium">
          {answer}
        </p>
      </div>
    </div>
  );
};

export const FAQPage = () => {
  const faqs = [
    {
      question: "Como funciona o ciclo de renovação da minha assinatura?",
      answer: "Nossas assinaturas são mensais (30 dias). Assim que o pagamento é confirmado, o sistema calcula automaticamente a data de vencimento. Caso não haja renovação após esse período, seu status retornará para 'Pendente' e o acesso aos recursos Pro será limitado."
    },
    {
      question: "Quais métodos de pagamento são aceitos?",
      answer: "Atualmente aceitamos PIX (com liberação imediata), Cartão de Crédito e Boleto Bancário. Para pagamentos via PIX, o status 'Pago' é atualizado em tempo real no seu dashboard de faturamento."
    },
    {
      question: "Como funciona o serviço de Banca Gerenciada do Full Green Bank?",
      answer: "Na Banca Gerenciada, você não precisa se preocupar com análises ou execuções. Nosso sistema opera seu capital de forma automatizada e profissional. Você realiza o investimento e nós cuidamos da estratégia, gestão de risco e execução das ordens. É a solução ideal para quem busca rentabilidade no mercado esportivo com a segurança de uma gestão técnica e sem a necessidade de operar manualmente."
    },
    {
      question: "Meus dados financeiros e de apostas estão seguros?",
      answer: "Sim. Utilizamos criptografia de ponta a ponta e servidores Cloud de alta segurança. Seus dados de gestão e estratégias são privados e protegidos por protocolos rigorosos de conformidade digital."
    }
  ];

  const [showContact, setShowContact] = useState(false);
  const navigate = useNavigate();

  const handleCardClick = (title: string) => {
    switch (title) {
      case "Guia":
        navigate('/guide');
        break;
      case "Segurança":
        navigate('/legal/privacy');
        break;
      case "Suporte":
        setShowContact(true);
        break;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Breadcrumb / Back */}
      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-black uppercase tracking-widest pt-4">
        <Link to="/dashboard" className="hover:text-emerald-600 transition-colors flex items-center gap-1">
          Dashboard
        </Link>
        <ChevronRight size={10} className="opacity-30" />
        <span>Institucional</span>
        <ChevronRight size={10} className="opacity-30" />
        <span className="text-slate-800">Perguntas Frequentes</span>
      </div>

      <div className="max-w-3xl mx-auto px-4">
        
        {/* Header da Página */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-[0.2em] mb-6 border border-emerald-100">
            <HelpCircle size={14} /> Central de Ajuda
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-black text-slate-800 mb-6 tracking-tight">
            Como podemos ajudar?
          </h1>
          <p className="text-slate-500 font-medium">
            Tire suas dúvidas sobre pagamentos, gestão de banca e segurança da plataforma.
          </p>
        </div>

        {/* Cards de Atalho Rápido */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {[
            { icon: <BookOpen />, title: "Guia", desc: "Primeiros passos", color: "text-blue-500", bg: "bg-blue-50" },
            { icon: <ShieldCheck />, title: "Segurança", desc: "Dados protegidos", color: "text-emerald-500", bg: "bg-emerald-50" },
            { icon: <MessageCircle />, title: "Suporte", desc: "Fale conosco", color: "text-amber-500", bg: "bg-amber-50" },
          ].map((card, i) => (
            <div 
              key={i} 
              onClick={() => handleCardClick(card.title)}
              className="bg-white p-6 rounded-[2rem] border border-slate-100 flex items-center gap-5 hover:shadow-xl transition-all transform hover:-translate-y-2 cursor-pointer group"
            >
              <div className={`${card.color} ${card.bg} p-4 rounded-2xl group-hover:scale-110 transition-transform`}>{card.icon}</div>
              <div>
                <h4 className="font-black text-[11px] text-slate-800 uppercase tracking-widest leading-none mb-1">{card.title}</h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{card.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Lista de FAQ */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden px-4 py-2">
          {faqs.map((faq, index) => (
            <FAQItem key={index} question={faq.question} answer={faq.answer} />
          ))}
        </div>

        {/* Action Footer */}
        <div className="mt-16 flex flex-col md:flex-row items-center justify-between gap-8 p-10 rounded-[3rem] border border-emerald-100 bg-emerald-50/50 shadow-xl shadow-emerald-500/5">
          <div className="text-center md:text-left space-y-2">
            <p className="text-sm font-black text-slate-800 uppercase tracking-widest">Ainda tem dúvidas?</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Entre em contato com nosso suporte especializado.</p>
          </div>
          <div className="flex gap-4">
            <Link to="/dashboard" className="px-8 py-3 rounded-2xl bg-white border border-slate-100 text-slate-500 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm">
              <ArrowLeft size={16} /> Voltar
            </Link>
            <button 
              onClick={() => setShowContact(true)}
              className="px-10 py-3 rounded-2xl bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
            >
              Falar com Suporte
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Contato */}
      <SupportModal isOpen={showContact} onClose={() => setShowContact(false)} />

      {/* Disclaimer */}
      <p className="text-[10px] text-center text-slate-600 uppercase tracking-widest font-medium mt-12 pb-12">
        © Full Green Bank · Suporte e Transparência
      </p>
    </div>
  );
};
