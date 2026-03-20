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

const sizeMap = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }

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
      <div className={`relative w-full ${sizeMap[size]} card border border-surface-400 shadow-2xl animate-in overflow-hidden`}>
        {/* Header */}
        {showHeader && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-surface-300">
            <h2 className="font-display font-semibold text-white">{title}</h2>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface-400 text-slate-400 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        )}
        {/* Body */}
        <div className={showHeader ? "px-6 py-5" : ""}>{children}</div>
      </div>
    </div>
  )
}
