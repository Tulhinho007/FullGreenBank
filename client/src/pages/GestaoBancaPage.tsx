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
  { id: 'conservador', label: 'Conservador', target: '1% a 3% diário', color: 'border-blue-100 bg-blue-50 text-blue-600' },
  { id: 'moderado', label: 'Moderado', target: '3% a 9% diário', color: 'border-amber-100 bg-amber-50 text-amber-600' },
  { id: 'agressivo', label: 'Agressivo', target: 'Acima de 10% diário', color: 'border-rose-100 bg-rose-50 text-rose-600' },
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

      <div className="mb-6">
        <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <Wallet className="text-emerald-500" size={32} />
          Gestão de Banca
        </h2>
        <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mt-1 ml-10">Gerenciamento estratégico e dinâmico do seu capital</p>
      </div>

      {/* BARRA DE CASA + BANCA */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 shadow-inner">
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">

          {/* Dropdown Casa */}
          <div className="relative w-full sm:w-64">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Casa de Aposta</label>
            <div className="relative">
              <select
                title="Casa de Aposta"
                className="w-full bg-white border border-slate-100 rounded-xl py-2.5 pl-4 pr-10 text-sm font-bold text-slate-800 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all shadow-sm"
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
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Dropdown Banca + Ações (só aparece se a casa tem banca) */}
          {casaTemBanca && (
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              <div className="relative w-full sm:w-56">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Banca Selecionada</label>
                <div className="relative">
                  <select
                    title="Carteira Selecionada"
                    className="w-full bg-white border border-slate-100 rounded-xl py-2.5 pl-4 pr-10 text-sm font-bold text-slate-800 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all shadow-sm"
                    value={selectedCarteiraId}
                    onChange={(e) => setSelectedCarteiraId(e.target.value)}
                  >
                    {todasCarteiras.filter(c => c.casaAposta === casaAposta).map(c => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-5">
                <button
                  onClick={() => { setEditBancaNome(carteiraAtiva?.nome || ''); setIsModalEditBancaOpen(true) }}
                  disabled={!selectedCarteiraId}
                  className="p-3 bg-white hover:bg-slate-50 text-blue-500 rounded-xl border border-slate-100 transition-all disabled:opacity-30 shadow-sm active:scale-95"
                  title="Editar Nome"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => setIsModalDeleteBancaOpen(true)}
                  disabled={!selectedCarteiraId}
                  className="p-3 bg-white hover:bg-slate-50 text-rose-500 rounded-xl border border-slate-100 transition-all disabled:opacity-30 shadow-sm active:scale-95"
                  title="Excluir"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0 pt-0 md:pt-5">
          {casaTemBanca && (
            <button
              onClick={() => { 
                if (isStarter && todasCarteiras.length >= 1) {
                  setShowUpgradeModal(true)
                  return
                }
                setNovaBancaNome(''); setNovaBancaValorInicial(''); setIsModalBancaOpen(true) 
              }}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl border border-slate-200 bg-white text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
            >
              <Plus size={14} className="text-emerald-500" /> Nova Banca
            </button>
          )}
          <button
            onClick={handleAddRow}
            disabled={!selectedCarteiraId}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-2.5 rounded-xl bg-emerald-600 text-[10px] font-black uppercase tracking-widest text-white hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 active:scale-95"
          >
            <Plus size={14} /> Adicionar Linha
          </button>
        </div>
      </div>

      {/* CARD DE ATIVAÇÃO — aparece quando a casa ainda não tem banca */}
      {!casaTemBanca && (
        <div className="flex flex-col items-center justify-center py-20 px-8 bg-white border border-slate-100 rounded-[2.5rem] text-center gap-6 shadow-sm overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center border border-slate-100 shadow-inner group-hover:scale-110 transition-transform duration-500 relative z-10">
            <Rocket size={32} className="text-emerald-500" />
          </div>
          <div className="relative z-10">
            <h3 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-tight">Primeiros Passos em <span className="text-emerald-600">{casaAposta}</span></h3>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest max-w-sm mx-auto leading-relaxed">
              Você ainda não tem uma banca ativa nesta casa. Defina um valor inicial para começar a sua jornada.
            </p>
          </div>
          <form
            onSubmit={handleAtivarBanca}
            className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-lg mt-4 relative z-10"
          >
            <input
              type="text"
              required
              placeholder="Nome da banca (ex: Banca Principal)"
              value={novaBancaNome}
              onChange={e => setNovaBancaNome(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-bold text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all"
            />
            <CurrencyInput
              value={novaBancaValorInicial as number}
              onChange={(v) => setNovaBancaValorInicial(v)}
              placeholder="Valor Inicial"
              alertLimit={10}
              className="w-full sm:w-48 bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-bold text-slate-800 focus:ring-emerald-500/10"
            />
            <button
              type="submit"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-emerald-600 text-[10px] font-black uppercase tracking-widest text-white hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
              onClick={(e) => {
                if (isStarter && todasCarteiras.length >= 1) {
                  e.preventDefault()
                  setShowUpgradeModal(true)
                }
              }}
            >
              <Rocket size={14} /> Ativar
            </button>
          </form>
        </div>
      )}

      {/* CARDS KPI — só mostrar quando a casa tem banca ativa */}
      {casaTemBanca && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                    <Wallet size={20} className="text-slate-400" />
                  </div>
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Banca Inicial</span>
                </div>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center border border-emerald-100">
                  <Edit2 size={12} className="text-emerald-600" />
                </div>
              </div>
              <div className="relative z-10">
                <CurrencyInput
                  value={bancaInicialAtual}
                  onChange={(v) => handleSaveConfigCarteira('bancaInicial', String(v))}
                  disabled={!selectedCarteiraId}
                  alertLimit={1000}
                  className="text-4xl font-black text-slate-800 tracking-tight bg-transparent border-none focus:ring-0 p-0 w-full"
                />
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mt-2">Capital de aporte inicial registrado</p>
              </div>
            </div>

            <div className="bg-emerald-600 p-8 rounded-[2.5rem] shadow-xl shadow-emerald-600/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
                    <TrendingUp size={20} className="text-white" />
                  </div>
                  <span className="text-[11px] font-black text-emerald-100 uppercase tracking-widest">Banca Atual</span>
                </div>
                {bancaAtual > bancaInicialAtual && (
                  <span className="text-[10px] font-black bg-white/20 text-white px-2.5 py-1 rounded-full border border-white/20 uppercase tracking-widest">
                    +{formatCurrency(bancaAtual - bancaInicialAtual)}
                  </span>
                )}
              </div>
              <div className="relative z-10">
                <p className="text-4xl font-black text-white tracking-tight">{formatCurrency(bancaAtual)}</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-1 h-1 rounded-full bg-emerald-300 animate-ping"></div>
                  <p className="text-[9px] font-black text-emerald-100/60 uppercase tracking-[0.2em]">Cálculo em tempo real (Patrimônio)</p>
                </div>
              </div>
            </div>
          </div>

          {/* TABELA */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] text-slate-400 uppercase font-black tracking-[0.2em] border-b border-slate-100">
                    <th className="px-6 py-5">Data</th>
                    <th className="px-6 py-5">Banca Inicial</th>
                    <th className="px-6 py-5">Depósito (+)</th>
                    <th className="px-6 py-5">Saque (-)</th>
                    <th className="px-6 py-5">Resultado</th>
                    <th className="px-6 py-5">% Diário</th>
                    <th className="px-6 py-5">Banca Final</th>
                    <th className="px-6 py-5 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-500 text-sm">Carregando histórico...</td></tr>
                  ) : computedRows.length === 0 ? (
                    <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-500 text-sm">Nenhum registro diário. Clique em "Adicionar Linha" para começar.</td></tr>
                  ) : (
                    computedRows.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/50 transition-all group">
                        <td className="px-6 py-4">
                          {r.isEditing ? (
                            <input type="date" value={r.date} onChange={e => updateRow(r.id, 'date', e.target.value)} className="bg-white border border-slate-100 text-sm font-bold text-slate-800 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-emerald-500/10 shadow-sm" />
                          ) : (
                            <div className="flex items-center gap-2 text-sm font-bold text-slate-700 tracking-tight">
                              <Calendar size={14} className="text-slate-200" /> 
                              {r.date.split('-').reverse().join('/')}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-400">{formatCurrency(r.calcInitial)}</td>
                        <td className="px-6 py-4">
                          {r.isEditing ? (
                            <CurrencyInput
                              value={r.deposit}
                              onChange={v => updateRow(r.id, 'deposit', String(v))}
                              alertLimit={1000}
                              className="w-28 text-sm bg-white border-slate-100 shadow-sm py-1.5"
                            />
                          ) : (
                            <span className="text-sm font-bold text-emerald-600">{r.deposit > 0 ? `+${formatCurrency(r.deposit)}` : '-'}</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {r.isEditing ? (
                            <CurrencyInput
                              value={r.withdrawal}
                              onChange={v => updateRow(r.id, 'withdrawal', String(v))}
                              alertLimit={1000}
                              className="w-28 text-sm bg-white border-slate-100 shadow-sm py-1.5"
                            />
                          ) : (
                            <span className="text-sm font-bold text-rose-500">{r.withdrawal > 0 ? `-${formatCurrency(r.withdrawal)}` : '-'}</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {r.isEditing ? (
                            <CurrencyInput
                              value={r.result}
                              onChange={v => updateRow(r.id, 'result', String(v))}
                              alertLimit={1000}
                              allowNegative={true}
                              className="w-28 text-sm bg-white border-slate-100 shadow-sm py-1.5"
                            />
                          ) : (
                            <span className={`text-sm font-black ${r.result > 0 ? 'text-emerald-600' : r.result < 0 ? 'text-rose-500' : 'text-slate-300'}`}>
                              {r.result > 0 ? '+' : ''}{formatCurrency(r.result)}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest border shadow-sm ${r.calcPct > 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : r.calcPct < 0 ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                            {r.calcPct > 0 ? '+' : ''}{r.calcPct.toFixed(2)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-black text-slate-800 tracking-tight">{formatCurrency(r.calcFinal)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-1">
                            {r.isEditing ? (
                              <>
                                <button onClick={() => handleSaveRow(r)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"><CheckCircle size={18} /></button>
                                <button onClick={() => r.isNew ? handleDeleteRow(r.id, true) : toggleEditRow(r.id, false)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-colors"><X size={18} /></button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => toggleEditRow(r.id, true)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"><Edit2 size={16} /></button>
                                <button onClick={() => handleDeleteRow(r.id, false)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
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
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <Trophy size={14} className="text-amber-500" /> Perfil de Risco Estratégico
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {RISK_PROFILES.map(p => (
                <button
                  key={p.id}
                  onClick={() => handleSaveConfigCarteira('perfilRisco', p.id)}
                  className={`p-6 rounded-[2rem] border text-left flex flex-col gap-2 transition-all shadow-sm group relative overflow-hidden ${riskProfileAtual === p.id ? 'border-emerald-600 bg-emerald-50 shadow-emerald-600/10 ring-2 ring-emerald-600/10' : `${p.color} border-transparent opacity-80 hover:opacity-100 hover:border-slate-100 hover:bg-white`}`}
                >
                  <div className="flex items-center justify-between relative z-10">
                    <span className="font-black text-sm uppercase tracking-tight">{p.label}</span>
                    {riskProfileAtual === p.id && (
                      <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-white">
                        <CheckCircle size={14} />
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-60 relative z-10">{p.target}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {isModalBancaOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-[6px] z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="nm-modal border-none w-full max-w-md rounded-[2.5rem] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
                  <Plus className="text-emerald-600" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">Nova Banca</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{casaAposta}</p>
                </div>
              </div>
              <button onClick={() => setIsModalBancaOpen(false)} className="w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center text-slate-300 hover:text-slate-500 transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCriarNovaBanca} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome da Carteira</label>
                <input 
                  type="text" 
                  autoFocus 
                  required 
                  value={novaBancaNome} 
                  onChange={e => setNovaBancaNome(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all"
                  placeholder="Ex: Banca Principal"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Capital Inicial (R$)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  min="0" 
                  value={novaBancaValorInicial} 
                  onChange={e => setNovaBancaValorInicial(e.target.value ? Number(e.target.value) : '')} 
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all"
                  placeholder="0.00" 
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsModalBancaOpen(false)} className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all">Cancelar</button>
                <button type="submit" className="px-10 py-3 rounded-xl bg-emerald-600 text-[10px] font-black uppercase tracking-widest text-white hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-500/20 active:scale-95">Criar Banca</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isModalEditBancaOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-[6px] z-[110] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="nm-modal border-none w-full max-w-sm rounded-[2.5rem] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center border border-blue-100 text-blue-600">
                  <Edit2 size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">Renomear</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ajuste de identificação</p>
                </div>
              </div>
              <button onClick={() => setIsModalEditBancaOpen(false)} className="w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center text-slate-300 hover:text-slate-500 transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditarBanca} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Novo Nome</label>
                <input 
                  type="text" 
                  autoFocus 
                  required 
                  value={editBancaNome} 
                  onChange={e => setEditBancaNome(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all font-black"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsModalEditBancaOpen(false)} className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all">Cancelar</button>
                <button type="submit" className="px-10 py-3 rounded-xl bg-blue-600 text-[10px] font-black uppercase tracking-widest text-white hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20 active:scale-95">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isModalDeleteBancaOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-[6px] z-[120] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="nm-modal border-none w-full max-w-md rounded-[2.5rem] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center border border-rose-100 text-rose-600">
                  <Trash2 size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">Gerir Bancas</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Remoção de registros</p>
                </div>
              </div>
              <button onClick={() => setIsModalDeleteBancaOpen(false)} className="w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center text-slate-300 hover:text-slate-500 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest text-center">Selecione uma banca de <span className="text-slate-800">{casaAposta}</span> para excluir</p>
              <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {todasCarteiras.filter(c => c.casaAposta === casaAposta).map(c => (
                  <button 
                    key={c.id} 
                    onClick={() => handleExcluirBanca(c.id)} 
                    className="flex items-center justify-between p-5 rounded-2xl bg-slate-50 hover:bg-rose-50 border border-slate-100 hover:border-rose-100 transition-all group/item shadow-sm"
                  >
                    <div className="text-left">
                      <span className="text-sm font-black text-slate-800 uppercase tracking-tight block">{c.nome}</span>
                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{c.casaAposta}</span>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center border border-slate-100 text-slate-300 group-hover/item:text-rose-500 group-hover/item:border-rose-100 transition-colors">
                      <Trash2 size={14} />
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex justify-center pt-4">
                <button onClick={() => setIsModalDeleteBancaOpen(false)} className="px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all">Fechar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isConfirmDeleteOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-[6px] z-[130] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="nm-modal border-none w-full max-w-sm rounded-[2.5rem] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-10 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-rose-50 rounded-[2rem] flex items-center justify-center mb-6 border border-rose-100 shadow-inner">
                <Trash2 size={40} className="text-rose-500 animate-pulse" />
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">Confirmar Exclusão</h3>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-relaxed mb-8">
                Deseja realmente apagar a banca <span className="text-rose-600 font-black">"{todasCarteiras.find(c => c.id === carteiraToDeleteId)?.nome}"</span>? Esta ação é irreversível.
              </p>
              <div className="flex flex-col w-full gap-3">
                <button onClick={confirmExcluirBanca} className="w-full py-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-rose-500/20">
                  Sim, Excluir Agora
                </button>
                <button onClick={() => { setIsConfirmDeleteOpen(false); setCarteiraToDeleteId(null) }} className="w-full py-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showUpgradeModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-[6px] z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="nm-modal border-none w-full max-w-sm rounded-[2.5rem] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-10 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-amber-50 rounded-[2rem] flex items-center justify-center mb-6 border border-amber-100 shadow-inner">
                <ShieldCheck size={40} className="text-amber-500" />
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">Upgrade Necessário</h3>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-relaxed mb-8">
                O seu plano atual permite apenas <span className="text-slate-800 font-black">1 banca ativa</span>. <br />
                Desbloqueie o acesso <span className="text-amber-600 font-black">PRO</span> para bancas ilimitadas e gestão profissional completa.
              </p>
              <div className="flex flex-col w-full gap-3">
                <button 
                  onClick={() => {
                    setShowUpgradeModal(false)
                    window.location.href = '/planos'
                  }} 
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-amber-500/20"
                >
                  Liberar Bancas PRO
                </button>
                <button onClick={() => setShowUpgradeModal(false)} className="w-full py-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95">
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
