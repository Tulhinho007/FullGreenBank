import { useState, useMemo } from 'react'
import {
  X, Search, ChevronDown, ChevronRight, Star, Trophy,
  Plus, Trash2, Pencil, RotateCcw, FolderPlus, Check, AlertTriangle,
} from 'lucide-react'

// ── Tipos ─────────────────────────────────────────────────────────────────────
export interface League { id: string; name: string; category: string; featured?: boolean }

interface LeaguesModalProps {
  isOpen: boolean; onClose: () => void
  leagues: League[]; onSave: (leagues: League[]) => void
}

type ActionType = 'addLeague' | 'addCategory' | 'removeLeague' | 'removeCategory' | 'editLeague' | null

interface HistoryEntry { leagues: League[]; description: string }

// ── Defaults ──────────────────────────────────────────────────────────────────
export const DEFAULT_LEAGUES: League[] = [
  { id:'l001', name:'UEFA - Champions League',           category:'Elite Global',           featured:true },
  { id:'l002', name:'Inglaterra - Premier League',       category:'Elite Global',           featured:true },
  { id:'l003', name:'Espanha - La Liga',                 category:'Elite Global',           featured:true },
  { id:'l004', name:'Brasil - Brasileirão Série A',      category:'Elite Global',           featured:true },
  { id:'l005', name:'Itália - Serie A',                  category:'Elite Global',           featured:true },
  { id:'l006', name:'Alemanha - Bundesliga 1',           category:'Elite Global',           featured:true },
  { id:'l007', name:'França - Ligue 1',                  category:'Elite Global',           featured:true },
  { id:'l008', name:'UEFA - Liga Europa',                category:'Elite Global',           featured:true },
  { id:'l009', name:'Conmebol - Copa Libertadores',      category:'Elite Global',           featured:true },
  { id:'l010', name:'Portugal - Liga Portugal',          category:'Alto Nível e Copas' },
  { id:'l011', name:'Países Baixos - Eredivisie',        category:'Alto Nível e Copas' },
  { id:'l012', name:'Brasil - Copa do Brasil',           category:'Alto Nível e Copas' },
  { id:'l013', name:'EUA - MLS',                         category:'Alto Nível e Copas' },
  { id:'l014', name:'Inglaterra - Championship',         category:'Alto Nível e Copas' },
  { id:'l015', name:'Espanha - La Liga 2',               category:'Alto Nível e Copas' },
  { id:'l016', name:'Conmebol - Copa Sul-Americana',     category:'Alto Nível e Copas' },
  { id:'l017', name:'Arábia Saudita - Saudi Pro League', category:'Alto Nível e Copas' },
  { id:'l018', name:'UEFA - Conference League',          category:'Alto Nível e Copas' },
  { id:'l019', name:'Turquia - Super Lig',               category:'Ligas Consolidadas' },
  { id:'l020', name:'Grécia - Superliga',                category:'Ligas Consolidadas' },
  { id:'l021', name:'Escócia - Premiership',             category:'Ligas Consolidadas' },
  { id:'l022', name:'Bélgica - Liga Jupiler',            category:'Ligas Consolidadas' },
  { id:'l023', name:'Brasil - Brasileirão Série B',      category:'Ligas Consolidadas' },
  { id:'l024', name:'Argentina - Liga Profissional',     category:'Ligas Consolidadas' },
  { id:'l025', name:'México - Liga MX',                  category:'Ligas Consolidadas' },
  { id:'l026', name:'Japão - Liga J1',                   category:'Ligas Consolidadas' },
  { id:'l027', name:'Alemanha - Bundesliga 2',           category:'Ligas Consolidadas' },
  { id:'l028', name:'Itália - Serie B',                  category:'Ligas Consolidadas' },
  { id:'l029', name:'Brasil - Campeonatos Regionais',    category:'Desenvolvimento e Copas' },
  { id:'l030', name:'Argentina - Copa da Liga Profissional', category:'Desenvolvimento e Copas' },
  { id:'l031', name:'Colômbia - Primeira A',             category:'Desenvolvimento e Copas' },
  { id:'l032', name:'Chile - Primeira Divisão',          category:'Desenvolvimento e Copas' },
  { id:'l033', name:'Equador - Liga Pro',                category:'Desenvolvimento e Copas' },
  { id:'l034', name:'Uruguai - Primera División',        category:'Desenvolvimento e Copas' },
  { id:'l035', name:'Paraguai - Primera División',       category:'Desenvolvimento e Copas' },
  { id:'l036', name:'Suíça - Superliga',                 category:'Desenvolvimento e Copas' },
  { id:'l037', name:'Áustria - Bundesliga',              category:'Desenvolvimento e Copas' },
  { id:'l038', name:'Dinamarca - Superliga',             category:'Desenvolvimento e Copas' },
  { id:'l039', name:'Noruega - Eliteserien',             category:'Desenvolvimento e Copas' },
  { id:'l040', name:'Suécia - Allsvenskan',              category:'Desenvolvimento e Copas' },
  { id:'l041', name:'FIFA - Copa do Mundo',              category:'Torneios de Seleções' },
  { id:'l042', name:'UEFA - Eurocopa',                   category:'Torneios de Seleções' },
  { id:'l043', name:'Conmebol - Copa América',           category:'Torneios de Seleções' },
  { id:'l044', name:'Eliminatórias - América do Sul',    category:'Torneios de Seleções' },
  { id:'l045', name:'Eliminatórias - Europa',            category:'Torneios de Seleções' },
  { id:'l046', name:'UEFA - Liga das Nações',            category:'Torneios de Seleções' },
  { id:'l047', name:'Concacaf - Liga das Nações',        category:'Torneios de Seleções' },
  { id:'l048', name:'China - Super Liga',                category:'Ligas Emergentes' },
  { id:'l049', name:'Ucrânia - Premier League',          category:'Ligas Emergentes' },
  { id:'l050', name:"Israel - Ligat ha'Al",              category:'Ligas Emergentes' },
  { id:'l051', name:'República Tcheca - Fortune Liga',   category:'Ligas Emergentes' },
  { id:'l052', name:'Bulgária - Parva Liga',             category:'Ligas Emergentes' },
  { id:'l053', name:'Romênia - Liga 1',                  category:'Ligas Emergentes' },
  { id:'l054', name:'Sérvia - Superliga',                category:'Ligas Emergentes' },
  { id:'l055', name:'Geórgia - Erovnuli Liga',           category:'Ligas Emergentes' },
  { id:'l056', name:'Brasil - Série C',                  category:'Ligas Emergentes' },
  { id:'l057', name:'Brasil - Série D',                  category:'Ligas Emergentes' },
  { id:'l058', name:'FIFA - Copa do Mundo Feminina',     category:'Feminino e Base' },
  { id:'l059', name:'UEFA - Champions League Feminina',  category:'Feminino e Base' },
  { id:'l060', name:'Brasil - Brasileirão Feminino',     category:'Feminino e Base' },
  { id:'l061', name:'Inglaterra - Superliga Feminina',   category:'Feminino e Base' },
  { id:'l062', name:'FIFA - Copa do Mundo Sub-20',       category:'Feminino e Base' },
  { id:'l063', name:'Basket - NBA',                      category:'Outros Esportes' },
  { id:'l064', name:'Basket - Euroliga',                 category:'Outros Esportes' },
  { id:'l065', name:'Basket - NBB',                      category:'Outros Esportes' },
  { id:'l066', name:'Vôlei - Superliga',                 category:'Outros Esportes' },
  { id:'l067', name:'Vôlei - Campeonato Mundial',        category:'Outros Esportes' },
]

