import { useEffect, useState, FormEvent } from 'react'
import {
  Briefcase, TrendingUp, DollarSign, Percent,
  Plus, Edit2, Trash2, RefreshCw, X, AlertTriangle,
  CheckCircle, XCircle, ChevronDown, Search, Ban,
} from 'lucide-react'
import { Modal } from '../components/ui/Modal'
import { useAuth } from '../contexts/AuthContext'
import { addLog } from './SystemLogPage'
import api from '../services/api'
import toast from 'react-hot-toast'

// ─── Tipos ────────────────────────────────────────────────────────────────────

type ContractStatus = 'ATIVO' | 'ENCERRADO_LUCRO' | 'ENCERRADO_QUEBRA'

interface BancaContract {
  id: string
  userId: string
  userName: string
  userEmail: string
  valorInicial: number
  valorAtual: number
  comissaoPercent: number
  status: ContractStatus
  observacoes: string
  createdAt: string
  updatedAt: string
  // calculados no frontend
  lucroBruto: number
  comissaoValor: number
  valorLiquidoCliente: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ContractStatus, { label: string; color: string; icon: React.ReactNode }> = {
  ATIVO:             { label: 'Ativo',               color: 'text-green-400 bg-green-900/40 border-green-800/50',   icon: <CheckCircle size={12} /> },
  ENCERRADO_LUCRO:   { label: 'Encerrado (200%)',     color: 'text-yellow-400 bg-yellow-900/30 border-yellow-800/50', icon: <TrendingUp size={12} /> },
  ENCERRADO_QUEBRA:  { label: 'Encerrado (Quebra)',   color: 'text-red-400 bg-red-900/30 border-red-800/50',        icon: <XCircle size={12} /> },
}

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtDate = (d: string) => new Date(d).toLocaleDateString('pt-BR')

const calcFields = (c: Omit<BancaContract, 'lucroBruto' | 'comissaoValor' | 'valorLiquidoCliente'>): BancaContract => {
  const lucroBruto          = Math.max(0, c.valorAtual - c.valorInicial)
  const comissaoValor       = (lucroBruto * c.comissaoPercent) / 100
  const valorLiquidoCliente = c.valorAtual - comissaoValor
  return { ...c, lucroBruto, comissaoValor, valorLiquidoCliente }
}

// Verifica se deve encerrar automaticamente
const checkAutoClose = (valorInicial: number, valorAtual: number): ContractStatus | null => {
  if (valorAtual <= 0)                         return 'ENCERRADO_QUEBRA'
  if (valorAtual >= valorInicial * 2)          return 'ENCERRADO_LUCRO'
  return null
}

// ─── Forms vazios ─────────────────────────────────────────────────────────────

const emptyAdd = { userId: '', valorInicial: '', comissaoPercent: '10', observacoes: '' }
const emptyEdit = { valorAtual: '', comissaoPercent: '', observacoes: '' }

// ─── Componente principal ─────────────────────────────────────────────────────

export const BancaGerenciadaPage = () => {
  const { user: me } = useAuth()

  const [contracts,   setContracts]   = useState<BancaContract[]>([])
  const [users,       setUsers]       = useState<{ id: string; name: string; email: string }[]>([])
  const [loading,     setLoading]     = useState(true)
  const [saving,      setSaving]      = useState(false)

  // Filtros
  const [search,       setSearch]       = useState('')
  const [filterStatus, setFilterStatus] = useState<ContractStatus | ''>('')

  // Modais
  const [addOpen,     setAddOpen]     = useState(false)
  const [editTarget,  setEditTarget]  = useState<BancaContract | null>(null)
  const [deleteTarget,setDeleteTarget]= useState<BancaContract | null>(null)
  const [renewTarget, setRenewTarget] = useState<BancaContract | null>(null)

  // Formulários
  const [addForm,  setAddForm]  = useState(emptyAdd)
  const [editForm, setEditForm] = useState(emptyEdit)

  // ── Carregar dados ───────────────────────────────────────────────────────────
  const loadAll = async () => {
    setLoading(true)
    try {
      const [cRes, uRes] = await Promise.all([
        api.get('/banca-contratos'),
        api.get('/users'),
      ])
      const mapped = (cRes.data as Omit<BancaContract, 'lucroBruto' | 'comissaoValor' | 'valorLiquidoCliente'>[])
        .map(calcFields)
      setContracts(mapped)
      setUsers(uRes.data)
    } catch {
      toast.error('Erro ao carregar contratos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [])

  // ── Stats ────────────────────────────────────────────────────────────────────
  const ativos        = contracts.filter(c => c.status === 'ATIVO').length
  const totalComissao = contracts.reduce((a, c) => a + c.comissaoValor, 0)
  const lucroTotal    = contracts.reduce((a, c) => a + c.lucroBruto, 0)
  const bancaTotal    = contracts.filter(c => c.status === 'ATIVO').reduce((a, c) => a + c.valorAtual, 0)

  // ── Filtro ───────────────────────────────────────────────────────────────────
  const filtered = contracts.filter(c => {
    const term = search.toLowerCase()
    const matchSearch = !term || c.userName.toLowerCase().includes(term) || c.userEmail.toLowerCase().includes(term)
    const matchStatus = !filterStatus || c.status === filterStatus
    return matchSearch && matchStatus
  })

  // ── ADD ──────────────────────────────────────────────────────────────────────
  const handleAdd = async (e: FormEvent) => {
    e.preventDefault()
    if (!addForm.userId || !addForm.valorInicial) {
      toast.error('Preencha todos os campos obrigatórios.')
      return
    }
    setSaving(true)
    try {
      await api.post('/banca-contratos', {
        userId:          addForm.userId,
        valorInicial:    Number(addForm.valorInicial),
        comissaoPercent: Number(addForm.comissaoPercent),
        observacoes:     addForm.observacoes,
      })
      toast.success('Contrato criado com sucesso! ✓')
      if (me) addLog({ userEmail: me.email, userName: me.name, userRole: me.role, category: 'Financeiro', action: 'Contrato criado', detail: `Banca: ${fmt(Number(addForm.valorInicial))}` })
      setAddOpen(false)
      setAddForm(emptyAdd)
      loadAll()
    } catch {
      toast.error('Erro ao criar contrato.')
    } finally {
      setSaving(false)
    }
  }

  // ── EDIT ─────────────────────────────────────────────────────────────────────
  const openEdit = (c: BancaContract) => {
    setEditTarget(c)
    setEditForm({ valorAtual: String(c.valorAtual), comissaoPercent: String(c.comissaoPercent), observacoes: c.observacoes })
  }

  const handleEdit = async (e: FormEvent) => {
    e.preventDefault()
    if (!editTarget) return
    const novoValor = Number(editForm.valorAtual)
    const autoStatus = checkAutoClose(editTarget.valorInicial, novoValor)
    setSaving(true)
    try {
      await api.patch(`/banca-contratos/${editTarget.id}`, {
        valorAtual:      novoValor,
        comissaoPercent: Number(editForm.comissaoPercent),
        observacoes:     editForm.observacoes,
        ...(autoStatus ? { status: autoStatus } : {}),
      })
      if (autoStatus) {
        const msg = autoStatus === 'ENCERRADO_LUCRO'
          ? '🎉 Contrato atingiu 200%! Encerrado com lucro.'
          : '⚠️ Banca zerada. Contrato encerrado por quebra.'
        toast(msg, { duration: 5000 })
      } else {
        toast.success('Contrato atualizado! ✓')
      }
      if (me) addLog({ userEmail: me.email, userName: me.name, userRole: me.role, category: 'Financeiro', action: 'Contrato editado', detail: `${editTarget.userName} · Banca: ${fmt(novoValor)}` })
      setEditTarget(null)
      loadAll()
    } catch {
      toast.error('Erro ao atualizar contrato.')
    } finally {
      setSaving(false)
    }
  }

  // ── DELETE ───────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return
    setSaving(true)
    try {
      await api.delete(`/banca-contratos/${deleteTarget.id}`)
      toast.success('Contrato excluído.')
      if (me) addLog({ userEmail: me.email, userName: me.name, userRole: me.role, category: 'Financeiro', action: 'Contrato excluído', detail: deleteTarget.userName })
      setDeleteTarget(null)
      loadAll()
    } catch {
      toast.error('Erro ao excluir contrato.')
    } finally {
      setSaving(false)
    }
  }

  // ── RENOVAR ──────────────────────────────────────────────────────────────────
  const handleRenew = async () => {
    if (!renewTarget) return
    setSaving(true)
    try {
      await api.post('/banca-contratos', {
        userId:          renewTarget.userId,
        valorInicial:    renewTarget.valorLiquidoCliente > 0 ? renewTarget.valorLiquidoCliente : renewTarget.valorInicial,
        comissaoPercent: renewTarget.comissaoPercent,
        observacoes:     `Renovação do contrato #${renewTarget.id.slice(-6).toUpperCase()}`,
      })
      toast.success('Contrato renovado! Novo ciclo iniciado. ✓')
      if (me) addLog({ userEmail: me.email, userName: me.name, userRole: me.role, category: 'Financeiro', action: 'Contrato renovado', detail: `${renewTarget.userName} · Novo valor: ${fmt(renewTarget.valorLiquidoCliente)}` })
      setRenewTarget(null)
      loadAll()
    } catch {
      toast.error('Erro ao renovar contrato.')
    } finally {
      setSaving(false)
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6">

      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display font-semibold text-white">Banca Gerenciada</h2>
          <p className="text-xs text-slate-500 mt-0.5">Gestão de contratos de banca com comissão automática</p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="btn-primary flex items-center gap-2 shrink-0"
        >
          <Plus size={15} />
          Novo Contrato
        </button>
      </div>

      {/* ── Stats ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-green-900/50 flex items-center justify-center">
              <Briefcase size={13} className="text-green-400" />
            </div>
            <span className="text-xs text-slate-500 uppercase tracking-wide">Contratos Ativos</span>
          </div>
          <p className="text-2xl font-bold text-white">{loading ? '—' : ativos}</p>
          <p className="text-xs text-slate-600 mt-1">{contracts.length} total</p>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-green-900/50 flex items-center justify-center">
              <DollarSign size={13} className="text-green-400" />
            </div>
            <span className="text-xs text-slate-500 uppercase tracking-wide">Banca Total Ativa</span>
          </div>
          <p className="text-2xl font-bold text-green-400">{loading ? '—' : fmt(bancaTotal)}</p>
          <p className="text-xs text-slate-600 mt-1">Soma dos contratos ativos</p>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-yellow-900/40 flex items-center justify-center">
              <Percent size={13} className="text-yellow-400" />
            </div>
            <span className="text-xs text-slate-500 uppercase tracking-wide">Comissão Acumulada</span>
          </div>
          <p className="text-2xl font-bold text-yellow-400">{loading ? '—' : fmt(totalComissao)}</p>
          <p className="text-xs text-slate-600 mt-1">Todos os contratos</p>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-green-900/50 flex items-center justify-center">
              <TrendingUp size={13} className="text-green-400" />
            </div>
            <span className="text-xs text-slate-500 uppercase tracking-wide">Lucro Total Plataforma</span>
          </div>
          <p className="text-2xl font-bold text-green-400">{loading ? '—' : fmt(lucroTotal)}</p>
          <p className="text-xs text-slate-600 mt-1">Lucro bruto gerado</p>
        </div>
      </div>

      {/* ── Filtros ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            className="input-field pl-9 py-2 text-sm"
            placeholder="Buscar por nome ou e-mail..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="relative">
          <select
            className="input-field py-2 pr-8 text-sm appearance-none cursor-pointer"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as ContractStatus | '')}
          >
            <option value="">Todos os status</option>
            {(Object.keys(STATUS_CONFIG) as ContractStatus[]).map(s => (
              <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
            ))}
          </select>
          <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        </div>
      </div>

      {/* ── Tabela ──────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="card overflow-hidden">
          {/* Header */}
          <div className="hidden lg:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr_110px] gap-3 px-5 py-3 border-b border-surface-300 text-xs text-slate-500 uppercase tracking-wide">
            <span>Usuário</span>
            <span>V. Inicial</span>
            <span>V. Atual</span>
            <span>Lucro Bruto</span>
            <span>Comissão</span>
            <span>V. Líquido</span>
            <span>Status</span>
            <span className="text-right">Ações</span>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Ban size={32} className="text-slate-600 mb-3" />
              <p className="text-slate-400 text-sm">Nenhum contrato encontrado</p>
              <p className="text-slate-600 text-xs mt-1">Crie um novo contrato ou ajuste os filtros</p>
            </div>
          ) : (
            filtered.map(c => (
              <ContractRow
                key={c.id}
                contract={c}
                onEdit={openEdit}
                onDelete={setDeleteTarget}
                onRenew={setRenewTarget}
              />
            ))
          )}
        </div>
      )}

      {/* ── Modal: Novo Contrato ─────────────────────────────────────────────── */}
      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Novo Contrato de Banca" size="md">
        <form onSubmit={handleAdd} className="flex flex-col gap-4">

          <div>
            <label className="label">Usuário *</label>
            <select
              className="input-field"
              value={addForm.userId}
              onChange={e => setAddForm(f => ({ ...f, userId: e.target.value }))}
              required
            >
              <option value="">— Selecione o usuário —</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Valor Inicial (R$) *</label>
              <input
                type="number" min="1" step="0.01"
                className="input-field"
                placeholder="Ex: 1000.00"
                value={addForm.valorInicial}
                onChange={e => setAddForm(f => ({ ...f, valorInicial: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="label">Comissão (%)</label>
              <input
                type="number" min="0" max="100" step="0.1"
                className="input-field"
                placeholder="Ex: 10"
                value={addForm.comissaoPercent}
                onChange={e => setAddForm(f => ({ ...f, comissaoPercent: e.target.value }))}
              />
            </div>
          </div>

          {/* Preview automático */}
          {addForm.valorInicial && (
            <div className="bg-surface-300/60 border border-surface-400 rounded-lg px-4 py-3 grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-slate-500">Meta (200%)</p>
                <p className="text-green-400 font-semibold font-mono">{fmt(Number(addForm.valorInicial) * 2)}</p>
              </div>
              <div>
                <p className="text-slate-500">Comissão sobre lucro</p>
                <p className="text-yellow-400 font-semibold font-mono">{addForm.comissaoPercent}%</p>
              </div>
            </div>
          )}

          <div>
            <label className="label">Observações</label>
            <textarea
              className="input-field resize-none" rows={2}
              placeholder="Ex: Depósito recebido via PIX em 17/03"
              value={addForm.observacoes}
              onChange={e => setAddForm(f => ({ ...f, observacoes: e.target.value }))}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => setAddOpen(false)} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Criando...</> : '✓ Criar Contrato'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Modal: Editar Contrato ───────────────────────────────────────────── */}
      <Modal isOpen={!!editTarget} onClose={() => setEditTarget(null)} title="Atualizar Banca" size="md">
        {editTarget && (
          <form onSubmit={handleEdit} className="flex flex-col gap-4">

            <div className="bg-surface-300/60 border border-surface-400 rounded-lg px-4 py-3">
              <p className="text-sm font-semibold text-white">{editTarget.userName}</p>
              <p className="text-xs text-slate-500">{editTarget.userEmail}</p>
              <div className="mt-2 flex gap-4 text-xs">
                <span className="text-slate-500">Inicial: <span className="text-white font-mono">{fmt(editTarget.valorInicial)}</span></span>
                <span className="text-slate-500">Meta: <span className="text-green-400 font-mono">{fmt(editTarget.valorInicial * 2)}</span></span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Banca Atual (Fim) *</label>
                <input
                  type="number" min="0" step="0.01"
                  className="input-field"
                  placeholder="Valor atual da banca"
                  value={editForm.valorAtual}
                  onChange={e => setEditForm(f => ({ ...f, valorAtual: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="label">Comissão (%)</label>
                <input
                  type="number" min="0" max="100" step="0.1"
                  className="input-field"
                  value={editForm.comissaoPercent}
                  onChange={e => setEditForm(f => ({ ...f, comissaoPercent: e.target.value }))}
                />
              </div>
            </div>

            {/* Preview dinâmico */}
            {editForm.valorAtual && (
              <div className="bg-surface-300/60 border border-surface-400 rounded-lg px-4 py-3">
                <p className="text-xs text-slate-500 mb-2 font-semibold uppercase tracking-wide">Preview do Resultado</p>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  {(() => {
                    const va = Number(editForm.valorAtual)
                    const cp = Number(editForm.comissaoPercent)
                    const lb = Math.max(0, va - editTarget.valorInicial)
                    const cv = (lb * cp) / 100
                    const vl = va - cv
                    const auto = checkAutoClose(editTarget.valorInicial, va)
                    return (
                      <>
                        <div>
                          <p className="text-slate-500">Lucro Bruto</p>
                          <p className={`font-semibold font-mono ${lb > 0 ? 'text-green-400' : 'text-slate-400'}`}>{fmt(lb)}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Comissão</p>
                          <p className="text-yellow-400 font-semibold font-mono">{fmt(cv)}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Valor Líquido</p>
                          <p className="text-white font-semibold font-mono">{fmt(vl)}</p>
                        </div>
                        {auto && (
                          <div className="col-span-3 mt-1 flex items-center gap-2 text-xs">
                            <AlertTriangle size={12} className={auto === 'ENCERRADO_LUCRO' ? 'text-yellow-400' : 'text-red-400'} />
                            <span className={auto === 'ENCERRADO_LUCRO' ? 'text-yellow-400' : 'text-red-400'}>
                              {auto === 'ENCERRADO_LUCRO' ? '🎉 Contrato será encerrado automaticamente (200%)' : '⚠️ Banca zerada — contrato será encerrado'}
                            </span>
                          </div>
                        )}
                      </>
                    )
                  })()}
                </div>
              </div>
            )}

            <div>
              <label className="label">Observações</label>
              <textarea
                className="input-field resize-none" rows={2}
                placeholder="Ex: Atualização semana 3"
                value={editForm.observacoes}
                onChange={e => setEditForm(f => ({ ...f, observacoes: e.target.value }))}
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setEditTarget(null)} className="btn-secondary flex-1">Cancelar</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {saving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Salvando...</> : '✓ Salvar'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ── Modal: Confirmar Exclusão ────────────────────────────────────────── */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Excluir Contrato" size="sm">
        {deleteTarget && (
          <div className="flex flex-col gap-4">
            <div className="bg-red-900/20 border border-red-800/40 rounded-lg px-4 py-3 flex items-start gap-3">
              <AlertTriangle size={16} className="text-red-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-white font-medium">Tem certeza que deseja excluir?</p>
                <p className="text-xs text-slate-400 mt-1">
                  Contrato de <strong className="text-white">{deleteTarget.userName}</strong> · Banca: <strong className="text-white">{fmt(deleteTarget.valorAtual)}</strong>
                </p>
                <p className="text-xs text-red-400 mt-1">Esta ação é irreversível.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="btn-secondary flex-1">Cancelar</button>
              <button
                onClick={handleDelete}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Trash2 size={14} />}
                Excluir
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Modal: Renovar Contrato ──────────────────────────────────────────── */}
      <Modal isOpen={!!renewTarget} onClose={() => setRenewTarget(null)} title="Renovar Contrato" size="sm">
        {renewTarget && (
          <div className="flex flex-col gap-4">
            <div className="bg-surface-300/60 border border-surface-400 rounded-lg px-4 py-3">
              <p className="text-sm font-semibold text-white">{renewTarget.userName}</p>
              <p className="text-xs text-slate-500 mt-0.5">Novo ciclo será criado com os valores abaixo</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-slate-500">Valor Líquido (base nova)</p>
                  <p className="text-green-400 font-semibold font-mono text-sm">{fmt(renewTarget.valorLiquidoCliente)}</p>
                </div>
                <div>
                  <p className="text-slate-500">Nova meta (200%)</p>
                  <p className="text-white font-semibold font-mono text-sm">{fmt(renewTarget.valorLiquidoCliente * 2)}</p>
                </div>
                <div>
                  <p className="text-slate-500">Comissão mantida</p>
                  <p className="text-yellow-400 font-semibold">{renewTarget.comissaoPercent}%</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setRenewTarget(null)} className="btn-secondary flex-1">Cancelar</button>
              <button
                onClick={handleRenew}
                disabled={saving}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
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

// ─── Sub-componente: linha da tabela ──────────────────────────────────────────

interface ContractRowProps {
  contract: BancaContract
  onEdit: (c: BancaContract) => void
  onDelete: (c: BancaContract) => void
  onRenew: (c: BancaContract) => void
}

const ContractRow = ({ contract: c, onEdit, onDelete, onRenew }: ContractRowProps) => {
  const status   = STATUS_CONFIG[c.status]
  const encerrado = c.status !== 'ATIVO'
  const progresso = Math.min(100, ((c.valorAtual - c.valorInicial) / c.valorInicial) * 100)

  return (
    <div className="px-5 py-4 border-b border-surface-300 last:border-0 hover:bg-surface-300/30 transition-colors group">
      {/* Mobile: stack layout */}
      <div className="flex flex-col lg:grid lg:grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr_110px] gap-2 lg:gap-3 lg:items-center">

        {/* Usuário + barra de progresso */}
        <div className="min-w-0">
          <p className="text-sm font-medium text-white truncate">{c.userName}</p>
          <p className="text-xs text-slate-500 truncate">{c.userEmail}</p>
          {/* Barra de progresso até 200% */}
          <div className="mt-1.5 h-1 bg-surface-300 rounded-full overflow-hidden w-full max-w-[180px]">
            <div
              className={`h-full rounded-full transition-all ${progresso >= 100 ? 'bg-yellow-400' : progresso > 0 ? 'bg-green-500' : 'bg-red-500'}`}
              style={{ width: `${Math.max(0, Math.min(100, progresso + 50))}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-600 mt-0.5">{progresso.toFixed(1)}% de progresso</p>
        </div>

        {/* Valores */}
        <span className="text-sm text-slate-400 font-mono lg:block"><span className="lg:hidden text-xs text-slate-600">Inicial: </span>{fmt(c.valorInicial)}</span>
        <span className="text-sm text-white font-mono font-medium lg:block"><span className="lg:hidden text-xs text-slate-600">Atual: </span>{fmt(c.valorAtual)}</span>
        <span className={`text-sm font-mono font-medium lg:block ${c.lucroBruto > 0 ? 'text-green-400' : 'text-slate-500'}`}>
          <span className="lg:hidden text-xs text-slate-600">Lucro: </span>{fmt(c.lucroBruto)}
        </span>
        <span className="text-sm text-yellow-400 font-mono lg:block">
          <span className="lg:hidden text-xs text-slate-600">Comissão ({c.comissaoPercent}%): </span>{fmt(c.comissaoValor)}
        </span>
        <span className="text-sm text-white font-mono font-semibold lg:block">
          <span className="lg:hidden text-xs text-slate-600">Líquido: </span>{fmt(c.valorLiquidoCliente)}
        </span>

        {/* Status badge */}
        <div>
          <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${status.color}`}>
            {status.icon}
            {status.label}
          </span>
          <p className="text-[10px] text-slate-600 mt-1">{fmtDate(c.createdAt)}</p>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-1.5 lg:justify-end">
          {encerrado ? (
            <button
              onClick={() => onRenew(c)}
              className="flex items-center gap-1.5 text-xs text-green-400 border border-green-800/50 bg-green-900/30 px-2.5 py-1.5 rounded hover:bg-green-800/50 transition-colors"
            >
              <RefreshCw size={11} />
              Renovar
            </button>
          ) : (
            <>
              <button
                onClick={() => onEdit(c)}
                className="flex items-center gap-1.5 text-xs text-slate-300 border border-surface-400 bg-surface-300 px-2 py-1.5 rounded hover:border-green-700/50 hover:text-green-400 transition-colors"
                title="Editar"
              >
                <Edit2 size={11} />
              </button>
              <button
                onClick={() => onDelete(c)}
                className="flex items-center gap-1.5 text-xs text-slate-400 border border-surface-400 bg-surface-300 px-2 py-1.5 rounded hover:border-red-700/50 hover:text-red-400 transition-colors"
                title="Excluir"
              >
                <Trash2 size={11} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
