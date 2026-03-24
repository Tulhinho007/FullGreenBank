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
      <div className="flex flex-col bg-white min-h-[500px]">
        
        {/* Cabeçalho Customizado */}
        <div className="flex items-center justify-between p-6 border-b border-slate-50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100">
              <ClipboardList size={22} className="text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 leading-tight">Mercados de Apostas</h3>
              <p className="text-sm text-slate-400 font-bold">{markets.length} mercados cadastrados</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6 flex-1">
          
          {/* Toolbar de Ações (Clone do Print) */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {!readOnly && (
                <>
                  <button 
                    onClick={() => { setIsAdding(true); setEditName(''); setEditSport(sports[0]?.slug || ''); }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-emerald-100 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all font-bold uppercase tracking-widest text-[10px] shadow-sm"
                  >
                    <Plus size={14} /> Adicionar
                  </button>
                  
                  <button 
                    onClick={startEdit}
                    disabled={!selectedId}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all font-bold uppercase tracking-widest text-[10px] shadow-sm ${
                      selectedId 
                        ? 'border-blue-100 bg-blue-50 text-blue-600 hover:bg-blue-100' 
                        : 'border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed opacity-50'
                    }`}
                  >
                    <Edit2 size={14} /> Editar
                  </button>

                  <button 
                    onClick={handleDelete}
                    disabled={!selectedId}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all font-bold uppercase tracking-widest text-[10px] shadow-sm ${
                      selectedId 
                        ? 'border-rose-100 bg-rose-50 text-rose-600 hover:bg-rose-100' 
                        : 'border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed opacity-50'
                    }`}
                  >
                    <Trash2 size={14} /> Remover
                  </button>
                </>
              )}
            </div>

            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text"
                placeholder="Pesquisar mercado..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-xs font-bold text-slate-700 outline-none focus:border-emerald-500/50 transition-colors"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Form Overlay Style */}
          {(isAdding || isEditing) && (
            <div className="p-4 rounded-xl bg-slate-50 border border-emerald-100 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] uppercase font-black tracking-widest text-slate-400">
                  {isAdding ? 'Novo Mercado' : 'Editar Mercado'}
                </h4>
                <button 
                  onClick={() => { setIsAdding(false); setIsEditing(false); }}
                  className="p-1 hover:bg-white rounded text-slate-400 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Esporte</label>
                  <select 
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 font-bold focus:outline-none focus:border-emerald-500"
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
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 font-bold focus:outline-none focus:border-emerald-500"
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
                  className="px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={isEditing ? handleUpdate : handleAdd}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
                >
                  <Check size={14} /> {isEditing ? 'Salvar Alterações' : 'Salvar Mercado'}
                </button>
              </div>
            </div>
          )}

          {/* Tabela de Mercados */}
          <div className="overflow-auto max-h-[400px] custom-scrollbar rounded-lg border border-slate-50 shadow-inner">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white z-10 shadow-sm">
                <tr className="border-b border-slate-50">
                  <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Esporte</th>
                  <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mercado</th>
                  <th className="px-5 py-3 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((m, i) => {
                  const sport = sports.find(s => s.slug === m.sportSlug)
                  const isSelected = selectedId === m.id
                  return (
                    <tr 
                      key={m.id} 
                      onClick={() => setSelectedId(isSelected ? null : m.id)}
                      className={`hover:bg-slate-50 transition-colors cursor-pointer ${isSelected ? 'bg-emerald-50/50' : i % 2 === 0 ? '' : 'bg-slate-50/30'}`}
                    >
                      <td className="px-5 py-3 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200 uppercase tracking-tighter shadow-sm">
                            {sport?.name || m.sportSlug}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="font-bold text-slate-800 text-sm">{m.name}</span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        {isSelected && <Check size={14} className="text-emerald-500 inline-block ml-auto" />}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className="py-20 text-center flex flex-col items-center gap-3">
                <LayoutGrid size={40} className="text-slate-100" />
                <p className="text-slate-400 text-xs italic font-bold">Nenhum mercado encontrado</p>
              </div>
            )}
          </div>
        </div>

        {/* Rodapé */}
        <div className="p-6 border-t border-slate-50 bg-slate-50/50">
          <button 
            onClick={onClose}
            className="w-full py-3 bg-white hover:bg-slate-50 text-slate-500 font-black uppercase tracking-widest text-[10px] rounded-xl transition-colors shadow-sm border border-slate-200"
          >
            Fechar
          </button>
        </div>

      </div>
    </Modal>
  )
}
