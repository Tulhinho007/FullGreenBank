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
    return true // Geral
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
      greens,
      reds,
      voids,
      total: txs.length,
      winRate,
      profit,
      roi,
    }
  })
    .filter(r => r.total > 0)
    .sort((a, b) => b.winRate - a.winRate || b.greens - a.greens)
}

// ── Mock Users for "Melhores Usuários" tab ───────────────────────────────────

const MOCK_USERS = [
  { id: 'u1', name: 'Carlos Magro', role: 'Membro Premium', winRate: 72, greens: 36, reds: 14, profit: 1240 },
  { id: 'u2', name: 'Lucas Fernandes', role: 'Membro', winRate: 68, greens: 34, reds: 16, profit: 980 },
  { id: 'u3', name: 'João Alves', role: 'Membro Premium', winRate: 65, greens: 26, reds: 14, profit: 720 },
  { id: 'u4', name: 'Mariana Costa', role: 'Membro', winRate: 60, greens: 18, reds: 12, profit: 340 },
  { id: 'u5', name: 'Rafael Lima', role: 'Membro', winRate: 55, greens: 22, reds: 18, profit: 120 },
]

// ── Podium Card ───────────────────────────────────────────────────────────────

const RANK_CONFIG: Record<number, { icon: React.ReactNode; glow: string; border: string; badge: string; size: string }> = {
  1: {
    icon: <Crown size={22} className="text-yellow-400" />,
    glow: 'shadow-[0_0_30px_rgba(0,255,127,0.25)]',
    border: 'border-[#00ff7f]/40',
    badge: 'bg-yellow-500 text-black',
    size: 'md:scale-105 md:-mt-4',
  },
  2: {
    icon: <Medal size={20} className="text-slate-300" />,
    glow: 'shadow-[0_0_18px_rgba(0,255,127,0.12)]',
    border: 'border-[#00ff7f]/20',
    badge: 'bg-slate-400 text-white',
    size: '',
  },
  3: {
    icon: <Medal size={20} className="text-amber-700" />,
    glow: 'shadow-[0_0_14px_rgba(0,255,127,0.08)]',
    border: 'border-[#00ff7f]/10',
    badge: 'bg-amber-700 text-white',
    size: '',
  },
}

