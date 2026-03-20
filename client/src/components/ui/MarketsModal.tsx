import { useState, useEffect } from 'react'
import { Plus, Search, Trash2, Edit2, Check, LayoutGrid, X } from 'lucide-react'
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
  const [selectedId, setSelectedId] = useState<string | null>(null)
  
  const [isEditing, setIsEditing] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  
  const [editName, setEditName] = useState('')
  const [editSport, setEditSport] = useState('')

  // Reset states when opening/closing
  useEffect(() => {
    if (!isOpen) {
      setSelectedId(null)
      setIsAdding(false)
      setIsEditing(false)
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
      m.id === selectedId ? { ...m, name: editName.trim(), sportSlug: editSport } : m
    )
    
    onSave(updated)
    setIsEditing(false)
    setSelectedId(null)
    toast.success('Mercado atualizado!')
  }

  const handleDelete = () => {
    if (!selectedId) return
    const market = markets.find(m => m.id === selectedId)
    if (window.confirm(`Excluir o mercado "${market?.name}"?`)) {
      onSave(markets.filter(m => m.id !== selectedId))
      setSelectedId(null)
      toast.success('Mercado removido')
    }
  }

  const startEdit = () => {
    if (!selectedId) return
    const m = markets.find(m => m.id === selectedId)
    if (m) {
      setEditName(m.name)
      setEditSport(m.sportSlug)
      setIsEditing(true)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Gerenciar Mercados" size="xl">
      <div className="flex flex-col gap-5">
        
        {/* Toolbar de Ações - Estilo Referência */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-2 border-b border-surface-400">
          <div className="flex items-center gap-3">
            {!readOnly && (
              <>
                <button 
                  onClick={() => { setIsAdding(true); setEditName(''); setEditSport(sports[0]?.slug || ''); }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-green-500/50 bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-all font-medium text-sm"
                >
                  <Plus size={16} /> Adicionar
                </button>
                
                <button 
                  onClick={startEdit}
                  disabled={!selectedId}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all font-medium text-sm ${
                    selectedId 
                      ? 'border-blue-500/50 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20' 
                      : 'border-slate-700 bg-slate-800/50 text-slate-600 cursor-not-allowed opacity-50'
                  }`}
                >
                  <Edit2 size={16} /> Editar
                </button>

                <button 
                  onClick={handleDelete}
                  disabled={!selectedId}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all font-medium text-sm ${
                    selectedId 
                      ? 'border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20' 
                      : 'border-slate-700 bg-slate-800/50 text-slate-600 cursor-not-allowed opacity-50'
                  }`}
                >
                  <Trash2 size={16} /> Remover
                </button>
              </>
            )}
          </div>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              type="text"
              placeholder="Pesquisar..."
              className="w-full bg-surface-300 border border-surface-400 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:border-green-500/50 transition-colors outline-none"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Formulário de Adição/Edição (Overlay Style) */}
        {(isAdding || isEditing) && (
          <div className="p-4 rounded-xl bg-surface-200 border border-green-500/30 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-white">
                {isAdding ? 'Novo Mercado' : 'Editar Mercado'}
              </h4>
              <button 
                onClick={() => { setIsAdding(false); setIsEditing(false); }}
                className="p-1 hover:bg-surface-300 rounded text-slate-500 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Esporte</label>
                <select 
                  className="w-full bg-surface-300 border border-surface-400 rounded-lg px-3 py-2 text-sm text-white focus:border-green-500/50 outline-none"
                  value={editSport}
                  onChange={e => setEditSport(e.target.value)}
                >
                  {sports.map(s => (
                    <option key={s.slug} value={s.slug}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Nome do Mercado</label>
                <input 
                  type="text"
                  className="w-full bg-surface-300 border border-surface-400 rounded-lg px-3 py-2 text-sm text-white focus:border-green-500/50 outline-none"
                  placeholder="Ex: Ambas Marcam"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => { setIsAdding(false); setIsEditing(false); }}
                className="px-4 py-1.5 text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button 
                onClick={isEditing ? handleUpdate : handleAdd}
                className="bg-green-600 hover:bg-green-500 text-white px-5 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-lg shadow-green-900/20"
              >
                <Check size={14} /> {isEditing ? 'Salvar Alterações' : 'Salvar Mercado'}
              </button>
            </div>
          </div>
        )}

        {/* Tabela de Mercados */}
        <div className="overflow-hidden rounded-xl border border-surface-400 bg-surface-300/30">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-surface-400 bg-surface-400/20">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Esporte</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nome do Mercado</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-400/50">
              {filtered.map(m => {
                const sport = sports.find(s => s.slug === m.sportSlug)
                const isSelected = selectedId === m.id
                return (
                  <tr 
                    key={m.id} 
                    onClick={() => setSelectedId(isSelected ? null : m.id)}
                    className={`group cursor-pointer transition-colors ${isSelected ? 'bg-green-500/5' : 'hover:bg-surface-300/50'}`}
                  >
                    <td className="px-6 py-3">
                      <span className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded border ${isSelected ? 'border-green-500/30 text-green-400 bg-green-500/10' : 'border-slate-800 text-slate-500 bg-slate-900/30'}`}>
                        {sport?.name || m.sportSlug}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm font-medium text-slate-200">
                      {m.name}
                    </td>
                    <td className="px-6 py-3 text-right">
                      {isSelected && (
                        <div className="inline-flex items-center gap-1.5 animate-in fade-in slide-in-from-right-2">
                          <Check size={14} className="text-green-500" />
                          <span className="text-[10px] font-bold text-green-500 uppercase tracking-tighter">Selecionado</span>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="py-20 text-center">
              <LayoutGrid size={48} className="mx-auto text-slate-800 mb-4 opacity-20" />
              <p className="text-slate-500 text-sm italic">Nenhum mercado encontrado para a busca</p>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between text-[10px] text-slate-600 font-medium px-1">
          <span>Total: {markets.length} mercados cadastrados</span>
          {selectedId && <span>Dica: Clique em "Editar" ou "Remover" no topo para gerenciar o item selecionado</span>}
        </div>

      </div>
    </Modal>
  )
}
