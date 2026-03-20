import { useEffect, useState, FormEvent } from 'react'
import { 
  Users, AlertTriangle, 
  TrendingUp, Edit2, Search, 
  CheckCircle, Ban, Hourglass, ClipboardList,
  FileSpreadsheet, FileText, Printer,
  CreditCard, Wallet, CircleEllipsis,
} from 'lucide-react'
import { Modal } from '../components/ui/Modal'
import { useAuth } from '../contexts/AuthContext'
import { addLog } from './SystemLogPage'
import { usersService } from '../services/users.service'
import api from '../services/api'
import toast from 'react-hot-toast'
import { formatCurrency as fmt } from '../utils/formatters'
import { checkSubscription, createPayment } from '../utils/subscription'

// ─── Tipos ──────────────────────────────────────────────────────────────────

type PaymentStatus = 'ATIVO' | 'PENDENTE' | 'ATRASADO' | 'CANCELADO'
type PlanType      = 'STARTER' | 'STANDARD' | 'PRO'
type PayMethod     = 'PIX' | 'CARTAO' | 'BOLETO' | 'TRANSFERENCIA' | ''

interface UserPayment {
  id: string
  name: string
  email: string
  role: string
  plan: PlanType
  value: number | null
  payMethod: PayMethod
  purchaseDate: string | null
  lastPaymentDate: string | null
  dueDate: string | null
  status: PaymentStatus
  notes: string
}

// ─── Helpers visuais ─────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<PaymentStatus, { label: string; color: string; icon: React.ReactNode }> = {
  ATIVO:     { label: 'PAGO',      color: 'bg-green-500/10 text-green-500 border-green-500/20',  icon: <CheckCircle size={12} /> },
  PENDENTE:  { label: 'PENDENTE',  color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', icon: <Hourglass size={12} /> },
  ATRASADO:  { label: 'ATRASADO',  color: 'bg-red-500/10 text-red-500 border-red-500/20',        icon: <AlertTriangle size={12} /> },
  CANCELADO: { label: 'CANCELADO', color: 'bg-surface-300 text-slate-400 border-surface-400',    icon: <Ban size={12} /> },
}

