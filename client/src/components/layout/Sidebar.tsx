import { useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { getRoleInfo } from '../../utils/formatters'
import {
  LayoutDashboard, TrendingUp, BarChart3,
  DollarSign, FileText, Settings, ShieldCheck, LogOut,
  ChevronDown, ChevronRight, Wallet, User, Bell, BookOpen,
  Target, Star, Briefcase, Lock as LockIcon,
  Eye, Edit3, Trash2
} from 'lucide-react'
import { SupportModal } from '../ui/SupportModal'

interface NavItemProps {
  icon: React.ReactNode
  label: string
  to?: string
  children?: { label: string; to?: string; placeholder?: boolean; isLocked?: boolean; permissionKey?: string }[]
  placeholder?: boolean
  isLocked?: boolean
  onLockedClick?: () => void
  permission?: { canView: boolean; canEdit: boolean; canDelete: boolean }
  getPermission?: (key: string) => { canView: boolean; canEdit: boolean; canDelete: boolean } | undefined
}

const NavItem = ({ icon, label, to, children, placeholder, isLocked, onLockedClick, permission, getPermission }: NavItemProps) => {
  const [open, setOpen] = useState(false)
  const location = useLocation()

  const handleClick = (e: React.MouseEvent) => {
    if (isLocked && onLockedClick) {
      e.preventDefault()
      onLockedClick()
    }
  }

  const renderPermissionIcon = (p?: { canView: boolean; canEdit: boolean; canDelete: boolean }) => {
    if (!p) return null
    if (p.canDelete) return <Trash2 size={12} className="text-red-500/70" />
    if (p.canEdit)   return <Edit3 size={12} className="text-blue-500/70" />
    if (p.canView)   return <Eye size={12} className="text-emerald-500/70" />
    return null
  }

  if (children) {
    const isChildActive = children.some(c => c.to && (location.pathname === c.to || location.pathname.startsWith(c.to + '/')))
    
    return (
      <div className="mb-1">
        <button
          onClick={() => setOpen(!open)}
          className={`sidebar-link w-full justify-between group ${isChildActive ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : ''}`}
        >
          <span className="flex items-center gap-3">
            <span className={`transition-colors ${isChildActive ? 'text-emerald-500' : 'text-slate-400 group-hover:text-slate-600'}`}>
              {icon}
            </span>
            <span className="text-[15px] font-bold tracking-wide">{label}</span>
          </span>
          <span className="flex items-center gap-2">
            {renderPermissionIcon(permission)}
            {isLocked && <LockIcon size={12} className="text-amber-500" />}
            <span className="text-slate-400">
              {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </span>
          </span>
        </button>
        {open && (
          <div className="ml-10 mr-4 mt-1 mb-2 flex flex-col gap-0.5 border-l border-slate-100 pl-3">
            {children.map((c, i) => {
              if (c.placeholder || !c.to) {
                return (
                  <div key={i} className="text-[13px] py-2.5 px-3 rounded-md flex justify-between items-center opacity-60 cursor-not-allowed select-none text-slate-400">
                    <span>{c.label}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300" title="Em breve"></span>
                  </div>
                )
              }
              const childLocked = c.isLocked || isLocked
              const childPerm = c.permissionKey && getPermission ? getPermission(c.permissionKey) : undefined
              
              return (
                <NavLink
                  key={c.to}
                  to={childLocked ? '#' : c.to}
                  onClick={childLocked ? handleClick : undefined}
                  className={({ isActive }) =>
                    `text-[13px] py-2 px-3 rounded-md transition-colors duration-150 flex justify-between items-center font-bold ${
                      isActive && !childLocked ? 'text-emerald-600 bg-emerald-50 shadow-sm border border-emerald-100' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                    } ${childLocked ? 'opacity-70' : ''}`
                  }
                >
                  <span className="flex items-center gap-2">
                    {c.label}
                    {childLocked && <LockIcon size={10} className="text-amber-500/70" />}
                  </span>
                  {renderPermissionIcon(childPerm)}
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
          <span className="text-[15px] tracking-wide">{label}</span>
        </span>
        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-slate-500" title="Em breve"></span>
      </div>
    )
  }

  return (
    <NavLink
      to={isLocked ? '#' : to}
      onClick={handleClick}
      className={({ isActive }) => `sidebar-link group font-bold ${isActive && !isLocked ? 'active text-emerald-600 bg-emerald-50 border border-emerald-100 shadow-sm' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'} ${isLocked ? 'opacity-70' : ''}`}
    >
      {({ isActive }) => (
        <>
          <span className={`transition-colors flex-shrink-0 ${isActive && !isLocked ? 'text-emerald-500' : 'text-slate-400 group-hover:text-slate-600'}`}>
            {icon}
          </span>
          <span className="truncate flex-1 text-[15px] tracking-wide">{label}</span>
          <div className="flex items-center gap-1.5 ml-auto">
            {renderPermissionIcon(permission)}
            {isLocked && <LockIcon size={14} className="text-amber-500 shrink-0" />}
          </div>
        </>
      )}
    </NavLink>
  )
}

const SectionLabel = ({ label }: { label: string }) => (
  <p className="text-[11px] font-bold text-sidebar-text/60 uppercase tracking-widest px-4 mt-5 mb-2">
    {label}
  </p>
)

export const Sidebar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isSupportOpen, setIsSupportOpen] = useState(false)
  
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'MASTER'
  const isStarter = user?.role === 'MEMBRO' && (!user?.plan || user?.plan === 'STARTER')
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  const handleLockedClick = () => {
    setShowUpgradeModal(true)
  }

  const getPerm = (key: string) => {
    const p = user?.permissions?.find(x => x.pageName === key)
    return p ? { canView: p.canView, canEdit: p.canEdit, canDelete: p.canDelete } : undefined
  }

  const isLockedItem = (key: string, defaultLocked: boolean) => {
    const p = getPerm(key)
    if (p?.canView) return false // Explicit permission overrides plan lock
    return defaultLocked
  }

  const onSignOut = () => {
    logout()
    navigate('/login')
  }

  const initials = user?.name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || 'U'

  return (
    <aside className="w-64 min-h-screen bg-sidebar-bg border-r border-sidebar-border flex flex-col shrink-0 print:hidden">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-sidebar-border flex flex-col items-center justify-center text-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <span className="text-white font-display font-bold text-lg">FG</span>
        </div>
        <div>
          <p className="font-display font-bold text-slate-800 text-lg leading-none tracking-wide">Full Green</p>
          <p className="text-emerald-600 text-[10px] font-black tracking-[0.2em] mt-2 uppercase">Bank</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 flex flex-col gap-0.5 overflow-y-auto custom-scrollbar">

        {/* ANÁLISE */}
        <SectionLabel label="Análise" />
        <NavItem 
          icon={<LayoutDashboard size={16} />} 
          label="Dashboard" 
          to="/dashboard" 
          onLockedClick={handleLockedClick}
          permission={getPerm('dashboard')}
          getPermission={getPerm}
        />
        
        <NavItem 
          icon={<TrendingUp size={16} />} 
          label="Dicas" 
          to="/tips" 
          onLockedClick={handleLockedClick}
          permission={getPerm('tips')}
          getPermission={getPerm}
        />
        <NavItem 
          icon={<Target size={16} />} 
          label="Tipsters" 
          to="/gestao/tipsters" 
          isLocked={isLockedItem('tipsters', isStarter)}
          onLockedClick={handleLockedClick}
          permission={getPerm('tipsters')}
          getPermission={getPerm}
        />
        <NavItem 
          icon={<FileText size={16} />} 
          label="Relatórios" 
          isLocked={isLockedItem('reports', isStarter)}
          onLockedClick={handleLockedClick}
          permission={getPerm('reports')}
          getPermission={getPerm}
          children={[
            { label: 'Histórico de Dicas', to: '/reports/tips', permissionKey: 'reports-tips' },
            { label: 'Performance', to: '/reports', permissionKey: 'reports' }
          ]} 
        />

        {/* GESTÃO */}
        <SectionLabel label="Gestão" />
        <NavItem 
          icon={<Wallet size={16} />} 
          label="Bancas" 
          to="/gestao/banca" 
          onLockedClick={handleLockedClick}
          permission={getPerm('gestao-banca')}
          getPermission={getPerm}
        />
        <NavItem 
          icon={<Briefcase size={16} />} 
          label="Investimentos" 
          to="/gestao/investimentos" 
          isLocked={isLockedItem('investimentos', isStarter)}
          onLockedClick={handleLockedClick}
          permission={getPerm('investimentos')}
          getPermission={getPerm}
        />
        <NavItem 
          icon={<TrendingUp size={16} />} 
          label="Operacional" 
          onLockedClick={handleLockedClick}
          getPermission={getPerm}
          children={[
            { label: 'Alavancagem', to: '/gestao/alavancagem', isLocked: isLockedItem('alavancagem', isStarter), permissionKey: 'alavancagem' },
            { label: 'Calculadora', to: '/gestao/calculadora', permissionKey: 'calculadora' },
            { label: 'Dicas de Gestão', to: '/gestao/dicas-gestao', isLocked: isLockedItem('dicas-gestao', isStarter), permissionKey: 'dicas-gestao' }
          ]} 
        />

        <NavItem 
          icon={<BarChart3 size={16} />} 
          label="Análise de Valor" 
          isLocked={isStarter}
          placeholder 
          onLockedClick={handleLockedClick}
          getPermission={getPerm}
        />

        {user?.role === 'MEMBRO' && !user?.isActive && (
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
            <NavItem 
              icon={<DollarSign size={16} />} 
              label="Financeiro" 
              permission={getPerm('financeiro')} 
              getPermission={getPerm}
              children={[
                { label: 'Assinaturas', to: '/financeiro/pagamentos', permissionKey: 'pagamentos' },

                { label: 'Histórico de Contratos', to: '/gestao/historico', permissionKey: 'historico' },

                { label: 'Transações', to: '/financeiro/transacoes', permissionKey: 'transacoes' },
                { label: 'Fluxo de Caixa', placeholder: true }
              ]} 
            />
            <NavItem 
              icon={<Settings size={16} />} 
              label="Sistema" 
              permission={getPerm('admin')} 
              getPermission={getPerm}
              children={[
                { label: 'Usuários', to: '/admin/users', permissionKey: 'admin-users' },
                { label: 'Cadastros', to: '/admin/cadastros', permissionKey: 'admin-cadastros' },
                { label: 'Solicitações (Aportes)', to: '/admin/solicitacoes', permissionKey: 'admin-solicitacoes' },
                { label: 'Suporte & Feedback', to: '/admin/support', permissionKey: 'admin-support' },
                { label: 'Logs / Eventos', to: '/admin/log', permissionKey: 'admin-log' },
                { label: 'Controle de Acesso', to: '/admin/permissoes', permissionKey: 'admin-permissoes' }
              ]} 
            />
          </>
        )}

        {/* OUTROS */}
        <SectionLabel label="Outros" />
        <NavItem icon={<Star size={16} />}        label="Nossos Planos"  to="/planos" />
        <div onClick={() => setIsSupportOpen(true)} className="cursor-pointer">
          <NavItem icon={<BookOpen size={16} />}    label="Suporte Comum" />
        </div>
        <NavItem 
          icon={<Bell size={16} />}        
          label="Alertas"        
          placeholder 
          isLocked={isStarter}
          onLockedClick={handleLockedClick}
          getPermission={getPerm}
        />
        <NavItem 
          icon={<ShieldCheck size={16} />} 
          label="Regras"         
          placeholder 
          isLocked={isStarter}
          onLockedClick={handleLockedClick}
          getPermission={getPerm}
        />
        <NavItem icon={<Settings size={16} />}    label="Configurações"  to="/profile" getPermission={getPerm} />

      </nav>

      {/* User card */}
      <div className="px-3 pb-4 border-t border-sidebar-border pt-4">
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 font-bold ${
              isActive ? 'bg-emerald-50 border border-emerald-100' : 'hover:bg-slate-50 border border-transparent'
            }`
          }
        >
          <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-xs font-black text-white shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-800 truncate">{user?.name}</p>
            <p className={`text-[10px] font-black uppercase tracking-tighter ${getRoleInfo(user?.role).color}`}>
              {getRoleInfo(user?.role).label}
            </p>
          </div>
          <User size={14} className="text-slate-400 shrink-0" />
        </NavLink>

        <button
          onClick={onSignOut}
          className="mt-2 sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-900/20"
        >
          <LogOut size={15} />
          Sair
        </button>
      </div>

      <SupportModal isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />

      {/* MODAL UPGRADE PRO (Locked Content) */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white border border-slate-100 w-full max-w-sm rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-6 border border-amber-100">
                <ShieldCheck size={32} className="text-amber-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Ops! Conteúdo Fechado</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-8 font-bold">
                Essa ferramenta faz parte do <span className="text-amber-600 font-black uppercase">plano PRO</span>. <br />
                Sua permissão atual não permite o acesso.<br />
                <span className="text-amber-500 font-black mt-2 inline-block">Assine o PRO e desbloqueie tudo!</span>
              </p>
              <div className="flex flex-col w-full gap-3">
                <button 
                  onClick={() => {
                    setShowUpgradeModal(false)
                    navigate('/planos')
                  }} 
                  className="w-full py-4 rounded-[1.5rem] bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest text-[10px] transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
                >
                  Ver Planos PRO
                </button>
                <button onClick={() => setShowUpgradeModal(false)} className="w-full py-4 rounded-[1.5rem] bg-slate-50 hover:bg-slate-100 text-slate-400 font-black uppercase tracking-widest text-[10px] transition-all">
                  Voltar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
