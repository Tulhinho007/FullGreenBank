import { useState, useMemo, useEffect } from 'react'
import {
  Wallet, TrendingUp, Plus, Trash2, Edit2, CheckCircle, ChevronDown, Trophy, Calendar, X
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../services/api'

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
  { id: 'agressivo', label: 'Agressivo', target: 'Acima de 10% diário', color: 'border-red-500/50 bg-red-900/20 text-red-400' }
]
export interface BancaCarteira {
  id: string
  nome: string
  casaAposta: string
  bancaInicial: number
  perfilRisco: string
}

export const GestaoBancaPage = () => {
  const [loading, setLoading] = useState(false)
  const [bookmakers, setBookmakers] = useState<string[]>([])
  const [casaAposta, setCasaAposta] = useState<string>('Betano')
  
  const [todasCarteiras, setTodasCarteiras] = useState<BancaCarteira[]>([])
  const [selectedCarteiraId, setSelectedCarteiraId] = useState<string>('')
  const [rows, setRows] = useState<DailyRow[]>([])
  
  const [isModalBancaOpen, setIsModalBancaOpen] = useState(false)
  const [novaBancaNome, setNovaBancaNome] = useState('')

  const loadInitialData = async () => {
    setLoading(true)
    try {
      // 1. Puxa as casas globais
      const storedBookies = localStorage.getItem('fgb_bookmakers')
      let nomesCasas = ['Betano']
      if (storedBookies) {
        const parsed = JSON.parse(storedBookies)
        if (Array.isArray(parsed) && parsed.length > 0) nomesCasas = parsed.map((c: any) => c.name)
      }
      setBookmakers(nomesCasas)
      
      // Valida a casa atual
      const atualCasa = (nomesCasas.length > 0 && !nomesCasas.includes(casaAposta)) ? nomesCasas[0] : casaAposta
        setCasaAposta(atualCasa)
        
        // 2. Traz todas as carteiras do BD e valida/cria se faltar a da Casa atual
        const { data } = await api.get('/gestao-banca/carteiras')
        let carteirasFeitas = data || []
        
        const temNaCasa = carteirasFeitas.some((c: any) => c.casaAposta === atualCasa)
        if (!temNaCasa && atualCasa) {
           const resNova = await api.post('/gestao-banca/carteiras', {
             nome: 'Principal', casaAposta: atualCasa, perfilRisco: 'moderado'
           })
           carteirasFeitas.push(resNova.data)
        }
        
        setTodasCarteiras(carteirasFeitas)
      } catch {
        toast.error('Erro ao conectar com servidor.')
      } finally {
        setLoading(false)
      }
  }

  // Ao montar, carrega a lista mestre
  useEffect(() => {
    loadInitialData()
  }, [])

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

  const handleChangeCasa = async (novaCasa: string) => {
    setCasaAposta(novaCasa)
    const daCasa = todasCarteiras.filter(c => c.casaAposta === novaCasa)
    if (daCasa.length === 0) {
      try {
        const { data } = await api.post('/gestao-banca/carteiras', { 
           nome: 'Principal', casaAposta: novaCasa, perfilRisco: 'moderado' 
        })
        setTodasCarteiras(prev => [...prev, data])
        setSelectedCarteiraId(data.id)
      } catch {}
    }
  }

  // Quando mudar a carteira selecionada, carrega as linhas
  useEffect(() => {
    if (!selectedCarteiraId) return
    const fetchRows = async () => {
      setLoading(true)
      try {
        const { data } = await api.get(`/gestao-banca/carteiras/${selectedCarteiraId}/itens`)
        if (data && data.itens) {
          setRows(data.itens.map((i: any) => ({
            id: i.id, date: i.dataReferencia, initial: 0, deposit: Number(i.deposito), withdrawal: Number(i.saque), result: Number(i.resultado), isEditing: false, isNew: false
          })))
        } else {
          setRows([])
        }
      } catch {
        toast.error('Erro carregar histórico.')
      } finally {
        setLoading(false)
      }
    }
    fetchRows()
  }, [selectedCarteiraId])

  // Carteira Ativa Local
  const carteiraAtiva = todasCarteiras.find(c => c.id === selectedCarteiraId)
  const bancaInicialAtual = carteiraAtiva ? Number(carteiraAtiva.bancaInicial) : 0
  const riskProfileAtual = carteiraAtiva ? carteiraAtiva.perfilRisco : 'moderado'

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

  const handleSaveConfigCarteira = async (campo: 'bancaInicial' | 'perfilRisco', value: string|number) => {
    if (!selectedCarteiraId) return
    try {
       await api.patch(`/gestao-banca/carteiras/${selectedCarteiraId}`, { [campo]: value })
       setTodasCarteiras(prev => prev.map(c => c.id === selectedCarteiraId ? { ...c, [campo]: value } : c))
    } catch {
       toast.error('Erro ao atualizar info da banca.')
    }
  }

  // Handlers
  const handleAddRow = () => {
    const today = new Date().toISOString().split('T')[0]
    setRows(prev => [
      ...prev,
      { id: Date.now().toString(), date: today, initial: 0, deposit: 0, withdrawal: 0, result: 0, isEditing: true, isNew: true }
    ])
  }

  const handleDeleteRow = async (id: string, isNew?: boolean) => {
    if (isNew) {
      setRows((prev: DailyRow[]) => prev.filter((r: DailyRow) => r.id !== id))
      return
    }
    
    try {
      await api.delete(`/gestao-banca/item/${id}`)
      setRows((prev: DailyRow[]) => prev.filter((r: DailyRow) => r.id !== id))
      toast.success('Linha removida')
    } catch {
      toast.error('Erro ao remover do banco')
    }
  }

  const handleSaveRow = async (r: DailyRow) => {
    if (!selectedCarteiraId) return toast.error('Selecione uma Banca primeiro.')
    try {
      if (r.isNew) {
        const { data } = await api.post(`/gestao-banca/carteiras/${selectedCarteiraId}/item`, {
          date: r.date, deposit: r.deposit, withdrawal: r.withdrawal, result: r.result
        })
        setRows((prev: DailyRow[]) => prev.map((row: DailyRow) => row.id === r.id ? { ...row, id: data.id, isEditing: false, isNew: false } : row))
        toast.success('Criado!')
      } else {
        await api.patch(`/gestao-banca/item/${r.id}`, {
          date: r.date, deposit: r.deposit, withdrawal: r.withdrawal, result: r.result
        })
        setRows((prev: DailyRow[]) => prev.map((row: DailyRow) => row.id === r.id ? { ...row, isEditing: false } : row))
        toast.success('Atualizado!')
      }
    } catch {
      toast.error('Erro ao salvar miniatura no banco.')
    }
  }

  const toggleEditRow = (id: string, editing: boolean) => {
    setRows((prev: DailyRow[]) => prev.map((r: DailyRow) => r.id === id ? { ...r, isEditing: editing } : r))
  }

  const updateRow = (id: string, field: keyof DailyRow, value: string) => {
    setRows((prev: DailyRow[]) => prev.map((r: DailyRow) => {
      if (r.id !== id) return r
      if (field === 'date') return { ...r, date: value }
      return { ...r, [field]: Number(value) || 0 }
    }))
  }

  const handleRiskChange = (id: string) => {
    handleSaveConfigCarteira('perfilRisco', id)
  }

  const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const handleCriarNovaBanca = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!novaBancaNome.trim()) return toast.error('Digite o nome da Banca')
    
    try {
      const { data } = await api.post('/gestao-banca/carteiras', {
        nome: novaBancaNome.trim(),
        casaAposta,
        perfilRisco: 'moderado'
      })
      setTodasCarteiras(prev => [...prev, data])
      setSelectedCarteiraId(data.id)
      setIsModalBancaOpen(false)
      setNovaBancaNome('')
      toast.success('Carteira criada com sucesso!')
    } catch {
      toast.error('Erro ao criar carteira.')
    }
  }

  return (
    <div className="flex flex-col gap-6 font-sans">
      
      {/* ── CABEÇALHO DA PÁGINA ────────────────────────────────────────────── */}
      <div>
        <h2 className="font-display font-semibold text-white">Gestão de Banca</h2>
        <p className="text-xs text-slate-500 mt-0.5">Gerenciamento dinâmico diário do seu capital</p>
      </div>

      {/* ── PAINEL SUPERIOR ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* BANCA INICIAL */}
        <label className="card p-5 relative overflow-hidden group block cursor-text">
          <div className="flex items-center justify-between mb-2 z-10 relative">
            <div className="flex items-center gap-2">
              <Wallet size={16} className="text-slate-400" />
              <span className="text-sm font-medium text-slate-400 uppercase tracking-wider">Banca Inicial (R$)</span>
            </div>
            <Edit2 size={13} className="text-slate-500 group-hover:text-green-400 transition-colors" />
          </div>
          <input 
            type="number" 
            step="0.01" 
            value={bancaInicialAtual === 0 ? '' : bancaInicialAtual} 
            onChange={(e) => handleSaveConfigCarteira('bancaInicial', e.target.value)} 
            disabled={!selectedCarteiraId}
            className="text-3xl font-bold text-white bg-transparent outline-none w-full border-b border-transparent focus:border-green-500/50 transition-colors z-10 relative disabled:opacity-50" 
            placeholder="0.00"
          />
        </label>

        {/* BANCA ATUAL (VERDE) */}
        <div className="card p-5 bg-gradient-to-br from-green-900/40 to-surface-100 border-green-900/50 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-green-400" />
            <span className="text-sm font-medium text-green-400/80 uppercase tracking-wider">Banca Atual</span>
            {bancaAtual > bancaInicialAtual && (
             <span className="ml-auto text-[10px] bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full">+{(bancaAtual - bancaInicialAtual).toLocaleString('pt-BR', {style:'currency', currency:'BRL'})}</span>
            )}
          </div>
          <p className="text-3xl font-bold text-green-400">{formatCurrency(bancaAtual)}</p>
        </div>
      </div>

      {/* ── BARRA DE FERRAMENTAS ───────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-surface-200/50 p-3 rounded-xl border border-surface-300">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* Dropdown Casa Categoria */}
          <div className="relative w-full sm:w-48">
            <select
              title="Casa de Aposta"
              className="input-field py-2 pr-8 pl-3 text-sm appearance-none cursor-pointer bg-surface-300 outline-none focus:ring-1 ring-green-500/50"
              value={casaAposta}
              onChange={(e) => handleChangeCasa(e.target.value)}
            >
              {bookmakers.map((b: string) => <option key={b} value={b}>{b}</option>)}
              {bookmakers.length === 0 && <option value="Betano">Betano</option>}
            </select>
            <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Dropdown Banca Carteira */}
          <div className="relative w-full sm:w-48">
            <select
              title="Carteira Selecionada"
              className="input-field py-2 pr-8 pl-3 text-sm appearance-none cursor-pointer bg-surface-300 outline-none focus:ring-1 ring-green-500/50"
              value={selectedCarteiraId}
              onChange={(e) => setSelectedCarteiraId(e.target.value)}
              disabled={todasCarteiras.filter(c => c.casaAposta === casaAposta).length === 0}
            >
              {todasCarteiras.filter(c => c.casaAposta === casaAposta).length === 0 && <option value="">Carregando Bancas...</option>}
              {todasCarteiras.filter(c => c.casaAposta === casaAposta).map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto mt-3 md:mt-0">
          <button onClick={() => setIsModalBancaOpen(true)} className="flex-1 md:flex-none btn-secondary flex items-center justify-center gap-2">
            <Plus size={14} /> <span className="hidden sm:inline">Nova Banca</span>
          </button>
          <button onClick={handleAddRow} disabled={!selectedCarteiraId} className="flex-1 md:flex-none btn-primary flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/20 disabled:opacity-50 disabled:cursor-not-allowed">
            <Plus size={14} /> Adicionar Linha
          </button>
        </div>
      </div>

      {/* ── TABELA DE CONTROLE DIÁRIO ──────────────────────────────────────── */}
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
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500 text-sm">
                    <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    Carregando histórico...
                  </td>
                </tr>
              ) : computedRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500 text-sm">
                    Nenhum registro diário. Clique em <b>+ Adicionar Linha</b> para iniciar o acompanhamento.
                  </td>
                </tr>
              ) : (
                computedRows.map((r) => (
                  <tr key={r.id} className="hover:bg-surface-200/10 transition-colors group">
                    <td className="px-4 py-3">
                      {r.isEditing ? (
                        <div className="flex items-center gap-2 bg-surface-300/50 rounded px-2 py-1 border border-surface-400 focus-within:border-green-500/50 transition-colors">
                          <input type="date" value={r.date} onChange={e => updateRow(r.id, 'date', e.target.value)} className="bg-transparent text-sm text-white w-full outline-none" />
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-slate-300"><Calendar size={13} className="text-slate-500" /> {r.date.split('-').reverse().join('/')}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300 font-mono">
                      {formatCurrency(r.calcInitial)}
                    </td>
                    <td className="px-4 py-3">
                      {r.isEditing ? (
                        <input type="number" step="0.01" value={r.deposit || ''} onChange={e => updateRow(r.id, 'deposit', e.target.value)} placeholder="0.00" className="w-20 bg-surface-300/50 border border-surface-400 rounded px-2 py-1 text-sm text-white outline-none focus:border-green-500/50" />
                      ) : (
                        <span className="text-sm font-mono">{r.deposit > 0 ? formatCurrency(r.deposit) : '-'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {r.isEditing ? (
                        <input type="number" step="0.01" value={r.withdrawal || ''} onChange={e => updateRow(r.id, 'withdrawal', e.target.value)} placeholder="0.00" className="w-20 bg-surface-300/50 border border-surface-400 rounded px-2 py-1 text-sm text-white outline-none focus:border-red-500/50" />
                      ) : (
                        <span className="text-sm font-mono">{r.withdrawal > 0 ? formatCurrency(r.withdrawal) : '-'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {r.isEditing ? (
                        <input type="number" step="0.01" value={r.result || ''} onChange={e => updateRow(r.id, 'result', e.target.value)} placeholder="0.00" className={`w-20 bg-surface-300/50 border rounded px-2 py-1 text-sm text-white outline-none focus:border-green-500/50 ${r.result > 0 ? 'border-green-500/50 text-green-400 bg-green-500/10' : r.result < 0 ? 'border-red-500/50 text-red-400 bg-red-500/10' : 'border-surface-400'}`} />
                      ) : (
                        <span className={`text-sm font-mono font-medium ${r.result > 0 ? 'text-green-400' : r.result < 0 ? 'text-red-400' : 'text-slate-400'}`}>{r.result > 0 ? '+' : ''}{formatCurrency(r.result)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] ${r.calcPct > 0 ? 'bg-green-500/20 text-green-400' : r.calcPct < 0 ? 'bg-red-500/20 text-red-400' : 'text-slate-500'}`}>
                        {r.calcPct > 0 ? '+' : ''}{r.calcPct.toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono font-bold text-white">
                      {formatCurrency(r.calcFinal)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        {r.isEditing ? (
                           <>
                             <button onClick={() => handleSaveRow(r)} className="p-1.5 text-green-500 hover:bg-green-500/20 hover:text-green-400 rounded transition-colors" title="Salvar Originais"><CheckCircle size={15}/></button>
                             <button onClick={() => r.isNew ? handleDeleteRow(r.id, true) : toggleEditRow(r.id, false)} className="p-1.5 text-slate-400 hover:bg-surface-300 hover:text-white rounded transition-colors" title="Cancelar"><X size={15}/></button>
                           </>
                        ) : (
                           <>
                             <button onClick={() => toggleEditRow(r.id, true)} className="p-1.5 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 rounded transition-colors opacity-0 group-hover:opacity-100" title="Editar"><Edit2 size={14}/></button>
                             <button onClick={() => handleDeleteRow(r.id, false)} className="p-1.5 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded transition-colors opacity-0 group-hover:opacity-100" title="Excluir"><Trash2 size={14}/></button>
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

      {/* ── PERFIL DE RISCO ─────────────────────────────────────────────────── */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><Trophy size={14} className="text-yellow-500" /> Perfil de Risco e Metas</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {RISK_PROFILES.map(p => (
            <button 
              key={p.id} 
              onClick={() => handleRiskChange(p.id)}
              className={`p-4 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                riskProfileAtual === p.id 
                ? `border-green-500 bg-green-500/10 scale-[1.02] shadow-[0_0_15px_rgba(34,197,94,0.1)]` 
                : `${p.color} opacity-80 hover:opacity-100`
              }`}
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

      {/* MODAL NOVA BANCA */}
      {isModalBancaOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-200 border border-surface-300 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-surface-300 flex items-center justify-between bg-surface-100/50">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Wallet size={16} className="text-green-500" />
                Criar Nova Banca
              </h3>
              <button 
                onClick={() => setIsModalBancaOpen(false)}
                className="text-slate-400 hover:text-white transition-colors p-1"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleCriarNovaBanca} className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1 ml-1 uppercase tracking-wider">
                  Nome da Carteira
                </label>
                <input
                  type="text"
                  autoFocus
                  placeholder="Ex: Alavancagem Fim de Semana"
                  required
                  value={novaBancaNome}
                  onChange={(e) => setNovaBancaNome(e.target.value)}
                  className="input-field w-full py-2.5 bg-surface-300 focus:ring-green-500/50"
                />
              </div>
              
              <div className="bg-surface-300/50 p-3 rounded-lg border border-surface-300 text-sm text-slate-400 mt-2">
                Esta banca pertencerá à casa: <strong className="text-white">{casaAposta}</strong>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsModalBancaOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-surface-300 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-500 transition-colors shadow-lg shadow-green-900/20"
                >
                  Criar Banca
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
