import { useState, useMemo, useEffect } from 'react'
import {
  Wallet, TrendingUp, Plus, Trash2, Edit2, CheckCircle, ChevronDown, Trophy, Calendar, Save
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Modal } from '../components/ui/Modal'
import api from '../services/api'

interface DailyRow {
  id: string
  date: string
  initial: number
  deposit: number
  withdrawal: number
  result: number
}

const RISK_PROFILES = [
  { id: 'conservador', label: 'Conservador', target: '1% a 3% diário', color: 'border-blue-500/50 bg-blue-900/20 text-blue-400' },
  { id: 'moderado', label: 'Moderado', target: '3% a 9% diário', color: 'border-amber-500/50 bg-amber-900/20 text-amber-400' },
  { id: 'agressivo', label: 'Agressivo', target: 'Acima de 10% diário', color: 'border-red-500/50 bg-red-900/20 text-red-400' }
]

export const GestaoBancaPage = () => {
  const [bancaInicialMensal, setBancaInicialMensal] = useState(1000)
  const [casaAposta, setCasaAposta] = useState('Betano')
  const [riskProfile, setRiskProfile] = useState('moderado')
  const [isEditingBanca, setIsEditingBanca] = useState(false)
  const [tempBanca, setTempBanca] = useState(bancaInicialMensal)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // MOCK INICIAL DEFAULT EM MEMÓRIA
  const [rows, setRows] = useState<DailyRow[]>([])

  const loadDados = async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/gestao-banca/${casaAposta}`)
      if (data.config) {
        setBancaInicialMensal(Number(data.config.bancaInicial))
        setTempBanca(Number(data.config.bancaInicial))
        setRiskProfile(data.config.perfilRisco)
      } else {
        setBancaInicialMensal(1000)
        setTempBanca(1000)
      }

      if (data.itens && data.itens.length > 0) {
        setRows(data.itens.map((i: any) => ({
          id: i.id, date: i.dataReferencia, initial: 0, deposit: Number(i.deposito), withdrawal: Number(i.saque), result: Number(i.resultado)
        })))
      } else {
        setRows([{ id: '1', date: new Date().toISOString().split('T')[0], initial: 1000, deposit: 0, withdrawal: 0, result: 0 }])
      }
    } catch {
      toast.error('Erro ao buscar dados da Gestão de Banca.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDados()
  }, [casaAposta])

  // Lógica de cálculo estático baseada nas linhas
  // Ao invés de usar `initial` puro salvo, ele vai re-calcular baseado na linha anterior, exceto o 1.
  const computedRows = useMemo(() => {
    let currentInitial = bancaInicialMensal
    return rows.map((r: DailyRow, i: number) => {
      // a primeira usa a "Banca Inicial Global", as próximas usam a final da anterior
      const initialAtRow = i === 0 ? bancaInicialMensal : currentInitial
      const finalAtRow = initialAtRow + r.deposit - r.withdrawal + r.result
      
      const pct = initialAtRow > 0 ? (r.result / initialAtRow) * 100 : 0
      
      currentInitial = finalAtRow // prepara pra próxima row

      return {
        ...r,
        calcInitial: initialAtRow,
        calcFinal: finalAtRow,
        calcPct: pct
      }
    })
  }, [rows, bancaInicialMensal])

  const bancaAtual = computedRows.length > 0 ? computedRows[computedRows.length - 1].calcFinal : bancaInicialMensal

  // Handlers
  const handleAddRow = () => {
    const today = new Date().toISOString().split('T')[0]
    setRows(prev => [
      ...prev,
      { id: Date.now().toString(), date: today, initial: 0, deposit: 0, withdrawal: 0, result: 0 }
    ])
  }

  const handleDeleteRow = (id: string) => {
    setRows((prev: DailyRow[]) => prev.filter((r: DailyRow) => r.id !== id))
    toast.success('Linha removida')
  }

  const updateRow = (id: string, field: keyof DailyRow, value: string) => {
    setRows((prev: DailyRow[]) => prev.map((r: DailyRow) => {
      if (r.id !== id) return r
      if (field === 'date') return { ...r, date: value }
      return { ...r, [field]: Number(value) || 0 }
    }))
  }

  const handleSync = async () => {
    setSaving(true)
    try {
      const ms = toast.loading('Sincronizando...')
      const payload = rows.map((r: DailyRow) => ({ date: r.date, deposit: r.deposit, withdrawal: r.withdrawal, result: r.result }))
      const { data } = await api.post(`/gestao-banca/${casaAposta}/sync`, { linhas: payload })
      setRows(data.itens.map((i: any) => ({
        id: i.id, date: i.dataReferencia, initial: 0, deposit: Number(i.deposito), withdrawal: Number(i.saque), result: Number(i.resultado)
      })))
      toast.success('Dados salvos na casa de aposta!', { id: ms })
    } catch {
      toast.error('Erro ao sincronizar.')
    } finally {
      setSaving(false)
    }
  }

  const saveBancaConfig = async () => {
    try {
      await api.patch(`/gestao-banca/${casaAposta}/config`, { bancaInicial: tempBanca, perfilRisco: riskProfile })
      setBancaInicialMensal(tempBanca)
      setIsEditingBanca(false)
      toast.success('Banca Inicial atualizada!')
    } catch {
      toast.error('Ocorreu um erro ao atualizar banca.')
    }
  }

  const handleRiskChange = async (id: string) => {
    setRiskProfile(id)
    try {
      await api.patch(`/gestao-banca/${casaAposta}/config`, { bancaInicial: bancaInicialMensal, perfilRisco: id })
    } catch {}
  }

  const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

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
        <div className="card p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2 z-10 relative">
            <div className="flex items-center gap-2">
              <Wallet size={16} className="text-slate-400" />
              <span className="text-sm font-medium text-slate-400 uppercase tracking-wider">Banca Inicial</span>
            </div>
            <button onClick={() => setIsEditingBanca(true)} className="p-1.5 bg-surface-300 hover:bg-surface-400 rounded text-slate-300 transition-colors" title="Editar Banca Inicial">
              <Edit2 size={13} />
            </button>
          </div>
          <p className="text-3xl font-bold text-white z-10 relative">{formatCurrency(bancaInicialMensal)}</p>
        </div>

        {/* BANCA ATUAL (VERDE) */}
        <div className="card p-5 bg-gradient-to-br from-green-900/40 to-surface-100 border-green-900/50 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-green-400" />
            <span className="text-sm font-medium text-green-400/80 uppercase tracking-wider">Banca Atual</span>
            {bancaAtual > bancaInicialMensal && (
             <span className="ml-auto text-[10px] bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full">+{(bancaAtual - bancaInicialMensal).toLocaleString('pt-BR', {style:'currency', currency:'BRL'})}</span>
            )}
          </div>
          <p className="text-3xl font-bold text-green-400">{formatCurrency(bancaAtual)}</p>
        </div>
      </div>

      {/* ── BARRA DE FERRAMENTAS ───────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-surface-200/50 p-3 rounded-xl border border-surface-300">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <select
              title="Casa de Aposta"
              className="input-field py-2 pr-8 pl-3 text-sm appearance-none cursor-pointer bg-surface-300"
              value={casaAposta}
              onChange={(e) => setCasaAposta(e.target.value)}
            >
              <option value="Betano">Betano</option>
              <option value="Bet365">Bet365</option>
              <option value="Pinnacle">Pinnacle</option>
              <option value="Pixbet">Pixbet</option>
              <option value="Outra">Outra</option>
            </select>
            <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button onClick={handleSync} disabled={saving} className="flex-1 md:flex-none btn-secondary flex items-center justify-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" /> : <Save size={14} />} 
            <span className="hidden sm:inline">Salvar Sincronização</span>
          </button>
          <button onClick={handleAddRow} className="flex-1 md:flex-none btn-primary flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white">
            <Plus size={14} /> Adicionar Linha
          </button>
        </div>
      </div>

      {/* ── TABELA DE CONTROLE DIÁRIO ──────────────────────────────────────── */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-300/50 border-b border-surface-300 text-xs text-slate-400 uppercase tracking-wider">
                <th className="px-4 py-3 font-medium min-w-[130px]">Data</th>
                <th className="px-4 py-3 font-medium min-w-[120px]">Inicial</th>
                <th className="px-4 py-3 font-medium min-w-[100px]">Depósito</th>
                <th className="px-4 py-3 font-medium min-w-[100px]">Saque</th>
                <th className="px-4 py-3 font-medium min-w-[100px]">Resultado</th>
                <th className="px-4 py-3 font-medium min-w-[80px]">% Banca</th>
                <th className="px-4 py-3 font-medium min-w-[120px]">Final</th>
                <th className="px-4 py-3 font-medium text-center min-w-[60px]">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-300">
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
                  <tr key={r.id} className="hover:bg-surface-300/20 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 bg-surface-300/50 rounded px-2 py-1 border border-surface-400 focus-within:border-green-500/50 transition-colors">
                        <Calendar size={12} className="text-slate-500 shrink-0" />
                        <input type="date" value={r.date} onChange={e => updateRow(r.id, 'date', e.target.value)} className="bg-transparent text-sm text-white w-full outline-none" />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300 font-mono">
                      {formatCurrency(r.calcInitial)}
                    </td>
                    <td className="px-4 py-3">
                      <input type="number" step="0.01" value={r.deposit || ''} onChange={e => updateRow(r.id, 'deposit', e.target.value)} placeholder="0.00" className="w-20 bg-surface-300/50 border border-surface-400 rounded px-2 py-1 text-sm text-white outline-none focus:border-green-500/50" />
                    </td>
                    <td className="px-4 py-3">
                      <input type="number" step="0.01" value={r.withdrawal || ''} onChange={e => updateRow(r.id, 'withdrawal', e.target.value)} placeholder="0.00" className="w-20 bg-surface-300/50 border border-surface-400 rounded px-2 py-1 text-sm text-white outline-none focus:border-red-500/50" />
                    </td>
                    <td className="px-4 py-3">
                      <input type="number" step="0.01" value={r.result || ''} onChange={e => updateRow(r.id, 'result', e.target.value)} placeholder="0.00" className={`w-20 bg-surface-300/50 border rounded px-2 py-1 text-sm text-white outline-none focus:border-green-500/50 ${r.result > 0 ? 'border-green-500/50 text-green-400 bg-green-500/10' : r.result < 0 ? 'border-red-500/50 text-red-400 bg-red-500/10' : 'border-surface-400'}`} />
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] ${r.calcPct > 0 ? 'bg-green-500/20 text-green-400' : r.calcPct < 0 ? 'bg-red-500/20 text-red-400' : 'text-slate-500'}`}>
                        {r.calcPct > 0 ? '+' : ''}{r.calcPct.toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono font-bold text-white">
                      {formatCurrency(r.calcFinal)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => handleDeleteRow(r.id)} className="p-1.5 text-slate-500 hover:bg-red-500/20 hover:text-red-400 rounded transition-colors" title="Excluir"><Trash2 size={14}/></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL EDITAR BANCA INICIAL ──────────────────────────────────────── */}
      <Modal isOpen={isEditingBanca} onClose={() => setIsEditingBanca(false)} title="Editar Banca Inicial" size="sm">
        <div className="flex flex-col gap-4">
          <div>
            <label className="label">Valor Inicial (R$)</label>
            <input type="number" step="0.01" className="input-field text-lg" value={tempBanca} onChange={e => setTempBanca(Number(e.target.value))} />
          </div>
          <div className="flex gap-2 justify-end mt-2">
            <button onClick={() => setIsEditingBanca(false)} className="btn-secondary px-4 py-2">Cancelar</button>
            <button onClick={saveBancaConfig} className="btn-primary px-4 py-2">Confirmar</button>
          </div>
        </div>
      </Modal>

      {/* ── PERFIL DE RISCO ─────────────────────────────────────────────────── */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><Trophy size={14} className="text-yellow-500" /> Perfil de Risco e Metas</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {RISK_PROFILES.map(p => (
            <button 
              key={p.id} 
              onClick={() => handleRiskChange(p.id)}
              className={`p-4 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                riskProfile === p.id 
                ? `border-green-500 bg-green-500/10 scale-[1.02] shadow-[0_0_15px_rgba(34,197,94,0.1)]` 
                : `${p.color} opacity-80 hover:opacity-100`
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">{p.label}</span>
                {riskProfile === p.id && <CheckCircle size={14} className="text-green-500" />}
              </div>
              <span className="text-xs opacity-80 font-medium">{p.target}</span>
            </button>
          ))}
        </div>
      </div>

    </div>
  )
}
