import { useState, useMemo, useEffect } from 'react'
import {
  History, 
  Search, 
  FileSpreadsheet, 
  FileText,
  Printer, 
  Calendar,
  ChevronDown,
  TrendingUp,
  ArrowUpRight,
  XCircle,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import api from '../services/api'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { formatCurrency as fmt, formatDate as fmtDate } from '../utils/formatters'
import { CurrencyInput } from '../components/ui/CurrencyInput'

// --- Types ---

type ContractStatus = 'ATIVO' | 'AGUARDANDO_SAQUE' | 'FINALIZADO' | 'ENCERRADO' | 'CANCELADO'

interface BancaContract {
  id: string
  userId: string
  userName: string
  userEmail: string
  dataInicial: string
  dataFinal: string | null
  bancaInicial: number
  bancaFinal: number
  comissaoPercent: number
  status: ContractStatus
  motivoFim: string
  observacoes: string
  parentId?: string | null
  identificacao?: string | null
  createdAt: string
  updatedAt: string
  lucro: number
  vlComissao: number
  vlCliente: number
}

const STATUS_CONFIG: Record<ContractStatus, { label: string, color: string, icon: any }> = {
  ATIVO:            { label: 'Ativo',            color: 'text-emerald-600 bg-emerald-50 border-emerald-100',    icon: CheckCircle },
  AGUARDANDO_SAQUE: { label: 'Aguardando saque', color: 'text-blue-600 bg-blue-50 border-blue-100',          icon: Clock },
  FINALIZADO:       { label: 'Finalizado',        color: 'text-emerald-700 bg-emerald-100 border-emerald-200', icon: TrendingUp },
  ENCERRADO:        { label: 'Encerrado',         color: 'text-slate-500 bg-slate-50 border-slate-100',         icon: XCircle },
  CANCELADO:        { label: 'Cancelado',         color: 'text-rose-600 bg-rose-50 border-rose-100',           icon: XCircle },
}

// --- Utils ---

export const HistoryPage = () => {
  const { user } = useAuth()

  const [contracts, setContracts] = useState<BancaContract[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ContractStatus | 'ALL'>('ALL')
  const [minValue, setMinValue] = useState('')
  const [maxValue, setMaxValue] = useState('')

  const loadData = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/banca-contratos')
      
      const mapped = data.map((c: any) => {
        const lucro = Math.max(0, c.bancaFinal - c.bancaInicial)
        const vlComissao = (lucro * c.comissaoPercent) / 100
        const vlCliente = c.bancaFinal - vlComissao
        return { ...c, lucro, vlComissao, vlCliente }
      })
      
      setContracts(mapped)
    } catch {
      toast.error('Erro ao carregar histórico de contratos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Global filtered data for Stats and Chart
  const filtered = useMemo(() => {
    if (!Array.isArray(contracts)) return []
    return contracts.filter(c => {
      const matchSearch = !search || 
        c.userName.toLowerCase().includes(search.toLowerCase()) || 
        c.userEmail.toLowerCase().includes(search.toLowerCase()) ||
        (c.identificacao && c.identificacao.toLowerCase().includes(search.toLowerCase()))
      
      const matchStatus = statusFilter === 'ALL' || c.status === statusFilter
      
      const val = c.bancaFinal
      const matchMin = !minValue || val >= Number(minValue)
      const matchMax = !maxValue || val <= Number(maxValue)

      return matchSearch && matchStatus && matchMin && matchMax
    })
  }, [contracts, search, statusFilter, minValue, maxValue])

  // Restricted data for the TABLE only
  const tableContracts = useMemo(() => {
    const isMasterOrAdmin = user?.role === 'MASTER' || user?.role === 'ADMIN'
    if (!Array.isArray(filtered)) return []
    if (isMasterOrAdmin) return filtered
    return filtered.filter(c => c.userId === user?.id)
  }, [filtered, user])

  const stats = useMemo(() => {
    if (!Array.isArray(filtered)) return { totalProfit: 0, totalComission: 0, successRate: 0, count: 0 }
    const closed = filtered.filter(c => c.status === 'FINALIZADO' || c.status === 'ENCERRADO')
    const totalProfit = closed.reduce((acc, c) => acc + c.lucro, 0)
    const totalComission = closed.reduce((acc, c) => acc + c.vlComissao, 0)
    const successRate = closed.length > 0 ? (closed.filter(c => c.lucro > 0).length / closed.length) * 100 : 0
    
    return { totalProfit, totalComission, successRate, count: closed.length }
  }, [filtered])

  const chartData = useMemo(() => {
    if (!Array.isArray(filtered)) return []
    // Pegar contratos fechados ordenados por data final
    const closed = filtered
      .filter(c => c.status === 'FINALIZADO' || c.status === 'ENCERRADO')
      .sort((a, b) => {
        const dA = a.dataFinal || a.dataInicial
        const dB = b.dataFinal || b.dataInicial
        return new Date(dA).getTime() - new Date(dB).getTime()
      })

    let current = 0
    return closed.map(c => {
      current += c.lucro
      const dateRaw = c.dataFinal ? fmtDate(c.dataFinal) : '?'
      const dateParts = dateRaw.split('/')
      const date = dateParts.length >= 2 ? `${dateParts[0]}/${dateParts[1]}` : dateRaw
      return { date, profit: current }
    })
  }, [filtered])

  // --- Exports ---

  const exportCSV = () => {
    const header = ['Identificação', 'Usuário', 'Email', 'Status', 'Data Inicial', 'Data Final', 'Banca Inicial', 'Banca Final', 'Lucro', 'Comissão (%)', 'Vl Comissão']
    const rows = tableContracts.map(c => [
      c.identificacao || '',
      c.userName,
      c.userEmail,
      STATUS_CONFIG[c.status].label,
      fmtDate(c.dataInicial),
      c.dataFinal ? fmtDate(c.dataFinal) : '',
      c.bancaInicial,
      c.bancaFinal,
      c.lucro,
      c.comissaoPercent,
      c.vlComissao
    ])
    
    const csvContent = [header, ...rows].map(r => r.map(x => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.setAttribute('download', `historico_banca_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportPDF = () => {
    window.print()
  }

  return (
    <div className="flex flex-col gap-8 pb-10 print:p-0 relative">
      
      <style>{`
        @media print {
          @page { size: A4; margin: 10mm; }
          
          /* Force Light Mode and Reset Layout */
          body, html { 
            background: white !important; 
            color: #111 !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
          }

          /* Hide ALL layout elements from AppLayout */
          aside, nav, header, .no-print, .btn-print-hide, 
          .impersonation-banner, .Sidebar, .Header { 
            display: none !important; 
            width: 0 !important;
            height: 0 !important;
          }

          /* Reset Container Flex and Overflows */
          div.flex, div.min-h-screen, div.overflow-hidden {
            display: block !important;
            overflow: visible !important;
            height: auto !important;
            min-height: 0 !important;
          }

          .main-content, main { 
            margin: 0 !important; 
            padding: 0 !important; 
            width: 100% !important;
            display: block !important;
          }

          .print-container {
            display: block !important;
            width: 100% !important;
            position: relative !important;
          }

          /* Card Stylings for Print */
          .card {
            background: white !important;
            border: 1px solid #e2e8f0 !important;
            box-shadow: none !important;
            color: #1a202c !important;
            margin-bottom: 20px !important;
          }

          .text-white { color: #1a202c !important; }
          .text-slate-500, .text-slate-600 { color: #4a5568 !important; }
          .text-green-400, .text-green-500 { color: #2f855a !important; }
          .text-red-400, .text-red-500 { color: #c53030 !important; }
          
          /* Table Adjustments */
          table { width: 100% !important; border-collapse: collapse !important; }
          th { background-color: #f7fafc !important; color: #4a5568 !important; }
          td, th { border: 1px solid #e2e8f0 !important; padding: 10px !important; }
          tr { page-break-inside: avoid; }
        }
      `}</style>
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <History size={32} className="text-emerald-500" />
            Histórico de Contratos
          </h1>
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mt-1">Rastreabilidade completa de sessões finalizadas e encerradas</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={exportCSV} 
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-5 py-2.5 rounded-xl border border-slate-100 bg-white text-slate-500 hover:bg-slate-50 transition-all shadow-sm"
          >
            <FileSpreadsheet size={16} className="text-emerald-500" /> Excel
          </button>
          <button 
            onClick={exportPDF} 
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-5 py-2.5 rounded-xl border border-slate-100 bg-white text-slate-500 hover:bg-slate-50 transition-all shadow-sm"
          >
            <FileText size={16} className="text-rose-500" /> PDF
          </button>
          <button 
            onClick={() => window.print()} 
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-5 py-2.5 rounded-xl border border-slate-100 bg-white text-slate-500 hover:bg-slate-50 transition-all shadow-sm"
          >
            <Printer size={16} className="text-blue-500" /> Imprimir
          </button>
        </div>
      </div>

      <div className="print-container flex flex-col gap-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-2">Total Liquidados</p>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-black text-slate-800 tracking-tight">{stats.count}</h3>
            <span className="text-[10px] font-black text-slate-300 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">Sessões</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-2 relative z-10">Lucro Acumulado</p>
          <div className="flex items-end justify-between relative z-10">
            <h3 className={`text-3xl font-black tracking-tight ${stats.totalProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {fmt(stats.totalProfit)}
            </h3>
            <ArrowUpRight size={18} className={`${stats.totalProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'} mb-1`} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-2">Comissão Gerada</p>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-black text-amber-500 tracking-tight">{fmt(stats.totalComission)}</h3>
            <TrendingUp size={18} className="text-amber-500 mb-1" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-2">Taxa de Sucesso</p>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-black text-blue-600 tracking-tight">{stats.successRate.toFixed(1)}%</h3>
            <div className="w-16 h-1.5 bg-slate-50 rounded-full mb-2 overflow-hidden border border-slate-100">
               <div className="h-full bg-blue-500 rounded-full" style={{ width: `${stats.successRate}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Evolution Chart (Simplified for History) */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm print:hidden">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-8 flex items-center gap-2">
          <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
          Evolução de Patrimônio
        </h3>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorHistoryProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} dy={10} />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} 
                tickFormatter={(val) => fmt(val)} 
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #f1f5f9', borderRadius: '16px', fontSize: '11px', fontWeight: 900, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                itemStyle={{ color: '#059669' }}
              />
              <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorHistoryProfit)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-end bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 print:hidden shadow-inner">
        <div className="flex-1 min-w-0">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">Buscar Contrato / Usuário</label>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
            <input 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Nome, email ou identificação..." 
              className="w-full bg-white border border-slate-100 rounded-xl py-2 pl-9 pr-4 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all shadow-sm"
            />
          </div>
        </div>
        
        <div className="w-full md:w-56">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">Filtrar por Status</label>
          <div className="relative">
            <select 
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="w-full bg-white border border-slate-100 rounded-xl py-2 pl-4 pr-10 text-sm font-bold text-slate-800 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all shadow-sm"
            >
              <option value="ALL">Todos os status</option>
              <option value="ATIVO">Ativo</option>
              <option value="FINALIZADO">Finalizado</option>
              <option value="ENCERRADO">Encerrado</option>
              <option value="CANCELADO">Cancelado</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <div className="flex gap-2">
          <div className="w-32">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">Valor Min</label>
            <CurrencyInput
              value={minValue ? Number(minValue) : 0}
              onChange={(v) => setMinValue(String(v))}
              alertLimit={10}
              className="w-full py-2 bg-white border-slate-100 shadow-sm rounded-xl focus:ring-emerald-500/10"
            />
          </div>
          <div className="w-32">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">Valor Max</label>
            <CurrencyInput
              value={maxValue ? Number(maxValue) : 0}
              onChange={(v) => setMaxValue(String(v))}
              alertLimit={10}
              className="w-full py-2 bg-white border-slate-100 shadow-sm rounded-xl focus:ring-emerald-500/10"
            />
          </div>
        </div>
        <button onClick={() => { setSearch(''); setStatusFilter('ALL'); setMinValue(''); setMaxValue('') }} className="btn-secondary h-9 px-4 flex items-center justify-center text-xs opacity-60 hover:opacity-100 transition-opacity">
          Limpar
        </button>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] text-slate-400 uppercase font-black tracking-[0.2em] border-b border-slate-100">
                <th className="px-8 py-5">Identificação</th>
                <th className="px-8 py-5">Usuário / Email</th>
                <th className="px-8 py-5">Período de Atividade</th>
                <th className="px-8 py-5">Banca Inicial</th>
                <th className="px-8 py-5">Banca Final</th>
                <th className="px-8 py-5">Status Atual</th>
                <th className="px-8 py-5 text-right">Lucro Líquido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-500">
                    <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    Carregando histórico...
                  </td>
                </tr>
              ) : tableContracts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-500">
                      <AlertTriangle size={32} strokeWidth={1.5} />
                      <p className="text-sm font-medium">Nenhum contrato encontrado</p>
                      <p className="text-xs">Ajuste os filtros para ampliar a busca</p>
                    </div>
                  </td>
                </tr>
              ) : (
                (() => {
                  // Lógica de Hierarquia (Raiz -> Filhos)
                  const roots = tableContracts.filter(c => !c.parentId);
                  const elements: React.ReactNode[] = [];
                  const handledIds = new Set<string>();

                  const renderRow = (c: BancaContract, isSub = false) => {
                    const config = STATUS_CONFIG[c.status] || STATUS_CONFIG.ENCERRADO;
                    const StatusIcon = config.icon;
                    return (
                      <tr key={c.id} className={`hover:bg-slate-50/50 transition-all group ${isSub ? 'bg-slate-50/30' : 'bg-white'}`}>
                        <td className="px-8 py-5">
                          <div className={`flex items-center gap-2 ${isSub ? 'ml-6' : ''}`}>
                            {isSub && <div className="w-4 h-4 border-l-2 border-b-2 border-slate-100 rounded-bl-lg" />}
                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border shadow-sm ${isSub ? 'bg-slate-50 text-slate-400 border-slate-100' : 'bg-slate-800 text-white border-slate-700'}`}>
                              {c.identificacao || '-'}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <p className="text-sm font-black text-slate-800 uppercase tracking-tight truncate max-w-[160px]">{c.userName}</p>
                          <p className="text-[10px] font-bold text-slate-400 truncate">{c.userEmail}</p>
                        </td>
                        <td className="px-8 py-5">
                           <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase">
                             <Calendar size={12} className="text-slate-200" />
                             {fmtDate(c.dataInicial)} {c.dataFinal ? `→ ${fmtDate(c.dataFinal)}` : ''}
                             {!c.dataFinal && <span className="ml-1 text-emerald-500 animate-pulse text-[8px]">EM ABERTO</span>}
                           </div>
                        </td>
                        <td className="px-8 py-5 text-sm font-bold text-slate-500">{fmt(c.bancaInicial)}</td>
                        <td className="px-8 py-5 text-sm font-black text-slate-800">{fmt(c.bancaFinal)}</td>
                        <td className="px-8 py-5">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm ${config.color}`}>
                            <StatusIcon size={12} />
                            {config.label}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-right whitespace-nowrap">
                          <p className={`text-base font-black tracking-tight ${c.lucro > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {c.lucro > 0 ? '+' : ''}{fmt(c.lucro)}
                          </p>
                          <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-0.5">Comissão: {fmt(c.vlComissao)}</p>
                        </td>
                      </tr>
                    )
                  }

                  roots.forEach(r => {
                    elements.push(renderRow(r));
                    handledIds.add(r.id);
                    const children = tableContracts.filter(child => child.parentId === r.id);
                    children.forEach(child => {
                      elements.push(renderRow(child, true));
                      handledIds.add(child.id);
                    });
                  });

                  // Casos órfãos ou que sobraram
                  tableContracts.forEach(c => {
                    if (!handledIds.has(c.id)) {
                      elements.push(renderRow(c, !!c.parentId));
                    }
                  });

                  return elements;
                })()
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </div>
  )
}
