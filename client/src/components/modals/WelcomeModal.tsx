import { ShieldCheck, Info, CheckCircle2 } from 'lucide-react'
import { Modal } from '../ui/Modal'

interface WelcomeModalProps {
  isOpen: boolean
  onConfirm: () => void
}

export const WelcomeModal = ({ isOpen, onConfirm }: WelcomeModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={() => {}} title="" showHeader={false} size="md">
      <div className="flex flex-col items-center text-center space-y-6">
        {/* Icon Animation */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-emerald-300 rounded-full opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 blur"></div>
          <div className="relative nm-icon w-20 h-20 flex items-center justify-center rounded-full bg-slate-50 text-emerald-600 transition-all transform hover:scale-110">
            <ShieldCheck size={40} className="animate-pulse" />
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">
            Bem-vindo ao <span className="text-emerald-600">Full Green Bank</span>!
          </h2>
          
          <div className="p-5 rounded-3xl bg-slate-50/80 border border-slate-100/50 space-y-4 text-left leading-relaxed">
            <div className="flex gap-3">
              <div className="text-emerald-500 mt-1 shrink-0"><Info size={18} /></div>
              <p className="text-sm text-slate-600 font-medium">
                Nosso objetivo é fornecer ferramentas de gestão e compartilhamento de análises. 
                Lembramos que os bilhetes registrados representam a <strong>estratégia pessoal do administrador</strong> e não constituem recomendação de investimento ou consultoria financeira.
              </p>
            </div>
            
            <div className="flex gap-3">
              <div className="text-amber-500 mt-1 shrink-0"><ShieldCheck size={18} /></div>
              <p className="text-sm text-slate-600 font-medium italic">
                Cada banca possui uma realidade única; gerencie seus riscos de acordo com o seu perfil e capital disponível.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onConfirm}
          className="w-full py-4 px-8 rounded-2xl bg-emerald-600 text-white font-black text-lg shadow-[0_10px_20px_rgba(16,185,129,0.3)] hover:bg-emerald-700 hover:shadow-[0_12px_24px_rgba(16,185,129,0.4)] transition-all active:scale-[0.98] flex items-center justify-center gap-3 group"
        >
          <CheckCircle2 size={24} className="group-hover:animate-bounce" />
          Li e Entendi os Termos
        </button>

        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest opacity-60">
          Gerencie seus riscos • Full Green Bank • 2026
        </p>
      </div>
    </Modal>
  )
}
