import { useState, useRef, useEffect } from 'react'
import {
  Banknote, Search, CheckCircle2, XCircle, Clock, Loader2,
  Download, Plus, Edit2, Trash2, ChevronDown, FileText, FileSpreadsheet, Printer
} from 'lucide-react'
import { formatCurrency as fmt } from '../utils/formatters'
import toast from 'react-hot-toast'
import { NovoSaqueModal } from '../components/ui/NovoSaqueModal'

export interface Saque {
  id: string
  date: string
  userName: string
  grossValue: number
  comissionPercent: number
  netValue: number
  method: string
  status: 'CONCLUIDO' | 'PENDENTE' | 'PROCESSANDO' | 'REJEITADO'
  rejectionReason?: string
}

export const HistoricoSaquesPage = () => {
  const [saques, setSaques] = useState<Saque[]>([])
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('Todos')
  const [methodFilter, setMethodFilter] = useState('Todos')
  const [periodFilter, setPeriodFilter] = useState('Todos') // Todos, 7d, 30d, mesAtual

  // Exportação Dropdown
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Modal de Criação / Edição
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [saqueToEdit, setSaqueToEdit] = useState<Saque | null>(null)

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsExportMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getStatusConfig = (status: Saque['status']) => {
    switch (status) {
      case 'CONCLUIDO':
        return { color: 'bg-green-500/10 text-green-600 dark:text-green-500 border-green-500/20', icon: <CheckCircle2 size={12} />, label: 'Concluído' }
      case 'PENDENTE':
        return { color: 'bg-orange-500/10 text-orange-600 dark:text-orange-500 border-orange-500/20', icon: <Clock size={12} />, label: 'Pendente' }
      case 'PROCESSANDO':
        return { color: 'bg-blue-500/10 text-blue-600 dark:text-blue-500 border-blue-500/20', icon: <Loader2 size={12} className="animate-spin" />, label: 'Processando' }
      case 'REJEITADO':
        return { color: 'bg-red-500/10 text-red-600 dark:text-red-500 border-red-500/20', icon: <XCircle size={12} />, label: 'Rejeitado' }
    }
  }

  // Filtragem
  const filteredSaques = saques.filter(s => {
    const matchesSearch = s.userName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'Todos' || s.status.toLowerCase() === statusFilter.toLowerCase()
    const matchesMethod = methodFilter === 'Todos' || s.method.toLowerCase() === methodFilter.toLowerCase()
    
    let matchesPeriod = true
    if (periodFilter !== 'Todos') {
      const saqueDate = new Date(s.date)
      const now = new Date()
      const diffTime = Math.abs(now.getTime() - saqueDate.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (periodFilter === '7d' && diffDays > 7) matchesPeriod = false
      if (periodFilter === '30d' && diffDays > 30) matchesPeriod = false
      if (periodFilter === 'mesAtual') {
        if (saqueDate.getMonth() !== now.getMonth() || saqueDate.getFullYear() !== now.getFullYear()) {
          matchesPeriod = false
        }
      }
    }

    return matchesSearch && matchesStatus && matchesMethod && matchesPeriod
  })

  // Ações CRUD
  const handleSaveSaque = (saqueData: Omit<Saque, 'id'>) => {
    if (saqueToEdit) {
      setSaques(prev => prev.map(s => s.id === saqueToEdit.id ? { ...saqueData, id: s.id } : s))
      toast.success('Saque atualizado com sucesso!')
    } else {
      const novoSaque: Saque = {
        ...saqueData,
        id: `sq-${Math.random().toString(36).substring(2, 9)}`
      }
      setSaques([novoSaque, ...saques])
      toast.success('Novo saque registrado!')
    }
  }

  const handleDelete = (id: string) => {
    if(window.confirm('Tem certeza que deseja excluir permanentemente este saque?')) {
      setSaques(prev => prev.filter(s => s.id !== id))
      toast.success('Saque removido.')
    }
  }

  // Ações Exportação
  const handleExport = (type: string) => {
    toast.success(`Exportação para ${type} iniciada.`)
    setIsExportMenuOpen(false)
    if (type === 'Print') window.print()
  }

  return (
    <div className="flex flex-col gap-6 pb-10">
      
      {/* ─── Cabeçalho ─── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-slate-800 dark:text-white">Histórico de Saques</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Acompanhamento e auditoria de solicitações de retirada
          </p>
        </div>
        <div className="flex items-center gap-3 relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-surface-300 text-slate-700 dark:text-slate-200 font-semibold rounded-lg hover:bg-surface-400 transition-colors shadow-sm text-sm"
          >
            <Download size={16} />
            Exportar
            <ChevronDown size={14} className={`transition-transform ${isExportMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {isExportMenuOpen && (
            <div className="absolute top-full right-[130px] sm:right-auto sm:left-0 mt-2 w-48 bg-white dark:bg-surface-200 border border-slate-200 dark:border-surface-300 rounded-xl shadow-lg overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150 py-1">
              <button onClick={() => handleExport('Excel')} className="w-full px-4 py-2.5 flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-surface-300 transition-colors text-left">
                <FileSpreadsheet size={16} className="text-green-500" /> Excel (.xlsx)
              </button>
              <button onClick={() => handleExport('PDF')} className="w-full px-4 py-2.5 flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-surface-300 transition-colors text-left">
                <FileText size={16} className="text-red-500" /> Relatório PDF
              </button>
              <div className="h-px bg-slate-100 dark:bg-surface-300 my-1"></div>
              <button onClick={() => handleExport('Print')} className="w-full px-4 py-2.5 flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-surface-300 transition-colors text-left">
                <Printer size={16} className="text-slate-400" /> Imprimir Tabela
              </button>
            </div>
          )}

          <button 
            onClick={() => { setSaqueToEdit(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-5 py-2 bg-emerald-500 text-white font-bold rounded-lg hover:bg-emerald-600 transition-colors shadow-sm text-sm"
          >
            <Plus size={16} />
            Novo Saque
          </button>
        </div>
      </div>

      {/* ─── Barra de Filtros (Expandida) ─── */}
      <div className="flex flex-col xl:flex-row gap-3">
        <div className="relative flex-1 w-full min-w-[250px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por usuário..." 
            className="input-field pl-10 h-11 text-sm bg-white dark:bg-surface-200 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select 
            className="input-field h-11 text-sm bg-white dark:bg-surface-200"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="Todos">Status: Todos</option>
            <option value="PENDENTE">Pendente</option>
            <option value="PROCESSANDO">Processando</option>
            <option value="CONCLUIDO">Concluído</option>
            <option value="REJEITADO">Rejeitado</option>
          </select>

          <select 
            className="input-field h-11 text-sm bg-white dark:bg-surface-200"
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
          >
            <option value="Todos">Método: Todos</option>
            <option value="Pix">Pix</option>
            <option value="Transferência">Transferência</option>
            <option value="Outros">Outros</option>
          </select>

          <select 
            className="input-field h-11 text-sm bg-white dark:bg-surface-200"
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
          >
            <option value="Todos">Período: Qualquer</option>
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="mesAtual">Mês Atual</option>
          </select>
        </div>
      </div>

      {/* ─── Área da Tabela ─── */}
      <div className="card overflow-hidden bg-white dark:bg-surface-200 border border-slate-200 dark:border-surface-300">
        
        <div className="px-6 py-3 bg-blue-50 dark:bg-blue-500/5 border-b border-blue-100 dark:border-blue-500/10 flex items-start sm:items-center gap-2 text-xs sm:text-sm text-blue-800 dark:text-blue-300 leading-tight">
           <Banknote className="shrink-0 mt-0.5 sm:mt-0" size={16} />
           <p><strong>Dica de Auditoria:</strong> Saques originados de Bancas Gerenciadas podem apresentar até 10% de comissão deduzida do valor bruto solicitado.</p>
        </div>

        {/* Tabela Header (Adicionado 80px para AÇÕES) */}
        <div className="hidden lg:grid grid-cols-[140px_2.5fr_1fr_1fr_1fr_110px_130px_80px] gap-4 px-6 py-4 bg-slate-50 dark:bg-surface-300/30 border-b border-slate-100 dark:border-surface-300 text-[11px] font-bold text-slate-500 uppercase tracking-widest items-center">
          <span>Data e Hora</span>
          <span>Usuário</span>
          <span>Valor Bruto</span>
          <span>Comissão</span>
          <span>Valor Líquido</span>
          <span>Método</span>
          <span>Status</span>
          <span className="text-right">Ações</span>
        </div>

        {filteredSaques.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 bg-slate-50 dark:bg-surface-300/50 rounded-full flex items-center justify-center mb-4 border border-slate-200 dark:border-surface-300">
              <Banknote className="text-slate-300 dark:text-slate-500" size={24} />
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">Nenhum saque encontrado.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-surface-300">
            {filteredSaques.map(s => {
              const statusCfg = getStatusConfig(s.status)
              
              return (
                <div key={s.id} className="group grid grid-cols-1 lg:grid-cols-[140px_2.5fr_1fr_1fr_1fr_110px_130px_80px] gap-2 lg:gap-4 px-6 py-4 lg:py-4.5 text-sm items-start lg:items-center hover:bg-slate-50 dark:hover:bg-surface-300/20 transition-colors">
                  
                  {/* Data e Hora */}
                  <div className="flex flex-col">
                    <span className="text-slate-700 dark:text-slate-200 font-medium">
                      {new Date(s.date).toLocaleDateString('pt-BR')}
                    </span>
                    <span className="text-slate-400 text-xs">
                      {new Date(s.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Usuário */}
                  <div>
                    <span className="font-bold text-slate-700 dark:text-slate-200">{s.userName}</span>
                  </div>

                  {/* Valor Bruto */}
                  <div className="flex items-center">
                    <span className="font-semibold text-slate-600 dark:text-slate-300">{fmt(s.grossValue)}</span>
                  </div>

                  {/* Comissão */}
                  <div className="flex flex-col items-start justify-center">
                    {s.comissionPercent > 0 ? (
                      <>
                        <span className="text-xs font-bold text-pink-500 bg-pink-50 dark:bg-pink-500/10 px-1.5 py-0.5 rounded border border-pink-100 dark:border-pink-500/20">
                          -{s.comissionPercent}%
                        </span>
                        <span className="text-xs text-slate-400 mt-0.5 whitespace-nowrap">
                           Desconto: {fmt(s.grossValue * (s.comissionPercent/100))}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Isento</span>
                    )}
                  </div>

                  {/* Valor Líquido */}
                  <div className="flex flex-col items-start justify-center">
                     <span className="font-bold text-green-600 dark:text-green-500 text-[15px]">{fmt(s.netValue)}</span>
                  </div>

                  {/* Método */}
                  <div className="flex items-center text-slate-600 dark:text-slate-300 font-medium">
                    {s.method}
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] sm:text-xs font-bold px-2.5 py-1.5 rounded-md inline-flex items-center gap-1.5 border whitespace-nowrap ${statusCfg.color}`}>
                      {statusCfg.icon}
                      {statusCfg.label}
                    </span>
                  </div>

                  {/* Ações (Aparecem no hover na lg, fixo no mobile) */}
                  <div className="flex items-center justify-start lg:justify-end gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity mt-2 lg:mt-0">
                    <button 
                      onClick={() => { setSaqueToEdit(s); setIsModalOpen(true); }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 transition-colors"
                      title="Editar Saque"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(s.id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                      title="Excluir Saque"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Rejection Reason (If any) */}
                  {s.status === 'REJEITADO' && s.rejectionReason && (
                    <div className="lg:col-span-8 mt-2 p-3 bg-red-50 dark:bg-red-500/5 border border-red-100 dark:border-red-500/10 rounded-lg text-xs text-red-700 dark:text-red-400 flex items-start gap-2">
                      <XCircle size={14} className="shrink-0 mt-0.5" />
                      <div>
                        <strong>Motivo da Rejeição:</strong> {s.rejectionReason}
                      </div>
                    </div>
                  )}

                </div>
              )
            })}
          </div>
        )}
      </div>

      <NovoSaqueModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveSaque}
        initialData={saqueToEdit}
      />
    </div>
  )
}
