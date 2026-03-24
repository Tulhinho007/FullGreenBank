import { useParams, Link, Navigate } from 'react-router-dom'
import { useState } from 'react'
import { SupportModal } from '../components/ui/SupportModal'
import { 
  ShieldCheck, 
  FileText, 
  Lock, 
  Cookie, 
  ArrowLeft,
  ChevronRight
} from 'lucide-react'

// ─── Conteúdo Legal ─────────────────────────────────────────────────────────

const LEGAL_CONTENT: Record<string, any> = {
  terms: {
    title: 'Termos de Uso',
    icon: <FileText className="text-blue-500" size={24} />,
    lastUpdated: '19 de Março de 2026',
    sections: [
      {
        title: '1. Objetivo',
        content: 'Estes Termos de Uso definem as regras e diretrizes para a utilização da plataforma Full Green Bank. Ao acessar ou utilizar qualquer parte do sistema, você concorda em cumprir estes termos.'
      },
      {
        title: '2. Aceitação',
        content: 'Ao acessar o sistema, o usuário declara ter lido, compreendido e aceitado todos os termos e condições aqui estabelecidos. Caso não concorde com qualquer parte destes termos, você não deve utilizar a plataforma.'
      },
      {
        title: '3. Capacidade',
        content: 'O uso desta plataforma é estritamente restrito a pessoas físicas maiores de 18 (dezoito) anos e legalmente capazes. Ao se cadastrar, você confirma que atende a este requisito de idade.'
      },
      {
        title: '4. Propriedade Intelectual',
        content: 'Todo o conteúdo do software, incluindo algoritmos, interface gráfica, logotipos, textos e códigos-fonte, pertence exclusivamente à plataforma Full Green Bank. É proibida qualquer reprodução ou uso não autorizado.'
      },
      {
        title: '5. Limitação de Responsabilidade',
        content: 'A plataforma Full Green Bank fornece ferramentas de gestão e análise de desempenho, mas não garante lucros ou resultados financeiros positivos. O mercado de apostas e esportes envolve riscos. O usuário é o único e exclusivo responsável por suas decisões, estratégias e todas as movimentações financeiras realizadas.'
      },
      {
        title: '6. Rescisão',
        content: 'Reservamo-nos o direito de suspender ou encerrar contas que violem estas regras, apresentem comportamento suspeito de fraude, segurança ou façam uso indevido de nossas APIs e infraestrutura.'
      }
    ]
  },
  privacy: {
    title: 'Política de Privacidade',
    icon: <Lock className="text-emerald-500" size={24} />,
    lastUpdated: '19 de Março de 2026',
    sections: [
      {
        title: '1. Objetivo',
        content: 'Esta política explica como tratamos e protegemos seus dados pessoais, em total conformidade com a Lei Geral de Proteção de Dados (LGPD).'
      },
      {
        title: '2. Coleta de Dados',
        content: 'Coletamos apenas as informações necessárias para o funcionamento do sistema: nome completo, endereço de e-mail e dados técnicos das transações realizadas para fins de cálculo de desempenho.'
      },
      {
        title: '3. Finalidade',
        content: 'Seus dados são utilizados exclusivamente para autenticação de acesso, garantia da segurança da sua conta, suporte técnico e para oferecer a melhor experiência analítica possível.'
      },
      {
        title: '4. Compartilhamento',
        content: 'Não vendemos nem alugamos seus dados a terceiros para fins de marketing. Suas informações podem ser compartilhadas apenas com processadores de pagamento e serviços essenciais de infraestrutura (como Supabase e Vercel) para garantir a operação do sistema.'
      },
      {
        title: '5. Segurança',
        content: 'Implementamos criptografia de ponta e as melhores práticas de segurança cibernética para proteger seu acesso e o sigilo de suas bancas e estratégias.'
      },
      {
        title: '6. Direitos do Usuário',
        content: 'Você possui total controle sobre seus dados. A qualquer momento, você pode solicitar a correção, portabilidade ou exclusão permanente de sua conta e todos os dados associados através de nossa central de suporte.'
      }
    ]
  },
  cookies: {
    title: 'Política de Cookies',
    icon: <Cookie className="text-amber-500" size={24} />,
    lastUpdated: '19 de Março de 2026',
    sections: [
      {
        title: '1. Objetivo',
        content: 'Informar ao usuário sobre o uso de rastreamento técnico necessário para a funcionalidade e segurança da interface.'
      },
      {
        title: '2. O que são Cookies',
        content: 'Cookies são pequenos arquivos de texto salvos no seu navegador para lembrar suas preferências e manter sua sessão ativa de forma segura.'
      },
      {
        title: '3. Cookies Essenciais',
        content: 'Utilizamos cookies estritamente necessários para manter você logado (tokens de sessão) e para garantir que suas preferências de tema (modo claro/escuro) sejam preservadas.'
      },
      {
        title: '4. Cookies de Desempenho',
        content: 'Utilizamos internamente ferramentas de monitoramento que nos ajudam a identificar erros técnicos e lentidões na interface, visando sempre a melhoria da velocidade de carregamento.'
      },
      {
        title: '5. Gestão de Cookies',
        content: 'Você pode optar por desativar ou apagar os cookies nas configurações do seu navegador. No entanto, esteja ciente de que sem os cookies essenciais, funções cruciais como o login e a persistência de dados na tela podem parar de funcionar.'
      }
    ]
  },
  'responsible-gaming': {
    title: 'Jogo Responsável',
    icon: <ShieldCheck className="text-rose-500" size={24} />,
    lastUpdated: '19 de Março de 2026',
    sections: [
      {
        title: '1. Objetivo',
        content: 'Promover um ambiente de gestão saudável, protegendo a integridade financeira e mental de nossos usuários.'
      },
      {
        title: '2. Princípio Fundamental',
        content: 'O Full Green Bank deve ser utilizado exclusivamente como uma ferramenta de gestão, análise e entretenimento. Nunca encare o mercado de apostas ou trading esportivo como sua fonte de renda principal ou garantida.'
      },
      {
        title: '3. Dicas de Segurança Financeira',
        content: '• Nunca utilize dinheiro destinado a despesas essenciais (aluguel, alimentação, saúde).\n• Estabeleça limites rígidos de perda diários e semanais ("Stop Loss").\n• Aceite as perdas como parte do processo e jamais tente recuperá-las impulsivamente sob efeito emocional ("Chasing Losses").\n• Defina um tempo limite para suas análises diárias.'
      },
      {
        title: '4. Autoexclusão e Pausa',
        content: 'Caso sinta que o jogo está afetando sua vida pessoal ou financeira, oferecemos a opção de autoexclusão. Você pode solicitar o bloqueio temporário ou permanente de sua conta através de nosso suporte.'
      }
    ]
  }
}

