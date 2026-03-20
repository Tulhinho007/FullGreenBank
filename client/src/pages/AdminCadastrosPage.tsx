import { useEffect, useState, FormEvent } from 'react'
import { ClipboardList, Users, Eye, EyeOff, Dumbbell, Trophy, Shield, Star } from 'lucide-react'
import { Modal } from '../components/ui/Modal'
import { SportsModal, Sport } from '../components/ui/SportsModal'
import { LeaguesModal, League, DEFAULT_LEAGUES } from '../components/ui/LeaguesModal'
import { TeamsModal } from '../components/ui/TeamsModal'
import { BookmakersModal, Bookmaker, DEFAULT_BOOKMAKERS } from '../components/ui/BookmakersModal'
import { MarketsModal, Market } from '../components/ui/MarketsModal'
import { usersService } from '../services/users.service'
import { useAuth } from '../contexts/AuthContext'
import { addLog } from './SystemLogPage'
import api from '../services/api'
import toast from 'react-hot-toast'
const SPORTS_KEY     = 'fgb_sports'
const LEAGUES_KEY    = 'fgb_leagues'
const BOOKMAKERS_KEY = 'fgb_bookmakers'
const MARKETS_KEY    = 'fgb_markets'

// Dados iniciais — carregados apenas na primeira vez (localStorage vazio)
const DEFAULT_SPORTS: Sport[] = [
  { id: '1', name: 'Futebol',            emoji: '⚽', slug: 'futebol'    },
  { id: '2', name: 'Basquete',           emoji: '🏀', slug: 'basquete'   },
  { id: '3', name: 'Tênis',              emoji: '🎾', slug: 'tenis'      },
  { id: '4', name: 'eSports',            emoji: '🎮', slug: 'esports'    },
  { id: '5', name: 'Vôlei',             emoji: '🏐', slug: 'volei'      },
  { id: '6', name: 'MMA',               emoji: '🥊', slug: 'mma'        },
  { id: '7', name: 'Futebol Americano', emoji: '🏈', slug: 'nfl'        },
]

const loadSports = (): Sport[] => {
  try {
    const stored = localStorage.getItem(SPORTS_KEY)
    if (stored) return JSON.parse(stored)
    localStorage.setItem(SPORTS_KEY, JSON.stringify(DEFAULT_SPORTS))
    return DEFAULT_SPORTS
  } catch { return DEFAULT_SPORTS }
}

const loadLeagues = (): League[] => {
  try {
    const stored = localStorage.getItem(LEAGUES_KEY)
    if (stored) return JSON.parse(stored)
    localStorage.setItem(LEAGUES_KEY, JSON.stringify(DEFAULT_LEAGUES))
    return DEFAULT_LEAGUES
  } catch { return DEFAULT_LEAGUES }
}

const loadBookmakers = (): Bookmaker[] => {
  try {
    const stored = localStorage.getItem(BOOKMAKERS_KEY)
    if (stored) return JSON.parse(stored)
    localStorage.setItem(BOOKMAKERS_KEY, JSON.stringify(DEFAULT_BOOKMAKERS))
    return DEFAULT_BOOKMAKERS
  } catch { return DEFAULT_BOOKMAKERS }
}

