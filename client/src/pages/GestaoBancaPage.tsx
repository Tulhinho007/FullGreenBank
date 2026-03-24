import { useState, useMemo, useEffect } from 'react'
import {
  Wallet, TrendingUp, Plus, Trash2, Edit2, CheckCircle, ChevronDown, Trophy, Calendar, X, Rocket, ShieldCheck
} from 'lucide-react'
import { formatCurrency } from '../utils/formatters'
import toast from 'react-hot-toast'
import api from '../services/api'
import { CurrencyInput } from '../components/ui/CurrencyInput'
import { useAuth } from '../contexts/AuthContext'
import { addLog } from '../services/log.service'

interface DailyRow {
  id: string
  date: string
  initial: number
  deposit: number
  withdrawal: number
  result: number
  isEditing?: boolean
  isNew?: boolean
}

const RISK_PROFILES = [
  { id: 'conservador', label: 'Conservador', target: '1% a 3% diário', color: 'border-blue-500/50 bg-blue-900/20 text-blue-400' },
  { id: 'moderado', label: 'Moderado', target: '3% a 9% diário', color: 'border-amber-500/50 bg-amber-900/20 text-amber-400' },
  { id: 'agressivo', label: 'Agressivo', target: 'Acima de 10% diário', color: 'border-red-500/50 bg-red-900/20 text-red-400' },
]

// Casas de apoio padrão (fallback se o Admin ainda não cadastrou nenhuma)
const FALLBACK_BOOKMAKERS = [
  'Betano', 'Bet365', 'Sportingbet', 'Pixbet', 'Blaze',
  'Novibet', 'KTO', 'Betfair', 'Pinnacle', 'Mr. Jack Bet',
  'Betnacional', 'Vaidebet', 'Galera.bet', 'Estrela Bet', 'Outros',
]

// Lê a lista de casas do painel Admin (localStorage fgb_bookmakers)
const getBookmakersFromAdmin = (): string[] => {
  try {
    const stored = localStorage.getItem('fgb_bookmakers')
    if (stored) {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((c: any) => c.name || c).filter(Boolean)
      }
    }
  } catch {}
  return FALLBACK_BOOKMAKERS
}

export interface BancaCarteira {
  id: string
  nome: string
  casaAposta: string
  bancaInicial: number
  perfilRisco: string
}

