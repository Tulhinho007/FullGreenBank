import { useEffect, useState, FormEvent } from 'react'
import { 
  Users, AlertTriangle, 
  TrendingUp, Edit2, Search, 
  CheckCircle, Ban, Hourglass, ClipboardList,
  FileSpreadsheet, FileText,
  CreditCard, Wallet, CircleEllipsis,
} from 'lucide-react'
import { Modal } from '../components/ui/Modal'
import { useAuth } from '../contexts/AuthContext'
import { addLog } from '../services/log.service'
import { usersService } from '../services/users.service'
import api from '../services/api'
import toast from 'react-hot-toast'
import { formatCurrency as fmt } from '../utils/formatters'
import { checkSubscription } from '../utils/subscription'
import { CurrencyInput } from '../components/ui/CurrencyInput'

// ─── Tipos ──────────────────────────────────────────────────────────────────

type PaymentStatus = 'ATIVO' | 'PENDENTE' | 'ATRASADO' | 'CANCELADO'
type PlanType      = 'STARTER' | 'PRO'
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
  ATIVO:     { label: 'PAGO',      color: 'bg-emerald-50 text-emerald-600 border-emerald-100',  icon: <CheckCircle size={12} /> },
  PENDENTE:  { label: 'PENDENTE',  color: 'bg-amber-50 text-amber-600 border-amber-100', icon: <Hourglass size={12} /> },
  ATRASADO:  { label: 'ATRASADO',  color: 'bg-rose-50 text-rose-600 border-rose-100',        icon: <AlertTriangle size={12} /> },
  CANCELADO: { label: 'CANCELADO', color: 'bg-slate-50 text-slate-500 border-slate-200',    icon: <Ban size={12} /> },
}

const PLAN_CONFIG: Record<PlanType, { label: string; color: string }> = {
  STARTER:  { label: 'STARTER', color: 'bg-green-50 text-green-700 border-green-100' },
  PRO:      { label: 'PRO',     color: 'bg-orange-50 text-orange-700 border-orange-100' },
}

const PAY_METHOD_LABEL: Record<PayMethod, string> = {
  PIX:          'PIX',
  CARTAO:       'Cartão',
  BOLETO:       'Boleto',
  TRANSFERENCIA:'Transferência',
  '':           '—',
}

