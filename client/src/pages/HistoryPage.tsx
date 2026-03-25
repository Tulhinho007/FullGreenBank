import { useState, useMemo, useEffect } from 'react'
import {
  History, 
  Search, 
  FileSpreadsheet, 
  Printer, 
  Calendar,
  ChevronDown,
  TrendingUp,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  User as UserIcon,
  DollarSign,
  Percent
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
import { Modal } from '../components/ui/Modal'

// --- Types ---

type ContractStatus = 'ABERTO' | 'FINALIZADO' | 'CANCELADO'

interface Contrato {
  id: string
  userId: string
  userName: string
  userEmail: string
  dataInicio: string
  valorContratado: number | null
  comissaoPercent: number | null
  status: ContractStatus
  createdAt: string
  updatedAt: string
}

interface UserOption {
  id: string
  name: string
  email: string
}

const STATUS_CONFIG: Record<ContractStatus, { label: string, color: string, icon: any }> = {
  ABERTO:     { label: 'Aberto',     color: 'text-emerald-600 bg-emerald-50 border-emerald-100', icon: Clock },
  FINALIZADO: { label: 'Finalizado', color: 'text-blue-600 bg-blue-50 border-blue-100',          icon: CheckCircle },
  CANCELADO:  { label: 'Cancelado',  color: 'text-rose-600 bg-rose-50 border-rose-100',        icon: XCircle },
}

export const HistoryPage = () => {
  const { user: me } = useAuth()
  const isReadOnly = me?.role === 'TESTER'

  const [contracts, setContracts] = useState<Contrato[]>([])
  const [users, setUsers] = useState<UserOption[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ContractStatus | 'ALL'>('ALL')

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Contrato | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Contrato | null>(null)

  // Form State
  const [formData, setFormData] = useState({
    userId: '',
    dataInicio: new Date().toISOString().split('T')[0],
    valorContratado: 0,
    comissaoPercent: 10,
    status: 'ABERTO' as ContractStatus
  })

  const loadData = async () => {
    setLoading(true)
    try {
      const [cRes, uRes] = await Promise.all([
        api.get('/contratos'),
        api.get('/users')
      ])
      setContracts(cRes.data)
      setUsers(uRes.data?.users || uRes.data || [])
    } catch {
      toast.error('Erro ao carregar dados.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filtered = useMemo(() => {
    if (!Array.isArray(contracts)) return []
    return contracts.filter(c => {
      const matchSearch = !search || 
        c.userName.toLowerCase().includes(search.toLowerCase()) || 
        c.userEmail.toLowerCase().includes(search.toLowerCase())
      
      const matchStatus = statusFilter === 'ALL' || c.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [contracts, search, statusFilter])

  const stats = useMemo(() => {
    const finalizados = filtered.filter(c => c.status === 'FINALIZADO')
    const totalProfit = finalizados.reduce((acc, c) => acc + (c.valorContratado || 0), 0)
    const totalComission = finalizados.reduce((acc, c) => {
      const v = c.valorContratado || 0
      const p = c.comissaoPercent || 0
      return acc + (v * p / 100)
    }, 0)
    const successRate = filtered.length > 0 ? (finalizados.length / filtered.length) * 100 : 0
    
    return { 
      totalProfit, 
      totalComission, 
      successRate, 
      count: finalizados.length 
    }
  }, [filtered])

  const chartData = useMemo(() => {
    const sorted = [...filtered]
      .filter(c => c.status === 'FINALIZADO')
      .sort((a, b) => new Date(a.dataInicio).getTime() - new Date(b.dataInicio).getTime())

    let current = 0
    return sorted.map(c => {
      current += (c.valorContratado || 0)
      const dateRaw = fmtDate(c.dataInicio)
      const dateParts = dateRaw.split('/')
      const date = dateParts.length >= 2 ? `${dateParts[0]}/${dateParts[1]}` : dateRaw
      return { date, profit: current }
    })
  }, [filtered])

  // --- Handlers ---

  const handleOpenAdd = () => {
    setEditTarget(null)
    setFormData({
      userId: '',
      dataInicio: new Date().toISOString().split('T')[0],
      valorContratado: 0,
      comissaoPercent: 10,
      status: 'ABERTO'
    })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (c: Contrato) => {
    setEditTarget(c)
    setFormData({
      userId: c.userId,
      dataInicio: c.dataInicio.split('T')[0],
      valorContratado: c.valorContratado || 0,
      comissaoPercent: c.comissaoPercent || 10,
      status: c.status
    })
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editTarget) {
        await api.patch(`/contratos/${editTarget.id}`, formData)
        toast.success('Contrato atualizado!')
      } else {
        await api.post('/contratos', formData)
        toast.success('Contrato adicionado!')
      }
      setIsModalOpen(false)
      loadData()
    } catch {
      toast.error('Erro ao salvar contrato.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setSaving(true)
    try {
      await api.delete(`/contratos/${deleteTarget.id}`)
      toast.success('Contrato excluído.')
      setDeleteTarget(null)
      loadData()
    } catch {
      toast.error('Erro ao excluir.')
    } finally {
      setSaving(false)
    }
  }

  const handleFinalize = async (c: Contrato) => {
    try {
      await api.patch(`/contratos/${c.id}`, { status: 'FINALIZADO' })
      toast.success('Contrato finalizado!')
      loadData()
    } catch {
      toast.error('Erro ao finalizar contrato.')
    }
  }

  const exportCSV = () => {
    const header = ['Data Inicio', 'Usuário', 'Email', 'Valor Contratado', '% Comissão', 'Status']
    const rows = filtered.map(c => [
      fmtDate(c.dataInicio),
      c.userName,
      c.userEmail,
      c.valorContratado || 0,
      c.comissaoPercent || 0,
      STATUS_CONFIG[c.status].label
    ])
    
    const csvContent = [header, ...rows].map(r => r.map(x => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.setAttribute('download', `historico_contratos_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="flex flex-col gap-8 pb-10 print:p-0 relative">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <History size={32} className="text-emerald-500" />
            Histórico de Contratos
          </h1>
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mt-1">Gestão e rastreabilidade de contratos de banca</p>
        </div>
        <div className="flex items-center gap-3">
          {!isReadOnly && (
            <button 
              onClick={handleOpenAdd}
              className="btn-primary flex items-center gap-2 px-6 py-2.5"
            >
              <Plus size={18} /> ADICIONAR CONTRATO
            </button>
          )}
          <div className="h-8 w-[1px] bg-slate-100 mx-2 hidden md:block" />
          <button onClick={exportCSV} className="btn-secondary px-4 py-2.5 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
            <FileSpreadsheet size={16} className="text-emerald-500" /> Excel
          </button>
          <button onClick={() => window.print()} className="btn-secondary px-4 py-2.5 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
            <Printer size={16} className="text-blue-500" /> Imprimir
          </button>
        </div>
      </div>

      <div className="print-container flex flex-col gap-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all hover:border-emerald-500/30">
            <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-2">Total Liquidados</p>
            <div className="flex items-end justify-between">
              <h3 className="text-3xl font-black text-slate-800 tracking-tight">{stats.count}</h3>
              <span className="text-[10px] font-black text-slate-300 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">Sessões</span>
            </div>
          </div>
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all hover:border-emerald-500/30">
            <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-2">Lucro Acumulado</p>
            <div className="flex items-end justify-between">
              <h3 className="text-3xl font-black tracking-tight text-emerald-600">
                {fmt(stats.totalProfit)}
              </h3>
              <TrendingUp size={18} className="text-emerald-500 mb-1" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all hover:border-emerald-500/30">
            <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-2">Comissão Gerada</p>
            <div className="flex items-end justify-between">
              <h3 className="text-3xl font-black text-amber-500 tracking-tight">{fmt(stats.totalComission)}</h3>
              <Percent size={18} className="text-amber-500 mb-1" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all hover:border-emerald-500/30">
            <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-2">Taxa de Sucesso</p>
            <div className="flex items-end justify-between">
              <h3 className="text-3xl font-black text-blue-600 tracking-tight">{stats.successRate.toFixed(1)}%</h3>
              <div className="w-16 h-1.5 bg-slate-50 rounded-full mb-2 overflow-hidden border border-slate-100">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${stats.successRate}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Evolution Chart */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm print:hidden">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-8 flex items-center gap-2">
            <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
            Evolução de Patrimônio (Finalizados)
          </h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorHistoryProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} tickFormatter={(val) => fmt(val)} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #f1f5f9', borderRadius: '16px', fontSize: '11px', fontWeight: 900, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorHistoryProfit)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center bg-slate-50/50 p-6 rounded-[2.5rem] border border-slate-100 print:hidden shadow-inner">
          <div className="flex-1 min-w-[280px] relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por usuário ou e-mail..."
              className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-9 pr-4 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all"
            />
          </div>
          <div className="w-full md:w-48 relative">
            <select 
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-4 pr-10 text-sm font-bold text-slate-800 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all"
            >
              <option value="ALL">Todos os status</option>
              {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] text-slate-400 uppercase font-black tracking-[0.2em] border-b border-slate-100">
                  <th className="px-8 py-5">Data Início</th>
                  <th className="px-8 py-5">Usuário / Email</th>
                  <th className="px-8 py-5 text-right">Valor Contratado</th>
                  <th className="px-8 py-5 text-center">% Comissão</th>
                  <th className="px-8 py-5">Status</th>
                  {!isReadOnly && <th className="px-8 py-5 text-right no-print">Ações</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-20 text-center">
                      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                      <p className="text-sm font-bold text-slate-400">Carregando histórico...</p>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-20 text-center">
                      <div className="bg-slate-50 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                        <AlertTriangle size={24} className="text-slate-300" />
                      </div>
                      <p className="text-sm font-bold text-slate-500">Nenhum contrato encontrado</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map(c => {
                    const statusVal = STATUS_CONFIG[c.status] || STATUS_CONFIG.ABERTO
                    const StatusIcon = statusVal.icon
                    return (
                      <tr key={c.id} className="hover:bg-slate-50/50 transition-all group">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                            <Calendar size={14} className="text-slate-300" />
                            {fmtDate(c.dataInicio)}
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{c.userName}</p>
                          <p className="text-[10px] font-bold text-slate-400">{c.userEmail}</p>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <span className="text-base font-black text-slate-800 font-mono">{fmt(c.valorContratado || 0)}</span>
                        </td>
                        <td className="px-8 py-5 text-center">
                          <span className="text-sm font-black text-amber-500">{c.comissaoPercent}%</span>
                        </td>
                        <td className="px-8 py-5">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm ${statusVal.color}`}>
                            <StatusIcon size={12} />
                            {statusVal.label}
                          </span>
                        </td>
                        {!isReadOnly && (
                          <td className="px-8 py-5 no-print">
                            <div className="flex items-center justify-end gap-2">
                              {c.status === 'ABERTO' && (
                                <button 
                                  onClick={() => handleFinalize(c)}
                                  className="p-2 text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl hover:bg-emerald-100 transition-all shadow-sm"
                                  title="Finalizar Contrato"
                                >
                                  <CheckCircle size={14} />
                                </button>
                              )}
                              <button 
                                onClick={() => handleOpenEdit(c)}
                                className="p-2 text-blue-600 bg-blue-50 border border-blue-100 rounded-xl hover:bg-blue-100 transition-all shadow-sm"
                                title="Editar"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button 
                                onClick={() => setDeleteTarget(c)}
                                className="p-2 text-rose-600 bg-rose-50 border border-rose-100 rounded-xl hover:bg-rose-100 transition-all shadow-sm"
                                title="Excluir"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Add/Edit */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editTarget ? 'Editar Contrato' : 'Adicionar Novo Contrato'}
        size="md"
      >
        <form onSubmit={handleSave} className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-full">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Usuário</label>
              <div className="relative">
                <select 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 pl-10 pr-4 text-sm font-bold text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all"
                  value={formData.userId}
                  onChange={e => setFormData({ ...formData, userId: e.target.value })}
                >
                  <option value="">Selecione um usuário...</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
                </select>
                <UserIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Data Início</label>
              <div className="relative">
                <input 
                  type="date"
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 pl-10 pr-4 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all"
                  value={formData.dataInicio}
                  onChange={e => setFormData({ ...formData, dataInicio: e.target.value })}
                />
                <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Status</label>
              <div className="relative">
                <select 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 pl-10 pr-4 text-sm font-bold text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all"
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value as ContractStatus })}
                >
                  {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                    <option key={key} value={key}>{val.label}</option>
                  ))}
                </select>
                <Clock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Valor Contratado</label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 z-10"><DollarSign size={16} /></div>
                <CurrencyInput
                  value={formData.valorContratado}
                  onChange={v => setFormData({ ...formData, valorContratado: v })}
                  className="w-full bg-slate-50 border-slate-100 rounded-2xl pl-10 focus:ring-emerald-500/10"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">% Comissão</label>
              <div className="relative">
                <input 
                  type="number"
                  step="0.1"
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 pl-10 pr-4 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all"
                  value={formData.comissaoPercent}
                  onChange={e => setFormData({ ...formData, comissaoPercent: Number(e.target.value) })}
                />
                <Percent size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-2">
            <button 
              type="button" 
              onClick={() => setIsModalOpen(false)}
              className="flex-1 px-6 py-3.5 bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-[1.25rem] hover:bg-slate-200 transition-all active:scale-95"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={saving}
              className="flex-1 btn-primary py-3.5 flex items-center justify-center gap-2"
            >
              {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus size={16} />}
              {editTarget ? 'SALVAR ALTERAÇÕES' : 'CRIAR CONTRATO'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Delete */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Excluir Contrato" size="sm">
        <div className="flex flex-col gap-6">
          <div className="bg-rose-50 border border-rose-100 rounded-3xl p-6 flex flex-col items-center text-center gap-3">
             <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm">
               <Trash2 size={24} className="text-rose-500" />
             </div>
             <div>
               <p className="text-sm font-black text-slate-800 uppercase tracking-tight">Tem certeza?</p>
               <p className="text-xs text-slate-500 mt-1">Esta ação não poderá ser desfeita. O contrato será removido do sistema.</p>
             </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setDeleteTarget(null)} className="flex-1 btn-secondary py-3.5">Voltar</button>
            <button 
              onClick={handleDelete}
              disabled={saving}
              className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black uppercase tracking-widest rounded-[1.25rem] transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20"
            >
              {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Trash2 size={16} />}
              CONFIRMAR EXCLUSÃO
            </button>
          </div>
        </div>
      </Modal>

    </div>
  )
}
