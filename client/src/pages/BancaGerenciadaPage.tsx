import { useEffect, useState, FormEvent } from 'react'
import {
  Briefcase, TrendingUp, DollarSign, Percent,
  Plus, Edit2, Trash2, RefreshCw, AlertTriangle,
  CheckCircle, XCircle, Clock, Search, Ban, Users,
  CalendarDays, FileSpreadsheet, FileText, Printer, Eye,
} from 'lucide-react'
import { Modal } from '../components/ui/Modal'
import { useAuth } from '../contexts/AuthContext'
import { addLog } from './SystemLogPage'
import api from '../services/api'
import toast from 'react-hot-toast'

// ─── Tipos ────────────────────────────────────────────────────────────────────

type ContractStatus = 'ATIVO' | 'AGUARDANDO_SAQUE' | 'FINALIZADO' | 'ENCERRADO' | 'CANCELADO'
type MotivoFim = '' | 'FIM_DO_PRAZO' | 'CLIENTE_ENCERROU' | 'STOP_LOSS' | 'META_ATINGIDA' | 'SAQUE_TOTAL' | 'CANCELADO' | 'OUTRO'

interface BancaContract {
  id: string; userId: string; userName: string; userEmail: string
  dataInicial: string; dataFinal: string | null
  bancaInicial: number; bancaFinal: number; comissaoPercent: number
  status: ContractStatus; motivoFim: MotivoFim; observacoes: string
  parentId?: string | null
  identificacao?: string | null
  createdAt: string; updatedAt: string
  lucro: number; vlComissao: number; vlCliente: number; duracaoDias: number
}

interface UserOption { id: string; name: string; email: string }

const STATUS_CONFIG: Record<ContractStatus, { label: string; color: string; icon: React.ReactNode }> = {
  ATIVO:            { label: 'Ativo',            color: 'text-green-400 bg-green-900/40 border-green-800/50',    icon: <CheckCircle size={12} /> },
  AGUARDANDO_SAQUE: { label: 'Aguardando saque', color: 'text-blue-400 bg-blue-900/30 border-blue-800/50',      icon: <Clock size={12} /> },
  FINALIZADO:       { label: 'Finalizado',        color: 'text-yellow-400 bg-yellow-900/30 border-yellow-800/50',icon: <TrendingUp size={12} /> },
  ENCERRADO:        { label: 'Encerrado',         color: 'text-slate-400 bg-surface-300 border-surface-400',    icon: <XCircle size={12} /> },
  CANCELADO:        { label: 'Cancelado',         color: 'text-red-400 bg-red-900/30 border-red-800/50',        icon: <XCircle size={12} /> },
}

const MOTIVO_LABEL: Record<MotivoFim, string> = {
  '': '— Nenhum —', FIM_DO_PRAZO: 'Fim do prazo', CLIENTE_ENCERROU: 'Cliente encerrou',
  STOP_LOSS: 'Stop loss', META_ATINGIDA: 'Meta atingida', SAQUE_TOTAL: 'Saque total',
  CANCELADO: 'Cancelado', OUTRO: 'Outro',
}

const calcFields = (c: Omit<BancaContract, 'lucro'|'vlComissao'|'vlCliente'|'duracaoDias'>): BancaContract => {
  const lucro      = Math.max(0, c.bancaFinal - c.bancaInicial)
  const vlComissao = (lucro * c.comissaoPercent) / 100
  const vlCliente  = c.bancaFinal - vlComissao
  const ms = c.dataFinal ? new Date(c.dataFinal).getTime() - new Date(c.dataInicial).getTime() : Date.now() - new Date(c.dataInicial).getTime()
  return { ...c, lucro, vlComissao, vlCliente, duracaoDias: Math.max(1, Math.ceil(ms / 86_400_000)) }
}

export type ContractFormData = {
  userId: string; dataInicial: string; dataFinal: string
  bancaInicial: string; bancaFinal: string; comissaoPercent: string
  status: ContractStatus; motivoFim: MotivoFim; observacoes: string
}

const today = () => new Date().toISOString().split('T')[0]

export const emptyForm: ContractFormData = {
  userId: '', dataInicial: today(), dataFinal: '',
  bancaInicial: '', bancaFinal: '', comissaoPercent: '10',
  status: 'ATIVO', motivoFim: '', observacoes: '',
}

// ─── Componente principal ─────────────────────────────────────────────────────