const DEFAULT_MARKETS: Market[] = [
  ...[
    "Ambas Marcam",
    "Asiático - Mais de 0.5 gols", "Asiático - Mais de 0.75 gols", "Asiático - Mais de 1.0 gols", "Asiático - Mais de 1.25 gols", "Asiático - Mais de 1.5 gols", "Asiático - Mais de 1.75 gols", "Asiático - Mais de 2.0 gols", "Asiático - Mais de 2.25 gols", "Asiático - Mais de 2.5 gols", "Asiático - Mais de 2.75 gols", "Asiático - Mais de 3.0 gols", "Asiático - Mais de 3.25 gols", "Asiático - Mais de 3.5 gols", "Asiático - Mais de 3.75 gols", "Asiático - Mais de 4.0 gols", "Asiático - Mais de 4.25 gols", "Asiático - Mais de 4.5 gols", "Asiático - Mais de 4.75 gols", "Asiático - Mais de 5.0 gols", "Asiático - Mais de 5.25 gols", "Asiático - Mais de 5.5 gols", "Asiático - Mais de 5.75 gols", "Asiático - Mais de 6.0 gols", "Asiático - Mais de 6.25 gols", "Asiático - Mais de 6.5 gols", "Asiático - Mais de 6.75 gols", "Asiático - Mais de 7.0 gols", "Asiático - Mais de 7.25 gols", "Asiático - Mais de 7.5 gols", "Asiático - Mais de 7.75 gols", "Asiático - Mais de 8.0 gols",
    "Asiático - Menos  de 4.75 gols", "Asiático - Menos  de 6.5 gols", "Asiático - Menos  de 6.75 gols",
    "Asiático - Menos de 0.5 gols", "Asiático - Menos de 0.75 gols", "Asiático - Menos de 1.0 gols", "Asiático - Menos de 1.25 gols", "Asiático - Menos de 1.5 gols", "Asiático - Menos de 1.75 gols", "Asiático - Menos de 2.0 gols", "Asiático - Menos de 2.25 gols", "Asiático - Menos de 2.5 gols", "Asiático - Menos de 2.75 gols", "Asiático - Menos de 3.0 gols", "Asiático - Menos de 3.25 gols", "Asiático - Menos de 3.5 gols", "Asiático - Menos de 3.75 gols", "Asiático - Menos de 4.0 gols", "Asiático - Menos de 4.25 gols", "Asiático - Menos de 4.5 gols", "Asiático - Menos de 5.0 gols", "Asiático - Menos de 5.25 gols", "Asiático - Menos de 5.5 gols", "Asiático - Menos de 5.75 gols", "Asiático - Menos de 6.0 gols", "Asiático - Menos de 6.25 gols", "Asiático - Menos de 7.0 gols", "Asiático - Menos de 7.25 gols", "Asiático - Menos de 7.5 gols", "Asiático - Menos de 7.75 gols", "Asiático - Menos de 8.0 gols",
    "Back Favorito",
    "Basket - Casa", "Basket - Fora", "Basket - Handicap Mais Pontos Casa", "Basket - Handicap Mais Pontos Fora", "Basket - Handicap Menos Pontos Casa", "Basket - Handicap Menos Pontos Fora", "Basket - Mais Total Pontos", "Basket - Menos Total Pontos", "Basket - Personalizada",
    "Basket - Vencedor 1º Intervalo Casa", "Basket - Vencedor 1º Intervalo Empate", "Basket - Vencedor 1º Intervalo Fora",
    "Basket - Vencedor 1º Quarto Casa", "Basket - Vencedor 1º Quarto Empate", "Basket - Vencedor 1º Quarto Fora",
    "Basket - Vencedor 2º Intervalo Casa", "Basket - Vencedor 2º Intervalo Empate", "Basket - Vencedor 2º Intervalo Fora",
    "Basket - Vencedor 2º Quarto Casa", "Basket - Vencedor 2º Quarto Empate", "Basket - Vencedor 2º Quarto Fora",
    "Basket - Vencedor 3º Quarto Casa", "Basket - Vencedor 3º Quarto Empate", "Basket - Vencedor 3º Quarto Fora",
    "Basket - Vencedor 4º Quarto Casa", "Basket - Vencedor 4º Quarto Empate", "Basket - Vencedor 4º Quarto Fora",
    "Cartões - Ambas Recebem 1 - Não", "Cartões - Ambas Recebem 1 - Sim", "Cartões - Ambas Recebem 2 ou mais - Não", "Cartões - Ambas Recebem 2 ou mais - Sim",
    "Cartões - Casa +", "Cartões - Empate", "Cartões - Fora +",
    "Cartões - Mais de 1.5", "Cartões - Mais de 2.5", "Cartões - Mais de 3.5", "Cartões - Mais de 4.5", "Cartões - Mais de 5.5", "Cartões - Mais de 6.5", "Cartões - Mais de 7.5", "Cartões - Mais de 8.5", "Cartões - Mais de 9.5",
    "Cartões - Menos de 1.5", "Cartões - Menos de 2.5", "Cartões - Menos de 3.5", "Cartões - Menos de 4.5", "Cartões - Menos de 5.5", "Cartões - Menos de 6.5", "Cartões - Menos de 7.5", "Cartões - Menos de 8.5", "Cartões - Menos de 9.5",
    "Cartões Vermelhos - Mais de 0.5", "Cartões Vermelhos - Mais de 1.5", "Cartões Vermelhos - Menos de 0.5", "Cartões Vermelhos - Menos de 1.5",
    "Casa - Mais de 0.5 gols", "Casa - Mais de 1.5 gols", "Casa - Mais de 2.5 gols", "Casa - Mais de 3.5 gols", "Casa - Mais de 4.5 gols",
    "Casa - Menos de 0.5 gols", "Casa - Menos de 1.5 gols", "Casa - Menos de 2.5 gols", "Casa - Menos de 3.5 gols", "Casa - Menos de 4.5 gols",
    "DC - Casa ou Empate", "DC - Casa ou Fora", "DC - Fora ou Empate",
    "Escanteios - Casa Mais de 1.5", "Escanteios - Casa Mais de 2.5", "Escanteios - Casa Mais de 3.5", "Escanteios - Casa Mais de 4.5", "Escanteios - Casa Mais de 5.5", "Escanteios - Casa Mais de 6.5", "Escanteios - Casa Mais de 7.5", "Escanteios - Casa Mais de 8.5", "Escanteios - Casa Mais de 9.5",
    "Escanteios - Casa Menos de 1.5", "Escanteios - Casa Menos de 2.5", "Escanteios - Casa Menos de 3.5", "Escanteios - Casa Menos de 4.5", "Escanteios - Casa Menos de 5.5", "Escanteios - Casa Menos de 6.5", "Escanteios - Casa Menos de 7.5", "Escanteios - Casa Menos de 8.5", "Escanteios - Casa Menos de 9.5",
    "Escanteios - Casa+", "Escanteios - Empate",
    "Escanteios - Fora Mais de 1.5", "Escanteios - Fora Mais de 2.5", "Escanteios - Fora Mais de 3.5", "Escanteios - Fora Mais de 4.5", "Escanteios - Fora Mais de 5.5", "Escanteios - Fora Mais de 6.5", "Escanteios - Fora Mais de 7.5", "Escanteios - Fora Mais de 8.5", "Escanteios - Fora Mais de 9.5",
    "Escanteios - Fora Menos de 1.5", "Escanteios - Fora Menos de 2.5", "Escanteios - Fora Menos de 3.5", "Escanteios - Fora Menos de 4.5", "Escanteios - Fora Menos de 5.5", "Escanteios - Fora Menos de 6.5", "Escanteios - Fora Menos de 7.5", "Escanteios - Fora Menos de 8.5", "Escanteios - Fora Menos de 9.5",
    "Escanteios - Fora+",
    "Escanteios - Mais de 10.5", "Escanteios - Mais de 11.5", "Escanteios - Mais de 12.5", "Escanteios - Mais de 13.5", "Escanteios - Mais de 14.5", "Escanteios - Mais de 15.5", "Escanteios - Mais de 2.5", "Escanteios - Mais de 3.5", "Escanteios - Mais de 4.5", "Escanteios - Mais de 5.5", "Escanteios - Mais de 6.5", "Escanteios - Mais de 7.5", "Escanteios - Mais de 8.5", "Escanteios - Mais de 9.5",
    "Escanteios - Menos de 10.5", "Escanteios - Menos de 11.5", "Escanteios - Menos de 12.5", "Escanteios - Menos de 13.5", "Escanteios - Menos de 14.5", "Escanteios - Menos de 15.5", "Escanteios - Menos de 2.5", "Escanteios - Menos de 3.5", "Escanteios - Menos de 4.5", "Escanteios - Menos de 5.5", "Escanteios - Menos de 6.5", "Escanteios - Menos de 7.5", "Escanteios - Menos de 8.5", "Escanteios - Menos de 9.5",
    "Escanteios - Race 1 - Casa", "Escanteios - Race 1 - Fora", "Escanteios - Race 2 - Casa", "Escanteios - Race 2 - Fora", "Escanteios - Race 3 - Casa", "Escanteios - Race 3 - Fora", "Escanteios - Race 4 - Casa", "Escanteios - Race 4 - Fora", "Escanteios - Race 5 - Casa", "Escanteios - Race 5 - Fora", "Escanteios - Race 6 - Casa", "Escanteios - Race 6 - Fora", "Escanteios - Race 7 - Casa", "Escanteios - Race 7 - Fora", "Escanteios - Race 8 - Casa", "Escanteios - Race 8 - Fora", "Escanteios - Race 9 - Casa", "Escanteios - Race 9 - Fora",
    "Escanteios 1ºTempo - Casa Mais de 1.5", "Escanteios 1ºTempo - Casa Mais de 2.5", "Escanteios 1ºTempo - Casa Mais de 3.5", "Escanteios 1ºTempo - Casa Mais de 4.5", "Escanteios 1ºTempo - Casa Mais de 5.5",
    "Escanteios 1ºTempo - Casa Menos de 1.5", "Escanteios 1ºTempo - Casa Menos de 2.5", "Escanteios 1ºTempo - Casa Menos de 3.5", "Escanteios 1ºTempo - Casa Menos de 4.5", "Escanteios 1ºTempo - Casa Menos de 5.5",
    "Escanteios 1ºTempo - Fora Mais de 1.5", "Escanteios 1ºTempo - Fora Mais de 2.5", "Escanteios 1ºTempo - Fora Mais de 3.5", "Escanteios 1ºTempo - Fora Mais de 4.5", "Escanteios 1ºTempo - Fora Mais de 5.5",
    "Escanteios 1ºTempo - Fora Menos de 1.5", "Escanteios 1ºTempo - Fora Menos de 2.5", "Escanteios 1ºTempo - Fora Menos de 3.5", "Escanteios 1ºTempo - Fora Menos de 4.5", "Escanteios 1ºTempo - Fora Menos de 5.5",
    "Escanteios 1ºTempo - Mais de 1.5", "Escanteios 1ºTempo - Mais de 2.5", "Escanteios 1ºTempo - Mais de 3.5", "Escanteios 1ºTempo - Mais de 4.5", "Escanteios 1ºTempo - Mais de 5.5", "Escanteios 1ºTempo - Mais de 6.5", "Escanteios 1ºTempo - Mais de 7.5",
    "Fora - Mais de 0.5 gols", "Fora - Mais de 1.5 gols", "Fora - Mais de 2.5 gols", "Fora - Mais de 3.5 gols", "Fora - Mais de 4.5 gols",
    "Fora - Menos de 0.5 gols", "Fora - Menos de 1.5 gols", "Fora - Menos de 2.5 gols", "Fora - Menos de 3.5 gols", "Fora - Menos de 4.5 gols",
    "Futebol - Personalizada",
    "Handicap Asiático Casa -0.5", "Handicap Asiático Casa -0.75", "Handicap Asiático Casa -1.0", "Handicap Asiático Casa -1.25", "Handicap Asiático Casa -1.5", "Handicap Asiático Casa -1.75", "Handicap Asiático Casa -2.0", "Handicap Asiático Casa -2.25", "Handicap Asiático Casa -2.5", "Handicap Asiático Casa -2.75", "Handicap Asiático Casa -3.0", "Handicap Asiático Casa -3.25", "Handicap Asiático Casa -3.5", "Handicap Asiático Casa -3.75", "Handicap Asiático Casa -4.0", "Handicap Asiático Casa -4.25", "Handicap Asiático Casa -4.5", "Handicap Asiático Casa -4.75", "Handicap Asiático Casa -5.0",
    "Handicap Asiático Casa +0.5", "Handicap Asiático Casa +0.75", "Handicap Asiático Casa +1.0", "Handicap Asiático Casa +1.25", "Handicap Asiático Casa +1.5", "Handicap Asiático Casa +1.75", "Handicap Asiático Casa +2.0", "Handicap Asiático Casa +2.25", "Handicap Asiático Casa +2.5", "Handicap Asiático Casa +2.75", "Handicap Asiático Casa +3.0", "Handicap Asiático Casa +3.25", "Handicap Asiático Casa +3.5", "Handicap Asiático Casa +3.75", "Handicap Asiático Casa +4.0", "Handicap Asiático Casa +4.25", "Handicap Asiático Casa +4.5", "Handicap Asiático Casa +4.75", "Handicap Asiático Casa +5.0",
    "Handicap Asiático Fora  -1.75", "Handicap Asiático Fora  +1.75", "Handicap Asiático Fora -0.5", "Handicap Asiático Fora -0.75", "Handicap Asiático Fora -1.0", "Handicap Asiático Fora -1.25", "Handicap Asiático Fora -1.5", "Handicap Asiático Fora -2.0", "Handicap Asiático Fora -2.25", "Handicap Asiático Fora -2.5", "Handicap Asiático Fora -2.75", "Handicap Asiático Fora -3.0", "Handicap Asiático Fora -3.25", "Handicap Asiático Fora -3.5", "Handicap Asiático Fora -3.75", "Handicap Asiático Fora -4.0", "Handicap Asiático Fora -4.25", "Handicap Asiático Fora -4.5", "Handicap Asiático Fora -4.75", "Handicap Asiático Fora -5.0",
    "Handicap Asiático Fora +0.5", "Handicap Asiático Fora +0.75", "Handicap Asiático Fora +1.0", "Handicap Asiático Fora +1.25", "Handicap Asiático Fora +1.5", "Handicap Asiático Fora +2.0", "Handicap Asiático Fora +2.25", "Handicap Asiático Fora +2.5", "Handicap Asiático Fora +2.75", "Handicap Asiático Fora +3.0", "Handicap Asiático Fora +3.25", "Handicap Asiático Fora +3.5", "Handicap Asiático Fora +3.75", "Handicap Asiático Fora +4.0", "Handicap Asiático Fora +4.25", "Handicap Asiático Fora +4.5", "Handicap Asiático Fora +4.75", "Handicap Asiático Fora +5.0",
    "Handicap Casa -1", "Handicap Casa -2", "Handicap Casa -3", "Handicap Casa -4", "Handicap Casa -5", "Handicap Casa -6", "Handicap Casa -7", "Handicap Casa -8", "Handicap Casa -9",
    "Handicap Casa +1", "Handicap Casa +2", "Handicap Casa +3", "Handicap Casa +4", "Handicap Casa +5", "Handicap Casa +6", "Handicap Casa +7", "Handicap Casa +8", "Handicap Casa +9",
    "Handicap Fora -1", "Handicap Fora -2", "Handicap Fora -3", "Handicap Fora -4", "Handicap Fora -5", "Handicap Fora -6", "Handicap Fora -7", "Handicap Fora -8", "Handicap Fora -9",
    "Handicap Fora +1", "Handicap Fora +2", "Handicap Fora +3", "Handicap Fora +4", "Handicap Fora +5", "Handicap Fora +6", "Handicap Fora +7", "Handicap Fora +8", "Handicap Fora +9",
    "Lay Favorito",
    "Mais de 0.5 gols", "Mais de 1.5 gols", "Mais de 10.5 gols", "Mais de 2.5 gols", "Mais de 3.5 gols", "Mais de 4.5 gols", "Mais de 5.5 gols", "Mais de 6.5 gols", "Mais de 7.5 gols", "Mais de 8.5 gols", "Mais de 9.5 gols",
    "Menos de 0.5 gols", "Menos de 1.5 gols", "Menos de 10.5 gols", "Menos de 2.5 gols", "Menos de 3.5 gols", "Menos de 4.5 gols", "Menos de 5.5 gols", "Menos de 6.5 gols", "Menos de 7.5 gols", "Menos de 8.5 gols", "Menos de 9.5 gols",
    "Vôlei - 0x3", "Vôlei - 1x3", "Vôlei - 2x3", "Vôlei - 3 Sets", "Vôlei - 3x0", "Vôlei - 3x1", "Vôlei - 3x2", "Vôlei - 4 Sets", "Vôlei - 5 Sets", "Vôlei - Casa", "Vôlei - Fora",
    "Vôlei - Handicap -1.5 Casa", "Vôlei - Handicap -1.5 Fora", "Vôlei - Handicap -2.5 Casa", "Vôlei - Handicap -2.5 Fora",
    "Vôlei - Handicap +1.5 Casa", "Vôlei - Handicap +1.5 Fora", "Vôlei - Handicap +2.5 Casa", "Vôlei - Handicap +2.5 Fora",
    "Vôlei - Mais Pontos", "Vôlei - Menos Pontos", "Vôlei - Personalizada",
    "Vôlei - Vencedor 1º Set Casa", "Vôlei - Vencedor 1º Set Fora",
    "Vôlei - Vencedor 2º Set Casa", "Vôlei - Vencedor 2º Set Fora",
    "Vôlei - Vencedor 3º Set Casa", "Vôlei - Vencedor 3º Set Fora",
    "Vôlei - Vencedor 4º Set Casa", "Vôlei - Vencedor 4º Set Fora",
    "Vôlei - Vencedor 5º Set Casa", "Vôlei - Vencedor 5º Set Fora"
  ].map((name, i) => {
    let sportSlug = 'futebol';
    if (name.startsWith('Basket -')) sportSlug = 'basquete';
    if (name.startsWith('Vôlei -')) sportSlug = 'volei';
    return { id: `mx${i + 1}`, sportSlug, name };
  })
]


