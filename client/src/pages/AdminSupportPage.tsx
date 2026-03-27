import { useState, useEffect } from 'react';
import { 
  Bug, 
  MessageSquare, 
  Clock, 
  AlertCircle, 
  Search, 
  Mail,
  Calendar,
  Trash2
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Ticket {
  id: string;
  type: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  userEmail: string | null;
  userId: string | null;
  createdAt: string;
  adminResponse?: string;
  respondedAt?: string;
}

export const AdminSupportPage = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('PENDING'); // Começa filtrando pendentes
  const [adminResponses, setAdminResponses] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await api.get('/support');
      setTickets(response.data);
    } catch (error) {
      console.error('Erro ao buscar tickets:', error);
      toast.error('Erro ao carregar tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const responseText = adminResponses[id];
      await api.patch(`/support/${id}/status`, { 
        status: newStatus,
        adminResponse: responseText 
      });
      toast.success(`Ticket atualizado!`);
      // Limpa a resposta local após enviar com sucesso
      setAdminResponses(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      fetchTickets();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar ticket');
    }
  };

  const handleDeleteTicket = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este chamado? Esta açao não pode ser desfeita.')) return;
    
    try {
      await api.delete(`/support/${id}`);
      toast.success('Ticket excluído com sucesso');
      fetchTickets();
    } catch (error) {
      console.error('Erro ao excluir ticket:', error);
      toast.error('Erro ao excluir ticket');
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         ticket.userEmail?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || ticket.type === filterType;
    const matchesStatus = filterStatus === 'all' 
      ? true 
      : ticket.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return <span className="px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-500 text-[10px] font-bold">PENDENTE</span>;
      case 'OPEN': return <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-bold">ABERTO</span>;
      case 'IN_PROGRESS': return <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-bold">EM ANDAMENTO</span>;
      case 'RESOLVED': return <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-[10px] font-bold">RESOLVIDO</span>;
      default: return null;
    }
  };

  const getPriorityColor = (priority: string) => {
    if (priority.toLowerCase().includes('crítica')) return 'text-red-500';
    if (priority.toLowerCase().includes('alta')) return 'text-orange-500';
    if (priority.toLowerCase().includes('média')) return 'text-amber-500';
    return 'text-blue-400';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Suporte & Feedback</h1>
          <p className="text-sm text-slate-400">Gerencie os relatos e sugestões enviadas pelos usuários.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={fetchTickets}
            className="p-2 rounded-lg bg-surface-200 border border-surface-400 text-slate-400 hover:text-white transition-colors"
          >
            <Clock size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text"
              placeholder="Buscar por título ou e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-surface-200 border border-surface-400 text-white outline-none focus:ring-2 focus:ring-green-500/50 transition-all font-sans text-sm"
            />
          </div>
          <div>
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-4 py-2 rounded-xl bg-surface-200 border border-surface-400 text-white outline-none focus:ring-2 focus:ring-green-500/50 transition-all font-sans text-sm"
            >
              <option value="all">Todos os Tipos</option>
              <option value="bug">Somente Bugs</option>
              <option value="feedback">Somente Feedbacks</option>
            </select>
          </div>
          <div>
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 rounded-xl bg-surface-200 border border-surface-400 text-white outline-none focus:ring-2 focus:ring-green-500/50 transition-all font-sans text-sm"
            >
              <option value="all">Todos os Status</option>
              <option value="PENDING">Pendentes</option>
              <option value="OPEN">Abertos</option>
              <option value="IN_PROGRESS">Em Andamento</option>
              <option value="RESOLVED">Resolvidos</option>
            </select>
          </div>
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'PENDING', label: 'Pendentes' },
            { id: 'OPEN', label: 'Abertos' },
            { id: 'IN_PROGRESS', label: 'Processar' },
            { id: 'RESOLVED', label: 'Resolvidos' },
            { id: 'all', label: 'Todos' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterStatus(f.id)}
              className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${
                filterStatus === f.id 
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-500/20' 
                  : 'bg-surface-200 border-surface-400 text-slate-400 hover:border-emerald-500/50 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tickets List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 font-medium">Carregando chamados...</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="card p-12 text-center bg-surface-100/40 border-dashed border-surface-400">
            <AlertCircle className="mx-auto text-slate-600 mb-4" size={48} />
            <p className="text-slate-400 font-medium">Nenhum chamado encontrado.</p>
          </div>
        ) : (
          filteredTickets.map((ticket) => (
            <div key={ticket.id} className="card p-6 bg-surface-100/40 border-surface-400 hover:bg-surface-100/60 transition-colors group">
              <div className="flex flex-col md:flex-row justify-between gap-6">
                
                <div className="space-y-4 flex-1">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border border-white/5 ${ticket.type === 'bug' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                      {ticket.type === 'bug' ? <Bug size={20} /> : <MessageSquare size={20} />}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        {ticket.title}
                        {getStatusBadge(ticket.status)}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><Mail size={12} /> {ticket.userEmail || 'Anônimo'}</span>
                        <span className="flex items-center gap-1"><Calendar size={12} /> {format(new Date(ticket.createdAt), "dd 'de' MMMM, HH:mm", { locale: ptBR })}</span>
                        <span className={`font-bold uppercase tracking-wider ${getPriorityColor(ticket.priority)}`}>PRIORIDADE: {ticket.priority}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-surface-200/50 rounded-xl p-4 border border-white/5 space-y-4">
                    <div>
                      <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                        {ticket.description}
                      </p>
                    </div>

                    {ticket.adminResponse && (
                      <div className="pt-4 border-t border-white/5">
                        <p className="text-[10px] font-bold text-green-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                          <MessageSquare size={12} /> Sua Resposta Anterior
                        </p>
                        <p className="text-sm text-slate-400 italic bg-surface-300/30 p-3 rounded-lg border border-white/5">
                          "{ticket.adminResponse}"
                        </p>
                        {ticket.respondedAt && (
                          <p className="text-[10px] text-slate-600 mt-1">
                            Respondido em {format(new Date(ticket.respondedAt), "dd/MM/yyyy HH:mm")}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Nova Resposta / Observação</label>
                    <textarea 
                      value={adminResponses[ticket.id] || ''}
                      onChange={(e) => setAdminResponses(prev => ({ ...prev, [ticket.id]: e.target.value }))}
                      placeholder="Digite aqui o que foi feito ou responda ao usuário..."
                      className="w-full h-24 p-4 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm outline-none focus:ring-2 focus:ring-green-500/50 transition-all font-sans resize-none placeholder:text-slate-400 shadow-sm"
                    />
                  </div>
                </div>

                <div className="flex flex-row md:flex-col gap-4 justify-between">
                  <div className="flex flex-wrap md:flex-col gap-2">
                    <button 
                      onClick={() => handleUpdateStatus(ticket.id, 'PENDING')}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${ticket.status === 'PENDING' ? 'bg-slate-600 text-white' : 'bg-surface-300 text-slate-400 hover:text-white'}`}
                    >
                      Pendente
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus(ticket.id, 'OPEN')}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${ticket.status === 'OPEN' ? 'bg-blue-600 text-white' : 'bg-surface-300 text-slate-400 hover:text-white'}`}
                    >
                      Aberto
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus(ticket.id, 'IN_PROGRESS')}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${ticket.status === 'IN_PROGRESS' ? 'bg-amber-500 text-white' : 'bg-surface-300 text-slate-400 hover:text-white'}`}
                    >
                      Processar
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus(ticket.id, 'RESOLVED')}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${ticket.status === 'RESOLVED' ? 'bg-green-600 text-white' : 'bg-surface-300 text-slate-400 hover:text-white'}`}
                    >
                      Resolvido
                    </button>
                  </div>

                  <button 
                    onClick={() => handleDeleteTicket(ticket.id)}
                    className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all self-end"
                    title="Excluir Chamado"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};
