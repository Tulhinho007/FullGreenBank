import { useState, useEffect, useRef, useCallback } from 'react'
import {
  X, Search, Shield, Plus, Pencil, Trash2, ChevronDown,
  AlertTriangle, Loader2, Users,
} from 'lucide-react'
import { teamsService, Team } from '../../services/teams.service'

interface TeamsModalProps {
  isOpen: boolean
  onClose: () => void
  readOnly?: boolean
}

// ── Confirm popup ─────────────────────────────────────────────────────────────
const ConfirmPopup = ({ title, message, confirmLabel = 'Confirmar', variant = 'danger', onConfirm, onCancel }: {
  title: string; message: string; confirmLabel?: string
  variant?: 'danger' | 'success'; onConfirm: () => void; onCancel: () => void
}) => (
  <>
    <div className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm" onClick={onCancel} />
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 pointer-events-none">
      <div className="w-full max-w-sm pointer-events-auto bg-white dark:bg-surface-200 rounded-2xl border border-slate-200 dark:border-surface-400 shadow-2xl p-6">
        <div className={`w-11 h-11 rounded-full flex items-center justify-center mx-auto mb-4 ${variant === 'danger' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-green-100 dark:bg-green-900/30'}`}>
          <AlertTriangle size={20} className={variant === 'danger' ? 'text-red-500' : 'text-green-500'} />
        </div>
        <h3 className="text-sm font-semibold text-slate-800 dark:text-white text-center mb-1">{title}</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center mb-5 leading-relaxed">{message}</p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-surface-400 text-slate-600 dark:text-slate-300 text-xs font-medium hover:bg-slate-50 dark:hover:bg-surface-300 transition-colors">Cancelar</button>
          <button onClick={onConfirm} className={`flex-1 py-2 rounded-xl text-white text-xs font-semibold transition-colors ${variant === 'danger' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-600 hover:bg-green-500'}`}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  </>
)

// ── TeamSearchInput — busca + autocomplete dentro dos painéis ─────────────────
const TeamSearchInput = ({
  placeholder, groups, onSelect, extraTeams = [],
}: {
  placeholder: string
  groups: string[]
  onSelect: (team: Team) => void
  extraTeams?: Team[]
}) => {
  const [q,        setQ]        = useState('')
  const [grp,      setGrp]      = useState('')
  const [results,  setResults]  = useState<Team[]>([])
  const [loading,  setLoading]  = useState(false)
  const [selected, setSelected] = useState<Team | null>(null)
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timeout.current) clearTimeout(timeout.current)
    timeout.current = setTimeout(async () => {
      setLoading(true)
      try {
        // Search in API
        const res = await teamsService.search({ search: q, group: grp, page: 1, limit: 15 })
        // Also search in extraTeams (custom)
        const extraFiltered = extraTeams.filter(t => {
          const ms = !q   || t.name.toLowerCase().includes(q.toLowerCase())
          const mg = !grp || t.group === grp
          return ms && mg
        })
        // Merge: custom first, then API (avoid duplicates)
        const merged = [
          ...extraFiltered,
          ...res.teams.filter(t => !extraFiltered.some(e => e.id === t.id))
        ]
        setResults(merged)
      } catch { /**/ } finally { setLoading(false) }
    }, 250)
  }, [q, grp, extraTeams])

  const pick = (t: Team) => {
    setSelected(t)
    setQ(t.name)
    setResults([])
    onSelect(t)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        {/* Name search */}
        <div className="relative flex-1">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            autoFocus
            value={q}
            onChange={e => { setQ(e.target.value); setSelected(null) }}
            placeholder={placeholder}
            className="w-full text-sm bg-white dark:bg-surface-200 border border-slate-200 dark:border-surface-400 rounded-lg pl-8 pr-3 py-2 text-slate-800 dark:text-white outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
          />
          {q && !selected && (
            <button onClick={() => { setQ(''); setSelected(null); setResults([]) }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={11} />
            </button>
          )}
        </div>
        {/* Group filter */}
        <div className="relative">
          <select value={grp} onChange={e => setGrp(e.target.value)}
            className="appearance-none text-xs bg-white dark:bg-surface-200 border border-slate-200 dark:border-surface-400 rounded-lg pl-2.5 pr-6 py-2 text-slate-700 dark:text-slate-200 outline-none focus:border-green-500 transition-all">
            <option value="">Todos os grupos</option>
            {groups.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Dropdown results */}
      {!selected && (q.length > 0 || grp) && (
        <div className="bg-white dark:bg-surface-200 border border-slate-200 dark:border-surface-400 rounded-lg overflow-hidden max-h-44 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 size={14} className="text-green-500 animate-spin" />
            </div>
          ) : results.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">Nenhum time encontrado</p>
          ) : results.map(t => (
            <button key={t.id} onClick={() => pick(t)}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors text-left border-b border-slate-50 dark:border-surface-300/30 last:border-b-0">
              <Shield size={11} className="text-slate-400 shrink-0" />
              <span className="flex-1 text-xs text-slate-800 dark:text-white truncate">{t.name}</span>
              <span className="text-[10px] text-slate-400 shrink-0">{t.group}</span>
            </button>
          ))}
        </div>
      )}

      {/* Selected badge */}
      {selected && (
        <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40 rounded-lg px-3 py-2">
          <Shield size={12} className="text-green-500 shrink-0" />
          <span className="flex-1 text-xs font-medium text-green-700 dark:text-green-300">{selected.name}</span>
          <span className="text-[10px] text-green-500">{selected.group}</span>
          <button onClick={() => { setSelected(null); setQ('') }}
            className="text-green-400 hover:text-green-600 ml-1"><X size={11} /></button>
        </div>
      )}
    </div>
  )
}