const formatDate = (d: string | null) =>
  d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '—'

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
      const dataArray = Array.isArray(data) ? data : (Array.isArray(data?.users) ? data.users : [])
      const members = dataArray.filter((u: any) => u.role === 'MEMBRO' || (!u.role && u.email !== 'admin@fullgreenbank.com'))
      
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
  const safeUsers = Array.isArray(users) ? users : []
  const totalUsers  = safeUsers.length
  const ativos      = safeUsers.filter(u => u.status === 'ATIVO').length
  const pendentes   = safeUsers.filter(u => u.status === 'PENDENTE').length
  const atrasados   = safeUsers.filter(u => u.status === 'ATRASADO').length
  const receitaMes  = safeUsers
    .filter(u => u.status === 'ATIVO' && u.value != null)
    .reduce((acc, u) => acc + (u.value ?? 0), 0)

  // ── Filtro ─────────────────────────────────────────────────────────────────
  const filtered = safeUsers.filter(u => {
    const term = search.toLowerCase()
    const nameStr = u.name || ''
    const emailStr = u.email || ''
    const matchSearch = !term || nameStr.toLowerCase().includes(term) || emailStr.toLowerCase().includes(term)
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
      <h1>🟢 Relatório: Assinaturas — Full Green Bank</h1>
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
      // Monta payload base com o que o usuário preencheu
      // Campos vazios = null (limpa o valor no banco)
      const payload: Record<string, any> = {
        plan:          editForm.plan      || null,
        value:         editForm.value !== '' ? Number(editForm.value) : null,
        payMethod:     editForm.payMethod || null,
        dueDate:       editForm.dueDate   || null,
        paymentStatus: editForm.status,
        notes:         editForm.notes     || null,
      }

      // Status ATIVO: calcula datas automaticamente, mas respeita dueDate manual se preenchido
      if (editForm.status === 'ATIVO') {
        const today = new Date()
        const todayStr = today.toISOString().split('T')[0]

        // Só gera dueDate automático se o campo estiver vazio
        if (!editForm.dueDate) {
          const due = new Date(today)
          due.setDate(due.getDate() + 30)
          payload.dueDate = due.toISOString().split('T')[0]
        }

        payload.purchaseDate    = todayStr
        payload.lastPaymentDate = todayStr
        payload.isActive        = true

        // Appenda histórico nas notas
        const historyEntry = `PAG:${todayStr}|VENC:${payload.dueDate}|PLAN:${editForm.plan}`
        payload.notes = editForm.notes
          ? `${editForm.notes}\n${historyEntry}`
          : historyEntry

      } else if (editForm.status === 'PENDENTE' || editForm.status === 'CANCELADO') {
        // Resetar para estaca zero — limpa tudo
        payload.isActive        = false
        payload.purchaseDate    = null
        payload.lastPaymentDate = null
        // dueDate já é null se campo vazio (definido acima)
      } else {
        // ATRASADO
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
      <div className="flex flex-col gap-1">
        <h2 className="font-display font-bold text-slate-900 text-xl">Gestão de Assinaturas</h2>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Controle financeiro e recorrência de membros
        </p>
      </div>

      {/* ── Stats Cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm transition-all hover:scale-[1.02]">
          <div className="flex items-center gap-2 mb-2">
            <Users size={14} className="text-slate-400" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Membros</span>
          </div>
          <p className="text-3xl font-display font-bold text-slate-900">{loading ? '—' : totalUsers}</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm transition-all hover:scale-[1.02]">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={14} className="text-emerald-500" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ativos</span>
          </div>
          <p className="text-3xl font-display font-bold text-emerald-600">{loading ? '—' : ativos}</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm transition-all hover:scale-[1.02]">
          <div className="flex items-center gap-2 mb-2">
            <Hourglass size={14} className="text-amber-500" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pendentes</span>
          </div>
          <p className="text-3xl font-display font-bold text-amber-600">{loading ? '—' : pendentes}</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm transition-all hover:scale-[1.02]">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={14} className="text-rose-500" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Atrasados</span>
          </div>
          <p className="text-3xl font-display font-bold text-rose-600">{loading ? '—' : atrasados}</p>
        </div>

        <div className="bg-emerald-600 p-5 rounded-3xl border border-emerald-500 shadow-lg col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={14} className="text-emerald-100" />
            <span className="text-[10px] font-bold text-emerald-100 uppercase tracking-widest">Receita Mensal</span>
          </div>
          <p className="text-2xl font-display font-bold text-white">
            {fmt(receitaMes)}
          </p>
        </div>
      </div>

      {/* ── Filtros e Ações ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-6 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Pesquise por nome, email ou ID..."
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-2.5 pl-12 pr-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/30 transition-all"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <select 
          className="bg-white border border-slate-200 rounded-2xl px-4 h-11 text-xs font-bold text-slate-600 cursor-pointer focus:outline-none shadow-sm"
          value={filterPlan} 
          onChange={e => setFilterPlan(e.target.value as PlanType | '')}
        >
          <option value="">Todos Planos</option>
          {Object.keys(PLAN_CONFIG).map(p => (
            <option key={p} value={p}>{PLAN_CONFIG[p as PlanType].label}</option>
          ))}
        </select>

        <select 
          className="bg-white border border-slate-200 rounded-2xl px-4 h-11 text-xs font-bold text-slate-600 cursor-pointer focus:outline-none shadow-sm"
          value={filterStatus} 
          onChange={e => setFilterStatus(e.target.value as PaymentStatus | '')}
        >
          <option value="">Status</option>
          {(Object.keys(STATUS_CONFIG) as PaymentStatus[]).map(s => (
            <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
          ))}
        </select>

        <select className="input-field w-auto h-11 bg-slate-50 border-slate-100 text-sm cursor-pointer">
          <option>Hoje</option>
          <option>Ontem</option>
          <option>Últimos 7 dias</option>
          <option>Este mês</option>
        </select>

        <div className="flex items-center gap-2 ml-auto">
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-100 transition-all">
            <FileSpreadsheet size={16} />
            Excel
          </button>
          <button onClick={exportPDF} className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-rose-100 transition-all">
            <FileText size={16} />
            PDF
          </button>
        </div>
      </div>

      {/* ── Tabela ───────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
          {/* Header da tabela consolidado */}
          <div className="hidden md:grid grid-cols-[2fr_120px_120px_1.5fr_120px_1.5fr_150px_80px] gap-4 px-6 py-4 bg-slate-50/50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest items-center">
            <span>Usuário</span>
            <span>Plano</span>
            <span>Valor</span>
            <span>Pagamento</span>
            <span>Status</span>
            <span>Compra</span>
            <span>Próxima</span>
            <span className="text-right pr-4">Ações</span>
          </div>

          <div className="divide-y divide-slate-100">
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
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Pagamento</th>
                  <th className="px-4 py-3">Vencimento</th>
                  <th className="px-4 py-3">Plano</th>
                  <th className="px-4 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {(() => {
                  const lines = (historyTarget?.notes || '').split('\n').filter(l => l.includes('PAG:')) || [];
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
                    const plan = line.split('PLAN:')[1] || 'STARTER';
                    const isNewest = i === 0 && historyTarget?.status === 'ATIVO';
                    
                    return (
                      <tr key={i} className="hover:bg-slate-100 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-slate-600">{formatDate(pag)}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-600">{formatDate(venc)}</td>
                        <td className="px-4 py-3">
                          <span className="text-[10px] px-1.5 py-0.5 rounded border border-slate-200 text-slate-500">
                            {plan}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isNewest ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-slate-50 text-slate-400 border border-slate-200'}`}>
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
            <div className="bg-slate-50 border border-slate-100 rounded-lg px-4 py-3">
              <p className="text-sm font-semibold text-slate-900">{editTarget.name}</p>
              <p className="text-xs text-slate-500 mt-0.5">{editTarget.email}</p>
            </div>

            {/* Layout principal unificado */}
            <div className="flex flex-col gap-4">
              
              {/* Row 1: Valor e Forma */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Valor ({me?.currency || 'R$'})</label>
                  <CurrencyInput
                    value={editForm.value ? Number(editForm.value) : 0}
                    onChange={(v) => setF('value')({ target: { value: String(v) } } as any)}
                    alertLimit={1000}
                    className="w-full"
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
                  <select className="input-field text-green-600 font-bold" value={editForm.plan} onChange={setF('plan')}>
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
                    className="input-field bg-slate-50 cursor-not-allowed text-slate-400"
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
            <div className="flex flex-col gap-2 pt-4 border-t border-slate-100">
              {/* Botão reset — só aparece se já houver algum dado */}
              {!isReadOnly && (editTarget.status !== 'PENDENTE' || editTarget.dueDate) && (
                <button
                  type="button"
                  onClick={() => setEditForm({ ...emptyEdit, status: 'PENDENTE' })}
                  className="w-full py-2 rounded-xl border border-rose-100 text-rose-500 hover:bg-rose-50 text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  🗑 Limpar Tudo (Voltar estaca zero)
                </button>
              )}
              <div className="flex gap-3">
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
    <div className="grid grid-cols-1 md:grid-cols-[2fr_120px_120px_1.5fr_120px_1.5fr_150px_80px] gap-4 px-6 py-4 border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors items-center group">
      
      {/* USUÁRIO */}
      <div className="flex flex-col min-w-0">
        <span className="text-sm font-bold text-slate-900 truncate uppercase tracking-tight">{user.name}</span>
        <span className="text-[10px] font-bold text-slate-400 truncate mt-0.5">{user.email}</span>
      </div>

      {/* PLANO */}
      <div>
        <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg border tracking-tighter uppercase ${planCfg.color}`}>
          {planCfg.label}
        </span>
      </div>

      {/* VALOR */}
      <div className="text-sm font-bold text-slate-900 font-mono">
        {user.value != null ? formatCurrency(user.value) : '—'}
      </div>

      {/* FORMA DE PAGAMENTO */}
      <div className="flex items-center gap-2">
        {getPayIcon(user.payMethod)}
        <span className="text-[11px] text-slate-500 font-bold whitespace-nowrap uppercase tracking-tighter">
          {PAY_METHOD_LABEL[user.payMethod] || '—'}
        </span>
      </div>

      {/* STATUS */}
      <div>
        <span className={`text-[9px] font-black px-2.5 py-1 rounded-full border inline-flex items-center gap-1.5 uppercase tracking-widest ${statusCfg.color}`}>
          <div className={`w-1.5 h-1.5 rounded-full bg-current`} />
          {statusCfg.label}
        </span>
      </div>

      {/* DATA DE COMPRA */}
      <div>
        <span className="text-[11px] font-bold text-slate-400 truncate">
          {user.status !== 'PENDENTE' 
            ? (user.notes?.includes('PAG:') ? formatDate(user.notes.split('PAG:')[1]?.split('|')[0]) : formatDate(new Date().toISOString()))
            : '—'}
        </span>
      </div>

      {/* PRÓXIMA MENSALIDADE */}
      <div className="text-[11px] font-bold text-slate-600 font-mono">
        {user.dueDate ? formatDate(user.dueDate) : '—'}
      </div>

      {/* AÇÕES */}
      <div className="flex items-center justify-end gap-1 translate-x-1 group-hover:translate-x-0 transition-transform">
        <button
          onClick={onHistory}
          className="p-1.5 text-slate-400 hover:text-blue-600 bg-slate-50 rounded-lg border border-slate-100 transition-all shadow-sm"
          title="Histórico de Pagamentos"
        >
          <ClipboardList size={14} />
        </button>
        <button
          onClick={() => onEdit(user)}
          className="p-1.5 text-slate-400 hover:text-green-600 bg-slate-50 rounded-lg border border-slate-100 transition-all shadow-sm"
          title="Editar"
        >
          <Edit2 size={14} />
        </button>
      </div>
    </div>
  )
}
