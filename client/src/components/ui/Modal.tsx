import { ReactNode, useEffect } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg'
  showHeader?: boolean
}

const sizeMap = { sm: 'max-w-sm', md: 'max-w-xl', lg: 'max-w-3xl' }

export const Modal = ({ isOpen, onClose, title = '', children, size = 'md', showHeader = true }: ModalProps) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (isOpen) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Modal */}
      <div className={`relative w-full ${sizeMap[size]} bg-white border border-slate-100 rounded-[2.5rem] shadow-2xl animate-in fade-in slide-in-from-bottom-6 duration-500 overflow-hidden`}>
        {/* Header */}
        {showHeader && (
          <div className="flex items-center justify-between px-8 py-6 border-b border-slate-50 bg-slate-50/20">
            <h2 className="font-display font-black text-slate-800 text-lg tracking-tight">{title}</h2>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white border border-slate-100 hover:border-rose-200 text-slate-400 hover:text-rose-500 transition-all active:scale-90"
            >
              <X size={20} />
            </button>
          </div>
        )}
        {/* Body */}
        <div className={showHeader ? "px-10 py-8" : ""}>{children}</div>
      </div>
    </div>
  )
}
