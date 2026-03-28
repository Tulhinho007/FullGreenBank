import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { 
  Target, Zap, ChevronRight, 
  BarChart3, Calculator, TrendingUp, Users 
} from 'lucide-react'

export const LandingPage = () => {
  const { user, loading } = useAuth()

  if (!loading && user) {
    return <Navigate to="/dashboard" replace />
  }

  const pillars = [
    {
      title: "Dashboard Operacional",
      subtitle: "Full Green Bank",
      desc: "Uma central de comando onde você visualiza em tempo real suas principais métricas de saúde financeira, como Lucro Acumulado, Win Rate e ROI.",
      image: "/lp/lp_dashboard_mockup_1774655777798.png",
      icon: <Target className="text-emerald-400" size={24} />,
      tags: ["Real-time", "Métricas", "ROI"]
    },
    {
      title: "Gestão de Performance",
      subtitle: "Relatórios de Precisão",
      desc: "O sistema processa seu histórico de dicas e estratégias, oferecendo análises profundas para identificar onde você está ganhando e onde precisa ajustar a rota.",
      image: "/lp/lp_analysis_mockup_1774655794228.png",
      icon: <BarChart3 className="text-blue-400" size={24} />,
      tags: ["Análise", "Estratégia", "Histórico"]
    },
    {
      title: "Ferramentas de Inteligência",
      subtitle: "Suporte Operacional",
      desc: "Calculadoras especializadas, estratégias de alavancagem e dicas de gestão emocional para que você nunca opere no escuro.",
      image: "/lp/lp_intelligence_mockup_1774655908787.png",
      icon: <Calculator className="text-yellow-400" size={24} />,
      tags: ["Calculadoras", "Alavancagem", "Mindset"]
    },
    {
      title: "Simulador de Consistência",
      subtitle: "Projeção de Longo Prazo",
      desc: "Ferramenta estratégica de juros compostos que permite projetar metas concretas, transformando sua banca através da disciplina diária.",
      image: "/lp/lp_simulador_mockup_1774655888520.png",
      icon: <TrendingUp className="text-emerald-500" size={24} />,
      tags: ["Juros Compostos", "Metas", "Planejamento"]
    },
    {
      title: "Curadoria de Conteúdo",
      subtitle: "Tips & Tipsters",
      desc: "Acesso a sinais e análises de especialistas, filtrados diretamente dentro da plataforma para facilitar a execução das suas entradas.",
      image: "/lp/lp_tips_mockup_1774655962772.png",
      icon: <Users className="text-purple-400" size={24} />,
      tags: ["Sinais", "Analistas", "Execução"]
    }
  ]

  return (
    <div className="min-h-screen bg-[#06080B] text-slate-300 font-sans selection:bg-[#00FF7F]/30 overflow-x-hidden">
      
      {/* --- NAVBAR --- */}
      <nav className="fixed top-0 left-0 w-full z-50 bg-[#06080B]/80 backdrop-blur-xl border-b border-white/5 shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 select-none">
            <div className="w-10 h-10 rounded-xl bg-[#0D1117] shadow-inner border border-white/5 flex items-center justify-center text-[#00FF7F]">
              <Target size={24} strokeWidth={2.5} />
            </div>
            <span className="font-display font-black text-xl tracking-tight text-white">
              FullGreen<span className="text-[#00FF7F]">Bank</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login" className="px-5 py-2.5 text-sm font-bold text-slate-400 hover:text-white transition-colors">Entrar</Link>
            <Link to="/register" className="px-6 py-2.5 rounded-xl bg-[#00FF7F] text-[#06080B] font-black text-xs shadow-[0_0_20px_rgba(0,255,127,0.3)] hover:shadow-[0_0_30px_rgba(0,255,127,0.5)] transition-all uppercase tracking-widest active:scale-95">Cadastre-se</Link>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-40 pb-20 md:pt-52 md:pb-32 px-6 flex flex-col items-center justify-center text-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-[#00FF7F]/5 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 text-[#00FF7F] text-[10px] font-black uppercase tracking-widest bg-[#0D1117] mb-8 relative z-10 shadow-xl">
          <Zap size={14} fill="currentColor" /> Inteligência & Gestão Profissional
        </div>

        <h1 className="text-5xl md:text-8xl font-display font-black text-white tracking-tighter max-w-5xl leading-[0.95] drop-shadow-2xl relative z-10">
          Transforme sua banca em um <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00FF7F] via-emerald-400 to-teal-500">ativo lucrativo</span>.
        </h1>
        
        <p className="mt-10 text-lg md:text-2xl text-slate-400 max-w-3xl font-medium tracking-tight relative z-10 leading-relaxed">
          O Full Green System é o ecossistema definitivo para transformar o apostador recreativo em um operador profissional com dados e precisão.
        </p>

        <div className="mt-14 flex flex-col sm:flex-row items-center gap-5 relative z-10 w-full sm:w-auto">
          <Link to="/register" className="w-full sm:w-auto px-12 py-5 rounded-2xl bg-[#00FF7F] text-[#06080B] font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 shadow-[0_10px_40px_rgba(0,255,127,0.25)] hover:shadow-[0_15px_50px_rgba(0,255,127,0.4)] hover:-translate-y-1 transition-all">
            Começar Agora <ChevronRight size={18} />
          </Link>
          <Link to="/planos" className="w-full sm:w-auto px-12 py-5 rounded-2xl bg-white/5 text-white border border-white/10 font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center backdrop-blur-md hover:bg-white/10 transition-all">
            Ver Planos
          </Link>
        </div>
      </section>

      {/* --- PILLARS SECTION --- */}
      <section className="py-24 px-6 md:px-12 bg-[#080B0F]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center text-center mb-24">
            <div className="w-16 h-1 bg-[#00FF7F] rounded-full mb-6" />
            <h2 className="text-4xl md:text-6xl font-display font-black text-white tracking-tighter">🛡️ Os Pilares do Sistema</h2>
            <p className="text-slate-500 mt-6 text-lg max-w-2xl font-medium">Arquitetura de alta performance desenhada para o mercado esportivo profissional.</p>
          </div>

          <div className="flex flex-col gap-32">
            {pillars.map((p, i) => (
              <div key={i} className={`flex flex-col ${i % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-12 lg:gap-24 group`}>
                {/* Text Side */}
                <div className="flex-1 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-[#0D1117] border border-white/5 shadow-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                      {p.icon}
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500">{p.subtitle}</h4>
                      <h3 className="text-3xl md:text-4xl font-display font-black text-white tracking-tight">{p.title}</h3>
                    </div>
                  </div>
                  <p className="text-lg text-slate-400 font-medium leading-relaxed">
                    {p.desc}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {p.tags.map(tag => (
                      <span key={tag} className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{tag}</span>
                    ))}
                  </div>
                </div>

                {/* Image Side */}
                <div className="flex-1 relative">
                  <div className="absolute -inset-4 bg-emerald-500/10 blur-[60px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                  <div className="relative rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl bg-[#0D1117]">
                    <img 
                      src={p.image} 
                      alt={p.title} 
                      className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-1000 ease-out" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#06080B]/40 to-transparent pointer-events-none" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- CTA BOTTOM --- */}
      <section className="py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[#00FF7F]/5 blur-[150px] rounded-full -translate-y-1/2" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-display font-black text-white tracking-tighter mb-8 leading-none">Pronto para subir de nível?</h2>
          <p className="text-xl text-slate-400 mb-12 font-medium">Junte-se a centenas de operadores que usam a inteligência de dados para bater o mercado.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <Link to="/register" className="px-12 py-5 rounded-2xl bg-[#00FF7F] text-[#06080B] font-black uppercase tracking-[0.2em] text-xs shadow-2xl hover:shadow-[#00FF7F]/40 transition-all active:scale-95">Criar Conta Grátis</Link>
            <a 
              href="https://api.whatsapp.com/send?phone=5581995750402&text=Bem+vindo+a+Full+Green+Bank%21+" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-12 py-5 rounded-2xl border border-white/10 text-white font-black uppercase tracking-[0.2em] text-xs hover:bg-white/5 transition-all text-center"
            >
              Tirar Dúvidas
            </a>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="border-t border-white/5 bg-[#06080B] py-16 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3 select-none">
              <Target size={24} className="text-[#00FF7F]" />
              <span className="font-display font-black text-xl tracking-tight text-white">FullGreen<span className="text-[#00FF7F]">Bank</span></span>
            </div>
            <p className="text-slate-500 text-sm max-w-xs font-medium">A plataforma definitiva para gestão de ativos esportivos e inteligência de dados.</p>
          </div>
          <div className="flex flex-col md:items-end gap-2">
            <div className="text-[10px] font-black tracking-[0.3em] uppercase text-slate-400">© {new Date().getFullYear()} FULL GREEN SYSTEM</div>
            <div className="flex gap-6 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
              <Link to="/legal/privacy" className="hover:text-emerald-500">Privacidade</Link>
              <Link to="/legal/terms" className="hover:text-emerald-500">Termos</Link>
              <Link to="/legal/cookies" className="hover:text-emerald-500">Cookies</Link>
            </div>
          </div>
        </div>
      </footer>

    </div>
  )
}