const PLAN_CONFIG: Record<PlanType, { label: string; color: string }> = {
  STARTER:  { label: 'STARTER', color: 'bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400' },
  STANDARD: { label: 'STANDARD',color: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20 dark:text-indigo-400' },
  PRO:      { label: 'PRO',     color: 'bg-orange-500/10 text-orange-600 border-orange-500/20 dark:text-orange-400' },
}

const PAY_METHOD_LABEL: Record<PayMethod, string> = {
  PIX:          'PIX',
  CARTAO:       'Cartão',
  BOLETO:       'Boleto',
  TRANSFERENCIA:'Transferência',
  '':           '—',
}

const formatDate = (d: string | null) =>
  d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') : '—'

// ─── Formulário vazio ────────────────────────────────────────────────────────

const emptyEdit = {
  plan: 'STARTER' as PlanType,
  value: '',
  payMethod: '' as PayMethod,
  dueDate: '',
  status: 'PENDENTE' as PaymentStatus,
  notes: '',
}

// ─── Componente principal ────────────────────────────────────────────────────

export const FinanceiroPagamentosPage = () => {
  const { user: me } = useAuth()
  const isReadOnly = me?.role === 'TESTER'

  const [users,       setUsers]       = useState<UserPayment[]>([])
  const [loading,     setLoading]     = useState(true)
  const [saving,      setSaving]      = useState(false)

  // Filtros
  const [search,       setSearch]       = useState('')
  const [filterStatus, setFilterStatus] = useState<PaymentStatus | ''>('')
  const [filterPlan,   setFilterPlan]   = useState<PlanType | ''>('')

  // Modal edição
  const [editTarget, setEditTarget] = useState<UserPayment | null>(null)
  const [editForm,   setEditForm]   = useState(emptyEdit)
  const [historyTarget, setHistoryTarget] = useState<UserPayment | null>(null)

  // ── Carregar usuários ──────────────────────────────────────────────────────
  const loadUsers = async () => {
    setLoading(true)
    try {
      const data = await usersService.getAll()
      // Filtro: Apenas usuários "MEMBRO"
      const members = data.filter((u: any) => u.role === 'MEMBRO' || (!u.role && u.email !== 'admin@fullgreenbank.com'))
      
      const mapped: UserPayment[] = members.map((u: any) => {
        // RULE 2 & 5: Use checkSubscription for consistent status logic
        const { status } = checkSubscription({
          role: u.role,
          paymentStatus: u.paymentStatus,
          dueDate: u.dueDate,
        })

        return {
          id:              u.id,
          name:            u.name,
          email:           u.email,
          role:            u.role || 'MEMBRO',
          plan:            (u.plan ?? 'STARTER') as PlanType,
          value:           u.value ?? null,
          payMethod:       (u.payMethod ?? '') as PayMethod,
          purchaseDate:    u.purchaseDate    ?? null,
          lastPaymentDate: u.lastPaymentDate ?? null,
          dueDate:         u.dueDate         ?? null,
          status:          status as PaymentStatus,
          notes:           u.notes           ?? '',
        }
      })
      setUsers(mapped)
    } catch {
      toast.error('Erro ao carregar usuários.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadUsers() }, [])

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalUsers  = users.length
  const ativos      = users.filter(u => u.status === 'ATIVO').length
  const pendentes   = users.filter(u => u.status === 'PENDENTE').length
  const atrasados   = users.filter(u => u.status === 'ATRASADO').length
  const receitaMes  = users
    .filter(u => u.status === 'ATIVO' && u.value != null)
    .reduce((acc, u) => acc + (u.value ?? 0), 0)

  // ── Filtro ─────────────────────────────────────────────────────────────────
  const filtered = users.filter(u => {
    const term = search.toLowerCase()
    const matchSearch = !term || u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term)
    const matchStatus = !filterStatus || u.status === filterStatus
    const matchPlan   = !filterPlan   || u.plan   === filterPlan
    return matchSearch && matchStatus && matchPlan
  })

  // ── Exportar CSV ──────────────────────────────────────────────────────────
  const exportCSV = () => {
    const header = ['Usuario', 'Email', 'Tipo de Conta', 'Plano', 'Valor', 'Forma Pagamento', 'Vencimento', 'Status', 'Observacoes']
    const rows = filtered.map(u => [
      u.name, u.email,
      (u.role === 'ADMIN' || u.role === 'MASTER') ? 'Admin' : 'Membro',
      PLAN_CONFIG[u.plan].label,
      u.value !== null ? u.value : '',
      PAY_METHOD_LABEL[u.payMethod] || '',
      u.dueDate ? formatDate(u.dueDate) : '',
      STATUS_CONFIG[u.status].label,
      u.notes || ''
    ])
    const csvContent = [header, ...rows].map(r => r.map(x => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pagamentos-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Exportar PDF ──────────────────────────────────────────────────────────
  const exportPDF = () => {
    const win = window.open('', '_blank')
    if (!win) return
    const rowsHtml = filtered.map(u => `
      <tr>
        <td>${u.name}<br/><small>${u.email}</small></td>
        <td>${(u.role === 'ADMIN' || u.role === 'MASTER') ? 'Admin' : 'Membro'}</td>
        <td>${PLAN_CONFIG[u.plan].label}</td>
        <td>${u.value != null ? fmt(u.value) : '-'}</td>
        <td>${PAY_METHOD_LABEL[u.payMethod] || '-'}</td>
        <td>${u.dueDate ? formatDate(u.dueDate) : '-'}</td>
        <td>${STATUS_CONFIG[u.status].label}</td>
      </tr>`).join('')

    win.document.write(`
      <!DOCTYPE html><html><head>
      <meta charset="utf-8"/>
      <title>Pagamentos — Full Green Bank</title>
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
      <h1>🟢 Relatório: Pagamentos — Full Green Bank</h1>
      <p>Gerado em ${new Date().toLocaleString(me?.language === 'PT-BR' ? 'pt-BR' : 'en-US')} · ${filtered.length} usuários listados</p>
      <table>
        <thead><tr>
          <th>Usuário / Email</th><th>Tipo</th><th>Plano</th>
          <th>Valor</th><th>Pagamento</th><th>Vencimento</th><th>Status</th>
        </tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>
      <script>window.onload=()=>{window.print();window.close()}<\/script>
      </body></html>`)
    win.document.close()
  }

  // ── Modal edição ───────────────────────────────────────────────────────────
  const openEdit = (u: UserPayment) => {
    if (isReadOnly) return
    setEditTarget(u)
    setEditForm({
      plan:      u.plan,
      value:     u.value != null ? String(u.value) : '',
      payMethod: u.payMethod,
      dueDate:   u.dueDate ?? '',
      status:    u.status,
      notes:     u.notes,
    })
  }

  const closeEdit = () => { setEditTarget(null); setEditForm(emptyEdit); }

  const setF = (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setEditForm(f => ({ ...f, [field]: e.target.value }))

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    if (!editTarget) return
    setSaving(true)
    
    try {
      let payload: Record<string, any> = {
        plan:      editForm.plan,
        value:     editForm.value !== '' ? Number(editForm.value) : null,
        payMethod: editForm.payMethod || null,
        dueDate:   editForm.dueDate   || null,
        paymentStatus: editForm.status,
        notes:     editForm.notes,
      }

      // RULE 1 & 3: Use createPayment() when confirming payment (ATIVO)
      if (editForm.status === 'ATIVO') {
        const paymentData = createPayment({
          plan:      editForm.plan,
          value:     editForm.value !== '' ? Number(editForm.value) : null,
          payMethod: editForm.payMethod || undefined,
          notes:     editForm.notes,
        })
        // Append payment history entry to notes
        const today = new Date().toISOString().split('T')[0]
        const historyEntry = `PAG:${today}|VENC:${paymentData.dueDate}|PLAN:${editForm.plan}`
        paymentData.notes = paymentData.notes
          ? `${paymentData.notes}\n${historyEntry}`
          : historyEntry

        payload = { ...payload, ...paymentData }
      } else {
        // RULE 2: If setting non-ATIVO status, clear isActive
        payload.isActive = false
      }

      await api.patch(`/users/${editTarget.id}/profile`, payload)
      
      toast.success('Pagamento atualizado com sucesso! ✓')
      if (me) addLog({
        userEmail: me.email,
        userName:  me.name,
        userRole:  me.role,
        category: 'Financeiro',
        action:   'Pagamento editado',
        detail:   `${editTarget.name} · Plano: ${editForm.plan} · Status: ${editForm.status}`,
      })
      closeEdit()
      loadUsers()
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar alterações.')
    } finally {
      setSaving(false)
    }
  }

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6">

      {/* Cabeçalho */}
      <div>
        <h2 className="font-display font-semibold text-white">Pagamentos</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Gerencie assinaturas e pagamentos de todos os usuários
        </p>
      </div>

      {/* ── Stats Cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users size={14} className="text-slate-400" />
            <span className="text-xs text-slate-500 uppercase tracking-wide">Total Usuários</span>
          </div>
          <p className="text-2xl font-bold text-white">{loading ? '—' : totalUsers}</p>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle size={14} className="text-green-400" />
            <span className="text-xs text-slate-500 uppercase tracking-wide">Ativos</span>
          </div>
          <p className="text-2xl font-bold text-green-400">{loading ? '—' : ativos}</p>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Hourglass size={14} className="text-yellow-400" />
            <span className="text-xs text-slate-500 uppercase tracking-wide">Pendentes</span>
          </div>
          <p className="text-2xl font-bold text-yellow-400">{loading ? '—' : pendentes}</p>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={14} className="text-red-400" />
            <span className="text-xs text-slate-500 uppercase tracking-wide">Atrasados</span>
          </div>
          <p className="text-2xl font-bold text-red-400">{loading ? '—' : atrasados}</p>
        </div>

        <div className="card p-4 col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={14} className="text-green-400" />
            <span className="text-xs text-slate-500 uppercase tracking-wide">Receita Mensal</span>
          </div>
                <p className="text-xl font-bold font-mono text-emerald-400">
                  {fmt(receitaMes)}
                </p>
        </div>
      </div>

      {/* ── Filtros e Ações ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Pesquise por nome, email ou ID..."
            className="input-field pl-10 h-11 bg-surface-300/50 border-surface-300"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <select 
          className="input-field w-auto min-w-[150px] h-11 bg-surface-300/50 border-surface-300 text-sm cursor-pointer" 
          value={filterPlan} 
          onChange={e => setFilterPlan(e.target.value as PlanType | '')}
        >
          <option value="">Todos os planos</option>
          {Object.keys(PLAN_CONFIG).map(p => (
            <option key={p} value={p}>{PLAN_CONFIG[p as PlanType].label}</option>
          ))}
        </select>

        <select 
          className="input-field w-auto min-w-[150px] h-11 bg-surface-300/50 border-surface-300 text-sm cursor-pointer" 
          value={filterStatus} 
          onChange={e => setFilterStatus(e.target.value as PaymentStatus | '')}
        >
          <option value="">Todos os status</option>
          {(Object.keys(STATUS_CONFIG) as PaymentStatus[]).map(s => (
            <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
          ))}
        </select>

        <select className="input-field w-auto h-11 bg-surface-300/50 border-surface-300 text-sm cursor-pointer">
          <option>Hoje</option>
          <option>Ontem</option>
          <option>Últimos 7 dias</option>
          <option>Este mês</option>
        </select>

        <div className="flex items-center gap-2 ml-auto">
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-lg text-xs font-bold hover:bg-emerald-500/20 transition-colors h-11">
            <FileSpreadsheet size={16} />
            Excel
          </button>
          <button onClick={exportPDF} className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-lg text-xs font-bold hover:bg-rose-500/20 transition-colors h-11">
            <FileText size={16} />
            PDF
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 rounded-lg text-xs font-bold hover:bg-indigo-500/20 transition-colors h-11">
            <Printer size={16} />
            Imprimir
          </button>
        </div>
      </div>

      {/* ── Tabela ───────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="card overflow-hidden">
          {/* Header da tabela consolidado */}
          <div className="hidden md:grid grid-cols-[2fr_120px_120px_1.5fr_120px_1.5fr_150px_80px] gap-4 px-6 py-4 bg-surface-300/30 border-b border-surface-300 text-[10px] font-bold text-slate-500 uppercase tracking-widest items-center">
            <span>Usuário</span>
            <span>Plano</span>
            <span>Valor</span>
            <span>Forma de Pagamento</span>
            <span>Status</span>
            <span>Data de Compra</span>
            <span>Próxima Mensalidade</span>
            <span className="text-right pr-4">Ações</span>
          </div>

          <div className="divide-y divide-surface-300">
            {filtered.map(u => (
              <UserRow 
                key={u.id} 
                user={u} 
                onEdit={openEdit} 
                onHistory={() => setHistoryTarget(u)}
                formatCurrency={fmt} 
              />
            ))}
          </div>

          {/* Vazio */}
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users size={32} className="text-slate-600 mb-3 opacity-20" />
              <p className="text-slate-400 text-sm">Nenhum membro encontrado</p>
            </div>
          )}
        </div>
      )}

      {/* ── Modal Histórico ────────────────────────────────────────────────── */}
      <Modal 
        isOpen={!!historyTarget} 
        onClose={() => setHistoryTarget(null)} 
        title={`Histórico: ${historyTarget?.name}`}
        size="md"
      >
        <div className="flex flex-col gap-4">
          <div className="overflow-hidden rounded-xl border border-surface-400 bg-surface-300/30">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-400/50 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-surface-400">
                <tr>
                  <th className="px-4 py-3">Pagamento</th>
                  <th className="px-4 py-3">Vencimento</th>
                  <th className="px-4 py-3">Plano</th>
                  <th className="px-4 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-400">
                {(() => {
                  const lines = historyTarget?.notes.split('\n').filter(l => l.includes('PAG:')) || [];
                  if (lines.length === 0) {
                    return (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-slate-500 italic">
                          Nenhum registro de pagamento encontrado.
                        </td>
                      </tr>
                    )
                  }
                  return lines.reverse().map((line, i) => {
                    const pag = line.split('PAG:')[1]?.split('|')[0] || '—';
                    const venc = line.split('VENC:')[1]?.split('|')[0] || '—';
                    const plan = line.split('PLAN:')[1] || 'STANDARD';
                    const isNewest = i === 0 && historyTarget?.status === 'ATIVO';
                    
                    return (
                      <tr key={i} className="hover:bg-surface-400/20 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-slate-300">{formatDate(pag)}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-300">{formatDate(venc)}</td>
                        <td className="px-4 py-3">
                          <span className="text-[10px] px-1.5 py-0.5 rounded border border-surface-400 text-slate-400">
                            {plan}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isNewest ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-slate-500/10 text-slate-500 border border-slate-500/20'}`}>
                            {isNewest ? 'ATIVA' : 'FINALIZADA'}
                          </span>
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
          <button onClick={() => setHistoryTarget(null)} className="btn-secondary w-full py-2.5">Fechar</button>
        </div>
      </Modal>

      {/* ── Modal Editar Pagamento ────────────────────────────────────────────── */}
      <Modal
        isOpen={!!editTarget}
        onClose={closeEdit}
        title="Editar Pagamento"
        size="md"
      >
        {editTarget && (
          <form onSubmit={handleSave} className="flex flex-col gap-5">

            {/* Info do usuário */}
            <div className="bg-surface-300/60 border border-surface-400 rounded-lg px-4 py-3">
              <p className="text-sm font-semibold text-white">{editTarget.name}</p>
              <p className="text-xs text-slate-500 mt-0.5">{editTarget.email}</p>
            </div>

            {/* Layout principal unificado */}
            <div className="flex flex-col gap-4">
              
              {/* Row 1: Valor e Forma */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Valor ({me?.currency || 'R$'})</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="input-field"
                    placeholder="Ex: 49.90"
                    value={editForm.value}
                    onChange={setF('value')}
                  />
                </div>
                <div>
                  <label className="label">Forma de Pagamento</label>
                  <select className="input-field" value={editForm.payMethod} onChange={setF('payMethod')}>
                    <option value="">— Selecione —</option>
                    <option value="PIX">PIX</option>
                    <option value="CARTAO">Cartão</option>
                    <option value="BOLETO">Boleto</option>
                    <option value="TRANSFERENCIA">Transferência</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Vencimento e Plano */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Vencimento</label>
                  <input
                    type="date"
                    className="input-field"
                    value={editForm.dueDate}
                    onChange={setF('dueDate')}
                  />
                </div>
                <div>
                  <label className="label">Plano de Assinatura</label>
                  <select className="input-field text-green-400 font-bold" value={editForm.plan} onChange={setF('plan')}>
                    {(Object.keys(PLAN_CONFIG) as PlanType[]).map(p => (
                      <option key={p} value={p}>{PLAN_CONFIG[p].label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 3: Status e Conta (Apenas visualização do tipo de conta) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Status de Pagamento</label>
                  <select className="input-field" value={editForm.status} onChange={setF('status')}>
                    {(Object.keys(STATUS_CONFIG) as PaymentStatus[]).map(s => (
                      <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Tipo de Conta</label>
                  <input
                    className="input-field bg-surface-300/40 cursor-not-allowed text-slate-500"
                    value={editTarget.role === 'ADMIN' || editTarget.role === 'MASTER' ? 'Admin' : 'Membro'}
                    disabled
                    readOnly
                  />
                </div>
              </div>

              {/* Row 4: Observações */}
              <div>
                <label className="label">Observações</label>
                <textarea
                  className="input-field resize-none"
                  rows={4}
                  placeholder="Ex: Pagamento via PIX confirmado em 10/03"
                  value={editForm.notes}
                  onChange={setF('notes')}
                />
              </div>
            </div>

            {/* Ações */}
            <div className="flex gap-3 pt-4 border-t border-surface-300">
              <button type="button" onClick={closeEdit} className="btn-secondary flex-1">
                {isReadOnly ? 'Fechar' : 'Cancelar'}
              </button>
              {!isReadOnly && (
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {saving
                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Salvando...</>
                    : '✓ Salvar alterações'
                  }
                </button>
              )}
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}

// ─── Sub-componente: linha da tabela ─────────────────────────────────────────

interface UserRowProps {
  user: UserPayment
  onEdit: (u: UserPayment) => void
  onHistory: () => void
  formatCurrency: (v: number | null) => string
}

const UserRow = ({ user, onEdit, onHistory, formatCurrency }: UserRowProps) => {
  const statusCfg = STATUS_CONFIG[user.status] || STATUS_CONFIG.PENDENTE
  const planCfg   = PLAN_CONFIG[user.plan]     || PLAN_CONFIG.STARTER

  // Helper para ícones de pagamento
  const getPayIcon = (method: PayMethod) => {
    if (method === 'CARTAO') return <CreditCard size={14} className="text-blue-400" />
    if (method === 'PIX')    return <Wallet size={14} className="text-emerald-400" />
    if (method === 'BOLETO') return <FileText size={14} className="text-yellow-400" />
    return <CircleEllipsis size={14} className="text-slate-500" />
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[2fr_120px_120px_1.5fr_120px_1.5fr_150px_80px] gap-4 px-6 py-4 border-b border-surface-300 last:border-0 hover:bg-surface-300/20 transition-colors items-center group">
      
      {/* USUÁRIO */}
      <div className="flex flex-col min-w-0">
        <span className="text-sm font-bold text-white truncate">{user.name}</span>
        <span className="text-[10px] text-slate-500 truncate mt-0.5">{user.email}</span>
      </div>

      {/* PLANO */}
      <div>
        <span className={`text-[9px] font-black px-2.5 py-1 rounded border tracking-tighter ${planCfg.color}`}>
          {planCfg.label}
        </span>
      </div>

      {/* VALOR */}
      <div className="text-sm font-bold text-white">
        {user.value != null ? formatCurrency(user.value) : '—'}
      </div>

      {/* FORMA DE PAGAMENTO */}
      <div className="flex items-center gap-2">
        {getPayIcon(user.payMethod)}
        <span className="text-xs text-slate-300 font-medium whitespace-nowrap">
          {PAY_METHOD_LABEL[user.payMethod] || '—'}
          {user.payMethod === 'CARTAO' && ' **** 1234'}
        </span>
      </div>

      {/* STATUS */}
      <div>
        <span className={`text-[9px] font-black px-2.5 py-1 rounded inline-flex items-center gap-1.5 ${statusCfg.color}`}>
          <div className={`w-1.5 h-1.5 rounded-full bg-current`} />
          {statusCfg.label}
        </span>
      </div>

      {/* DATA DE COMPRA */}
      <div>
        <span className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">
          {user.status !== 'PENDENTE' 
            ? (user.notes.includes('PAG:') ? formatDate(user.notes.split('PAG:')[1].split('|')[0]) : formatDate(new Date().toISOString()))
            : '—'}
        </span>
      </div>

      {/* PRÓXIMA MENSALIDADE */}
      <div className="text-sm font-bold text-slate-700 dark:text-slate-100">
        {user.dueDate ? formatDate(user.dueDate) : '—'}
      </div>

      {/* AÇÕES */}
      <div className="flex items-center justify-end gap-1">
        <button
          onClick={onHistory}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-surface-400 rounded transition-all"
          title="Histórico de Pagamentos"
        >
          <ClipboardList size={16} />
        </button>
        <button
          onClick={() => onEdit(user)}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-surface-400 rounded transition-all"
          title="Editar"
        >
          <Edit2 size={16} />
        </button>
      </div>
    </div>
  )
}
