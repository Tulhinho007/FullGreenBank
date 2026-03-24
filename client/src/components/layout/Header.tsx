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
    <header className="h-16 bg-white dark:bg-surface-200 border-b border-slate-200 dark:border-surface-300 flex items-center justify-between px-6 shrink-0 print:hidden transition-colors duration-300">
      {/* Left - greeting */}
      <div>
        <h1 className="font-display font-semibold text-slate-900 dark:text-white text-base">{title}</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {greetings()}, <span className="text-green-600 dark:text-green-400 font-medium">{firstName}</span>! 
          {' '}<span className="text-slate-400 dark:text-slate-500">— {'Sugestão: analise suas entradas hoje'} 📊</span>
        </p>
      </div>

      {/* Right - actions */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 bg-slate-50 dark:bg-surface-300 border border-slate-200 dark:border-surface-400 rounded-lg px-3 py-2 text-sm text-slate-400 w-52">
          <Search size={14} />
          <span>Pesquisar...</span>
        </div>



        {/* Notifications */}
        <button className="relative w-9 h-9 flex items-center justify-center rounded-lg bg-surface-300 border border-surface-400 hover:border-green-500 transition-colors shadow-sm">
          <Bell size={16} className="text-slate-500" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-green-500 rounded-full border-2 border-surface-300"></span>
        </button>

        {/* Role badge */}
        <div className="hidden sm:flex items-center gap-2 bg-surface-300 border border-surface-400 rounded-lg px-3 py-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          <span className="text-xs font-bold text-slate-300">{user?.role}</span>
        </div>
      </div>
    </header>
  )
}
