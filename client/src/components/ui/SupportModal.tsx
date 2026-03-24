import { MessageCircle } from 'lucide-react';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupportModal = ({ isOpen, onClose }: SupportModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-surface-200 border border-surface-400 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
            <MessageCircle className="text-green-500" size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Contato administrador</h3>
            <p className="text-xs text-slate-400 font-medium">Suporte Direto WhatsApp</p>
          </div>
        </div>
        
        <div className="bg-surface-300/50 rounded-xl p-4 border border-white/5 mb-6 text-center">
          <p className="text-green-400 font-mono font-bold text-xl tracking-tight">wpp: 81 995750402</p>
        </div>

        <p className="text-sm text-slate-300 text-center mb-6">
          Entre em contato com ele para tirar suas dúvidas ou resolver problemas.
        </p>

        <button 
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-surface-400 text-white font-bold text-sm hover:bg-surface-500 transition-colors"
        >
          Entendi
        </button>
      </div>
    </div>
  );
};
