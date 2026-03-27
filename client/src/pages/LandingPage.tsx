import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ShieldCheck, Target, Zap, Activity, ChevronRight, BarChart3, Database } from 'lucide-react'

export const LandingPage = () => {
  const { user, loading } = useAuth()

  // Se o usuário já estiver logado (e a validação do token terminou), vai direto pro sistema.
  if (!loading && user) {
    return <Navigate to="/gestao/banca" replace />
  }

  return (
    <div className="min-h-screen bg-[#0D1016] text-slate-300 font-sans selection:bg-[#00FF7F]/30 overflow-x-hidden">
      
      {/* --- NAVBAR --- */}
      <nav className="fixed top-0 left-0 w-full z-50 bg-[#0D1016]/80 backdrop-blur-md border-b border-white/5 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          
          <div className="flex items-center gap-3 select-none">
            <div className="w-10 h-10 rounded-xl bg-[#151921] shadow-[inset_-2px_-2px_6px_rgba(255,255,255,0.02),_inset_2px_2px_6px_rgba(0,0,0,0.5)] border border-white/5 flex items-center justify-center text-[#00FF7F]">
              <Target size={24} strokeWidth={2.5} />
            </div>
            <span className="font-display font-black text-xl tracking-tight text-white drop-shadow-md">
              FullGreen<span className="text-[#00FF7F]">Bank</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link 
              to="/login"
              className="px-5 py-2.5 text-sm font-bold text-slate-300 hover:text-white transition-colors"
            >
              Entrar
            </Link>
            <Link 
              to="/register"
              className="px-6 py-2.5 rounded-xl bg-[#00FF7F] text-[#0D1016] font-bold text-sm shadow-[0_0_15px_rgba(0,255,127,0.3)] hover:shadow-[0_0_25px_rgba(0,255,127,0.5)] transition-all uppercase tracking-widest active:scale-95"
            >
              Cadastre-se
            </Link>
          </div>

        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-40 pb-20 md:pt-52 md:pb-32 px-6 flex flex-col items-center justify-center text-center overflow-hidden">
        {/* Glow Effects Ocultos (Efeitos visuais de background) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#00FF7F]/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-500/5 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-yellow-500/5 blur-[100px] rounded-full pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full shadow-[-4px_-4px_10px_rgba(255,255,255,0.02),_4px_4px_10px_rgba(0,0,0,0.5)] border border-white/5 text-[#00FF7F] text-[10px] sm:text-xs font-black uppercase tracking-widest bg-[#151921] mb-8 relative z-10">
          <Zap size={14} fill="currentColor" /> Sistema Profissional
        </div>

        <h1 className="text-5xl md:text-7xl font-display font-black text-white tracking-tighter max-w-4xl leading-tight drop-shadow-lg relative z-10">
          Sua gestão de apostas em um <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00FF7F] to-emerald-400 drop-shadow-[0_0_20px_rgba(0,255,127,0.3)]">nível profissional</span>.
        </h1>
        
        <p className="mt-8 text-lg md:text-xl text-slate-400 max-w-2xl font-medium tracking-wide relative z-10">
          Chega de planilhas complexas. Acompanhe a sua rentabilidade, analise estratégias e gerencie suas bancas com recursos de precisão absoluta.
        </p>

        <div className="mt-12 flex flex-col sm:flex-row items-center gap-5 relative z-10 w-full sm:w-auto">
          <Link 
            to="/register"
            className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-[#00FF7F] text-[#0D1016] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(0,255,127,0.3)] hover:shadow-[0_0_40px_rgba(0,255,127,0.5)] hover:-translate-y-1 transition-all"
          >
            Começar Agora <ChevronRight size={18} />
          </Link>
          <Link 
            to="/planos"
            className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-[#151921] text-white border border-white/5 font-bold flex items-center justify-center shadow-[-5px_-5px_15px_rgba(255,255,255,0.02),_5px_5px_15px_rgba(0,0,0,0.5)] hover:bg-[#1A1F29] transition-all"
          >
            Ver Planos
          </Link>
        </div>
      </section>

      {/* --- FEATURES GRID --- */}
      <section className="py-24 px-6 bg-[#0B0D12] relative z-20 border-t border-white/5 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
             <h2 className="text-3xl md:text-4xl font-display font-bold text-white tracking-tight">Ferramentas que mudam o seu jogo.</h2>
             <p className="text-slate-400 mt-3 tracking-wide">Construído por apostadores, para apostadores que exigem consistência.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            
            {/* Feature 1 */}
            <div className="p-8 rounded-3xl bg-[#151921] border border-white/5 shadow-[-8px_-8px_20px_rgba(255,255,255,0.01),_8px_8px_20px_rgba(0,0,0,0.7)] group hover:-translate-y-2 transition-transform duration-300">
              <div className="w-14 h-14 rounded-2xl bg-[#0D1016] shadow-[inset_-3px_-3px_8px_rgba(255,255,255,0.02),_inset_3px_3px_8px_rgba(0,0,0,0.6)] flex items-center justify-center mb-6 text-[#00FF7F] group-hover:scale-110 transition-transform">
                <Database size={24} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Gestão de Bancas</h3>
              <p className="text-sm text-slate-400 leading-relaxed font-medium">Controle infinito e multi-banca. Registre apostas, visualize saldo e monitore o crescimento com precisão matemática.</p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-3xl bg-[#151921] border border-white/5 shadow-[-8px_-8px_20px_rgba(255,255,255,0.01),_8px_8px_20px_rgba(0,0,0,0.7)] group hover:-translate-y-2 transition-transform duration-300">
              <div className="w-14 h-14 rounded-2xl bg-[#0D1016] shadow-[inset_-3px_-3px_8px_rgba(255,255,255,0.02),_inset_3px_3px_8px_rgba(0,0,0,0.6)] flex items-center justify-center mb-6 text-yellow-400 group-hover:scale-110 transition-transform">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Controle de Tipsters</h3>
              <p className="text-sm text-slate-400 leading-relaxed font-medium">Cadastre e monitore os analistas do mercado, registrando quem está entregando rentabilidade de verdade e quem está drenando seu lucro.</p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-3xl bg-[#151921] border border-white/5 shadow-[-8px_-8px_20px_rgba(255,255,255,0.01),_8px_8px_20px_rgba(0,0,0,0.7)] group hover:-translate-y-2 transition-transform duration-300">
              <div className="w-14 h-14 rounded-2xl bg-[#0D1016] shadow-[inset_-3px_-3px_8px_rgba(255,255,255,0.02),_inset_3px_3px_8px_rgba(0,0,0,0.6)] flex items-center justify-center mb-6 text-blue-400 group-hover:scale-110 transition-transform">
                <BarChart3 size={24} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Relatório de Estratégias</h3>
              <p className="text-sm text-slate-400 leading-relaxed font-medium">Filtre ROI e Win Rate avançados. Descubra quais esportes e mercados puxam seu resultado pra cima ou pra baixo.</p>
            </div>

            {/* Feature 4 */}
            <div className="p-8 rounded-3xl bg-[#151921] border border-white/5 shadow-[-8px_-8px_20px_rgba(255,255,255,0.01),_8px_8px_20px_rgba(0,0,0,0.7)] group hover:-translate-y-2 transition-transform duration-300 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#00FF7F]/10 blur-[30px] rounded-full" />
              <div className="w-14 h-14 rounded-2xl bg-[#0D1016] shadow-[inset_-3px_-3px_8px_rgba(255,255,255,0.02),_inset_3px_3px_8px_rgba(0,0,0,0.6)] flex items-center justify-center mb-6 text-emerald-400 group-hover:scale-110 transition-transform relative z-10">
                <Activity size={24} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3 relative z-10">Simulador de Consistência</h3>
              <p className="text-sm text-slate-400 leading-relaxed font-medium relative z-10">Projete seus juros compostos com um clique. Calcule a meta diária para alcançar seu pote de ouro no tempo exato.</p>
            </div>

          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="border-t border-white/5 bg-[#0D1016] py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 select-none opacity-50">
            <Target size={20} strokeWidth={2.5} className="text-[#00FF7F]" />
            <span className="font-display font-black tracking-tight text-white">FullGreen<span className="text-[#00FF7F]">Bank</span></span>
          </div>
          <div className="text-[11px] font-bold tracking-widest uppercase text-slate-600">
            &copy; {new Date().getFullYear()} - Soluções em Gestão para Investidores Esportivos
          </div>
        </div>
      </footer>

    </div>
  )
}
