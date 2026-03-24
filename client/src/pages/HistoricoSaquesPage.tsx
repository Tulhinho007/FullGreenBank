import { useState, useRef, useEffect } from 'react'
import {
  Banknote, Search, CheckCircle2, XCircle, Clock, Loader2,
  Download, Plus, Edit2, Trash2, ChevronDown, FileText, FileSpreadsheet, Printer
} from 'lucide-react'
import { formatCurrency as fmt } from '../utils/formatters'
import toast from 'react-hot-toast'
import { NovoSaqueModal } from '../components/ui/NovoSaqueModal'
import { saquesService } from '../services/saques.service'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export interface Saque {
  id: string
  userId: string
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
  const [isLoading, setIsLoading] = useState(true)

  const loadSaques = async () => {
    try {
      setIsLoading(true)
      const data = await saquesService.getAll()
      setSaques(data)
    } catch (e) {
      toast.error('Erro ao carregar o histórico de saques.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadSaques()
  }, [])

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
        return { color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: <CheckCircle2 size={12} />, label: 'Concluído' }
      case 'PENDENTE':
        return { color: 'bg-amber-50 text-amber-600 border-amber-100', icon: <Clock size={12} />, label: 'Pendente' }
      case 'PROCESSANDO':
        return { color: 'bg-blue-50 text-blue-600 border-blue-100', icon: <Loader2 size={12} className="animate-spin" />, label: 'Processando' }
      case 'REJEITADO':
        return { color: 'bg-rose-50 text-rose-600 border-rose-100', icon: <XCircle size={12} />, label: 'Rejeitado' }
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
  const handleSaveSaque = async (saqueData: any) => {
    try {
      if (saqueToEdit) {
        // Atualiza na API
        const updated = await saquesService.update(saqueToEdit.id, saqueData)
        setSaques(prev => prev.map(s => s.id === saqueToEdit.id ? updated : s))
        toast.success('Saque atualizado com sucesso!')
      } else {
        // Cria na API
        const novoSaque = await saquesService.create(saqueData)
        setSaques([novoSaque, ...saques])
        toast.success('Novo saque registrado!')
      }
    } catch (e) {
      toast.error('Erro ao processar saque.')
    }
  }

  const handleDelete = async (id: string) => {
    if(window.confirm('Tem certeza que deseja excluir permanentemente este saque?')) {
      try {
        await saquesService.delete(id)
        setSaques(prev => prev.filter(s => s.id !== id))
        toast.success('Saque removido.')
      } catch (e) {
        toast.error('Erro ao remover saque.')
      }
    }
  }

  // Ações Exportação
  const handleExport = (type: string) => {
    setIsExportMenuOpen(false)

    if (filteredSaques.length === 0) {
      toast.error('Nenhum dado para exportar, use filtros diferentes.')
      return
    }

    try {
      if (type === 'Excel') {
        const ws = XLSX.utils.json_to_sheet(filteredSaques.map(s => ({
          "Data e Hora": new Date(s.date).toLocaleString('pt-BR'),
          "Usuário": s.userName,
          "Valor Bruto": s.grossValue,
          "Comissão %": s.comissionPercent,
          "Valor Líquido": s.netValue,
          "Método": s.method,
          "Status": s.status,
          "Motivo": s.rejectionReason || '-'
        })))
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Saques")
        XLSX.writeFile(wb, "historico_saques.xlsx")
        toast.success('Planilha exportada com sucesso!')
      } else if (type === 'PDF') {
        const doc = new jsPDF()
        doc.text("Histórico de Saques", 14, 15)
        
        autoTable(doc, {
          startY: 20,
          head: [['Data', 'Usuário', 'V. Bruto', 'Comissão', 'V. Líquido', 'Método', 'Status']],
          body: filteredSaques.map(s => [
            new Date(s.date).toLocaleDateString('pt-BR'),
            s.userName,
            s.grossValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
            `${s.comissionPercent}%`,
            s.netValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
            s.method,
            s.status
          ]),
          styles: { fontSize: 8 }
        })
        
        doc.save("historico_saques.pdf")
        toast.success('PDF do relatório gerado com sucesso!')
      } else if (type === 'Print') {
        window.print()
      }
    } catch (e) {
      toast.error('Ocorreu um erro ao gerar o relatório.')
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-10">
      
      {/* ─── Cabeçalho ─── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Histórico de Saques</h2>
          <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest mt-1">
            Acompanhamento e auditoria de solicitações de retirada
          </p>
        </div>
        <div className="flex items-center gap-3 relative print:hidden" ref={dropdownRef}>
          <button 
            onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-400 font-black uppercase tracking-widest text-[11px] rounded-xl hover:bg-slate-200 transition-all active:scale-95"
          >
            <Download size={14} />
            Exportar
            <ChevronDown size={12} className={`transition-transform ${isExportMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {isExportMenuOpen && (
            <div className="absolute top-full right-0 mt-3 w-56 bg-white border border-slate-100 rounded-[1.5rem] shadow-2xl shadow-slate-200/50 overflow-hidden z-50 py-2 animate-in fade-in slide-in-from-top-4 duration-300">
              <button onClick={() => handleExport('Excel')} className="w-full px-5 py-3.5 flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 transition-colors text-left">
                <FileSpreadsheet size={16} className="text-emerald-500" /> Excel (.xlsx)
              </button>
              <button onClick={() => handleExport('PDF')} className="w-full px-5 py-3.5 flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors text-left">
                <FileText size={16} className="text-rose-500" /> Relatório PDF
              </button>
              <div className="h-px bg-slate-50 mx-2 my-1"></div>
              <button onClick={() => handleExport('Print')} className="w-full px-5 py-3.5 flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-colors text-left">
                <Printer size={16} className="text-slate-400" /> Imprimir Tabela
              </button>
            </div>
          )}

          <button 
            onClick={() => { setSaqueToEdit(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white font-black uppercase tracking-widest text-[11px] rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
          >
            <Plus size={16} />
            Novo Saque
          </button>
        </div>
      </div>

      {/* ─── Barra de Filtros (Expandida) ─── */}
      <div className="flex flex-col xl:flex-row gap-3 print:hidden">
        <div className="relative flex-1 w-full min-w-[250px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por usuário..." 
            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-300 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-sans"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select 
            className="bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-4 text-sm text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer"
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
            className="bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-4 text-sm text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer"
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
          >
            <option value="Todos">Método: Todos</option>
            <option value="Pix">Pix</option>
            <option value="Transferência Bancária (TED/DOC)">Transferência Bancária (TED/DOC)</option>
            <option value="Boleto Bancário">Boleto Bancário</option>
            <option value="PayPal">PayPal</option>
            <option value="Cartão de Credito (Visa/Mastercard)">Cartão de Credito (Visa/Mastercard)</option>
            <option value="Criptomoedas (Stablecoins e Ativos)">Criptomoedas (Stablecoins e Ativos)</option>
            <option value="PicPay">PicPay</option>
            <option value="Outros">Outros</option>
          </select>

          <select 
            className="bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-4 text-sm text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer"
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
      <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm print:border-none print:shadow-none">
        
        <div className="px-8 py-4 bg-sky-50 border-b border-sky-100 flex items-start sm:items-center gap-3 text-[11px] sm:text-[12px] text-sky-700 leading-tight print:hidden font-bold">
           <Banknote className="shrink-0 mt-0.5 sm:mt-0 text-sky-500" size={18} />
           <p className="uppercase tracking-widest leading-relaxed"><strong>Auditoria:</strong> Saques de Bancas Gerenciadas podem deduzir até 10% de comissão do valor bruto.</p>
        </div>

        {/* Tabela Header */}
        <div className="hidden lg:grid grid-cols-[140px_2.5fr_1fr_1fr_1fr_110px_130px_80px] gap-4 px-8 py-5 bg-slate-50/50 border-b border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest items-center">
          <span>Data e Hora</span>
          <span>Usuário</span>
          <span>Valor Bruto</span>
          <span>Comissão</span>
          <span>Valor Líquido</span>
          <span>Método</span>
          <span>Status</span>
          <span className="text-right print:hidden">Ações</span>
        </div>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Loader2 size={40} className="text-green-500 animate-spin mb-4" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Carregando Saques...</h3>
          </div>
        ) : filteredSaques.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center print:hidden">
            <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6 border border-slate-50">
              <Banknote className="text-slate-200" size={32} />
            </div>
            <p className="text-slate-400 text-[11px] font-black uppercase tracking-widest">Nenhum registro encontrado.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filteredSaques.map(s => {
              const statusCfg = getStatusConfig(s.status)
              
              return (
                <div key={s.id} className="group grid grid-cols-1 lg:grid-cols-[140px_2.5fr_1fr_1fr_1fr_110px_130px_80px] gap-2 lg:gap-4 px-8 py-6 items-start lg:items-center hover:bg-slate-50/50 transition-all">
                  
                  {/* Data e Hora */}
                  <div className="flex flex-col">
                    <span className="text-slate-800 font-bold">
                      {new Date(s.date).toLocaleDateString('pt-BR')}
                    </span>
                    <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-0.5">
                      {new Date(s.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Usuário */}
                  <div>
                    <span className="font-black text-slate-800 tracking-tight uppercase text-xs">{s.userName}</span>
                  </div>

                  {/* Valor Bruto */}
                  <div className="flex items-center">
                    <span className="font-bold text-slate-400">{fmt(s.grossValue)}</span>
                  </div>

                  {/* Comissão */}
                  <div className="flex flex-col items-start justify-center">
                    {s.comissionPercent > 0 ? (
                      <>
                        <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100 uppercase tracking-widest">
                          -{s.comissionPercent}%
                        </span>
                        <span className="text-[10px] text-slate-300 mt-1 font-bold">
                           {fmt(s.grossValue * (s.comissionPercent/100))}
                        </span>
                      </>
                    ) : (
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Isento</span>
                    )}
                  </div>

                  {/* Valor Líquido */}
                  <div className="flex flex-col items-start justify-center">
                     <span className="font-black text-emerald-600 text-lg tracking-tight">{fmt(s.netValue)}</span>
                  </div>

                  {/* Método */}
                  <div className="flex items-center text-slate-400 font-bold text-xs uppercase tracking-tight">
                    {s.method}
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-black px-2.5 py-1.5 rounded-lg inline-flex items-center gap-2 border uppercase tracking-[0.1em] whitespace-nowrap shadow-sm ${statusCfg.color}`}>
                      {statusCfg.icon}
                      {statusCfg.label}
                    </span>
                  </div>

                  {/* Ações (Aparecem no hover na lg, fixo no mobile) */}
                  <div className="flex items-center justify-start lg:justify-end gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity mt-2 lg:mt-0 print:hidden">
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
                    <div className="lg:col-span-8 mt-3 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-[11px] text-rose-700 flex items-start gap-3">
                      <XCircle size={16} className="shrink-0 mt-0.5 text-rose-500" />
                      <div className="font-bold">
                        <strong className="uppercase tracking-widest mr-2">Rejeitado:</strong> {s.rejectionReason}
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