const CAT_ICONS: Record<string, string> = {
  'Elite Global':'⭐','Alto Nível e Copas':'🏆','Ligas Consolidadas':'🌍',
  'Desenvolvimento e Copas':'📈','Torneios de Seleções':'🌐',
  'Ligas Emergentes':'🚀','Feminino e Base':'👩','Outros Esportes':'🎯',
}

// ── Confirm popup reutilizável ────────────────────────────────────────────────
const ConfirmPopup = ({ title, message, confirmLabel='Confirmar', variant='danger', onConfirm, onCancel }:{
  title:string; message:string; confirmLabel?:string
  variant?:'danger'|'success'; onConfirm:()=>void; onCancel:()=>void
}) => (
  <>
    <div className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm" onClick={onCancel}/>
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 pointer-events-none">
      <div className="w-full max-w-sm pointer-events-auto bg-white dark:bg-surface-200 rounded-2xl border border-slate-200 dark:border-surface-400 shadow-2xl p-6">
        <div className={`w-11 h-11 rounded-full flex items-center justify-center mx-auto mb-4 ${variant==='danger'?'bg-red-100 dark:bg-red-900/30':'bg-green-100 dark:bg-green-900/30'}`}>
          <AlertTriangle size={20} className={variant==='danger'?'text-red-500':'text-green-500'}/>
        </div>
        <h3 className="text-sm font-semibold text-slate-800 dark:text-white text-center mb-1">{title}</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center mb-5 leading-relaxed">{message}</p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-surface-400 text-slate-600 dark:text-slate-300 text-xs font-medium hover:bg-slate-50 dark:hover:bg-surface-300 transition-colors">Cancelar</button>
          <button onClick={onConfirm} className={`flex-1 py-2 rounded-xl text-white text-xs font-semibold transition-colors ${variant==='danger'?'bg-red-500 hover:bg-red-600':'bg-green-600 hover:bg-green-500'}`}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  </>
)

