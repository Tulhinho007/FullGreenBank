import { useState } from 'react'
import { X, Plus, Pencil, Trash2, Search, AlertTriangle, Star } from 'lucide-react'

export interface Bookmaker {
  id: string
  name: string
  differential: string
  focus: string
}

interface BookmakersModalProps {
  isOpen: boolean
  onClose: () => void
  bookmakers: Bookmaker[]
  onSave: (bookmakers: Bookmaker[]) => void
  readOnly?: boolean
}

export const DEFAULT_BOOKMAKERS: Bookmaker[] = [
  { id: 'b001', name: 'Bet365',      differential: 'Variedade de mercados e Live Stream',       focus: 'Global / Tradicional'         },
  { id: 'b002', name: 'Betano',      differential: 'Interface amigável e Missões (Gamificação)', focus: 'Brasil / Europa'              },
  { id: 'b003', name: 'Betfair',     differential: 'Maior Intercâmbio (Exchange) do mundo',     focus: 'Profissionais (Trade)'        },
  { id: 'b004', name: 'Stake',       differential: 'Líder em apostas com Criptomoedas',         focus: 'Global / Cassino'             },
  { id: 'b005', name: 'Pinnacle',    differential: 'Melhores Odds (Menor margem de lucro)',     focus: 'Apostadores Profissionais'    },
  { id: 'b006', name: '1xBet',       differential: 'Gigante em bônus e métodos de depósito',   focus: 'Global / Américas'            },
  { id: 'b007', name: 'Sportingbet', differential: 'Uma das mais tradicionais no Brasil',       focus: 'Brasil'                       },
  { id: 'b008', name: 'Parimatch',   differential: 'Odds competitivas em eSports',              focus: 'Global / eSports'             },
  { id: 'b009', name: 'Novibet',     differential: 'Super Odds e Pagamento Antecipado',         focus: 'Brasil / Europa'              },
  { id: 'b010', name: 'EstrelaBet',  differential: 'Patrocínio massivo e facilidade no Pix',   focus: 'Brasil'                       },
]

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

// ── SearchInput ───────────────────────────────────────────────────────────────
const BookmakerSearchInput = ({ bookmakers, onSelect }: { bookmakers: Bookmaker[]; onSelect: (b: Bookmaker) => void }) => {
  const [q,        setQ]        = useState('')
  const [selected, setSelected] = useState<Bookmaker | null>(null)

  const filtered = q.trim()
    ? bookmakers.filter(b => b.name.toLowerCase().includes(q.toLowerCase()) || b.focus.toLowerCase().includes(q.toLowerCase()))
    : bookmakers

  const pick = (b: Bookmaker) => { setSelected(b); setQ(b.name); onSelect(b) }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input autoFocus value={q} onChange={e => { setQ(e.target.value); setSelected(null) }}
          placeholder="Nome da casa de apostas..."
          className="w-full text-sm bg-white dark:bg-surface-200 border border-slate-200 dark:border-surface-400 rounded-lg pl-8 pr-3 py-2 text-slate-800 dark:text-white outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all" />
        {q && !selected && <button onClick={() => { setQ(''); setSelected(null) }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X size={11} /></button>}
      </div>
      {!selected && q.trim().length > 0 && (
        <div className="bg-white dark:bg-surface-200 border border-slate-200 dark:border-surface-400 rounded-lg overflow-hidden max-h-40 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-3">Nenhuma casa encontrada</p>
          ) : filtered.map(b => (
            <button key={b.id} onClick={() => pick(b)}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors text-left border-b border-slate-50 dark:border-surface-300/30 last:border-b-0">
              <Star size={11} className="text-yellow-400 shrink-0" />
              <span className="flex-1 text-xs font-medium text-slate-800 dark:text-white">{b.name}</span>
              <span className="text-[10px] text-slate-400 truncate max-w-[120px]">{b.focus}</span>
            </button>
          ))}
        </div>
      )}
      {selected && (
        <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40 rounded-lg px-3 py-2">
          <Star size={12} className="text-yellow-400 shrink-0" />
          <span className="flex-1 text-xs font-medium text-green-700 dark:text-green-300">{selected.name}</span>
          <button onClick={() => { setSelected(null); setQ('') }} className="text-green-400 hover:text-green-600"><X size={11} /></button>
        </div>
      )}
    </div>
  )
}

