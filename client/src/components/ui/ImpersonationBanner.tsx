import { useAuth } from '../../contexts/AuthContext'
import { Undo2 } from 'lucide-react'

export const ImpersonationBanner = () => {
  const { user, isImpersonating, stopImpersonating } = useAuth()

  if (!isImpersonating || !user) return null

  return (
    <div className="bg-[#fffbeb] border-b border-[#fef3c7] px-4 py-2 flex items-center justify-between z-[100] sticky top-0 animate-in slide-in-from-top duration-300">
      <div className="flex items-center gap-2 text-[#b45309] text-xs sm:text-sm font-medium">
        <span role="img" aria-label="eyes">👀</span>
        <span>Você está gerenciando a conta de</span>
        <strong className="text-[#92400e] font-bold underline decoration-orange-300 decoration-2 underline-offset-2">
          {user.email}
        </strong>
      </div>

      <button
        onClick={stopImpersonating}
        className="flex items-center gap-1.5 bg-[#f59e0b] hover:bg-[#d97706] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm hover:shadow-md active:scale-95 whitespace-nowrap"
      >
        <Undo2 size={14} />
        Voltar à minha conta
      </button>
    </div>
  )
}
