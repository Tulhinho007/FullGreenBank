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
    <footer className="mt-16 border-t border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-[#0a0f14] transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          
          {/* Coluna 1: Institucional */}
          <div className="space-y-6">
            <h4 className="text-sm font-bold text-zinc-950 dark:text-white uppercase tracking-wider">Suporte & Ajuda</h4>
            <ul className="space-y-3">
              <li><Link to="/faq" className="text-zinc-600 dark:text-zinc-400 hover:text-green-600 dark:hover:text-green-400 text-sm transition-colors">Central de Ajuda / FAQ</Link></li>
              <li><a href="#" className="text-zinc-600 dark:text-zinc-400 hover:text-green-600 dark:hover:text-green-400 text-sm transition-colors flex items-center gap-2">
                Status do Sistema <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span>
              </a></li>
              <li><a href="#" className="text-zinc-600 dark:text-zinc-400 hover:text-green-600 dark:hover:text-green-400 text-sm transition-colors">Reportar Bug / Feedback</a></li>
              <li><a href="#" className="text-zinc-600 dark:text-zinc-400 hover:text-green-600 dark:hover:text-green-400 text-sm transition-colors">Guia da Plataforma</a></li>
            </ul>
          </div>

          {/* Coluna 2: Redes Sociais */}
          <div className="space-y-6">
            <h4 className="text-sm font-bold text-zinc-950 dark:text-white uppercase tracking-wider">Comunidade</h4>
            <div className="flex flex-wrap gap-6">
              <a href="https://www.instagram.com/kamaelzinhoo/" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-pink-500 transition-all transform hover:scale-110">
                <Instagram size={20} />
              </a>
              <a href="https://www.threads.com/?xmt=AQF0x2CFDo5k641Fl7nG-VSIVbtcbz1Nbh6baD6w7_u0n7E" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-zinc-950 dark:hover:text-white transition-all transform hover:scale-110">
                <AtSign size={20} />
              </a>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">Siga nossas redes para atualizações em tempo real e novos palpites.</p>
          </div>

          {/* Coluna 3: Legal */}
          <div className="space-y-6">
            <h4 className="text-sm font-bold text-zinc-950 dark:text-white uppercase tracking-wider">Legal</h4>
            <ul className="space-y-3">
              <li><Link to="/legal/terms" className="text-zinc-600 dark:text-zinc-400 hover:text-green-600 dark:hover:text-green-400 text-sm transition-colors">Termos de Uso</Link></li>
              <li><Link to="/legal/privacy" className="text-zinc-600 dark:text-zinc-400 hover:text-green-600 dark:hover:text-green-400 text-sm transition-colors">Política de Privacidade</Link></li>
              <li><Link to="/legal/cookies" className="text-zinc-600 dark:text-zinc-400 hover:text-green-600 dark:hover:text-green-400 text-sm transition-colors">Política de Cookies</Link></li>
              <li><Link to="/legal/responsible-gaming" className="text-zinc-600 dark:text-zinc-400 hover:text-yellow-600 dark:hover:text-yellow-400 text-sm transition-colors flex items-center gap-2">
                <ShieldCheck size={16} /> Jogo Responsável
              </Link></li>
            </ul>
          </div>

          {/* Coluna 4: Aviso de Risco */}
          <div className="space-y-6">
            <h4 className="text-sm font-bold text-zinc-950 dark:text-white uppercase tracking-wider">Segurança</h4>
            <div className="p-4 rounded-xl border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-500/5 space-y-3">
              <div className="flex items-center gap-2 text-orange-600">
                <AlertTriangle size={16} />
                <span className="text-[11px] font-bold uppercase tracking-wider">Aviso de Risco</span>
              </div>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed italic font-medium">
                Esportes e investimentos envolvem riscos significativos. Resultados passados não garantem ganhos futuros. Nunca utilize capital destinado a despesas essenciais.
              </p>
            </div>
            <div className="flex items-center gap-3 text-zinc-500 font-bold text-xs">
              <span className="px-2 py-0.5 rounded border border-zinc-300 dark:border-zinc-700">18+</span>
              <span>Proibido para menores.</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-zinc-200 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
          <div className="space-y-2">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              © {currentYear} Full Green Bank. Todos os direitos reservados.
            </p>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-500 italic">
              Este sistema é uma ferramenta de gestão e análise de desempenho.
            </p>
          </div>
          
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 group cursor-help">
              <div className="w-2 h-2 rounded-full bg-green-500 border border-green-400 group-hover:shadow-[0_0_8px_rgba(34,197,94,0.8)] transition-all"></div>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Servidores Cloud</span>
            </div>
            <div className="flex items-center gap-2 group cursor-help">
              <ShieldCheck size={14} className="text-blue-500" />
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Dados Criptografados</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
