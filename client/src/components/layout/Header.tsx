import { useAuth } from '../../contexts/AuthContext'
import { Bell, Search } from 'lucide-react'
import { useLocation } from 'react-router-dom'

const routeTitles: Record<string, string> = {
  '/dashboard':        'Dashboard',
  '/tips':             'Dicas',
  '/profile':          'Meu Perfil',
  '/admin/users':      'Usuários',
  '/admin/tips/new':   'Nova Dica',
  '/admin/log':        'Log do Sistema',
  '/admin/permissions':'Controle de Acesso',
}

const greetings = () => {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

export const Header = () => {
  const { user } = useAuth()
  const location = useLocation()
  
  const title = routeTitles[location.pathname] || 'Full Green Bank'
  const firstName = user?.name?.split(' ')[0] || ''

  return (
    <header
      className="h-16 flex items-center justify-between px-6 shrink-0 print:hidden transition-colors duration-300"
      style={{
        background: '#f8fafc',
        boxShadow: '0 4px 12px rgba(203,213,225,0.5), 0 -1px 0 rgba(255,255,255,0.8)',
      }}
    >
      {/* Left - greeting */}
      <div>
        <h1 className="font-display font-bold text-slate-800 text-base">{title}</h1>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">
          {greetings()}, <span className="text-emerald-600 font-black">{firstName}</span>! 
          {' '}<span className="text-slate-300 ml-2">— {'Sugestão: analise suas entradas hoje'} 📊</span>
        </p>
      </div>

      {/* Right - actions */}
      <div className="flex items-center gap-3">
        {/* Search — nm-inset */}
        <div
          className="hidden md:flex items-center gap-2 rounded-xl px-4 py-2 text-[11px] text-slate-400 font-bold w-52 transition-all"
          style={{
            background: '#f8fafc',
            boxShadow: 'inset 3px 3px 7px rgba(209,213,219,0.7), inset -3px -3px 7px rgba(255,255,255,0.9)'
          }}
        >
          <Search size={14} className="text-slate-300" />
          <span>Pesquisar...</span>
        </div>

        {/* Notifications — nm-flat */}
        <button
          className="relative w-10 h-10 flex items-center justify-center rounded-xl transition-all nm-flat hover:text-emerald-500"
        >
          <Bell size={16} className="text-slate-400" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-emerald-500 rounded-full border-2 border-slate-50"></span>
        </button>

        {/* Role badge — nm-flat */}
        <div
          className="hidden sm:flex items-center gap-2 rounded-xl px-4 py-1.5 nm-flat"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">{user?.role}</span>
        </div>
      </div>
    </header>
  )
}