export const GestaoBancaPage = () => {
  const { user: me } = useAuth()
  const [loading, setLoading] = useState(false)
  const isStarter = me?.role === 'MEMBRO' && (!me?.plan || me?.plan === 'STARTER')
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  // Lista de casas vem do painel Admin
  const [bookmakers] = useState<string[]>(() => getBookmakersFromAdmin())
  const [casaAposta, setCasaAposta] = useState<string>(() => getBookmakersFromAdmin()[0] || 'Betano')

  const [todasCarteiras, setTodasCarteiras] = useState<BancaCarteira[]>([])
  const [selectedCarteiraId, setSelectedCarteiraId] = useState<string>('')
  const [rows, setRows] = useState<DailyRow[]>([])
  const [backupRow, setBackupRow] = useState<DailyRow | null>(null)

  // Modal nova banca
  const [isModalBancaOpen, setIsModalBancaOpen] = useState(false)
  const [novaBancaNome, setNovaBancaNome] = useState('')
  const [novaBancaValorInicial, setNovaBancaValorInicial] = useState<number | ''>('')

  // Modal editar banca
  const [isModalEditBancaOpen, setIsModalEditBancaOpen] = useState(false)
  const [editBancaNome, setEditBancaNome] = useState('')
  const [isModalDeleteBancaOpen, setIsModalDeleteBancaOpen] = useState(false)
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false)
  const [carteiraToDeleteId, setCarteiraToDeleteId] = useState<string | null>(null)

  // Carrega apenas as carteiras já criadas — SEM auto-criar nada
  const loadCarteiras = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/gestao-banca/carteiras')
      setTodasCarteiras(
        (data || []).map((c: any) => ({ ...c, bancaInicial: Number(c.bancaInicial) }))
      )
    } catch {
      toast.error('Erro ao conectar com servidor.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCarteiras()
  }, [])

  // Quando muda casa ou lista de carteiras, seleciona a primeira da casa (se existir)
  useEffect(() => {
    if (todasCarteiras.length === 0) return
    const daCasa = todasCarteiras.filter(c => c.casaAposta === casaAposta)
    if (daCasa.length > 0) {
      if (!daCasa.find(c => c.id === selectedCarteiraId)) {
        setSelectedCarteiraId(daCasa[0].id)
      }
    } else {
      setSelectedCarteiraId('')
      setRows([])
    }
  }, [casaAposta, todasCarteiras])

  // Carrega itens da carteira selecionada
  useEffect(() => {
    if (!selectedCarteiraId) return
    const fetchRows = async () => {
      setLoading(true)
      try {
        const { data } = await api.get(`/gestao-banca/carteiras/${selectedCarteiraId}/itens`)
        if (data && data.itens) {
          setRows(data.itens.map((i: any) => ({
            id: i.id, date: i.dataReferencia, initial: 0,
            deposit: Number(i.deposito), withdrawal: Number(i.saque),
            result: Number(i.resultado), isEditing: false, isNew: false,
          })))
        } else {
          setRows([])
        }
      } catch {
        toast.error('Erro ao carregar histórico.')
      } finally {
        setLoading(false)
      }
    }
    fetchRows()
  }, [selectedCarteiraId])

  const carteiraAtiva = todasCarteiras.find(c => c.id === selectedCarteiraId)
  const bancaInicialAtual = carteiraAtiva ? Number(carteiraAtiva.bancaInicial) : 0
  const riskProfileAtual = carteiraAtiva ? carteiraAtiva.perfilRisco : 'moderado'

  // Verifica se a casa selecionada já tem pelo menos uma banca ativa
  const casaTemBanca = todasCarteiras.some(c => c.casaAposta === casaAposta)

  const computedRows = useMemo(() => {
    let currentInitial = bancaInicialAtual
    return rows.map((r: DailyRow, i: number) => {
      const initialAtRow = i === 0 ? bancaInicialAtual : currentInitial
      const finalAtRow = initialAtRow + r.deposit - r.withdrawal + r.result
      const pct = initialAtRow > 0 ? (r.result / initialAtRow) * 100 : 0
      currentInitial = finalAtRow
      return { ...r, calcInitial: initialAtRow, calcFinal: finalAtRow, calcPct: pct }
    })
  }, [rows, bancaInicialAtual])

  const bancaAtual = computedRows.length > 0 ? computedRows[computedRows.length - 1].calcFinal : bancaInicialAtual

  const handleSaveConfigCarteira = async (campo: 'bancaInicial' | 'perfilRisco', value: string | number) => {
    if (!selectedCarteiraId) return
    try {
      await api.patch(`/gestao-banca/carteiras/${selectedCarteiraId}`, { [campo]: value })
      setTodasCarteiras(prev => prev.map(c =>
        c.id === selectedCarteiraId ? { ...c, [campo]: value } : c
      ))
    } catch {
      toast.error('Erro ao atualizar info da banca.')
    }
  }

  const handleAddRow = () => {
    const today = new Date().toISOString().split('T')[0]
    setRows(prev => [
      ...prev,
      { id: Date.now().toString(), date: today, initial: 0, deposit: 0, withdrawal: 0, result: 0, isEditing: true, isNew: true }
    ])
  }

  const handleDeleteRow = async (id: string, isNew?: boolean) => {
    if (isNew) { setRows(prev => prev.filter(r => r.id !== id)); return }
    try {
      await api.delete(`/gestao-banca/item/${id}`)
      setRows(prev => prev.filter(r => r.id !== id))
      toast.success('Linha removida')
    } catch { toast.error('Erro ao remover do banco') }
  }

  const toggleEditRow = (id: string, editing: boolean) => {
    if (editing) {
      const row = rows.find(r => r.id === id)
      if (row) setBackupRow({ ...row })
      setRows(prev => prev.map(r => r.id === id ? { ...r, isEditing: true } : r))
    } else {
      if (backupRow) {
        setRows(prev => prev.map(r => r.id === id ? { ...backupRow, isEditing: false } : r))
        setBackupRow(null)
      } else {
        setRows(prev => prev.map(r => r.id === id ? { ...r, isEditing: false } : r))
      }
    }
  }

  const handleSaveRow = async (r: DailyRow) => {
    if (!selectedCarteiraId) return toast.error('Selecione uma Banca primeiro.')
    try {
      if (r.isNew) {
        const { data } = await api.post(`/gestao-banca/carteiras/${selectedCarteiraId}/item`, {
          date: r.date, deposit: r.deposit, withdrawal: r.withdrawal, result: r.result
        })
        setRows(prev => prev.map(row => row.id === r.id ? { ...row, id: data.id, isEditing: false, isNew: false } : row))
        toast.success('Criado!')
        if (me) addLog({ userEmail: me.email, userName: me.name, userRole: me.role, category: 'Financeiro', action: 'Lançamento registrado', detail: `Novo lançamento na banca` })
      } else {
        await api.patch(`/gestao-banca/item/${r.id}`, {
          date: r.date, deposit: r.deposit, withdrawal: r.withdrawal, result: r.result
        })
        setRows(prev => prev.map(row => row.id === r.id ? { ...row, isEditing: false } : row))
        toast.success('Atualizado!')
      }
      setBackupRow(null) // Limpa backup após salvar com sucesso
    } catch { toast.error('Erro ao salvar no banco.') }
  }
  const updateRow = (id: string, field: keyof DailyRow, value: string) =>
    setRows(prev => prev.map(r => {
      if (r.id !== id) return r
      if (field === 'date') return { ...r, date: value }
      return { ...r, [field]: Number(value) || 0 }
    }))

  // ATIVAR BANCA — só cria no banco quando o usuário preenche e confirma
  const handleAtivarBanca = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!novaBancaNome.trim()) return toast.error('Digite o nome da banca')
    if (!novaBancaValorInicial || Number(novaBancaValorInicial) <= 0) return toast.error('Informe um valor inicial maior que zero')
    try {
      const { data } = await api.post('/gestao-banca/carteiras', {
        nome: novaBancaNome.trim(),
        casaAposta,
        perfilRisco: 'moderado',
        bancaInicial: Number(novaBancaValorInicial),
      })
      const novaCarteira = { ...data, bancaInicial: Number(data.bancaInicial) }
      setTodasCarteiras(prev => [...prev, novaCarteira])
      setSelectedCarteiraId(novaCarteira.id)
      setIsModalBancaOpen(false)
      setNovaBancaNome('')
      setNovaBancaValorInicial('')
      toast.success(`Banca "${novaCarteira.nome}" ativada em ${casaAposta}! 🚀`)
      if (me) addLog({ userEmail: me.email, userName: me.name, userRole: me.role, category: 'Financeiro', action: 'Banca criada', detail: `Criou banca: ${novaBancaNome} em ${casaAposta}` })
    } catch {
      toast.error('Erro ao ativar banca.')
    }
  }

  const handleCriarNovaBanca = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!novaBancaNome.trim()) return toast.error('Digite o nome da Banca')
    try {
      const { data } = await api.post('/gestao-banca/carteiras', {
        nome: novaBancaNome.trim(), casaAposta, perfilRisco: 'moderado',
        bancaInicial: Number(novaBancaValorInicial) || 0,
      })
      const novaCarteira = { ...data, bancaInicial: Number(data.bancaInicial) }
      setTodasCarteiras(prev => [...prev, novaCarteira])
      setSelectedCarteiraId(novaCarteira.id)
      setIsModalBancaOpen(false)
      setNovaBancaNome('')
      setNovaBancaValorInicial('')
      toast.success('Banca criada com sucesso!')
      if (me) addLog({ userEmail: me.email, userName: me.name, userRole: me.role, category: 'Financeiro', action: 'Banca criada', detail: `Criou banca: ${novaBancaNome}` })
    } catch { toast.error('Erro ao criar banca.') }
  }

  const handleEditarBanca = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCarteiraId || !editBancaNome.trim()) return
    try {
      await api.patch(`/gestao-banca/carteiras/${selectedCarteiraId}`, { nome: editBancaNome.trim() })
      setTodasCarteiras(prev => prev.map(c =>
        c.id === selectedCarteiraId ? { ...c, nome: editBancaNome.trim() } : c
      ))
      setIsModalEditBancaOpen(false)
      toast.success('Banca renomeada!')
      if (me) addLog({ userEmail: me.email, userName: me.name, userRole: me.role, category: 'Financeiro', action: 'Banca renomeada', detail: `Renomeou banca para: ${editBancaNome}` })
    } catch { toast.error('Erro ao renomear banca.') }
  }

  const handleExcluirBanca = (id: string) => {
    setCarteiraToDeleteId(id)
    setIsConfirmDeleteOpen(true)
  }

  const confirmExcluirBanca = async () => {
    if (!carteiraToDeleteId) return
    try {
      await api.delete(`/gestao-banca/carteiras/${carteiraToDeleteId}`)
      setTodasCarteiras(prev => prev.filter(c => c.id !== carteiraToDeleteId))
      if (carteiraToDeleteId === selectedCarteiraId) setSelectedCarteiraId('')
      toast.success('Banca excluída com sucesso!')
      if (me) addLog({ userEmail: me.email, userName: me.name, userRole: me.role, category: 'Financeiro', action: 'Banca excluída', detail: `Excluiu banca ID: ${carteiraToDeleteId}` })
      setIsConfirmDeleteOpen(false)
      setIsModalDeleteBancaOpen(false)
      setCarteiraToDeleteId(null)
    } catch { toast.error('Erro ao excluir banca.') }
  }

  return (
    <div className="flex flex-col gap-6 font-sans">

      <div>
        <h2 className="font-display font-semibold text-white">Gestão de Banca</h2>
        <p className="text-xs text-slate-500 mt-0.5">Gerenciamento dinâmico diário do seu capital</p>
      </div>

      {/* BARRA DE CASA + BANCA */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-surface-200/50 p-3 rounded-xl border border-surface-300">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">

          {/* Dropdown Casa (lista do Admin) */}
          <div className="relative w-full sm:w-56">
            <select
              title="Casa de Aposta"
              className="input-field py-2 pr-8 pl-3 text-sm appearance-none cursor-pointer bg-surface-300 outline-none focus:ring-1 ring-green-500/50"
              value={casaAposta}
              onChange={(e) => {
                setCasaAposta(e.target.value)
                setSelectedCarteiraId('')
                setRows([])
              }}
            >
              {bookmakers.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Dropdown Banca + Ações (só aparece se a casa tem banca) */}
          {casaTemBanca && (
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <div className="relative w-full sm:w-48">
                <select
                  title="Carteira Selecionada"
                  className="input-field py-2 pr-8 pl-3 text-sm appearance-none cursor-pointer bg-surface-300 outline-none focus:ring-1 ring-green-500/50"
                  value={selectedCarteiraId}
                  onChange={(e) => setSelectedCarteiraId(e.target.value)}
                >
                  {todasCarteiras.filter(c => c.casaAposta === casaAposta).map(c => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
                <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => { setEditBancaNome(carteiraAtiva?.nome || ''); setIsModalEditBancaOpen(true) }}
                  disabled={!selectedCarteiraId}
                  className="p-2 bg-surface-300 hover:bg-surface-400 text-blue-400 rounded-lg border border-surface-400 transition-all disabled:opacity-30"
                  title="Editar Nome"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => setIsModalDeleteBancaOpen(true)}
                  disabled={!selectedCarteiraId}
                  className="p-2 bg-surface-300 hover:bg-surface-400 text-red-400 rounded-lg border border-surface-400 transition-all disabled:opacity-30"
                  title="Excluir"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto mt-3 md:mt-0">
          {casaTemBanca && (
            <button
              onClick={() => { 
                if (isStarter && todasCarteiras.length >= 1) {
                  setShowUpgradeModal(true)
                  return
                }
                setNovaBancaNome(''); setNovaBancaValorInicial(''); setIsModalBancaOpen(true) 
              }}
              className="flex-1 md:flex-none btn-secondary flex items-center justify-center gap-2"
            >
              <Plus size={14} /> <span className="hidden sm:inline">Nova Banca</span>
            </button>
          )}
          <button
            onClick={handleAddRow}
            disabled={!selectedCarteiraId}
            className="flex-1 md:flex-none btn-primary flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/20 disabled:opacity-50"
          >
            <Plus size={14} /> Adicionar Linha
          </button>
        </div>
      </div>

      {/* CARD DE ATIVAÇÃO — aparece quando a casa ainda não tem banca */}
      {!casaTemBanca && (
        <div className="flex flex-col items-center justify-center py-16 px-8 bg-surface-200/50 border-2 border-dashed border-surface-300 rounded-2xl text-center gap-4">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/20">
            <Rocket size={28} className="text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white mb-1">Nenhuma banca em <span className="text-green-400">{casaAposta}</span></h3>
            <p className="text-sm text-slate-400 max-w-sm">
              Você ainda não tem uma banca ativa nessa casa. Defina um valor inicial para começar a acompanhar seu capital.
            </p>
          </div>
          <form
            onSubmit={handleAtivarBanca}
            className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md mt-2"
          >
            <input
              type="text"
              required
              placeholder="Nome da banca (ex: Principal)"
              value={novaBancaNome}
              onChange={e => setNovaBancaNome(e.target.value)}
              className="input-field flex-1 py-2.5 bg-surface-300 text-sm"
            />
            <CurrencyInput
              value={novaBancaValorInicial as number}
              onChange={(v) => setNovaBancaValorInicial(v)}
              placeholder="R$ 0,00"
              alertLimit={1000}
              className="w-40 py-2.5 bg-surface-300 text-sm"
            />
            <button
              type="submit"
              className="btn-primary flex items-center gap-2 whitespace-nowrap bg-green-600 hover:bg-green-500 shadow-lg shadow-green-900/20"
              onClick={(e) => {
                if (isStarter && todasCarteiras.length >= 1) {
                  e.preventDefault()
                  setShowUpgradeModal(true)
                }
              }}
            >
              <Rocket size={14} /> Ativar Banca
            </button>
          </form>
        </div>
      )}

      {/* CARDS KPI — só mostrar quando a casa tem banca ativa */}
      {casaTemBanca && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="card p-5 relative overflow-hidden group block cursor-text">
              <div className="flex items-center justify-between mb-2 z-10 relative">
                <div className="flex items-center gap-2">
                  <Wallet size={16} className="text-slate-400" />
                  <span className="text-sm font-medium text-slate-400 uppercase tracking-wider">Banca Inicial</span>
                </div>
                <Edit2 size={13} className="text-slate-500 group-hover:text-green-400 transition-colors" />
              </div>
              <CurrencyInput
                value={bancaInicialAtual}
                onChange={(v) => handleSaveConfigCarteira('bancaInicial', String(v))}
                disabled={!selectedCarteiraId}
                alertLimit={1000}
                className="text-3xl font-bold"
              />
            </label>

            <div className="card p-5 bg-gradient-to-br from-green-900/40 to-surface-100 border-green-900/50 relative overflow-hidden">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={16} className="text-green-400" />
                <span className="text-sm font-medium text-green-400/80 uppercase tracking-wider">Banca Atual</span>
                {bancaAtual > bancaInicialAtual && (
                  <span className="ml-auto text-[10px] bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full">
                    +{formatCurrency(bancaAtual - bancaInicialAtual)}
                  </span>
                )}
              </div>
              <p className="text-3xl font-bold text-green-400">{formatCurrency(bancaAtual)}</p>
            </div>
          </div>

          {/* TABELA */}
          <div className="card overflow-hidden border border-surface-300/50">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-100/50 border-b border-surface-300 text-xs text-slate-400 uppercase tracking-wider">
                    <th className="px-4 py-3.5 font-semibold min-w-[140px]">Data</th>
                    <th className="px-4 py-3.5 font-semibold min-w-[120px]">Inicial</th>
                    <th className="px-4 py-3.5 font-semibold min-w-[100px]">Depósito</th>
                    <th className="px-4 py-3.5 font-semibold min-w-[100px]">Saque</th>
                    <th className="px-4 py-3.5 font-semibold min-w-[100px]">Resultado</th>
                    <th className="px-4 py-3.5 font-semibold min-w-[80px]">% Banca</th>
                    <th className="px-4 py-3.5 font-semibold min-w-[120px]">Final</th>
                    <th className="px-4 py-3.5 font-semibold min-w-[110px] text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-200/20">
                  {loading ? (
                    <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-500 text-sm">Carregando histórico...</td></tr>
                  ) : computedRows.length === 0 ? (
                    <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-500 text-sm">Nenhum registro diário. Clique em "Adicionar Linha" para começar.</td></tr>
                  ) : (
                    computedRows.map((r) => (
                      <tr key={r.id} className="hover:bg-surface-200/10 transition-colors group">
                        <td className="px-4 py-3">
                          {r.isEditing ? (
                            <input type="date" value={r.date} onChange={e => updateRow(r.id, 'date', e.target.value)} className="bg-surface-300/50 text-sm text-white rounded px-2 py-1 outline-none border border-surface-400" />
                          ) : (
                            <div className="flex items-center gap-2 text-sm text-slate-300"><Calendar size={13} className="text-slate-500" /> {r.date.split('-').reverse().join('/')}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-300 font-mono">{formatCurrency(r.calcInitial)}</td>
                        <td className="px-4 py-3">
                          {r.isEditing ? (
                            <CurrencyInput
                              value={r.deposit}
                              onChange={v => updateRow(r.id, 'deposit', String(v))}
                              alertLimit={1000}
                              className="w-24 text-sm"
                            />
                          ) : (
                            <span className="text-sm font-mono">{r.deposit > 0 ? formatCurrency(r.deposit) : '-'}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {r.isEditing ? (
                            <CurrencyInput
                              value={r.withdrawal}
                              onChange={v => updateRow(r.id, 'withdrawal', String(v))}
                              alertLimit={1000}
                              className="w-24 text-sm"
                            />
                          ) : (
                            <span className="text-sm font-mono">{r.withdrawal > 0 ? formatCurrency(r.withdrawal) : '-'}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {r.isEditing ? (
                            <CurrencyInput
                              value={r.result}
                              onChange={v => updateRow(r.id, 'result', String(v))}
                              alertLimit={1000}
                              allowNegative={true}
                              className="w-24 text-sm"
                            />
                          ) : (
                            <span className={`text-sm font-mono font-medium ${r.result > 0 ? 'text-green-400' : r.result < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                              {r.result > 0 ? '+' : ''}{formatCurrency(r.result)}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] ${r.calcPct > 0 ? 'bg-green-500/20 text-green-400' : r.calcPct < 0 ? 'bg-red-500/20 text-red-400' : 'text-slate-500'}`}>
                            {r.calcPct > 0 ? '+' : ''}{r.calcPct.toFixed(2)}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-mono font-bold text-white">{formatCurrency(r.calcFinal)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            {r.isEditing ? (
                              <>
                                <button onClick={() => handleSaveRow(r)} className="p-1.5 text-green-500 hover:bg-green-500/20 rounded"><CheckCircle size={15} /></button>
                                <button onClick={() => r.isNew ? handleDeleteRow(r.id, true) : toggleEditRow(r.id, false)} className="p-1.5 text-slate-400 hover:bg-surface-300 rounded"><X size={15} /></button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => toggleEditRow(r.id, true)} className="p-1.5 text-blue-400 hover:bg-blue-500/20 rounded opacity-0 group-hover:opacity-100"><Edit2 size={14} /></button>
                                <button onClick={() => handleDeleteRow(r.id, false)} className="p-1.5 text-red-400 hover:bg-red-500/20 rounded opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* PERFIL DE RISCO */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><Trophy size={14} className="text-yellow-500" /> Perfil de Risco e Metas</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {RISK_PROFILES.map(p => (
                <button
                  key={p.id}
                  onClick={() => handleSaveConfigCarteira('perfilRisco', p.id)}
                  className={`p-4 rounded-xl border text-left flex flex-col gap-1 transition-all ${riskProfileAtual === p.id ? 'border-green-500 bg-green-500/10 scale-[1.02]' : `${p.color} opacity-80 hover:opacity-100`}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{p.label}</span>
                    {riskProfileAtual === p.id && <CheckCircle size={14} className="text-green-500" />}
                  </div>
                  <span className="text-xs opacity-80 font-medium">{p.target}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* MODAL NOVA BANCA ADICIONAL (quando a casa já tem banca) */}
      {isModalBancaOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-200 border border-surface-300 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-surface-300 flex items-center justify-between bg-surface-100/50">
              <h3 className="font-semibold text-white flex items-center gap-2"><Wallet size={16} className="text-green-500" /> Nova Banca em {casaAposta}</h3>
              <button onClick={() => setIsModalBancaOpen(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={handleCriarNovaBanca} className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">Nome da Carteira</label>
                <input type="text" autoFocus required value={novaBancaNome} onChange={e => setNovaBancaNome(e.target.value)} className="input-field w-full py-2.5 bg-surface-300" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">Valor Inicial (R$)</label>
                <input type="number" step="0.01" min="0" value={novaBancaValorInicial} onChange={e => setNovaBancaValorInicial(e.target.value ? Number(e.target.value) : '')} placeholder="0.00" className="input-field w-full py-2.5 bg-surface-300" />
              </div>
              <div className="bg-surface-300/50 p-3 rounded-lg border border-surface-300 text-sm text-slate-400">
                Carteira pertencerá à: <strong className="text-white">{casaAposta}</strong>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsModalBancaOpen(false)} className="px-4 py-2 rounded-lg text-sm text-slate-300 hover:bg-surface-300">Cancelar</button>
                <button type="submit" className="px-4 py-2 rounded-lg text-sm bg-green-600 text-white hover:bg-green-500 shadow-lg">Criar Banca</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDITAR BANCA */}
      {isModalEditBancaOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-surface-200 border border-surface-300 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-surface-300 flex items-center justify-between bg-surface-100/50">
              <h3 className="font-semibold text-white flex items-center gap-2"><Edit2 size={16} className="text-blue-500" /> Renomear Banca</h3>
              <button onClick={() => setIsModalEditBancaOpen(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={handleEditarBanca} className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">Novo Nome</label>
                <input type="text" autoFocus required value={editBancaNome} onChange={e => setEditBancaNome(e.target.value)} className="input-field w-full py-2.5 bg-surface-300" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsModalEditBancaOpen(false)} className="px-4 py-2 rounded-lg text-sm text-slate-300 hover:bg-surface-300">Cancelar</button>
                <button type="submit" className="px-4 py-2 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-500 shadow-lg">Salvar Alteração</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EXCLUIR BANCA */}
      {isModalDeleteBancaOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-surface-200 border border-surface-300 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-surface-300 flex items-center justify-between bg-surface-100/50">
              <h3 className="font-semibold text-white flex items-center gap-2"><Trash2 size={16} className="text-red-500" /> Excluir Banca</h3>
              <button onClick={() => setIsModalDeleteBancaOpen(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <p className="text-sm text-slate-400">Qual banca da casa <strong className="text-white">{casaAposta}</strong> deseja excluir?</p>
              <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                {todasCarteiras.filter(c => c.casaAposta === casaAposta).map(c => (
                  <button key={c.id} onClick={() => handleExcluirBanca(c.id)} className="flex items-center justify-between p-3 rounded-xl bg-surface-300 hover:bg-red-900/20 border border-surface-400 hover:border-red-500/50 transition-all group/item">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-white">{c.nome}</span>
                      <span className="text-[10px] text-slate-500 uppercase">{c.casaAposta}</span>
                    </div>
                    <Trash2 size={14} className="text-slate-500 group-hover/item:text-red-400" />
                  </button>
                ))}
              </div>
              <div className="flex justify-end pt-2 border-t border-surface-300/50">
                <button onClick={() => setIsModalDeleteBancaOpen(false)} className="px-4 py-2 rounded-lg text-sm text-slate-300 hover:bg-surface-300">Fechar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAÇÃO DE EXCLUSÃO */}
      {isConfirmDeleteOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[70] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-surface-200 border border-white/10 w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
                <Trash2 size={32} className="text-red-500 animate-pulse" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Excluir Banca?</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-8">
                Tem certeza que deseja excluir a banca <span className="text-white font-semibold">"{todasCarteiras.find(c => c.id === carteiraToDeleteId)?.nome}"</span>?<br />
                <span className="text-red-400/80 font-medium">Essa ação não pode ser desfeita e todos os dados serão perdidos.</span>
              </p>
              <div className="flex flex-col w-full gap-3">
                <button onClick={confirmExcluirBanca} className="w-full py-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold transition-all active:scale-95 shadow-lg shadow-red-900/20">
                  Sim, Excluir Agora
                </button>
                <button onClick={() => { setIsConfirmDeleteOpen(false); setCarteiraToDeleteId(null) }} className="w-full py-4 rounded-2xl bg-surface-300 hover:bg-surface-400 text-slate-300 font-semibold transition-all">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL UPGRADE PRO (LIMITE STARTER) */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-surface-200 border border-white/10 w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mb-6 border border-amber-500/20">
                <ShieldCheck size={32} className="text-amber-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Ops! Limite Atingido</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-8">
                Você já possui <span className="text-white font-semibold">1 banca</span> ativa. <br />
                Sua permissão atual não permite mais que uma.<br />
                <span className="text-amber-400 font-bold mt-2 inline-block">Assine o plano PRO para desbloquear bancas ilimitadas!</span>
              </p>
              <div className="flex flex-col w-full gap-3">
                <button 
                  onClick={() => {
                    setShowUpgradeModal(false)
                    // Opcional: navegar para planos
                    window.location.href = '/planos'
                  }} 
                  className="w-full py-4 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-bold transition-all active:scale-95 shadow-lg shadow-amber-900/20"
                >
                  Ver Planos PRO
                </button>
                <button onClick={() => setShowUpgradeModal(false)} className="w-full py-4 rounded-2xl bg-surface-300 hover:bg-surface-400 text-slate-300 font-semibold transition-all">
                  Voltar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
