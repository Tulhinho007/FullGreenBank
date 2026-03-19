import { useState, useRef, useEffect } from 'react'
import { X, Plus, Pencil, Trash2, Target, Search, AlertTriangle, User } from 'lucide-react'

export interface Tipster {
  id: string
  name: string
  sport1: string
  sport2: string
  market1: string
  market2: string
}

interface TipstersModalProps {
  isOpen: boolean
  onClose: () => void
  tipsters: Tipster[]
  onSave: (tipsters: Tipster[]) => void
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

// ── TipsterSearchInput ────────────────────────────────────────────────────────
const TipsterSearchInput = ({ tipsters, onSelect }: { tipsters: Tipster[]; onSelect: (t: Tipster) => void }) => {
  const [q,        setQ]        = useState('')
  const [selected, setSelected] = useState<Tipster | null>(null)

  const filtered = q.trim()
    ? tipsters.filter(t => t.name.toLowerCase().includes(q.toLowerCase()))
    : tipsters

  const pick = (t: Tipster) => { setSelected(t); setQ(t.name); onSelect(t) }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          autoFocus
          value={q}
          onChange={e => { setQ(e.target.value); setSelected(null) }}
          placeholder="Digite o nome ou apelido..."
          className="w-full text-sm bg-white dark:bg-surface-200 border border-slate-200 dark:border-surface-400 rounded-lg pl-8 pr-3 py-2 text-slate-800 dark:text-white outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
        />
        {q && !selected && (
          <button onClick={() => { setQ(''); setSelected(null) }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <X size={11} />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {!selected && q.trim().length > 0 && (
        <div className="bg-white dark:bg-surface-200 border border-slate-200 dark:border-surface-400 rounded-lg overflow-hidden max-h-40 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-3">Nenhum tipster encontrado</p>
          ) : filtered.map(t => (
            <button key={t.id} onClick={() => pick(t)}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors text-left border-b border-slate-50 dark:border-surface-300/30 last:border-b-0">
              <User size={14} className="text-slate-400" />
              <span className="text-xs text-slate-800 dark:text-white">{t.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Selected badge */}
      {selected && (
        <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40 rounded-lg px-3 py-2">
          <User size={14} className="text-green-600 dark:text-green-400" />
          <span className="flex-1 text-xs font-medium text-green-700 dark:text-green-300">{selected.name}</span>
          <button onClick={() => { setSelected(null); setQ('') }} className="text-green-400 hover:text-green-600"><X size={11} /></button>
        </div>
      )}
    </div>
  )
}

// ── Main Modal ────────────────────────────────────────────────────────────────
export const TipstersModal = ({ isOpen, onClose, tipsters, onSave, readOnly }: TipstersModalProps) => {
  const emptyForm = { name: '', sport1: '', sport2: '', market1: '', market2: '' }
  const [form, setForm] = useState(emptyForm)
  const [editTarget, setEditTarget] = useState<Tipster | null>(null)
  const [actionMode, setActionMode] = useState<'add' | 'edit' | 'delete' | null>(null)
  const [confirm,    setConfirm]    = useState<{ title: string; message: string; variant: 'danger'|'success'; label: string; fn: ()=>void } | null>(null)
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && actionMode === 'add') setTimeout(() => nameRef.current?.focus(), 100)
  }, [isOpen, actionMode])

  if (!isOpen) return null

  const closeAction = () => {
    setActionMode(null); setForm(emptyForm); setEditTarget(null)
  }

  const handleAdd = () => {
    if (!form.name.trim()) return
    setConfirm({
      title: 'Adicionar Tipster', variant: 'success',
      message: `Adicionar "${form.name.trim()}" à lista de Tipsters?`,
      label: '✓ Adicionar',
      fn: () => {
        onSave([...tipsters, { id: crypto.randomUUID(), ...form }])
        closeAction(); setConfirm(null)
      }
    })
  }

  const handleEdit = () => {
    if (!editTarget || !form.name.trim()) return
    setConfirm({
      title: 'Salvar alteração', variant: 'success',
      message: `Salvar as alterações de "${editTarget.name}"?`,
      label: 'Salvar',
      fn: () => {
        onSave(tipsters.map(t => t.id === editTarget.id ? { ...t, ...form } : t))
        closeAction(); setConfirm(null)
      }
    })
  }

  const handleDelete = () => {
    if (!actionMode || actionMode !== 'delete' || !editTarget) return
    setConfirm({
      title: 'Remover Tipster', variant: 'danger',
      message: `Remover "${editTarget.name}" permanentemente?`,
      label: 'Remover',
      fn: () => {
        onSave(tipsters.filter(t => t.id !== editTarget.id))
        closeAction(); setConfirm(null)
      }
    })
  }

  const panelBase = "mt-1 bg-slate-50 dark:bg-surface-300/50 border border-slate-200 dark:border-surface-400 rounded-xl p-3 flex flex-col gap-2.5"

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="w-full max-w-md pointer-events-auto bg-white dark:bg-surface-200 rounded-2xl border border-slate-200 dark:border-surface-400 shadow-2xl flex flex-col"
          style={{ maxHeight: '85vh' }} onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-surface-300 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                <Target size={15} className="text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-800 dark:text-white">Gerenciar Tipsters</h2>
                <p className="text-[11px] text-slate-400">{tipsters.length} cadastrados</p>
              </div>
            </div>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-surface-300 hover:text-slate-600 transition-colors">
              <X size={15} />
            </button>
          </div>

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

              {/* Panel Add/Edit */}
              {(actionMode === 'add' || (actionMode === 'edit' && editTarget)) && (
                <div className={panelBase}>
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    {actionMode === 'add' ? <Plus size={12}/> : <Pencil size={12} className="text-blue-400"/>}
                    {actionMode === 'add' ? 'Novo Tipster' : `Editando: ${editTarget?.name}`}
                  </p>
                  <div className="flex flex-col gap-2">
                    <input ref={nameRef} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome do Tipster (Ex: Mestre das Odds)" className="w-full text-xs bg-white dark:bg-surface-200 border border-slate-200 dark:border-surface-400 rounded-lg px-3 py-2 text-slate-800 dark:text-white outline-none focus:border-green-500 transition-all" />
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-slate-500 uppercase font-bold ml-1">Esportes</label>
                        <input value={form.sport1} onChange={e => setForm(f => ({ ...f, sport1: e.target.value }))} placeholder="Esporte Dominante 1" className="input-field py-1.5" />
                        <input value={form.sport2} onChange={e => setForm(f => ({ ...f, sport2: e.target.value }))} placeholder="Esporte Dominante 2" className="input-field py-1.5" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-slate-500 uppercase font-bold ml-1">Mercados</label>
                        <input value={form.market1} onChange={e => setForm(f => ({ ...f, market1: e.target.value }))} placeholder="Mercado Dominante 1" className="input-field py-1.5" />
                        <input value={form.market2} onChange={e => setForm(f => ({ ...f, market2: e.target.value }))} placeholder="Mercado Dominante 2" className="input-field py-1.5" />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-1">
                    <button onClick={closeAction} className="flex-1 py-1.5 rounded-lg border border-slate-200 dark:border-surface-400 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-surface-300 transition-colors">Cancelar</button>
                    <button onClick={actionMode === 'add' ? handleAdd : handleEdit} disabled={!form.name.trim()} className={`flex-1 py-1.5 rounded-lg text-white text-xs font-semibold transition-colors ${actionMode === 'add' ? 'bg-green-600 hover:bg-green-500' : 'bg-blue-500 hover:bg-blue-600'}`}>{actionMode === 'add' ? '✓ Confirmar adição' : 'Salvar alteração'}</button>
                  </div>
                </div>
              )}

              {/* Panel Edit/Delete Search */}
              {(actionMode === 'edit' || actionMode === 'delete') && !editTarget && (
                <div className={panelBase}>
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    {actionMode === 'edit' ? <Pencil size={12} className="text-blue-400"/> : <Trash2 size={12} className="text-red-400"/>}
                    {actionMode === 'edit' ? 'Buscar tipster para editar' : 'Buscar tipster para remover'}
                  </p>
                  <TipsterSearchInput tipsters={tipsters} onSelect={t => {
                    setEditTarget(t)
                    if (actionMode === 'edit') setForm({ name: t.name, sport1: t.sport1 || '', sport2: t.sport2 || '', market1: t.market1, market2: t.market2 })
                  }} />
                  <button onClick={closeAction} className="py-1.5 rounded-lg border border-slate-200 dark:border-surface-400 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-surface-300 transition-colors">Cancelar</button>
                </div>
              )}

              {/* Panel Delete Confirmation Overlay inside modal */}
              {actionMode === 'delete' && editTarget && (
                <div className={panelBase + " border-red-500/20 bg-red-50/10"}>
                   <p className="text-xs font-semibold text-red-500 flex items-center gap-1.5">
                    <Trash2 size={12}/> Confirmar remoção de: {editTarget.name}
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => setEditTarget(null)} className="flex-1 py-1.5 rounded-lg border border-slate-200 dark:border-surface-400 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-surface-300 transition-colors">Voltar</button>
                    <button onClick={handleDelete} className="flex-1 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-semibold transition-colors">Remover permanentemente</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {tipsters.length === 0 ? (
              <div className="py-12 text-center">
                <Target size={36} className="text-slate-700 mx-auto mb-3 opacity-20" />
                <p className="text-sm text-slate-400 dark:text-slate-500">Nenhum tipster cadastrado</p>
              </div>
            ) : (
              tipsters.map(t => (
                <div key={t.id} className="flex items-center gap-3 px-5 py-4 border-b border-slate-50 dark:border-surface-300/30 hover:bg-slate-50 dark:hover:bg-surface-300/20 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-surface-300 dark:bg-surface-400 flex items-center justify-center shrink-0">
                    <User size={20} className="text-slate-500 dark:text-slate-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-white truncate mb-1">{t.name}</p>
                    
                    <div className="flex flex-wrap gap-1.5">
                      {/* Esportes */}
                      {(t.sport1 || t.sport2) && (
                        <div className="flex gap-1">
                          {t.sport1 && (
                            <span className="flex items-center gap-1 text-[9px] font-bold text-green-600 bg-green-500/10 border border-green-500/20 px-1.5 py-0.5 rounded uppercase">
                              <span className="opacity-60 text-[8px]">ESP:</span> {t.sport1}
                            </span>
                          )}
                          {t.sport2 && (
                            <span className="flex items-center gap-1 text-[9px] font-bold text-green-600 bg-green-500/10 border border-green-500/20 px-1.5 py-0.5 rounded uppercase">
                              <span className="opacity-60 text-[8px]">ESP:</span> {t.sport2}
                            </span>
                          )}
                        </div>
                      )}
                      
                      {/* Mercados */}
                      {(t.market1 || t.market2) && (
                        <div className="flex gap-1">
                          {t.market1 && (
                            <span className="flex items-center gap-1 text-[9px] font-bold text-blue-600 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded uppercase">
                              <span className="opacity-60 text-[8px]">MKT:</span> {t.market1}
                            </span>
                          )}
                          {t.market2 && (
                            <span className="flex items-center gap-1 text-[9px] font-bold text-blue-600 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded uppercase">
                              <span className="opacity-60 text-[8px]">MKT:</span> {t.market2}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="px-5 py-3 border-t border-slate-100 dark:border-surface-300 shrink-0">
            <button onClick={onClose} className="w-full py-2 rounded-xl bg-slate-100 dark:bg-surface-300 hover:bg-slate-200 dark:hover:bg-surface-400 text-slate-600 dark:text-slate-300 text-sm font-medium transition-colors">
              Fechar
            </button>
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
