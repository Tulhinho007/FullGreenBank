import { 
  Instagram, 
  ShieldCheck, 
  AlertTriangle, 
  AtSign
} from 'lucide-react'
import { Link } from 'react-router-dom'

export const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="mt-16 border-t border-slate-100 bg-white transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          
          <div className="space-y-6">
            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Suporte & Ajuda</h4>
            <ul className="space-y-3 font-bold">
              <li><Link to="/faq" className="text-slate-500 hover:text-emerald-600 text-sm transition-colors">Central de Ajuda / FAQ</Link></li>
              <li><a href="#" className="text-slate-500 hover:text-emerald-600 text-sm transition-colors flex items-center gap-2">
                Status do Sistema <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
              </a></li>
              <li><Link to="/report" className="text-slate-500 hover:text-emerald-600 text-sm transition-colors">Reportar Bug / Feedback</Link></li>
              <li><Link to="/guide" className="text-slate-500 hover:text-emerald-600 text-sm transition-colors">Guia da Plataforma</Link></li>
            </ul>
          </div>

          {/* Coluna 2: Redes Sociais */}
          <div className="space-y-6">
            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Comunidade</h4>
            <div className="flex flex-wrap gap-6">
              <a href="https://www.instagram.com/kamaelzinhoo/" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-pink-500 transition-all transform hover:scale-110">
                <Instagram size={20} />
              </a>
              <a href="https://www.threads.com/?xmt=AQF0x2CFDo5k641Fl7nG-VSIVbtcbz1Nbh6baD6w7_u0n7E" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-800 transition-all transform hover:scale-110">
                <AtSign size={20} />
              </a>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-bold">Siga nossas redes para atualizações em tempo real e novos palpites.</p>
          </div>

          {/* Coluna 3: Legal */}
          <div className="space-y-6">
            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Legal</h4>
            <ul className="space-y-3 font-bold">
              <li><Link to="/legal/terms" className="text-slate-500 hover:text-emerald-600 text-sm transition-colors">Termos de Uso</Link></li>
              <li><Link to="/legal/privacy" className="text-slate-500 hover:text-emerald-600 text-sm transition-colors">Política de Privacidade</Link></li>
              <li><Link to="/legal/cookies" className="text-slate-500 hover:text-emerald-600 text-sm transition-colors">Política de Cookies</Link></li>
              <li><Link to="/legal/responsible-gaming" className="text-slate-500 hover:text-rose-600 text-sm transition-colors flex items-center gap-2">
                <ShieldCheck size={16} /> Jogo Responsável
              </Link></li>
            </ul>
          </div>

          {/* Coluna 4: Aviso de Risco */}
          <div className="space-y-6 font-bold">
            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Segurança</h4>
            <div className="p-4 rounded-2xl border-l-4 border-amber-500 bg-amber-50 space-y-3">
              <div className="flex items-center gap-2 text-amber-600">
                <AlertTriangle size={16} />
                <span className="text-[11px] font-black uppercase tracking-wider">Aviso de Risco</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed italic font-bold">
                Esportes e investimentos envolvem riscos significativos. Resultados passados não garantem ganhos futuros. Nunca utilize capital destinado a despesas essenciais.
              </p>
            </div>
            <div className="flex items-center gap-3 text-slate-400 font-black text-xs">
              <span className="px-2 py-0.5 rounded border border-slate-200">18+</span>
              <span>Proibido para menores.</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left font-bold">
          <div className="space-y-2">
            <p className="text-xs text-slate-400">
              © {currentYear} Full Green Bank. Todos os direitos reservados.
            </p>
            <p className="text-[10px] text-slate-300 italic">
              Este sistema é uma ferramenta de gestão e análise de desempenho.
            </p>
          </div>
          
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 group cursor-help text-emerald-600/60">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
              <span className="text-[10px] font-black uppercase tracking-widest">Servidores Cloud</span>
            </div>
            <div className="flex items-center gap-2 group cursor-help text-blue-600/60">
              <ShieldCheck size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">Dados Criptografados</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
