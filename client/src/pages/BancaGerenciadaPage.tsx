import { useEffect, useState, FormEvent } from 'react'
import {
  Briefcase, TrendingUp, DollarSign, Percent,
  Plus, Edit2, Trash2, RefreshCw, AlertTriangle,
  CheckCircle, XCircle, Clock, Search, Ban, Users,
  CalendarDays, FileSpreadsheet, FileText, Printer, Eye,
} from 'lucide-react'
import { Modal } from '../components/ui/Modal'
import { useAuth } from '../contexts/AuthContext'
import { addLog } from '../services/log.service'
import api from '../services/api'
import toast from 'react-hot-toast'
import { CurrencyInput } from '../components/ui/CurrencyInput'

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
  ATIVO:            { label: 'Ativo',            color: 'text-emerald-700 bg-emerald-50 border-emerald-100', icon: <CheckCircle size={12} /> },
  AGUARDANDO_SAQUE: { label: 'Aguardando saque', color: 'text-blue-700 bg-blue-50 border-blue-100',       icon: <Clock size={12} /> },
  FINALIZADO:       { label: 'Finalizado',        color: 'text-amber-700 bg-amber-50 border-amber-100', icon: <TrendingUp size={12} /> },
  ENCERRADO:        { label: 'Encerrado',         color: 'text-slate-500 bg-slate-50 border-slate-100',     icon: <XCircle size={12} /> },
  CANCELADO:        { label: 'Cancelado',         color: 'text-rose-700 bg-rose-50 border-rose-100',         icon: <XCircle size={12} /> },
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
  const safeContracts = Array.isArray(contracts) ? contracts : []
  const ativos          = safeContracts.filter(c => c.status === 'ATIVO').length
  const bancaTotal      = safeContracts.filter(c => c.status === 'ATIVO').reduce((a, c) => a + c.bancaFinal, 0)
  const totalComissao   = safeContracts.reduce((a, c) => a + c.vlComissao, 0)
  const lucroPlataforma = safeContracts.reduce((a, c) => a + c.lucro, 0)
  const lucroClientes   = safeContracts.reduce((a, c) => a + (c.vlCliente - c.bancaInicial), 0)

  const filtered = safeContracts.filter(c => {
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
          <h2 className="font-display font-bold text-slate-800 text-2xl">Banca Gerenciada</h2>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Gestão de contratos de banca com comissão automática</p>
        </div>
        {!isReadOnly && (
          <button onClick={() => setAddOpen(true)} className="btn-primary flex items-center gap-2 shrink-0">
            <Plus size={15} />Novo Contrato
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm transition-all hover:border-emerald-500/30">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100"><Briefcase size={14} className="text-slate-400" /></div>
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Contratos Ativos</span>
          </div>
          <p className="text-2xl font-display font-bold text-slate-800">{loading ? '—' : ativos}</p>
          <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-tighter">{contracts.length} total</p>
        </div>
        <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm transition-all hover:border-emerald-500/30">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100"><DollarSign size={14} className="text-emerald-600" /></div>
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Banca Total Ativa</span>
          </div>
          <p className="text-2xl font-display font-bold text-emerald-600 font-mono">{loading ? '—' : fmt(bancaTotal)}</p>
          <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-tighter">Soma contratos ativos</p>
        </div>
        <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm transition-all hover:border-emerald-500/30">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-100"><Percent size={14} className="text-amber-600" /></div>
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Comissão Acumulada</span>
          </div>
          <p className="text-2xl font-display font-bold text-amber-600 font-mono">{loading ? '—' : fmt(totalComissao)}</p>
          <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-tighter">Todos os contratos</p>
        </div>
        <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm transition-all hover:border-emerald-500/30">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100"><TrendingUp size={14} className="text-emerald-600" /></div>
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Lucro Plataforma</span>
          </div>
          <p className="text-2xl font-display font-bold text-emerald-600 font-mono">{loading ? '—' : fmt(lucroPlataforma)}</p>
          <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-tighter">Lucro bruto gerado</p>
        </div>
        <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm transition-all hover:border-emerald-500/30">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100"><Users size={14} className="text-blue-600" /></div>
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Lucro Clientes</span>
          </div>
          <p className={`text-2xl font-display font-bold font-mono ${lucroClientes >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
            {loading ? '—' : fmt(Math.abs(lucroClientes))}
          </p>
          <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-tighter">Valor líquido clientes</p>
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
          <button onClick={exportCSV} className="flex-1 md:flex-none items-center justify-center gap-1.5 text-[10px] font-black px-4 py-2 rounded-xl border border-emerald-100 bg-white text-emerald-600 hover:bg-emerald-50 transition-all uppercase tracking-widest shadow-sm" title="Exportar Excel">
            <FileSpreadsheet size={13} /> Excel
          </button>
          <button onClick={exportPDF} className="flex-1 md:flex-none items-center justify-center gap-1.5 text-[10px] font-black px-4 py-2 rounded-xl border border-rose-100 bg-white text-rose-600 hover:bg-rose-50 transition-all uppercase tracking-widest shadow-sm" title="Exportar PDF">
            <FileText size={13} /> PDF
          </button>
          <button onClick={() => window.print()} className="flex-1 md:flex-none items-center justify-center gap-1.5 text-[10px] font-black px-4 py-2 rounded-xl border border-blue-100 bg-white text-blue-600 hover:bg-blue-50 transition-all uppercase tracking-widest shadow-sm" title="Imprimir">
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
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="hidden xl:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr_120px] gap-3 px-8 py-5 border-b border-slate-50 text-[10px] font-black text-slate-300 uppercase tracking-widest">
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
            <div className="bg-rose-50 border border-rose-100 rounded-[1.5rem] px-5 py-4 flex items-start gap-4">
              <AlertTriangle size={18} className="text-rose-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-slate-800 font-black uppercase tracking-widest">Tem certeza que deseja excluir?</p>
                <p className="text-[11px] text-slate-500 mt-1 font-bold">
                  Contrato de <strong className="text-slate-800">{deleteTarget.userName}</strong>
                  {' · '}<strong className="text-slate-800">{fmt(deleteTarget.bancaFinal)}</strong>
                </p>
                <p className="text-[10px] text-rose-600 mt-2 font-black uppercase tracking-tighter">Esta ação é irreversível.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={handleDelete} disabled={saving}
                className="flex-1 px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20 active:scale-95">
                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Trash2 size={14} />}
                Excluir Now
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Renovar */}
      <Modal isOpen={!!renewTarget} onClose={() => setRenewTarget(null)} title="Renovar Contrato" size="sm">
        {renewTarget && (
          <div className="flex flex-col gap-4">
            <div className="bg-slate-50 border border-slate-100 rounded-[1.5rem] px-5 py-5">
              <p className="text-sm font-bold text-slate-800">{renewTarget.userName}</p>
              <p className="text-[10px] text-slate-400 mt-1 font-black uppercase tracking-widest">Novo ciclo será criado com os valores abaixo</p>
              <div className="mt-5 grid grid-cols-2 gap-4 text-[10px] font-black uppercase tracking-widest">
                <div>
                  <p className="text-slate-300 mb-1">Novo Valor Inicial</p>
                  <p className="text-emerald-600 font-mono text-sm">{fmt(renewTarget.vlCliente > 0 ? renewTarget.vlCliente : renewTarget.bancaInicial)}</p>
                </div>
                <div>
                  <p className="text-slate-300 mb-1">Comissão mantida</p>
                  <p className="text-amber-600 text-sm">{renewTarget.comissaoPercent}%</p>
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
    <div className="bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 mt-2">
      <p className="text-[10px] text-slate-300 mb-3 font-black uppercase tracking-widest">Prévia dos Cálculos</p>
      <div className="grid grid-cols-4 gap-4 text-[10px] font-black uppercase tracking-widest">
        <div>
          <p className="text-slate-300 mb-1">Lucro</p>
          <p className={`font-mono text-xs ${lucro > 0 ? 'text-emerald-500' : 'text-slate-400'}`}>{lucro > 0 ? '+' : ''}{fmt(lucro)}</p>
        </div>
        <div>
          <p className="text-slate-300 mb-1">Vl. Comissão</p>
          <p className="text-amber-500 font-mono text-xs">{fmt(vlCom)}</p>
        </div>
        <div>
          <p className="text-slate-300 mb-1">Vl. Cliente</p>
          <p className="text-slate-700 font-mono text-xs">{fmt(vlCli)}</p>
        </div>
        <div>
          <p className="text-slate-300 mb-1">Duração</p>
          <p className="text-slate-600 text-xs">{dias ? `${dias} dias` : '—'}</p>
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
        <CurrencyInput
          value={form.bancaInicial ? Number(form.bancaInicial) : 0}
          onChange={(v) => onChange('bancaInicial', String(v))}
          alertLimit={1000}
          className="w-full"
        />
      </div>
      <div>
        <label className="label">Banca Final</label>
        <CurrencyInput
          value={form.bancaFinal ? Number(form.bancaFinal) : 0}
          onChange={(v) => onChange('bancaFinal', String(v))}
          alertLimit={1000}
          className="w-full"
        />
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
    <div className={`px-8 py-5 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors group ${isSubcontract ? 'pl-20 bg-slate-50/20 border-l-4 border-l-emerald-500' : ''}`}>
      <div className="flex flex-col xl:grid xl:grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr_160px] gap-2 xl:gap-3 xl:items-center">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {c.identificacao && (
              <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${isSubcontract ? 'bg-slate-100/50 border border-slate-200/50 text-slate-400' : 'bg-slate-800 text-white'}`}>
                {c.identificacao}
              </span>
            )}
            <p className="text-sm font-bold text-slate-800 truncate">{c.userName}</p>
          </div>
          <p className="text-[10px] font-bold text-slate-400 truncate tracking-tight">{c.userEmail}</p>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400">
          <CalendarDays size={13} className="text-slate-300 shrink-0" />
          <span>{fmtDate(c.dataInicial)}{c.dataFinal ? ` → ${fmtDate(c.dataFinal)}` : ''}</span>
        </div>
        <span className="text-sm text-slate-400 font-mono font-bold">{fmt(c.bancaInicial)}</span>
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm text-slate-800 font-mono font-black truncate">{fmt(c.bancaFinal)}</span>
          {dobrouBanca && (
            <span title="Banca Inicial Dobrada!" className="shrink-0 inline-flex items-center justify-center bg-emerald-50 text-emerald-600 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-100">
              🚀 100%
            </span>
          )}
        </div>
        <span className={`text-sm font-mono font-black ${c.lucro > 0 ? 'text-emerald-600' : 'text-slate-300'}`}>
          {c.lucro > 0 ? '+' : ''}{fmt(c.lucro)}
        </span>
        <span className="text-sm text-amber-600 font-mono font-black">
          {fmt(c.vlComissao)}<span className="text-slate-300 text-[10px] ml-1 font-bold">({c.comissaoPercent}%)</span>
        </span>
        <div>
          <span className={`inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border ${st.color}`}>
            {st.label}
          </span>
          {c.motivoFim && <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">{MOTIVO_LABEL[c.motivoFim]}</p>}
        </div>
        <div className="flex items-center gap-2 xl:justify-end">
          <button onClick={() => onEdit(c)} title={isReadOnly ? 'Visualizar' : 'Editar'}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 border border-slate-100 bg-white px-3 py-2 rounded-xl hover:border-emerald-500/30 hover:text-emerald-600 transition-all shadow-sm">
            {isReadOnly ? <Eye size={12} /> : <Edit2 size={12} />}
            <span className="hidden sm:inline">{isReadOnly ? 'Ver' : 'Editar'}</span>
          </button>
          {!isReadOnly && (
            <>
              <button onClick={() => onDelete(c)} title="Excluir"
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-300 border border-slate-100 bg-white px-3 py-2 rounded-xl hover:border-rose-500/30 hover:text-rose-600 transition-all shadow-sm">
                <Trash2 size={12} /><span className="hidden sm:inline">Excluir</span>
              </button>
              {!hasChild && !encerrado && (
                <button onClick={() => onRenew(c)} title="Renovar Contrato"
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-600 border border-emerald-100 bg-emerald-50 px-3 py-2 rounded-xl hover:bg-emerald-100 transition-all shadow-sm">
                  <RefreshCw size={12} />
                  <span className="hidden sm:inline">Renovar</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
