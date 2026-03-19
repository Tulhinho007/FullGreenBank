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
  ATIVO:            { label: 'Ativo',            color: 'text-green-400 bg-green-900/40 border-green-800/50',    icon: CheckCircle },
  AGUARDANDO_SAQUE: { label: 'Aguardando saque', color: 'text-blue-400 bg-blue-900/30 border-blue-800/50',      icon: Clock },
  FINALIZADO:       { label: 'Finalizado',        color: 'text-emerald-400 bg-emerald-900/30 border-emerald-800/50', icon: TrendingUp },
  ENCERRADO:        { label: 'Encerrado',         color: 'text-slate-400 bg-surface-300 border-surface-400',    icon: XCircle },
  CANCELADO:        { label: 'Cancelado',         color: 'text-red-400 bg-red-900/30 border-red-800/50',        icon: XCircle },
}

// --- Utils ---

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtDate = (d: string) => new Date(d + (d.includes('T') ? '' : 'T00:00:00')).toLocaleDateString('pt-BR')

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

  // Derived Data
  const filtered = useMemo(() => {
    const isMasterOrAdmin = user?.role === 'MASTER' || user?.role === 'ADMIN'
    
    return contracts.filter(c => {
      // Role-based visibility
      const isOwner = c.userId === user?.id
      if (!isMasterOrAdmin && !isOwner) return false

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
  }, [contracts, search, statusFilter, minValue, maxValue, user])

  const stats = useMemo(() => {
    const closed = filtered.filter(c => c.status === 'FINALIZADO' || c.status === 'ENCERRADO')
    const totalProfit = closed.reduce((acc, c) => acc + c.lucro, 0)
    const totalComission = closed.reduce((acc, c) => acc + c.vlComissao, 0)
    const successRate = closed.length > 0 ? (closed.filter(c => c.lucro > 0).length / closed.length) * 100 : 0
    
    return { totalProfit, totalComission, successRate, count: closed.length }
  }, [filtered])

  const chartData = useMemo(() => {
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
      const date = c.dataFinal ? fmtDate(c.dataFinal).split('/')[0] + '/' + fmtDate(c.dataFinal).split('/')[1] : '?'
      return { date, profit: current }
    })
  }, [filtered])

  // --- Exports ---

  const exportCSV = () => {
    const header = ['Identificação', 'Usuário', 'Email', 'Status', 'Data Inicial', 'Data Final', 'Banca Inicial', 'Banca Final', 'Lucro', 'Comissão (%)', 'Vl Comissão']
    const rows = filtered.map(c => [
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
          <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
            <History size={24} className="text-green-500" />
            Histórico de Contratos
          </h1>
          <p className="text-sm text-slate-500 mt-1">Rastreabilidade completa de sessões finalizadas e encerradas</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={exportCSV} 
            className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl border border-green-600/40 bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-all"
          >
            <FileSpreadsheet size={16} /> Excel
          </button>
          <button 
            onClick={exportPDF} 
            className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl border border-red-600/40 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
          >
            <FileText size={16} /> PDF
          </button>
          <button 
            onClick={() => window.print()} 
            className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl border border-blue-600/40 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all"
          >
            <Printer size={16} /> Imprimir
          </button>
        </div>
      </div>

      <div className="print-container flex flex-col gap-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-5 border border-surface-400">
          <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1">Total Liquidados</p>
          <div className="flex items-end justify-between">
            <h3 className="text-2xl font-bold text-white">{stats.count}</h3>
            <span className="text-xs text-slate-400 bg-surface-300 px-2 py-0.5 rounded">Sessões</span>
          </div>
        </div>
        <div className="card p-5 border border-surface-400">
          <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1">Lucro Acumulado</p>
          <div className="flex items-end justify-between">
            <h3 className={`text-2xl font-bold ${stats.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {fmt(stats.totalProfit)}
            </h3>
            <ArrowUpRight size={16} className="text-green-500 mb-1" />
          </div>
        </div>
        <div className="card p-5 border border-surface-400">
          <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1">Comissão Gerada</p>
          <div className="flex items-end justify-between">
            <h3 className="text-2xl font-bold text-yellow-400">{fmt(stats.totalComission)}</h3>
            <TrendingUp size={16} className="text-yellow-500 mb-1" />
          </div>
        </div>
        <div className="card p-5 border border-surface-400">
          <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1">Taxa de Sucesso</p>
          <div className="flex items-end justify-between">
            <h3 className="text-2xl font-bold text-blue-400">{stats.successRate.toFixed(1)}%</h3>
            <div className="w-16 h-1 bg-surface-300 rounded-full mb-2 overflow-hidden">
               <div className="h-full bg-blue-500" style={{ width: `${stats.successRate}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Evolution Chart (Simplified for History) */}
      <div className="card p-6 border border-surface-400 print:hidden">
        <h3 className="text-sm font-semibold text-white mb-6">Evolução de Patrimônio (Contratos Encerrados)</h3>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorHistoryProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(val) => `R$${val}`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '11px' }}
                itemStyle={{ color: '#4ade80' }}
              />
              <Area type="monotone" dataKey="profit" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#colorHistoryProfit)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-end bg-surface-200 p-5 rounded-2xl border border-surface-400 print:hidden">
        <div className="flex-1 min-w-0">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block ml-1">Buscar Contrato / Usuário</label>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Nome, email ou Id..." 
              className="input-field w-full pl-9 py-2 text-sm bg-surface-300"
            />
          </div>
        </div>
        
        <div className="w-full md:w-48">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block ml-1">Status</label>
          <div className="relative">
            <select 
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="input-field w-full py-2 text-sm bg-surface-300 appearance-none pointer-events-auto cursor-pointer pr-8"
            >
              <option value="ALL">Todos os status</option>
              <option value="ATIVO">Ativo</option>
              <option value="FINALIZADO">Finalizado</option>
              <option value="ENCERRADO">Encerrado</option>
              <option value="CANCELADO">Cancelado</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>
        </div>

        <div className="flex gap-2">
          <div className="w-24">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block ml-1">Valor Min</label>
            <input type="number" value={minValue} onChange={e => setMinValue(e.target.value)} placeholder="0" className="input-field w-full py-2 text-sm bg-surface-300" />
          </div>
          <div className="w-24">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block ml-1">Valor Max</label>
            <input type="number" value={maxValue} onChange={e => setMaxValue(e.target.value)} placeholder="99k" className="input-field w-full py-2 text-sm bg-surface-300" />
          </div>
        </div>

        <button onClick={() => { setSearch(''); setStatusFilter('ALL'); setMinValue(''); setMaxValue('') }} className="btn-secondary h-9 px-4 flex items-center justify-center text-xs opacity-60 hover:opacity-100 transition-opacity">
          Limpar
        </button>
      </div>

      {/* Results Table */}
      <div className="card overflow-hidden border border-surface-400">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-300/50 border-b border-surface-400 text-[10px] text-slate-500 uppercase tracking-widest">
                <th className="px-6 py-4 font-bold">Identificação</th>
                <th className="px-6 py-4 font-bold">Usuário</th>
                <th className="px-6 py-4 font-bold">Período</th>
                <th className="px-6 py-4 font-bold">Banca Inicial</th>
                <th className="px-6 py-4 font-bold">Banca Final</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold text-right">Resultado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-400/30">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-500">
                    <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    Carregando histórico...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
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
                  const roots = filtered.filter(c => !c.parentId);
                  const elements: React.ReactNode[] = [];
                  const handledIds = new Set<string>();

                  const renderRow = (c: BancaContract, isSub = false) => {
                    const StatusIcon = STATUS_CONFIG[c.status].icon;
                    return (
                      <tr key={c.id} className={`hover:bg-surface-300/20 transition-colors group ${isSub ? 'bg-surface-200/30' : ''}`}>
                        <td className={`px-6 py-4`}>
                          <div className={`flex items-center gap-2 ${isSub ? 'ml-6' : ''}`}>
                            {isSub && <div className="w-4 h-4 border-l border-b border-surface-500 rounded-bl" />}
                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${isSub ? 'bg-slate-700/50 text-slate-400' : 'bg-surface-400 text-white'}`}>
                              {c.identificacao || '-'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-semibold text-white">{c.userName}</p>
                          <p className="text-[10px] text-slate-500">{c.userEmail}</p>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-400">
                           <div className="flex items-center gap-1.5">
                             <Calendar size={12} className="text-slate-600" />
                             {fmtDate(c.dataInicial)} {c.dataFinal ? `→ ${fmtDate(c.dataFinal)}` : ' (Em aberto)'}
                           </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-mono text-slate-300">{fmt(c.bancaInicial)}</td>
                        <td className="px-6 py-4 text-xs font-mono text-white font-bold">{fmt(c.bancaFinal)}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${STATUS_CONFIG[c.status].color}`}>
                            <StatusIcon size={10} />
                            {STATUS_CONFIG[c.status].label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <p className={`text-sm font-bold font-mono ${c.lucro > 0 ? 'text-green-400' : 'text-slate-500'}`}>
                            {c.lucro > 0 ? '+' : ''}{fmt(c.lucro)}
                          </p>
                          <p className="text-[10px] text-slate-600">Comissão: {fmt(c.vlComissao)}</p>
                        </td>
                      </tr>
                    )
                  }

                  roots.forEach(r => {
                    elements.push(renderRow(r));
                    handledIds.add(r.id);
                    const children = filtered.filter(child => child.parentId === r.id);
                    children.forEach(child => {
                      elements.push(renderRow(child, true));
                      handledIds.add(child.id);
                    });
                  });

                  // Casos órfãos ou que sobraram
                  filtered.forEach(c => {
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
