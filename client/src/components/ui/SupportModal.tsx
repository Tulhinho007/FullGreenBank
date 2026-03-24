import { MessageCircle } from 'lucide-react';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupportModal = ({ isOpen, onClose }: SupportModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-surface-200 border border-slate-200 dark:border-surface-400 w-full max-w-sm rounded-[2rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500 border border-green-500/20">
            <MessageCircle className="text-green-500" size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Admin Direto</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Suporte WhatsApp</p>
          </div>
        </div>
        
        <div className="bg-slate-50 dark:bg-surface-300/50 rounded-2xl p-6 border border-slate-100 dark:border-white/5 mb-8 text-center shadow-inner">
          <p className="text-green-600 dark:text-green-400 font-mono font-bold text-2xl tracking-tight">81 995750402</p>
          <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-widest">WhatsApp Business</p>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300 text-center mb-8 leading-relaxed">
          Entre em contato para tirar suas dúvidas ou resolver problemas técnicos.
        </p>

        <button 
          onClick={onClose}
          className="w-full py-4 rounded-2xl bg-slate-900 dark:bg-surface-400 text-white font-bold text-sm hover:opacity-90 transition-all active:scale-95"
        >
          Entendi
        </button>
      </div>
    </div>
  );
};