// ── Action buttons row ────────────────────────────────────────────────────────
const ActionBtn = ({ icon, label, color, onClick }: { icon:React.ReactNode; label:string; color:string; onClick:()=>void }) => (
  <button onClick={onClick} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all duration-150 active:scale-95 ${color}`}>
    {icon}{label}
  </button>
)

// ── Main Modal ────────────────────────────────────────────────────────────────
export const LeaguesModal = ({ isOpen, onClose, leagues, onSave }: LeaguesModalProps) => {
  // ── All hooks first ──
  const [search,     setSearch]     = useState('')
  const [openCats,   setOpenCats]   = useState<Set<string>>(new Set(['Elite Global']))
  const [showAll,    setShowAll]    = useState(false)
  const [action,     setAction]     = useState<ActionType>(null)
  const [history,    setHistory]    = useState<HistoryEntry[]>([])
  const [confirm,    setConfirm]    = useState<{title:string;message:string;variant:'danger'|'success';fn:()=>void}|null>(null)
  const [undoPrompt, setUndoPrompt] = useState(false)

  // Form states
  const [newLeagueName,  setNewLeagueName]  = useState('')
  const [newLeagueCat,   setNewLeagueCat]   = useState('')
  const [newCatName,     setNewCatName]     = useState('')
  const [selLeague,      setSelLeague]      = useState('')
  const [selCategory,    setSelCategory]    = useState('')
  const [editLeagueId,   setEditLeagueId]   = useState('')
  const [editLeagueName, setEditLeagueName] = useState('')
  const [editLeagueCat,  setEditLeagueCat]  = useState('')

  const categories  = useMemo(() => [...new Set(leagues.map(l => l.category))], [leagues])

  const [extraCategories, setExtraCategories] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('fgb_extra_cats') || '[]') } catch { return [] }
  })

  const allCategories = useMemo(() =>
    [...new Set([...categories, ...extraCategories])],
    [categories, extraCategories]
  )

  const grouped     = useMemo(() => {
    const map: Record<string,League[]> = {}
    leagues.forEach(l => { if(!map[l.category]) map[l.category]=[]; map[l.category].push(l) })
    return map
  }, [leagues])
  const featured    = useMemo(() => leagues.filter(l => l.featured), [leagues])
  const searchResults = useMemo(() =>
    search.trim().length > 1 ? leagues.filter(l => l.name.toLowerCase().includes(search.toLowerCase())) : [],
    [search, leagues]
  )
  const visibleCats = useMemo(() => {
    // Combina ícones padrão + todas as categorias (com ou sem ligas)
    const all = [...new Set([...Object.keys(CAT_ICONS), ...allCategories])]
    return showAll ? all : all.slice(0, 3)
  }, [showAll, allCategories])

  if (!isOpen) return null

  // ── Helpers ──
  const toggleCat = (c:string) => setOpenCats(p => { const n=new Set(p); n.has(c)?n.delete(c):n.add(c); return n })
  const closeAction = () => { setAction(null); setNewLeagueName(''); setNewCatName(''); setSelLeague(''); setSelCategory(''); setEditLeagueId(''); setEditLeagueName(''); setEditLeagueCat('') }

  const pushHistory = (desc: string, prev: League[]) => {
    setHistory(h => [{ leagues: prev, description: desc }, ...h].slice(0, 20))
  }

  const commit = (updated: League[], desc: string) => {
    pushHistory(desc, leagues)
    onSave(updated)
    closeAction()
  }

  // ── Actions ──
  const doAddLeague = () => {
    if (!newLeagueName.trim() || !newLeagueCat) return
    setConfirm({
      title: 'Adicionar liga', variant: 'success',
      message: `Adicionar "${newLeagueName.trim()}" na categoria "${newLeagueCat}"?`,
      confirmLabel: '✓ Adicionar',
      fn: () => {
        commit([...leagues, { id: crypto.randomUUID(), name: newLeagueName.trim(), category: newLeagueCat }],
          `Liga "${newLeagueName.trim()}" adicionada`)
        setConfirm(null)
      }
    })
  }

  const doAddCategory = () => {
    if (!newCatName.trim()) return
    if (allCategories.includes(newCatName.trim())) { alert('Categoria já existe!'); return }
    setConfirm({
      title: 'Adicionar categoria', variant: 'success',
      message: `Criar a categoria "${newCatName.trim()}"?`,
      confirmLabel: '✓ Criar',
      fn: () => {
        const updated = [...extraCategories, newCatName.trim()]
        setExtraCategories(updated)
        localStorage.setItem('fgb_extra_cats', JSON.stringify(updated))
        pushHistory(`Categoria "${newCatName.trim()}" criada`, leagues)
        setOpenCats(p => new Set([...p, newCatName.trim()]))
        closeAction()
        setConfirm(null)
      }
    })
  }

  const doRemoveLeague = () => {
    const league = leagues.find(l => l.id === selLeague)
    if (!league) return
    setConfirm({
      title: 'Remover liga', variant: 'danger',
      message: `Remover "${league.name}" permanentemente?`,
      confirmLabel: 'Remover',
      fn: () => {
        commit(leagues.filter(l => l.id !== selLeague), `Liga "${league.name}" removida`)
        setConfirm(null)
      }
    })
  }

  const doRemoveCategory = () => {
    if (!selCategory) return
    const count = leagues.filter(l => l.category === selCategory).length
    setConfirm({
      title: 'Remover categoria', variant: 'danger',
      message: `Remover a categoria "${selCategory}" e todas as ${count} ligas dela?`,
      confirmLabel: 'Remover tudo',
      fn: () => {
        // Remove from extraCategories if it's there
        const updatedExtra = extraCategories.filter(c => c !== selCategory)
        setExtraCategories(updatedExtra)
        localStorage.setItem('fgb_extra_cats', JSON.stringify(updatedExtra))
        commit(leagues.filter(l => l.category !== selCategory), `Categoria "${selCategory}" removida`)
        setConfirm(null)
      }
    })
  }

  const doEditLeague = () => {
    if (!editLeagueId || !editLeagueName.trim() || !editLeagueCat) return
    const orig = leagues.find(l => l.id === editLeagueId)
    setConfirm({
      title: 'Salvar alteração', variant: 'success',
      message: `Alterar "${orig?.name}" para "${editLeagueName.trim()}" na categoria "${editLeagueCat}"?`,
      confirmLabel: 'Salvar',
      fn: () => {
        commit(leagues.map(l => l.id === editLeagueId ? { ...l, name: editLeagueName.trim(), category: editLeagueCat } : l),
          `Liga "${orig?.name}" editada`)
        setConfirm(null)
      }
    })
  }

  const doUndo = () => {
    if (!history.length) return
    const prev = history[0]
    onSave(prev.leagues)
    setHistory(h => h.slice(1))
    setUndoPrompt(false)
  }

  const selectLeagueForEdit = (id: string) => {
    const l = leagues.find(x => x.id === id)
    if (l) { setEditLeagueName(l.name); setEditLeagueCat(l.category) }
    setEditLeagueId(id)
  }

  // ── Render sub-panel ──
  const renderPanel = () => {
    if (!action) return null
    const panelClass = "mt-3 bg-slate-50 dark:bg-surface-300/50 border border-slate-200 dark:border-surface-400 rounded-xl p-4"

    if (action === 'addLeague') return (
      <div className={panelClass}>
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-3 flex items-center gap-1.5"><Plus size={13}/>Nova Liga</p>
        <div className="flex flex-col gap-2">
          <input value={newLeagueName} onChange={e=>setNewLeagueName(e.target.value)} placeholder="Nome da liga..." autoFocus
            className="text-sm bg-white dark:bg-surface-200 border border-slate-200 dark:border-surface-400 rounded-lg px-3 py-2 text-slate-800 dark:text-white outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"/>
          <select value={newLeagueCat} onChange={e=>setNewLeagueCat(e.target.value)}
            className="text-sm bg-white dark:bg-surface-200 border border-slate-200 dark:border-surface-400 rounded-lg px-3 py-2 text-slate-800 dark:text-white outline-none focus:border-green-500 transition-all">
            <option value="">Selecione a categoria...</option>
            {allCategories.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
          <div className="flex gap-2 mt-1">
            <button onClick={closeAction} className="flex-1 py-1.5 rounded-lg border border-slate-200 dark:border-surface-400 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-surface-300 transition-colors">Cancelar</button>
            <button onClick={doAddLeague} disabled={!newLeagueName.trim()||!newLeagueCat} className="flex-1 py-1.5 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white text-xs font-semibold transition-colors">Salvar</button>
          </div>
        </div>
      </div>
    )

    if (action === 'addCategory') return (
      <div className={panelClass}>
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-3 flex items-center gap-1.5"><FolderPlus size={13}/>Nova Categoria</p>
        <input value={newCatName} onChange={e=>setNewCatName(e.target.value)} placeholder="Nome da categoria..." autoFocus
          className="w-full text-sm bg-white dark:bg-surface-200 border border-slate-200 dark:border-surface-400 rounded-lg px-3 py-2 text-slate-800 dark:text-white outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all mb-2"/>
        <div className="flex gap-2">
          <button onClick={closeAction} className="flex-1 py-1.5 rounded-lg border border-slate-200 dark:border-surface-400 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-surface-300 transition-colors">Cancelar</button>
          <button onClick={doAddCategory} disabled={!newCatName.trim()} className="flex-1 py-1.5 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white text-xs font-semibold transition-colors">Salvar</button>
        </div>
      </div>
    )

    if (action === 'removeLeague') return (
      <div className={panelClass}>
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-3 flex items-center gap-1.5"><Trash2 size={13} className="text-red-400"/>Remover Liga</p>
        <select value={selLeague} onChange={e=>setSelLeague(e.target.value)}
          className="w-full text-sm bg-white dark:bg-surface-200 border border-slate-200 dark:border-surface-400 rounded-lg px-3 py-2 text-slate-800 dark:text-white outline-none focus:border-red-400 transition-all mb-2">
          <option value="">Selecione a liga...</option>
          {allCategories.map(cat=>(
            <optgroup key={cat} label={cat}>
              {(grouped[cat]||[]).map(l=><option key={l.id} value={l.id}>{l.name}</option>)}
            </optgroup>
          ))}
        </select>
        <div className="flex gap-2">
          <button onClick={closeAction} className="flex-1 py-1.5 rounded-lg border border-slate-200 dark:border-surface-400 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-surface-300 transition-colors">Cancelar</button>
          <button onClick={doRemoveLeague} disabled={!selLeague} className="flex-1 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white text-xs font-semibold transition-colors">Remover</button>
        </div>
      </div>
    )

    if (action === 'removeCategory') return (
      <div className={panelClass}>
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-3 flex items-center gap-1.5"><Trash2 size={13} className="text-red-400"/>Remover Categoria</p>
        <select value={selCategory} onChange={e=>setSelCategory(e.target.value)}
          className="w-full text-sm bg-white dark:bg-surface-200 border border-slate-200 dark:border-surface-400 rounded-lg px-3 py-2 text-slate-800 dark:text-white outline-none focus:border-red-400 transition-all mb-1">
          <option value="">Selecione a categoria...</option>
          {allCategories.map(c=><option key={c} value={c}>{c} ({(grouped[c]||[]).length} ligas)</option>)}
        </select>
        {selCategory && <p className="text-[11px] text-red-400 mb-2">⚠ Todas as {(grouped[selCategory]||[]).length} ligas desta categoria serão removidas.</p>}
        <div className="flex gap-2">
          <button onClick={closeAction} className="flex-1 py-1.5 rounded-lg border border-slate-200 dark:border-surface-400 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-surface-300 transition-colors">Cancelar</button>
          <button onClick={doRemoveCategory} disabled={!selCategory} className="flex-1 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white text-xs font-semibold transition-colors">Remover</button>
        </div>
      </div>
    )

    if (action === 'editLeague') return (
      <div className={panelClass}>
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-3 flex items-center gap-1.5"><Pencil size={13} className="text-blue-400"/>Editar Liga</p>
        <div className="flex flex-col gap-2">
          <select value={editLeagueId} onChange={e=>selectLeagueForEdit(e.target.value)}
            className="text-sm bg-white dark:bg-surface-200 border border-slate-200 dark:border-surface-400 rounded-lg px-3 py-2 text-slate-800 dark:text-white outline-none focus:border-blue-400 transition-all">
            <option value="">Selecione a liga...</option>
            {allCategories.map(cat=>(
              <optgroup key={cat} label={cat}>
                {(grouped[cat]||[]).map(l=><option key={l.id} value={l.id}>{l.name}</option>)}
              </optgroup>
            ))}
          </select>
          {editLeagueId && <>
            <input value={editLeagueName} onChange={e=>setEditLeagueName(e.target.value)} placeholder="Novo nome..."
              className="text-sm bg-white dark:bg-surface-200 border border-slate-200 dark:border-surface-400 rounded-lg px-3 py-2 text-slate-800 dark:text-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all"/>
            <select value={editLeagueCat} onChange={e=>setEditLeagueCat(e.target.value)}
              className="text-sm bg-white dark:bg-surface-200 border border-slate-200 dark:border-surface-400 rounded-lg px-3 py-2 text-slate-800 dark:text-white outline-none focus:border-blue-400 transition-all">
              <option value="">Categoria...</option>
              {allCategories.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          </>}
          <div className="flex gap-2 mt-1">
            <button onClick={closeAction} className="flex-1 py-1.5 rounded-lg border border-slate-200 dark:border-surface-400 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-surface-300 transition-colors">Cancelar</button>
            <button onClick={doEditLeague} disabled={!editLeagueId||!editLeagueName.trim()||!editLeagueCat}
              className="flex-1 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white text-xs font-semibold transition-colors">Salvar alteração</button>
          </div>
        </div>
      </div>
    )

    return null
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose}/>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="w-full max-w-xl pointer-events-auto bg-white dark:bg-surface-200 rounded-2xl border border-slate-200 dark:border-surface-400 shadow-2xl flex flex-col"
          style={{maxHeight:'90vh'}} onClick={e=>e.stopPropagation()}>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-surface-300 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                <Trophy size={15} className="text-green-600 dark:text-green-400"/>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-800 dark:text-white">Ligas / Campeonatos</h2>
                <p className="text-[11px] text-slate-400">{leagues.length} ligas · {allCategories.length} categorias</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {history.length > 0 && (
                <button onClick={()=>setUndoPrompt(true)}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-amber-500 border border-slate-200 dark:border-surface-400 hover:border-amber-400 px-2 py-1 rounded-lg transition-colors"
                  title="Desfazer última alteração">
                  <RotateCcw size={11}/> Desfazer
                </button>
              )}
              <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-surface-300 transition-colors">
                <X size={15}/>
              </button>
            </div>
          </div>

          {/* Search + Actions */}
          <div className="px-5 py-3 border-b border-slate-100 dark:border-surface-300 shrink-0">
            <div className="relative mb-3">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar liga ou campeonato..."
                className="w-full text-sm bg-slate-50 dark:bg-surface-300 border border-slate-200 dark:border-surface-400 rounded-xl pl-9 pr-4 py-2 text-slate-800 dark:text-white placeholder-slate-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"/>
              {search && <button onClick={()=>setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X size={12}/></button>}
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-1.5">
              <ActionBtn icon={<Plus size={12}/>}       label="Liga"       onClick={()=>setAction(a=>a==='addLeague'?null:'addLeague')}
                color={action==='addLeague'?'bg-green-600 border-green-600 text-white':'border-green-300 dark:border-green-700 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'}/>
              <ActionBtn icon={<FolderPlus size={12}/>} label="Categoria"  onClick={()=>setAction(a=>a==='addCategory'?null:'addCategory')}
                color={action==='addCategory'?'bg-green-600 border-green-600 text-white':'border-green-300 dark:border-green-700 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'}/>
              <ActionBtn icon={<Pencil size={12}/>}     label="Editar"     onClick={()=>setAction(a=>a==='editLeague'?null:'editLeague')}
                color={action==='editLeague'?'bg-blue-500 border-blue-500 text-white':'border-blue-300 dark:border-blue-700 text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'}/>
              <ActionBtn icon={<Trash2 size={12}/>}     label="Liga"       onClick={()=>setAction(a=>a==='removeLeague'?null:'removeLeague')}
                color={action==='removeLeague'?'bg-red-500 border-red-500 text-white':'border-red-300 dark:border-red-800 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'}/>
              <ActionBtn icon={<Trash2 size={12}/>}     label="Categoria"  onClick={()=>setAction(a=>a==='removeCategory'?null:'removeCategory')}
                color={action==='removeCategory'?'bg-red-500 border-red-500 text-white':'border-red-300 dark:border-red-800 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'}/>
            </div>

            {/* Sub-panel */}
            {renderPanel()}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {search.trim().length > 1 ? (
              <div className="p-3">
                {searchResults.length === 0
                  ? <p className="text-sm text-slate-400 text-center py-6">Nenhuma liga encontrada para "{search}"</p>
                  : searchResults.map(l=>(
                    <div key={l.id} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-surface-300/30 transition-colors">
                      <span className="flex-1 text-xs text-slate-700 dark:text-slate-200">{l.name}</span>
                      <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-surface-300 px-2 py-0.5 rounded">{l.category}</span>
                    </div>
                  ))
                }
              </div>
            ) : (
              <>
                {/* Featured */}
                <div className="px-4 pt-4 pb-2">
                  <div className="flex items-center gap-2 mb-3">
                    <Star size={13} className="text-yellow-500"/>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Principais Ligas</span>
                    <span className="text-[10px] bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 px-2 py-0.5 rounded-full border border-yellow-200 dark:border-yellow-800/50">Top {featured.length}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    {featured.map(l=>(
                      <div key={l.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/30">
                        <Star size={11} className="text-yellow-400 shrink-0"/>
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-200 flex-1">{l.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Categories */}
                <div className="px-4 pb-3">
                  <div className="border-t border-slate-100 dark:border-surface-300 pt-3 mb-2">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Todas as categorias</span>
                  </div>
                  {visibleCats.map(cat=>{
                    const items = grouped[cat]||[]
                    const catOpen = openCats.has(cat)
                    return (
                      <div key={cat} className="mb-1">
                        <button onClick={()=>toggleCat(cat)} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-surface-300/50 transition-colors">
                          <span className="text-base">{CAT_ICONS[cat]||'📋'}</span>
                          <span className="flex-1 text-left text-sm font-medium text-slate-700 dark:text-slate-200">{cat}</span>
                          <span className="text-[11px] text-slate-400 mr-1">{items.length}</span>
                          {catOpen?<ChevronDown size={13} className="text-slate-400"/>:<ChevronRight size={13} className="text-slate-400"/>}
                        </button>
                        {catOpen && (
                          <div className="ml-4 pl-3 border-l border-slate-100 dark:border-surface-300 mb-2">
                            {items.length === 0 ? (
                              <p className="text-xs text-slate-400 dark:text-slate-500 italic py-2 px-2">
                                Nenhuma liga nesta categoria ainda.
                              </p>
                            ) : items.map(l=>(
                              <div key={l.id} className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-surface-300/30 transition-colors">
                                <span className="flex-1 text-xs text-slate-700 dark:text-slate-200">{l.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                  <button onClick={()=>setShowAll(s=>!s)}
                    className="w-full mt-2 py-2 rounded-xl border border-slate-200 dark:border-surface-400 text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-surface-300 transition-colors flex items-center justify-center gap-1.5">
                    {showAll?<><ChevronDown size={13}/>Ver menos</>:<><ChevronRight size={13}/>Ver todas ({Math.max(0, [...new Set([...Object.keys(CAT_ICONS),...allCategories])].length - 3)} a mais)</>}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-slate-100 dark:border-surface-300 shrink-0">
            <button onClick={onClose} className="w-full py-2 rounded-xl bg-slate-100 dark:bg-surface-300 hover:bg-slate-200 dark:hover:bg-surface-400 text-slate-600 dark:text-slate-300 text-sm font-medium transition-colors">Fechar</button>
          </div>
        </div>
      </div>

      {/* Confirm popup */}
      {confirm && <ConfirmPopup title={confirm.title} message={confirm.message} variant={confirm.variant} confirmLabel={confirm.confirmLabel} onConfirm={confirm.fn} onCancel={()=>setConfirm(null)}/>}

      {/* Undo popup */}
      {undoPrompt && history.length > 0 && (
        <ConfirmPopup
          title="Desfazer alteração"
          message={`Desfazer: "${history[0].description}"? A lista voltará ao estado anterior.`}
          variant="danger" confirmLabel="Desfazer"
          onConfirm={doUndo} onCancel={()=>setUndoPrompt(false)}
        />
      )}
    </>
  )
}
