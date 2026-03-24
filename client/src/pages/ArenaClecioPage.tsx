import { useState, useEffect, useCallback } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { futvoleiService, FutvoleiMatch } from '../services/futvolei.service'
import { CurrencyInput } from '../components/ui/CurrencyInput'

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmtMoney = (v: number) =>
  `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`

const fmtTime = (d: string) =>
  new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })

// ── Sub-componentes ────────────────────────────────────────────────────────────

const ConfigIcon = ({ sets }: { sets: number }) =>
  sets === 1 ? (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="7" stroke="#22c55e" strokeWidth="1.8" />
      <text x="9" y="13.5" textAnchor="middle" fontSize="9" fill="#22c55e" fontWeight="800">1</text>
    </svg>
  ) : (
    <svg width="26" height="18" viewBox="0 0 26 18" fill="none">
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={5 + i * 8} cy="9" r="4" stroke="#f59e0b" strokeWidth="1.8" />
      ))}
    </svg>
  )

interface EditableScoreProps {
  value: number
  onChange: (v: number) => void
  winning: boolean
  dark: boolean
  saving: boolean
}

const EditableScore = ({ value, onChange, winning, dark, saving }: EditableScoreProps) => {
  const [editing, setEditing] = useState(false)
  const bg = winning ? '#22c55e' : dark ? '#334155' : '#e2e8f0'
  const text = winning ? '#fff' : dark ? '#f1f5f9' : '#1e293b'

  if (editing) {
    return (
      <input
        autoFocus
        type="number"
        min={0}
        defaultValue={value}
        onBlur={(e) => { onChange(Math.max(0, Number(e.target.value) || 0)); setEditing(false) }}
        onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
        style={{
          width: 44, height: 44, textAlign: 'center', fontSize: 18, fontWeight: 800,
          borderRadius: 12, border: '2px solid #22c55e',
          background: dark ? '#1e293b' : '#fff',
          color: dark ? '#f1f5f9' : '#0f172a', outline: 'none',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
        }}
      />
    )
  }

  return (
    <div
      onClick={() => !saving && setEditing(true)}
      title="Clique para editar"
      style={{
        background: bg, color: text, borderRadius: 12, fontWeight: 800, fontSize: 18,
        width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: winning ? '0 0 14px #22c55e55' : 'none',
        cursor: saving ? 'wait' : 'text', transition: 'all .25s', userSelect: 'none',
        position: 'relative', opacity: saving ? 0.7 : 1,
        border: winning ? 'none' : `1px solid ${dark ? 'transparent' : '#cbd5e1'}`
      }}
    >
      {value}
      {!saving && (
        <span style={{
          position: 'absolute', bottom: 0, right: 0, width: 13, height: 13,
          background: '#22c55e', borderRadius: '50% 0 12px 0',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="7" height="7" viewBox="0 0 8 8">
            <path d="M1 6L6 1M6 1H3M6 1V4" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </span>
      )}
    </div>
  )
}

interface ConfirmModalProps {
  match: FutvoleiMatch
  onConfirm: (winnerTeam: 1 | 2) => void
  onCancel: () => void
  dark: boolean
  loading: boolean
}

const ConfirmModal = ({ match, onConfirm, onCancel, dark, loading }: ConfirmModalProps) => {
  const [selected, setSelected] = useState<1 | 2 | null>(null)
  const bg = dark ? '#1e293b' : '#fff'
  const text = dark ? '#f1f5f9' : '#0f172a'
  const sub = dark ? '#94a3b8' : '#64748b'

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#00000099', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(6px)', animation: 'fadeIn .2s ease',
    }}>
      <div style={{
        background: bg, borderRadius: 22, padding: '36px 32px',
        maxWidth: 430, width: '92%',
        boxShadow: '0 32px 80px #00000055', animation: 'slideUp .25s ease',
        border: `1px solid ${dark ? '#334155' : '#e2e8f0'}`,
      }}>
        <div style={{ fontSize: 30, marginBottom: 6 }}>🏆</div>
        <h2 style={{ margin: '0 0 6px', fontSize: 21, fontWeight: 800, color: text }}>
          Confirmar Vencedor
        </h2>
        <p style={{ margin: '0 0 6px', color: sub, fontSize: 14 }}>
          Placar atual:{' '}
          <strong style={{ color: text }}>{match.scoreA} – {match.scoreB}</strong>
        </p>
        <p style={{ margin: '0 0 22px', color: sub, fontSize: 14 }}>
          Selecione a dupla vencedora para finalizar.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {([
            { label: 'Dupla A', names: `${match.player1} / ${match.player2}`, key: 1 as const },
            { label: 'Dupla B', names: `${match.player3} / ${match.player4}`, key: 2 as const },
          ] as const).map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSelected(opt.key)}
              style={{
                border: `2px solid ${selected === opt.key ? '#22c55e' : dark ? '#334155' : '#e2e8f0'}`,
                borderRadius: 14, padding: '14px 18px',
                background: selected === opt.key
                  ? dark ? '#14532d' : '#f0fdf4'
                  : dark ? '#0f172a' : '#f8fafc',
                cursor: 'pointer', display: 'flex', alignItems: 'center',
                gap: 14, transition: 'all .2s', textAlign: 'left',
              }}
            >
              <div style={{
                width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                border: selected === opt.key
                  ? '7px solid #22c55e'
                  : `2px solid ${dark ? '#475569' : '#cbd5e1'}`,
                transition: 'all .2s',
              }} />
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#22c55e', letterSpacing: 1, textTransform: 'uppercase' }}>
                  {opt.label}
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: text }}>{opt.names}</div>
              </div>
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} disabled={loading} style={{
            flex: 1, padding: '13px', borderRadius: 12,
            border: `2px solid ${dark ? '#334155' : '#e2e8f0'}`,
            background: 'transparent', cursor: loading ? 'wait' : 'pointer',
            fontWeight: 700, color: sub, fontSize: 14,
          }}>
            Cancelar
          </button>
          <button
            onClick={() => selected && onConfirm(selected)}
            disabled={!selected || loading}
            style={{
              flex: 2, padding: '13px', borderRadius: 12, border: 'none',
              background: selected && !loading ? '#22c55e' : dark ? '#334155' : '#e2e8f0',
              cursor: selected && !loading ? 'pointer' : 'not-allowed',
              fontWeight: 800,
              color: selected && !loading ? '#fff' : sub,
              fontSize: 14, transition: 'all .2s',
              boxShadow: selected && !loading ? '0 4px 16px #22c55e44' : 'none',
            }}
          >
            {loading ? 'Finalizando...' : '✓ Confirmar Vencedor'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Formulário inicial ─────────────────────────────────────────────────────────
interface FormState {
  a1: string; a2: string
  b1: string; b2: string
  valor: number; sets: number; pts: number
}

const defaultForm: FormState = { a1: '', a2: '', b1: '', b2: '', valor: 50, sets: 1, pts: 18 }

// ── Página principal ───────────────────────────────────────────────────────────
export const ArenaClecioPage = () => {
  const { theme } = useTheme()
  const dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  const [active, setActive]     = useState<FutvoleiMatch[]>([])
  const [history, setHistory]   = useState<FutvoleiMatch[]>([])
  const [stats, setStats]       = useState({ jogosHoje: 0, totalApostadoHoje: 0 })
  const [form, setForm]         = useState<FormState>(defaultForm)
  const [confirmTarget, setConfirmTarget] = useState<FutvoleiMatch | null>(null)

  const [loadingCreate,   setLoadingCreate]   = useState(false)
  const [loadingFinalize, setLoadingFinalize] = useState(false)
  const [savingScore,     setSavingScore]     = useState<string | null>(null)
  const [toast,           setToast]           = useState<string | null>(null)
  const [error,           setError]           = useState<string | null>(null)

  // Paleta adaptativa
  const c = {
    bg:          dark ? '#0f172a' : '#f8fafc',
    card:        dark ? '#1e293b' : '#ffffff',
    cardBorder:  dark ? '#334155' : '#e2e8f0',
    text:        dark ? '#f1f5f9' : '#0f172a',
    sub:         dark ? '#94a3b8' : '#64748b',
    muted:       dark ? '#475569' : '#94a3b8',
    inputBg:     dark ? '#0f172a' : '#f8fafc',
    inputBorder: dark ? '#334155' : '#e2e8f0',
    divider:     dark ? '#334155' : '#f1f5f9',
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  // ── Busca inicial ────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    try {
      const [a, h, s] = await Promise.all([
        futvoleiService.getActive(),
        futvoleiService.getHistory(),
        futvoleiService.getStats(),
      ])
      setActive(a)
      setHistory(h)
      setStats(s)
      setError(null)
    } catch {
      setError('Erro ao carregar dados. Verifique a conexão.')
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ── Criar desafio ────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!form.a1 || !form.a2 || !form.b1 || !form.b2) return
    setLoadingCreate(true)
    try {
      const novo = await futvoleiService.create({
        player1: form.a1, player2: form.a2,
        player3: form.b1, player4: form.b2,
        stake: form.valor,
        totalSets: form.sets,
        pointsPerSet: form.pts,
      })
      setActive((p) => [novo, ...p])
      setStats((s) => ({
        jogosHoje: s.jogosHoje + 1,
        totalApostadoHoje: s.totalApostadoHoje + form.valor,
      }))
      setForm(defaultForm)
      showToast('✅ Desafio criado com sucesso!')
    } catch {
      showToast('❌ Erro ao criar desafio. Tente novamente.')
    } finally {
      setLoadingCreate(false)
    }
  }

  // ── Atualizar placar ─────────────────────────────────────────────────────────
  const handleScoreChange = async (id: string, side: 'A' | 'B', val: number) => {
    const match = active.find((m) => m.id === id)
    if (!match) return

    const scoreA = side === 'A' ? val : match.scoreA
    const scoreB = side === 'B' ? val : match.scoreB

    // Atualiza localmente de imediato (otimista)
    setActive((prev) =>
      prev.map((m) => m.id === id ? { ...m, scoreA, scoreB } : m)
    )

    setSavingScore(id)
    try {
      await futvoleiService.updateScore(id, scoreA, scoreB)
    } catch {
      // Reverte em caso de erro
      setActive((prev) =>
        prev.map((m) => m.id === id ? { ...m, scoreA: match.scoreA, scoreB: match.scoreB } : m)
      )
      showToast('❌ Erro ao salvar placar.')
    } finally {
      setSavingScore(null)
    }
  }

  // ── Finalizar partida ────────────────────────────────────────────────────────
  const handleFinalize = async (winnerTeam: 1 | 2) => {
    if (!confirmTarget) return
    setLoadingFinalize(true)
    try {
      const finished = await futvoleiService.finalize(
        confirmTarget.id,
        winnerTeam,
        confirmTarget.scoreA,
        confirmTarget.scoreB,
      )
      setActive((p) => p.filter((m) => m.id !== confirmTarget.id))
      setHistory((h) => [finished, ...h])
      setConfirmTarget(null)
      const vencedor = winnerTeam === 1
        ? `${confirmTarget.player1} / ${confirmTarget.player2}`
        : `${confirmTarget.player3} / ${confirmTarget.player4}`
      showToast(`🏆 ${vencedor} venceu! Partida finalizada.`)
    } catch {
      showToast('❌ Erro ao finalizar partida. Tente novamente.')
    } finally {
      setLoadingFinalize(false)
    }
  }

  const allFilled = form.a1 && form.a2 && form.b1 && form.b2

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap');
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
        @keyframes toastIn { from { transform: translateX(-50%) translateY(16px); opacity: 0 } to { transform: translateX(-50%) translateY(0); opacity: 1 } }
        @keyframes pulse   { 0%,100% { opacity:1 } 50% { opacity:.35 } }
        @keyframes spin    { to { transform: rotate(360deg) } }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
        input:focus, select:focus { outline: none; }
        .rh:hover { filter: brightness(${dark ? 1.08 : 0.97}); }
        .btnfin { transition: all .2s; }
        .btnfin:hover { filter: brightness(1.1); transform: scale(1.02); }
        .stcard { transition: transform .2s; }
        .stcard:hover { transform: translateY(-3px); }
      `}</style>

      <div style={{ background: c.bg, minHeight: '100vh', transition: 'background .3s', padding: '28px 24px 80px' }}>
        <div style={{ maxWidth: 980, margin: '0 auto' }}>

          {/* Título da página */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800, color: c.text, letterSpacing: -0.5 }}>
                Arena Clécio
              </h1>
            </div>
            <p style={{ color: c.sub, fontSize: 14 }}>Gestão de desafios e apostas casadas.</p>
          </div>

          {/* Erro de conexão */}
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '12px 16px', marginBottom: 20, color: '#dc2626', fontSize: 14, fontWeight: 600 }}>
              ⚠️ {error}
              <button onClick={fetchAll} style={{ marginLeft: 12, textDecoration: 'underline', background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontWeight: 700 }}>
                Tentar novamente
              </button>
            </div>
          )}

          {/* STATS */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 24 }}>
            {[
              { label: 'JOGOS CRIADOS (HOJE)', value: String(stats.jogosHoje), icon: '⚡', green: false },
              { label: 'TOTAL APOSTADO (HOJE)', value: fmtMoney(stats.totalApostadoHoje), icon: '🏆', green: false },
              { label: 'STATUS DA ARENA', value: 'Ativa & Monitorada', icon: '✅', green: true },
            ].map((s, i) => (
              <div key={i} className="stcard" style={{
                background: s.green ? '#22c55e' : c.card,
                border: `1px solid ${s.green ? 'transparent' : c.cardBorder}`,
                borderRadius: 20, padding: '22px 24px',
                boxShadow: s.green ? '0 12px 36px -8px #22c55e66' : '0 4px 20px -4px #0000000d',
                display: 'flex', alignItems: 'center', gap: 16,
                position: 'relative', overflow: 'hidden'
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: s.green ? '#16a34a' : dark ? '#0f172a' : '#f0fdf4',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0,
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
                }}>{s.icon}</div>
                <div style={{ zIndex: 1 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: s.green ? '#d1fae5' : c.muted, textTransform: 'uppercase', marginBottom: 4 }}>
                    {s.label}
                  </div>
                  <div style={{ fontSize: i === 2 ? 14 : 24, fontWeight: 900, color: s.green ? '#fff' : c.text, lineHeight: 1, fontFamily: "'Syne', sans-serif" }}>
                    {s.value}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* NOVO DESAFIO */}
          <div style={{ background: c.card, borderRadius: 20, padding: 28, marginBottom: 24, border: `1px solid ${c.cardBorder}`, boxShadow: '0 2px 8px #0000000a' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
              <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 17, fontWeight: 800, color: c.text, display: 'flex', alignItems: 'center', gap: 8 }}>
                🏆 Novo Desafio
              </h2>
              {!allFilled && (
                <span style={{ fontSize: 11, color: c.muted, border: `1px solid ${c.cardBorder}`, padding: '5px 11px', borderRadius: 8, fontWeight: 600 }}>
                  ⓘ PREENCHA PARA INICIAR
                </span>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr auto', gap: 18, alignItems: 'start', marginBottom: 20 }}>
              {/* Dupla A */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#22c55e', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, background: '#22c55e', borderRadius: '50%', display: 'inline-block' }} />
                  Dupla A (Mandante)
                </div>
                {(['a1', 'a2'] as const).map((k, i) => (
                  <input key={k} placeholder={`Jogador ${i + 1}`} value={form[k]}
                    onChange={(e) => setForm((p) => ({ ...p, [k]: e.target.value }))}
                    style={{
                      width: '100%', padding: '11px 14px', borderRadius: 10,
                      border: `1.5px solid ${c.inputBorder}`,
                      fontSize: 15, color: c.text, background: c.inputBg,
                      marginBottom: i === 0 ? 10 : 0, transition: 'all .2s',
                    }}
                  />
                ))}
              </div>

              <div style={{ paddingTop: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 19, fontWeight: 800, color: '#22c55e', opacity: 0.7 }}>VS</span>
              </div>

              {/* Dupla B */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#3b82f6', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, background: '#3b82f6', borderRadius: '50%', display: 'inline-block' }} />
                  Dupla B (Visitante)
                </div>
                {(['b1', 'b2'] as const).map((k, i) => (
                  <input key={k} placeholder={`Jogador ${i + 1}`} value={form[k]}
                    onChange={(e) => setForm((p) => ({ ...p, [k]: e.target.value }))}
                    style={{
                      width: '100%', padding: '11px 14px', borderRadius: 10,
                      border: `1.5px solid ${c.inputBorder}`,
                      fontSize: 15, color: c.text, background: c.inputBg,
                      marginBottom: i === 0 ? 10 : 0, transition: 'all .2s',
                    }}
                  />
                ))}
              </div>

              {/* Valor/Config */}
              <div style={{
                background: dark ? '#052e1633' : '#f0fdf4', borderRadius: 16, padding: '20px',
                border: `1.5px solid ${dark ? '#166534' : '#bbf7d0'}`, minWidth: 175,
                boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.02)'
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#16a34a', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>
                  Valor do Desafio (R$)
                </div>
                <div style={{ marginBottom: 16 }}>
                  <CurrencyInput
                    value={form.valor}
                    onChange={(v) => setForm((p) => ({ ...p, valor: v }))}
                    placeholder="R$ 0,00"
                    alertLimit={1000}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: c.muted, letterSpacing: 0.6, marginBottom: 6 }}>SETS</div>
                    <select value={form.sets} onChange={(e) => setForm((p) => ({ ...p, sets: +e.target.value }))}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: `1.5px solid ${dark ? '#166534' : '#d1fae5'}`, fontSize: 13, fontWeight: 800, background: c.inputBg, color: c.text, cursor: 'pointer' }}>
                      <option value={1}>1 Set</option>
                      <option value={3}>M3</option>
                      <option value={5}>M5</option>
                    </select>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: c.muted, letterSpacing: 0.6, marginBottom: 6 }}>PTS</div>
                    <input type="number" value={form.pts}
                      onChange={(e) => setForm((p) => ({ ...p, pts: +e.target.value }))}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: `1.5px solid ${dark ? '#166534' : '#d1fae5'}`, fontSize: 13, fontWeight: 800, textAlign: 'center', background: c.inputBg, color: c.text }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <button onClick={handleCreate} disabled={!allFilled || loadingCreate} style={{
              width: '100%', padding: 15, borderRadius: 14, border: 'none',
              background: allFilled && !loadingCreate ? '#22c55e' : dark ? '#334155' : '#e2e8f0',
              color: allFilled && !loadingCreate ? '#fff' : c.muted,
              fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 14,
              letterSpacing: 1.5, cursor: allFilled && !loadingCreate ? 'pointer' : 'not-allowed',
              transition: 'all .25s', boxShadow: allFilled && !loadingCreate ? '0 6px 20px #22c55e44' : 'none',
            }}>
              {loadingCreate ? 'CRIANDO...' : 'CRIAR NOVO DESAFIO'}
            </button>
          </div>

          {/* DESAFIOS ATIVOS */}
          <div style={{ background: c.card, borderRadius: 20, padding: 28, marginBottom: 24, border: `1px solid ${c.cardBorder}`, boxShadow: '0 2px 8px #0000000a' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
              <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 17, fontWeight: 800, color: c.text }}>
                Desafios Ativos
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 700, color: '#22c55e' }}>
                <span style={{ width: 8, height: 8, background: '#22c55e', borderRadius: '50%', animation: 'pulse 2s infinite', display: 'inline-block' }} />
                EM TEMPO REAL
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2.2fr 1fr 1.3fr 1.3fr auto', padding: '0 14px 12px', borderBottom: `2px solid ${c.divider}`, gap: 14 }}>
              {['PARTIDA / DUPLAS', 'INVESTIMENTO', 'CONFIGURAÇÃO', 'RESULTADO', 'AÇÕES'].map((h) => (
                <div key={h} style={{ fontSize: 10, fontWeight: 700, color: c.muted, letterSpacing: 0.8, textTransform: 'uppercase' }}>{h}</div>
              ))}
            </div>

            {active.length === 0 && (
              <div style={{ textAlign: 'center', padding: '48px 0', color: c.muted, fontSize: 15 }}>
                Nenhum desafio ativo no momento.
              </div>
            )}

            {active.map((ch, i) => (
              <div key={ch.id} className="rh" style={{
                display: 'grid', gridTemplateColumns: '2.2fr 1fr 1.3fr 1.3fr auto',
                padding: '18px 14px',
                borderBottom: i < active.length - 1 ? `1px solid ${c.divider}` : 'none',
                alignItems: 'center', gap: 14, borderRadius: 12, transition: 'filter .15s',
              }}>
                {/* Duplas */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <span style={{ width: 8, height: 8, background: '#22c55e', borderRadius: '50%', flexShrink: 0 }} />
                    <span style={{ fontWeight: 700, fontSize: 14, color: c.text }}>{ch.player1} / {ch.player2}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: '#22c55e', background: dark ? '#14532d' : '#f0fdf4', padding: '2px 6px', borderRadius: 4 }}>DUPLA A</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, background: '#3b82f6', borderRadius: '50%', flexShrink: 0 }} />
                    <span style={{ fontWeight: 600, fontSize: 13, color: c.sub }}>{ch.player3} / {ch.player4}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: '#3b82f6', background: dark ? '#1e3a5f' : '#eff6ff', padding: '2px 6px', borderRadius: 4 }}>DUPLA B</span>
                  </div>
                </div>

                <div style={{ background: dark ? '#14532d' : '#f0fdf4', color: '#15803d', fontWeight: 800, fontSize: 13, padding: '7px 11px', borderRadius: 10, display: 'inline-flex', whiteSpace: 'nowrap', border: `1px solid ${dark ? '#166534' : '#bbf7d0'}` }}>
                  {fmtMoney(ch.stake)}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ConfigIcon sets={ch.totalSets} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: c.text }}>
                      {ch.totalSets === 1 ? '1 Set' : `Melhor de ${ch.totalSets}`}
                    </div>
                    <div style={{ fontSize: 11, color: c.muted }}>Sets de {ch.pointsPerSet}pts</div>
                  </div>
                </div>

                {/* Resultado editável */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <EditableScore
                    value={ch.scoreA}
                    onChange={(v) => handleScoreChange(ch.id, 'A', v)}
                    winning={ch.scoreA > ch.scoreB}
                    dark={dark}
                    saving={savingScore === ch.id}
                  />
                  <span style={{ color: c.muted, fontWeight: 800, fontSize: 15 }}>–</span>
                  <EditableScore
                    value={ch.scoreB}
                    onChange={(v) => handleScoreChange(ch.id, 'B', v)}
                    winning={ch.scoreB > ch.scoreA}
                    dark={dark}
                    saving={savingScore === ch.id}
                  />
                </div>

                <button className="btnfin" onClick={() => setConfirmTarget(ch)} style={{
                  background: '#22c55e', color: '#fff', border: 'none',
                  borderRadius: 10, padding: '9px 16px', fontWeight: 800, fontSize: 12,
                  cursor: 'pointer', letterSpacing: 0.5, whiteSpace: 'nowrap',
                  boxShadow: '0 4px 12px #22c55e33',
                }}>
                  FINALIZAR
                </button>
              </div>
            ))}
          </div>

          {/* HISTÓRICO */}
          <div style={{ background: c.card, borderRadius: 20, padding: 28, border: `1px solid ${c.cardBorder}`, boxShadow: '0 2px 8px #0000000a' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
              <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 17, fontWeight: 800, color: c.text }}>
                📋 Histórico de Jogos
              </h2>
              <span style={{ fontSize: 12, fontWeight: 700, background: dark ? '#334155' : '#f1f5f9', color: c.sub, padding: '3px 10px', borderRadius: 20 }}>
                {history.length} partidas
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2.4fr 1.5fr 0.9fr 1fr 1fr', padding: '0 14px 12px', borderBottom: `2px solid ${c.divider}`, gap: 12 }}>
              {['PARTIDA', 'VENCEDOR', 'RESULTADO', 'APOSTADO', 'DATA / HORA'].map((h) => (
                <div key={h} style={{ fontSize: 10, fontWeight: 700, color: c.muted, letterSpacing: 0.8, textTransform: 'uppercase' }}>{h}</div>
              ))}
            </div>

            {history.length === 0 && (
              <div style={{ textAlign: 'center', padding: '48px 0', color: c.muted, fontSize: 15 }}>
                Nenhuma partida finalizada ainda.
              </div>
            )}

            {history.map((h, i) => {
              const duplaAVenceu = h.winnerTeam === 1
              return (
                <div key={h.id} style={{
                  display: 'grid', gridTemplateColumns: '2.4fr 1.5fr 0.9fr 1fr 1fr',
                  padding: '16px 14px',
                  borderBottom: i < history.length - 1 ? `1px solid ${c.divider}` : 'none',
                  alignItems: 'center', gap: 12, animation: 'fadeIn .35s ease',
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                      <span style={{ width: 7, height: 7, background: '#22c55e', borderRadius: '50%', flexShrink: 0 }} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: c.text }}>{h.player1} / {h.player2}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ width: 7, height: 7, background: '#3b82f6', borderRadius: '50%', flexShrink: 0 }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: c.sub }}>{h.player3} / {h.player4}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>🏆</span>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#22c55e', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Dupla {duplaAVenceu ? 'A' : 'B'}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: c.text }}>
                        {duplaAVenceu ? `${h.player1} / ${h.player2}` : `${h.player3} / ${h.player4}`}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontWeight: 800, fontSize: 20, fontFamily: "'Syne',sans-serif", color: duplaAVenceu ? '#22c55e' : c.sub }}>{h.scoreA}</span>
                    <span style={{ color: c.muted, fontWeight: 700 }}>–</span>
                    <span style={{ fontWeight: 800, fontSize: 20, fontFamily: "'Syne',sans-serif", color: !duplaAVenceu ? '#22c55e' : c.sub }}>{h.scoreB}</span>
                  </div>

                  <div style={{ fontSize: 13, fontWeight: 700, color: '#15803d', background: dark ? '#14532d' : '#f0fdf4', padding: '5px 10px', borderRadius: 8, display: 'inline-block', whiteSpace: 'nowrap', border: `1px solid ${dark ? '#166534' : '#bbf7d0'}` }}>
                    {fmtMoney(h.stake)}
                  </div>

                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: c.text }}>{h.finishedAt ? fmtTime(h.finishedAt) : '—'}</div>
                    <div style={{ fontSize: 11, color: c.muted }}>{fmtDate(h.createdAt)}</div>
                  </div>
                </div>
              )
            })}
          </div>

        </div>
      </div>

      {/* Modal de confirmação */}
      {confirmTarget && (
        <ConfirmModal
          match={confirmTarget}
          dark={dark}
          loading={loadingFinalize}
          onCancel={() => setConfirmTarget(null)}
          onConfirm={handleFinalize}
        />
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 28, left: '50%',
          transform: 'translateX(-50%)',
          background: dark ? '#f1f5f9' : '#0f172a',
          color: dark ? '#0f172a' : '#fff',
          padding: '13px 24px', borderRadius: 14,
          fontWeight: 700, fontSize: 14,
          boxShadow: '0 8px 32px #00000044',
          animation: 'toastIn .3s ease',
          zIndex: 2000, whiteSpace: 'nowrap',
          borderLeft: '4px solid #22c55e',
        }}>
          {toast}
        </div>
      )}
    </>
  )
}
