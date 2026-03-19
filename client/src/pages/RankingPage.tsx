import { useState, useMemo, useEffect } from 'react'
import { Trophy, Medal, Crown, TrendingUp, Target, CheckCircle, XCircle, Users, Star } from 'lucide-react'
import type { Transaction } from './GestaoTipstersPage'
import type { Tipster } from '../components/ui/TipstersModal'

// ── Types ────────────────────────────────────────────────────────────────────

type Period = 'Geral' | 'Mensal' | 'Semanal'
type Tab = 'tipsters' | 'usuarios'

interface TipsterRank {
  id: string
  name: string
  specialty: string
  greens: number
  reds: number
  voids: number
  total: number
  winRate: number
  profit: number
  roi: number
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const buildRanking = (tipsters: Tipster[], transactions: Transaction[], period: Period): TipsterRank[] => {
  const now = new Date()

  const filtered = transactions.filter(tx => {
    if (period === 'Semanal') {
      const d = new Date(tx.date)
      return (now.getTime() - d.getTime()) <= 7 * 24 * 60 * 60 * 1000
    }
    if (period === 'Mensal') {
      const d = new Date(tx.date)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    }
    return true
  })

  return tipsters.map(tipster => {
    const txs = filtered.filter(tx => tx.tipsterId === tipster.id)
    const greens = txs.filter(tx => tx.status === 'GREEN').length
    const reds = txs.filter(tx => tx.status === 'RED').length
    const voids = txs.filter(tx => tx.status === 'VOID').length
    const decided = greens + reds
    const winRate = decided > 0 ? Math.round((greens / decided) * 100) : 0
    const profit = txs.reduce((acc, tx) => acc + tx.profit, 0)
    const invested = txs.reduce((acc, tx) => acc + tx.amount, 0)
    const roi = invested > 0 ? Number(((profit / invested) * 100).toFixed(1)) : 0
    return {
      id: tipster.id,
      name: tipster.name,
      specialty: [tipster.sport1, tipster.sport2].filter(Boolean).join(' / '),
      greens, reds, voids,
      total: txs.length,
      winRate, profit, roi,
    }
  })
    .filter(r => r.total > 0)
    .sort((a, b) => b.winRate - a.winRate || b.greens - a.greens)
}

// ── Mock Users ─────────────────────────────────────────────────────────────

const MOCK_USERS = [
  { id: 'u1', name: 'Carlos Magro', role: 'Membro Premium', winRate: 72, greens: 36, reds: 14, profit: 1240 },
  { id: 'u2', name: 'Lucas Fernandes', role: 'Membro', winRate: 68, greens: 34, reds: 16, profit: 980 },
  { id: 'u3', name: 'João Alves', role: 'Membro Premium', winRate: 65, greens: 26, reds: 14, profit: 720 },
  { id: 'u4', name: 'Mariana Costa', role: 'Membro', winRate: 60, greens: 18, reds: 12, profit: 340 },
  { id: 'u5', name: 'Rafael Lima', role: 'Membro', winRate: 55, greens: 22, reds: 18, profit: 120 },
]

// ── Podium Card ───────────────────────────────────────────────────────────────

const RANK_CONFIG: Record<number, { icon: React.ReactNode; glow: string; border: string; badgeBg: string; size: string }> = {
  1: { icon: <Crown size={22} style={{ color: '#facc15' }} />, glow: 'shadow-[0_0_30px_rgba(0,255,127,0.25)]', border: 'border-[#00ff7f]/40', badgeBg: '#eab308', size: 'md:scale-105 md:-mt-4' },
  2: { icon: <Medal size={20} style={{ color: '#cbd5e1' }} />, glow: 'shadow-[0_0_18px_rgba(0,255,127,0.12)]', border: 'border-[#00ff7f]/20', badgeBg: '#94a3b8', size: '' },
  3: { icon: <Medal size={20} style={{ color: '#92400e' }} />, glow: 'shadow-[0_0_14px_rgba(0,255,127,0.08)]', border: 'border-[#00ff7f]/10', badgeBg: '#b45309', size: '' },
}

const initials = (name: string) => name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()

const winRateColor = (rate: number) => {
  if (rate >= 65) return '#00ff7f'
  if (rate >= 50) return '#fbbf24'
  return '#f87171'
}

interface PodiumCardProps { rank: number; entry: TipsterRank }

const PodiumCard = ({ rank, entry }: PodiumCardProps) => {
  const cfg = RANK_CONFIG[rank]
  return (
    <div
      className={`relative flex flex-col items-center gap-3 p-6 rounded-3xl border transition-all ${cfg.glow} ${cfg.border} ${cfg.size}`}
      style={{ background: '#0d1f14' }}
    >
      <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-black"
        style={{ backgroundColor: cfg.badgeBg, color: rank === 1 ? '#000' : '#fff' }}>
        #{rank}
      </span>
      <div className="mt-2">{cfg.icon}</div>
      <div className="w-16 h-16 rounded-full border-2 flex items-center justify-center text-xl font-black"
        style={{ background: '#142a1c', borderColor: 'rgba(0,255,127,0.5)', color: '#00ff7f' }}>
        {initials(entry.name)}
      </div>
      <div className="text-center">
        <p className="font-bold text-base leading-tight" style={{ color: '#ffffff' }}>{entry.name}</p>
        <p className="text-[11px] mt-0.5" style={{ color: '#94a3b8' }}>{entry.specialty}</p>
      </div>
      <div className="text-center">
        <p className="text-3xl font-black" style={{ color: winRateColor(entry.winRate) }}>{entry.winRate}%</p>
        <p className="text-[10px] uppercase tracking-wider" style={{ color: '#64748b' }}>Taxa de Acerto</p>
      </div>
      <div className="flex items-center gap-4 text-sm">
        <span className="flex items-center gap-1 font-bold" style={{ color: '#4ade80' }}>
          <CheckCircle size={13} /> {entry.greens}
        </span>
        <span style={{ color: '#475569' }}>|</span>
        <span className="flex items-center gap-1 font-bold" style={{ color: '#f87171' }}>
          <XCircle size={13} /> {entry.reds}
        </span>
        <span style={{ color: '#475569' }}>|</span>
        <span className="font-medium text-xs" style={{ color: '#94a3b8' }}>{entry.total} tips</span>
      </div>
      <div className="text-sm font-bold" style={{ color: entry.profit >= 0 ? '#4ade80' : '#f87171' }}>
        {entry.profit >= 0 ? '+' : ''}R$ {entry.profit.toFixed(2)}
      </div>
    </div>
  )
}

// ── Shared Leaderboard Row ─────────────────────────────────────────────────

const TableRow = ({ rank, name, sub, winRate, greens, reds, total, profit, roi }: {
  rank: number; name: string; sub: string; winRate: number; greens: number; reds: number; total?: number; profit: number; roi?: number
}) => (
  <tr className="hover:bg-[#0d1f14]/80 transition-colors">
    <td className="px-6 py-4 font-bold text-sm" style={{ color: '#64748b' }}>#{rank}</td>
    <td className="px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full border flex items-center justify-center text-xs font-black"
          style={{ background: '#142a1c', borderColor: 'rgba(0,255,127,0.3)', color: '#00ff7f' }}>
          {initials(name)}
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: '#ffffff' }}>{name}</p>
          <p className="text-[11px]" style={{ color: '#64748b' }}>{sub}</p>
        </div>
      </div>
    </td>
    <td className="px-6 py-4 text-right">
      <span className="font-black text-base" style={{ color: winRateColor(winRate) }}>{winRate}%</span>
    </td>
    <td className="px-6 py-4 text-right font-bold" style={{ color: '#4ade80' }}>{greens}</td>
    <td className="px-6 py-4 text-right font-bold" style={{ color: '#f87171' }}>{reds}</td>
    {total !== undefined && <td className="px-6 py-4 text-right" style={{ color: '#94a3b8' }}>{total}</td>}
    <td className="px-6 py-4 text-right font-bold" style={{ color: profit >= 0 ? '#4ade80' : '#f87171' }}>
      {profit >= 0 ? '+' : ''}R$ {profit.toFixed(2)}
    </td>
    {roi !== undefined && (
      <td className="px-6 py-4 text-right font-semibold" style={{ color: roi >= 0 ? '#00ff7f' : '#f87171' }}>
        {roi >= 0 ? '+' : ''}{roi}%
      </td>
    )}
  </tr>
)