const initials = (name: string) =>
  name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()

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
      className={`relative flex flex-col items-center gap-3 p-6 rounded-3xl border bg-[#0d1f14] transition-all ${cfg.glow} ${cfg.border} ${cfg.size}`}
    >
      {/* Rank Badge */}
      <span className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-black ${cfg.badge}`}>
        #{rank}
      </span>

      {/* Crown / Medal */}
      <div className="mt-2">{cfg.icon}</div>

      {/* Avatar */}
      <div className="w-16 h-16 rounded-full bg-[#142a1c] border-2 border-[#00ff7f]/50 flex items-center justify-center text-xl font-black text-[#00ff7f]">
        {initials(entry.name)}
      </div>

      {/* Name */}
      <div className="text-center">
        <p className="font-bold text-white text-base leading-tight">{entry.name}</p>
        <p className="text-[11px] text-slate-400 mt-0.5">{entry.specialty}</p>
      </div>

      {/* Win Rate big */}
      <div className="text-center">
        <p className="text-3xl font-black" style={{ color: winRateColor(entry.winRate) }}>
          {entry.winRate}%
        </p>
        <p className="text-[10px] text-slate-500 uppercase tracking-wider">Taxa de Acerto</p>
      </div>

      {/* Stats Row */}
      <div className="flex items-center gap-4 text-sm">
        <span className="flex items-center gap-1 text-green-400 font-bold">
          <CheckCircle size={13} /> {entry.greens}
        </span>
        <span className="text-slate-600">|</span>
        <span className="flex items-center gap-1 text-red-400 font-bold">
          <XCircle size={13} /> {entry.reds}
        </span>
        <span className="text-slate-600">|</span>
        <span className="text-slate-400 font-medium text-xs">{entry.total} tips</span>
      </div>

      {/* Profit */}
      <div className={`text-sm font-bold ${entry.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
        {entry.profit >= 0 ? '+' : ''}R$ {entry.profit.toFixed(2)}
      </div>
    </div>
  )
}

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
  const rest = ranking.slice(3)

  const periods: Period[] = ['Geral', 'Mensal', 'Semanal']
  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'tipsters', label: 'Top Tipsters', icon: <Target size={15} /> },
    { key: 'usuarios', label: 'Melhores Usuários', icon: <Users size={15} /> },
  ]

  return (
    <div className="flex flex-col gap-8 w-full pb-10">

      {/* ── Header ── */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
          <Trophy className="text-yellow-400" size={24} />
          Rankings
        </h1>
        <p className="text-sm text-slate-400">Melhores desempenhos baseados em Taxa de Acerto</p>
      </div>

      {/* ── Tabs + Period Filters ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex p-1 gap-1 rounded-xl bg-[#0d1f14] border border-[#1a3622]">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === t.key
                  ? 'bg-[#00ff7f] text-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Period Filters */}
        <div className="flex gap-2">
          {periods.map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                period === p
                  ? 'border-[#00ff7f] bg-[#00ff7f]/10 text-[#00ff7f]'
                  : 'border-[#1a3622] text-slate-400 hover:border-slate-400'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* ── TIPSTERS TAB ── */}
      {tab === 'tipsters' && (
        <>
          {ranking.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-slate-500">
              <Trophy size={48} className="opacity-20" />
              <p className="text-sm font-medium">Nenhum registro encontrado para este período.</p>
              <p className="text-xs text-slate-600">Registre apostas na página de Gestão de Tipsters.</p>
            </div>
          ) : (
            <>
              {/* Podium */}
              {top3.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Star size={16} className="text-yellow-400" />
                    <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Pódio</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Reorder: 2nd, 1st, 3rd for visual podium effect */}
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

              {/* Full Leaderboard */}
              {rest.length > 0 && (
                <div className="rounded-2xl border border-[#1a3622] bg-[#0a1a10] overflow-hidden">
                  <div className="px-6 py-4 border-b border-[#1a3622] bg-[#0d1f14] flex items-center gap-2">
                    <TrendingUp size={16} className="text-[#00ff7f]" />
                    <h2 className="text-sm font-bold text-white">Classificação Geral</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-[#1a3622] text-[11px] uppercase tracking-wider text-slate-500">
                          <th className="px-6 py-3">#</th>
                          <th className="px-6 py-3">Tipster</th>
                          <th className="px-6 py-3 text-right">Taxa de Acerto</th>
                          <th className="px-6 py-3 text-right">Greens</th>
                          <th className="px-6 py-3 text-right">Reds</th>
                          <th className="px-6 py-3 text-right">Total</th>
                          <th className="px-6 py-3 text-right">Lucro</th>
                          <th className="px-6 py-3 text-right">ROI</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1a3622]">
                        {rest.map((entry, idx) => (
                          <tr key={entry.id} className="hover:bg-[#0d1f14]/80 transition-colors">
                            <td className="px-6 py-4 text-slate-500 font-bold text-sm">#{idx + 4}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-[#142a1c] border border-[#00ff7f]/30 flex items-center justify-center text-xs font-black text-[#00ff7f]">
                                  {initials(entry.name)}
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-white">{entry.name}</p>
                                  <p className="text-[11px] text-slate-500">{entry.specialty}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="font-black text-base" style={{ color: winRateColor(entry.winRate) }}>
                                {entry.winRate}%
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right text-green-400 font-bold">{entry.greens}</td>
                            <td className="px-6 py-4 text-right text-red-400 font-bold">{entry.reds}</td>
                            <td className="px-6 py-4 text-right text-slate-400">{entry.total}</td>
                            <td className={`px-6 py-4 text-right font-bold ${entry.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {entry.profit >= 0 ? '+' : ''}R$ {entry.profit.toFixed(2)}
                            </td>
                            <td className={`px-6 py-4 text-right font-semibold ${entry.roi >= 0 ? 'text-[#00ff7f]' : 'text-red-400'}`}>
                              {entry.roi >= 0 ? '+' : ''}{entry.roi}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* If only 3 tipsters, show leaderboard anyway with all */}
              {rest.length === 0 && top3.length > 0 && (
                <div className="rounded-2xl border border-[#1a3622] bg-[#0a1a10] overflow-hidden">
                  <div className="px-6 py-4 border-b border-[#1a3622] bg-[#0d1f14] flex items-center gap-2">
                    <TrendingUp size={16} className="text-[#00ff7f]" />
                    <h2 className="text-sm font-bold text-white">Classificação Geral</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-[#1a3622] text-[11px] uppercase tracking-wider text-slate-500">
                          <th className="px-6 py-3">#</th>
                          <th className="px-6 py-3">Tipster</th>
                          <th className="px-6 py-3 text-right">Taxa de Acerto</th>
                          <th className="px-6 py-3 text-right">Greens</th>
                          <th className="px-6 py-3 text-right">Reds</th>
                          <th className="px-6 py-3 text-right">Total</th>
                          <th className="px-6 py-3 text-right">Lucro</th>
                          <th className="px-6 py-3 text-right">ROI</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1a3622]">
                        {ranking.map((entry, idx) => (
                          <tr key={entry.id} className="hover:bg-[#0d1f14]/80 transition-colors">
                            <td className="px-6 py-4 text-slate-500 font-bold text-sm">#{idx + 1}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-[#142a1c] border border-[#00ff7f]/30 flex items-center justify-center text-xs font-black text-[#00ff7f]">
                                  {initials(entry.name)}
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-white">{entry.name}</p>
                                  <p className="text-[11px] text-slate-500">{entry.specialty}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="font-black text-base" style={{ color: winRateColor(entry.winRate) }}>
                                {entry.winRate}%
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right text-green-400 font-bold">{entry.greens}</td>
                            <td className="px-6 py-4 text-right text-red-400 font-bold">{entry.reds}</td>
                            <td className="px-6 py-4 text-right text-slate-400">{entry.total}</td>
                            <td className={`px-6 py-4 text-right font-bold ${entry.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {entry.profit >= 0 ? '+' : ''}R$ {entry.profit.toFixed(2)}
                            </td>
                            <td className={`px-6 py-4 text-right font-semibold ${entry.roi >= 0 ? 'text-[#00ff7f]' : 'text-red-400'}`}>
                              {entry.roi >= 0 ? '+' : ''}{entry.roi}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ── USUÁRIOS TAB ── */}
      {tab === 'usuarios' && (
        <>
          {/* Podium */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Star size={16} className="text-yellow-400" />
              <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Pódio</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                MOCK_USERS[1] ? { rank: 2, entry: { ...MOCK_USERS[1], reds: MOCK_USERS[1].greens - MOCK_USERS[1].reds, voids: 0, total: MOCK_USERS[1].greens + MOCK_USERS[1].reds, roi: 0, specialty: MOCK_USERS[1].role } } : null,
                MOCK_USERS[0] ? { rank: 1, entry: { ...MOCK_USERS[0], reds: MOCK_USERS[0].reds, voids: 0, total: MOCK_USERS[0].greens + MOCK_USERS[0].reds, roi: 0, specialty: MOCK_USERS[0].role } } : null,
                MOCK_USERS[2] ? { rank: 3, entry: { ...MOCK_USERS[2], reds: MOCK_USERS[2].reds, voids: 0, total: MOCK_USERS[2].greens + MOCK_USERS[2].reds, roi: 0, specialty: MOCK_USERS[2].role } } : null,
              ].filter(Boolean).map(item => (
                <PodiumCard key={item!.rank} rank={item!.rank} entry={item!.entry as TipsterRank} />
              ))}
            </div>
          </div>

          {/* Leaderboard table */}
          <div className="rounded-2xl border border-[#1a3622] bg-[#0a1a10] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#1a3622] bg-[#0d1f14] flex items-center gap-2">
              <TrendingUp size={16} className="text-[#00ff7f]" />
              <h2 className="text-sm font-bold text-white">Classificação de Usuários</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#1a3622] text-[11px] uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-3">#</th>
                    <th className="px-6 py-3">Usuário</th>
                    <th className="px-6 py-3 text-right">Taxa de Acerto</th>
                    <th className="px-6 py-3 text-right">Greens</th>
                    <th className="px-6 py-3 text-right">Reds</th>
                    <th className="px-6 py-3 text-right">Lucro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a3622]">
                  {MOCK_USERS.map((user, idx) => (
                    <tr key={user.id} className="hover:bg-[#0d1f14]/80 transition-colors">
                      <td className="px-6 py-4 text-slate-500 font-bold text-sm">#{idx + 1}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#142a1c] border border-[#00ff7f]/30 flex items-center justify-center text-xs font-black text-[#00ff7f]">
                            {initials(user.name)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">{user.name}</p>
                            <p className="text-[11px] text-slate-500">{user.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-black text-base" style={{ color: winRateColor(user.winRate) }}>
                          {user.winRate}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-green-400 font-bold">{user.greens}</td>
                      <td className="px-6 py-4 text-right text-red-400 font-bold">{user.reds}</td>
                      <td className={`px-6 py-4 text-right font-bold ${user.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        +R$ {user.profit.toFixed(2)}
                      </td>
                    </tr>
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
