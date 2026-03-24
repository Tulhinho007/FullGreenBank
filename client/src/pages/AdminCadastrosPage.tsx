import { useEffect, useState } from 'react'
import { ClipboardList, Dumbbell, Trophy, Shield, Star, RefreshCw } from 'lucide-react'

import { SportsModal, Sport } from '../components/ui/SportsModal'
import { LeaguesModal, League, DEFAULT_LEAGUES } from '../components/ui/LeaguesModal'
import { TeamsModal } from '../components/ui/TeamsModal'
import { BookmakersModal, Bookmaker } from '../components/ui/BookmakersModal'
import { MarketsModal, Market } from '../components/ui/MarketsModal'

import { useAuth } from '../contexts/AuthContext'
import { addLog } from '../services/log.service'

import toast from 'react-hot-toast'
import {
  sportsService,
  leaguesService,
  bookmakersService,
  marketsService,
  runSeed,
} from '../services/cadastros.service'
// localStorage keys mantidos como cache local (fallback enquanto API carrega)
// Identificadores para localStorage cache
const SPORTS_KEY     = 'fgb_sports'
const LEAGUES_KEY    = 'fgb_leagues'
const BOOKMAKERS_KEY = 'fgb_bookmakers'
const MARKETS_KEY    = 'fgb_markets'



const loadSports = (): Sport[] => {
  try { const s = localStorage.getItem(SPORTS_KEY); return s ? JSON.parse(s) : [] } catch { return [] }
}
const loadLeagues = (): League[] => {
  try { const s = localStorage.getItem(LEAGUES_KEY); return s ? JSON.parse(s) : DEFAULT_LEAGUES } catch { return DEFAULT_LEAGUES }
}
const loadBookmakers = (): Bookmaker[] => {
  try { const s = localStorage.getItem(BOOKMAKERS_KEY); return s ? JSON.parse(s) : [] } catch { return [] }
}
const loadMarkets = (): Market[] => {
  try { const s = localStorage.getItem(MARKETS_KEY); return s ? JSON.parse(s) : [] } catch { return [] }
}


const placeholders = [
  { title: 'Categorias', desc: 'Categorias e tags de dicas'      },
]



