import { useState } from 'react'
import {
  Banknote,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Download
} from 'lucide-react'
import { formatCurrency as fmt } from '../utils/formatters'

interface Saque {
  id: string
  date: string
  userName: string
  grossValue: number // Valor Bruto
  comissionPercent: number // 10 = 10%
  netValue: number // Valor que cairá na conta
  method: string
  status: 'CONCLUIDO' | 'PENDENTE' | 'PROCESSANDO' | 'REJEITADO'
  rejectionReason?: string
}

const mockSaques: Saque[] = [
  {
    id: 'sq-1234',
    date: '2026-03-20T14:30:00Z',
    userName: 'Carlos Silva',
    grossValue: 1500,
    comissionPercent: 10,
    netValue: 1350,
    method: 'Pix',
    status: 'CONCLUIDO'
  },
  {
    id: 'sq-1235',
    date: '2026-03-18T09:15:00Z',
    userName: 'Ana Beatriz',
    grossValue: 500,
    comissionPercent: 0,
    netValue: 500,
    method: 'Pix',
    status: 'PENDENTE'
  },
  {
    id: 'sq-1236',
    date: '2026-03-15T16:45:00Z',
    userName: 'Lucas Mendes',
    grossValue: 2000,
    comissionPercent: 10,
    netValue: 1800,
    method: 'Transferência',
    status: 'REJEITADO',
    rejectionReason: 'Dados bancários divergentes.'
  },
  {
    id: 'sq-1237',
    date: '2026-03-21T10:00:00Z',
    userName: 'Roberto Carlos',
    grossValue: 350,
    comissionPercent: 10,
    netValue: 315,
    method: 'Pix',
    status: 'PROCESSANDO'
  }
]

export const HistoricoSaquesPage = () => {
  const [saques] = useState<Saque[]>(mockSaques)
  const [searchTerm, setSearchTerm] = useState('')

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

  const filteredSaques = saques.filter(s => 
    s.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.status.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
        <button className="flex items-center gap-2 px-4 py-2 bg-surface-300 text-slate-700 dark:text-slate-200 font-semibold rounded-lg hover:bg-surface-400 transition-colors shadow-sm text-sm">
          <Download size={16} />
          Exportar Relatório
        </button>
      </div>

      {/* ─── Barra de Filtros ─── */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por usuário..." 
            className="input-field pl-10 h-11 text-sm bg-white dark:bg-surface-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="h-11 px-4 flex items-center justify-center gap-2 bg-white dark:bg-surface-200 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-surface-300 rounded-xl hover:bg-slate-50 dark:hover:bg-surface-300 transition-colors font-medium text-sm w-full sm:w-auto">
          <Filter size={16} />
          Filtros Avançados
        </button>
      </div>

      {/* ─── Área da Tabela ─── */}
      <div className="card overflow-hidden bg-white dark:bg-surface-200 border border-slate-200 dark:border-surface-300">
        
        {/* Helper Tip */}
        <div className="px-6 py-3 bg-blue-50 dark:bg-blue-500/5 border-b border-blue-100 dark:border-blue-500/10 flex items-start sm:items-center gap-2 text-xs sm:text-sm text-blue-800 dark:text-blue-300 leading-tight">
           <Banknote className="shrink-0 mt-0.5 sm:mt-0" size={16} />
           <p><strong>Dica de Auditoria:</strong> Saques originados de Bancas Gerenciadas podem apresentar até 10% de comissão deduzida do valor bruto solicitado.</p>
        </div>

        {/* Tabela Header */}
        <div className="hidden lg:grid grid-cols-[140px_1fr_120px_120px_120px_110px_130px] gap-4 px-6 py-4 bg-slate-50 dark:bg-surface-300/30 border-b border-slate-100 dark:border-surface-300 text-[11px] font-bold text-slate-500 uppercase tracking-widest items-center">
          <span>Data e Hora</span>
          <span>Usuário</span>
          <span>Valor Bruto</span>
          <span>Comissão</span>
          <span>Valor Líquido</span>
          <span>Método</span>
          <span>Status</span>
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
                <div key={s.id} className="grid grid-cols-1 lg:grid-cols-[140px_1fr_120px_120px_120px_110px_130px] gap-2 lg:gap-4 px-6 py-4 lg:py-4.5 text-sm items-start lg:items-center hover:bg-slate-50 dark:hover:bg-surface-300/20 transition-colors">
                  
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

                  {/* Rejection Reason (If any) - Shows only on small screens natively, but let's make it a full row span below if rejected */}
                  {s.status === 'REJEITADO' && s.rejectionReason && (
                    <div className="lg:col-span-7 mt-2 p-3 bg-red-50 dark:bg-red-500/5 border border-red-100 dark:border-red-500/10 rounded-lg text-xs text-red-700 dark:text-red-400 flex items-start gap-2">
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

    </div>
  )
}
