import { useState } from 'react';
import { Bug, MessageSquare, Send, Paperclip, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

export const ReportPage = () => {
  const [type, setType] = useState<'bug' | 'feedback'>('bug');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Média (Funcionalidade com erro)');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userStr = localStorage.getItem('fgb_user');
      const user = userStr ? JSON.parse(userStr) : null;

      await api.post('/support', {
        type,
        title,
        description,
        priority,
        userEmail: user?.email || 'Visitante Anônimo',
        userId: user?.id || null
      });

      setSubmitted(true);
      toast.success('Relatório enviado com sucesso!');
      
      // Limpar campos
      setTitle('');
      setDescription('');
      
      setTimeout(() => setSubmitted(false), 5000);
    } catch (error) {
      console.error('Erro ao enviar suporte:', error);
      toast.error('Erro ao enviar relatório. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Breadcrumb / Back */}
      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium pt-4">
        <Link to="/dashboard" className="hover:text-green-500 transition-colors flex items-center gap-1">
          Dashboard
        </Link>
        <ChevronRight size={12} className="opacity-30" />
        <span className="text-slate-400">Institucional</span>
        <ChevronRight size={12} className="opacity-30" />
        <span className="text-white">{type === 'bug' ? 'Reportar Bug' : 'Feedback'}</span>
      </div>

      <div className="max-w-2xl mx-auto px-4">
        
        {/* Header */}
        <div className="mb-8 text-center md:text-left">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white flex items-center gap-3 justify-center md:justify-start">
            {type === 'bug' ? <Bug className="text-red-500" /> : <MessageSquare className="text-blue-500" />}
            {type === 'bug' ? 'Reportar um Problema' : 'Enviar Feedback'}
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Sua contribuição ajuda o **Full Green Bank** a se tornar uma ferramenta cada vez melhor.
          </p>
        </div>

        {/* Seletor de Tipo */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <button
            type="button"
            onClick={() => setType('bug')}
            className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
              type === 'bug' 
              ? 'bg-red-50 dark:bg-red-900/10 border-red-500 text-red-600' 
              : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500'
            }`}
          >
            <Bug size={24} />
            <span className="font-bold text-sm">Algo não funciona</span>
          </button>
          
          <button
            type="button"
            onClick={() => setType('feedback')}
            className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
              type === 'feedback' 
              ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-500 text-blue-600' 
              : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500'
            }`}
          >
            <MessageSquare size={24} />
            <span className="font-bold text-sm">Tenho uma sugestão</span>
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <div className="space-y-6">
            
            {/* Título do Relato */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Título Curto
              </label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={type === 'bug' ? "Ex: Erro ao renovar contrato" : "Ex: Sugestão de novo gráfico"}
                className="w-full px-4 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-green-500 outline-none transition-all dark:text-white"
                required
              />
            </div>

            {/* Severidade (Apenas para Bugs) */}
            {type === 'bug' && (
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Urgência</label>
                <select 
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 dark:text-zinc-900 dark:bg-zinc-100 outline-none"
                >
                  <option>Baixa (Visual / Estético)</option>
                  <option>Média (Funcionalidade com erro)</option>
                  <option>Alta (Impossibilitado de usar o sistema)</option>
                  <option>Crítica (Envolve saldo ou pagamentos)</option>
                </select>
              </div>
            )}

            {/* Descrição Detalhada */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Descrição</label>
              <textarea 
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva com detalhes o que aconteceu ou sua ideia..."
                className="w-full px-4 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-green-500 outline-none transition-all dark:text-white"
                required
              ></textarea>
            </div>

            {/* Upload Mockup */}
            <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl p-6 text-center hover:border-green-500 transition-colors cursor-pointer group">
              <Paperclip className="mx-auto text-zinc-400 group-hover:text-green-500 mb-2" />
              <p className="text-xs text-zinc-500">Dica: Anexe imagens no Discord de Suporte para análise detalhada.</p>
            </div>

            {/* Botão Enviar */}
            <button 
              type="submit"
              disabled={loading || submitted}
              className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                submitted 
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30' 
                : 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20'
              } ${loading ? 'opacity-70 cursor-wait' : ''}`}
            >
              {loading ? (
                 <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : submitted ? (
                <><CheckCircle2 size={20} /> Recebido com sucesso!</>
              ) : (
                <><Send size={20} /> Enviar Relatório</>
              )}
            </button>
          </div>
        </form>

        {/* Nota de rodapé informativa */}
        <div className="mt-6 flex items-start gap-3 p-4 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg">
          <AlertCircle size={18} className="text-zinc-400 mt-0.5" />
          <p className="text-xs text-zinc-500 leading-relaxed">
            Seu e-mail e ID de usuário serão enviados automaticamente junto com este relato para facilitar a análise técnica da nossa equipe.
          </p>
        </div>

      </div>

      {/* Disclaimer */}
      <p className="text-[10px] text-center text-slate-600 uppercase tracking-widest font-medium mt-12">
        © Full Green Bank · Suporte e Melhoria Contínua
      </p>
    </div>
  );
}

