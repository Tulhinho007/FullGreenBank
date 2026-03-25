import { MessageCircle } from 'lucide-react';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupportModal = ({ isOpen, onClose }: SupportModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-[6px] animate-in fade-in duration-300">
      <div className="bg-white border border-slate-200 w-full max-w-sm rounded-[2rem] p-8  animate-in zoom-in-95 duration-300">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
            <MessageCircle size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800 tracking-tight">Admin Direto</h3>
            <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest">Suporte WhatsApp</p>
          </div>
        </div>
        
        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 mb-8 text-center shadow-inner">
          <p className="text-emerald-600 font-mono font-bold text-2xl tracking-tighter">81 995750402</p>
          <p className="text-[10px] text-slate-400 mt-1 uppercase font-black tracking-widest">WhatsApp Business</p>
        </div>

        <p className="text-sm text-slate-500 font-bold text-center mb-8 leading-relaxed">
          Entre em contato para tirar suas dúvidas ou resolver problemas técnicos.
        </p>

        <button 
          onClick={onClose}
          className="w-full py-4 rounded-2xl bg-slate-800 text-white font-black uppercase tracking-widest text-xs hover:bg-slate-700 transition-all active:scale-95 shadow-lg shadow-slate-200"
        >
          Entendi
        </button>
      </div>
    </div>
  );
};
