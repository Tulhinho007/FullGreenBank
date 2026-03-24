import { useState } from 'react';
import { ChevronDown, HelpCircle, BookOpen, MessageCircle, ShieldCheck, ChevronRight, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SupportModal } from '../components/ui/SupportModal';

const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-zinc-200 dark:border-zinc-800 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-5 flex justify-between items-center text-left transition-all hover:bg-zinc-50 dark:hover:bg-zinc-900/50 px-4 rounded-lg"
      >
        <span className="font-medium text-zinc-900 dark:text-zinc-100">{question}</span>
        <ChevronDown 
          className={`text-zinc-500 transition-transform duration-300 ${isOpen ? 'rotate-180 text-green-500' : ''}`} 
          size={20} 
        />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[500px] pb-5 px-4' : 'max-h-0'}`}>
        <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
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
        <span className="text-white">FAQ</span>
      </div>

      <div className="max-w-3xl mx-auto px-4">
        
        {/* Header da Página */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs font-bold uppercase tracking-wider mb-4">
            <HelpCircle size={14} /> Central de Ajuda
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white mb-4">
            Como podemos ajudar você?
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Tire suas dúvidas sobre pagamentos, gestão de banca e segurança da plataforma.
          </p>
        </div>

        {/* Cards de Atalho Rápido */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {[
            { icon: <BookOpen />, title: "Guia", desc: "Primeiros passos" },
            { icon: <ShieldCheck />, title: "Segurança", desc: "Dados protegidos" },
            { icon: <MessageCircle />, title: "Suporte", desc: "Fale conosco" },
          ].map((card, i) => (
            <div key={i} className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-4 hover:shadow-lg transition-shadow cursor-pointer group">
              <div className="text-green-500 group-hover:scale-110 transition-transform">{card.icon}</div>
              <div>
                <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{card.title}</h4>
                <p className="text-xs text-zinc-500">{card.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Lista de FAQ */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden px-2">
          {faqs.map((faq, index) => (
            <FAQItem key={index} question={faq.question} answer={faq.answer} />
          ))}
        </div>

        {/* Action Footer */}
        <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-6 p-8 rounded-2xl border border-surface-400 bg-surface-200/50 shadow-lg">
          <div className="text-center md:text-left space-y-1">
            <p className="text-sm font-semibold text-white">Dúvidas sobre o nosso FAQ?</p>
            <p className="text-xs text-slate-500">Entre em contato com nosso suporte especializado.</p>
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
