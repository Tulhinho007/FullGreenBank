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
    'OPEN': { label: 'Aberto', color: 'text-blue-600 bg-blue-50 border-blue-100' },
    'IN_PROGRESS': { label: 'Em Análise', color: 'text-amber-600 bg-amber-50 border-amber-100' },
    'RESOLVED': { label: 'Resolvido', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
    'CLOSED': { label: 'Arquivado', color: 'text-slate-400 bg-slate-50 border-slate-100' }
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
      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-black uppercase tracking-widest pt-4">
        <Link to="/dashboard" className="hover:text-emerald-500 transition-colors flex items-center gap-1">
          Dashboard
        </Link>
        <ChevronRight size={10} className="opacity-30" />
        <span className="text-slate-400">Institucional</span>
        <ChevronRight size={10} className="opacity-30" />
        <span className="text-slate-800">{type === 'bug' ? 'Reportar Bug' : 'Feedback'}</span>
      </div>

      <div className="max-w-2xl mx-auto px-4">
        
        {/* Tabs */}
        <div className="flex items-center gap-2 bg-slate-100/50 p-1.5 rounded-[2rem] mb-10 border border-slate-100 shadow-inner">
          <button 
            onClick={() => setActiveTab('new')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'new' 
              ? 'bg-white text-emerald-600 shadow-lg shadow-emerald-500/10 border border-emerald-50' 
              : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Send size={14} /> Novo Relato
          </button>
          <button 
            onClick={() => { setActiveTab('my'); fetchMyTickets(); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'my' 
              ? 'bg-white text-emerald-600 shadow-lg shadow-emerald-500/10 border border-emerald-50' 
              : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Clock size={14} /> Meus Chamados
          </button>
        </div>

        {activeTab === 'new' ? (
          <>
            {/* Header */}
            <div className="mb-10 text-center md:text-left">
              <h1 className="text-3xl font-black text-slate-800 flex items-center gap-4 justify-center md:justify-start tracking-tight">
                {type === 'bug' ? <Bug className="text-rose-500" size={32} /> : <MessageSquare className="text-sky-500" size={32} />}
                {type === 'bug' ? 'Reportar um Problema' : 'Enviar Feedback'}
              </h1>
              <p className="mt-2 text-slate-500 font-bold">
                Sua contribuição ajuda o <strong className="text-emerald-600">Full Green Bank</strong> a evoluir constantemente.
              </p>
            </div>

        {/* Seletor de Tipo */}
        <div className="grid grid-cols-2 gap-4 mb-10">
          <button
            type="button"
            onClick={() => setType('bug')}
            className={`p-6 rounded-[2rem] border flex flex-col items-center gap-3 transition-all ${
              type === 'bug' 
              ? 'bg-rose-50 border-rose-100 text-rose-600 shadow-lg shadow-rose-500/5' 
              : 'bg-white border-slate-100 text-slate-400 hover:border-rose-200'
            }`}
          >
            <Bug size={32} />
            <span className="font-black text-[11px] uppercase tracking-widest">Algo não funciona</span>
          </button>
          
          <button
            type="button"
            onClick={() => setType('feedback')}
            className={`p-6 rounded-[2rem] border flex flex-col items-center gap-3 transition-all ${
              type === 'feedback' 
              ? 'bg-sky-50 border-sky-100 text-sky-600 shadow-lg shadow-sky-500/5' 
              : 'bg-white border-slate-100 text-slate-400 hover:border-sky-200'
            }`}
          >
            <MessageSquare size={32} />
            <span className="font-black text-[11px] uppercase tracking-widest">Tenho uma sugestão</span>
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-sm">
          <div className="space-y-8">
            
            {/* Título do Relato */}
            <div>
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">
                Título Curto
              </label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={type === 'bug' ? "Ex: Erro ao renovar contrato" : "Ex: Sugestão de novo gráfico"}
                className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-slate-800 font-bold placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                required
              />
            </div>

            {/* Severidade (Apenas para Bugs) */}
            {type === 'bug' && (
              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Urgência</label>
                <select 
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-slate-800 font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer"
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
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Descrição</label>
              <textarea 
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva com detalhes o que aconteceu ou sua ideia..."
                className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-slate-800 font-bold placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none"
                required
              ></textarea>
            </div>

            {/* Upload funcional */}
            <div 
              onClick={handleFileClick}
              className={`border-2 border-dashed rounded-[2rem] p-10 text-center transition-all cursor-pointer group ${
                selectedFile ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-100 hover:border-emerald-500 hover:bg-slate-50'
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
                <div className="flex items-center justify-center gap-4">
                  <div className="flex items-center gap-3 text-emerald-600 font-black uppercase tracking-widest text-[11px]">
                    <CheckCircle2 size={20} />
                    <span className="truncate max-w-[200px]">{selectedFile.name}</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                    className="w-8 h-8 flex items-center justify-center bg-white border border-rose-100 text-rose-500 rounded-full shadow-sm hover:bg-rose-50 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-[1.5rem] bg-slate-50 flex items-center justify-center mx-auto mb-4 border border-slate-50 group-hover:bg-white group-hover:scale-110 transition-all">
                    <Paperclip className="text-slate-300 group-hover:text-emerald-500" />
                  </div>
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Clique para anexar um print ou arraste aqui</p>
                </>
              )}
            </div>

            {/* Botão Enviar */}
            <button 
              type="submit"
              disabled={loading || submitted}
              className={`w-full py-4.5 rounded-2xl font-black uppercase tracking-widest text-[12px] flex items-center justify-center gap-3 transition-all ${
                submitted 
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-xl shadow-emerald-500/10' 
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-500/20 active:scale-95'
              } ${loading ? 'opacity-70 cursor-wait' : ''}`}
            >
              {loading ? (
                 <span className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : submitted ? (
                <><CheckCircle2 size={24} /> Recebido com sucesso!</>
              ) : (
                <><Send size={24} /> Enviar Relatório</>
              )}
            </button>
          </div>
        </form>

            <div className="mt-8 flex items-start gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <AlertCircle size={20} className="text-slate-300 mt-0.5 shrink-0" />
              <p className="text-[11px] text-slate-400 font-bold leading-relaxed">
                Seu e-mail e ID de usuário serão enviados automaticamente junto com este relato para facilitar o suporte técnico.
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
              <div className="p-20 text-center bg-white border-2 border-dashed border-slate-100 rounded-[3rem] shadow-sm">
                <AlertCircle className="mx-auto text-slate-200 mb-6" size={64} />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[11px]">Você ainda não possui histórico de chamados.</p>
                <button 
                  onClick={() => setActiveTab('new')}
                  className="mt-6 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 hover:text-emerald-700 underline underline-offset-8"
                >
                  Criar meu primeiro relato
                </button>
              </div>
            ) : (
              myTickets.map((ticket) => (
                <div key={ticket.id} className="bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-sm hover:border-emerald-500/20 transition-all group">
                  <div className="flex flex-col gap-6">
                    <div className="flex items-start justify-between gap-6">
                      <div className="flex items-center gap-5">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${ticket.type === 'bug' ? 'bg-rose-50 border-rose-100 text-rose-500' : 'bg-sky-50 border-sky-100 text-sky-500'}`}>
                          {ticket.type === 'bug' ? <Bug size={28} /> : <MessageSquare size={28} />}
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none mb-2">
                            Protocolo: {ticket.id.split('-')[0]}
                          </p>
                          <h3 className="text-xl font-black text-slate-800 line-clamp-1 break-words">{ticket.title}</h3>
                        </div>
                      </div>
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border shrink-0 ${statusMap[ticket.status]?.color || 'bg-slate-50 text-slate-400'}`}>
                        {statusMap[ticket.status]?.label || ticket.status}
                      </span>
                    </div>

                    <div className="bg-slate-50/50 p-6 rounded-[1.5rem] border border-slate-50">
                      <p className="text-sm text-slate-600 font-bold leading-relaxed">{ticket.description}</p>
                    </div>

                    {ticket.adminResponse && (
                      <div className="mt-4 p-8 rounded-[2rem] bg-emerald-50/30 border border-emerald-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-125 transition-transform duration-500">
                          <CheckCircle2 size={64} className="text-emerald-600" />
                        </div>
                        <div className="relative">
                          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-4 flex items-center gap-2.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            RESPOSTA DA EQUIPE TÉCNICA
                          </p>
                          <p className="text-[15px] text-slate-800 font-bold leading-relaxed pr-12">
                            {ticket.adminResponse}
                          </p>
                          {ticket.respondedAt && (
                            <p className="text-[10px] text-slate-400 mt-6 font-black uppercase tracking-widest opacity-60">
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
        <div className="mt-16 flex flex-col md:flex-row items-center justify-between gap-8 p-10 rounded-[3rem] border border-slate-100 bg-white  shadow-slate-200/50">
          <div className="text-center md:text-left space-y-2">
            <p className="text-lg font-black text-slate-800 tracking-tight">Dúvidas sobre o Relato?</p>
            <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest">Entre em contato direto com nosso suporte.</p>
          </div>
          <div className="flex gap-4">
            <Link to="/dashboard" className="px-10 py-4.5 rounded-2xl bg-slate-50 border border-slate-100 text-slate-400 font-black uppercase tracking-widest text-[11px] hover:bg-slate-100 transition-all flex items-center gap-3 active:scale-95">
              <ArrowLeft size={18} /> Voltar
            </Link>
            <button 
              onClick={() => setShowContact(true)}
              className="px-12 py-4.5 rounded-2xl bg-emerald-600 text-white font-black uppercase tracking-widest text-[12px] hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-500/20 active:scale-95"
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
