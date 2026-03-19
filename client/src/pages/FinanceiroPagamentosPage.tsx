import { useEffect, useState, FormEvent } from 'react'
import { 
  CreditCard, Users, Clock, AlertTriangle, 
  TrendingUp, Edit2, ChevronDown, Search, 
  CheckCircle, Ban, Hourglass,
  FileSpreadsheet, FileText, Printer, Eye,
} from 'lucide-react'
import { Modal } from '../components/ui/Modal'
import { useAuth } from '../contexts/AuthContext'
import { addLog } from './SystemLogPage'
import { usersService } from '../services/users.service'
import api from '../services/api'
import toast from 'react-hot-toast'
import { formatCurrency as fmt } from '../utils/formatters'

// ─── Tipos ──────────────────────────────────────────────────────────────────

type PaymentStatus = 'ATIVO' | 'PENDENTE' | 'ATRASADO' | 'INATIVO' | 'TRIAL'
type PlanType      = 'TRIAL' | 'BASICO' | 'PRO' | 'PREMIUM' | 'ADMIN'
type PayMethod     = 'PIX' | 'CARTAO' | 'BOLETO' | 'TRANSFERENCIA' | ''

interface UserPayment {
  id: string
  name: string
  email: string
  role: string
  plan: PlanType
  value: number | null
  payMethod: PayMethod
  dueDate: string | null
  status: PaymentStatus
  notes: string
}

// ─── Helpers visuais ─────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<PaymentStatus, { label: string; color: string; icon: React.ReactNode }> = {
  ATIVO:     { label: 'Ativo',     color: 'text-green-400 bg-green-900/40 border-green-800/50',  icon: <CheckCircle size={12} /> },
  PENDENTE:  { label: 'Pendente',  color: 'text-yellow-400 bg-yellow-900/30 border-yellow-800/50', icon: <Clock size={12} /> },
  ATRASADO:  { label: 'Atrasado',  color: 'text-red-400 bg-red-900/30 border-red-800/50',        icon: <AlertTriangle size={12} /> },
  INATIVO:   { label: 'Inativo',   color: 'text-slate-400 bg-surface-300 border-surface-400',    icon: <Ban size={12} /> },
  TRIAL:     { label: 'Trial',     color: 'text-blue-400 bg-blue-900/30 border-blue-800/50',     icon: <Clock size={12} /> },
}