// ── Page ──────────────────────────────────────────────────────────────────────

export const RankingPage = () => {
  const [tab, setTab] = useState<Tab>('tipsters')
  const [period, setPeriod] = useState<Period>('Geral')
  const [tipsters, setTipsters] = useState<Tipster[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])

  useEffect(() => {
    try {
      const ts = localStorage.getItem('fgb_tipsters')
      if (ts) setTipsters(JSON.parse(ts))
      const tx = localStorage.getItem('fgb_tipster_transactions')
      if (tx) setTransactions(JSON.parse(tx))
    } catch { /* ignore */ }
  }, [])

  const ranking = useMemo(() => buildRanking(tipsters, transactions, period), [tipsters, transactions, period])
  const top3 = ranking.slice(0, 3)

  const periods: Period[] = ['Geral', 'Mensal', 'Semanal']

  return (
    <div className="flex flex-col gap-8 w-full pb-10">

      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-display font-bold flex items-center gap-2 text-slate-900 dark:text-white">
          <Trophy className="text-yellow-400" size={24} />
          Rankings
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Melhores desempenhos baseados em Taxa de Acerto</p>
      </div>

      {/* Tabs + Period Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex p-1 gap-1 rounded-xl" style={{ background: '#0d1f14', border: '1px solid #1a3622' }}>
          {[
            { key: 'tipsters' as Tab, label: 'Top Tipsters', icon: <Target size={15} /> },
            { key: 'usuarios' as Tab, label: 'Melhores Usuários', icon: <Users size={15} /> },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              style={tab === t.key
                ? { background: '#00ff7f', color: '#000' }
                : { color: '#94a3b8' }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {periods.map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={period === p
                ? { border: '1px solid #00ff7f', background: 'rgba(0,255,127,0.1)', color: '#00ff7f' }
                : { border: '1px solid #1a3622', color: '#94a3b8' }}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* TIPSTERS TAB */}
      {tab === 'tipsters' && (
        <>
          {ranking.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-slate-500">
              <Trophy size={48} className="opacity-20" />
              <p className="text-sm font-medium">Nenhum registro encontrado para este período.</p>
              <p className="text-xs text-slate-400">Registre apostas na página de Gestão de Tipsters.</p>
            </div>
          ) : (
            <>
              {top3.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Star size={16} className="text-yellow-400" />
                    <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: '#cbd5e1' }}>Pódio</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      top3[1] ? { rank: 2, entry: top3[1] } : null,
                      top3[0] ? { rank: 1, entry: top3[0] } : null,
                      top3[2] ? { rank: 3, entry: top3[2] } : null,
                    ].filter(Boolean).map(item => (
                      <PodiumCard key={item!.rank} rank={item!.rank} entry={item!.entry} />
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #1a3622', background: '#0a1a10' }}>
                <div className="px-6 py-4 flex items-center gap-2" style={{ borderBottom: '1px solid #1a3622', background: '#0d1f14' }}>
                  <TrendingUp size={16} style={{ color: '#00ff7f' }} />
                  <h2 className="text-sm font-bold" style={{ color: '#ffffff' }}>Classificação Geral</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr style={{ borderBottom: '1px solid #1a3622' }}>
                        {['#', 'Tipster', 'Taxa de Acerto', 'Greens', 'Reds', 'Total', 'Lucro', 'ROI'].map(h => (
                          <th key={h} className={`px-6 py-3 text-[11px] uppercase tracking-wider font-bold ${h !== '#' && h !== 'Tipster' ? 'text-right' : ''}`}
                            style={{ color: '#64748b' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody style={{ borderTop: 'none' }}>
                      {ranking.map((entry, idx) => (
                        <TableRow key={entry.id} rank={idx + 1}
                          name={entry.name} sub={entry.specialty}
                          winRate={entry.winRate} greens={entry.greens} reds={entry.reds}
                          total={entry.total} profit={entry.profit} roi={entry.roi} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* USUÁRIOS TAB */}
      {tab === 'usuarios' && (
        <>
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Star size={16} className="text-yellow-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: '#cbd5e1' }}>Pódio</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                MOCK_USERS[1] ? { rank: 2, entry: { id: MOCK_USERS[1].id, name: MOCK_USERS[1].name, specialty: MOCK_USERS[1].role, winRate: MOCK_USERS[1].winRate, greens: MOCK_USERS[1].greens, reds: MOCK_USERS[1].reds, voids: 0, total: MOCK_USERS[1].greens + MOCK_USERS[1].reds, profit: MOCK_USERS[1].profit, roi: 0 } } : null,
                MOCK_USERS[0] ? { rank: 1, entry: { id: MOCK_USERS[0].id, name: MOCK_USERS[0].name, specialty: MOCK_USERS[0].role, winRate: MOCK_USERS[0].winRate, greens: MOCK_USERS[0].greens, reds: MOCK_USERS[0].reds, voids: 0, total: MOCK_USERS[0].greens + MOCK_USERS[0].reds, profit: MOCK_USERS[0].profit, roi: 0 } } : null,
                MOCK_USERS[2] ? { rank: 3, entry: { id: MOCK_USERS[2].id, name: MOCK_USERS[2].name, specialty: MOCK_USERS[2].role, winRate: MOCK_USERS[2].winRate, greens: MOCK_USERS[2].greens, reds: MOCK_USERS[2].reds, voids: 0, total: MOCK_USERS[2].greens + MOCK_USERS[2].reds, profit: MOCK_USERS[2].profit, roi: 0 } } : null,
              ].filter(Boolean).map(item => (
                <PodiumCard key={item!.rank} rank={item!.rank} entry={item!.entry as TipsterRank} />
              ))}
            </div>
          </div>

          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #1a3622', background: '#0a1a10' }}>
            <div className="px-6 py-4 flex items-center gap-2" style={{ borderBottom: '1px solid #1a3622', background: '#0d1f14' }}>
              <TrendingUp size={16} style={{ color: '#00ff7f' }} />
              <h2 className="text-sm font-bold" style={{ color: '#ffffff' }}>Classificação de Usuários</h2>
            </div>
            <div className="text-center px-6 py-3 text-xs" style={{ color: '#64748b', background: '#0a1a10', borderBottom: '1px solid #1a3622' }}>
              ⚠️ Dados simulados — a aba de usuários será conectada ao banco de dados em breve.
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr style={{ borderBottom: '1px solid #1a3622' }}>
                    {['#', 'Usuário', 'Taxa de Acerto', 'Greens', 'Reds', 'Lucro'].map(h => (
                      <th key={h} className={`px-6 py-3 text-[11px] uppercase tracking-wider font-bold ${h !== '#' && h !== 'Usuário' ? 'text-right' : ''}`}
                        style={{ color: '#64748b' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MOCK_USERS.map((user, idx) => (
                    <TableRow key={user.id} rank={idx + 1}
                      name={user.name} sub={user.role}
                      winRate={user.winRate} greens={user.greens} reds={user.reds}
                      profit={user.profit} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