// ── Main Modal ────────────────────────────────────────────────────────────────
export const BookmakersModal = ({ isOpen, onClose, bookmakers, onSave, readOnly }: BookmakersModalProps) => {
  type ActionMode = 'add' | 'edit' | 'delete' | null
  const [actionMode,  setActionMode]  = useState<ActionMode>(null)
  const [editTarget,  setEditTarget]  = useState<Bookmaker | null>(null)
  const [delTarget,   setDelTarget]   = useState<Bookmaker | null>(null)
  const [confirm,     setConfirm]     = useState<{ title: string; message: string; variant: 'danger'|'success'; label: string; fn: ()=>void } | null>(null)

  // Add form
  const [addName,    setAddName]    = useState('')
  const [addDiff,    setAddDiff]    = useState('')
  const [addFocus,   setAddFocus]   = useState('')

  // Edit form
  const [editName,   setEditName]   = useState('')
  const [editDiff,   setEditDiff]   = useState('')
  const [editFocus,  setEditFocus]  = useState('')

  if (!isOpen) return null

  const closeAction = () => {
    setActionMode(null)
    setAddName(''); setAddDiff(''); setAddFocus('')
    setEditTarget(null); setEditName(''); setEditDiff(''); setEditFocus('')
    setDelTarget(null)
  }

  // ── Add ──
  const handleAdd = () => {
    if (!addName.trim()) return
    setConfirm({
      title: 'Adicionar casa', variant: 'success',
      message: `Adicionar "${addName.trim()}" à lista de casas de apostas?`,
      label: '✓ Adicionar',
      fn: () => {
        onSave([...bookmakers, { id: crypto.randomUUID(), name: addName.trim(), differential: addDiff.trim(), focus: addFocus.trim() }])
        closeAction(); setConfirm(null)
      }
    })
  }

  // ── Edit ──
  const handleEdit = () => {
    if (!editTarget || !editName.trim()) return
    setConfirm({
      title: 'Salvar alteração', variant: 'success',
      message: `Salvar alterações em "${editTarget.name}"?`,
      label: 'Salvar',
      fn: () => {
        onSave(bookmakers.map(b => b.id === editTarget.id
          ? { ...b, name: editName.trim(), differential: editDiff.trim(), focus: editFocus.trim() }
          : b
        ))
        closeAction(); setConfirm(null)
      }
    })
  }

  // ── Delete ──
  const handleDelete = () => {
    if (!delTarget) return
    setConfirm({
      title: 'Remover casa', variant: 'danger',
      message: `Remover "${delTarget.name}" permanentemente?`,
      label: 'Remover',
      fn: () => {
        onSave(bookmakers.filter(b => b.id !== delTarget.id))
        closeAction(); setConfirm(null)
      }
    })
  }

  const panelBase = "mt-1 bg-slate-50 dark:bg-surface-300/50 border border-slate-200 dark:border-surface-400 rounded-xl p-3 flex flex-col gap-2.5"
  const inputCls  = "w-full text-sm bg-white dark:bg-surface-200 border border-slate-200 dark:border-surface-400 rounded-lg px-3 py-2 text-slate-800 dark:text-white outline-none transition-all placeholder-slate-400"

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="w-full max-w-3xl pointer-events-auto bg-white dark:bg-surface-200 rounded-2xl border border-slate-200 dark:border-surface-400 shadow-2xl flex flex-col"
          style={{ maxHeight: '88vh' }} onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-surface-300 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                <Star size={15} className="text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-800 dark:text-white">Casas de Apostas</h2>
                <p className="text-[11px] text-slate-400">{bookmakers.length} casas cadastradas</p>
              </div>
            </div>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-surface-300 transition-colors"><X size={15} /></button>
          </div>

          {/* Actions */}
          {!readOnly && (
            <div className="px-5 py-3 border-b border-slate-100 dark:border-surface-300 shrink-0 flex flex-col gap-2">
              <div className="flex gap-1.5">
                {(['add', 'edit', 'delete'] as const).map(mode => {
                  const cfg = {
                    add:    { icon: <Plus size={12}/>,   label: 'Adicionar', active: 'bg-green-600 border-green-600 text-white', inactive: 'border-green-300 dark:border-green-700 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20' },
                    edit:   { icon: <Pencil size={12}/>, label: 'Editar',    active: 'bg-blue-500 border-blue-500 text-white',   inactive: 'border-blue-300 dark:border-blue-700 text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20' },
                    delete: { icon: <Trash2 size={12}/>, label: 'Remover',   active: 'bg-red-500 border-red-500 text-white',     inactive: 'border-red-300 dark:border-red-800 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20' },
                  }[mode]
                  return (
                    <button key={mode}
                      onClick={() => { closeAction(); if (actionMode !== mode) setActionMode(mode) }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all active:scale-95 ${actionMode === mode ? cfg.active : cfg.inactive}`}>
                      {cfg.icon}{cfg.label}
                    </button>
                  )
                })}
              </div>

              {/* ADD panel */}
              {actionMode === 'add' && (
                <div className={panelBase}>
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5"><Plus size={12}/>Nova casa de apostas</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block mb-1">Casa de Aposta *</label>
                      <input autoFocus value={addName} onChange={e => setAddName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
                        placeholder="Ex: Bet365"
                        className={`${inputCls} focus:border-green-500 focus:ring-2 focus:ring-green-500/20`} />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block mb-1">Principal Diferencial</label>
                      <input value={addDiff} onChange={e => setAddDiff(e.target.value)}
                        placeholder="Ex: Live Stream e variedade"
                        className={`${inputCls} focus:border-green-500 focus:ring-2 focus:ring-green-500/20`} />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block mb-1">Foco de Mercado</label>
                      <input value={addFocus} onChange={e => setAddFocus(e.target.value)}
                        placeholder="Ex: Global / Tradicional"
                        className={`${inputCls} focus:border-green-500 focus:ring-2 focus:ring-green-500/20`} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={closeAction} className="flex-1 py-1.5 rounded-lg border border-slate-200 dark:border-surface-400 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-surface-300 transition-colors">Cancelar</button>
                    <button onClick={handleAdd} disabled={!addName.trim()} className="flex-1 py-1.5 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white text-xs font-semibold transition-colors">✓ Confirmar adição</button>
                  </div>
                </div>
              )}

              {/* EDIT panel */}
              {actionMode === 'edit' && (
                <div className={panelBase}>
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <Pencil size={12} className="text-blue-400"/>
                    {editTarget ? `Editando: ${editTarget.name}` : 'Buscar casa para editar'}
                  </p>
                  {!editTarget ? (
                    <BookmakerSearchInput bookmakers={bookmakers} onSelect={b => { setEditTarget(b); setEditName(b.name); setEditDiff(b.differential); setEditFocus(b.focus) }} />
                  ) : (
                    <>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block mb-1">Casa de Aposta *</label>
                          <input autoFocus value={editName} onChange={e => setEditName(e.target.value)}
                            className={`${inputCls} border-blue-300 dark:border-blue-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20`} />
                        </div>
                        <div>
                          <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block mb-1">Principal Diferencial</label>
                          <input value={editDiff} onChange={e => setEditDiff(e.target.value)}
                            className={`${inputCls} border-blue-300 dark:border-blue-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20`} />
                        </div>
                        <div>
                          <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block mb-1">Foco de Mercado</label>
                          <input value={editFocus} onChange={e => setEditFocus(e.target.value)}
                            className={`${inputCls} border-blue-300 dark:border-blue-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20`} />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setEditTarget(null); setEditName(''); setEditDiff(''); setEditFocus('') }} className="flex-1 py-1.5 rounded-lg border border-slate-200 dark:border-surface-400 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-surface-300 transition-colors">← Trocar</button>
                        <button onClick={handleEdit} disabled={!editName.trim()} className="flex-1 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white text-xs font-semibold transition-colors">Salvar alteração</button>
                      </div>
                    </>
                  )}
                  <button onClick={closeAction} className="py-1.5 rounded-lg border border-slate-200 dark:border-surface-400 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-surface-300 transition-colors">Cancelar</button>
                </div>
              )}

              {/* DELETE panel */}
              {actionMode === 'delete' && (
                <div className={`${panelBase} border-red-100 dark:border-red-900/30`}>
                  <p className="text-xs font-semibold text-red-500 dark:text-red-400 flex items-center gap-1.5">
                    <Trash2 size={12}/>
                    {delTarget ? `Remover: ${delTarget.name}` : 'Buscar casa para remover'}
                  </p>
                  {!delTarget ? (
                    <BookmakerSearchInput bookmakers={bookmakers} onSelect={b => setDelTarget(b)} />
                  ) : (
                    <>
                      <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-lg px-3 py-2">
                        <Star size={12} className="text-red-400 shrink-0" />
                        <span className="flex-1 text-xs font-medium text-red-700 dark:text-red-300">{delTarget.name}</span>
                        <span className="text-[10px] text-red-400">{delTarget.focus}</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setDelTarget(null)} className="flex-1 py-1.5 rounded-lg border border-slate-200 dark:border-surface-400 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-surface-300 transition-colors">← Trocar</button>
                        <button onClick={handleDelete} className="flex-1 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-semibold transition-colors">Confirmar remoção</button>
                      </div>
                    </>
                  )}
                  <button onClick={closeAction} className="py-1.5 rounded-lg border border-slate-200 dark:border-surface-400 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-surface-300 transition-colors">Cancelar</button>
                </div>
              )}
            </div>
          )}

          {/* Table */}
          <div className="flex-1 overflow-y-auto">
            {bookmakers.length === 0 ? (
              <div className="py-12 text-center">
                <Star size={32} className="text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-slate-400">Nenhuma casa cadastrada</p>
              </div>
            ) : (
              <table className="w-full text-sm border-collapse">
                <thead className="sticky top-0">
                  <tr className="bg-slate-50 dark:bg-surface-300/80 border-b border-slate-100 dark:border-surface-300">
                    <th className="text-left px-5 py-2.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-1/4">Casa de Aposta</th>
                    <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-2/4">Principal Diferencial</th>
                    <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-1/4">Foco de Mercado</th>
                  </tr>
                </thead>
                <tbody>
                  {[...bookmakers].sort((a, b) => a.name.localeCompare(b.name)).map((b, i) => (
                    <tr key={b.id} className={`border-b border-slate-50 dark:border-surface-300/30 hover:bg-slate-50 dark:hover:bg-surface-300/20 transition-colors ${i % 2 === 0 ? '' : 'bg-slate-50/50 dark:bg-surface-300/10'}`}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                            <Star size={11} className="text-green-500 dark:text-green-400" />
                          </div>
                          <span className="font-semibold text-slate-800 dark:text-white text-sm">{b.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">{b.differential}</td>
                      <td className="px-4 py-3">
                        <span className="text-[11px] bg-slate-100 dark:bg-surface-300 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full border border-slate-200 dark:border-surface-400 whitespace-nowrap">
                          {b.focus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-slate-100 dark:border-surface-300 shrink-0">
            <button onClick={onClose} className="w-full py-2 rounded-xl bg-slate-100 dark:bg-surface-300 hover:bg-slate-200 dark:hover:bg-surface-400 text-slate-600 dark:text-slate-300 text-sm font-medium transition-colors">Fechar</button>
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
