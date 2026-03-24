import { useState, useRef } from 'react';
import { Bug, MessageSquare, Send, Paperclip, AlertCircle, CheckCircle2, ChevronRight, X, ArrowLeft, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SupportModal } from '../components/ui/SupportModal';
import api from '../services/api';
import toast from 'react-hot-toast';

export const ReportPage = () => {
  const [type, setType] = useState<'bug' | 'feedback'>('bug');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Média (Funcionalidade com erro)');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [activeTab, setActiveTab] = useState<'new' | 'my'>('new');
  const [myTickets, setMyTickets] = useState<any[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const fetchMyTickets = async () => {
    try {
      setLoadingTickets(true);
      const response = await api.get('/support/my-tickets');
      setMyTickets(response.data);
    } catch (error) {
      console.error('Erro ao buscar meus tickets:', error);
      toast.error('Erro ao carregar seu histórico');
    } finally {
      setLoadingTickets(false);
    }
  };

  const statusMap: any = {
    'OPEN': { label: 'Aberto', color: 'text-blue-500 bg-blue-500/10' },
    'IN_PROGRESS': { label: 'Em Análise', color: 'text-amber-500 bg-amber-500/10' },
    'RESOLVED': { label: 'Resolvido', color: 'text-green-500 bg-green-500/10' },
    'CLOSED': { label: 'Arquivado', color: 'text-zinc-500 bg-zinc-500/10' }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userStr = localStorage.getItem('fgb_user');
      const user = userStr ? JSON.parse(userStr) : null;

      // Nota: Em um sistema real, aqui você usaria FormData para enviar o arquivo
      await api.post('/support', {
        type,
        title,
        description,
        priority,
        userEmail: user?.email || 'Visitante Anônimo',
        userId: user?.id || null,
        fileName: selectedFile?.name || null // Simulando o envio do nome do arquivo
      });

      setSubmitted(true);
      toast.success('Relatório enviado com sucesso!');
      
      // Limpar campos
      setTitle('');
      setDescription('');
      setSelectedFile(null);
      
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
        
        {/* Tabs */}
        <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-xl mb-8 border border-zinc-200 dark:border-zinc-800">
          <button 
            onClick={() => setActiveTab('new')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'new' 
              ? 'bg-white dark:bg-zinc-700 text-green-600 shadow-sm' 
              : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            <Send size={16} /> Novo Relato
          </button>
          <button 
            onClick={() => { setActiveTab('my'); fetchMyTickets(); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'my' 
              ? 'bg-white dark:bg-zinc-700 text-green-600 shadow-sm' 
              : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            <Clock size={16} /> Meus Chamados
          </button>
        </div>

        {activeTab === 'new' ? (
          <>
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

            {/* Upload funcional */}
            <div 
              onClick={handleFileClick}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer group ${
                selectedFile ? 'border-green-500 bg-green-50 dark:bg-green-900/10' : 'border-zinc-200 dark:border-zinc-700 hover:border-green-500'
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*"
              />
              {selectedFile ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="flex items-center gap-2 text-green-600 font-medium">
                    <CheckCircle2 size={18} />
                    <span className="text-sm truncate max-w-[200px]">{selectedFile.name}</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                    className="p-1 hover:bg-red-100 text-red-500 rounded-full transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <>
                  <Paperclip className="mx-auto text-zinc-400 group-hover:text-green-500 mb-2" />
                  <p className="text-xs text-zinc-500">Clique para anexar um print ou arraste o arquivo aqui</p>
                </>
              )}
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

            <div className="mt-6 flex items-start gap-3 p-4 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg">
              <AlertCircle size={18} className="text-zinc-400 mt-0.5" />
              <p className="text-xs text-zinc-500 leading-relaxed">
                Seu e-mail e ID de usuário serão enviados automaticamente junto com este relato para facilitar a análise técnica da nossa equipe.
              </p>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            {loadingTickets ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-500 font-medium">Carregando seus chamados...</p>
              </div>
            ) : myTickets.length === 0 ? (
              <div className="card p-12 text-center bg-zinc-100 dark:bg-zinc-900 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                <AlertCircle className="mx-auto text-zinc-400 mb-4" size={48} />
                <p className="text-zinc-500 font-medium">Você ainda não enviou nenhum chamado.</p>
                <button 
                  onClick={() => setActiveTab('new')}
                  className="mt-4 text-sm font-bold text-green-600 hover:underline"
                >
                  Enviar meu primeiro relato
                </button>
              </div>
            ) : (
              myTickets.map((ticket) => (
                <div key={ticket.id} className="card p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm hover:border-green-500/50 transition-all">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border border-zinc-100 dark:border-zinc-800 ${ticket.type === 'bug' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                          {ticket.type === 'bug' ? <Bug size={20} /> : <MessageSquare size={20} />}
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">
                            Protocolo: {ticket.id.split('-')[0]}
                          </p>
                          <h3 className="text-lg font-bold text-zinc-900 dark:text-white line-clamp-1">{ticket.title}</h3>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusMap[ticket.status]?.color || 'bg-zinc-500/10 text-zinc-500'}`}>
                        {statusMap[ticket.status]?.label || ticket.status}
                      </span>
                    </div>

                    <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-100 dark:border-zinc-700/30">
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-sans">{ticket.description}</p>
                    </div>

                    {ticket.adminResponse && (
                      <div className="mt-2 p-5 rounded-2xl bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
                          <CheckCircle2 size={48} className="text-green-600" />
                        </div>
                        <div className="relative">
                          <p className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            Resposta da Equipe
                          </p>
                          <p className="text-sm text-zinc-800 dark:text-zinc-200 font-medium leading-relaxed">
                            {ticket.adminResponse}
                          </p>
                          {ticket.respondedAt && (
                            <p className="text-[10px] text-zinc-500 mt-4 font-medium italic">
                              Respondido em {new Date(ticket.respondedAt).toLocaleDateString()} às {new Date(ticket.respondedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Action Footer */}
        <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-6 p-8 rounded-2xl border border-surface-400 bg-surface-200/50 shadow-lg">
          <div className="text-center md:text-left space-y-1">
            <p className="text-sm font-semibold text-white">Dúvidas sobre o Reporte?</p>
            <p className="text-xs text-slate-500">Entre em contato com nosso suporte especializado.</p>
          </div>
          <div className="flex gap-3">
            <Link to="/dashboard" className="px-6 py-2.5 rounded-xl bg-surface-300 border border-white/5 text-white font-bold text-sm hover:bg-surface-400 transition-all flex items-center gap-2">
              <ArrowLeft size={16} /> Voltar
            </Link>
            <button 
              onClick={() => setShowContact(true)}
              className="px-8 py-2.5 rounded-xl bg-green-600 text-white font-bold text-sm hover:bg-green-700 transition-all shadow-lg shadow-green-600/20"
            >
              Falar com Suporte
            </button>
          </div>
        </div>

      </div>

      {/* Modal de Contato */}
      <SupportModal isOpen={showContact} onClose={() => setShowContact(false)} />

      {/* Disclaimer */}
      <p className="text-[10px] text-center text-slate-600 uppercase tracking-widest font-medium mt-12 pb-12">
        © Full Green Bank · Suporte e Melhoria Contínua
      </p>
    </div>
  );
};
