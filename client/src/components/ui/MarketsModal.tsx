import { useState, useEffect } from 'react'
import { Plus, Search, Trash2, Edit2, Check, LayoutGrid } from 'lucide-react'
import { Modal } from './Modal'
import toast from 'react-hot-toast'

export interface Market {
  id: string
  sportSlug: string
  name: string
}

interface MarketModalProps {
  isOpen: boolean
  onClose: () => void
  markets: Market[]
  sports: { name: string; slug: string }[]
  onSave: (updated: Market[]) => void
  readOnly?: boolean
}

export const MarketsModal = ({ isOpen, onClose, markets, sports, onSave, readOnly }: MarketModalProps) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editSport, setEditSport] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  // Reset states when opening/closing
  useEffect(() => {
    if (!isOpen) {
      setEditingId(null)
      setIsAdding(false)
      setEditName('')
      setEditSport(sports[0]?.slug || '')
    }
  }, [isOpen, sports])

  const filtered = markets.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.sportSlug.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => a.sportSlug.localeCompare(b.sportSlug) || a.name.localeCompare(b.name))

  const handleAdd = () => {
    if (!editName.trim()) return toast.error('Digite o nome do mercado')
    if (!editSport) return toast.error('Selecione um esporte')

    const newMarket: Market = {
      id: crypto.randomUUID(),
      name: editName.trim(),
      sportSlug: editSport
    }

    onSave([...markets, newMarket])
    setEditName('')
    setIsAdding(false)
    toast.success('Mercado adicionado!')
  }

  const handleUpdate = () => {
    if (!editName.trim()) return toast.error('O nome não pode ser vazio')
    
    const updated = markets.map(m => 
      m.id === editingId ? { ...m, name: editName.trim(), sportSlug: editSport } : m
    )
    
    onSave(updated)
    setEditingId(null)
    toast.success('Mercado atualizado!')
  }

  const handleDelete = (id: string) => {
    if (window.confirm('Excluir este mercado?')) {
      onSave(markets.filter(m => m.id !== id))
      toast.success('Mercado removido')
    }
  }

  const startEdit = (m: Market) => {
    setEditingId(m.id)
    setEditName(m.name)
    setEditSport(m.sportSlug)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Gerenciar Mercados" size="lg">
      <div className="flex flex-col gap-4">
        
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              type="text"
              placeholder="Pesquisar mercados ou esportes..."
              className="input-field pl-10 h-10"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          {!readOnly && !isAdding && (
            <button 
              onClick={() => setIsAdding(true)}
              className="btn-primary h-10 px-4 flex items-center gap-2 whitespace-nowrap"
            >
              <Plus size={16} /> Novo Mercado
            </button>
          )}
        </div>

        {/* Form de Adição/Edição */}
        {(isAdding || editingId) && !readOnly && (
          <div className="p-4 rounded-xl bg-surface-300 border border-surface-400 flex flex-col gap-3 animate-in slide-in-from-top-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1">Esporte</label>
                <select 
                  className="input-field h-10"
                  value={editSport}
                  onChange={e => setEditSport(e.target.value)}
                >
                  {sports.map(s => (
                    <option key={s.slug} value={s.slug}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1">Nome do Mercado</label>
                <input 
                  type="text"
                  className="input-field h-10"
                  placeholder="Ex: Ambas Marcam"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button 
                onClick={() => { setIsAdding(false); setEditingId(null); }}
                className="btn-secondary h-8 px-3 text-xs"
              >
                Cancelar
              </button>
              <button 
                onClick={editingId ? handleUpdate : handleAdd}
                className="btn-primary h-8 px-4 text-xs flex items-center gap-1"
              >
                <Check size={14} /> {editingId ? 'Salvar' : 'Adicionar'}
              </button>
            </div>
          </div>
        )}

        {/* Lista */}
        <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          <div className="grid grid-cols-1 gap-2">
            {filtered.map(m => {
              const sport = sports.find(s => s.slug === m.sportSlug)
              return (
                <div key={m.id} className="flex items-center justify-between p-3 rounded-xl bg-surface-200 border border-surface-400 group hover:border-surface-300 transition-colors">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-green-500/70 uppercase tracking-widest leading-none mb-1">
                      {sport?.name || m.sportSlug}
                    </span>
                    <span className="text-sm font-medium text-white">{m.name}</span>
                  </div>
                  {!readOnly && (
                    <div className="flex items-center gap-1 opacity-10 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => startEdit(m)}
                        className="p-1.5 rounded-lg hover:bg-surface-300 text-slate-400 hover:text-white transition-colors"
                        title="Editar"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => handleDelete(m.id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-500 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {filtered.length === 0 && (
            <div className="py-12 text-center">
              <LayoutGrid size={40} className="mx-auto text-slate-700 mb-3 opacity-20" />
              <p className="text-slate-500 text-sm">Nenhum mercado encontrado</p>
            </div>
          )}
        </div>

      </div>
    </Modal>
  )
}
