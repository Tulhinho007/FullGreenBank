import { useState, useEffect } from 'react'
import { Plus, Search, Trash2, Edit2, Check, LayoutGrid, X, ClipboardList } from 'lucide-react'
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
  ).sort((a, b) => {
    const sA = sports.find(s => s.slug === a.sportSlug)?.name || a.sportSlug;
    const sB = sports.find(s => s.slug === b.sportSlug)?.name || b.sportSlug;
    return sA.localeCompare(sB) || a.name.localeCompare(b.name);
  })

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
    <Modal isOpen={isOpen} onClose={onClose} showHeader={false} size="lg">
      <div className="flex flex-col bg-white dark:bg-surface-200 min-h-[500px]">
        
        {/* Cabeçalho Customizado (Clone do Print) */}
        <div className="flex items-center justify-between p-6 border-b border-slate-50 dark:border-surface-300">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center border border-green-100 dark:border-green-800">
              <ClipboardList size={22} className="text-green-500 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">Mercados de Apostas</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{markets.length} mercados cadastrados</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-surface-300 rounded-full text-slate-400 dark:text-slate-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6 flex-1">
          
          {/* Toolbar de Ações (Clone do Print) */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {!readOnly && (
                <>
                  <button 
                    onClick={() => { setIsAdding(true); setEditName(''); setEditSport(sports[0]?.slug || ''); }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-green-200 dark:border-green-900/40 bg-white dark:bg-surface-200 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all font-semibold text-sm shadow-sm"
                  >
                    <Plus size={16} /> Adicionar
                  </button>
                  
                  <button 
                    onClick={startEdit}
                    disabled={!selectedId}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all font-semibold text-sm shadow-sm ${
                      selectedId 
                        ? 'border-blue-200 dark:border-blue-900/40 bg-white dark:bg-surface-200 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20' 
                        : 'border-slate-100 dark:border-surface-300 bg-slate-50 dark:bg-surface-300 text-slate-400 cursor-not-allowed opacity-50'
                    }`}
                  >
                    <Edit2 size={16} /> Editar
                  </button>

                  <button 
                    onClick={handleDelete}
                    disabled={!selectedId}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all font-semibold text-sm shadow-sm ${
                      selectedId 
                        ? 'border-red-200 dark:border-red-900/40 bg-white dark:bg-surface-200 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20' 
                        : 'border-slate-100 dark:border-surface-300 bg-slate-50 dark:bg-surface-300 text-slate-400 cursor-not-allowed opacity-50'
                    }`}
                  >
                    <Trash2 size={16} /> Remover
                  </button>
                </>
              )}
            </div>

            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text"
                placeholder="Pesquisar..."
                className="w-full bg-slate-50 dark:bg-surface-300 border border-slate-200 dark:border-surface-400 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-700 dark:text-white focus:outline-none focus:border-green-500/50 transition-colors"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Form Overlay Style */}
          {(isAdding || isEditing) && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-surface-300 border border-green-200 dark:border-green-900/30 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                  {isAdding ? 'Novo Mercado' : 'Editar Mercado'}
                </h4>
                <button 
                  onClick={() => { setIsAdding(false); setIsEditing(false); }}
                  className="p-1 hover:bg-slate-200 dark:hover:bg-surface-400 rounded text-slate-400"
                >
                  <X size={16} />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Esporte</label>
                  <select 
                    className="w-full bg-white dark:bg-surface-200 border border-slate-200 dark:border-surface-400 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-white focus:outline-none focus:border-green-500"
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
                    className="w-full bg-white dark:bg-surface-200 border border-slate-200 dark:border-surface-400 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-white focus:outline-none focus:border-green-500"
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
                  className="px-4 py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  Cancelar
                </button>
                <button 
                  onClick={isEditing ? handleUpdate : handleAdd}
                  className="bg-green-600 hover:bg-green-500 text-white px-5 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <Check size={14} /> {isEditing ? 'Salvar Alterações' : 'Salvar Mercado'}
                </button>
              </div>
            </div>
          )}

          {/* Tabela de Mercados (Clone do Print) */}
          <div className="overflow-auto max-h-[400px] custom-scrollbar rounded-lg border border-slate-50 dark:border-surface-400">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white dark:bg-surface-200 z-10">
                <tr className="border-b border-slate-50 dark:border-surface-300">
                  <th className="px-5 py-3 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Esporte</th>
                  <th className="px-5 py-3 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Mercado</th>
                  <th className="px-5 py-3 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-surface-300/30">
                {filtered.map((m, i) => {
                  const sport = sports.find(s => s.slug === m.sportSlug)
                  const isSelected = selectedId === m.id
                  return (
                    <tr 
                      key={m.id} 
                      onClick={() => setSelectedId(isSelected ? null : m.id)}
                      className={`hover:bg-slate-50 dark:hover:bg-surface-300/20 transition-colors cursor-pointer ${isSelected ? 'bg-slate-50 dark:bg-surface-300/40' : i % 2 === 0 ? '' : 'bg-slate-50/30 dark:bg-surface-300/10'}`}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold bg-slate-100 dark:bg-surface-300 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded border border-slate-200 dark:border-surface-400 uppercase tracking-tight">
                            {sport?.name || m.sportSlug}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="font-semibold text-slate-800 dark:text-white text-sm">{m.name}</span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        {isSelected && <Check size={14} className="text-green-500 inline-block ml-auto" />}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className="py-20 text-center flex flex-col items-center gap-3">
                <LayoutGrid size={40} className="text-slate-200 dark:text-slate-700" />
                <p className="text-slate-500 dark:text-slate-600 text-sm italic font-medium">Nenhum mercado encontrado</p>
              </div>
            )}
          </div>
        </div>

        {/* Rodapé (Clone do Print) */}
        <div className="p-6 border-t border-slate-100 dark:border-surface-300 bg-slate-50/30 dark:bg-surface-300/10">
          <button 
            onClick={onClose}
            className="w-full py-3 bg-white hover:bg-slate-50 dark:bg-surface-300 dark:hover:bg-surface-400 text-slate-700 dark:text-white font-bold rounded-xl transition-colors shadow-sm border border-slate-200 dark:border-surface-400"
          >
            Fechar
          </button>
        </div>

      </div>
    </Modal>
  )
}