// ─── Componente Principal ───────────────────────────────────────────────────

export const LegalPage = () => {
  const { type } = useParams<{ type: string }>()
  const content = type ? LEGAL_CONTENT[type] : null
  const [showContact, setShowContact] = useState(false)

  if (!content) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Breadcrumb / Back */}
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
        <Link to="/dashboard" className="hover:text-emerald-600 transition-colors flex items-center gap-1">
          DASHBOARD
        </Link>
        <ChevronRight size={10} className="text-slate-300" />
        <span className="text-slate-300">INSTITUCIONAL</span>
        <ChevronRight size={10} className="text-slate-300" />
        <span className="text-slate-800">{content.title.toUpperCase()}</span>
      </div>

      {/* Header */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        <div className="flex items-start gap-6 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 shadow-inner group-hover:scale-110 transition-transform">
            {content.icon}
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">{content.title}</h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              Atualizado em: <span className="text-emerald-600">{content.lastUpdated}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="space-y-4">
        {content.sections.map((section: any, idx: number) => (
          <div 
            key={idx} 
            className="bg-white p-8 rounded-[2rem] border border-slate-50 hover:border-slate-100 hover:shadow-lg hover:shadow-slate-200/20 transition-all group"
          >
            <h2 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em] mb-4 flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50"></span>
              {section.title}
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed whitespace-pre-line font-medium opacity-80 group-hover:opacity-100 transition-opacity">
              {section.content}
            </p>
          </div>
        ))}
      </div>

      {/* Action Footer */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-10 rounded-[2.5rem] border border-slate-100 bg-white shadow-sm relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        <div className="text-center md:text-left space-y-1 relative z-10">
          <p className="text-lg font-black text-slate-800 tracking-tight">Dúvidas sobre nossas políticas?</p>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Entre em contato com o suporte especializado.</p>
        </div>
        <div className="flex gap-4 relative z-10">
          <Link to="/dashboard" className="flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all active:scale-95">
            <ArrowLeft size={14} /> Voltar
          </Link>
          <button 
            onClick={() => setShowContact(true)}
            className="flex items-center gap-2 px-8 py-3 rounded-xl bg-emerald-600 text-[10px] font-black uppercase tracking-widest text-white hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
          >
            Falar com Suporte
          </button>
        </div>
      </div>

      {/* Modal de Contato */}
      <SupportModal isOpen={showContact} onClose={() => setShowContact(false)} />

      {/* Disclaimer */}
      <p className="text-[10px] text-center text-slate-600 uppercase tracking-widest font-medium">
        © Full Green Bank · Segurança e Transparência
      </p>
    </div>
  )
}