export const AdminCadastrosPage = () => {
  const { user: me } = useAuth()
  const isReadOnly = me?.role === 'TESTER'
  const [sportsOpen,   setSportsOpen]   = useState(false)
  const [sports,       setSports]       = useState<Sport[]>(() => loadSports())
  const [leagues,       setLeagues]       = useState<League[]>(() => loadLeagues())
  const [leaguesOpen,   setLeaguesOpen]   = useState(false)
  const [teamsOpen,     setTeamsOpen]     = useState(false)
  const [bookmakers,    setBookmakers]    = useState<Bookmaker[]>(() => loadBookmakers())
  const [bookmakersOpen,setBookmakersOpen]= useState(false)
  const [markets,       setMarkets]       = useState<Market[]>(() => loadMarkets())
  const [marketsOpen,   setMarketsOpen]   = useState(false)
  const [seeding,    setSeeding]    = useState(false)

  // ── Carrega dados da API e atualiza localStorage como cache ─────────────────
  const fetchAllFromAPI = async () => {
    try {
      const [sp, lgs, bms, mks] = await Promise.all([
        sportsService.getAll(),
        leaguesService.getAll(),
        bookmakersService.getAll(),
        marketsService.getAll(),
      ])
      setSports(sp);     localStorage.setItem(SPORTS_KEY, JSON.stringify(sp))
      setLeagues(lgs);   localStorage.setItem(LEAGUES_KEY, JSON.stringify(lgs))
      setBookmakers(bms);localStorage.setItem(BOOKMAKERS_KEY, JSON.stringify(bms))
      setMarkets(mks);   localStorage.setItem(MARKETS_KEY, JSON.stringify(mks))
    } catch {
      // Se falhar, mantém os dados do localStorage (já carregados no estado inicial)
    }
  }

  // ── Sincronizar Defaults → popula o banco com dados padrão ───────────────────
  const handleSeed = async () => {
    try {
      const result = await runSeed()
      console.log('Seed result:', result)
      toast.success(`Dados padrão importados! ${result.sports} esportes, ${result.leagues} ligas, ${result.bookmakers} casas, ${result.markets} mercados.`)
      await fetchAllFromAPI()
    } catch {
      toast.error('Erro ao sincronizar dados padrão.')
    } finally {
      setSeeding(false)
    }
  }

  // ── Callbacks para os modais (chamam a API e atualizam estado) ───────────────
  const saveSports = async (updated: Sport[]) => {
    // Detecta o que mudou (add/edit/delete) e chama a API correspondente
    const addedItems   = updated.filter(u => !sports.find(s => s.id === u.id))
    const removedItems = sports.filter(s => !updated.find(u => u.id === s.id))
    const editedItems  = updated.filter(u => {
      const orig = sports.find(s => s.id === u.id)
      return orig && (orig.name !== u.name || orig.emoji !== u.emoji || orig.slug !== u.slug)
    })
    try {
      for (const a of addedItems)  await sportsService.create({ name: a.name, emoji: a.emoji, slug: a.slug })
      for (const d of removedItems) await sportsService.remove(d.id)
      for (const e of editedItems)  await sportsService.update(e.id, { name: e.name, emoji: e.emoji, slug: e.slug })
      const fresh = await sportsService.getAll()
      setSports(fresh); localStorage.setItem(SPORTS_KEY, JSON.stringify(fresh))
      if (me) addLog({ userEmail: me.email, userName: me.name, userRole: me.role, category: 'Admin', action: 'Esportes atualizados', detail: `${fresh.length} esportes` })
    } catch { toast.error('Erro ao salvar esportes.') }
  }

  const saveLeagues = async (updated: League[]) => {
    const addedItems   = updated.filter(u => !leagues.find(l => l.id === u.id))
    const removedItems = leagues.filter(l => !updated.find(u => u.id === l.id))
    const editedItems  = updated.filter(u => {
      const orig = leagues.find(l => l.id === u.id)
      return orig && (orig.name !== u.name || orig.category !== u.category)
    })
    try {
      for (const a of addedItems)   await leaguesService.create({ name: a.name, category: a.category, featured: a.featured ?? false })
      for (const d of removedItems) await leaguesService.remove(d.id)
      for (const e of editedItems)  await leaguesService.update(e.id, { name: e.name, category: e.category, featured: e.featured ?? false })
      const fresh = await leaguesService.getAll()
      setLeagues(fresh); localStorage.setItem(LEAGUES_KEY, JSON.stringify(fresh))
      if (me) addLog({ userEmail: me.email, userName: me.name, userRole: me.role, category: 'Admin', action: 'Ligas atualizadas', detail: `${fresh.length} ligas` })
    } catch { toast.error('Erro ao salvar ligas.') }
  }

  const saveBookmakers = async (updated: Bookmaker[]) => {
    const addedItems   = updated.filter(u => !bookmakers.find(b => b.id === u.id))
    const removedItems = bookmakers.filter(b => !updated.find(u => u.id === b.id))
    const editedItems  = updated.filter(u => {
      const orig = bookmakers.find(b => b.id === u.id)
      return orig && (orig.name !== u.name || orig.differential !== u.differential || orig.focus !== u.focus)
    })
    try {
      for (const a of addedItems)   await bookmakersService.create({ name: a.name, differential: a.differential, focus: a.focus })
      for (const d of removedItems) await bookmakersService.remove(d.id)
      for (const e of editedItems)  await bookmakersService.update(e.id, { name: e.name, differential: e.differential, focus: e.focus })
      const fresh = await bookmakersService.getAll()
      setBookmakers(fresh); localStorage.setItem(BOOKMAKERS_KEY, JSON.stringify(fresh))
      if (me) addLog({ userEmail: me.email, userName: me.name, userRole: me.role, category: 'Admin', action: 'Casas atualizadas', detail: `${fresh.length} casas` })
    } catch { toast.error('Erro ao salvar casas.') }
  }

  const saveMarkets = async (updated: Market[]) => {
    const addedItems   = updated.filter(u => !markets.find(m => m.id === u.id))
    const removedItems = markets.filter(m => !updated.find(u => u.id === m.id))
    const editedItems  = updated.filter(u => {
      const orig = markets.find(m => m.id === u.id)
      return orig && (orig.name !== u.name || orig.sportSlug !== u.sportSlug)
    })
    try {
      for (const a of addedItems)   await marketsService.create({ name: a.name, sportSlug: a.sportSlug })
      for (const d of removedItems) await marketsService.remove(d.id)
      for (const e of editedItems)  await marketsService.update(e.id, { name: e.name, sportSlug: e.sportSlug })
      const fresh = await marketsService.getAll()
      setMarkets(fresh); localStorage.setItem(MARKETS_KEY, JSON.stringify(fresh))
      if (me) addLog({ userEmail: me.email, userName: me.name, userRole: me.role, category: 'Admin', action: 'Mercados atualizados', detail: `${fresh.length} mercados` })
    } catch { toast.error('Erro ao salvar mercados.') }
  }

  // Carrega contagem de usuários + dados da API
  useEffect(() => { fetchAllFromAPI() }, [])



  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display font-semibold text-white">{'Cadastros'}</h2>
          <p className="text-xs text-slate-500 mt-0.5">{'Gerenciamento de tabelas base do sistema'}</p>
        </div>
        {!isReadOnly && (
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600/20 border border-amber-600/40 text-amber-400 text-xs font-semibold hover:bg-amber-600/30 transition-all disabled:opacity-50"
            title="Popula o banco com os dados padrão (esportes, ligas, casas)."
          >
            <RefreshCw size={13} className={seeding ? 'animate-spin' : ''} />
            {seeding ? 'Sincronizando...' : 'Sincronizar Defaults'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">



        {/* ── Card ESPORTES — funcional ── */}
        <div
          onClick={() => setSportsOpen(true)}
          className="card p-5 border border-surface-400 hover:border-green-600/60 hover:shadow-green-glow transition-all duration-200 cursor-pointer group"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-green-900/50 flex items-center justify-center group-hover:bg-green-800/60 transition-colors">
              <Dumbbell size={16} className="text-green-400" />
            </div>
            <span className="text-xs bg-green-900/40 text-green-400 px-2 py-0.5 rounded-full border border-green-800/50">
              {'Ativo'}
            </span>
          </div>
          <h3 className="font-semibold text-white text-sm">{'Esportes'}</h3>
          <p className="text-xs text-slate-500 mt-1">Gerenciar esportes disponíveis no sistema</p>
          <div className="mt-4 pt-3 border-t border-surface-300 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {sports.length} {sports.length === 1 ? 'esporte' : 'esportes'}
            </span>
            <span className="text-xs text-green-400 border border-green-800/50 bg-green-900/30 px-2.5 py-1 rounded group-hover:bg-green-800/50 transition-colors">
              {'Gerenciar'}
            </span>
          </div>
        </div>

        {/* ── Card LIGAS / CAMPEONATOS — funcional ── */}
        <div
          onClick={() => setLeaguesOpen(true)}
          className="card p-5 border border-surface-400 hover:border-green-600/60 hover:shadow-green-glow transition-all duration-200 cursor-pointer group"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-green-900/50 flex items-center justify-center group-hover:bg-green-800/60 transition-colors">
              <Trophy size={16} className="text-green-400" />
            </div>
            <span className="text-xs bg-green-900/40 text-green-400 px-2 py-0.5 rounded-full border border-green-800/50">
              {'Ativo'}
            </span>
          </div>
          <h3 className="font-semibold text-white text-sm">{'Ligas / Campeonatos'}</h3>
          <p className="text-xs text-slate-500 mt-1">Competições e torneios disponíveis no sistema</p>
          <div className="mt-4 pt-3 border-t border-surface-300 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {leagues.length} {leagues.length === 1 ? 'liga' : 'ligas'}
            </span>
            <span className="text-xs text-green-400 border border-green-800/50 bg-green-900/30 px-2.5 py-1 rounded group-hover:bg-green-800/50 transition-colors">
              {'Gerenciar'}
            </span>
          </div>
        </div>

        {/* ── Card TIMES — funcional ── */}
        <div
          onClick={() => setTeamsOpen(true)}
          className="card p-5 border border-surface-400 hover:border-green-600/60 hover:shadow-green-glow transition-all duration-200 cursor-pointer group"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-green-900/50 flex items-center justify-center group-hover:bg-green-800/60 transition-colors">
              <Shield size={16} className="text-green-400" />
            </div>
            <span className="text-xs bg-green-900/40 text-green-400 px-2 py-0.5 rounded-full border border-green-800/50">{'Ativo'}</span>
          </div>
          <h3 className="font-semibold text-white text-sm">{'Times'}</h3>
          <p className="text-xs text-slate-500 mt-1">Times e equipes esportivas do sistema</p>
          <div className="mt-4 pt-3 border-t border-surface-300 flex items-center justify-between">
            <span className="text-xs text-slate-500">1.382 times</span>
            <span className="text-xs text-green-400 border border-green-800/50 bg-green-900/30 px-2.5 py-1 rounded group-hover:bg-green-800/50 transition-colors">{'Gerenciar'}</span>
          </div>
        </div>

        {/* ── Card CASAS DE APOSTAS — funcional ── */}
        <div
          onClick={() => setBookmakersOpen(true)}
          className="card p-5 border border-surface-400 hover:border-green-600/60 hover:shadow-green-glow transition-all duration-200 cursor-pointer group"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-green-900/50 flex items-center justify-center group-hover:bg-green-800/60 transition-colors">
              <Star size={16} className="text-green-400" />
            </div>
            <span className="text-xs bg-green-900/40 text-green-400 px-2 py-0.5 rounded-full border border-green-800/50">{'Ativo'}</span>
          </div>
          <h3 className="font-semibold text-white text-sm">{'Casas de Apostas'}</h3>
          <p className="text-xs text-slate-500 mt-1">Bookmakers e plataformas disponíveis</p>
          <div className="mt-4 pt-3 border-t border-surface-300 flex items-center justify-between">
            <span className="text-xs text-slate-500">{bookmakers.length} {bookmakers.length === 1 ? 'casa' : 'casas'}</span>
            <span className="text-xs text-green-400 border border-green-800/50 bg-green-900/30 px-2.5 py-1 rounded group-hover:bg-green-800/50 transition-colors">{'Gerenciar'}</span>
          </div>
        </div>

        {/* ── Card MERCADOS — funcional ── */}
        <div
          onClick={() => setMarketsOpen(true)}
          className="card p-5 border border-surface-400 hover:border-green-600/60 hover:shadow-green-glow transition-all duration-200 cursor-pointer group"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-green-900/50 flex items-center justify-center group-hover:bg-green-800/60 transition-colors">
              <ClipboardList size={16} className="text-green-400" />
            </div>
            <span className="text-xs bg-green-900/40 text-green-400 px-2 py-0.5 rounded-full border border-green-800/50">
              {'Ativo'}
            </span>
          </div>
          <h3 className="font-semibold text-white text-sm">{'Mercados'}</h3>
          <p className="text-xs text-slate-500 mt-1">Mercados de apostas por esporte</p>
          <div className="mt-4 pt-3 border-t border-surface-300 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {markets.length} {markets.length === 1 ? 'mercado' : 'mercados'}
            </span>
            <span className="text-xs text-green-400 border border-green-800/50 bg-green-900/30 px-2.5 py-1 rounded group-hover:bg-green-800/50 transition-colors">
              {'Gerenciar'}
            </span>
          </div>
        </div>

        {/* ── Cards PLACEHOLDER ── */}
        {placeholders.map(s => (
          <div key={s.title} className="card p-5 border border-surface-400 hover:border-surface-300 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-surface-300 flex items-center justify-center">
                <ClipboardList size={16} className="text-slate-500" />
              </div>
              <span className="text-xs bg-surface-300 text-slate-500 px-2 py-0.5 rounded-full border border-surface-400">
                {'Em breve'}
              </span>
            </div>
            <h3 className="font-semibold text-sm">{s.title}</h3>
            <p className="text-xs text-slate-500 mt-1">{s.desc}</p>
            <div className="mt-4 pt-3 border-t border-surface-300 flex items-center justify-between">
              <span className="text-xs text-slate-600">0 registros</span>
              <button disabled className="text-xs text-slate-600 border border-surface-400 px-2.5 py-1 rounded cursor-not-allowed opacity-40">
                {'Gerenciar'}
              </button>
            </div>
          </div>
        ))}
      </div>



      {/* ── Modal Esportes ── */}
      <SportsModal
        isOpen={sportsOpen}
        onClose={() => setSportsOpen(false)}
        sports={sports}
        onSave={saveSports}
        readOnly={isReadOnly}
      />

      {/* ── Modal Casas de Apostas ── */}
      <BookmakersModal
        isOpen={bookmakersOpen}
        onClose={() => setBookmakersOpen(false)}
        bookmakers={bookmakers}
        onSave={saveBookmakers}
        readOnly={isReadOnly}
      />

      {/* ── Modal Times ── */}
      <TeamsModal isOpen={teamsOpen} onClose={() => setTeamsOpen(false)} readOnly={isReadOnly} />

      {/* ── Modal Ligas ── */}
      <LeaguesModal
        isOpen={leaguesOpen}
        onClose={() => setLeaguesOpen(false)}
        leagues={leagues}
        onSave={saveLeagues}
        readOnly={isReadOnly}
      />

      {/* ── Modal Mercados ── */}
      <MarketsModal
        isOpen={marketsOpen}
        onClose={() => setMarketsOpen(false)}
        markets={markets}
        sports={sports.map(s => ({ name: s.name, slug: s.slug || '' }))}
        onSave={saveMarkets}
        readOnly={isReadOnly}
      />

    </div>
  )
}
