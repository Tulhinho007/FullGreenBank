import { useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { getRoleInfo } from '../../utils/formatters'
import {
  LayoutDashboard, TrendingUp, BarChart3,
  DollarSign, FileText, Settings, ShieldCheck, LogOut,
  ChevronDown, ChevronRight, Wallet, User, Bell, BookOpen,
  Target, Star, Briefcase
} from 'lucide-react'

interface NavItemProps {
  icon: React.ReactNode
  label: string
  to?: string
  children?: { label: string; to?: string; placeholder?: boolean }[]
  placeholder?: boolean
}

const NavItem = ({ icon, label, to, children, placeholder }: NavItemProps) => {
  const [open, setOpen] = useState(false)
  const location = useLocation()

  if (children) {
    const isChildActive = children.some(c => c.to && (location.pathname === c.to || location.pathname.startsWith(c.to + '/')))
    
    return (
      <div className="mb-1">
        <button
          onClick={() => setOpen(!open)}
          className={`sidebar-link w-full justify-between group ${isChildActive ? 'bg-sidebar-active/50 ring-1 ring-white/5 text-white' : ''}`}
        >
          <span className="flex items-center gap-3">
            <span className={`transition-colors ${isChildActive ? 'text-green-500' : 'text-slate-500 group-hover:text-slate-400'}`}>
              {icon}
            </span>
            <span className="text-[14px] font-semibold">{label}</span>
          </span>
          <span className="text-slate-500">
            {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        </button>
        {open && (
          <div className="ml-10 mr-4 mt-1 mb-2 flex flex-col gap-0.5 border-l border-surface-300 pl-3">
            {children.map((c, i) => {
              if (c.placeholder || !c.to) {
                return (
                  <div key={i} className="text-xs py-2 px-3 rounded-md flex justify-between items-center opacity-60 cursor-not-allowed select-none text-slate-500">
                    <span>{c.label}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500" title="Em breve"></span>
                  </div>
                )
              }
              return (
                <NavLink
                  key={c.to}
                  to={c.to}
                  className={({ isActive }) =>
                    `text-xs py-2 px-3 rounded-md transition-colors duration-150 flex justify-between items-center ${
                      isActive ? 'text-green-400 font-bold bg-green-500/5' : 'text-slate-200 hover:text-white hover:bg-surface-300/30'
                    }`
                  }
                >
                  {c.label}
                </NavLink>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  if (placeholder || !to) {
    return (
      <div className="sidebar-link opacity-60 cursor-not-allowed select-none group">
        <span className="text-slate-500 transition-colors flex items-center gap-3">
          {icon}
          <span>{label}</span>
        </span>
        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-slate-500" title="Em breve"></span>
      </div>
    )
  }

  return (
    <NavLink
      to={to}
      className={({ isActive }) => `sidebar-link group ${isActive ? 'active' : ''}`}
    >
      {({ isActive }) => (
        <>
          <span className={`transition-colors flex-shrink-0 ${isActive ? 'text-green-500' : 'text-slate-500 group-hover:text-slate-400'}`}>
            {icon}
          </span>
          <span className="truncate flex-1">{label}</span>
        </>
      )}
    </NavLink>
  )
}

const SectionLabel = ({ label }: { label: string }) => (
  <p className="text-[10px] font-semibold text-sidebar-text/60 uppercase tracking-widest px-4 mt-5 mb-2">
    {label}
  </p>
)

export const Sidebar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'MASTER'

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const initials = user?.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || 'U'

  return (
    <aside className="w-64 min-h-screen bg-sidebar-bg border-r border-sidebar-border flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-green-600 flex items-center justify-center logo-glow">
            <span className="text-white font-display font-bold text-sm">FG</span>
          </div>
          <div>
            <p className="font-display font-bold text-white text-sm leading-none">Full Green</p>
            <p className="text-green-500 text-[11px] font-medium tracking-wider mt-0.5">BANK</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 flex flex-col gap-0.5 overflow-y-auto custom-scrollbar">

        {/* ANÁLISE */}
        <SectionLabel label="Análise" />
        <NavItem icon={<LayoutDashboard size={16} />} label="Dashboard"       to="/dashboard" />
        
        {!(user?.role === 'MEMBRO' && !user?.isActive) ? (
          <>
            <NavItem icon={<TrendingUp size={16} />}      label="Dicas"           to="/tips" />
            <NavItem icon={<FileText size={16} />}        label="Relatórios"      children={[
              { label: 'Histórico de Contratos', to: '/gestao/historico' },
              { label: 'Performance', to: '/reports' }
            ]} />

            {/* GESTÃO */}
            <SectionLabel label="Gestão" />
            <NavItem icon={<Wallet size={16} />}       label="Bancas"            to="/gestao/banca" />
            <NavItem icon={<Briefcase size={16} />}    label="Investimentos"     to="/gestao/investimentos" />
            <NavItem icon={<Target size={16} />}       label="Tipsters"         to="/gestao/tipsters" />
            <NavItem icon={<BarChart3 size={16} />}    label="Análise de Valor" placeholder />
          </>
        ) : (
          <div className="px-4 py-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg mx-2 mt-4">
            <p className="text-[10px] text-yellow-500 font-bold uppercase mb-1">
              {user.paymentStatus === 'ATRASADO' ? 'Assinatura Atrasada' : 'Assinatura Expirada'}
            </p>
            <p className="text-[10px] text-slate-400 leading-tight">Sua conta está em modo de visualização. Regularize para acessar todas as ferramentas.</p>
          </div>
        )}

        {/* ADMINISTRAÇÃO */}
        {isAdmin && (
          <>
            <SectionLabel label="Administração" />
            <NavItem icon={<DollarSign size={16} />} label="Financeiro" children={[
              { label: 'Pagamentos', to: '/financeiro/pagamentos' },
              { label: 'Banca Gerenciada', to: '/financeiro/banca-gerenciada' },
              { label: 'Fluxo de Caixa', placeholder: true }
            ]} />
            <NavItem icon={<Settings size={16} />} label="Sistema" children={[
              { label: 'Usuários', to: '/admin/users' },
              { label: 'Cadastros', to: '/admin/cadastros' },
              { label: 'Solicitações (Aportes)', to: '/admin/solicitacoes' },
              { label: 'Suporte & Feedback', to: '/admin/support' },
              { label: 'Logs / Eventos', to: '/admin/log' }
            ]} />
          </>
        )}

        {/* OUTROS */}
        <SectionLabel label="Outros" />
        <NavItem icon={<Star size={16} />}        label="Nossos Planos"  to="/planos" />
        <NavItem icon={<BookOpen size={16} />}    label="Apostas Escola" placeholder />
        <NavItem icon={<Bell size={16} />}        label="Alertas"        placeholder />
        <NavItem icon={<ShieldCheck size={16} />} label="Regras"         placeholder />
        <NavItem icon={<Settings size={16} />}    label="Configurações"  to="/profile" />

      </nav>

      {/* User card */}
      <div className="px-3 pb-4 border-t border-sidebar-border pt-4">
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 ${
              isActive ? 'bg-sidebar-active' : 'hover:bg-sidebar-hover'
            }`
          }
        >
          <div className="w-8 h-8 rounded-full bg-green-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className={`text-[11px] ${getRoleInfo(user?.role).color}`}>
              {getRoleInfo(user?.role).label}
            </p>
          </div>
          <User size={14} className="text-sidebar-text shrink-0" />
        </NavLink>

        <button
          onClick={handleLogout}
          className="mt-2 sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-900/20"
        >
          <LogOut size={15} />
          Sair
        </button>
      </div>
    </aside>
  )
}