const loadMarkets = (): Market[] => {
  try {
    const stored = localStorage.getItem(MARKETS_KEY)
    const storedMarkets: Market[] = stored ? JSON.parse(stored) : []
    
    // Sincronização automática: Adiciona itens padrões que não existem na lista atual
    const existingNames = new Set(storedMarkets.map(m => m.name.toLowerCase()))
    
    const missingDefaults = DEFAULT_MARKETS.filter(dm => !existingNames.has(dm.name.toLowerCase()))
    
    if (missingDefaults.length > 0) {
      const merged = [...storedMarkets, ...missingDefaults]
      localStorage.setItem(MARKETS_KEY, JSON.stringify(merged))
      return merged
    }

    if (!stored) {
      localStorage.setItem(MARKETS_KEY, JSON.stringify(DEFAULT_MARKETS))
      return DEFAULT_MARKETS
    }
    
    return storedMarkets
  } catch { return DEFAULT_MARKETS }
}

const placeholders = [
  { title: 'Categorias', desc: 'Categorias e tags de dicas'      },
]

const emptyForm = {
  name: '', email: '', phone: '', username: '', password: '', confirmPassword: '', 
  role: 'MEMBRO', plan: 'STARTER', currency: 'BRL'
}

export const AdminCadastrosPage = () => {
  const { user: me } = useAuth()
  const isReadOnly = me?.role === 'TESTER'
  const [userCount,    setUserCount]    = useState<number | null>(null)
  const [modalOpen,    setModalOpen]    = useState(false)
  const [sportsOpen,   setSportsOpen]   = useState(false)
  const [sports,       setSports]       = useState<Sport[]>(() => loadSports())
  const [leagues,       setLeagues]       = useState<League[]>(() => loadLeagues())
  const [leaguesOpen,   setLeaguesOpen]   = useState(false)
  const [teamsOpen,     setTeamsOpen]     = useState(false)
  const [bookmakers,    setBookmakers]    = useState<Bookmaker[]>(() => loadBookmakers())
  const [bookmakersOpen,setBookmakersOpen]= useState(false)
  const [markets,       setMarkets]       = useState<Market[]>(() => loadMarkets())
  const [marketsOpen,   setMarketsOpen]   = useState(false)
  const [form,       setForm]       = useState(emptyForm)
  const [showPass,   setShowPass]   = useState(false)
  const [loading,    setLoading]    = useState(false)

  const saveSports = (updated: Sport[]) => {
    setSports(updated)
    localStorage.setItem(SPORTS_KEY, JSON.stringify(updated))
    if (me) addLog({ userEmail: me.email, userName: me.name, userRole: me.role, category: 'Admin', action: 'Esportes atualizados', detail: `${updated.length} esportes na lista` })
  }

  const saveLeagues = (updated: League[]) => {
    setLeagues(updated)
    localStorage.setItem(LEAGUES_KEY, JSON.stringify(updated))
    if (me) addLog({ userEmail: me.email, userName: me.name, userRole: me.role, category: 'Admin', action: 'Ligas atualizadas', detail: `${updated.length} ligas na lista` })
  }

  const saveBookmakers = (updated: Bookmaker[]) => {
    setBookmakers(updated)
    localStorage.setItem(BOOKMAKERS_KEY, JSON.stringify(updated))
    if (me) addLog({ userEmail: me.email, userName: me.name, userRole: me.role, category: 'Admin', action: 'Casas de apostas atualizadas', detail: `${updated.length} casas na lista` })
  }

  const saveMarkets = (updated: Market[]) => {
    setMarkets(updated)
    localStorage.setItem(MARKETS_KEY, JSON.stringify(updated))
    if (me) addLog({ userEmail: me.email, userName: me.name, userRole: me.role, category: 'Admin', action: 'Mercados atualizados', detail: `${updated.length} mercados na lista` })
  }

  // Carrega contagem de usuários
  const loadCount = () => {
    usersService.getAll()
      .then(users => setUserCount(users.length))
      .catch(() => setUserCount(0))
  }

  useEffect(() => { loadCount() }, [])

  const set = (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }))

  const openModal = () => { if (isReadOnly) return; setForm(emptyForm); setShowPass(false); setModalOpen(true) }
  const closeModal = () => setModalOpen(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!form.name || !form.email || !form.username || !form.password) {
      toast.error('Preencha todos os campos obrigatórios.')
      return
    }
    if (form.password.length < 6) {
      toast.error('Senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (form.password !== form.confirmPassword) {
      toast.error('As senhas não conferem.')
      return
    }

    setLoading(true)
    try {
      // Registra o usuário via endpoint de admin
      await api.post('/auth/register', {
        name:     form.name,
        email:    form.email,
        phone:    form.phone,
        username: form.username,
        password: form.password,
        plan:     form.plan,
        currency: form.currency,
      })

      // Se role não for MEMBRO, atualiza após criar
      // (precisamos buscar o id do usuário criado)
      if (form.role !== 'MEMBRO') {
        const users = await usersService.getAll()
        const created = users.find((u: { email: string }) => u.email === form.email)
        if (created) {
          await usersService.updateRole(created.id, form.role)
        }
      }

      toast.success(`Usuário "${form.name}" cadastrado com sucesso! 🎉`)
      if (me) addLog({ userEmail: me.email, userName: me.name, userRole: me.role, category: 'Usuários', action: 'Usuário cadastrado', detail: `${form.name} (${form.email}) · Role: ${form.role}` })
      closeModal()
      loadCount()
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Erro ao cadastrar usuário.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-display font-semibold text-white">{'Cadastros'}</h2>
        <p className="text-xs text-slate-500 mt-0.5">{'Gerenciamento de tabelas base do sistema'}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

        {/* ── Card USUÁRIOS — funcional ── */}
        <div
          onClick={openModal}
          className={`card p-5 border border-surface-400 transition-all duration-200 group ${isReadOnly ? 'opacity-75 cursor-default' : 'hover:border-green-600/60 hover:shadow-green-glow cursor-pointer'}`}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-green-900/50 flex items-center justify-center group-hover:bg-green-800/60 transition-colors">
              <Users size={16} className="text-green-400" />
            </div>
            <span className="text-xs bg-green-900/40 text-green-400 px-2 py-0.5 rounded-full border border-green-800/50">
              {'Ativo'}
            </span>
          </div>
          <h3 className="font-semibold text-white text-sm">{'Usuários'}</h3>
          <p className="text-xs text-slate-500 mt-1">Cadastro e gestão de usuários do sistema</p>
          <div className="mt-4 pt-3 border-t border-surface-300 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {userCount === null ? '...' : `${userCount} ${userCount === 1 ? 'usuário' : 'usuários'}`}
            </span>
            {!isReadOnly && (
              <span className="text-xs text-green-400 border border-green-800/50 bg-green-900/30 px-2.5 py-1 rounded group-hover:bg-green-800/50 transition-colors">
                {'+ Novo usuário'}
              </span>
            )}
          </div>
        </div>

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

      {/* ── Modal cadastro de usuário ── */}
      <Modal isOpen={modalOpen} onClose={closeModal} title="Cadastrar Novo Usuário" size="md">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            {/* Nome */}
            <div className="col-span-2">
              <label className="label">Nome completo *</label>
              <input
                className="input-field"
                placeholder="Nome completo"
                value={form.name}
                onChange={set('name')}
                required
              />
            </div>

            {/* Username + Telefone */}
            <div>
              <label className="label">Usuário *</label>
              <input
                className="input-field"
                placeholder="username"
                value={form.username}
                onChange={set('username')}
                required
              />
            </div>
            <div>
              <label className="label">Telefone</label>
              <input
                className="input-field"
                placeholder="(11) 99999-9999"
                value={form.phone}
                onChange={set('phone')}
              />
            </div>

            {/* Email */}
            <div className="col-span-2">
              <label className="label">Email *</label>
              <input
                type="email"
                className="input-field"
                placeholder="email@exemplo.com"
                value={form.email}
                onChange={set('email')}
                required
              />
            </div>

            {/* Senha */}
            <div>
              <label className="label">Senha *</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input-field pr-10"
                  placeholder="Mín. 6 caracteres"
                  value={form.password}
                  onChange={set('password')}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Confirmar senha */}
            <div>
              <label className="label">Confirmar senha *</label>
              <input
                type={showPass ? 'text' : 'password'}
                className="input-field"
                placeholder="Repita a senha"
                value={form.confirmPassword}
                onChange={set('confirmPassword')}
                required
              />
            </div>

            {/* Role */}
            <div>
              <label className="label">Tipo de conta</label>
              <select className="input-field" value={form.role} onChange={set('role')}>
                <option value="MEMBRO">Membro</option>
                <option value="ADMIN">Admin</option>
                <option value="MASTER">Master</option>
              </select>
            </div>

            {/* Plano */}
            <div>
              <label className="label">Plano</label>
              <select className="input-field" value={form.plan} onChange={set('plan')}>
                <option value="STARTER">Starter</option>
                <option value="STANDARD">Standard</option>
                <option value="PRO">Pro</option>
              </select>
            </div>


          </div>

          {/* Info */}
          <div className="bg-surface-300/60 border border-surface-400 rounded-lg px-4 py-3 text-xs text-slate-400">
            🔒 O usuário receberá acesso imediato com as permissões do tipo de conta selecionado.
          </div>

          {/* Ações */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={closeModal} className="btn-secondary flex-1">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {loading
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Cadastrando...</>
                : '✓ Cadastrar usuário'
              }
            </button>
          </div>
        </form>
      </Modal>

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