export const BancaGerenciadaPage = () => {
  const { user: me } = useAuth()
  const isReadOnly = me?.role === 'TESTER'

  const [contracts,    setContracts]    = useState<BancaContract[]>([])
  const [users,        setUsers]        = useState<UserOption[]>([])
  const [loading,      setLoading]      = useState(true)
  const [saving,       setSaving]       = useState(false)
  const [search,       setSearch]       = useState('')
  const [filterStatus, setFilterStatus] = useState<ContractStatus | ''>('')

  const [addOpen,      setAddOpen]      = useState(false)
  const [editTarget,   setEditTarget]   = useState<BancaContract | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<BancaContract | null>(null)
  const [renewTarget,  setRenewTarget]  = useState<BancaContract | null>(null)

  const [addForm,  setAddForm]  = useState<ContractFormData>(emptyForm)
  const [editForm, setEditForm] = useState<ContractFormData>(emptyForm)

  const fmt = (v: number) => 
    v.toLocaleString(me?.language === 'PT-BR' ? 'pt-BR' : 'en-US', { 
      style: 'currency', 
      currency: me?.currency || 'BRL' 
    })

  const fmtDate = (d: string) => 
    new Date(d + (d.includes('T') ? '' : 'T00:00:00')).toLocaleDateString(me?.language === 'PT-BR' ? 'pt-BR' : 'en-US')

  // ── Helpers de update de form ─────────────────────────────────────────────
  const updateAdd  = (field: keyof ContractFormData, value: string) =>
    setAddForm(f => ({ ...f, [field]: value }))
  const updateEdit = (field: keyof ContractFormData, value: string) =>
    setEditForm(f => ({ ...f, [field]: value }))

  // ── Carregar ──────────────────────────────────────────────────────────────
  const loadAll = async () => {
    setLoading(true)
    try {
      const [cRes, uRes] = await Promise.all([api.get('/banca-contratos'), api.get('/users')])
      const contratosRaw = Array.isArray(cRes.data) ? cRes.data : (cRes.data?.data ?? cRes.data?.contratos ?? [])
      const usersRaw     = Array.isArray(uRes.data) ? uRes.data : (uRes.data?.data ?? uRes.data?.users ?? [])
      setContracts((contratosRaw as Omit<BancaContract,'lucro'|'vlComissao'|'vlCliente'|'duracaoDias'>[]).map(calcFields))
      setUsers(usersRaw)
    } catch {
      toast.error('Erro ao carregar contratos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [])

  // ── Stats ─────────────────────────────────────────────────────────────────
  const ativos          = contracts.filter(c => c.status === 'ATIVO').length
  const bancaTotal      = contracts.filter(c => c.status === 'ATIVO').reduce((a, c) => a + c.bancaFinal, 0)
  const totalComissao   = contracts.reduce((a, c) => a + c.vlComissao, 0)
  const lucroPlataforma = contracts.reduce((a, c) => a + c.lucro, 0)
  const lucroClientes   = contracts.reduce((a, c) => a + (c.vlCliente - c.bancaInicial), 0)

  const filtered = contracts.filter(c => {
    const t = search.toLowerCase()
    return (!t || c.userName.toLowerCase().includes(t) || c.userEmail.toLowerCase().includes(t) || (c.identificacao && c.identificacao.toLowerCase().includes(t))) &&
           (!filterStatus || c.status === filterStatus)
  })

  // ── Exportar CSV ──────────────────────────────────────────────────────────
  const exportCSV = () => {
    const header = ['Identificacao', 'Usuario', 'Email', 'Data Inicial', 'Data Final', 'Status', 'Motivo Fim', 'Banca Inicial', 'Banca Final', 'Lucro Gerado', 'Vl Cliente', 'Comissao Percentual']
    const rows = filtered.map(c => [
      c.identificacao || '',
      c.userName, c.userEmail, fmtDate(c.dataInicial), c.dataFinal ? fmtDate(c.dataFinal) : '',
      STATUS_CONFIG[c.status].label, c.motivoFim ? MOTIVO_LABEL[c.motivoFim] : '',
      c.bancaInicial, c.bancaFinal, c.lucro, c.vlCliente, c.comissaoPercent
    ])
    const csvContent = [header, ...rows].map(r => r.map(x => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `banca-gerenciada-${today()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Exportar PDF ──────────────────────────────────────────────────────────
  const exportPDF = () => {
    const win = window.open('', '_blank')
    if (!win) return
    const rowsHtml = filtered.map(c => `
      <tr>
        <td>${c.identificacao || '-'}</td>
        <td>${c.userName}<br/><small>${c.userEmail}</small></td>
        <td>${fmtDate(c.dataInicial)} ${c.dataFinal ? 'ate ' + fmtDate(c.dataFinal) : ''}</td>
        <td>${fmt(c.bancaInicial)}</td>
        <td>${fmt(c.bancaFinal)}</td>
        <td style="color:${c.lucro > 0 ? '#16a34a' : 'inherit'}; font-weight:bold">${fmt(c.lucro)}</td>
        <td>${STATUS_CONFIG[c.status].label}</td>
      </tr>`).join('')

    win.document.write(`
      <!DOCTYPE html><html><head>
      <meta charset="utf-8"/>
      <title>Banca Gerenciada — Full Green Bank</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 11px; color: #1e293b; }
        h1   { font-size: 18px; color: #166534; margin-bottom: 4px; }
        p    { color: #64748b; margin: 0 0 16px; font-size: 11px; }
        table { width: 100%; border-collapse: collapse; }
        th   { background: #166534; color: #fff; padding: 6px 8px; text-align: left; font-size: 10px; }
        td   { padding: 5px 8px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
        tr:nth-child(even) td { background: #f8fafc; }
        small { color: #94a3b8; }
        @media print { body { -webkit-print-color-adjust: exact; } }
      </style></head><body>
      <h1>🟢 Relatório: Banca Gerenciada — Full Green Bank</h1>
      <p>Gerado em ${new Date().toLocaleString(me?.language === 'PT-BR' ? 'pt-BR' : 'en-US')} · ${filtered.length} contratos listados</p>
      <table>
        <thead><tr>
          <th>Id.</th><th>Usuário / Email</th><th>Período</th>
          <th>B. Inicial</th><th>B. Final</th><th>Lucro</th><th>Status</th>
        </tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>
      <script>window.onload=()=>{window.print();window.close()}<\/script>
      </body></html>`)
    win.document.close()
  }

  // ── ADD ───────────────────────────────────────────────────────────────────
  const handleAdd = async (e: FormEvent) => {
    e.preventDefault()
    if (!addForm.userId || !addForm.bancaInicial) { toast.error('Preencha os campos obrigatórios.'); return }
    setSaving(true)
    
    // Calcula identificação do contrato Rais (ex: Contrato 01)
    const roots = contracts.filter(c => !c.parentId);
    let maxRoot = 0;
    roots.forEach(r => {
      if (r.identificacao && r.identificacao.startsWith('Contrato ')) {
        const num = parseInt(r.identificacao.replace('Contrato ', ''));
        if (!isNaN(num) && num > maxRoot) maxRoot = num;
      }
    });
    const identificacao = `Contrato ${String(maxRoot + 1).padStart(2, '0')}`;

    try {
      await api.post('/banca-contratos', {
        userId: addForm.userId, dataInicial: addForm.dataInicial, dataFinal: addForm.dataFinal || null,
        bancaInicial: Number(addForm.bancaInicial), bancaFinal: Number(addForm.bancaFinal || addForm.bancaInicial),
        comissaoPercent: Number(addForm.comissaoPercent), status: addForm.status,
        motivoFim: addForm.motivoFim || null, observacoes: addForm.observacoes,
        identificacao
      })
      toast.success('Contrato criado! ✓')
      if (me) addLog({ userEmail: me.email, userName: me.name, userRole: me.role, category: 'Financeiro', action: 'Contrato criado', detail: fmt(Number(addForm.bancaInicial)) })
      setAddOpen(false); setAddForm(emptyForm); loadAll()
    } catch { toast.error('Erro ao criar contrato.') }
    finally { setSaving(false) }
  }

  // ── EDIT ──────────────────────────────────────────────────────────────────
  const openEdit = (c: BancaContract) => {
    setEditTarget(c)
    setEditForm({
      userId: c.userId, dataInicial: c.dataInicial.split('T')[0],
      dataFinal: c.dataFinal ? c.dataFinal.split('T')[0] : '',
      bancaInicial: String(c.bancaInicial), bancaFinal: String(c.bancaFinal),
      comissaoPercent: String(c.comissaoPercent), status: c.status,
      motivoFim: c.motivoFim, observacoes: c.observacoes,
    })
  }

  const handleEdit = async (e: FormEvent) => {
    e.preventDefault()
    if (!editTarget) return
    setSaving(true)
    try {
      await api.patch(`/banca-contratos/${editTarget.id}`, {
        dataInicial: editForm.dataInicial, dataFinal: editForm.dataFinal || null,
        bancaInicial: Number(editForm.bancaInicial), bancaFinal: Number(editForm.bancaFinal),
        comissaoPercent: Number(editForm.comissaoPercent), status: editForm.status,
        motivoFim: editForm.motivoFim || null, observacoes: editForm.observacoes,
      })
      toast.success('Contrato atualizado! ✓')
      if (me) addLog({ userEmail: me.email, userName: me.name, userRole: me.role, category: 'Financeiro', action: 'Contrato editado', detail: editTarget.userName })
      setEditTarget(null); loadAll()
    } catch { toast.error('Erro ao atualizar.') }
    finally { setSaving(false) }
  }

  // ── DELETE ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return
    setSaving(true)
    try {
      await api.delete(`/banca-contratos/${deleteTarget.id}`)
      toast.success('Contrato excluído.')
      if (me) addLog({ userEmail: me.email, userName: me.name, userRole: me.role, category: 'Financeiro', action: 'Contrato excluído', detail: deleteTarget.userName })
      setDeleteTarget(null); loadAll()
    } catch { toast.error('Erro ao excluir.') }
    finally { setSaving(false) }
  }

  // ── RENOVAR ───────────────────────────────────────────────────────────────
  const handleRenew = async () => {
    if (!renewTarget) return
    setSaving(true)

    // Calcula a numeração do Filho (ex: Contrato 01.1)
    const parentIdent = renewTarget.identificacao || `Contrato ${renewTarget.id.slice(-2).toUpperCase()}`
    const subs = contracts.filter(c => c.parentId === renewTarget.id)
    let maxSub = 0
    subs.forEach(s => {
      if (s.identificacao) {
        const parts = s.identificacao.split('.')
        const num = parseInt(parts[parts.length - 1])
        if (!isNaN(num) && num > maxSub) maxSub = num
      }
    })
    const identificacao = `${parentIdent}.${maxSub + 1}`

    try {
      // 1. Finaliza o pai
      await api.patch(`/banca-contratos/${renewTarget.id}`, { status: 'FINALIZADO' })

      // 2. Cria o filho
      const novoValor = renewTarget.vlCliente > 0 ? renewTarget.vlCliente : renewTarget.bancaInicial
      await api.post('/banca-contratos', {
        userId: renewTarget.userId, dataInicial: today(), dataFinal: null,
        bancaInicial: novoValor, bancaFinal: novoValor,
        comissaoPercent: renewTarget.comissaoPercent, status: 'ATIVO',
        motivoFim: null, observacoes: '', // Usuário pediu pra parar de popular a observação caso seja filho
        parentId: renewTarget.parentId || renewTarget.id,
        identificacao
      })
      toast.success('Contrato renovado com sucesso! ✓')
      if (me) addLog({ userEmail: me.email, userName: me.name, userRole: me.role, category: 'Financeiro', action: 'Contrato renovado', detail: renewTarget.userName })
      setRenewTarget(null); loadAll()
    } catch { toast.error('Erro ao renovar.') }
    finally { setSaving(false) }
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6">

      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display font-semibold text-white">Banca Gerenciada</h2>
          <p className="text-xs text-slate-500 mt-0.5">Gestão de contratos de banca com comissão automática</p>
        </div>
        {!isReadOnly && (
          <button onClick={() => setAddOpen(true)} className="btn-primary flex items-center gap-2 shrink-0">
            <Plus size={15} />Novo Contrato
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-green-900/50 flex items-center justify-center"><Briefcase size={13} className="text-green-400" /></div>
            <span className="text-xs text-slate-500 uppercase tracking-wide">Contratos Ativos</span>
          </div>
          <p className="text-2xl font-bold text-white">{loading ? '—' : ativos}</p>
          <p className="text-xs text-slate-600 mt-1">{contracts.length} total</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-green-900/50 flex items-center justify-center"><DollarSign size={13} className="text-green-400" /></div>
            <span className="text-xs text-slate-500 uppercase tracking-wide">Banca Total Ativa</span>
          </div>
          <p className="text-2xl font-bold text-green-400">{loading ? '—' : fmt(bancaTotal)}</p>
          <p className="text-xs text-slate-600 mt-1">Soma contratos ativos</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-yellow-900/40 flex items-center justify-center"><Percent size={13} className="text-yellow-400" /></div>
            <span className="text-xs text-slate-500 uppercase tracking-wide">Comissão Acumulada</span>
          </div>
          <p className="text-2xl font-bold text-yellow-400">{loading ? '—' : fmt(totalComissao)}</p>
          <p className="text-xs text-slate-600 mt-1">Todos os contratos</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-green-900/50 flex items-center justify-center"><TrendingUp size={13} className="text-green-400" /></div>
            <span className="text-xs text-slate-500 uppercase tracking-wide">Lucro Plataforma</span>
          </div>
          <p className="text-2xl font-bold text-green-400">{loading ? '—' : fmt(lucroPlataforma)}</p>
          <p className="text-xs text-slate-600 mt-1">Lucro bruto gerado</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-blue-900/40 flex items-center justify-center"><Users size={13} className="text-blue-400" /></div>
            <span className="text-xs text-slate-500 uppercase tracking-wide">Lucro Clientes</span>
          </div>
          <p className={`text-2xl font-bold ${lucroClientes >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
            {loading ? '—' : fmt(Math.abs(lucroClientes))}
          </p>
          <p className="text-xs text-slate-600 mt-1">Valor líquido clientes</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input className="input-field pl-9 py-2 text-sm" placeholder="Buscar por nome ou e-mail..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="relative">
          <select className="input-field py-2 pr-8 text-sm appearance-none cursor-pointer"
            value={filterStatus} onChange={e => setFilterStatus(e.target.value as ContractStatus | '')}>
            <option value="">Todos os status</option>
            {(Object.keys(STATUS_CONFIG) as ContractStatus[]).map(s => (
              <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2 ml-auto w-full md:w-auto">
          <button onClick={exportCSV} className="flex-1 md:flex-none items-center justify-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-green-700/50 bg-green-900/30 text-green-400 hover:bg-green-900/50 transition-colors flex" title="Exportar Excel">
            <FileSpreadsheet size={13} /> Excel
          </button>
          <button onClick={exportPDF} className="flex-1 md:flex-none items-center justify-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-red-700/50 bg-red-900/30 text-red-400 hover:bg-red-900/50 transition-colors flex" title="Exportar PDF">
            <FileText size={13} /> PDF
          </button>
          <button onClick={() => window.print()} className="flex-1 md:flex-none items-center justify-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-blue-700/50 bg-blue-900/30 text-blue-400 hover:bg-blue-900/50 transition-colors flex" title="Imprimir">
            <Printer size={13} /> Imprimir
          </button>
        </div>
      </div>

      {/* Tabela */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="hidden xl:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr_120px] gap-3 px-5 py-3 border-b border-surface-300 text-xs text-slate-500 uppercase tracking-wide">
            <span>Usuário</span><span>Período</span><span>B. Inicial</span><span>B. Final</span>
            <span>Lucro</span><span>Comissão</span><span>Status</span><span className="text-right">Ações</span>
          </div>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Ban size={32} className="text-slate-600 mb-3" />
              <p className="text-slate-400 text-sm">Nenhum contrato encontrado</p>
              <p className="text-slate-600 text-xs mt-1">Crie um novo contrato ou ajuste os filtros</p>
            </div>
          ) : (
            (() => {
              const roots = filtered.filter(c => !c.parentId);
              const nodes: React.ReactNode[] = [];
              const handled = new Set<string>();
              roots.forEach(r => {
                const hasChild = contracts.some(x => x.parentId === r.id);
                nodes.push(<ContractRow key={r.id} contract={r} onEdit={openEdit} onDelete={setDeleteTarget} onRenew={setRenewTarget} hasChild={hasChild} isReadOnly={isReadOnly} fmt={fmt} fmtDate={fmtDate} />);
                handled.add(r.id);
                const subs = filtered.filter(c => c.parentId === r.id).sort((a,b) => new Date(a.dataInicial).getTime() - new Date(b.dataInicial).getTime());
                subs.forEach(s => {
                  const hasGrandChild = contracts.some(x => x.parentId === s.id);
                  nodes.push(<ContractRow key={s.id} contract={s} onEdit={openEdit} onDelete={setDeleteTarget} onRenew={setRenewTarget} hasChild={hasGrandChild} isSubcontract isReadOnly={isReadOnly} fmt={fmt} fmtDate={fmtDate} />);
                  handled.add(s.id);
                });
              });
              filtered.forEach(c => {
                if (!handled.has(c.id)) {
                  const hasChild = contracts.some(x => x.parentId === c.id);
                  nodes.push(<ContractRow key={c.id} contract={c} onEdit={openEdit} onDelete={setDeleteTarget} onRenew={setRenewTarget} hasChild={hasChild} isSubcontract={!!c.parentId} isReadOnly={isReadOnly} fmt={fmt} fmtDate={fmtDate} />);
                }
              });
              return nodes;
            })()
          )}
        </div>
      )}

      {/* Modal Novo */}
      <Modal isOpen={addOpen} onClose={() => { setAddOpen(false); setAddForm(emptyForm) }} title="Novo Contrato de Banca" size="md">
        <form onSubmit={handleAdd} className="flex flex-col gap-4">
          <ContractForm form={addForm} onChange={updateAdd} users={users} fmt={fmt} />
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => { setAddOpen(false); setAddForm(emptyForm) }} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Salvando...</> : '✓ Salvar Contrato'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Editar */}
      <Modal isOpen={!!editTarget} onClose={() => setEditTarget(null)} title="Editar Contrato" size="md">
        {editTarget && (
          <form onSubmit={handleEdit} className="flex flex-col gap-4">
            <ContractForm form={editForm} onChange={updateEdit} users={users} fmt={fmt} />
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setEditTarget(null)} className="btn-secondary flex-1">
                {isReadOnly ? 'Fechar' : 'Cancelar'}
              </button>
              {!isReadOnly && (
                <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {saving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Salvando...</> : '✓ Salvar Contrato'}
                </button>
              )}
            </div>
          </form>
        )}
      </Modal>

      {/* Modal Excluir */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Excluir Contrato" size="sm">
        {deleteTarget && (
          <div className="flex flex-col gap-4">
            <div className="bg-red-900/20 border border-red-800/40 rounded-lg px-4 py-3 flex items-start gap-3">
              <AlertTriangle size={16} className="text-red-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-white font-medium">Tem certeza que deseja excluir?</p>
                <p className="text-xs text-slate-400 mt-1">
                  Contrato de <strong className="text-white">{deleteTarget.userName}</strong>
                  {' · '}<strong className="text-white">{fmt(deleteTarget.bancaFinal)}</strong>
                </p>
                <p className="text-xs text-red-400 mt-1">Esta ação é irreversível.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={handleDelete} disabled={saving}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Trash2 size={14} />}
                Excluir
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Renovar */}
      <Modal isOpen={!!renewTarget} onClose={() => setRenewTarget(null)} title="Renovar Contrato" size="sm">
        {renewTarget && (
          <div className="flex flex-col gap-4">
            <div className="bg-surface-300/60 border border-surface-400 rounded-lg px-4 py-3">
              <p className="text-sm font-semibold text-white">{renewTarget.userName}</p>
              <p className="text-xs text-slate-500 mt-0.5">Novo ciclo será criado com os valores abaixo</p>
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-slate-500">Novo Valor Inicial</p>
                  <p className="text-green-400 font-bold font-mono text-sm">{fmt(renewTarget.vlCliente > 0 ? renewTarget.vlCliente : renewTarget.bancaInicial)}</p>
                </div>
                <div>
                  <p className="text-slate-500">Comissão mantida</p>
                  <p className="text-yellow-400 font-bold text-sm">{renewTarget.comissaoPercent}%</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setRenewTarget(null)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={handleRenew} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <RefreshCw size={14} />}
                Renovar
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

// ─── Preview de cálculos ───────────────────────────────────────────────────

interface PreviewProps { 
  bi: string; bf: string; cp: string; di: string; df: string;
  fmt: (v: number) => string 
}

const PreviewCalc = ({ bi, bf, cp, di, df, fmt }: PreviewProps) => {
  const bancaI = Number(bi)
  const bancaF = Number(bf || bi)
  const com    = Number(cp)
  if (!bancaI) return null
  const lucro = Math.max(0, bancaF - bancaI)
  const vlCom = (lucro * com) / 100
  const vlCli = bancaF - vlCom
  const ms    = df && di ? new Date(df).getTime() - new Date(di).getTime() : 0
  const dias  = ms > 0 ? Math.ceil(ms / 86_400_000) : null
  return (
    <div className="bg-surface-300/60 border border-surface-400 rounded-lg px-4 py-3">
      <p className="text-xs text-slate-500 mb-2.5 font-semibold uppercase tracking-wide">Prévia dos Cálculos</p>
      <div className="grid grid-cols-4 gap-3 text-xs">
        <div>
          <p className="text-slate-500 mb-0.5">Lucro</p>
          <p className={`font-bold font-mono text-sm ${lucro > 0 ? 'text-green-400' : 'text-slate-500'}`}>{lucro > 0 ? '+' : ''}{fmt(lucro)}</p>
        </div>
        <div>
          <p className="text-slate-500 mb-0.5">Vl. Comissão</p>
          <p className="text-yellow-400 font-bold font-mono text-sm">{fmt(vlCom)}</p>
        </div>
        <div>
          <p className="text-slate-500 mb-0.5">Vl. Cliente</p>
          <p className="text-white font-bold font-mono text-sm">{fmt(vlCli)}</p>
        </div>
        <div>
          <p className="text-slate-500 mb-0.5">Duração</p>
          <p className="text-slate-300 font-bold text-sm">{dias ? `${dias} dias` : '—'}</p>
        </div>
      </div>
    </div>
  )
}

// ─── Formulário de contrato ──────────────────────────────────────────────────

interface ContractFormProps {
  form: ContractFormData
  onChange: (field: keyof ContractFormData, value: string) => void
  users: UserOption[]
  fmt: (v: number) => string
}

const ContractForm = ({ form, onChange, users, fmt }: ContractFormProps) => (
  <div className="flex flex-col gap-4">
    <div>
      <label className="label">Usuário *</label>
      <select className="input-field" value={form.userId} onChange={e => onChange('userId', e.target.value)} required>
        <option value="">— Selecione o usuário —</option>
        {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
      </select>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="label">Data Inicial *</label>
        <input type="date" className="input-field" value={form.dataInicial} onChange={e => onChange('dataInicial', e.target.value)} required />
      </div>
      <div>
        <label className="label">Data Final</label>
        <input type="date" className="input-field" value={form.dataFinal} onChange={e => onChange('dataFinal', e.target.value)} />
      </div>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="label">Banca Inicial *</label>
        <input type="number" min="0.01" step="0.01" className="input-field" placeholder="Ex: 1000.00"
          value={form.bancaInicial} onChange={e => onChange('bancaInicial', e.target.value)} required />
      </div>
      <div>
        <label className="label">Banca Final</label>
        <input type="number" min="0" step="0.01" className="input-field" placeholder="Ex: 1500.00"
          value={form.bancaFinal} onChange={e => onChange('bancaFinal', e.target.value)} />
      </div>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="label">Comissão (%) *</label>
        <input type="number" min="0" max="100" step="0.1" className="input-field"
          value={form.comissaoPercent} onChange={e => onChange('comissaoPercent', e.target.value)} required />
      </div>
      <div>
        <label className="label">Status *</label>
        <select className="input-field" value={form.status} onChange={e => onChange('status', e.target.value)}>
          {(Object.keys(STATUS_CONFIG) as ContractStatus[]).map(s => (
            <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
          ))}
        </select>
      </div>
    </div>
    <div>
      <label className="label">Motivo do Fim</label>
      <select className="input-field" value={form.motivoFim} onChange={e => onChange('motivoFim', e.target.value)}>
        {(Object.keys(MOTIVO_LABEL) as MotivoFim[]).map(m => (
          <option key={m} value={m}>{MOTIVO_LABEL[m]}</option>
        ))}
      </select>
    </div>
    <div>
      <label className="label">Observações</label>
      <textarea className="input-field resize-none" rows={3} placeholder="Anotações sobre o contrato..."
        value={form.observacoes} onChange={e => onChange('observacoes', e.target.value)} />
    </div>
    <PreviewCalc bi={form.bancaInicial} bf={form.bancaFinal} cp={form.comissaoPercent} di={form.dataInicial} df={form.dataFinal} fmt={fmt} />
  </div>
)

// ─── Row da tabela ───────────────────────────────────────────────────────────

interface RowProps {
  contract: BancaContract
  onEdit: (c: BancaContract) => void
  onDelete: (c: BancaContract) => void
  onRenew: (c: BancaContract) => void
  isReadOnly?: boolean
  isSubcontract?: boolean
  hasChild?: boolean
  fmt: (v: number) => string
  fmtDate: (d: string) => string
}

const ContractRow = ({ contract: c, onEdit, onDelete, onRenew, isReadOnly, isSubcontract, hasChild, fmt, fmtDate }: RowProps) => {
  const st = STATUS_CONFIG[c.status] || STATUS_CONFIG.ENCERRADO
  const encerrado = c.status !== 'ATIVO' && c.status !== 'AGUARDANDO_SAQUE'
  const dobrouBanca = c.bancaFinal >= c.bancaInicial * 2 && c.bancaInicial > 0;
  return (
    <div className={`px-5 py-4 border-b border-surface-300 last:border-0 hover:bg-surface-300/30 transition-colors group ${isSubcontract ? 'pl-10 lg:pl-16 bg-surface-300/10 border-l-4 border-l-slate-700' : ''}`}>
      <div className="flex flex-col xl:grid xl:grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr_160px] gap-2 xl:gap-3 xl:items-center">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            {c.identificacao && (
              <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${isSubcontract ? 'bg-slate-700/50 border border-slate-600/50 text-slate-300' : 'bg-surface-400 border border-surface-500 text-white'}`}>
                {c.identificacao}
              </span>
            )}
            <p className="text-sm font-medium text-white truncate">{c.userName}</p>
          </div>
          <p className="text-xs text-slate-500 truncate">{c.userEmail}</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <CalendarDays size={11} className="text-slate-600 shrink-0" />
          <span>{fmtDate(c.dataInicial)}{c.dataFinal ? ` → ${fmtDate(c.dataFinal)}` : ''}</span>
        </div>
        <span className="text-sm text-slate-400 font-mono">{fmt(c.bancaInicial)}</span>
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-sm text-white font-mono font-medium truncate">{fmt(c.bancaFinal)}</span>
          {dobrouBanca && (
            <span title="Banca Inicial Dobrada!" className="shrink-0 inline-flex items-center justify-center bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-1.5 py-0.5 rounded border border-emerald-500/30">
              🚀 100%
            </span>
          )}
        </div>
        <span className={`text-sm font-mono font-medium ${c.lucro > 0 ? 'text-green-400' : 'text-slate-500'}`}>
          {c.lucro > 0 ? '+' : ''}{fmt(c.lucro)}
        </span>
        <span className="text-sm text-yellow-400 font-mono">
          {fmt(c.vlComissao)}<span className="text-slate-600 text-xs ml-1">({c.comissaoPercent}%)</span>
        </span>
        <div>
          <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${st.color}`}>
            {st.icon}{st.label}
          </span>
          {c.motivoFim && <p className="text-[10px] text-slate-600 mt-1">{MOTIVO_LABEL[c.motivoFim]}</p>}
        </div>
        <div className="flex items-center gap-1.5 xl:justify-end">
          <button onClick={() => onEdit(c)} title={isReadOnly ? 'Visualizar' : 'Editar'}
            className="flex items-center gap-1.5 text-xs text-slate-300 border border-surface-400 bg-surface-300 px-2.5 py-1.5 rounded hover:border-green-700/50 hover:text-green-400 transition-colors">
            {isReadOnly ? <Eye size={11} /> : <Edit2 size={11} />}
            <span className="hidden sm:inline">{isReadOnly ? 'Visualizar' : 'Editar'}</span>
          </button>
          {!isReadOnly && (
            <>
              <button onClick={() => onDelete(c)} title="Excluir"
                className="flex items-center gap-1.5 text-xs text-slate-400 border border-surface-400 bg-surface-300 px-2.5 py-1.5 rounded hover:border-red-700/50 hover:text-red-400 transition-colors">
                <Trash2 size={11} /><span className="hidden sm:inline">Excluir</span>
              </button>
              {!hasChild && !encerrado && (
                <button onClick={() => onRenew(c)} title="Renovar Contrato"
                  className="flex items-center gap-1.5 text-xs text-green-400 border border-green-800/50 bg-green-900/30 px-2.5 py-1.5 rounded hover:bg-green-800/50 transition-colors">
                  <RefreshCw size={11} /><span className="hidden sm:inline">Renovar</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
