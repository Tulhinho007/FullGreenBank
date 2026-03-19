import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { Bell, Search, Sun, Moon } from 'lucide-react'
import { useLocation } from 'react-router-dom'

const routeTitles: Record<string, string> = {
  '/dashboard':        'Dashboard',
  '/tips':             'Dicas',
  '/profile':          'Meu Perfil',
  '/admin/users':      'Usuários',
  '/admin/tips/new':   'Nova Dica',
  '/admin/log':        'Log do Sistema',
}

const greetings = (t: any) => {
  const h = new Date().getHours()
  if (h < 12) return 'greeting_morning'
  if (h < 18) return 'greeting_afternoon'
  return 'greeting_evening'
}

export const Header = () => {
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()const location = useLocation()
  
  const title = t(routeTitles[location.pathname]?.toLowerCase() || 'dashboard' as any) || routeTitles[location.pathname] || 'Full Green Bank'
  const firstName = user?.name.split(' ')[0] || ''

  return (
    <header className="h-16 bg-surface-200 border-b border-surface-300 flex items-center justify-between px-6 shrink-0">
      {/* Left - greeting */}
      <div>
        <h1 className="font-display font-semibold text-white text-base">{title}</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          {greetings(t)}, <span className="text-green-400 font-medium">{firstName}</span>! 
          {' '}<span className="text-slate-500">— {'Sugestão do sistema: analise suas entradas hoje'} 📊</span>
        </p>
      </div>

      {/* Right - actions */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 bg-surface-300 border border-surface-400 rounded-lg px-3 py-2 text-sm text-slate-500 w-52">
          <Search size={14} />
          <span>{'search'}</span>
        </div>

        {/* Theme toggle */}
        <button
          onClick={() => toggleTheme()}
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-surface-300 border border-surface-400 hover:border-green-700 transition-colors"
          title={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
        >
          {theme === 'dark'
            ? <Sun size={16} className="text-yellow-400" />
            : <Moon size={16} className="text-slate-400" />
          }
        </button>

        {/* Notifications */}
        <button className="relative w-9 h-9 flex items-center justify-center rounded-lg bg-surface-300 border border-surface-400 hover:border-green-700 transition-colors">
          <Bell size={16} className="text-slate-400" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-green-500 rounded-full"></span>
        </button>

        {/* Role badge */}
        <div className="hidden sm:flex items-center gap-2 bg-surface-300 border border-surface-400 rounded-lg px-3 py-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          <span className="text-xs font-medium text-slate-300">{user?.role}</span>
        </div>
      </div>
    </header>
  )
}