const PLAN_CONFIG: Record<PlanType, { label: string; color: string }> = {
  TRIAL:   { label: 'Trial',        color: 'text-blue-400 bg-blue-900/30 border-blue-800/50'       },
  BASICO:  { label: 'Básico',       color: 'text-slate-300 bg-surface-300 border-surface-400'      },
  PRO:     { label: 'Pro',          color: 'text-green-400 bg-green-900/40 border-green-800/50'    },
  PREMIUM: { label: 'Premium',      color: 'text-yellow-400 bg-yellow-900/30 border-yellow-800/50' },
  ADMIN:   { label: 'Administrador',color: 'text-purple-400 bg-purple-900/30 border-purple-800/50' },
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
  plan: 'TRIAL' as PlanType,
  value: '',
  payMethod: '' as PayMethod,
  dueDate: '',
  status: 'TRIAL' as PaymentStatus,
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

  // ── Carregar usuários ──────────────────────────────────────────────────────
  const loadUsers = async () => {
    setLoading(true)
    try {
      const data = await usersService.getAll()
      const mapped: UserPayment[] = data.map((u: any) => ({
        id:        u.id,
        name:      u.name,
        email:     u.email,
        role:      u.role,
        plan:      u.plan       ?? 'TRIAL',
        value:     u.value      ?? null,
        payMethod: u.payMethod  ?? '',
        dueDate:   u.dueDate    ?? null,
        status:    u.paymentStatus ?? 'TRIAL',
        notes:     u.notes      ?? '',
      }))
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

  // Separar por tipo de conta
  const admins  = filtered.filter(u => u.role === 'ADMIN' || u.role === 'MASTER')
  const members = filtered.filter(u => u.role !== 'ADMIN' && u.role !== 'MASTER')

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

  const closeEdit = () => { setEditTarget(null); setEditForm(emptyEdit) }

  const setF = (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setEditForm(f => ({ ...f, [field]: e.target.value }))

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    if (!editTarget) return
    setSaving(true)
    try {
      await api.patch(`/users/${editTarget.id}/payment`, {
        plan:          editForm.plan,
        value:         editForm.value !== '' ? Number(editForm.value) : null,
        payMethod:     editForm.payMethod || null,
        dueDate:       editForm.dueDate   || null,
        paymentStatus: editForm.status,
        notes:         editForm.notes,
      })
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
    } catch {
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

      {/* ── Filtros ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Busca */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            className="input-field pl-9 py-2 text-sm"
            placeholder="Buscar por nome ou e-mail..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Filtro status */}
        <div className="relative">
          <select
            className="input-field py-2 pr-8 text-sm appearance-none cursor-pointer"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as PaymentStatus | '')}
          >
            <option value="">Todos os status</option>
            {(Object.keys(STATUS_CONFIG) as PaymentStatus[]).map(s => (
              <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
            ))}
          </select>
          <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        </div>

        {/* Filtro plano */}
        <div className="relative">
          <select
            className="input-field py-2 pr-8 text-sm appearance-none cursor-pointer"
            value={filterPlan}
            onChange={e => setFilterPlan(e.target.value as PlanType | '')}
          >
            <option value="">Todos os planos</option>
            {(Object.keys(PLAN_CONFIG) as PlanType[]).map(p => (
              <option key={p} value={p}>{PLAN_CONFIG[p].label}</option>
            ))}
          </select>
          <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        </div>

        <div className="flex gap-2 ml-auto w-full md:w-auto mt-2 md:mt-0">
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

      {/* ── Tabela ───────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="card overflow-hidden">
          {/* Header da tabela */}
          <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_80px] gap-4 px-5 py-3 border-b border-surface-300 text-xs text-slate-500 uppercase tracking-wide">
            <span>Usuário</span>
            <span>Tipo / Plano</span>
            <span>Valor</span>
            <span>Forma de Pag.</span>
            <span>Vencimento</span>
            <span>Status</span>
            <span className="text-right">Ações</span>
          </div>

          {/* Grupo: Admins */}
          {admins.length > 0 && (
            <>
              <div className="px-5 py-2 bg-surface-300/50 border-b border-surface-300 flex items-center gap-2">
                <CreditCard size={12} className="text-purple-400" />
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Contas Administrativas
                </span>
              </div>
              {admins.map(u => (
                <UserRow key={u.id} user={u} onEdit={openEdit} isReadOnly={isReadOnly} formatCurrency={fmt} />
              ))}
            </>
          )}

          {/* Grupo: Membros */}
          {members.length > 0 && (
            <>
              <div className="px-5 py-2 bg-surface-300/50 border-b border-surface-300 flex items-center gap-2">
                <Users size={12} className="text-slate-400" />
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Membros
                </span>
              </div>
              {members.map(u => (
                <UserRow key={u.id} user={u} onEdit={openEdit} isReadOnly={isReadOnly} formatCurrency={fmt} />
              ))}
            </>
          )}

          {/* Vazio */}
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Ban size={32} className="text-slate-600 mb-3" />
              <p className="text-slate-400 text-sm">Nenhum usuário encontrado</p>
              <p className="text-slate-600 text-xs mt-1">Tente ajustar os filtros de busca</p>
            </div>
          )}
        </div>
      )}

      {/* ── Modal Editar Pagamento ────────────────────────────────────────────── */}
      <Modal
        isOpen={!!editTarget}
        onClose={closeEdit}
        title="Editar Pagamento"
        size="md"
      >
        {editTarget && (
          <form onSubmit={handleSave} className="flex flex-col gap-4">

            {/* Info do usuário */}
            <div className="bg-surface-300/60 border border-surface-400 rounded-lg px-4 py-3">
              <p className="text-sm font-semibold text-white">{editTarget.name}</p>
              <p className="text-xs text-slate-500 mt-0.5">{editTarget.email}</p>
            </div>

            {/* Tipo de conta + Plano */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Tipo de Conta</label>
                <input
                  className="input-field bg-surface-300/60 cursor-not-allowed text-slate-400"
                  value={editTarget.role === 'ADMIN' || editTarget.role === 'MASTER' ? 'Admin' : 'Membro'}
                  disabled
                  readOnly
                />
              </div>
              <div>
                <label className="label">Plano</label>
                <select className="input-field" value={editForm.plan} onChange={setF('plan')}>
                  {(Object.keys(PLAN_CONFIG) as PlanType[]).map(p => (
                    <option key={p} value={p}>{PLAN_CONFIG[p].label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Valor + Forma de pagamento */}
            <div className="grid grid-cols-2 gap-3">
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

            {/* Vencimento + Status */}
            <div className="grid grid-cols-2 gap-3">
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
                <label className="label">Status de Pagamento</label>
                <select className="input-field" value={editForm.status} onChange={setF('status')}>
                  {(Object.keys(STATUS_CONFIG) as PaymentStatus[]).map(s => (
                    <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Observações */}
            <div>
              <label className="label">Observações</label>
              <textarea
                className="input-field resize-none"
                rows={3}
                placeholder="Ex: Pagamento via PIX confirmado em 10/03"
                value={editForm.notes}
                onChange={setF('notes')}
              />
            </div>

            {/* Ações */}
            <div className="flex gap-3 pt-1">
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
  isReadOnly?: boolean
  formatCurrency: (v: number | null) => string
}

const UserRow = ({ user, onEdit, isReadOnly, formatCurrency }: UserRowProps) => {
  const status = STATUS_CONFIG[user.status]
  const plan   = PLAN_CONFIG[user.plan]
  const isAdmin = user.role === 'ADMIN' || user.role === 'MASTER'

  return (
    <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_80px] gap-2 md:gap-4 px-5 py-4 border-b border-surface-300 last:border-0 hover:bg-surface-300/30 transition-colors group items-center">

      {/* Usuário */}
      <div className="flex flex-col min-w-0">
        <span className="text-sm font-medium text-white truncate">{user.name}</span>
        <span className="text-xs text-slate-500 truncate">{user.email}</span>
      </div>

      {/* Tipo / Plano */}
      <div className="flex flex-wrap gap-1.5 items-center">
        <span className="text-xs text-slate-400">
          {isAdmin ? 'Admin' : 'Membro'}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded-full border ${plan.color}`}>
          {plan.label}
        </span>
      </div>

      {/* Valor */}
      <span className="text-sm text-slate-300 font-mono">
        {user.value != null ? formatCurrency(user.value) : <span className="text-slate-600">—</span>}
      </span>

      {/* Forma de pag. */}
      <span className="text-sm text-slate-400">
        {PAY_METHOD_LABEL[user.payMethod] || <span className="text-slate-600">— —</span>}
      </span>

      {/* Vencimento */}
      <span className="text-sm text-slate-400">
        {user.dueDate ? formatDate(user.dueDate) : <span className="text-slate-600">—</span>}
      </span>

      {/* Status */}
      <div>
        <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${status.color}`}>
          {status.icon}
          {status.label}
        </span>
      </div>

      {/* Ações */}
      <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => isReadOnly ? null : onEdit(user)}
            className={`flex items-center gap-1.5 text-xs border px-2.5 py-1 rounded transition-colors ${isAdmin ? 'text-green-400 border-green-800/50 bg-green-900/30 hover:bg-green-800/50' : isReadOnly ? 'text-slate-500 border-surface-400 bg-surface-300 cursor-default' : 'text-green-400 border-green-800/50 bg-green-900/30 hover:bg-green-800/50 opacity-0 group-hover:opacity-100 md:opacity-100'}`}
          >
            {isAdmin ? (
              <><CheckCircle size={12} /> Ativo</>
            ) : isReadOnly ? (
              <><Eye size={12} /> Visualizar</>
            ) : (
              <><Edit2 size={12} /> Editar</>
            )}
          </button>
      </div>
    </div>
  )
}
