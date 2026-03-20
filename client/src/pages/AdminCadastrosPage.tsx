import { useEffect, useState, FormEvent } from 'react'
import { ClipboardList, Users, Eye, EyeOff, Dumbbell, Trophy, Shield, Star } from 'lucide-react'
import { Modal } from '../components/ui/Modal'
import { SportsModal, Sport } from '../components/ui/SportsModal'
import { LeaguesModal, League, DEFAULT_LEAGUES } from '../components/ui/LeaguesModal'
import { TeamsModal } from '../components/ui/TeamsModal'
import { BookmakersModal, Bookmaker, DEFAULT_BOOKMAKERS } from '../components/ui/BookmakersModal'
import { usersService } from '../services/users.service'
import { useAuth } from '../contexts/AuthContext'
import { addLog } from './SystemLogPage'
import api from '../services/api'
import toast from 'react-hot-toast'
const SPORTS_KEY     = 'fgb_sports'
const LEAGUES_KEY    = 'fgb_leagues'
const BOOKMAKERS_KEY = 'fgb_bookmakers'

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

const placeholders = [
  { title: 'Mercados',   desc: 'Mercados de apostas disponíveis' },
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

    </div>
  )
}
