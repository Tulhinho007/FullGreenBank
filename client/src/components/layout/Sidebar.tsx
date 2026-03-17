import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { roleLabelMap } from '../../utils/formatters'
import {
  LayoutDashboard, CalendarDays, TrendingUp, History, BarChart3,
  DollarSign, FileText, Settings, Users, ShieldCheck, LogOut,
  ChevronDown, ChevronRight, Wallet, User, Trophy, Bell, BookOpen,
  ClipboardList, PlusCircle, ScrollText, CreditCard, Briefcase,
} from 'lucide-react'

interface NavItemProps {
  icon: React.ReactNode
  label: string
  to?: string
  children?: { label: string; to: string }[]
  placeholder?: boolean
}

const NavItem = ({ icon, label, to, children, placeholder }: NavItemProps) => {
  const [open, setOpen] = useState(false)

  if (children) {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className="sidebar-link w-full justify-between"
        >
          <span className="flex items-center gap-3">
            <span className="text-green-500/80">{icon}</span>
            {label}
          </span>
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        {open && (
          <div className="ml-9 mt-1 flex flex-col gap-0.5 border-l border-surface-300 pl-3">
            {children.map((c) => (
              <NavLink
                key={c.to}
                to={c.to}
                className={({ isActive }) =>
                  `text-xs py-2 px-2 rounded-md transition-colors duration-150 ${
                    isActive ? 'text-green-400 font-semibold' : 'text-sidebar-text hover:text-white'
                  }`
                }
              >
                {c.label}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (placeholder || !to) {
    return (
      <div className="sidebar-link opacity-50 cursor-not-allowed select-none">
        <span className="text-green-500/60">{icon}</span>
        <span>{label}</span>
        <span className="ml-auto text-[10px] bg-surface-400 px-1.5 py-0.5 rounded text-slate-500">Em breve</span>
      </div>
    )
  }

  return (
    <NavLink
      to={to}
      className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
    >
      <span className="text-green-500/80">{icon}</span>
      {label}
    </NavLink>
  )
}

const SectionLabel = ({ label }: { label: string }) => (
  <p className="text-[10px] font-semibold text-sidebar-text/60 uppercase tracking-widest px-4 mt-4 mb-1">
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
    <aside className="w-64 min-h-screen bg-sidebar-bg border-r border-sidebar-border flex flex-col">
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
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">

        {/* 1. PRINCIPAL */}
        <SectionLabel label="Principal" />
        <NavItem icon={<LayoutDashboard size={16} />} label="Dashboard" to="/dashboard" />
        <NavItem icon={<TrendingUp size={16} />}      label="Dicas"      to="/tips" />

        {/* 2. ADMIN — só para admin/master */}
        {isAdmin && (
          <>
            <SectionLabel label="Admin" />
            <NavItem icon={<Users size={16} />}        label="Usuários"   to="/admin/users" />
            <NavItem icon={<ClipboardList size={16} />} label="Cadastros" to="/admin/cadastros" />
            <NavItem icon={<PlusCircle size={16} />}   label="Criar Dica" to="/admin/tips/new" />
            <NavItem icon={<ScrollText size={16} />}   label="Log do Sistema" to="/admin/log" />
          </>
        )}

        {/* 3. GESTÃO */}
        <SectionLabel label="Gestão" />
        <NavItem icon={<Wallet size={16} />}       label="Banca"            placeholder />
        <NavItem icon={<CalendarDays size={16} />} label="Calendário"       placeholder />
        <NavItem icon={<BarChart3 size={16} />}    label="Análise de Valor" placeholder />
        <NavItem icon={<History size={16} />}      label="Histórico"        placeholder />
        <NavItem icon={<Trophy size={16} />}       label="Rankings"         placeholder />

        {/* 4. FINANCEIRO */}
        <SectionLabel label="Financeiro" />
        {isAdmin && (
          <>
            <NavItem icon={<CreditCard size={16} />}  label="Pagamentos"       to="/financeiro/pagamentos" />
            <NavItem icon={<Briefcase size={16} />}   label="Banca Gerenciada" to="/financeiro/banca-gerenciada" />
          </>
        )}
        <NavItem icon={<DollarSign size={16} />} label="Fluxo de Caixa" placeholder />
        <NavItem icon={<FileText size={16} />}   label="Relatórios"     placeholder />

        {/* 5. OUTROS */}
        <SectionLabel label="Outros" />
        <NavItem icon={<BookOpen size={16} />}    label="Apostas Escola" placeholder />
        <NavItem icon={<Bell size={16} />}        label="Alertas"        placeholder />
        <NavItem icon={<ShieldCheck size={16} />} label="Regras"         placeholder />
        <NavItem icon={<Settings size={16} />}    label="Configurações"  placeholder />

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
            <p className={`text-[11px] ${roleLabelMap[user?.role || 'MEMBRO']?.color}`}>
              {roleLabelMap[user?.role || 'MEMBRO']?.label}
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
