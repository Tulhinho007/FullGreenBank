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
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-[6px]"
        onClick={onClose}
      />
      {/* Modal — neumorfic surface */}
      <div className={`nm-modal relative w-full ${sizeMap[size]} rounded-[2.5rem] animate-in fade-in slide-in-from-bottom-6 duration-500 overflow-hidden`}>
        {/* Header */}
        {showHeader && (
          <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100/60">
            <h2 className="font-display font-black text-slate-800 text-lg tracking-tight">{title}</h2>
            <button
              onClick={onClose}
              className="nm-icon w-10 h-10 flex items-center justify-center rounded-2xl text-slate-400 hover:text-rose-500 transition-all active:scale-90"
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

