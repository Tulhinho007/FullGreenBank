import { 
  Instagram, 
  Send, 
  MessageCircle, 
  ShieldCheck, 
  AlertTriangle, 
  AtSign
} from 'lucide-react'

export const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t border-surface-400 bg-surface-100/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          
          {/* Coluna 1: Institucional */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Suporte & Ajuda</h4>
            <ul className="space-y-2.5">
              <li><a href="#" className="text-slate-600 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 text-xs transition-colors">Central de Ajuda / FAQ</a></li>
              <li><a href="#" className="text-slate-600 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 text-xs transition-colors flex items-center gap-1.5">
                Status do Sistema <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              </a></li>
              <li><a href="#" className="text-slate-600 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 text-xs transition-colors">Reportar Bug / Feedback</a></li>
              <li><a href="#" className="text-slate-600 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 text-xs transition-colors">Guia da Plataforma</a></li>
            </ul>
          </div>

          {/* Coluna 2: Redes Sociais */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Comunidade</h4>
            <div className="flex flex-wrap gap-4">
              <a href="https://www.instagram.com/kamaelzinhoo/" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-surface-300 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-pink-500 dark:hover:text-pink-400 hover:bg-pink-500/10 transition-all border border-transparent hover:border-pink-500/20">
                <Instagram size={18} />
              </a>
              <a href="https://www.threads.com/?xmt=AQF0x2CFDo5k641Fl7nG-VSIVbtcbz1Nbh6baD6w7_u0n7E" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-surface-300 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-white hover:bg-black transition-all border border-transparent hover:border-white/20">
                <AtSign size={18} />
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-surface-300 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-sky-500 dark:hover:text-sky-400 hover:bg-sky-500/10 transition-all border border-transparent hover:border-sky-500/20">
                <Send size={18} />
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-surface-300 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-emerald-500/10 transition-all border border-transparent hover:border-emerald-500/20">
                <MessageCircle size={18} />
              </a>
            </div>
            <p className="text-[10px] text-slate-600 dark:text-slate-500 max-w-[200px]">Siga nossas redes para atualizações em tempo real e novos palpites.</p>
          </div>

          {/* Coluna 3: Legal */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Legal</h4>
            <ul className="space-y-2.5">
              <li><a href="#" className="text-slate-600 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 text-xs transition-colors">Termos de Uso</a></li>
              <li><a href="#" className="text-slate-600 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 text-xs transition-colors">Política de Privacidade</a></li>
              <li><a href="#" className="text-slate-600 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 text-xs transition-colors">Política de Cookies</a></li>
              <li><a href="#" className="text-slate-600 dark:text-slate-400 hover:text-yellow-600 dark:hover:text-yellow-400 text-xs transition-colors flex items-center gap-1.5">
                <ShieldCheck size={14} /> Jogo Responsável
              </a></li>
            </ul>
          </div>

          {/* Coluna 4: Aviso de Risco */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Aviso de Risco</h4>
            <div className="p-3 rounded-xl bg-orange-100 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/20 space-y-2">
              <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                <AlertTriangle size={14} />
                <span className="text-[10px] font-bold uppercase tracking-tighter">Atenção</span>
              </div>
              <p className="text-[10px] text-slate-700 dark:text-slate-400 leading-relaxed italic font-medium">
                Esportes e investimentos envolvem riscos significativos. Resultados passados não garantem ganhos futuros. Nunca utilize capital destinado a despesas essenciais.
              </p>
            </div>
            <div className="flex items-center gap-2 text-slate-500 font-bold text-xs">
              <span className="px-1.5 py-0.5 rounded border border-slate-600">18+</span>
              <span>Proibido para menores.</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-surface-400/50 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <div className="space-y-1">
            <p className="text-[10px] text-slate-500">
              © {currentYear} Full Green Bank. Todos os direitos reservados.
            </p>
            <p className="text-[9px] text-slate-600 italic">
              Este sistema é uma ferramenta de gestão e análise de desempenho.
            </p>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1.5 group cursor-help">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 border border-green-400 group-hover:shadow-[0_0_8px_rgba(34,197,94,1)] transition-all"></div>
              <span className="text-[10px] text-slate-400">Servidores Cloud</span>
            </div>
            <div className="flex items-center gap-1.5 group cursor-help">
              <ShieldCheck size={12} className="text-blue-500" />
              <span className="text-[10px] text-slate-400">Dados Criptografados</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
