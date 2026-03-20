import { useState } from 'react';
import { ChevronDown, HelpCircle, BookOpen, MessageCircle, ShieldCheck, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

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

        {/* Call to Action Final */}
        <div className="mt-12 text-center p-8 bg-green-600 rounded-2xl">
          <h3 className="text-white font-bold text-lg mb-2">Ainda tem dúvidas?</h3>
          <p className="text-green-50 mb-6">Nosso suporte técnico está disponível 24/7 para membros Pro.</p>
          <a href="mailto:suporte@fullgreenbank.com" className="bg-white text-green-600 px-8 py-3 rounded-xl font-bold hover:bg-zinc-100 transition-colors inline-block">
            Abrir Chamado
          </a>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-[10px] text-center text-slate-600 uppercase tracking-widest font-medium mt-12">
        © Full Green Bank · Suporte e Transparência
      </p>
    </div>
  );
}