// ── Main Modal ────────────────────────────────────────────────────────────────
export const TeamsModal = ({ isOpen, onClose, readOnly }: TeamsModalProps) => {
  const [teams,       setTeams]       = useState<Team[]>([])
  const [total,       setTotal]       = useState(0)
  const [page,        setPage]        = useState(1)
  const [totalPages,  setTotalPages]  = useState(1)
  const [search,      setSearch]      = useState('')
  const [groupFilter, setGroupFilter] = useState('')
  const [groups,      setGroups]      = useState<string[]>([])
  const [loading,     setLoading]     = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  const [customTeams, setCustomTeams] = useState<Team[]>(() => {
    try { return JSON.parse(localStorage.getItem('fgb_custom_teams') || '[]') } catch { return [] }
  })

  type ActionMode = 'add' | 'edit' | 'delete' | null
  const [actionMode,  setActionMode]  = useState<ActionMode>(null)

  // Add form
  const [addName,     setAddName]     = useState('')
  const [addGroup,    setAddGroup]    = useState('')

  // Edit form
  const [editTarget,  setEditTarget]  = useState<Team | null>(null)
  const [editName,    setEditName]    = useState('')
  const [editGroup,   setEditGroup]   = useState('')

  // Delete form
  const [delTarget,   setDelTarget]   = useState<Team | null>(null)

  const [confirm,     setConfirm]     = useState<{ title: string; message: string; variant: 'danger'|'success'; label: string; fn: ()=>void } | null>(null)

  const searchRef    = useRef<HTMLInputElement>(null)
  const searchTimer  = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!isOpen) return
    teamsService.getGroups().then(g => { setGroups(g); setAddGroup(g[0] || '') }).catch(() => {})
    setTimeout(() => searchRef.current?.focus(), 150)
  }, [isOpen])

  const doSearch = useCallback(async (q: string, grp: string, pg: number, append = false) => {
    if (pg === 1) setLoading(true); else setLoadingMore(true)
    try {
      const res = await teamsService.search({ search: q, group: grp, page: pg, limit: 20 })
      setTeams(prev => append ? [...prev, ...res.teams] : res.teams)
      setTotal(res.total); setPage(pg); setTotalPages(res.totalPages)
    } catch { /**/ } finally { setLoading(false); setLoadingMore(false) }
  }, [])

  useEffect(() => {
    if (!isOpen) return
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => doSearch(search, groupFilter, 1), 300)
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current) }
  }, [search, groupFilter, isOpen, doSearch])

  if (!isOpen) return null

  const customFiltered = customTeams.filter(t => {
    const ms = !search    || t.name.toLowerCase().includes(search.toLowerCase())
    const mg = !groupFilter || t.group === groupFilter
    return ms && mg
  })
  const allDisplayed = [...customFiltered, ...teams]
  const displayTotal = total + customTeams.length
  const isCustom = (t: Team) => customTeams.some(c => c.id === t.id)

  const saveCustom = (updated: Team[]) => {
    setCustomTeams(updated)
    localStorage.setItem('fgb_custom_teams', JSON.stringify(updated))
  }

  const closeAction = () => {
    setActionMode(null)
    setAddName(''); setEditTarget(null); setEditName(''); setEditGroup(''); setDelTarget(null)
  }

  // ── Add ──
  const handleAdd = () => {
    if (!addName.trim()) return
    setConfirm({
      title: 'Adicionar time', variant: 'success',
      message: `Adicionar "${addName.trim()}" no grupo "${addGroup}"?`,
      label: '✓ Adicionar',
      fn: () => {
        saveCustom([...customTeams, { id: Date.now(), name: addName.trim(), group: addGroup }])
        closeAction(); setConfirm(null)
      }
    })
  }

  // ── Edit ──
  const handleEdit = () => {
    if (!editTarget || !editName.trim()) return
    setConfirm({
      title: 'Salvar alteração', variant: 'success',
      message: `Alterar "${editTarget.name}" para "${editName.trim()}"?`,
      label: 'Salvar',
      fn: () => {
        // custom team edit
        if (isCustom(editTarget)) {
          saveCustom(customTeams.map(t => t.id === editTarget.id ? { ...t, name: editName.trim(), group: editGroup } : t))
        }
        // For base teams, just refresh (they are read-only in backend, store override locally)
        closeAction(); setConfirm(null)
      }
    })
  }

  // ── Delete ──
  const handleDelete = () => {
    if (!delTarget) return
    setConfirm({
      title: 'Remover time', variant: 'danger',
      message: `Remover "${delTarget.name}"? Times base voltam após recarregar. Times personalizados são removidos permanentemente.`,
      label: 'Remover',
      fn: () => {
        if (isCustom(delTarget)) {
          saveCustom(customTeams.filter(t => t.id !== delTarget.id))
        }
        closeAction(); setConfirm(null)
      }
    })
  }

  // ── Render action panel ───────────────────────────────────────────────────
  const panelBase = "mt-1 bg-slate-50 dark:bg-surface-300/50 border border-slate-200 dark:border-surface-400 rounded-xl p-3 flex flex-col gap-2.5"

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="w-full max-w-2xl pointer-events-auto bg-white dark:bg-surface-200 rounded-2xl border border-slate-200 dark:border-surface-400 shadow-2xl flex flex-col"
          style={{ maxHeight: '88vh' }} onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-surface-300 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                <Shield size={15} className="text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-800 dark:text-white">Times</h2>
                <p className="text-[11px] text-slate-400">{displayTotal.toLocaleString()} times · {groups.length} grupos</p>
              </div>
            </div>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-surface-300 transition-colors">
              <X size={15} />
            </button>
          </div>

          {/* Search + actions */}
          <div className="px-5 py-3 border-b border-slate-100 dark:border-surface-300 shrink-0 flex flex-col gap-2">
            {/* Search row */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input ref={searchRef} value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar time na lista..."
                  className="w-full text-sm bg-slate-50 dark:bg-surface-300 border border-slate-200 dark:border-surface-400 rounded-xl pl-9 pr-4 py-2 text-slate-800 dark:text-white placeholder-slate-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all" />
                {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X size={12} /></button>}
              </div>
              <div className="relative">
                <select value={groupFilter} onChange={e => setGroupFilter(e.target.value)}
                  className="appearance-none text-xs bg-slate-50 dark:bg-surface-300 border border-slate-200 dark:border-surface-400 rounded-xl pl-3 pr-7 py-2 text-slate-700 dark:text-slate-200 outline-none focus:border-green-500 transition-all">
                  <option value="">Todos os grupos</option>
                  {groups.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Action buttons */}
            {!readOnly && (
              <>
                <div className="flex gap-1.5">
                  {(['add','edit','delete'] as const).map((mode) => {
                    const cfg = {
                      add:    { icon: <Plus size={12}/>,   label: 'Adicionar time', active: 'bg-green-600 border-green-600 text-white', inactive: 'border-green-300 dark:border-green-700 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20' },
                      edit:   { icon: <Pencil size={12}/>, label: 'Editar',         active: 'bg-blue-500 border-blue-500 text-white',   inactive: 'border-blue-300 dark:border-blue-700 text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20' },
                      delete: { icon: <Trash2 size={12}/>, label: 'Remover',        active: 'bg-red-500 border-red-500 text-white',     inactive: 'border-red-300 dark:border-red-800 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20' },
                    }[mode]
                    return (
                      <button key={mode}
                        onClick={() => { setActionMode(a => a === mode ? null : mode); closeAction(); if (actionMode !== mode) setActionMode(mode) }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all active:scale-95 ${actionMode === mode ? cfg.active : cfg.inactive}`}>
                        {cfg.icon}{cfg.label}
                      </button>
                    )
                  })}
                </div>

                {/* ── ADD panel ── */}
                {actionMode === 'add' && (
                  <div className={panelBase}>
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5"><Plus size={12}/>Novo time</p>
                    <div className="flex gap-2">
                      <input autoFocus value={addName} onChange={e => setAddName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
                        placeholder="Nome do time..."
                        className="flex-1 text-sm bg-white dark:bg-surface-200 border border-slate-200 dark:border-surface-400 rounded-lg px-3 py-2 text-slate-800 dark:text-white outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all" />
                      <select value={addGroup} onChange={e => setAddGroup(e.target.value)}
                        className="text-xs bg-white dark:bg-surface-200 border border-slate-200 dark:border-surface-400 rounded-lg px-2 py-2 text-slate-700 dark:text-slate-200 outline-none focus:border-green-500 transition-all">
                        {groups.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={closeAction} className="flex-1 py-1.5 rounded-lg border border-slate-200 dark:border-surface-400 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-surface-300 transition-colors">Cancelar</button>
                      <button onClick={handleAdd} disabled={!addName.trim()} className="flex-1 py-1.5 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white text-xs font-semibold transition-colors">✓ Confirmar adição</button>
                    </div>
                  </div>
                )}

                {/* ── EDIT panel ── */}
                {actionMode === 'edit' && (
                  <div className={panelBase}>
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                      <Pencil size={12} className="text-blue-400"/>
                      {editTarget ? `Editando: ${editTarget.name}` : 'Buscar time para editar'}
                    </p>
                    {!editTarget ? (
                      <TeamSearchInput
                        placeholder="Digite o nome do time..."
                        groups={groups}
                        extraTeams={customTeams}
                        onSelect={t => { setEditTarget(t); setEditName(t.name); setEditGroup(t.group) }}
                      />
                    ) : (
                      <>
                        <div className="flex gap-2">
                          <input autoFocus value={editName} onChange={e => setEditName(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleEdit() }}
                            placeholder="Novo nome..."
                            className="flex-1 text-sm bg-white dark:bg-surface-200 border border-blue-300 dark:border-blue-700 rounded-lg px-3 py-2 text-slate-800 dark:text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" />
                          <select value={editGroup} onChange={e => setEditGroup(e.target.value)}
                            className="text-xs bg-white dark:bg-surface-200 border border-slate-200 dark:border-surface-400 rounded-lg px-2 py-2 text-slate-700 dark:text-slate-200 outline-none focus:border-blue-400 transition-all">
                            {groups.map(g => <option key={g} value={g}>{g}</option>)}
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => { setEditTarget(null); setEditName(''); setEditGroup('') }} className="flex-1 py-1.5 rounded-lg border border-slate-200 dark:border-surface-400 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-surface-300 transition-colors">← Trocar time</button>
                          <button onClick={handleEdit} disabled={!editName.trim()} className="flex-1 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white text-xs font-semibold transition-colors">Salvar alteração</button>
                        </div>
                      </>
                    )}
                    <button onClick={closeAction} className="py-1.5 rounded-lg border border-slate-200 dark:border-surface-400 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-surface-300 transition-colors">Cancelar</button>
                  </div>
                )}

                {/* ── DELETE panel ── */}
                {actionMode === 'delete' && (
                  <div className={`${panelBase} border-red-100 dark:border-red-900/30`}>
                    <p className="text-xs font-semibold text-red-500 dark:text-red-400 flex items-center gap-1.5">
                      <Trash2 size={12}/>
                      {delTarget ? `Remover: ${delTarget.name}` : 'Buscar time para remover'}
                    </p>
                    {!delTarget ? (
                      <TeamSearchInput
                        placeholder="Digite o nome do time..."
                        groups={groups}
                        extraTeams={customTeams}
                        onSelect={t => setDelTarget(t)}
                      />
                    ) : (
                      <>
                        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-lg px-3 py-2">
                          <Shield size={12} className="text-red-400 shrink-0" />
                          <span className="flex-1 text-xs font-medium text-red-700 dark:text-red-300">{delTarget.name}</span>
                          <span className="text-[10px] text-red-400">{delTarget.group}</span>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => setDelTarget(null)} className="flex-1 py-1.5 rounded-lg border border-slate-200 dark:border-surface-400 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-surface-300 transition-colors">← Trocar time</button>
                          <button onClick={handleDelete} className="flex-1 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-semibold transition-colors">Confirmar remoção</button>
                        </div>
                      </>
                    )}
                    <button onClick={closeAction} className="py-1.5 rounded-lg border border-slate-200 dark:border-surface-400 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-surface-300 transition-colors">Cancelar</button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-16"><Loader2 size={24} className="text-green-500 animate-spin" /></div>
            ) : allDisplayed.length === 0 ? (
              <div className="py-12 text-center">
                <Users size={32} className="text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-slate-400">Nenhum time encontrado</p>
              </div>
            ) : (
              <>
                {groupFilter && (
                  <div className="px-5 py-2 bg-slate-50 dark:bg-surface-300/30 border-b border-slate-100 dark:border-surface-300">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{groupFilter} — {total} times</span>
                  </div>
                )}
                {allDisplayed.sort((a, b) => a.name.localeCompare(b.name)).map((team, i) => {
                  const custom = isCustom(team)
                  return (
                    <div key={`${team.id}-${i}`}
                      className="flex items-center gap-3 px-5 py-2.5 border-b border-slate-50 dark:border-surface-300/30 hover:bg-slate-50 dark:hover:bg-surface-300/20 transition-colors">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${custom ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-slate-100 dark:bg-surface-300'}`}>
                        <Shield size={13} className={custom ? 'text-blue-400' : 'text-slate-400 dark:text-slate-500'} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-slate-800 dark:text-white truncate block">{team.name}</span>
                        {!groupFilter && <span className="text-[10px] text-slate-400 dark:text-slate-500">{team.group}</span>}
                      </div>
                      {custom && <span className="text-[9px] bg-blue-100 dark:bg-blue-900/30 text-blue-500 px-1.5 py-0.5 rounded font-medium shrink-0">Personalizado</span>}
                    </div>
                  )
                })}
                {page < totalPages && (
                  <div className="p-4 text-center">
                    <button onClick={() => doSearch(search, groupFilter, page + 1, true)} disabled={loadingMore}
                      className="flex items-center gap-2 mx-auto text-xs text-green-500 hover:text-green-400 border border-green-300 dark:border-green-800 px-4 py-2 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors disabled:opacity-50">
                      {loadingMore ? <Loader2 size={13} className="animate-spin" /> : <ChevronDown size={13} />}
                      Carregar mais ({total - teams.length} restantes)
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-slate-100 dark:border-surface-300 shrink-0 flex items-center justify-between">
            <span className="text-xs text-slate-400">{allDisplayed.length} de {displayTotal.toLocaleString()} times</span>
            <button onClick={onClose} className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-surface-300 hover:bg-slate-200 dark:hover:bg-surface-400 text-slate-600 dark:text-slate-300 text-sm font-medium transition-colors">Fechar</button>
          </div>
        </div>
      </div>

      {confirm && (
        <ConfirmPopup title={confirm.title} message={confirm.message} variant={confirm.variant}
          confirmLabel={confirm.label} onConfirm={confirm.fn} onCancel={() => setConfirm(null)} />
      )}
    </>
  )
}
